import { Controller, Get } from '@nestjs/common';
import { AmenityService } from './amenities.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('amenities')
@Controller('amenities')
export class AmenitiesController {
  constructor(private readonly amenityService: AmenityService) {}

  @Get()
  @ApiOperation({ summary: 'Get all amenity categories and their system amenities' })
  @ApiResponse({ status: 200, description: 'Return categories and system amenities' })
  async getAmenities() {
    const categories = await this.amenityService.fetchAmenitiesCategoriesWithAmenities();
    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      amenities: cat.amenities
        .filter((amenity) => amenity.isSystem)
        .map((amenity) => ({
          id: amenity.id,
          name: amenity.name,
          icon: amenity.icon,
        })),
    }));
  }
}
