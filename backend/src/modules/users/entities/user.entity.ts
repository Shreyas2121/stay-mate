import { Column, Entity, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ActiveRole, UserRole } from '../enums/user.enum';
import { HostProfile } from '../../host-profiles/entities/host-profile.entity';
import { Listing } from '../../listings/entities/listing.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { BookingEarning } from '../../payments/entities/booking-earning.entity';
import { Payout } from '../../payouts/entities/payout.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Conversation } from '../../messages/entities/conversation.entity';
import { Message } from '../../messages/entities/message.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { Wishlist } from '../../wishlists/entities/wishlist.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ nullable: true })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true, type: 'text' })
  bio: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.Guest })
  role: UserRole;

  @Column({ type: 'enum', enum: ActiveRole, default: ActiveRole.Guest })
  activeRole: ActiveRole;

  @OneToOne(() => HostProfile, (hostProfile) => hostProfile.user)
  hostProfile: HostProfile;

  @OneToMany(() => Listing, (listing) => listing.owner)
  listings: Listing[];

  @OneToMany(() => Booking, (booking) => booking.bookedByUser)
  bookings: Booking[];

  @OneToMany(() => BookingEarning, (earning) => earning.host)
  earnings: BookingEarning[];

  @OneToMany(() => Payout, (payout) => payout.host)
  payouts: Payout[];

  @OneToMany(() => Review, (review) => review.reviewer)
  reviewsGiven: Review[];

  @OneToMany(() => Review, (review) => review.reviewee)
  reviewsReceived: Review[];

  @OneToMany(() => Conversation, (conversation) => conversation.guest)
  guestConversations: Conversation[];

  @OneToMany(() => Conversation, (conversation) => conversation.host)
  hostConversations: Conversation[];

  @OneToMany(() => Message, (message) => message.sender)
  messages: Message[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => Wishlist, (wishlist) => wishlist.user)
  wishlists: Wishlist[];
}
