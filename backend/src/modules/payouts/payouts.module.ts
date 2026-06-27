import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingEarning } from '../payments/entities/booking-earning.entity';
import { Payout } from './entities/payout.entity';
import { PayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([BookingEarning, Payout]), NotificationsModule],
  controllers: [PayoutsController],
  providers: [PayoutsService],
  exports: [PayoutsService],
})
export class PayoutsModule {}
