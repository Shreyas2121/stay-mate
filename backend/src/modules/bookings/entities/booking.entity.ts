import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BookingStatus } from '../enums/booking.enum';
import { Listing } from '../../listings/entities/listing.entity';
import { User } from '../../users/entities/user.entity';
import { Coupon } from '../../coupons/entities/coupon.entity';
import { BookingEarning } from '../../payments/entities/booking-earning.entity';
import { Conversation } from '../../messages/entities/conversation.entity';
import { Review } from '../../reviews/entities/review.entity';

@Entity('booking')
export class Booking extends BaseEntity {
  @ManyToOne(() => Listing, (listing) => listing.bookings)
  @JoinColumn()
  listing: Listing;

  @ManyToOne(() => User, (user) => user.bookings)
  @JoinColumn()
  bookedByUser: User;

  @Column()
  guestCount: number;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.Pending })
  status: BookingStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  baseAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cleaningFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  serviceFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @ManyToOne(() => Coupon, (coupon) => coupon.bookings, { nullable: true })
  @JoinColumn()
  coupon: Coupon;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ nullable: true })
  stripePaymentIntentId: string;

  @Column()
  checkIn: Date;

  @Column()
  checkOut: Date;

  @Column({ nullable: true })
  stripeCheckoutSessionId: string;

  @OneToOne(() => BookingEarning, (earning) => earning.booking)
  earning: BookingEarning;

  @OneToOne(() => Conversation, (conversation) => conversation.booking)
  conversation: Conversation;

  @OneToMany(() => Review, (review) => review.booking)
  reviews: Review[];
}
