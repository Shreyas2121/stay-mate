import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { BookingStatus } from '../bookings/enums/booking.enum';
import { Listing } from '../listings/entities/listing.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user.enum';
import { CreateReviewDto } from './dto/create-review.dto';
import { GetReviewsQueryDto } from './dto/get-reviews-query.dto';
import { Review } from './entities/review.entity';
import { ReviewType } from './enums/review.enum';

@Injectable()
export class ReviewsService {
  private readonly reviewRelations = {
    booking: {
      listing: true,
    },
    reviewer: true,
    reviewee: true,
  };

  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
  ) {}

  async createReview(userId: string, dto: CreateReviewDto) {
    const booking = await this.bookingRepository.findOne({
      where: { id: dto.bookingId },
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

    if (booking.status !== BookingStatus.Completed) {
      throw new BadRequestException(
        'Reviews can only be submitted for completed bookings',
      );
    }

    const guestId = booking.bookedByUser.id;
    const hostId = booking.listing.owner.id;

    if (guestId === hostId) {
      throw new BadRequestException('Cannot review yourself');
    }

    const isGuest = guestId === userId;

    if (!isGuest) {
      throw new ForbiddenException('Only guests can review completed stays');
    }

    const type = ReviewType.GuestToHost;
    const revieweeId = hostId;

    const existingReview = await this.reviewRepository.findOne({
      where: {
        booking: { id: dto.bookingId },
        type,
      },
    });

    if (existingReview) {
      throw new BadRequestException('Review already submitted for this booking');
    }

    const review = this.reviewRepository.create({
      booking: { id: dto.bookingId },
      reviewer: { id: userId },
      reviewee: { id: revieweeId },
      rating: dto.rating,
      comment: dto.comment?.trim() || undefined,
      type,
    });

    const savedReview = await this.reviewRepository.save(review);
    return this.findReviewById(savedReview.id);
  }

  async getReviewsReceivedByUser(userId: string, query: GetReviewsQueryDto) {
    const where: FindOptionsWhere<Review> = {
      reviewee: { id: userId },
      ...(query.type ? { type: query.type } : {}),
    };

    return this.findPaginated(where, query);
  }

  async getReviewsForListing(listingId: string, query: GetReviewsQueryDto) {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return this.findPaginated(
      {
        type: ReviewType.GuestToHost,
        booking: { listing: { id: listingId } },
      },
      query,
    );
  }

  async getReviewsForBooking(bookingId: string, user: User) {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: {
        bookedByUser: true,
        listing: {
          owner: true,
        },
      },
    });

    const isGuest = booking?.bookedByUser?.id === user.id;
    const isHost = booking?.listing?.owner?.id === user.id;
    const isAdmin = user.role === UserRole.Admin;

    if (!booking || (!isGuest && !isHost && !isAdmin)) {
      throw new NotFoundException('Booking not found');
    }

    const reviews = await this.reviewRepository.find({
      where: { booking: { id: bookingId } },
      relations: this.reviewRelations,
      order: { createdAt: 'DESC' },
    });

    return reviews.map((review) => this.mapReview(review));
  }

  private async findReviewById(id: string) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: this.reviewRelations,
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.mapReview(review);
  }

  private async findPaginated(
    where: FindOptionsWhere<Review>,
    query: GetReviewsQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where,
      relations: this.reviewRelations,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      reviews: reviews.map((review) => this.mapReview(review)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private mapReview(review: Review) {
    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      type: review.type,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      booking: review.booking
        ? {
            id: review.booking.id,
            checkIn: review.booking.checkIn,
            checkOut: review.booking.checkOut,
            listing: review.booking.listing
              ? {
                  id: review.booking.listing.id,
                  title: review.booking.listing.title,
                }
              : null,
          }
        : null,
      reviewer: this.mapUser(review.reviewer),
      reviewee: this.mapUser(review.reviewee),
    };
  }

  private mapUser(user?: User) {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };
  }
}


