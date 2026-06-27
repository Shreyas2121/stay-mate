import { Controller, Get, Patch, Param, Query, Body, ParseUUIDPipe } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Auth } from '../../common/decorators/auth.decorator';
import { UserRole } from '../users/enums/user.enum';
import { HostStatus } from '../host-profiles/enums/host-profile.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

class RejectHostProfileDto {
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}

@ApiTags('admin')
@Controller('admin')
@Auth(UserRole.Admin)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('hosts')
  @ApiOperation({ summary: 'List host accounts for admin management' })
  @ApiQuery({ name: 'status', enum: ['active', 'terminated', 'all'], required: false })
  @ApiResponse({ status: 200, description: 'Return host accounts list' })
  async getHosts(@Query('status') status: 'active' | 'terminated' | 'all' = 'all') {
    return this.adminService.getHosts(status);
  }

  @Get('hosts/:hostId')
  @ApiOperation({ summary: 'Get host details with summary counts' })
  @ApiResponse({ status: 200, description: 'Host details returned' })
  @ApiResponse({ status: 404, description: 'Host not found' })
  async getHost(@Param('hostId', ParseUUIDPipe) hostId: string) {
    return this.adminService.getHost(hostId);
  }

  @Get('hosts/:hostId/listings')
  @ApiOperation({ summary: 'Get all listings owned by a host' })
  @ApiResponse({ status: 200, description: 'Host listings returned' })
  @ApiResponse({ status: 404, description: 'Host not found' })
  async getHostListings(@Param('hostId', ParseUUIDPipe) hostId: string) {
    return this.adminService.getHostListings(hostId);
  }

  @Patch('hosts/:hostId/terminate')
  @ApiOperation({ summary: 'Soft-terminate a host account and close listings' })
  @ApiResponse({ status: 200, description: 'Host terminated successfully' })
  @ApiResponse({ status: 404, description: 'Host not found' })
  async terminateHost(@Param('hostId', ParseUUIDPipe) hostId: string) {
    return this.adminService.terminateHost(hostId);
  }

  @Patch('hosts/:hostId/reactivate')
  @ApiOperation({ summary: 'Reactivate a terminated host account' })
  @ApiResponse({ status: 200, description: 'Host reactivated successfully' })
  @ApiResponse({ status: 404, description: 'Host not found' })
  async reactivateHost(@Param('hostId', ParseUUIDPipe) hostId: string) {
    return this.adminService.reactivateHost(hostId);
  }

  @Get('listings/:listingId')
  @ApiOperation({ summary: 'Get listing details as admin regardless of public status' })
  @ApiResponse({ status: 200, description: 'Listing details returned' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async getListing(@Param('listingId', ParseUUIDPipe) listingId: string) {
    return this.adminService.getListing(listingId);
  }

  @Get('listings/:listingId/bookings')
  @ApiOperation({ summary: 'Get all bookings for a listing as admin' })
  @ApiResponse({ status: 200, description: 'Listing bookings returned' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async getListingBookings(@Param('listingId', ParseUUIDPipe) listingId: string) {
    return this.adminService.getListingBookings(listingId);
  }

  @Get('host-profiles')
  @ApiOperation({ summary: 'Retrieve host profile applications (supports status filtering)' })
  @ApiQuery({ name: 'status', enum: HostStatus, required: false })
  @ApiResponse({ status: 200, description: 'Return host profile applications list' })
  async getHostProfiles(@Query('status') status?: HostStatus) {
    return this.adminService.getHostProfiles(status);
  }

  @Patch('host-profiles/:id/approve')
  @ApiOperation({ summary: 'Approve a host profile application' })
  @ApiResponse({ status: 200, description: 'Application approved successfully' })
  @ApiResponse({ status: 404, description: 'Host profile not found' })
  async approveHostProfile(@Param('id') id: string) {
    return this.adminService.approveHostProfile(id);
  }

  @Patch('host-profiles/:id/reject')
  @ApiOperation({ summary: 'Reject a host profile application' })
  @ApiResponse({ status: 200, description: 'Application rejected successfully' })
  @ApiResponse({ status: 404, description: 'Host profile not found' })
  async rejectHostProfile(
    @Param('id') id: string,
    @Body() dto: RejectHostProfileDto,
  ) {
    return this.adminService.rejectHostProfile(id, dto.rejectionReason);
  }
}
