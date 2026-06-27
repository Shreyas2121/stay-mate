import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { DiscountType } from '../enums/coupon.enum';
import { User } from '../../users/entities/user.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('coupons')
export class Coupon extends BaseEntity {
  @Column({ unique: true })
  code: string;

  @Column({ type: 'enum', enum: DiscountType })
  discountType: DiscountType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discount: number;

  @Column({ type: 'timestamp', nullable: true })
  expiryDate: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  user: User | null;

  @Column({ default: false })
  isPublic: boolean;

  @OneToMany(() => Booking, (booking) => booking.coupon)
  bookings: Booking[];
}
