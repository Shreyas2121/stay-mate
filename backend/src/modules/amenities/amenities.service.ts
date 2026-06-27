import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AmenityCategory } from './entities/amenity-category.entity';
import { Amenity } from './entities/amenity.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AmenityService {
  constructor(
    @InjectRepository(AmenityCategory)
    private readonly amenityCategoryRepository: Repository<AmenityCategory>,

    @InjectRepository(Amenity)
    private readonly amenityRepository: Repository<Amenity>,
  ) {}

  async createAmenityCategory(name: string, description?: string) {
    const category = this.amenityCategoryRepository.create({
      name,
      description,
    });
    await this.amenityCategoryRepository.save(category);
  }

  async fetchAmenityCategories() {
    return this.amenityCategoryRepository.find({
      select: {
        id: true,
        name: true,
        description: true,
      },
    });
  }

  async fetchAmenitiesCategoriesWithAmenities() {
    return this.amenityCategoryRepository.find({
      relations: {
        amenities: true,
      },
      order: {
        name: 'ASC',
      },
    });
  }
}
