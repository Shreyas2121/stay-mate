import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Listing } from '../../listings/entities/listing.entity';

@Entity('availabilityBlocks')
export class AvailabilityBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Listing, (listing) => listing.availabilityBlocks)
  @JoinColumn()
  listing: Listing;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({ nullable: true, type: 'text' })
  reason: string | null;
}
