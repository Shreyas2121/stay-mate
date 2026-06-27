import { CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { User } from '../../users/entities/user.entity';
import { Message } from './message.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Booking, (booking) => booking.conversation, { nullable: false })
  @JoinColumn()
  booking: Booking;

  @ManyToOne(() => User, (user) => user.guestConversations, { nullable: false })
  @JoinColumn()
  guest: User;

  @ManyToOne(() => User, (user) => user.hostConversations, { nullable: false })
  @JoinColumn()
  host: User;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;
}

