import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { NotificationStatusFilter } from '../enums/notification.enum';

export class GetNotificationsQueryDto {
  @IsOptional()
  @IsEnum(NotificationStatusFilter)
  status?: NotificationStatusFilter = NotificationStatusFilter.All;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}