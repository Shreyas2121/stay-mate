import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class GetPublicCouponsDto {
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
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guestCount: number;
}
