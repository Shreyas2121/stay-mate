import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, In, QueryRunner } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { Listing } from '../listings/entities/listing.entity';
import { VerifyBookingDto } from './dto/verify-booking.dto';
import { BookingStatus } from './enums/booking.enum';
import { ListingStatus } from '../listings/enums/listing.enum';
import { AvailabilityService } from '../availability/availability.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingEarning } from '../payments/entities/booking-earning.entity';
import { EarningStatus } from '../payments/enums/payment.enum';
import { NotificationType } from '../notifications/enums/notification.enum';
import { NotificationsService } from '../notifications/notifications.service';

export interface BookingPricingContext {
  listing: Listing;
  checkInDate: Date;
  checkOutDate: Date;
  nights: number;
  baseAmount: number;
  cleaningFee: number;
  serviceFee: number;
}

export interface BookingPricingOverrides {
  discountAmount?: number;
  totalAmount?: number;
  couponId?: string;
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(BookingEarning)
    private readonly earningRepository: Repository<BookingEarning>,
    private readonly availabilityService: AvailabilityService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findById(id: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async findByIdWithRelations(id: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: { bookedByUser: true, listing: { owner: true } },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async findByIdForUser(id: string, userId: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id, bookedByUser: { id: userId } },
      relations: { listing: { photos: true }, coupon: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async findMyBookings(userId: string) {
    return this.bookingRepository.find({
      where: { bookedByUser: { id: userId } },
      relations: {
        listing: {
          photos: true,
          owner: true,
        },
        coupon: true,
      },
      order: {
        checkIn: 'ASC',
        createdAt: 'DESC',
        listing: {
          photos: {
            displayOrder: 'ASC',
          },
        },
      },
    });
  }

  async findHostBookings(hostId: string) {
    return this.bookingRepository.find({
      where: { listing: { owner: { id: hostId } } },
      relations: {
        listing: {
          photos: true,
        },
        bookedByUser: true,
        coupon: true,
      },
      order: {
        checkIn: 'ASC',
        createdAt: 'DESC',
        listing: {
          photos: {
            displayOrder: 'ASC',
          },
        },
      },
    });
  }

  async findByIdForParticipant(id: string, userId: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: {
        bookedByUser: true,
        listing: {
          owner: true,
          photos: true,
        },
        coupon: true,
      },
      order: {
        listing: {
          photos: {
            displayOrder: 'ASC',
          },
        },
      },
    });

    const isGuest = booking?.bookedByUser?.id === userId;
    const isListingOwner = booking?.listing?.owner?.id === userId;

    if (!booking || (!isGuest && !isListingOwner)) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async verifyBooking(
    dto: VerifyBookingDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.getBookingPricingContext(dto);

    return { success: true, message: 'Dates are available and valid' };
  }

  async getBookingPricingContext(
    dto: VerifyBookingDto,
  ): Promise<BookingPricingContext> {
    const { listingId, checkIn, checkOut, guestCount } = dto;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    checkInDate.setUTCHours(0, 0, 0, 0);
    checkOutDate.setUTCHours(0, 0, 0, 0);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (checkInDate < today) {
      throw new BadRequestException('Check-in date cannot be in the past');
    }

    if (checkOutDate <= checkInDate) {
      throw new BadRequestException(
        'Check-out date must be after check-in date',
      );
    }

    const listing = await this.listingRepository.findOne({
      where: { id: listingId, status: ListingStatus.Active },
    });

    if (!listing) {
      throw new NotFoundException('Active listing not found');
    }

    if (guestCount > listing.maxGuests) {
      throw new BadRequestException(
        `This listing can accommodate a maximum of ${listing.maxGuests} guests`,
      );
    }

    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (listing.minNights && nights < listing.minNights) {
      throw new BadRequestException(
        `Minimum stay is ${listing.minNights} nights`,
      );
    }

    if (listing.maxNights && nights > listing.maxNights) {
      throw new BadRequestException(
        `Maximum stay is ${listing.maxNights} nights`,
      );
    }

    const overlappingBooking = await this.bookingRepository.findOne({
      where: {
        listing: { id: listingId },
        status: In([
          BookingStatus.Pending,
          BookingStatus.Confirmed,
          BookingStatus.Completed,
        ]),
        checkIn: LessThan(checkOutDate),
        checkOut: MoreThan(checkInDate),
      },
    });

    if (overlappingBooking) {
      throw new BadRequestException('These dates are no longer available');
    }

    await this.availabilityService.ensureDatesAreAvailable(
      listingId,
      checkInDate,
      checkOutDate,
    );

    const nightlyRate = Number(listing.price ?? 0);
    const cleaningFee = Number(listing.cleaningFee ?? 0);
    const baseAmount = this.toCurrencyValue(nightlyRate * nights);
    const serviceFee = this.toCurrencyValue(baseAmount * 0.05);

    return {
      listing,
      checkInDate,
      checkOutDate,
      nights,
      baseAmount,
      cleaningFee: this.toCurrencyValue(cleaningFee),
      serviceFee,
    };
  }

  async createBooking(
    userId: string,
    dto: CreateBookingDto,
    pricingOverrides?: BookingPricingOverrides,
  ) {
    const booking = await this.buildBookingEntity(userId, dto, pricingOverrides);
    await this.bookingRepository.save(booking);
    return booking;
  }

  async createBookingWithRunner(
    queryRunner: QueryRunner,
    userId: string,
    dto: CreateBookingDto,
    pricingOverrides?: BookingPricingOverrides,
  ) {
    const booking = await this.buildBookingEntity(userId, dto, pricingOverrides);
    await queryRunner.manager.save(Booking, booking);
    return booking;
  }

  private async buildBookingEntity(
    userId: string,
    dto: CreateBookingDto,
    pricingOverrides?: BookingPricingOverrides,
  ) {
    const ctx = await this.getBookingPricingContext(dto);

    const discountAmount = pricingOverrides?.discountAmount ?? 0;
    const totalAmount =
      pricingOverrides?.totalAmount ??
      this.toCurrencyValue(ctx.baseAmount + ctx.cleaningFee + ctx.serviceFee);

    return this.bookingRepository.create({
      listing: { id: dto.listingId },
      bookedByUser: { id: userId },
      guestCount: dto.guestCount,
      checkIn: ctx.checkInDate,
      checkOut: ctx.checkOutDate,
      baseAmount: ctx.baseAmount,
      cleaningFee: ctx.cleaningFee,
      serviceFee: ctx.serviceFee,
      discountAmount,
      totalAmount,
      coupon: pricingOverrides?.couponId
        ? { id: pricingOverrides.couponId }
        : undefined,
      status: BookingStatus.Pending,
    });
  }

  async confirmBooking(bookingId: string) {
    const booking = await this.findByIdForTransition(bookingId);

    if (booking.status !== BookingStatus.Pending) {
      throw new BadRequestException(
        `Cannot confirm booking with status '${booking.status}'. Expected 'pending'.`,
      );
    }

    booking.status = BookingStatus.Confirmed;
    await this.bookingRepository.save(booking);
    await this.notifyBookingConfirmed(booking);

    return booking;
  }

  async cancelBooking(bookingId: string) {
    const booking = await this.findByIdForTransition(bookingId);

    if (
      booking.status !== BookingStatus.Confirmed &&
      booking.status !== BookingStatus.Pending
    ) {
      throw new BadRequestException(
        `Cannot cancel booking with status '${booking.status}'.`,
      );
    }

    booking.status = BookingStatus.Cancelled;
    await this.bookingRepository.save(booking);
    await this.voidUnpaidEarning(bookingId);
    await this.notifyBookingCancelled(booking, 'both');

    return booking;
  }

  async cancelBookingForGuest(bookingId: string, guestId: string) {
    const booking = await this.findByIdForTransition(bookingId);

    if (booking.bookedByUser.id !== guestId) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }

    if (
      booking.status !== BookingStatus.Confirmed &&
      booking.status !== BookingStatus.Pending
    ) {
      throw new BadRequestException(
        `Cannot cancel booking with status '${booking.status}'.`,
      );
    }

    booking.status = BookingStatus.Cancelled;
    await this.bookingRepository.save(booking);
    await this.voidUnpaidEarning(bookingId);
    await this.notifyBookingCancelled(booking, 'host', guestId);

    return this.findByIdForParticipant(bookingId, guestId);
  }

  async rejectBooking(bookingId: string) {
    const booking = await this.findByIdForTransition(bookingId);

    if (booking.status !== BookingStatus.Pending) {
      throw new BadRequestException(
        `Cannot reject booking with status '${booking.status}'. Expected 'pending'.`,
      );
    }

    booking.status = BookingStatus.Rejected;
    await this.bookingRepository.save(booking);
    await this.notificationsService.createForUser({
      userId: booking.bookedByUser.id,
      type: NotificationType.BookingRejected,
      payload: this.bookingPayload(
        booking,
        'Booking rejected',
        `Your booking request for ${booking.listing.title} was rejected`,
        booking.listing.owner.id,
      ),
    });

    return booking;
  }

  async cancelBookingForHost(bookingId: string, hostId: string) {
    const booking = await this.findByIdForTransition(bookingId);
    this.ensureHostOwnsBooking(booking, hostId);

    if (booking.status !== BookingStatus.Confirmed) {
      throw new BadRequestException(
        `Cannot cancel reservation with status '${booking.status}'. Expected 'confirmed'.`,
      );
    }

    booking.status = BookingStatus.Cancelled;
    await this.bookingRepository.save(booking);
    await this.voidUnpaidEarning(bookingId);
    await this.notifyBookingCancelled(booking, 'guest', hostId);

    return this.findByIdForParticipant(bookingId, hostId);
  }

  async completeBookingForHost(bookingId: string, hostId: string) {
    const booking = await this.findByIdForTransition(bookingId);
    this.ensureHostOwnsBooking(booking, hostId);

    if (booking.status !== BookingStatus.Confirmed) {
      throw new BadRequestException(
        `Cannot complete booking with status '${booking.status}'. Expected 'confirmed'.`,
      );
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const checkOut = new Date(booking.checkOut);
    checkOut.setUTCHours(0, 0, 0, 0);

    if (checkOut > today) {
      throw new BadRequestException(
        'Booking can only be completed after the checkout date',
      );
    }

    booking.status = BookingStatus.Completed;
    await this.bookingRepository.save(booking);
    await this.notificationsService.createForUser({
      userId: booking.bookedByUser.id,
      type: NotificationType.BookingCompleted,
      payload: this.bookingPayload(
        booking,
        'Booking completed',
        `Your stay at ${booking.listing.title} is complete`,
        hostId,
      ),
    });

    return this.findByIdForParticipant(bookingId, hostId);
  }

  async completeEligibleBookings() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const result = await this.bookingRepository.update(
      {
        status: BookingStatus.Confirmed,
        checkOut: LessThan(today),
      },
      { status: BookingStatus.Completed },
    );

    return { completedCount: result.affected ?? 0 };
  }

  async updateStripePaymentIntentId(
    bookingId: string,
    paymentIntentId: string,
  ) {
    const booking = await this.findById(bookingId);
    booking.stripePaymentIntentId = paymentIntentId;
    await this.bookingRepository.save(booking);
    return booking;
  }

  async updateBookingStripeSessionId(bookingId: string, sessionId: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    booking.stripeCheckoutSessionId = sessionId;
    await this.bookingRepository.save(booking);

    return booking;
  }

  private async notifyBookingConfirmed(booking: Booking) {
    await Promise.all([
      this.notificationsService.createForUser({
        userId: booking.bookedByUser.id,
        type: NotificationType.BookingConfirmed,
        payload: this.bookingPayload(
          booking,
          'Booking confirmed',
          `Your booking for ${booking.listing.title} is confirmed`,
        ),
      }),
      this.notificationsService.createForUser({
        userId: booking.listing.owner.id,
        type: NotificationType.BookingConfirmed,
        payload: this.bookingPayload(
          booking,
          'New booking confirmed',
          `${booking.bookedByUser.name ?? 'A guest'} booked ${booking.listing.title}`,
          booking.bookedByUser.id,
        ),
      }),
    ]);
  }

  private async notifyBookingCancelled(
    booking: Booking,
    recipient: 'guest' | 'host' | 'both',
    actorId?: string,
  ) {
    const notifications: Promise<unknown>[] = [];

    if (recipient === 'guest' || recipient === 'both') {
      notifications.push(
        this.notificationsService.createForUser({
          userId: booking.bookedByUser.id,
          type: NotificationType.BookingCancelled,
          payload: this.bookingPayload(
            booking,
            'Booking cancelled',
            `Your booking for ${booking.listing.title} was cancelled`,
            actorId,
          ),
        }),
      );
    }

    if (recipient === 'host' || recipient === 'both') {
      notifications.push(
        this.notificationsService.createForUser({
          userId: booking.listing.owner.id,
          type: NotificationType.BookingCancelled,
          payload: this.bookingPayload(
            booking,
            'Booking cancelled',
            `${booking.bookedByUser.name ?? 'A guest'} cancelled ${booking.listing.title}`,
            actorId,
          ),
        }),
      );
    }

    await Promise.all(notifications);
  }

  private bookingPayload(
    booking: Booking,
    title: string,
    message: string,
    actorId?: string,
  ) {
    return {
      title,
      message,
      bookingId: booking.id,
      listingId: booking.listing.id,
      actorId,
    };
  }

  private async voidUnpaidEarning(bookingId: string) {
    const earning = await this.earningRepository.findOne({
      where: { booking: { id: bookingId } },
    });

    if (earning?.status === EarningStatus.Unpaid) {
      earning.status = EarningStatus.Voided;
      await this.earningRepository.save(earning);
    }
  }

  private async findByIdForTransition(bookingId: string) {
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

    return booking;
  }

  private ensureHostOwnsBooking(booking: Booking, hostId: string) {
    if (booking.listing.owner.id !== hostId) {
      throw new ForbiddenException('You can only manage your own reservations');
    }
  }

  private toCurrencyValue(value: number) {
    return Number(value.toFixed(2));
  }
}





