import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { IsNull, Not } from 'typeorm';
import { Notification } from './entities/notification.entity';
import {
  NotificationStatusFilter,
  NotificationType,
} from './enums/notification.enum';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    findAndCount: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
  };

  const userId = '11111111-1111-4111-8111-111111111111';
  const otherUserId = '22222222-2222-4222-8222-222222222222';
  const notificationId = '33333333-3333-4333-8333-333333333333';
  const notification = {
    id: notificationId,
    type: NotificationType.NewMessage,
    payload: { title: 'New message' },
    readAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    user: { id: userId },
  };

  beforeEach(async () => {
    notificationRepository = {
      create: jest.fn((entity) => entity),
      save: jest.fn(async (entity) => ({ ...entity, id: notificationId })),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: notificationRepository,
        },
      ],
    }).compile();

    service = module.get(NotificationsService);
  });

  it('creates a notification for a user', async () => {
    notificationRepository.findOne.mockResolvedValue(notification);

    const result = await service.createForUser({
      userId,
      type: NotificationType.NewMessage,
      payload: { title: 'New message' },
    });

    expect(notificationRepository.create).toHaveBeenCalledWith({
      user: { id: userId },
      type: NotificationType.NewMessage,
      payload: { title: 'New message' },
    });
    expect(result).toBe(notification);
  });

  it('lists unread notifications for a user', async () => {
    notificationRepository.findAndCount.mockResolvedValue([[notification], 1]);

    const result = await service.listForUser(
      userId,
      NotificationStatusFilter.Unread,
      2,
      10,
    );

    expect(notificationRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user: { id: userId }, readAt: IsNull() },
        skip: 10,
        take: 10,
      }),
    );
    expect(result).toMatchObject({ items: [notification], total: 1, page: 2 });
  });

  it('lists read notifications for a user', async () => {
    notificationRepository.findAndCount.mockResolvedValue([[], 0]);

    await service.listForUser(userId, NotificationStatusFilter.Read, 1, 20);

    expect(notificationRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user: { id: userId }, readAt: Not(IsNull()) },
      }),
    );
  });

  it('returns unread count', async () => {
    notificationRepository.count.mockResolvedValue(3);

    await expect(service.getUnreadCount(userId)).resolves.toEqual({ count: 3 });
    expect(notificationRepository.count).toHaveBeenCalledWith({
      where: { user: { id: userId }, readAt: IsNull() },
    });
  });

  it('marks one owned notification read', async () => {
    notificationRepository.findOne.mockResolvedValue({ ...notification });

    const result = await service.markRead(notificationId, userId);

    expect(notificationRepository.findOne).toHaveBeenCalledWith({
      where: { id: notificationId, user: { id: userId } },
    });
    expect(notificationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ readAt: expect.any(Date) }),
    );
    expect(result.readAt).toBeInstanceOf(Date);
  });

  it('does not mark another user notification read', async () => {
    notificationRepository.findOne.mockResolvedValue(null);

    await expect(service.markRead(notificationId, otherUserId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('marks all unread current-user notifications read', async () => {
    notificationRepository.update.mockResolvedValue({ affected: 4 });

    await expect(service.markAllRead(userId)).resolves.toEqual({ updatedCount: 4 });
    expect(notificationRepository.update).toHaveBeenCalledWith(
      { user: { id: userId }, readAt: IsNull() },
      { readAt: expect.any(Date) },
    );
  });
});
