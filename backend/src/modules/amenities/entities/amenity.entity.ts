import { Column, Entity, JoinColumn, ManyToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AmenityCategory } from './amenity-category.entity';
import { Listing } from '../../listings/entities/listing.entity';

@Entity('amenities')
export class Amenity extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  icon: string;

  @ManyToOne(() => AmenityCategory, (category) => category.amenities)
  @JoinColumn()
  category: AmenityCategory;

  @Column({ default: true })
  isSystem: boolean;

  @ManyToMany(() => Listing, (listing) => listing.amenities)
  listings: Listing[];
}
