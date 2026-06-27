import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ListingStatus, PropertyType } from '../enums/listing.enum';

export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsString()
  @IsNotEmpty()
  locationText: string;

  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @IsNumber()
  @Type(() => Number)
  longitude: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxGuests: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  bedrooms: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  bathrooms: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  cleaningFee: number;

  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  minNights: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxNights: number;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/)
  checkInTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/)
  checkOutTime: string;

  @IsString()
  @IsOptional()
  additionalInfo?: string;

  @IsEnum(ListingStatus)
  @IsOptional()
  status?: ListingStatus;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch {
        return [value];
      }
    }
    return value;
  })
  amenityIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch {
        return [value];
      }
    }
    return value;
  })
  customAmenities?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch {
        return [value];
      }
    }
    return value;
  })
  photoOrder?: string[];
}
