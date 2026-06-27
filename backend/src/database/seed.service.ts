import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../modules/users/users.service';
import { UserRole, ActiveRole } from '../modules/users/enums/user.enum';
import { AmenityCategory } from '../modules/amenities/entities/amenity-category.entity';
import { Amenity } from '../modules/amenities/entities/amenity.entity';
import { Listing } from '../modules/listings/entities/listing.entity';
import { ListingPhoto } from '../modules/listings/entities/listing-photo.entity';
import { HostProfile } from '../modules/host-profiles/entities/host-profile.entity';
import { User } from '../modules/users/entities/user.entity';
import {
  ListingStatus,
  PropertyType,
} from '../modules/listings/enums/listing.enum';
import { HostStatus } from '../modules/host-profiles/enums/host-profile.enum';
import { Booking } from '../modules/bookings/entities/booking.entity';
import { BookingStatus } from '../modules/bookings/enums/booking.enum';
import { BookingEarning } from '../modules/payments/entities/booking-earning.entity';
import { EarningStatus } from '../modules/payments/enums/payment.enum';
import { Coupon } from '../modules/coupons/entities/coupon.entity';
import { DiscountType } from '../modules/coupons/enums/coupon.enum';
import { faker } from '@faker-js/faker';
import * as fs from 'fs';
import { join } from 'path';

