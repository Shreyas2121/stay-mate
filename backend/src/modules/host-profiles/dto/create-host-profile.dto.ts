import { IsOptional, IsString } from 'class-validator';

export class HostProfileDto {
  @IsString()
  @IsOptional()
  legalName: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  @IsOptional()
  address: string;

  @IsString()
  @IsOptional()
  idType: string;

  @IsString()
  @IsOptional()
  idNumber: string;

  @IsString()
  @IsOptional()
  bankInfo: string;
}
