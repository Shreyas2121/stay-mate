import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class GetAvailabilityBlocksDto {
  @ApiPropertyOptional({ description: 'Optional filter start date', example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Optional filter end date', example: '2026-07-31' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
