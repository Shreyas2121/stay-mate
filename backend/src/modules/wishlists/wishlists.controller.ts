import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Listing } from '../listings/entities/listing.entity';
import { ToggleWishlistDto } from './dto/toggle-wishlist.dto';
import { Wishlist } from './entities/wishlist.entity';
import { WishlistsService } from './wishlists.service';

@ApiTags('wishlists')
@Controller('wishlists')
@Auth()
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Get('my')
  @ApiOperation({ summary: 'Get current user saved listings' })
  @ApiResponse({ status: 200, description: 'Saved listings returned' })
  async getMyWishlist(@CurrentUser() user: User) {
    const items = await this.wishlistsService.getMyWishlist(user.id);
    return items.map((item) => this.mapWishlist(item));
  }

  @Get('listings/:listingId')
  @ApiOperation({ summary: 'Check whether current user saved a listing' })
  async getListingWishlistStatus(
    @CurrentUser() user: User,
    @Param('listingId', ParseUUIDPipe) listingId: string,
  ) {
    return this.wishlistsService.isWishlisted(user.id, listingId);
  }

  @Post('toggle')
  @ApiOperation({ summary: 'Save or unsave a listing for the current user' })
  async toggleWishlist(
    @CurrentUser() user: User,
    @Body() dto: ToggleWishlistDto,
  ) {
    return this.wishlistsService.toggleWishlist(user.id, dto.listingId);
  }

  private mapWishlist(item: Wishlist) {
    return {
      id: item.id,
      createdAt: item.createdAt,
      listing: this.mapListing(item.listing),
    };
  }

  private mapListing(listing: Listing) {
    return {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      price: listing.price ? Number(listing.price) : 0,
      locationText: listing.locationText,
      latitude: listing.latitude ? Number(listing.latitude) : 0,
      longitude: listing.longitude ? Number(listing.longitude) : 0,
      maxGuests: listing.maxGuests,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      status: listing.status,
      cleaningFee: listing.cleaningFee ? Number(listing.cleaningFee) : 0,
      propertyType: listing.propertyType,
      minNights: listing.minNights,
      maxNights: listing.maxNights,
      checkInTime: listing.checkInTime,
      checkOutTime: listing.checkOutTime,
      additionalInfo: listing.additionalInfo,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      photos: (listing.photos || []).map((p) => ({
        id: p.id,
        picture: p.picture,
        label: p.label,
        displayOrder: p.displayOrder,
      })),
      amenities: (listing.amenities || []).map((a) => ({
        id: a.id,
        name: a.name,
        icon: a.icon,
        isSystem: a.isSystem,
        category: a.category
          ? {
              id: a.category.id,
              name: a.category.name,
            }
          : null,
      })),
    };
  }
}
