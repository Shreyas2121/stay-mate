import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { HostStatus } from '../enums/host-profile.enum';
import { User } from '../../users/entities/user.entity';

@Entity('hostProfile')
export class HostProfile extends BaseEntity {
  @Column()
  userId: string;

  @Column()
  legalName: string;

  @Column()
  phone: string;

  @Column('text')
  address: string;

  @Column()
  idType: string;

  @Column()
  idNumber: string;

  @Column('text')
  bankInfo: string;

  @Column({ type: 'enum', enum: HostStatus, default: HostStatus.Pending })
  status: HostStatus;

  @Column({ nullable: true, type: 'text' })
  rejectionReason: string;

  @Column({ nullable: true })
  submittedAt: Date;

  @Column({ nullable: true })
  reviewedAt: Date;

  @OneToOne(() => User, (user) => user.hostProfile)
  @JoinColumn()
  user: User;

  @ManyToOne(() => User)
  @JoinColumn()
  reviewedBy: User;
}
