import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { Auth } from '../../common/decorators/auth.decorator';
import { UserRole } from '../users/enums/user.enum';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { GetPublicCouponsDto } from './dto/get-public-coupons.dto';

@ApiTags('coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('admin')
  @Auth(UserRole.Admin)
  @ApiOperation({ summary: 'Create a coupon as an admin' })
  @ApiResponse({ status: 201, description: 'Coupon created successfully' })
  async createCoupon(@Body() dto: CreateCouponDto) {
    return this.couponsService.createCoupon(dto);
  }

  @Get('admin')
  @Auth(UserRole.Admin)
  @ApiOperation({ summary: 'List all coupons for admin management' })
  @ApiResponse({ status: 200, description: 'Coupons returned successfully' })
  async getAdminCoupons() {
    return this.couponsService.getAdminCoupons();
  }

  @Get('admin/:id')
  @Auth(UserRole.Admin)
  @ApiOperation({ summary: 'Get a single coupon for admin management' })
  @ApiResponse({ status: 200, description: 'Coupon returned successfully' })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  async getAdminCouponById(@Param('id') id: string) {
    return this.couponsService.getAdminCouponById(id);
  }

  @Patch('admin/:id')
  @Auth(UserRole.Admin)
  @ApiOperation({ summary: 'Update a coupon as an admin' })
  @ApiResponse({ status: 200, description: 'Coupon updated successfully' })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  async updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.updateCoupon(id, dto);
  }

  @Patch('admin/:id/deactivate')
  @Auth(UserRole.Admin)
  @ApiOperation({ summary: 'Deactivate a coupon as an admin' })
  @ApiResponse({ status: 200, description: 'Coupon deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  async deactivateCoupon(@Param('id') id: string) {
    return this.couponsService.deactivateCoupon(id);
  }

  @Get('public')
  @Auth()
  @ApiOperation({ summary: 'Get eligible public coupons for the current checkout context' })
  @ApiResponse({ status: 200, description: 'Eligible coupons returned successfully' })
  async getEligiblePublicCoupons(
    @CurrentUser() user: User,
    @Query() query: GetPublicCouponsDto,
  ) {
    return this.couponsService.getEligiblePublicCoupons(user, query);
  }

  @Post('validate')
  @Auth()
  @ApiOperation({ summary: 'Validate and price a coupon for the current checkout context' })
  @ApiResponse({ status: 200, description: 'Coupon validated successfully' })
  @ApiResponse({ status: 400, description: 'Coupon or booking context is invalid' })
  @ApiResponse({ status: 404, description: 'Coupon or listing not found' })
  async validateCoupon(
    @CurrentUser() user: User,
    @Body() dto: ValidateCouponDto,
  ) {
    return this.couponsService.validateCoupon(user.id, dto);
  }
}
