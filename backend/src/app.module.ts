import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validate } from './config/env.validation';
import { stripeConfig } from './config/stripe.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { HostProfilesModule } from './modules/host-profiles/host-profiles.module';
import { AdminModule } from './modules/admin/admin.module';

import { AmenitiesModule } from './modules/amenities/amenities.module';
import { SeedService } from './database/seed.service';
import { AmenityCategory } from './modules/amenities/entities/amenity-category.entity';
import { Amenity } from './modules/amenities/entities/amenity.entity';
import { Listing } from './modules/listings/entities/listing.entity';
import { ListingPhoto } from './modules/listings/entities/listing-photo.entity';
import { HostProfile } from './modules/host-profiles/entities/host-profile.entity';
import { User } from './modules/users/entities/user.entity';
import { Booking } from './modules/bookings/entities/booking.entity';
import { BookingEarning } from './modules/payments/entities/booking-earning.entity';
import { Coupon } from './modules/coupons/entities/coupon.entity';
import { AvailabilityBlock } from './modules/availability/entities/availability-block.entity';
import { Conversation } from './modules/messages/entities/conversation.entity';
import { Message } from './modules/messages/entities/message.entity';
import { Notification } from './modules/notifications/entities/notification.entity';
import { Payout } from './modules/payouts/entities/payout.entity';
import { Review } from './modules/reviews/entities/review.entity';
import { Wishlist } from './modules/wishlists/entities/wishlist.entity';
import { ListingsModule } from './modules/listings/listings.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { MessagesModule } from './modules/messages/messages.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ScheduleModule } from '@nestjs/schedule';
@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      load: [stripeConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [
          AmenityCategory,
          Amenity,
          AvailabilityBlock,
          Booking,
          BookingEarning,
          Conversation,
          Coupon,
          HostProfile,
          Listing,
          ListingPhoto,
          Message,
          Notification,
          Payout,
          Review,
          User,
          Wishlist,
        ],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    TypeOrmModule.forFeature([
      AmenityCategory,
      Amenity,
      Listing,
      ListingPhoto,
      HostProfile,
      User,
      Booking,
      BookingEarning,
      Coupon,
      AvailabilityBlock,
      Conversation,
      Message,
      Notification,
      Payout,
      Review,
      Wishlist,
    ]),
    UsersModule,
    AuthModule,
    HostProfilesModule,
    AdminModule,
    AmenitiesModule,
    ListingsModule,
    BookingsModule,
    CouponsModule,
    AvailabilityModule,
    PaymentsModule,
    PayoutsModule,
    ReviewsModule,
    MessagesModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}





