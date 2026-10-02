import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, FindOptionsWhere, ILike, Raw, Repository } from 'typeorm';
import { Paged, pageOpts } from '../../common/pagination.js';
import { Notification } from '../notifications/notification.entity.js';
import { User } from '../users/user.entity.js';
import { AdminNotificationDto, AdminUsersQuery, CreateAdminUserDto, UpdateAdminUserDto } from './dto/admin.dto.js';

const withCustomer = (roles?: string[]) => [...new Set(['customer', ...(roles ?? [])])];

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Notification) private readonly notifications: Repository<Notification>,
    private readonly db: DataSource,
  ) {}

  private userDto(u: User, orderCount = 0) {
    const { passwordHash, otpCode, otpExpiresAt, otpAttempts, otpSentAt, tokenVersion, fcmToken, ...safe } = u;
    return { ...safe, orderCount };
  }

  async listUsers(q: AdminUsersQuery) {
    const base: FindOptionsWhere<User> = {
      ...(q.isActive !== undefined && { isActive: q.isActive }),
      ...(q.role && { roles: Raw((a) => `${a} LIKE :role`, { role: `%${q.role}%` }) }),
    };
    const where = q.search ? [{ ...base, userName: ILike(`%${q.search}%`) }, { ...base, mobileNo: ILike(`%${q.search}%`) }] : base;
    const [items, total] = await this.users.findAndCount({ where, order: { createdAt: 'DESC' }, ...pageOpts(q) });
    const filtered = items;
    const counts: { user_id: string; n: string }[] = filtered.length
      ? await this.db.query('SELECT user_id, COUNT(*) AS n FROM orders WHERE user_id = ANY($1) GROUP BY user_id', [filtered.map((u) => u.id)])
      : [];
    return new Paged(filtered.map((u) => this.userDto(u, Number(counts.find((c) => c.user_id === u.id)?.n ?? 0))), total);
  }

  async createUser(dto: CreateAdminUserDto) {
    if (await this.users.findOneBy({ mobileNo: dto.mobileNo })) throw new ConflictException('Mobile number already registered');
    const user = await this.users.save(
      this.users.create({ userName: dto.userName, mobileNo: dto.mobileNo, passwordHash: await bcrypt.hash(dto.password, 10), isVerified: true, roles: withCustomer(dto.roles) }),
    );
    return this.userDto(user);
  }

  async updateUser(actorId: string, id: string, dto: UpdateAdminUserDto) {
    const user = await this.users.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    if (id === actorId && (dto.isActive === false || (dto.roles && !dto.roles.includes('admin')))) {
      throw new BadRequestException('You cannot disable or demote yourself');
    }
    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
      if (!dto.isActive) user.tokenVersion += 1;
    }
    if (dto.roles) user.roles = withCustomer(dto.roles);
    return this.userDto(await this.users.save(user));
  }

  async sendNotification(dto: AdminNotificationDto) {
    const ids = dto.userId
      ? [dto.userId]
      : (await this.users.find({ where: { isActive: true }, select: { id: true } })).map((u) => u.id);
    const { userId, ...text } = dto;
    for (let i = 0; i < ids.length; i += 500) {
      await this.notifications.insert(ids.slice(i, i + 500).map((id) => ({ user: { id }, type: 'admin_message', ...text })));
    }
    return { sent: ids.length };
  }

  async dashboard() {
    const q = <T>(sql: string, params: unknown[] = []) => (): Promise<T[]> => this.db.query(sql, params);
    const usd = `COALESCE(SUM(o.total / c.rate_to_base), 0)`;
    const valid = `FROM orders o JOIN currencies c ON c.code = o.currency WHERE o.status <> 'cancelled'`;
    const queries = [
      q<{ customers: string; products: string; total: string; today: string; pending: string }>(`SELECT
        (SELECT COUNT(*) FROM users WHERE 'customer' = ANY(string_to_array(roles, ',')) AND is_active) AS customers,
        (SELECT COUNT(*) FROM products WHERE is_active) AS products,
        (SELECT COUNT(*) FROM orders) AS total,
        (SELECT COUNT(*) FROM orders WHERE created_at >= date_trunc('day', now())) AS today,
        (SELECT COUNT(*) FROM orders WHERE status IN ('confirmed','preparing')) AS pending`),
      q<{ today: string; d30: string; total: string }>(`SELECT
        COALESCE(SUM(o.total / c.rate_to_base) FILTER (WHERE o.created_at >= date_trunc('day', now())), 0) AS today,
        COALESCE(SUM(o.total / c.rate_to_base) FILTER (WHERE o.created_at >= now() - interval '30 days'), 0) AS d30,
        ${usd} AS total ${valid}`),
      q<{ status: string; n: string }>('SELECT status, COUNT(*) AS n FROM orders GROUP BY status ORDER BY status'),
      q<{ d: string; n: string; rev: string }>(`SELECT to_char(g.d, 'YYYY-MM-DD') AS d,
          COUNT(o.id) AS n, COALESCE(SUM(o.total / c.rate_to_base) FILTER (WHERE o.status <> 'cancelled'), 0) AS rev
        FROM generate_series(date_trunc('day', now()) - interval '6 days', date_trunc('day', now()), interval '1 day') g(d)
        LEFT JOIN orders o ON date_trunc('day', o.created_at) = g.d
        LEFT JOIN currencies c ON c.code = o.currency
        GROUP BY g.d ORDER BY g.d`),
      q<{ id: string; name: string; color: string; stock: number }>(`SELECT v.id, p.name_en AS name, v.color_name_en AS color, v.stock
        FROM product_variants v JOIN products p ON p.id = v.product_id WHERE p.is_active AND v.stock <= 5 ORDER BY v.stock, p.name_en LIMIT 10`),
      q<{ name: string; qty: string }>(`SELECT i.name_en AS name, SUM(i.quantity) AS qty FROM order_items i JOIN orders o ON o.id = i.order_id
        WHERE o.status <> 'cancelled' GROUP BY i.name_en ORDER BY qty DESC LIMIT 5`),
      q<{ n: string }>(`SELECT COUNT(*) AS n FROM support_messages WHERE sender = 'user' AND is_read = false`),
    ];
    const out: unknown[][] = [];
    for (const run of queries) out.push(await run());
    const [[counts], [rev], byStatus, days, lowStock, top, [support]] = out as [
      { customers: string; products: string; total: string; today: string; pending: string }[],
      { today: string; d30: string; total: string }[],
      { status: string; n: string }[],
      { d: string; n: string; rev: string }[],
      { id: string; name: string; color: string; stock: number }[],
      { name: string; qty: string }[],
      { n: string }[],
    ];
    const money = (v: string) => Math.round(Number(v) * 100) / 100;
    return {
      customers: Number(counts.customers),
      products: Number(counts.products),
      ordersTotal: Number(counts.total),
      ordersToday: Number(counts.today),
      ordersPending: Number(counts.pending),
      revenueTodayUsd: money(rev.today),
      revenue30DaysUsd: money(rev.d30),
      revenueTotalUsd: money(rev.total),
      unreadSupport: Number(support.n),
      ordersByStatus: byStatus.map((r) => ({ status: r.status, count: Number(r.n) })),
      last7Days: days.map((r) => ({ date: r.d, orders: Number(r.n), revenueUsd: money(r.rev) })),
      lowStock: lowStock.map((r) => ({ variantId: r.id, productName: r.name, color: r.color, stock: r.stock })),
      topProducts: top.map((r) => ({ name: r.name, quantity: Number(r.qty) })),
    };
  }
}
