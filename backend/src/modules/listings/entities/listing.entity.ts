import { Column, Entity, JoinColumn, ManyToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ListingStatus, PropertyType } from '../enums/listing.enum';
import { User } from '../../users/entities/user.entity';
import { ListingPhoto } from './listing-photo.entity';
import { Amenity } from '../../amenities/entities/amenity.entity';
import { AvailabilityBlock } from '../../availability/entities/availability-block.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { Wishlist } from '../../wishlists/entities/wishlist.entity';

@Entity('listing')
export class Listing extends BaseEntity {
  @ManyToOne(() => User, (user) => user.listings)
  @JoinColumn()
  owner: User;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column()
  locationText: string;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  longitude: number;

  @Column({ nullable: true })
  maxGuests: number;

  @Column({ nullable: true })
  bedrooms: number;

  @Column({ nullable: true })
  bathrooms: number;

  @Column({ type: 'enum', enum: ListingStatus, default: ListingStatus.Draft })
  status: ListingStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cleaningFee: number;

  @Column({ type: 'enum', enum: PropertyType })
  propertyType: PropertyType;

  @Column({ nullable: true })
  minNights: number;

  @Column({ nullable: true })
  maxNights: number;

  @Column({ type: 'time' })
  checkInTime: string;

  @Column({ type: 'time' })
  checkOutTime: string;

  @Column({ nullable: true, type: 'text' })
  additionalInfo: string;

  @OneToMany(() => ListingPhoto, (photo) => photo.listing)
  photos: ListingPhoto[];

  @ManyToMany(() => Amenity, (amenity) => amenity.listings)
  @JoinTable({ name: 'amenitiesListing' })
  amenities: Amenity[];

  @OneToMany(() => AvailabilityBlock, (block) => block.listing)
  availabilityBlocks: AvailabilityBlock[];

  @OneToMany(() => Booking, (booking) => booking.listing)
  bookings: Booking[];

  @OneToMany(() => Wishlist, (wishlist) => wishlist.listing)
  wishlists: Wishlist[];
}
