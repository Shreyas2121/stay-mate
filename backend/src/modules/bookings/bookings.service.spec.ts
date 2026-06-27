import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityService } from '../availability/availability.service';
import { Listing } from '../listings/entities/listing.entity';
import { ListingStatus } from '../listings/enums/listing.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/enums/notification.enum';
import { Booking } from './entities/booking.entity';
import { BookingStatus } from './enums/booking.enum';
import { BookingsService } from './bookings.service';
import { BookingEarning } from '../payments/entities/booking-earning.entity';
import { EarningStatus } from '../payments/enums/payment.enum';

function futureDate(daysFromNow: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

describe('BookingsService', () => {
  let service: BookingsService;
  let bookingRepository: {
    findOne: jest.Mock;
    find: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let listingRepository: { findOne: jest.Mock };
  let earningRepository: { findOne: jest.Mock; save: jest.Mock };
  let availabilityService: { ensureDatesAreAvailable: jest.Mock };
  let notificationsService: { createForUser: jest.Mock };

  const listingId = '11111111-1111-4111-8111-111111111111';
  const bookingId = '22222222-2222-4222-8222-222222222222';
  const guestId = '33333333-3333-4333-8333-333333333333';
  const hostId = '44444444-4444-4444-8444-444444444444';

  const activeListing = {
    id: listingId,
    title: 'Lake House',
    status: ListingStatus.Active,
    price: 125.5,
    cleaningFee: 42,
    maxGuests: 4,
    minNights: 2,
    maxNights: 10,
    owner: { id: hostId },
  } as Listing;

  beforeEach(async () => {
    bookingRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(async (entity) => entity),
      create: jest.fn((entity) => entity),
      update: jest.fn(),
    };
    listingRepository = { findOne: jest.fn() };
    earningRepository = {
      findOne: jest.fn(),
      save: jest.fn(async (entity) => entity),
    };
    availabilityService = { ensureDatesAreAvailable: jest.fn() };
    notificationsService = { createForUser: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: getRepositoryToken(Booking), useValue: bookingRepository },
        { provide: getRepositoryToken(Listing), useValue: listingRepository },
        {
          provide: getRepositoryToken(BookingEarning),
          useValue: earningRepository,
        },
        { provide: AvailabilityService, useValue: availabilityService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get(BookingsService);
  });

  it('calculates pricing for a valid booking request', async () => {
    listingRepository.findOne.mockResolvedValue(activeListing);
    bookingRepository.findOne.mockResolvedValue(null);

    const result = await service.getBookingPricingContext({
      listingId,
      checkIn: futureDate(5),
      checkOut: futureDate(7),
      guestCount: 2,
    });

    expect(result).toMatchObject({
      listing: activeListing,
      nights: 2,
      baseAmount: 251,
      cleaningFee: 42,
      serviceFee: 12.55,
    });
    expect(availabilityService.ensureDatesAreAvailable).toHaveBeenCalledWith(
      listingId,
      expect.any(Date),
      expect.any(Date),
    );
  });

  it('rejects overlapping bookings before availability checks', async () => {
    listingRepository.findOne.mockResolvedValue(activeListing);
    bookingRepository.findOne.mockResolvedValue({ id: 'overlap-booking' });

    await expect(
      service.getBookingPricingContext({
        listingId,
        checkIn: futureDate(10),
        checkOut: futureDate(12),
        guestCount: 2,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(availabilityService.ensureDatesAreAvailable).not.toHaveBeenCalled();
  });

  it('cancels a guest booking, voids unpaid earnings, and notifies the host', async () => {
    const booking = {
      id: bookingId,
      status: BookingStatus.Confirmed,
      bookedByUser: { id: guestId, name: 'Guest User' },
      listing: {
        id: listingId,
        title: 'Lake House',
        owner: { id: hostId },
        photos: [],
      },
      coupon: null,
    } as any;
    const earning = {
      id: 'earning-1',
      booking: { id: bookingId },
      status: EarningStatus.Unpaid,
    } as BookingEarning;

    bookingRepository.findOne
      .mockResolvedValueOnce(booking)
      .mockResolvedValueOnce(booking);
    earningRepository.findOne.mockResolvedValue(earning);

    const result = await service.cancelBookingForGuest(bookingId, guestId);

    expect(booking.status).toBe(BookingStatus.Cancelled);
    expect(earning.status).toBe(EarningStatus.Voided);
    expect(earningRepository.save).toHaveBeenCalledWith(earning);
    expect(notificationsService.createForUser).toHaveBeenCalledTimes(1);
    expect(notificationsService.createForUser).toHaveBeenCalledWith({
      userId: hostId,
      type: NotificationType.BookingCancelled,
      payload: expect.objectContaining({
        bookingId,
        listingId,
        actorId: guestId,
      }),
    });
    expect(result).toBe(booking);
  });

  it('does not complete a host reservation before checkout date', async () => {
    bookingRepository.findOne.mockResolvedValue({
      id: bookingId,
      status: BookingStatus.Confirmed,
      checkOut: futureDate(2),
      bookedByUser: { id: guestId },
      listing: { id: listingId, title: 'Lake House', owner: { id: hostId } },
    });

    await expect(
      service.completeBookingForHost(bookingId, hostId),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(bookingRepository.save).not.toHaveBeenCalled();
  });
});
