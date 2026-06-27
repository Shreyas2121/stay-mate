import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Listing } from './entities/listing.entity';
import { ListingPhoto } from './entities/listing-photo.entity';
import { Amenity } from '../amenities/entities/amenity.entity';
import { AmenityCategory } from '../amenities/entities/amenity-category.entity';
import { User } from '../users/entities/user.entity';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { GetListingsFilterDto, ListingSortOption } from './dto/get-listings-filter.dto';
import { ListingStatus } from './enums/listing.enum';
import { unlink } from 'fs/promises';

@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(ListingPhoto)
    private readonly listingPhotoRepository: Repository<ListingPhoto>,
    @InjectRepository(Amenity)
    private readonly amenityRepository: Repository<Amenity>,
    @InjectRepository(AmenityCategory)
    private readonly amenityCategoryRepository: Repository<AmenityCategory>,
  ) {}

  async createListing(
    owner: User,
    dto: CreateListingDto,
    files: Express.Multer.File[],
  ): Promise<Listing> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create listing instance
      const listing = queryRunner.manager.create(Listing, {
        owner,
        title: dto.title,
        description: dto.description,
        price: dto.price,
        locationText: dto.locationText,
        latitude: dto.latitude,
        longitude: dto.longitude,
        maxGuests: dto.maxGuests,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        cleaningFee: dto.cleaningFee,
        propertyType: dto.propertyType,
        minNights: dto.minNights,
        maxNights: dto.maxNights,
        checkInTime: dto.checkInTime,
        checkOutTime: dto.checkOutTime,
        additionalInfo: dto.additionalInfo,
        status: dto.status,
      });

      // 2. Resolve system amenities
      let resolvedAmenities: Amenity[] = [];
      if (dto.amenityIds && dto.amenityIds.length > 0) {
        resolvedAmenities = await queryRunner.manager.find(Amenity, {
          where: { id: In(dto.amenityIds) },
        });
      }

      // 3. Resolve/Create custom amenities
      if (dto.customAmenities && dto.customAmenities.length > 0) {
        const otherCategory = await queryRunner.manager.findOne(AmenityCategory, {
          where: { name: 'Other' },
        });

        if (!otherCategory) {
          throw new InternalServerErrorException(
            'System amenity category "Other" not found. Please run database seeding.',
          );
        }

        for (const customName of dto.customAmenities) {
          const trimmedName = customName.trim();
          if (!trimmedName) continue;

          // Check case-insensitive if custom amenity exists
          let amenity = await queryRunner.manager
            .createQueryBuilder(Amenity, 'amenity')
            .where('LOWER(amenity.name) = LOWER(:name)', { name: trimmedName })
            .andWhere('amenity.isSystem = :isSystem', { isSystem: false })
            .getOne();

          if (!amenity) {
            amenity = queryRunner.manager.create(Amenity, {
              name: trimmedName,
              isSystem: false,
              category: otherCategory,
            });
            amenity = await queryRunner.manager.save(Amenity, amenity);
          }

          resolvedAmenities.push(amenity);
        }
      }

      listing.amenities = resolvedAmenities;

      // 4. Save listing
      const savedListing = await queryRunner.manager.save(Listing, listing);

      // 5. Save uploaded photos
      if (files && files.length > 0) {
        const photoEntities = files.map((file, index) => {
          return queryRunner.manager.create(ListingPhoto, {
            listingId: savedListing.id,
            listing: savedListing,
            picture: file.path.replace(/\\/g, '/'), // normalization for Windows paths
            displayOrder: index,
          });
        });
        await queryRunner.manager.save(ListingPhoto, photoEntities);
      }

      await queryRunner.commitTransaction();

      // Retrieve full listing with relations
      const result = await this.listingRepository.findOne({
        where: { id: savedListing.id },
        relations: {
          photos: true,
          amenities: {
            category: true,
          },
        },
      });

      if (!result) {
        throw new NotFoundException('Listing not found after creation');
      }

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      // Clean up files on disk since database transaction failed
      this.logger.warn(`Transaction failed. Cleaning up ${files.length} uploaded files.`);
      await this.cleanupPhysicalFiles(files.map(f => f.path));

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateListing(
    id: string,
    owner: User,
    dto: UpdateListingDto,
    files: Express.Multer.File[] = [],
  ): Promise<Listing> {
    const listing = await this.listingRepository.findOne({
      where: { id },
      relations: {
        owner: true,
        photos: true,
        amenities: true,
      },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }

    if (listing.owner.id !== owner.id) {
      throw new ForbiddenException('You do not own this listing');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let photosToDelete: ListingPhoto[] = [];

    try {
      // 1. Update basic properties
      const { amenityIds, customAmenities, deletedPhotoIds, photoOrder, ...basicFields } = dto;
      queryRunner.manager.merge(Listing, listing, basicFields);

      // 2. Resolve system amenities
      let resolvedAmenities: Amenity[] = [];
      if (amenityIds) {
        if (amenityIds.length > 0) {
          resolvedAmenities = await queryRunner.manager.find(Amenity, {
            where: { id: In(amenityIds) },
          });
        }
      } else {
        // Keep existing system amenities if amenityIds not provided
        resolvedAmenities = listing.amenities.filter(a => a.isSystem);
      }

      // 3. Resolve/Create custom amenities
      let customResolved: Amenity[] = [];
      if (customAmenities) {
        const otherCategory = await queryRunner.manager.findOne(AmenityCategory, {
          where: { name: 'Other' },
        });

        if (!otherCategory) {
          throw new InternalServerErrorException(
            'System amenity category "Other" not found. Please run database seeding.',
          );
        }

        for (const customName of customAmenities) {
          const trimmedName = customName.trim();
          if (!trimmedName) continue;

          let amenity = await queryRunner.manager
            .createQueryBuilder(Amenity, 'amenity')
            .where('LOWER(amenity.name) = LOWER(:name)', { name: trimmedName })
            .andWhere('amenity.isSystem = :isSystem', { isSystem: false })
            .getOne();

          if (!amenity) {
            amenity = queryRunner.manager.create(Amenity, {
              name: trimmedName,
              isSystem: false,
              category: otherCategory,
            });
            amenity = await queryRunner.manager.save(Amenity, amenity);
          }

          customResolved.push(amenity);
        }
      } else {
        // Keep existing custom amenities if customAmenities not provided
        customResolved = listing.amenities.filter(a => !a.isSystem);
      }

      listing.amenities = [...resolvedAmenities, ...customResolved];

      // 4. Handle deleted photos database-side
      if (deletedPhotoIds && deletedPhotoIds.length > 0) {
        photosToDelete = listing.photos.filter(p => deletedPhotoIds.includes(p.id));
        if (photosToDelete.length > 0) {
          await queryRunner.manager.remove(ListingPhoto, photosToDelete);
        }
      }

      // 5. Apply reordering to existing photos
      // Filter out deleted photos from our current list
      const retainedPhotos = listing.photos.filter(p => !deletedPhotoIds?.includes(p.id));

      if (photoOrder && photoOrder.length > 0) {
        for (const existing of retainedPhotos) {
          const index = photoOrder.indexOf(existing.id);
          if (index !== -1) {
            existing.displayOrder = index;
            await queryRunner.manager.save(ListingPhoto, existing);
          }
        }
      }

      // 6. Add new photos
      let photoEntities: ListingPhoto[] = [];
      if (files && files.length > 0) {
        const currentPhotoCount = retainedPhotos.length;

        photoEntities = files.map((file, index) => {
          let displayOrder = currentPhotoCount + index;
          // If photoOrder contains special client-side IDs for new files (e.g. "new-0", "new-1")
          if (photoOrder && photoOrder.length > 0) {
            const newFileIndex = photoOrder.indexOf(`new-${index}`);
            if (newFileIndex !== -1) {
              displayOrder = newFileIndex;
            }
          }

          return queryRunner.manager.create(ListingPhoto, {
            listingId: listing.id,
            listing,
            picture: file.path.replace(/\\/g, '/'),
            displayOrder,
          });
        });
      }

      const savedListing = await queryRunner.manager.save(Listing, listing);

      if (files && files.length > 0) {
        // Now save the photos AFTER saving the listing
        await queryRunner.manager.save(ListingPhoto, photoEntities);
      }

      await queryRunner.commitTransaction();

      // Clean up deleted photo files physically after transaction commits successfully
      if (photosToDelete.length > 0) {
        await this.cleanupPhysicalFiles(photosToDelete.map(p => p.picture));
      }

      const result = await this.listingRepository.findOne({
        where: { id: savedListing.id },
        relations: {
          photos: true,
          amenities: {
            category: true,
          },
        },
      });

      if (!result) {
        throw new NotFoundException('Listing not found after update');
      }

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      // Clean up new uploaded files physically since database transaction failed
      if (files && files.length > 0) {
        await this.cleanupPhysicalFiles(files.map(f => f.path));
      }

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async cleanupPhysicalFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        await unlink(filePath);
        this.logger.log(`Successfully deleted orphaned file: ${filePath}`);
      } catch (err) {
        this.logger.error(`Failed to delete file ${filePath}: ${err.message}`);
      }
    }
  }

  async getHostListings(owner: User): Promise<Listing[]> {
    return this.listingRepository.find({
      where: {
        owner: { id: owner.id },
      },
      relations: {
        photos: true,
        amenities: {
          category: true,
        },
      },
      order: {
        createdAt: 'DESC',
        photos: {
          displayOrder: 'ASC',
        },
      },
    });
  }

  async getListingDetail(id: string): Promise<Listing> {
    const listing = await this.listingRepository.findOne({
      where: { id, status: ListingStatus.Active },
      relations: {
        photos: true,
        amenities: {
          category: true,
        },
      },
      order: {
        photos: {
          displayOrder: 'ASC',
        },
      },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }

    return listing;
  }

  async getListings(filterDto: GetListingsFilterDto): Promise<{
    listings: Listing[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryBuilder = this.listingRepository
      .createQueryBuilder('listing')
      .where('listing.status = :status', { status: ListingStatus.Active });

    if (filterDto.guestCount) {
      queryBuilder.andWhere('listing.maxGuests >= :guestCount', {
        guestCount: filterDto.guestCount,
      });
    }

    if (filterDto.latitude !== undefined && filterDto.longitude !== undefined) {
      const range = filterDto.range || 50;
      queryBuilder.andWhere(
        `acos(least(greatest(sin(radians(:latitude)) * sin(radians(listing.latitude)) + cos(radians(:latitude)) * cos(radians(listing.latitude)) * cos(radians(listing.longitude) - radians(:longitude)), -1), 1)) * 6371 <= :range`,
        {
          latitude: filterDto.latitude,
          longitude: filterDto.longitude,
          range,
        },
      );
    }

    if (filterDto.minPrice !== undefined) {
      queryBuilder.andWhere('listing.price >= :minPrice', {
        minPrice: filterDto.minPrice,
      });
    }

    if (filterDto.maxPrice !== undefined) {
      queryBuilder.andWhere('listing.price <= :maxPrice', {
        maxPrice: filterDto.maxPrice,
      });
    }

    if (filterDto.propertyTypes && filterDto.propertyTypes.length > 0) {
      queryBuilder.andWhere('listing.propertyType IN (:...propertyTypes)', {
        propertyTypes: filterDto.propertyTypes,
      });
    }

    if (filterDto.amenityIds && filterDto.amenityIds.length > 0) {
      const amenityMatchSubquery = this.listingRepository
        .createQueryBuilder('amenityListing')
        .select('amenityListing.id')
        .innerJoin('amenityListing.amenities', 'requiredAmenity')
        .where('requiredAmenity.id IN (:...amenityIds)', {
          amenityIds: filterDto.amenityIds,
        })
        .groupBy('amenityListing.id')
        .having('COUNT(DISTINCT requiredAmenity.id) = :amenityCount', {
          amenityCount: filterDto.amenityIds.length,
        });

      queryBuilder
        .andWhere(`listing.id IN (${amenityMatchSubquery.getQuery()})`)
        .setParameters(amenityMatchSubquery.getParameters());
    }

    if (filterDto.checkIn || filterDto.checkOut) {
      if (!filterDto.checkIn || !filterDto.checkOut) {
        throw new BadRequestException(
          'Both check-in and check-out dates are required to filter by availability',
        );
      }

      const checkInDate = new Date(filterDto.checkIn);
      const checkOutDate = new Date(filterDto.checkOut);

      if (
        Number.isNaN(checkInDate.getTime()) ||
        Number.isNaN(checkOutDate.getTime())
      ) {
        throw new BadRequestException('Invalid check-in or check-out date');
      }

      if (checkOutDate <= checkInDate) {
        throw new BadRequestException('Check-out date must be after check-in date');
      }

      queryBuilder
        .andWhere(
          `NOT EXISTS (
            SELECT 1
            FROM booking bookingFilter
            WHERE bookingFilter."listingId" = listing.id
              AND bookingFilter.status IN (:...blockingBookingStatuses)
              AND bookingFilter."checkIn" < :checkOutDate
              AND bookingFilter."checkOut" > :checkInDate
          )`,
          {
            blockingBookingStatuses: ['pending', 'confirmed', 'completed'],
            checkInDate,
            checkOutDate,
          },
        )
        .andWhere(
          `NOT EXISTS (
            SELECT 1
            FROM "availabilityBlocks" availabilityBlock
            WHERE availabilityBlock."listingId" = listing.id
              AND availabilityBlock."startDate" < :checkOutDate
              AND availabilityBlock."endDate" > :checkInDate
          )`,
          {
            checkInDate,
            checkOutDate,
          },
        );
    }

    const sortBy = filterDto.sortBy || ListingSortOption.NEWEST;
    if (sortBy === ListingSortOption.PRICE_LOW) {
      queryBuilder.orderBy('listing.price', 'ASC');
    } else if (sortBy === ListingSortOption.PRICE_HIGH) {
      queryBuilder.orderBy('listing.price', 'DESC');
    } else {
      queryBuilder.orderBy('listing.createdAt', 'DESC');
    }

    queryBuilder.addOrderBy('listing.id', 'ASC');

    const page = filterDto.page || 1;
    const limit = filterDto.limit || 10;
    const skip = (page - 1) * limit;

    const total = await queryBuilder.clone().getCount();

    const pagedIds = await queryBuilder
      .clone()
      .select('listing.id', 'id')
      .skip(skip)
      .take(limit)
      .getRawMany<{ id: string }>();

    const listingIds = pagedIds.map((row) => row.id);

    if (listingIds.length === 0) {
      return {
        listings: [],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    const listings = await this.listingRepository.find({
      where: { id: In(listingIds) },
      relations: {
        photos: true,
        amenities: {
          category: true,
        },
      },
      order: {
        photos: {
          displayOrder: 'ASC',
        },
      },
    });

    const listingOrder = new Map(listingIds.map((id, index) => [id, index]));
    listings.sort(
      (a, b) =>
        (listingOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (listingOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    );

    return {
      listings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}



