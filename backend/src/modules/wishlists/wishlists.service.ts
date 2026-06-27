import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from '../listings/entities/listing.entity';
import { ListingStatus } from '../listings/enums/listing.enum';
import { Wishlist } from './entities/wishlist.entity';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
  ) {}

  async getMyWishlist(userId: string) {
    return this.wishlistRepository.find({
      where: { user: { id: userId } },
      relations: {
        listing: {
          photos: true,
          amenities: {
            category: true,
          },
        },
      },
      order: {
        createdAt: 'DESC',
        listing: {
          photos: {
            displayOrder: 'ASC',
          },
        },
      },
    });
  }

  async isWishlisted(userId: string, listingId: string) {
    await this.ensureActiveListing(listingId);
    const count = await this.wishlistRepository.count({
      where: { user: { id: userId }, listing: { id: listingId } },
    });

    return { listingId, isWishlisted: count > 0 };
  }

  async toggleWishlist(userId: string, listingId: string) {
    await this.ensureActiveListing(listingId);

    const existing = await this.wishlistRepository.findOne({
      where: { user: { id: userId }, listing: { id: listingId } },
    });

    if (existing) {
      await this.wishlistRepository.remove(existing);
      return { listingId, isWishlisted: false };
    }

    const wishlist = this.wishlistRepository.create({
      user: { id: userId },
      listing: { id: listingId },
    });
    await this.wishlistRepository.save(wishlist);

    return { listingId, isWishlisted: true };
  }

  private async ensureActiveListing(listingId: string) {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId, status: ListingStatus.Active },
      select: { id: true },
    });

    if (!listing) {
      throw new NotFoundException('Active listing not found');
    }

    return listing;
  }
}
