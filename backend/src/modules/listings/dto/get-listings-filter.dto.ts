import { IsInt, IsOptional, Min, IsEnum, IsNumber, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyType } from '../enums/listing.enum';

export enum ListingSortOption {
  NEWEST = 'newest',
  PRICE_LOW = 'price-low',
  PRICE_HIGH = 'price-high',
}

export class GetListingsFilterDto {
  @ApiPropertyOptional({
    description: 'Minimum guest capacity required',
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  guestCount?: number;

  @ApiPropertyOptional({
    description: 'Page number',
    minimum: 1,
    default: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    default: 10,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort option',
    enum: ListingSortOption,
    default: ListingSortOption.NEWEST,
  })
  @IsOptional()
  @IsEnum(ListingSortOption)
  sortBy?: ListingSortOption = ListingSortOption.NEWEST;

  @ApiPropertyOptional({
    description: 'Latitude coordinates for search location',
    minimum: -90,
    maximum: 90,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinates for search location',
    minimum: -180,
    maximum: 180,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Maximum distance range in kilometers',
    minimum: 0.1,
    default: 50,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Type(() => Number)
  range?: number = 50;

  @ApiPropertyOptional({
    description: 'Minimum price per night',
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price per night',
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'List of property types to filter by',
    isArray: true,
    enum: PropertyType,
  })
  @IsOptional()
  @IsEnum(PropertyType, { each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',');
    return value;
  })
  propertyTypes?: PropertyType[];
}
