import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { GetReviewsQueryDto } from './dto/get-reviews-query.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Auth()
  @ApiOperation({ summary: 'Submit a review for a completed booking' })
  @ApiResponse({ status: 201, description: 'Review submitted' })
  @ApiResponse({ status: 400, description: 'Booking cannot be reviewed' })
  @ApiResponse({ status: 403, description: 'Current user is not a booking participant' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async createReview(
    @CurrentUser() user: User,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(user.id, dto);
  }

  @Get('users/:userId/received')
  @ApiOperation({ summary: 'Get public reviews received by a user' })
  async getUserReviews(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: GetReviewsQueryDto,
  ) {
    return this.reviewsService.getReviewsReceivedByUser(userId, query);
  }

  @Get('listings/:listingId')
  @ApiOperation({ summary: 'Get public guest reviews for a listing' })
  async getListingReviews(
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @Query() query: GetReviewsQueryDto,
  ) {
    return this.reviewsService.getReviewsForListing(listingId, query);
  }

  @Get('bookings/:bookingId')
  @Auth()
  @ApiOperation({ summary: 'Get reviews for a booking as participant or admin' })
  async getBookingReviews(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @CurrentUser() user: User,
  ) {
    return this.reviewsService.getReviewsForBooking(bookingId, user);
  }
}
