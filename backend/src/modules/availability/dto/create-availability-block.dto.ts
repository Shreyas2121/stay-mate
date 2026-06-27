import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAvailabilityBlockDto {
  @ApiProperty({ description: 'Block start date', example: '2026-07-10' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Block end date', example: '2026-07-15' })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Optional reason for blocking dates' })
  @IsOptional()
  @IsString()
  reason?: string;
}