const SEED_DATA = [
  {
    category: 'Essentials',
    description: 'Basic items for a comfortable stay',
    amenities: [
      { name: 'WiFi', icon: 'Wifi' },
      { name: 'Air conditioning', icon: 'Wind' },
      { name: 'Heating', icon: 'Thermometer' },
      { name: 'Hot water', icon: 'Droplet' },
    ],
  },
  {
    category: 'Kitchen',
    description: 'Cooking appliances and utilities',
    amenities: [
      { name: 'Full kitchen', icon: 'Utensils' },
      { name: 'Microwave', icon: 'ChefHat' },
      { name: 'Refrigerator', icon: 'Refrigerator' },
      { name: 'Coffee maker', icon: 'Coffee' },
    ],
  },
  {
    category: 'Bathroom',
    description: 'Bathroom necessities and items',
    amenities: [
      { name: 'Hair dryer', icon: 'Scissors' },
      { name: 'Bathtub', icon: 'Bath' },
      { name: 'Hot tub', icon: 'Waves' },
    ],
  },
  {
    category: 'Outdoor',
    description: 'Outdoor spaces and features',
    amenities: [
      { name: 'Parking', icon: 'Car' },
      { name: 'Garden', icon: 'Trees' },
      { name: 'BBQ grill', icon: 'Flame' },
      { name: 'Pool', icon: 'Waves' },
      { name: 'Beach access', icon: 'Sun' },
    ],
  },
  {
    category: 'Safety',
    description: 'Safety equipment and alarms',
    amenities: [
      { name: 'Smoke alarm', icon: 'Bell' },
      { name: 'Carbon monoxide alarm', icon: 'AlertTriangle' },
      { name: 'First aid kit', icon: 'Heart' },
      { name: 'Fire extinguisher', icon: 'Flame' },
    ],
  },
  {
    category: 'Work',
    description: 'Amenities suited for remote work',
    amenities: [
      { name: 'Dedicated workspace', icon: 'Laptop' },
      { name: 'High-speed WiFi', icon: 'Wifi' },
      { name: 'Printer', icon: 'Printer' },
    ],
  },
  {
    category: 'Accessibility',
    description: 'Features for accessibility support',
    amenities: [
      { name: 'Step-free access', icon: 'Accessibility' },
      { name: 'Wide entrance', icon: 'DoorOpen' },
      { name: 'Elevator', icon: 'ArrowUpDown' },
    ],
  },
  {
    category: 'Other',
    description: 'Custom host-defined amenities',
    amenities: [],
  },
];

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(AmenityCategory)
    private readonly amenityCategoryRepository: Repository<AmenityCategory>,
    @InjectRepository(Amenity)
    private readonly amenityRepository: Repository<Amenity>,
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(ListingPhoto)
    private readonly listingPhotoRepository: Repository<ListingPhoto>,
    @InjectRepository(HostProfile)
    private readonly hostProfileRepository: Repository<HostProfile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(BookingEarning)
    private readonly earningRepository: Repository<BookingEarning>,
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  async seed() {
    await this.seedAdminUser();
    await this.seedAmenities();
    await this.seedListings();
  }

  async seedBookingsAndPayments() {
    this.logger.log('Seeding bookings and payment records...');

    await this.clearSeededBookingsAndPayments();

    const guests = await this.userRepository.find({
      where: { role: UserRole.Guest },
      order: { createdAt: 'ASC' },
    });

    if (guests.length === 0) {
      this.logger.warn(
        'No guest users found. Skipping booking/payment seed.',
      );
      return;
    }

    const listings = await this.listingRepository.find({
      where: { status: ListingStatus.Active },
      relations: { owner: true },
      order: { createdAt: 'ASC' },
    });

    if (listings.length === 0) {
      this.logger.warn('No active listings found. Skipping booking/payment seed.');
      return;
    }

    const coupons = await this.fetchSeedableCoupons();
    if (coupons.length === 0) {
      this.logger.warn(
        'No active non-expired coupons found. Seeded bookings will not use coupons.',
      );
    }

    const minDate = this.startOfUtcDay(this.addDays(new Date(), 1));
    const maxDate = new Date(Date.UTC(2027, 4, 31));
    const listingCursor = new Map<string, Date>();
    const statuses = [
      BookingStatus.Pending,
      BookingStatus.Confirmed,
      BookingStatus.Completed,
      BookingStatus.Cancelled,
    ];
    const targetBookingCount = Math.min(24, listings.length * 2);
    const seededBookings: Booking[] = [];

    for (let i = 0; i < targetBookingCount; i++) {
      const listing = listings[i % listings.length];
      const guest = guests[i % guests.length];
      const status = statuses[i % statuses.length];

      const nights = this.getSeedBookingNights(listing);
      if (!nights) {
        this.logger.warn(
          `Skipping listing ${listing.id}; min/max nights cannot fit a seeded booking.`,
        );
        continue;
      }

      const checkIn = listingCursor.get(listing.id) ?? this.addDays(minDate, i);
      const checkOut = this.addDays(checkIn, nights);
      if (checkOut > maxDate) {
        this.logger.warn(
          `Skipping booking for listing ${listing.id}; generated date exceeds 2027-05-31.`,
        );
        continue;
      }
      listingCursor.set(listing.id, this.addDays(checkOut, 2));

      const coupon = i % 3 === 0 ? this.pickCouponForGuest(coupons, guest, i) : null;
      const booking = this.buildSeedBooking({
        listing,
        guest,
        coupon,
        checkIn,
        checkOut,
        nights,
        status,
        index: i,
      });

      const savedBooking = await this.bookingRepository.save(booking);
      seededBookings.push(savedBooking);

      if (
        status === BookingStatus.Confirmed ||
        status === BookingStatus.Completed
      ) {
        await this.seedBookingEarning(savedBooking, listing.owner);
      }
    }

    this.logger.log(
      `Seeded ${seededBookings.length} bookings and matching payment records.`,
    );
  }

  private async clearSeededBookingsAndPayments() {
    const rows = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('booking.id', 'id')
      .where('booking.stripeCheckoutSessionId LIKE :checkoutPrefix', {
        checkoutPrefix: 'cs_seed_%',
      })
      .orWhere('booking.stripePaymentIntentId LIKE :paymentPrefix', {
        paymentPrefix: 'pi_seed_%',
      })
      .getRawMany<{ id: string }>();

    const bookingIds = rows.map((row) => row.id);
    if (bookingIds.length === 0) {
      return;
    }

    await this.earningRepository
      .createQueryBuilder()
      .delete()
      .where('"bookingId" IN (:...bookingIds)', { bookingIds })
      .execute();

    await this.bookingRepository
      .createQueryBuilder()
      .delete()
      .where('id IN (:...bookingIds)', { bookingIds })
      .execute();

    this.logger.log(
      `Cleared ${bookingIds.length} previously seeded booking records.`,
    );
  }

  private async fetchSeedableCoupons() {
    return this.couponRepository
      .createQueryBuilder('coupon')
      .leftJoinAndSelect('coupon.user', 'user')
      .where('coupon.isActive = :isActive', { isActive: true })
      .andWhere('(coupon.expiryDate IS NULL OR coupon.expiryDate >= :now)', {
        now: new Date(),
      })
      .orderBy('coupon.createdAt', 'ASC')
      .getMany();
  }

  private pickCouponForGuest(coupons: Coupon[], guest: User, index: number) {
    const eligibleCoupons = coupons.filter(
      (coupon) => !coupon.user || coupon.user.id === guest.id,
    );

    if (eligibleCoupons.length === 0) {
      return null;
    }

    return eligibleCoupons[index % eligibleCoupons.length];
  }

  private buildSeedBooking({
    listing,
    guest,
    coupon,
    checkIn,
    checkOut,
    nights,
    status,
    index,
  }: {
    listing: Listing;
    guest: User;
    coupon: Coupon | null;
    checkIn: Date;
    checkOut: Date;
    nights: number;
    status: BookingStatus;
    index: number;
  }): Booking {
    const baseAmount = this.toCurrencyValue(Number(listing.price ?? 0) * nights);
    const cleaningFee = this.toCurrencyValue(Number(listing.cleaningFee ?? 0));
    const serviceFee = this.toCurrencyValue(baseAmount * 0.05);
    const discountAmount = coupon
      ? this.calculateCouponDiscount(coupon, baseAmount)
      : 0;
    const totalAmount = this.toCurrencyValue(
      baseAmount + cleaningFee + serviceFee - discountAmount,
    );
    const stripeCheckoutSessionId = `cs_seed_${status}_${index + 1}`;
    const stripePaymentIntentId =
      status === BookingStatus.Confirmed || status === BookingStatus.Completed
        ? `pi_seed_${status}_${index + 1}`
        : undefined;

    return this.bookingRepository.create({
      listing: { id: listing.id },
      bookedByUser: { id: guest.id },
      guestCount: Math.max(1, Math.min(Number(listing.maxGuests ?? 1), 2)),
      status,
      baseAmount,
      cleaningFee,
      serviceFee,
      discountAmount,
      coupon: coupon ? { id: coupon.id } : undefined,
      totalAmount,
      stripeCheckoutSessionId,
      stripePaymentIntentId,
      checkIn,
      checkOut,
    });
  }

  private async seedBookingEarning(booking: Booking, host: User) {
    const grossAmount = this.toCurrencyValue(Number(booking.baseAmount));
    const platformFee = this.toCurrencyValue(grossAmount * 0.02);
    const hostAmount = this.toCurrencyValue(grossAmount - platformFee);

    const earning = this.earningRepository.create({
      booking: { id: booking.id },
      host: { id: host.id },
      grossAmount,
      platformFee,
      hostAmount,
      status: EarningStatus.Unpaid,
    });

    await this.earningRepository.save(earning);
  }

  private calculateCouponDiscount(coupon: Coupon, baseAmount: number) {
    const discount = Number(coupon.discount ?? 0);

    if (coupon.discountType === DiscountType.Percent) {
      return this.toCurrencyValue(Math.min(baseAmount, (baseAmount * discount) / 100));
    }

    return this.toCurrencyValue(Math.min(discount, baseAmount));
  }

  private getSeedBookingNights(listing: Listing) {
    const minNights = Math.max(1, Number(listing.minNights ?? 1));
    const maxNights = Math.min(5, Number(listing.maxNights ?? 5));

    if (maxNights < minNights) {
      return null;
    }

    return minNights;
  }

  private addDays(date: Date, days: number) {
    const nextDate = new Date(date);
    nextDate.setUTCDate(nextDate.getUTCDate() + days);
    return nextDate;
  }

  private startOfUtcDay(date: Date) {
    const utcDate = new Date(date);
    utcDate.setUTCHours(0, 0, 0, 0);
    return utcDate;
  }

  private toCurrencyValue(value: number) {
    return Number(value.toFixed(2));
  }

  private async seedAdminUser() {
    const userCount = await this.usersService.count();

    if (userCount > 0) {
      this.logger.log('Admin user already exists. Skipping.');
      return;
    }

    this.logger.log('Seeding initial data...');

    const admin = await this.usersService.create({
      name: 'System Admin',
      email: 'admin@staymate.com',
      passwordHash: 'admin123',
      role: UserRole.Admin,
    });

    this.logger.log(`Created Admin User: ${admin.email}`);
  }

  private async seedAmenities() {
    const categoryCount = await this.amenityCategoryRepository.count();

    if (categoryCount > 0) {
      this.logger.log('Amenities categories already exist. Skipping.');
      return;
    }

    this.logger.log(
      'Seeding initial amenities categories and system amenities...',
    );

    for (const data of SEED_DATA) {
      const category = this.amenityCategoryRepository.create({
        name: data.category,
        description: data.description,
      });
      const savedCategory = await this.amenityCategoryRepository.save(category);

      for (const item of data.amenities) {
        const amenity = this.amenityRepository.create({
          name: item.name,
          icon: item.icon,
          isSystem: true,
          category: savedCategory,
        });
        await this.amenityRepository.save(amenity);
      }
    }

    this.logger.log('Seeding amenities complete!');
  }

  private async seedHosts(): Promise<User[]> {
    const existingHosts = await this.userRepository.find({
      where: [{ role: UserRole.Host }, { activeRole: ActiveRole.Host }],
      relations: { hostProfile: true },
    });

    if (existingHosts.length > 0) {
      this.logger.log(
        `Found ${existingHosts.length} existing hosts. Using them.`,
      );
      return existingHosts;
    }

    this.logger.log('No existing hosts found. Seeding 3 dummy hosts...');
    const dummyHostsData = [
      {
        name: 'Alice Host',
        email: 'alice@staymate.com',
        passwordHash: 'host123',
      },
      { name: 'Bob Host', email: 'bob@staymate.com', passwordHash: 'host123' },
      {
        name: 'Charlie Host',
        email: 'charlie@staymate.com',
        passwordHash: 'host123',
      },
    ];

    const seededHosts: User[] = [];

    for (const hostData of dummyHostsData) {
      try {
        let user = await this.userRepository.findOne({
          where: { email: hostData.email },
        });
        if (!user) {
          user = await this.usersService.create({
            name: hostData.name,
            email: hostData.email,
            passwordHash: hostData.passwordHash,
            role: UserRole.Host,
          });
          user.activeRole = ActiveRole.Host;
          user = await this.userRepository.save(user);
        }

        let hostProfile = await this.hostProfileRepository.findOne({
          where: { userId: user.id },
        });
        if (!hostProfile) {
          hostProfile = this.hostProfileRepository.create({
            userId: user.id,
            user: user,
            legalName: hostData.name,
            phone: '+15550199',
            address: '123 Host Way, Suite A',
            idType: 'Passport',
            idNumber: 'P1234567',
            bankInfo: 'Fake Bank Routing 123456789, Account 987654321',
            status: HostStatus.Verified,
            submittedAt: new Date(),
            reviewedAt: new Date(),
          });
          await this.hostProfileRepository.save(hostProfile);
        }

        seededHosts.push(user);
      } catch (error) {
        this.logger.error(
          `Failed to seed host ${hostData.email}: ${error.message}`,
        );
      }
    }

    return seededHosts;
  }

  private async seedListings() {
    this.logger.log('Clearing existing listings for fresh seeding...');
    await this.listingRepository
      .createQueryBuilder('listing')
      .delete()
      .execute();

    this.logger.log('Seeding listings...');

    // 1. Get hosts to distribute listings among
    const hosts = await this.seedHosts();
    if (hosts.length === 0) {
      this.logger.error(
        'No hosts available to assign listings to. Skipping listing seed.',
      );
      return;
    }

    // 2. Prepare photos
    const srcPic1 = join(process.cwd(), 'src', 'database', 'pic1.jpg');
    const srcPic2 = join(process.cwd(), 'src', 'database', 'pic2.jpg');
    const destDir = join(process.cwd(), 'uploads', 'listings');

    try {
      fs.mkdirSync(destDir, { recursive: true });
    } catch (err) {
      this.logger.warn(`Could not create uploads directory: ${err.message}`);
    }

    const destPic1 = join(destDir, 'seed-pic1.jpg');
    const destPic2 = join(destDir, 'seed-pic2.jpg');

    let photo1Path = 'uploads/listings/seed-pic1.jpg';
    let photo2Path = 'uploads/listings/seed-pic2.jpg';

    if (fs.existsSync(srcPic1)) {
      try {
        fs.copyFileSync(srcPic1, destPic1);
        this.logger.log(`Copied pic1.jpg to ${destPic1}`);
      } catch (err) {
        this.logger.error(`Failed to copy pic1.jpg: ${err.message}`);
      }
    } else {
      this.logger.warn(`pic1.jpg not found at ${srcPic1}`);
    }

    if (fs.existsSync(srcPic2)) {
      try {
        fs.copyFileSync(srcPic2, destPic2);
        this.logger.log(`Copied pic2.jpg to ${destPic2}`);
      } catch (err) {
        this.logger.error(`Failed to copy pic2.jpg: ${err.message}`);
      }
    } else {
      this.logger.warn(`pic2.jpg not found at ${srcPic2}`);
    }

    // Normalize paths for the DB
    photo1Path = photo1Path.replace(/\\/g, '/');
    photo2Path = photo2Path.replace(/\\/g, '/');

    // 3. Fetch amenities
    const allAmenities = await this.amenityRepository.find();
    if (allAmenities.length === 0) {
      this.logger.warn('No amenities found in database. Seed amenities first.');
    }

    // Define cities with coordinates
    const CITIES = [
      { name: 'New York, NY', lat: 40.7128, lng: -74.006 },
      { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
      { name: 'Miami, FL', lat: 25.7617, lng: -80.1918 },
      { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 },
      { name: 'Seattle, WA', lat: 47.6062, lng: -122.3321 },
      { name: 'Austin, TX', lat: 30.2672, lng: -97.7431 },
      { name: 'Chicago, IL', lat: 41.8781, lng: -87.6298 },
    ];

    // Define templates per PropertyType
    const LISTING_TEMPLATES = {
      [PropertyType.Apartment]: [
        {
          titleSuffix: 'Modern Downtown Studio',
          description:
            'A stylish and cozy studio apartment in the heart of downtown. Fully furnished with high-end appliances, floor-to-ceiling windows, and access to a shared rooftop terrace. Ideal for remote workers or weekend travelers.',
        },
        {
          titleSuffix: 'Luxury Skyline Penthouse',
          description:
            'Experience the city from above in this spectacular penthouse. Features modern designer furniture, a premium kitchen, floor-to-ceiling windows, and breathtaking panoramic views of the skyline.',
        },
        {
          titleSuffix: 'Charming Brick Industrial Loft',
          description:
            'A gorgeous loft with exposed brick walls, timber beams, and industrial charm. Located in a vibrant neighborhood close to cafes, art galleries, and transport links.',
        },
        {
          titleSuffix: 'Quiet Garden View Apartment',
          description:
            'A peaceful retreat from the bustling city. This ground-floor apartment looks out onto a lush courtyard garden and features modern amenities, a comfortable queen bed, and a private patio.',
        },
      ],
      [PropertyType.Villa]: [
        {
          titleSuffix: 'Luxury Waterfront Villa',
          description:
            'Spectacular waterfront villa featuring private beach access, a heated infinity pool, and a sprawling deck. Beautifully styled with coastal decor, it offers the ultimate high-end relaxation experience.',
        },
        {
          titleSuffix: 'Mediterranean Estate with Pool',
          description:
            'A grand Mediterranean-style estate nestled in a private enclave. Features beautifully landscaped gardens, an outdoor kitchen, a resort-style pool, and exquisite details throughout.',
        },
        {
          titleSuffix: 'Modernist Oasis Villa',
          description:
            'Stunning architectural villa highlighting clean lines and open-plan living. Glass walls open directly to a private swimming pool, fire pit, and comfortable outdoor lounge areas.',
        },
      ],
      [PropertyType.Cabin]: [
        {
          titleSuffix: 'Cozy A-Frame Forest Cabin',
          description:
            'Escape to the woods in this iconic A-Frame cabin. Surrounded by towering trees, it features a warm cedar interior, a wood-burning fireplace, and an outdoor hot tub perfect for stargazing.',
        },
        {
          titleSuffix: 'Rustic Mountain View Lodge',
          description:
            'A handcrafted log cabin situated on a scenic ridge with sweeping mountain views. Perfect for nature lovers, hikers, and anyone looking to unplug and enjoy peaceful mountain air.',
        },
        {
          titleSuffix: 'Secluded Lakefront Log Cabin',
          description:
            'Charming log cabin positioned directly on the lake shore. Comes with kayaks, a private dock, and an outdoor fire pit. An ideal base for fishing, paddling, and cozy evenings.',
        },
      ],
      [PropertyType.Room]: [
        {
          titleSuffix: 'Cozy Private Room in Art-Filled House',
          description:
            'A bright and cheerful private room in a welcoming, artistic home. Guests have access to a shared kitchen, a lovely backyard garden, and a quiet, tree-lined street location.',
        },
        {
          titleSuffix: 'Minimalist Suite with Private Bath',
          description:
            'A pristine private suite featuring a comfortable queen bed, a dedicated desk for remote work, and a modern attached private bathroom. Conveniently located near transit hubs.',
        },
        {
          titleSuffix: 'Charming Guest Room near Downtown',
          description:
            'Comfortable guest bedroom in a historic townhouse. Includes a small workspace, smart TV, and host-curated local guidebooks. Just a short walk to popular local cafes and parks.',
        },
      ],
    };

    const propertyTypes = [
      PropertyType.Apartment,
      PropertyType.Villa,
      PropertyType.Cabin,
      PropertyType.Room,
    ];

    // Generate 35 listings
    for (let i = 0; i < 35; i++) {
      const propertyType = propertyTypes[i % propertyTypes.length];
      const city = CITIES[i % CITIES.length];
      const owner = hosts[i % hosts.length];

      const templates = LISTING_TEMPLATES[propertyType];
      const template = templates[Math.floor(Math.random() * templates.length)];

      const cityNameOnly = city.name.split(',')[0];
      const title = `${template.titleSuffix} in ${cityNameOnly}`;

      let price = 100;
      let cleaningFee = 35;
      let maxGuests = 4;
      let bedrooms = 2;
      let bathrooms = 1;

      if (propertyType === PropertyType.Apartment) {
        price = faker.number.int({ min: 90, max: 240 });
        cleaningFee = faker.number.int({ min: 25, max: 60 });
        maxGuests = faker.number.int({ min: 2, max: 4 });
        bedrooms = faker.number.int({ min: 1, max: 2 });
        bathrooms = faker.number.int({ min: 1, max: 2 });
      } else if (propertyType === PropertyType.Villa) {
        price = faker.number.int({ min: 280, max: 750 });
        cleaningFee = faker.number.int({ min: 100, max: 220 });
        maxGuests = faker.number.int({ min: 6, max: 12 });
        bedrooms = faker.number.int({ min: 3, max: 6 });
        bathrooms = faker.number.int({ min: 2, max: 5 });
      } else if (propertyType === PropertyType.Cabin) {
        price = faker.number.int({ min: 110, max: 260 });
        cleaningFee = faker.number.int({ min: 40, max: 80 });
        maxGuests = faker.number.int({ min: 2, max: 6 });
        bedrooms = faker.number.int({ min: 1, max: 3 });
        bathrooms = faker.number.int({ min: 1, max: 2 });
      } else if (propertyType === PropertyType.Room) {
        price = faker.number.int({ min: 35, max: 85 });
        cleaningFee = faker.number.int({ min: 10, max: 25 });
        maxGuests = faker.number.int({ min: 1, max: 2 });
        bedrooms = 1;
        bathrooms = 1;
      }

      // Scatter markers slightly
      const latOffset = (Math.random() - 0.5) * 0.06;
      const lngOffset = (Math.random() - 0.5) * 0.06;
      const latitude = Number((city.lat + latOffset).toFixed(6));
      const longitude = Number((city.lng + lngOffset).toFixed(6));

      // Select random amenities
      let listingAmenities: Amenity[] = [];
      if (allAmenities.length > 0) {
        const count = faker.number.int({ min: 5, max: 10 });
        const shuffled = [...allAmenities].sort(() => 0.5 - Math.random());
        listingAmenities = shuffled.slice(0, count);
      }

      const listing = this.listingRepository.create({
        owner,
        title,
        description: template.description,
        price,
        locationText: `${faker.location.streetAddress()}, ${city.name}`,
        latitude,
        longitude,
        maxGuests,
        bedrooms,
        bathrooms,
        status: ListingStatus.Active,
        cleaningFee,
        propertyType,
        minNights: faker.number.int({ min: 1, max: 2 }),
        maxNights: faker.number.int({ min: 14, max: 30 }),
        checkInTime: '15:00',
        checkOutTime: '11:00',
        additionalInfo:
          'Please respect quiet hours after 10 PM. No smoking inside.',
        amenities: listingAmenities,
      });

      const savedListing = await this.listingRepository.save(listing);

      // Save photos
      const photo1 = this.listingPhotoRepository.create({
        listingId: savedListing.id,
        listing: savedListing,
        picture: photo1Path,
        displayOrder: 0,
        label: 'Living Room',
      });
      const photo2 = this.listingPhotoRepository.create({
        listingId: savedListing.id,
        listing: savedListing,
        picture: photo2Path,
        displayOrder: 1,
        label: 'Interior Space',
      });

      await this.listingPhotoRepository.save([photo1, photo2]);
    }

    this.logger.log('Successfully seeded 35 dummy listings.');
  }
}
