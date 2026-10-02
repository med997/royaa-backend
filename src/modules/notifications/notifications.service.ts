import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paged, PageQueryDto, pageOpts } from '../../common/pagination.js';
import { Notification } from './notification.entity.js';

export interface NotificationText {
  title: string;
  body: string;
  titleAr?: string;
  bodyAr?: string;
  orderId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(@InjectRepository(Notification) readonly repo: Repository<Notification>) {}

  create(userId: string, type: string, text: NotificationText) {
    return this.repo.save(this.repo.create({ user: { id: userId }, type, ...text }));
  }

  async findAll(userId: string, q: PageQueryDto) {
    const [items, total] = await this.repo.findAndCount({ where: { user: { id: userId } }, order: { createdAt: 'DESC' }, ...pageOpts(q) });
    return new Paged(
      items.map((n) => ({ id: n.id, type: n.type, title: n.title, body: n.body, titleAr: n.titleAr, bodyAr: n.bodyAr, orderId: n.orderId, isRead: n.isRead, createdAt: n.createdAt })),
      total,
    );
  }

  async markRead(userId: string, id: string) {
    const notification = await this.repo.findOne({ where: { id, user: { id: userId } } });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.isRead = true;
    await this.repo.save(notification);
    return { id, isRead: true };
  }

  async markAllRead(userId: string) {
    const { affected } = await this.repo.update({ user: { id: userId }, isRead: false }, { isRead: true });
    return { updated: affected ?? 0 };
  }

  unreadCount(userId: string) {
    return this.repo.count({ where: { user: { id: userId }, isRead: false } });
  }
}
