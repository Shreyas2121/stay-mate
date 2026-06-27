import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import {
  NotificationStatusFilter,
  NotificationType,
} from './enums/notification.enum';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  payload?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async createForUser(input: CreateNotificationInput) {
    const notification = this.notificationRepository.create({
      user: { id: input.userId },
      type: input.type,
      payload: input.payload ?? null,
    });

    const saved = await this.notificationRepository.save(notification);
    return this.findByIdForUser(saved.id, input.userId);
  }

  async listForUser(
    userId: string,
    status = NotificationStatusFilter.All,
    page = 1,
    limit = 20,
  ) {
    const safePage = Math.max(1, Number(page));
    const safeLimit = Math.min(50, Math.max(1, Number(limit)));
    const where =
      status === NotificationStatusFilter.Unread
        ? { user: { id: userId }, readAt: IsNull() }
        : status === NotificationStatusFilter.Read
          ? { user: { id: userId }, readAt: Not(IsNull()) }
          : { user: { id: userId } };

    const [items, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationRepository.count({
      where: { user: { id: userId }, readAt: IsNull() },
    });

    return { count };
  }

  async markRead(notificationId: string, userId: string) {
    const notification = await this.findByIdForUser(notificationId, userId);

    if (!notification.readAt) {
      notification.readAt = new Date();
      await this.notificationRepository.save(notification);
    }

    return notification;
  }

  async markAllRead(userId: string) {
    const result = await this.notificationRepository.update(
      { user: { id: userId }, readAt: IsNull() },
      { readAt: new Date() },
    );

    return { updatedCount: result.affected ?? 0 };
  }

  private async findByIdForUser(notificationId: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, user: { id: userId } },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }
}