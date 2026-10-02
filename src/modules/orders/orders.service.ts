import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, EntityManager, Repository } from 'typeorm';
import { Paged, PageQueryDto, pageOpts } from '../../common/pagination.js';
import { AddressesService } from '../addresses/addresses.service.js';
import { CartService } from '../cart/cart.service.js';
import { CouponsService } from '../coupons/coupons.js';
import { CurrencyService } from '../currency/currency.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ProductVariant } from '../products/product-variant.entity.js';
import { CheckoutDto } from './dto/checkout.dto.js';
import { OrderItem } from './order-item.entity.js';
import { OrderStatusLog } from './order-status-log.entity.js';
import { Order } from './order.entity.js';

const EXPRESS_FEE_BASE_MINOR_UNITS = 400;
const FLOW = ['confirmed', 'preparing', 'shipped', 'delivered'] as const;
export const ORDER_STATUSES = [...FLOW, 'cancelled'] as const;
export const PAYMENT_STATUSES = ['pending', 'paid', 'refunded'] as const;

const LABELS: Record<string, { en: string; ar: string }> = {
  confirmed: { en: 'Order confirmed', ar: 'تم تأكيد الطلب' },
  preparing: { en: 'Preparing your order', ar: 'جارٍ تجهيز طلبك' },
  shipped: { en: 'Order shipped', ar: 'تم شحن الطلب' },
  delivered: { en: 'Delivered', ar: 'تم التوصيل' },
  cancelled: { en: 'Order cancelled', ar: 'تم إلغاء الطلب' },
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface AdminOrderFilters extends PageQueryDto {
  status?: string;
  paymentStatus?: string;
  search?: string;
  from?: string;
  to?: string;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly repo: Repository<Order>,
    private readonly cart: CartService,
    private readonly addresses: AddressesService,
    private readonly currency: CurrencyService,
    private readonly coupons: CouponsService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  async checkout(userId: string, dto: CheckoutDto) {
    const address = await this.addresses.findById(userId, dto.addressId);
    if (!address) throw new NotFoundException('Address not found');

    const cartItems = await this.cart.findEntities(userId);
    const currencyCode = dto.currency ?? this.config.get<string>('DEFAULT_CURRENCY', 'YER');

    const orderItems: DeepPartial<OrderItem>[] = [];
    let subtotal = 0;
    for (const item of cartItems) {
      const unitPrice = await this.currency.convertFromBaseMinorUnits(item.product.basePriceMinorUnits, currencyCode);
      const lineTotal = round2(unitPrice * item.quantity);
      subtotal += lineTotal;
      const p = item.prescription;
      orderItems.push({
        nameAr: item.product.nameAr,
        nameEn: item.product.nameEn,
        colorNameAr: item.variant?.colorNameAr ?? null,
        colorNameEn: item.variant?.colorNameEn ?? null,
        productId: item.product.id,
        variantId: item.variant?.id ?? null,
        lensType: item.lensType,
        prescription: p
          ? { label: p.label, rightSph: p.rightSph, rightCyl: p.rightCyl, rightAxis: p.rightAxis, leftSph: p.leftSph, leftCyl: p.leftCyl, leftAxis: p.leftAxis, addPower: p.addPower, pd: p.pd, imageUrl: p.imageUrl }
          : null,
        unitPrice,
        quantity: item.quantity,
        lineTotal,
      });
    }
    subtotal = round2(subtotal);

    const applied = dto.couponCode ? await this.coupons.apply(dto.couponCode, subtotal, currencyCode) : null;
    const discount = applied?.discount ?? 0;
    const deliveryFee =
      dto.deliveryMethod === 'express' ? await this.currency.convertFromBaseMinorUnits(EXPRESS_FEE_BASE_MINOR_UNITS, currencyCode) : 0;
    const total = round2(subtotal - discount + deliveryFee);

    const order = await this.repo.manager.transaction(async (m) => {
      for (const item of cartItems) {
        if (!item.variant) continue;
        const { affected } = await m
          .createQueryBuilder()
          .update(ProductVariant)
          .set({ stock: () => `stock - ${item.quantity}` })
          .where('id = :id AND stock >= :q', { id: item.variant.id, q: item.quantity })
          .execute();
        if (!affected) throw new BadRequestException(`Insufficient stock for ${item.product.nameEn}`);
      }
      return m.save(
        m.create(Order, {
          user: { id: userId },
          addressLabel: address.label,
          addressLine1: address.line1,
          addressCity: address.city,
          addressRecipientName: address.recipientName,
          addressRecipientPhone: address.recipientPhone,
          addressDistrict: address.district,
          addressNotes: address.notes,
          addressLatitude: address.latitude,
          addressLongitude: address.longitude,
          deliveryMethod: dto.deliveryMethod,
          paymentMethod: dto.paymentMethod,
          currency: currencyCode,
          subtotal,
          discount,
          couponCode: applied?.coupon.code ?? null,
          notes: dto.notes ?? null,
          deliveryFee,
          total,
          items: orderItems,
          statusLogs: [{ status: 'confirmed' }],
        }),
      );
    });

    if (applied) await this.coupons.redeem(applied.coupon);
    await this.cart.clear(userId);
    await this.notifyStatus(userId, order, 'confirmed');
    return this.toDto(order);
  }

  async findAll(userId: string, q: PageQueryDto) {
    const [orders, total] = await this.repo.findAndCount({ where: { user: { id: userId } }, order: { createdAt: 'DESC' }, ...pageOpts(q) });
    return new Paged(
      orders.map((o) => ({
        id: o.id,
        orderNumber: this.orderNumber(o),
        status: o.status,
        paymentStatus: o.paymentStatus,
        total: Number(o.total),
        currency: o.currency,
        itemCount: o.items.length,
        createdAt: o.createdAt,
      })),
      total,
    );
  }

  async findOne(userId: string, id: string) {
    const order = await this.repo.findOne({ where: { id, user: { id: userId } } });
    if (!order) throw new NotFoundException('Order not found');
    return this.toDto(order);
  }

  async cancel(userId: string, id: string) {
    const order = await this.repo.findOne({ where: { id, user: { id: userId } } });
    if (!order) throw new NotFoundException('Order not found');
    if (!['confirmed', 'preparing'].includes(order.status)) throw new BadRequestException('Order can no longer be cancelled');
    return this.toDto(await this.applyStatus(order, 'cancelled'));
  }

  async adminFindAll(f: AdminOrderFilters) {
    const qb = this.repo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.user', 'u')
      .leftJoinAndSelect('o.items', 'i')
      .leftJoinAndSelect('o.statusLogs', 'l')
      .orderBy('o.createdAt', 'DESC')
      .skip((f.page - 1) * f.limit)
      .take(f.limit);
    if (f.status) qb.andWhere('o.status = :status', { status: f.status });
    if (f.paymentStatus) qb.andWhere('o.paymentStatus = :ps', { ps: f.paymentStatus });
    if (f.from) qb.andWhere('o.createdAt >= :from', { from: f.from });
    if (f.to) qb.andWhere('o.createdAt <= :to', { to: f.to });
    if (f.search) {
      qb.andWhere("(u.mobileNo ILIKE :s OR u.userName ILIKE :s OR CAST(o.orderSeq + 100000 AS text) LIKE :s)", { s: `%${f.search.replace(/^RY-/i, '')}%` });
    }
    const [orders, total] = await qb.getManyAndCount();
    return new Paged(orders.map((o) => this.toDto(o, true)), total);
  }

  async adminFindOne(id: string) {
    const order = await this.repo.findOne({ where: { id }, relations: { user: true } });
    if (!order) throw new NotFoundException('Order not found');
    return this.toDto(order, true);
  }

  async adminSetStatus(id: string, status: string) {
    const order = await this.repo.findOne({ where: { id }, relations: { user: true } });
    if (!order) throw new NotFoundException('Order not found');
    const from = FLOW.indexOf(order.status as (typeof FLOW)[number]);
    const to = FLOW.indexOf(status as (typeof FLOW)[number]);
    if (order.status === 'cancelled' || order.status === 'delivered') throw new BadRequestException(`Order is already ${order.status}`);
    if (status === 'cancelled' ? false : to <= from) throw new BadRequestException('Status can only move forward');
    return this.toDto(await this.applyStatus(order, status), true);
  }

  async adminSetPayment(id: string, paymentStatus: string) {
    const order = await this.repo.findOne({ where: { id }, relations: { user: true } });
    if (!order) throw new NotFoundException('Order not found');
    order.paymentStatus = paymentStatus;
    return this.toDto(await this.repo.save(order), true);
  }

  private async applyStatus(order: Order, status: string) {
    await this.repo.manager.transaction(async (m: EntityManager) => {
      if (status === 'cancelled') {
        for (const item of order.items) {
          if (item.variantId) await m.increment(ProductVariant, { id: item.variantId }, 'stock', item.quantity);
        }
        if (order.paymentStatus === 'paid') order.paymentStatus = 'refunded';
      }
      if (status === 'delivered' && order.paymentMethod === 'cod') order.paymentStatus = 'paid';
      order.status = status;
      await m.save(Order, order);
      await m.save(OrderStatusLog, { order: { id: order.id }, status });
    });
    const fresh = await this.repo.findOneOrFail({ where: { id: order.id }, relations: { user: true } });
    await this.notifyStatus(fresh.user.id, fresh, status);
    return fresh;
  }

  private notifyStatus(userId: string, order: Order, status: string) {
    const label = LABELS[status];
    const no = this.orderNumber(order);
    return this.notifications.create(userId, `order_${status}`, {
      title: label.en,
      body: status === 'confirmed' ? `Your order ${no} totalling ${order.total} ${order.currency} has been confirmed.` : `Order ${no}: ${label.en}.`,
      titleAr: label.ar,
      bodyAr: status === 'confirmed' ? `تم تأكيد طلبك ${no} بإجمالي ${order.total} ${order.currency}.` : `الطلب ${no}: ${label.ar}.`,
      orderId: order.id,
    });
  }

  private orderNumber(order: Order) {
    return `RY-${100000 + order.orderSeq}`;
  }

  private toDto(order: Order, withUser = false) {
    const idx = FLOW.indexOf(order.status as (typeof FLOW)[number]);
    const at = (stage: string) => order.statusLogs.find((l) => l.status === stage)?.createdAt ?? (stage === 'confirmed' ? order.createdAt : null);
    const stages = FLOW.map((stage, i) => ({ stage, label: LABELS[stage].en, labelAr: LABELS[stage].ar, at: at(stage), done: idx >= i }));
    if (order.status === 'cancelled') stages.push({ stage: 'cancelled' as never, label: LABELS.cancelled.en, labelAr: LABELS.cancelled.ar, at: at('cancelled'), done: true });

    return {
      id: order.id,
      orderNumber: this.orderNumber(order),
      status: order.status,
      paymentStatus: order.paymentStatus,
      timeline: stages,
      currency: order.currency,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      couponCode: order.couponCode,
      deliveryFee: Number(order.deliveryFee),
      total: Number(order.total),
      address: {
        label: order.addressLabel,
        line1: order.addressLine1,
        city: order.addressCity,
        recipientName: order.addressRecipientName,
        recipientPhone: order.addressRecipientPhone,
        district: order.addressDistrict,
        notes: order.addressNotes,
        latitude: order.addressLatitude,
        longitude: order.addressLongitude,
      },
      deliveryMethod: order.deliveryMethod,
      paymentMethod: order.paymentMethod,
      notes: order.notes,
      createdAt: order.createdAt,
      ...(withUser && order.user ? { customer: { id: order.user.id, userName: order.user.userName, mobileNo: order.user.mobileNo } } : {}),
      items: order.items.map((i) => ({
        nameAr: i.nameAr,
        nameEn: i.nameEn,
        colorNameAr: i.colorNameAr,
        colorNameEn: i.colorNameEn,
        productId: i.productId,
        variantId: i.variantId,
        lensType: i.lensType,
        prescription: i.prescription,
        unitPrice: Number(i.unitPrice),
        quantity: i.quantity,
        lineTotal: Number(i.lineTotal),
      })),
    };
  }
}
