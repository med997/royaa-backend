import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity.js';

@Injectable()
export class NotificationsService {
  constructor(@InjectRepository(Notification) private readonly repo: Repository<Notification>) {}

  create(userId: string, type: string, title: string, body: string) {
    return this.repo.save(this.repo.create({ user: { id: userId }, type, title, body }));
  }

  async findAll(userId: string) {
    const items = await this.repo.find({ where: { user: { id: userId } }, order: { createdAt: 'DESC' } });
    return items.map((n) => ({ id: n.id, type: n.type, title: n.title, body: n.body, isRead: n.isRead, createdAt: n.createdAt }));
  }

  async markRead(userId: string, id: string) {
    const notification = await this.repo.findOne({ where: { id, user: { id: userId } } });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.isRead = true;
    await this.repo.save(notification);
    return { id, isRead: true };
  }

  unreadCount(userId: string) {
    return this.repo.count({ where: { user: { id: userId }, isRead: false } });
  }
}
