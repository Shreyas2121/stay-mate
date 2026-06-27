import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { validate } from 'class-validator';
import { Booking } from '../bookings/entities/booking.entity';
import { BookingStatus } from '../bookings/enums/booking.enum';
import { Listing } from '../listings/entities/listing.entity';
import { UserRole } from '../users/enums/user.enum';
import { CreateReviewDto } from './dto/create-review.dto';
import { Review } from './entities/review.entity';
import { ReviewType } from './enums/review.enum';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
    findAndCount: jest.Mock;
  };
  let bookingRepository: { findOne: jest.Mock };
  let listingRepository: { findOne: jest.Mock };

  const bookingId = '11111111-1111-4111-8111-111111111111';
  const guestId = '22222222-2222-4222-8222-222222222222';
  const hostId = '33333333-3333-4333-8333-333333333333';
  const outsiderId = '44444444-4444-4444-8444-444444444444';
  const listingId = '55555555-5555-4555-8555-555555555555';

  const completedBooking = {
    id: bookingId,
    status: BookingStatus.Completed,
    checkIn: new Date('2026-01-01'),
    checkOut: new Date('2026-01-05'),
    bookedByUser: { id: guestId, name: 'Guest' },
    listing: {
      id: listingId,
      title: 'Lake House',
      owner: { id: hostId, name: 'Host' },
    },
  };

  const savedReview = {
    id: '66666666-6666-4666-8666-666666666666',
    rating: 5,
    comment: 'Great stay',
    type: ReviewType.GuestToHost,
    createdAt: new Date('2026-01-06'),
    updatedAt: new Date('2026-01-06'),
    booking: completedBooking,
    reviewer: completedBooking.bookedByUser,
    reviewee: completedBooking.listing.owner,
  };

  beforeEach(async () => {
    reviewRepository = {
      create: jest.fn((entity) => entity),
      save: jest.fn(async (entity) => ({ ...entity, id: savedReview.id })),
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
    };
    bookingRepository = { findOne: jest.fn() };
    listingRepository = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getRepositoryToken(Review), useValue: reviewRepository },
        { provide: getRepositoryToken(Booking), useValue: bookingRepository },
        { provide: getRepositoryToken(Listing), useValue: listingRepository },
      ],
    }).compile();

    service = module.get(ReviewsService);
  });

  it('creates a guest-to-host review for a completed booking', async () => {
    bookingRepository.findOne.mockResolvedValue(completedBooking);
    reviewRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(savedReview);

    const result = await service.createReview(guestId, {
      bookingId,
      rating: 5,
      comment: 'Great stay',
    });

    expect(reviewRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        booking: { id: bookingId },
        reviewer: { id: guestId },
        reviewee: { id: hostId },
        type: ReviewType.GuestToHost,
      }),
    );
    expect(result).toMatchObject({
      id: savedReview.id,
      type: ReviewType.GuestToHost,
      reviewer: { id: guestId },
      reviewee: { id: hostId },
    });
  });

  it('rejects host-to-guest reviews', async () => {
    bookingRepository.findOne.mockResolvedValue(completedBooking);

    await expect(
      service.createReview(hostId, { bookingId, rating: 4 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects reviews for bookings that are not completed', async () => {
    bookingRepository.findOne.mockResolvedValue({
      ...completedBooking,
      status: BookingStatus.Confirmed,
    });

    await expect(
      service.createReview(guestId, { bookingId, rating: 5 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects non-participants', async () => {
    bookingRepository.findOne.mockResolvedValue(completedBooking);

    await expect(
      service.createReview(outsiderId, { bookingId, rating: 5 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects duplicate same-direction reviews', async () => {
    bookingRepository.findOne.mockResolvedValue(completedBooking);
    reviewRepository.findOne.mockResolvedValue(savedReview);

    await expect(
      service.createReview(guestId, { bookingId, rating: 5 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('queries listing reviews as guest-to-host reviews only', async () => {
    listingRepository.findOne.mockResolvedValue({ id: listingId });
    reviewRepository.findAndCount.mockResolvedValue([[savedReview], 1]);

    const result = await service.getReviewsForListing(listingId, {
      page: 1,
      limit: 20,
    });

    expect(reviewRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          type: ReviewType.GuestToHost,
          booking: { listing: { id: listingId } },
        },
      }),
    );
    expect(result.total).toBe(1);
  });

  it('validates rating range on create DTO', async () => {
    const dto = Object.assign(new CreateReviewDto(), {
      bookingId,
      rating: 6,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'rating')).toBe(true);
  });

  it('allows booking review reads for admins', async () => {
    bookingRepository.findOne.mockResolvedValue(completedBooking);
    reviewRepository.find.mockResolvedValue([savedReview]);

    const result = await service.getReviewsForBooking(bookingId, {
      id: outsiderId,
      role: UserRole.Admin,
    } as any);

    expect(result).toHaveLength(1);
  });
});

