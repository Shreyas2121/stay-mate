import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import Stripe from 'stripe';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { BookingsService } from '../bookings/bookings.service';
import { CouponsService } from '../coupons/coupons.service';
import { BookingEarning } from './entities/booking-earning.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { BookingStatus } from '../bookings/enums/booking.enum';
import { EarningStatus } from './enums/payment.enum';
import { MessagesService } from '../messages/messages.service';
import { NotificationType } from '../notifications/enums/notification.enum';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);
  private readonly frontendUrl: string;
  private readonly webhookSecret: string;

  constructor(
    private readonly bookingsService: BookingsService,
    private readonly couponsService: CouponsService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly messagesService: MessagesService,
    private readonly notificationsService: NotificationsService,
    @InjectRepository(BookingEarning)
    private readonly earningRepository: Repository<BookingEarning>,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('stripe.secretKey')!,
    );
    this.frontendUrl = this.configService.get<string>('stripe.frontendUrl')!;
    this.webhookSecret = this.configService.get<string>(
      'stripe.webhookSecret',
    )!;
  }

  async createCheckoutSession(userId: string, dto: CreateCheckoutSessionDto) {
    const pricingContext =
      await this.bookingsService.getBookingPricingContext(dto);

    // Validate coupon if provided (by code or by id)
    const couponResult =
      dto.couponCode || dto.couponId
        ? await this.couponsService.validateCoupon(userId, {
            listingId: dto.listingId,
            checkIn: dto.checkIn,
            checkOut: dto.checkOut,
            guestCount: dto.guestCount,
            code: dto.couponCode,
            couponId: dto.couponId,
          })
        : null;

    const discountAmount = couponResult
      ? couponResult.pricing.discountAmount
      : 0;
    const totalAmount = this.toCurrencyValue(
      pricingContext.baseAmount +
        pricingContext.cleaningFee +
        pricingContext.serviceFee -
        discountAmount,
    );

    if (totalAmount <= 0) {
      throw new BadRequestException('Total amount must be greater than zero');
    }

    // --- Transaction: create booking + Stripe session + update session ID ---
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create the pending booking inside the transaction
      const booking = await this.bookingsService.createBookingWithRunner(
        queryRunner,
        userId,
        dto,
        {
          couponId: couponResult?.coupon.id,
          discountAmount,
          totalAmount,
        },
      );

      // Create Stripe Checkout Session (embedded mode)
      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        ui_mode: 'embedded_page',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: Math.round(totalAmount * 100),
              product_data: {
                name: pricingContext.listing.title,
                description: `${pricingContext.nights} night(s) at ${pricingContext.listing.locationText}`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          bookingId: booking.id,
          userId,
          listingId: pricingContext.listing.id,
        },
        return_url: `${this.frontendUrl}/bookings/${booking.id}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      });

      // Update booking with session ID
      booking.stripeCheckoutSessionId = session.id;
      await queryRunner.manager.save(Booking, booking);

      await queryRunner.commitTransaction();

      return {
        clientSecret: session.client_secret,
        bookingId: booking.id,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Webhook signature verification failed: ${message}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Received Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        await this.handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      }

      case 'checkout.session.expired': {
        await this.handleCheckoutSessionExpired(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      }

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ) {
    const bookingId = session.metadata?.bookingId;
    if (!bookingId) {
      this.logger.warn('checkout.session.completed: no bookingId in metadata');
      return;
    }

    // Load booking with listing ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ owner for earning creation
    const booking = await this.bookingsService.findByIdWithRelations(bookingId);

    // Idempotency: skip if already confirmed
    if (booking.status !== BookingStatus.Pending) {
      this.logger.log(
        `Booking ${bookingId} is already ${booking.status}, skipping`,
      );
      return;
    }

    // --- Transaction: confirm booking + save payment intent + create earning ---
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Save the PaymentIntent ID and confirm
      booking.stripePaymentIntentId = session.payment_intent as string;
      booking.status = BookingStatus.Confirmed;
      await queryRunner.manager.save(Booking, booking);

      // Create earning record for the host
      const grossAmount = Number(booking.baseAmount);
      const platformFee = this.toCurrencyValue(grossAmount * 0.02);
      const hostAmount = this.toCurrencyValue(grossAmount - platformFee);

      const earning = this.earningRepository.create({
        booking: { id: bookingId },
        host: { id: booking.listing.owner.id },
        grossAmount,
        platformFee,
        hostAmount,
        status: EarningStatus.Unpaid,
      });
      await queryRunner.manager.save(BookingEarning, earning);

      await queryRunner.commitTransaction();

      try {
        await this.messagesService.ensureConversationForConfirmedBooking(bookingId);
        await this.notifyBookingConfirmed(booking);
      } catch (notificationError) {
        this.logger.warn(
          'Failed to create booking confirmation side effects for ' +
            bookingId +
            ': ' +
            (notificationError instanceof Error
              ? notificationError.message
              : 'Unknown error'),
        );
      }

      this.logger.log(
        `Booking ${bookingId} confirmed. Earning created: gross=${grossAmount}, platformFee=${platformFee}, hostAmount=${hostAmount}`,
      );
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to process checkout.session.completed for booking ${bookingId}`,
        err instanceof Error ? err.stack : err,
      );
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
    const bookingId = session.metadata?.bookingId;
    if (!bookingId) return;

    try {
      const booking = await this.bookingsService.findById(bookingId);

      if (booking.status === BookingStatus.Pending) {
        await this.bookingsService.cancelBooking(bookingId);
        this.logger.log(
          `Booking ${bookingId} cancelled due to expired checkout session`,
        );
      }
    } catch {
      this.logger.warn(
        `Could not cancel booking ${bookingId} for expired session`,
      );
    }
  }

  private async notifyBookingConfirmed(booking: Booking) {
    await Promise.all([
      this.notificationsService.createForUser({
        userId: booking.bookedByUser.id,
        type: NotificationType.BookingConfirmed,
        payload: {
          title: 'Booking confirmed',
          message: `Your booking for ${booking.listing.title} is confirmed`,
          bookingId: booking.id,
          listingId: booking.listing.id,
        },
      }),
      this.notificationsService.createForUser({
        userId: booking.listing.owner.id,
        type: NotificationType.BookingConfirmed,
        payload: {
          title: 'New booking confirmed',
          message: `${booking.bookedByUser.name ?? 'A guest'} booked ${booking.listing.title}`,
          bookingId: booking.id,
          listingId: booking.listing.id,
          actorId: booking.bookedByUser.id,
        },
      }),
    ]);
  }

  private toCurrencyValue(value: number): number {
    return Number(value.toFixed(2));
  }
}


