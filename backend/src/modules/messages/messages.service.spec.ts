import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Not } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { BookingStatus } from '../bookings/enums/booking.enum';
import { NotificationType } from '../notifications/enums/notification.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { MessagesService } from './messages.service';

describe('MessagesService', () => {
  let service: MessagesService;
  let conversationRepository: {
    findOne: jest.Mock;
    findOneOrFail: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let messageRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    findAndCount: jest.Mock;
    update: jest.Mock;
  };
  let bookingRepository: { findOne: jest.Mock };
  let notificationsService: { createForUser: jest.Mock };

  const bookingId = '11111111-1111-4111-8111-111111111111';
  const conversationId = '22222222-2222-4222-8222-222222222222';
  const guestId = '33333333-3333-4333-8333-333333333333';
  const hostId = '44444444-4444-4444-8444-444444444444';
  const outsiderId = '55555555-5555-4555-8555-555555555555';
  const listingId = '66666666-6666-4666-8666-666666666666';

  const guest = {
    id: guestId,
    name: 'Guest',
    email: 'guest@test.com',
    avatarUrl: null,
  };
  const host = {
    id: hostId,
    name: 'Host',
    email: 'host@test.com',
    avatarUrl: null,
  };
  const booking = {
    id: bookingId,
    status: BookingStatus.Confirmed,
    checkIn: new Date('2026-01-01'),
    checkOut: new Date('2026-01-05'),
    bookedByUser: guest,
    listing: {
      id: listingId,
      title: 'Lake House',
      locationText: 'Goa, India',
      owner: host,
    },
  };
  const conversation = {
    id: conversationId,
    booking,
    guest,
    host,
    messages: [],
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    conversationRepository = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      find: jest.fn(),
      create: jest.fn((entity) => entity),
      save: jest.fn(async (entity) => ({ ...entity, id: conversationId })),
    };
    messageRepository = {
      create: jest.fn((entity) => entity),
      save: jest.fn(async (entity) => ({ ...entity, id: 'message-id' })),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      update: jest.fn(),
    };
    bookingRepository = { findOne: jest.fn() };
    notificationsService = { createForUser: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: getRepositoryToken(Conversation),
          useValue: conversationRepository,
        },
        { provide: getRepositoryToken(Message), useValue: messageRepository },
        { provide: getRepositoryToken(Booking), useValue: bookingRepository },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get(MessagesService);
  });

  it('creates a conversation for a confirmed booking participant', async () => {
    bookingRepository.findOne.mockResolvedValue(booking);
    conversationRepository.findOne.mockResolvedValue(null);
    conversationRepository.findOneOrFail.mockResolvedValue(conversation);

    const result = await service.getOrCreateConversationForBooking(
      bookingId,
      guestId,
    );

    expect(conversationRepository.create).toHaveBeenCalledWith({
      booking: { id: bookingId },
      guest: { id: guestId },
      host: { id: hostId },
    });
    expect(result).toMatchObject({ id: conversationId, unreadCount: 0 });
  });

  it('rejects pending bookings', async () => {
    bookingRepository.findOne.mockResolvedValue({
      ...booking,
      status: BookingStatus.Pending,
    });

    await expect(
      service.getOrCreateConversationForBooking(bookingId, guestId),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects non-participants', async () => {
    bookingRepository.findOne.mockResolvedValue(booking);

    await expect(
      service.getOrCreateConversationForBooking(bookingId, outsiderId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns an existing conversation instead of duplicating', async () => {
    bookingRepository.findOne.mockResolvedValue(booking);
    conversationRepository.findOne.mockResolvedValue(conversation);

    await service.getOrCreateConversationForBooking(bookingId, hostId);

    expect(conversationRepository.create).not.toHaveBeenCalled();
  });

  it('sends a message as a participant', async () => {
    conversationRepository.findOne.mockResolvedValue(conversation);
    messageRepository.findOne.mockResolvedValue({
      id: 'message-id',
      content: 'Hello',
      readAt: null,
      createdAt: new Date('2026-01-01T01:00:00Z'),
      sender: guest,
    });

    const result = await service.sendMessage(conversationId, guestId, {
      content: '  Hello  ',
    });

    expect(messageRepository.create).toHaveBeenCalledWith({
      conversation: { id: conversationId },
      sender: { id: guestId },
      content: 'Hello',
    });
    expect(notificationsService.createForUser).toHaveBeenCalledWith({
      userId: hostId,
      type: NotificationType.NewMessage,
      payload: expect.objectContaining({
        conversationId,
        bookingId,
        listingId,
        actorId: guestId,
        preview: 'Hello',
      }),
    });
    expect(result).toMatchObject({ content: 'Hello', sender: { id: guestId } });
  });

  it('rejects blank message content', async () => {
    conversationRepository.findOne.mockResolvedValue(conversation);

    await expect(
      service.sendMessage(conversationId, guestId, { content: '   ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects message sends from non-participants', async () => {
    conversationRepository.findOne.mockResolvedValue(conversation);

    await expect(
      service.sendMessage(conversationId, outsiderId, { content: 'Hello' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('marks only other participant messages as read', async () => {
    conversationRepository.findOne.mockResolvedValue(conversation);
    messageRepository.update.mockResolvedValue({ affected: 2 });

    const result = await service.markConversationRead(conversationId, guestId);

    expect(messageRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation: { id: conversationId },
        sender: { id: Not(guestId) },
      }),
      expect.objectContaining({ readAt: expect.any(Date) }),
    );
    expect(result).toEqual({ updatedCount: 2 });
  });
});
