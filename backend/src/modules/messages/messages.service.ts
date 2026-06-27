import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { BookingStatus } from '../bookings/enums/booking.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/enums/notification.enum';
import { User } from '../users/entities/user.entity';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getOrCreateConversationForBooking(bookingId: string, userId: string) {
    const booking = await this.findConfirmedBookingForMessaging(bookingId);
    this.ensureBookingParticipant(booking, userId);

    const conversation = await this.findOrCreateConversation(booking);
    return this.mapConversation(conversation, userId);
  }

  async ensureConversationForConfirmedBooking(bookingId: string) {
    const booking = await this.findConfirmedBookingForMessaging(bookingId);
    const conversation = await this.findOrCreateConversation(booking);
    return this.mapConversation(conversation, booking.bookedByUser.id);
  }

  async getMyConversations(userId: string) {
    const conversations = await this.conversationRepository.find({
      where: [{ guest: { id: userId } }, { host: { id: userId } }],
      relations: this.conversationRelations,
      order: { createdAt: 'DESC', messages: { createdAt: 'DESC' } },
    });

    const mapped = conversations.map((conversation) =>
      this.mapConversation(conversation, userId),
    );

    return mapped.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ?? a.createdAt;
      const bTime = b.lastMessage?.createdAt ?? b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }

  async getConversationMessages(
    conversationId: string,
    userId: string,
    query: GetMessagesQueryDto,
  ) {
    await this.assertConversationParticipant(conversationId, userId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const [messages, total] = await this.messageRepository.findAndCount({
      where: { conversation: { id: conversationId } },
      relations: { sender: true },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      messages: messages.map((message) => this.mapMessage(message)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async sendMessage(conversationId: string, userId: string, dto: SendMessageDto) {
    const conversation = await this.assertConversationParticipant(conversationId, userId);

    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const message = this.messageRepository.create({
      conversation: { id: conversationId },
      sender: { id: userId },
      content,
    });

    const savedMessage = await this.messageRepository.save(message);
    const loadedMessage = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: { sender: true },
    });

    if (!loadedMessage) {
      throw new NotFoundException('Message not found after save');
    }

    const recipient = conversation.guest.id === userId ? conversation.host : conversation.guest;
    await this.notificationsService.createForUser({
      userId: recipient.id,
      type: NotificationType.NewMessage,
      payload: {
        title: 'New message',
        message: `${loadedMessage.sender.name ?? 'Someone'} sent you a message`,
        conversationId,
        bookingId: conversation.booking.id,
        listingId: conversation.booking.listing?.id,
        actorId: userId,
        preview: loadedMessage.content.slice(0, 120),
      },
    });

    return this.mapMessage(loadedMessage);
  }

  async markConversationRead(conversationId: string, userId: string) {
    await this.assertConversationParticipant(conversationId, userId);

    const result = await this.messageRepository.update(
      {
        conversation: { id: conversationId },
        sender: { id: Not(userId) },
        readAt: IsNull(),
      },
      { readAt: new Date() },
    );

    return { updatedCount: result.affected ?? 0 };
  }

  async assertConversationParticipant(conversationId: string, userId: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: this.conversationRelations,
    });

    if (!conversation || !this.isConversationParticipant(conversation, userId)) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  private async findConfirmedBookingForMessaging(bookingId: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: {
        bookedByUser: true,
        listing: {
          owner: true,
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.Confirmed) {
      throw new BadRequestException(
        'Messaging is only available for confirmed bookings',
      );
    }

    return booking;
  }

  private ensureBookingParticipant(booking: Booking, userId: string) {
    const isGuest = booking.bookedByUser.id === userId;
    const isHost = booking.listing.owner.id === userId;

    if (!isGuest && !isHost) {
      throw new NotFoundException('Booking not found');
    }
  }

  private async findOrCreateConversation(booking: Booking) {
    const existingConversation = await this.conversationRepository.findOne({
      where: { booking: { id: booking.id } },
      relations: this.conversationRelations,
    });

    if (existingConversation) {
      return existingConversation;
    }

    const conversation = this.conversationRepository.create({
      booking: { id: booking.id },
      guest: { id: booking.bookedByUser.id },
      host: { id: booking.listing.owner.id },
    });

    const savedConversation = await this.conversationRepository.save(conversation);
    return this.conversationRepository.findOneOrFail({
      where: { id: savedConversation.id },
      relations: this.conversationRelations,
    });
  }

  private isConversationParticipant(conversation: Conversation, userId: string) {
    return conversation.guest.id === userId || conversation.host.id === userId;
  }

  private mapConversation(conversation: Conversation, currentUserId: string) {
    const lastMessage = this.getLastMessage(conversation.messages ?? []);
    const otherParticipant =
      conversation.guest.id === currentUserId ? conversation.host : conversation.guest;
    const unreadCount = (conversation.messages ?? []).filter(
      (message) => message.sender?.id !== currentUserId && !message.readAt,
    ).length;

    return {
      id: conversation.id,
      createdAt: conversation.createdAt,
      booking: {
        id: conversation.booking.id,
        status: conversation.booking.status,
        checkIn: conversation.booking.checkIn,
        checkOut: conversation.booking.checkOut,
      },
      listing: conversation.booking.listing
        ? {
            id: conversation.booking.listing.id,
            title: conversation.booking.listing.title,
            locationText: conversation.booking.listing.locationText,
          }
        : null,
      guest: this.mapUser(conversation.guest),
      host: this.mapUser(conversation.host),
      otherParticipant: this.mapUser(otherParticipant),
      lastMessage: lastMessage ? this.mapMessage(lastMessage) : null,
      unreadCount,
    };
  }

  private getLastMessage(messages: Message[]) {
    return [...messages].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )[0];
  }

  private mapMessage(message: Message) {
    return {
      id: message.id,
      content: message.content,
      readAt: message.readAt,
      createdAt: message.createdAt,
      sender: this.mapUser(message.sender),
    };
  }

  private mapUser(user?: User) {
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    };
  }

  private readonly conversationRelations = {
    booking: {
      listing: true,
    },
    guest: true,
    host: true,
    messages: {
      sender: true,
    },
  };
}
