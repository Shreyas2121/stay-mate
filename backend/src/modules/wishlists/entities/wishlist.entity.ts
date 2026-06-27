import { CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Listing } from '../../listings/entities/listing.entity';

@Entity('wishlists')
@Index(['user', 'listing'], { unique: true })
export class Wishlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.wishlists)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Listing, (listing) => listing.wishlists)
  @JoinColumn()
  listing: Listing;

  @CreateDateColumn()
  createdAt: Date;
}
