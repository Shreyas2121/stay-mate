import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  UseInterceptors,
  UploadedFiles,
  Param,
  ForbiddenException,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ListingsService } from './listings.service';
import { Listing } from './entities/listing.entity';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { GetListingsFilterDto } from './dto/get-listings-filter.dto';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ActiveRole } from '../users/enums/user.enum';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import * as fs from 'fs';

// Ensure the upload directory exists
fs.mkdirSync('./uploads/listings', { recursive: true });

const multerOptions = {
  storage: diskStorage({
    destination: './uploads/listings',
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      callback(null, `photo-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
      return callback(new BadRequestException('Only image files (jpg, jpeg, png, webp) are allowed!'), false);
    }
    callback(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
};

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @Auth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new listing (draft or active)' })
  @ApiResponse({ status: 201, description: 'Listing created successfully' })
  @UseInterceptors(FilesInterceptor('photos', 10, multerOptions))
  async createListing(
    @CurrentUser() user: User,
    @Body() dto: CreateListingDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (user.activeRole !== ActiveRole.Host) {
      throw new ForbiddenException('Only hosts in Host mode can manage listings');
    }
    const listing = await this.listingsService.createListing(user, dto, files || []);
    return this.mapListing(listing);
  }

  @Patch(':id')
  @Auth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update an existing listing' })
  @ApiResponse({ status: 200, description: 'Listing updated successfully' })
  @UseInterceptors(FilesInterceptor('photos', 10, multerOptions))
  async updateListing(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateListingDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (user.activeRole !== ActiveRole.Host) {
      throw new ForbiddenException('Only hosts in Host mode can manage listings');
    }
    const listing = await this.listingsService.updateListing(id, user, dto, files || []);
    return this.mapListing(listing);
  }

  @Get()
  @ApiOperation({ summary: 'Search and filter active listings' })
  @ApiResponse({ status: 200, description: 'Return filtered listings with pagination metadata' })
  async getListings(@Query() query: GetListingsFilterDto) {
    const result = await this.listingsService.getListings(query);
    return {
      listings: result.listings.map((l) => this.mapListing(l)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get('my')
  @Auth()
  @ApiOperation({ summary: 'Get all listings owned by the logged-in host' })
  @ApiResponse({ status: 200, description: 'Return host listings' })
  async getHostListings(@CurrentUser() user: User) {
    if (user.activeRole !== ActiveRole.Host) {
      throw new ForbiddenException('Only hosts in Host mode can view their listings');
    }
    const listings = await this.listingsService.getHostListings(user);
    return listings.map((l) => this.mapListing(l));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific listing' })
  @ApiResponse({ status: 200, description: 'Return listing details' })
  async getListingDetail(@Param('id') id: string) {
    const listing = await this.listingsService.getListingDetail(id);
    return this.mapListing(listing);
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
        category: a.category ? {
          id: a.category.id,
          name: a.category.name,
        } : null,
      })),
    };
  }
}
