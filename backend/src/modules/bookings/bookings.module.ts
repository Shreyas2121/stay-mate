import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Listing } from '../listings/entities/listing.entity';
import { AvailabilityModule } from '../availability/availability.module';
import { User } from '../users/entities/user.entity';
import { BookingEarning } from '../payments/entities/booking-earning.entity';
import { BookingsCron } from './bookings.cron';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Listing, User, BookingEarning]),
    AvailabilityModule,
    NotificationsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsCron],
  exports: [BookingsService],
})
export class BookingsModule {}


