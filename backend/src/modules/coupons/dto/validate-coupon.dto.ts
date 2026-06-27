import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class ValidateCouponDto {
  @ApiProperty({ description: 'The ID of the listing to book' })
  @IsNotEmpty()
  @IsUUID()
  listingId: string;

  @ApiProperty({ description: 'Check-in date (YYYY-MM-DD)', example: '2026-12-01' })
  @IsNotEmpty()
  @IsDateString()
  checkIn: string;

  @ApiProperty({ description: 'Check-out date (YYYY-MM-DD)', example: '2026-12-05' })
  @IsNotEmpty()
  @IsDateString()
  checkOut: string;

  @ApiProperty({ description: 'Number of guests' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  guestCount: number;

  @ApiPropertyOptional({ description: 'Coupon code for manual entry', example: 'WELCOME10' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @ApiPropertyOptional({ description: 'Coupon ID for one-click apply', example: 'fd89113d-a93b-4b06-a4d0-13b6a9b9ca73' })
  @IsOptional()
  @IsUUID()
  couponId?: string;
}
