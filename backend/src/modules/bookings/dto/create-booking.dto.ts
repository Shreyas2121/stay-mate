import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { VerifyBookingDto } from './verify-booking.dto';

export class CreateBookingDto extends VerifyBookingDto {
  @ApiPropertyOptional({
    description: 'Optional coupon ID to apply when creating the booking',
    example: 'fd89113d-a93b-4b06-a4d0-13b6a9b9ca73',
  })
  @IsOptional()
  @IsUUID()
  couponId?: string;
}
