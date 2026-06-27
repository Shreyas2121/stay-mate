import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Amenity } from './amenity.entity';

@Entity('amenityCategories')
export class AmenityCategory extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @OneToMany(() => Amenity, (amenity) => amenity.category)
  amenities: Amenity[];
}
