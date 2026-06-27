import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingsService } from './bookings.service';

@Injectable()
export class BookingsCron {
  private readonly logger = new Logger(BookingsCron.name);

  constructor(private readonly bookingsService: BookingsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async completePastBookings() {
    const result = await this.bookingsService.completeEligibleBookings();

    if (result.completedCount > 0) {
      this.logger.log(`Auto-completed ${result.completedCount} booking(s).`);
    }
  }
}
