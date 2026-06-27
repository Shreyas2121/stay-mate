import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Listing } from './listing.entity';

@Entity('listingPhotos')
export class ListingPhoto extends BaseEntity {
  @Column({ type: 'uuid' })
  listingId: string;

  @ManyToOne(() => Listing, (listing) => listing.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listingId' })
  listing: Listing;

  @Column()
  picture: string;

  @Column({ nullable: true })
  label: string;

  @Column({ nullable: true })
  displayOrder: number;
}
