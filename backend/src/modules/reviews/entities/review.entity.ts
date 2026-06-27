import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ReviewType } from '../enums/review.enum';
import { Booking } from '../../bookings/entities/booking.entity';
import { User } from '../../users/entities/user.entity';

@Entity('reviews')
@Unique('UQ_reviews_booking_type', ['booking', 'type'])
export class Review extends BaseEntity {
  @ManyToOne(() => Booking, (booking) => booking.reviews, { nullable: false })
  @JoinColumn()
  booking: Booking;

  @ManyToOne(() => User, (user) => user.reviewsGiven, { nullable: false })
  @JoinColumn()
  reviewer: User;

  @ManyToOne(() => User, (user) => user.reviewsReceived, { nullable: false })
  @JoinColumn()
  reviewee: User;

  @Column()
  rating: number;

  @Column({ nullable: true, type: 'text' })
  comment: string;

  @Column({ type: 'enum', enum: ReviewType })
  type: ReviewType;
}

