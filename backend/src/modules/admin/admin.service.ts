import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { HostProfile } from '../host-profiles/entities/host-profile.entity';
import { User } from '../users/entities/user.entity';
import { Listing } from '../listings/entities/listing.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { HostStatus } from '../host-profiles/enums/host-profile.enum';
import { ActiveRole, UserRole } from '../users/enums/user.enum';
import { ListingStatus } from '../listings/enums/listing.enum';
import { BookingStatus } from '../bookings/enums/booking.enum';
import { BookingEarning } from '../payments/entities/booking-earning.entity';
import { NotificationType } from '../notifications/enums/notification.enum';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(HostProfile)
    private readonly hostProfileRepository: Repository<HostProfile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(BookingEarning)
    private readonly earningRepository: Repository<BookingEarning>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getHosts(status: 'active' | 'terminated' | 'all' = 'all') {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.hostProfile', 'hostProfile')
      .leftJoin('user.listings', 'listing')
      .leftJoin('listing.bookings', 'booking')
      .where('user.role = :role', { role: UserRole.Host })
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.role',
        'user.activeRole',
        'user.isActive',
        'user.createdAt',
        'user.updatedAt',
        'hostProfile.id',
        'hostProfile.status',
        'hostProfile.legalName',
        'hostProfile.submittedAt',
        'hostProfile.reviewedAt',
      ])
      .addSelect('COUNT(DISTINCT listing.id)', 'listingCount')
      .addSelect(
        `COUNT(DISTINCT CASE WHEN listing.status = :activeListingStatus THEN listing.id END)`,
        'activeListingCount',
      )
      .addSelect('COUNT(DISTINCT booking.id)', 'bookingCount')
      .setParameter('activeListingStatus', ListingStatus.Active)
      .groupBy('user.id')
      .addGroupBy('hostProfile.id')
      .orderBy('user.createdAt', 'DESC');

    if (status === 'active') {
      qb.andWhere('user.isActive = :isActive', { isActive: true });
    } else if (status === 'terminated') {
      qb.andWhere('user.isActive = :isActive', { isActive: false });
    }

    const { entities, raw } = await qb.getRawAndEntities();

    return entities.map((host, index) => ({
      ...host,
      listingCount: Number(raw[index]?.listingCount ?? 0),
      activeListingCount: Number(raw[index]?.activeListingCount ?? 0),
      bookingCount: Number(raw[index]?.bookingCount ?? 0),
    }));
  }

  async getHost(hostId: string) {
    const host = await this.findHost(hostId);
    const summary = await this.getHostSummary(hostId);

    return {
      ...host,
      ...summary,
    };
  }

  async getHostListings(hostId: string) {
    await this.findHost(hostId);

    const { entities, raw } = await this.listingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.photos', 'photo')
      .leftJoinAndSelect('listing.amenities', 'amenity')
      .leftJoinAndSelect('amenity.category', 'category')
      .leftJoin('listing.bookings', 'booking')
      .where('listing.ownerId = :hostId', { hostId })
      .addSelect('COUNT(DISTINCT booking.id)', 'bookingCount')
      .groupBy('listing.id')
      .addGroupBy('photo.id')
      .addGroupBy('amenity.id')
      .addGroupBy('category.id')
      .orderBy('listing.createdAt', 'DESC')
      .addOrderBy('photo.displayOrder', 'ASC')
      .getRawAndEntities();

    return entities.map((listing, index) => ({
      ...listing,
      bookingCount: Number(raw[index]?.bookingCount ?? 0),
    }));
  }

  async getListing(listingId: string) {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId },
      relations: {
        owner: true,
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
      throw new NotFoundException('Listing not found');
    }

    return listing;
  }

  async getListingBookings(listingId: string) {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId },
      select: { id: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return this.bookingRepository.find({
      where: { listing: { id: listingId } },
      relations: {
        bookedByUser: true,
        listing: {
          owner: true,
          photos: true,
        },
        coupon: true,
        earning: true,
      },
      order: {
        checkIn: 'ASC',
        createdAt: 'DESC',
        listing: {
          photos: {
            displayOrder: 'ASC',
          },
        },
      },
    });
  }

  async terminateHost(hostId: string) {
    const host = await this.findHost(hostId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      host.isActive = false;
      host.activeRole = ActiveRole.Guest;
      await queryRunner.manager.save(User, host);

      const listings = await queryRunner.manager.find(Listing, {
        where: { owner: { id: hostId } },
      });

      const listingIds = listings.map((listing) => listing.id);

      for (const listing of listings) {
        listing.status = ListingStatus.Closed;
        listing.isActive = false;
      }

      if (listings.length > 0) {
        await queryRunner.manager.save(Listing, listings);
      }

      let cancelledPendingBookings = 0;
      if (listingIds.length > 0) {
        const result = await queryRunner.manager
          .createQueryBuilder()
          .update(Booking)
          .set({ status: BookingStatus.Cancelled })
          .where('listingId IN (:...listingIds)', { listingIds })
          .andWhere('status = :status', { status: BookingStatus.Pending })
          .execute();

        cancelledPendingBookings = result.affected ?? 0;
      }

      await queryRunner.commitTransaction();

      return {
        hostId,
        isActive: false,
        closedListings: listings.length,
        cancelledPendingBookings,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async reactivateHost(hostId: string) {
    const host = await this.findHost(hostId);
    host.isActive = true;

    return this.userRepository.save(host);
  }

  async getHostProfiles(status?: HostStatus): Promise<HostProfile[]> {
    const query = this.hostProfileRepository
      .createQueryBuilder('hostProfile')
      .leftJoinAndSelect('hostProfile.user', 'user')
      .orderBy('hostProfile.submittedAt', 'DESC');

    if (status) {
      query.where('hostProfile.status = :status', { status });
    }

    return query.getMany();
  }

  async approveHostProfile(id: string): Promise<HostProfile> {
    const profile = await this.hostProfileRepository.findOne({
      where: { id },
      relations: { user: true },
    });

    if (!profile) {
      throw new NotFoundException('Host profile application not found');
    }

    // Transaction: update profile status + user role atomically
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      profile.status = HostStatus.Verified;
      profile.reviewedAt = new Date();
      await queryRunner.manager.save(HostProfile, profile);

      if (profile.user) {
        profile.user.role = UserRole.Host;
        await queryRunner.manager.save(User, profile.user);
      }

      await queryRunner.commitTransaction();
      await this.notificationsService.createForUser({
        userId: profile.userId,
        type: NotificationType.HostApplicationApproved,
        payload: {
          title: 'Host application approved',
          message: 'Your host application was approved',
          hostProfileId: profile.id,
        },
      });
      return profile;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async rejectHostProfile(id: string, rejectionReason: string): Promise<HostProfile> {
    const profile = await this.hostProfileRepository.findOne({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException('Host profile application not found');
    }

    profile.status = HostStatus.Rejected;
    profile.rejectionReason = rejectionReason;
    profile.reviewedAt = new Date();

    const savedProfile = await this.hostProfileRepository.save(profile);
    await this.notificationsService.createForUser({
      userId: savedProfile.userId,
      type: NotificationType.HostApplicationRejected,
      payload: {
        title: 'Host application rejected',
        message: 'Your host application was rejected',
        hostProfileId: savedProfile.id,
        rejectionReason,
      },
    });

    return savedProfile;
  }

  private async findHost(hostId: string) {
    const host = await this.userRepository.findOne({
      where: { id: hostId },
      relations: { hostProfile: true },
    });

    if (!host || host.role !== UserRole.Host) {
      throw new NotFoundException('Host not found');
    }

    return host;
  }

  private async getHostSummary(hostId: string) {
    const [listingCount, activeListingCount, bookingCount] = await Promise.all([
      this.listingRepository.count({ where: { owner: { id: hostId } } }),
      this.listingRepository.count({
        where: { owner: { id: hostId }, status: ListingStatus.Active },
      }),
      this.bookingRepository.count({
        where: { listing: { owner: { id: hostId } } },
      }),
    ]);

    const earnings = await this.earningRepository
      .createQueryBuilder('earning')
      .select('COALESCE(SUM(earning.platformFee), 0)', 'platformFeeTotal')
      .addSelect('COALESCE(SUM(earning.hostAmount), 0)', 'hostAmountTotal')
      .where('earning.hostId = :hostId', { hostId })
      .getRawOne<{ platformFeeTotal: string; hostAmountTotal: string }>();

    return {
      listingCount,
      activeListingCount,
      bookingCount,
      platformFeeTotal: Number(earnings?.platformFeeTotal ?? 0),
      hostAmountTotal: Number(earnings?.hostAmountTotal ?? 0),
    };
  }
}
