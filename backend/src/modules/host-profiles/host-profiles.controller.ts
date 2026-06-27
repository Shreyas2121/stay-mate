import { Controller, Post, Get, Body } from '@nestjs/common';
import { HostProfileService } from './host-profile.service';
import { HostProfileDto } from './dto/create-host-profile.dto';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('host-profiles')
@Controller('host-profiles')
export class HostProfilesController {
  constructor(private readonly hostProfileService: HostProfileService) {}

  @Post('apply')
  @Auth()
  @ApiOperation({ summary: 'Apply for hosting' })
  @ApiResponse({ status: 201, description: 'Host profile application submitted successfully' })
  @ApiResponse({ status: 409, description: 'Host profile is already pending or verified' })
  async applyForHosting(
    @CurrentUser() user: User,
    @Body() dto: HostProfileDto,
  ) {
    return this.hostProfileService.applyForHosting(user.id, dto);
  }

  @Get('status')
  @Auth()
  @ApiOperation({ summary: 'Get current host application status' })
  @ApiResponse({ status: 200, description: 'Return current status' })
  async getStatus(@CurrentUser() user: User) {
    return this.hostProfileService.getStatus(user.id);
  }
}
