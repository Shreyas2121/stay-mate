import { Controller, Post, Get, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { VerifyBookingDto } from './dto/verify-booking.dto';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('verify')
  @Auth()
  @ApiOperation({ summary: 'Verify booking dates and guest capacity' })
  @ApiResponse({ status: 200, description: 'Booking dates and details are valid and available' })
  @ApiResponse({ status: 400, description: 'Validation failed (e.g. invalid dates, overlapping bookings, etc)' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async verifyBooking(@Body() dto: VerifyBookingDto) {
    return this.bookingsService.verifyBooking(dto);
  }

  @Get('my')
  @Auth()
  @ApiOperation({ summary: 'Get bookings made by the current guest' })
  @ApiResponse({ status: 200, description: 'Guest bookings returned' })
  async getMyBookings(@CurrentUser() user: User) {
    return this.bookingsService.findMyBookings(user.id);
  }

  @Get('host')
  @Auth()
  @ApiOperation({ summary: 'Get bookings for listings owned by the current host' })
  @ApiResponse({ status: 200, description: 'Host reservations returned' })
  async getHostBookings(@CurrentUser() user: User) {
    return this.bookingsService.findHostBookings(user.id);
  }

  @Post(':id/cancel')
  @Auth()
  @ApiOperation({ summary: 'Cancel the current guest booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled' })
  @ApiResponse({ status: 400, description: 'Booking cannot be cancelled from its current status' })
  @ApiResponse({ status: 403, description: 'Current user does not own this booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async cancelMyBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.bookingsService.cancelBookingForGuest(id, user.id);
  }

  @Post(':id/host-cancel')
  @Auth()
  @ApiOperation({ summary: 'Cancel a confirmed reservation for a listing owned by the current host' })
  @ApiResponse({ status: 200, description: 'Reservation cancelled' })
  @ApiResponse({ status: 400, description: 'Reservation cannot be cancelled from its current status' })
  @ApiResponse({ status: 403, description: 'Current user does not own the listing for this booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async cancelHostReservation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.bookingsService.cancelBookingForHost(id, user.id);
  }

  @Post(':id/complete')
  @Auth()
  @ApiOperation({ summary: 'Mark a confirmed reservation complete after checkout date' })
  @ApiResponse({ status: 200, description: 'Reservation completed' })
  @ApiResponse({ status: 400, description: 'Reservation cannot be completed yet' })
  @ApiResponse({ status: 403, description: 'Current user does not own the listing for this booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async completeHostReservation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.bookingsService.completeBookingForHost(id, user.id);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Get a booking by ID for the guest or listing owner' })
  @ApiResponse({ status: 200, description: 'Booking details returned' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getBookingById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.bookingsService.findByIdForParticipant(id, user.id);
  }
}


