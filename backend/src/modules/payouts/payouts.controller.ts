import { Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user.enum';
import { PayoutsService } from './payouts.service';

@ApiTags('payouts')
@Controller()
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get('payouts/host/summary')
  @Auth()
  @ApiOperation({ summary: 'Get host earnings summary for current host' })
  async getHostSummary(@CurrentUser() user: User) {
    return this.payoutsService.getHostSummary(user.id);
  }

  @Get('payouts/host/earnings')
  @Auth()
  @ApiOperation({ summary: 'Get current host earnings ledger' })
  @ApiQuery({ name: 'status', required: false })
  async getHostEarnings(
    @CurrentUser() user: User,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.payoutsService.getHostEarnings(user.id, { status, page, limit });
  }

  @Get('payouts/host/history')
  @Auth()
  @ApiOperation({ summary: 'Get current host payout history' })
  @ApiQuery({ name: 'status', required: false })
  async getHostPayouts(
    @CurrentUser() user: User,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.payoutsService.getHostPayouts(user.id, { status, page, limit });
  }

  @Get('admin/finance/summary')
  @Auth(UserRole.Admin)
  @ApiOperation({ summary: 'Get platform finance summary' })
  async getAdminFinanceSummary() {
    return this.payoutsService.getAdminFinanceSummary();
  }

  @Get('admin/finance/earnings')
  @Auth(UserRole.Admin)
  @ApiOperation({ summary: 'Get admin earnings ledger' })
  @ApiQuery({ name: 'hostId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getAdminEarnings(
    @Query('hostId') hostId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.payoutsService.getAdminEarnings({ hostId, status, page, limit });
  }

  @Get('admin/payouts')
  @Auth(UserRole.Admin)
  @ApiOperation({ summary: 'Get admin payout queue and history' })
  @ApiQuery({ name: 'status', required: false })
  async getAdminPayouts(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.payoutsService.getAdminPayouts({ status, page, limit });
  }

  @Post('admin/payouts/generate')
  @Auth(UserRole.Admin)
  @ApiOperation({ summary: 'Generate pending payouts from completed unpaid earnings' })
  @ApiResponse({ status: 201, description: 'Payout batch generated' })
  async generatePayouts() {
    return this.payoutsService.generatePayouts();
  }

  @Patch('admin/payouts/:id/mark-paid')
  @Auth(UserRole.Admin)
  @ApiOperation({ summary: 'Mark a pending payout as paid' })
  async markPayoutPaid(@Param('id', ParseUUIDPipe) id: string) {
    return this.payoutsService.markPayoutPaid(id);
  }
}
