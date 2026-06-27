import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { AvailabilityBlock } from './entities/availability-block.entity';
import { Listing } from '../listings/entities/listing.entity';
import { User } from '../users/entities/user.entity';
import { CreateAvailabilityBlockDto } from './dto/create-availability-block.dto';
import { GetAvailabilityBlocksDto } from './dto/get-availability-blocks.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(AvailabilityBlock)
    private readonly availabilityBlockRepository: Repository<AvailabilityBlock>,
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
  ) {}

  async createBlock(
    listingId: string,
    user: User,
    dto: CreateAvailabilityBlockDto,
  ) {
    const listing = await this.findOwnedListing(listingId, user.id);
    const { startDate, endDate } = this.normalizeRange(dto.startDate, dto.endDate);

    await this.ensureNoBlockOverlap(listing.id, startDate, endDate);

    const block = this.availabilityBlockRepository.create({
      listing,
      startDate,
      endDate,
      reason: dto.reason?.trim() || null,
    });

    return this.mapBlock(await this.availabilityBlockRepository.save(block));
  }

  async getHostBlocks(
    listingId: string,
    user: User,
    query: GetAvailabilityBlocksDto,
  ) {
    await this.findOwnedListing(listingId, user.id);
    const blocks = await this.findBlocksForListing(listingId, query);
    return blocks.map((block) => this.mapBlock(block));
  }

  async getPublicBlocks(listingId: string, query: GetAvailabilityBlocksDto) {
    await this.findListingById(listingId);
    const blocks = await this.findBlocksForListing(listingId, query);
    return blocks.map((block) => this.mapBlock(block));
  }

  async deleteBlock(blockId: string, user: User) {
    const block = await this.availabilityBlockRepository.findOne({
      where: { id: blockId },
      relations: { listing: { owner: true } },
    });

    if (!block) {
      throw new NotFoundException('Availability block not found');
    }

    if (block.listing.owner.id !== user.id) {
      throw new ForbiddenException('You do not own this listing');
    }

    await this.availabilityBlockRepository.remove(block);

    return { success: true, message: 'Availability block removed successfully' };
  }

  async ensureDatesAreAvailable(
    listingId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    const overlappingBlock = await this.availabilityBlockRepository.findOne({
      where: {
        listing: { id: listingId },
        startDate: LessThan(endDate),
        endDate: MoreThan(startDate),
      },
    });

    if (overlappingBlock) {
      throw new BadRequestException('These dates are blocked by the host');
    }
  }

  private async findOwnedListing(listingId: string, ownerId: string) {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId },
      relations: { owner: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.owner.id !== ownerId) {
      throw new ForbiddenException('You do not own this listing');
    }

    return listing;
  }

  private async findListingById(listingId: string) {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return listing;
  }

  private async findBlocksForListing(
    listingId: string,
    query: GetAvailabilityBlocksDto,
  ) {
    const qb = this.availabilityBlockRepository
      .createQueryBuilder('block')
      .leftJoin('block.listing', 'listing')
      .where('listing.id = :listingId', { listingId });

    if (query.from) {
      const fromDate = new Date(query.from);
      fromDate.setUTCHours(0, 0, 0, 0);
      qb.andWhere('block.endDate > :fromDate', { fromDate });
    }

    if (query.to) {
      const toDate = new Date(query.to);
      toDate.setUTCHours(0, 0, 0, 0);
      qb.andWhere('block.startDate < :toDate', { toDate });
    }

    return qb.orderBy('block.startDate', 'ASC').getMany();
  }

  private async ensureNoBlockOverlap(
    listingId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const overlappingBlock = await this.availabilityBlockRepository.findOne({
      where: {
        listing: { id: listingId },
        startDate: LessThan(endDate),
        endDate: MoreThan(startDate),
      },
    });

    if (overlappingBlock) {
      throw new BadRequestException('This date range overlaps an existing availability block');
    }
  }

  private normalizeRange(startDateInput: string, endDateInput: string) {
    const startDate = new Date(startDateInput);
    const endDate = new Date(endDateInput);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(0, 0, 0, 0);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    return { startDate, endDate };
  }

  private mapBlock(block: AvailabilityBlock) {
    return {
      id: block.id,
      startDate: block.startDate,
      endDate: block.endDate,
      reason: block.reason,
    };
  }
}
