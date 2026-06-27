import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PayoutStatus } from '../enums/payout.enum';
import { User } from '../../users/entities/user.entity';
import { BookingEarning } from '../../payments/entities/booking-earning.entity';

@Entity('payouts')
export class Payout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.payouts)
  @JoinColumn()
  host: User;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column()
  periodStart: Date;

  @Column()
  periodEnd: Date;

  @Column({ type: 'enum', enum: PayoutStatus, default: PayoutStatus.Pending })
  status: PayoutStatus;

  @OneToMany(() => BookingEarning, (earning) => earning.payout)
  earnings: BookingEarning[];

  @CreateDateColumn()
  createdAt: Date;
}
