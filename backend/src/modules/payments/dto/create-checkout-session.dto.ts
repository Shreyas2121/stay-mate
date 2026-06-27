import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateBookingDto } from '../../bookings/dto/create-booking.dto';

export class CreateCheckoutSessionDto extends CreateBookingDto {
  @ApiPropertyOptional({
    description: 'Coupon code entered manually by the guest',
    example: 'SUMMER20',
  })
  @IsOptional()
  @IsString()
  couponCode?: string;
}
