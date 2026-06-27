import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmenityCategory } from './entities/amenity-category.entity';
import { Amenity } from './entities/amenity.entity';
import { AmenityService } from './amenities.service';
import { AmenitiesController } from './amenities.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AmenityCategory, Amenity])],
  controllers: [AmenitiesController],
  providers: [AmenityService],
  exports: [AmenityService],
})
export class AmenitiesModule {}
