import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { BookingStatus } from '../bookings/enums/booking.enum';
import { BookingsService } from '../bookings/bookings.service';
import { CouponsService } from '../coupons/coupons.service';
import { MessagesService } from '../messages/messages.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/enums/notification.enum';
import { BookingEarning } from './entities/booking-earning.entity';
import { EarningStatus } from './enums/payment.enum';
import { PaymentsService } from './payments.service';

const listingId = '11111111-1111-4111-8111-111111111111';
const bookingId = '22222222-2222-4222-8222-222222222222';
const guestId = '33333333-3333-4333-8333-333333333333';
const hostId = '44444444-4444-4444-8444-444444444444';

function createQueryRunnerMock() {
  return {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn(async (_entity, value) => value),
    },
  };
}

describe('PaymentsService', () => {
  let service: PaymentsService;
  let bookingsService: jest.Mocked<BookingsService>;
  let couponsService: jest.Mocked<CouponsService>;
  let configService: jest.Mocked<ConfigService>;
  let dataSource: { createQueryRunner: jest.Mock };
  let messagesService: { ensureConversationForConfirmedBooking: jest.Mock };
  let notificationsService: { createForUser: jest.Mock };
  let earningRepository: { create: jest.Mock };
  let queryRunner: ReturnType<typeof createQueryRunnerMock>;
  let stripeMock: {
    checkout: { sessions: { create: jest.Mock } };
    webhooks: { constructEvent: jest.Mock };
  };

  beforeEach(async () => {
    queryRunner = createQueryRunnerMock();
    bookingsService = {
      getBookingPricingContext: jest.fn(),
      createBookingWithRunner: jest.fn(),
      findByIdWithRelations: jest.fn(),
      findById: jest.fn(),
      cancelBooking: jest.fn(),
    } as any;
    couponsService = { validateCoupon: jest.fn() } as any;
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'stripe.secretKey') return 'sk_test_123';
        if (key === 'stripe.frontendUrl') return 'http://localhost:3005';
        if (key === 'stripe.webhookSecret') return 'whsec_123';
        return undefined;
      }),
    } as any;
    dataSource = { createQueryRunner: jest.fn(() => queryRunner) };
    messagesService = { ensureConversationForConfirmedBooking: jest.fn() };
    notificationsService = { createForUser: jest.fn() };
    earningRepository = { create: jest.fn((entity) => entity) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: BookingsService, useValue: bookingsService },
        { provide: CouponsService, useValue: couponsService },
        { provide: ConfigService, useValue: configService },
        { provide: DataSource, useValue: dataSource },
        { provide: MessagesService, useValue: messagesService },
        { provide: NotificationsService, useValue: notificationsService },
        {
          provide: getRepositoryToken(BookingEarning),
          useValue: earningRepository,
        },
      ],
    }).compile();

    service = module.get(PaymentsService);
    stripeMock = {
      checkout: {
        sessions: {
          create: jest.fn(),
        },
      },
      webhooks: {
        constructEvent: jest.fn(),
      },
    };
    (service as any).stripe = stripeMock;
  });

  it('creates a checkout session using pricing plus coupon discount', async () => {
    bookingsService.getBookingPricingContext.mockResolvedValue({
      listing: { id: listingId, title: 'Sea View Villa', locationText: 'Goa' },
      checkInDate: new Date('2026-08-01'),
      checkOutDate: new Date('2026-08-03'),
      nights: 2,
      baseAmount: 200,
      cleaningFee: 20,
      serviceFee: 10,
    } as any);
    couponsService.validateCoupon.mockResolvedValue({
      coupon: { id: 'coupon-1' },
      pricing: { discountAmount: 15 },
    } as any);
    bookingsService.createBookingWithRunner.mockResolvedValue({
      id: bookingId,
      stripeCheckoutSessionId: null,
    } as any);
    stripeMock.checkout.sessions.create.mockResolvedValue({
      id: 'cs_test_123',
      client_secret: 'seti_secret_123',
    });

    const result = await service.createCheckoutSession(guestId, {
      listingId,
      checkIn: '2026-08-01',
      checkOut: '2026-08-03',
      guestCount: 2,
      couponCode: 'SUMMER15',
    });

    expect(result).toEqual({
      clientSecret: 'seti_secret_123',
      bookingId,
    });
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: 21500,
            }),
          }),
        ],
        metadata: expect.objectContaining({ bookingId, userId: guestId, listingId }),
        return_url:
          'http://localhost:3005/bookings/' +
          bookingId +
          '/confirmation?session_id={CHECKOUT_SESSION_ID}',
      }),
    );
    expect(queryRunner.manager.save).toHaveBeenCalledWith(
      Booking,
      expect.objectContaining({
        id: bookingId,
        stripeCheckoutSessionId: 'cs_test_123',
      }),
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
  });

  it('confirms a pending booking and creates host earnings on checkout completion webhook', async () => {
    const booking = {
      id: bookingId,
      status: BookingStatus.Pending,
      baseAmount: 300,
      bookedByUser: { id: guestId, name: 'Guest User' },
      listing: {
        id: listingId,
        title: 'Sea View Villa',
        owner: { id: hostId },
      },
    } as any;

    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { bookingId },
          payment_intent: 'pi_test_123',
        },
      },
    });
    bookingsService.findByIdWithRelations.mockResolvedValue(booking);

    const result = await service.handleWebhook(Buffer.from('payload'), 'sig');

    expect(result).toEqual({ received: true });
    expect(booking.status).toBe(BookingStatus.Confirmed);
    expect(booking.stripePaymentIntentId).toBe('pi_test_123');
    expect(earningRepository.create).toHaveBeenCalledWith({
      booking: { id: bookingId },
      host: { id: hostId },
      grossAmount: 300,
      platformFee: 6,
      hostAmount: 294,
      status: EarningStatus.Unpaid,
    });
    expect(queryRunner.manager.save).toHaveBeenCalledWith(Booking, booking);
    expect(messagesService.ensureConversationForConfirmedBooking).toHaveBeenCalledWith(
      bookingId,
    );
    expect(notificationsService.createForUser).toHaveBeenCalledTimes(2);
    expect(notificationsService.createForUser).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: guestId,
        type: NotificationType.BookingConfirmed,
      }),
    );
  });

  it('cancels pending bookings when the checkout session expires', async () => {
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: 'checkout.session.expired',
      data: {
        object: {
          metadata: { bookingId },
        },
      },
    });
    bookingsService.findById.mockResolvedValue({
      id: bookingId,
      status: BookingStatus.Pending,
    } as any);

    await service.handleWebhook(Buffer.from('payload'), 'sig');

    expect(bookingsService.cancelBooking).toHaveBeenCalledWith(bookingId);
  });

  it('rejects invalid webhook signatures', async () => {
    stripeMock.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Signature mismatch');
    });

    await expect(
      service.handleWebhook(Buffer.from('payload'), 'bad-sig'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
