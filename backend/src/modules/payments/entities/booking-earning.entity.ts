import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EarningStatus } from '../enums/payment.enum';
import { Booking } from '../../bookings/entities/booking.entity';
import { User } from '../../users/entities/user.entity';
import { Payout } from '../../payouts/entities/payout.entity';

@Entity('booking_earnings')
export class BookingEarning {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Booking, (booking) => booking.earning)
  @JoinColumn()
  booking: Booking;

  @ManyToOne(() => User, (user) => user.earnings)
  @JoinColumn()
  host: User;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  grossAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  platformFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  hostAmount: number;

  @Column({ type: 'enum', enum: EarningStatus, default: EarningStatus.Unpaid })
  status: EarningStatus;

  @ManyToOne(() => Payout, (payout) => payout.earnings, { nullable: true })
  @JoinColumn()
  payout: Payout;

  @CreateDateColumn()
  createdAt: Date;
}
