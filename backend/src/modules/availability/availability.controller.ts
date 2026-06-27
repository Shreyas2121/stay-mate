import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ActiveRole } from '../users/enums/user.enum';
import { CreateAvailabilityBlockDto } from './dto/create-availability-block.dto';
import { GetAvailabilityBlocksDto } from './dto/get-availability-blocks.dto';

@ApiTags('availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('listings/:listingId/blocks')
  @ApiOperation({ summary: 'Get blocked dates for a listing' })
  @ApiResponse({ status: 200, description: 'Blocked date ranges returned successfully' })
  async getPublicBlocks(
    @Param('listingId') listingId: string,
    @Query() query: GetAvailabilityBlocksDto,
  ) {
    return this.availabilityService.getPublicBlocks(listingId, query);
  }

  @Get('my-listings/:listingId/blocks')
  @Auth()
  @ApiOperation({ summary: 'Get blocked dates for a host-owned listing' })
  @ApiResponse({ status: 200, description: 'Blocked date ranges returned successfully' })
  async getHostBlocks(
    @Param('listingId') listingId: string,
    @CurrentUser() user: User,
    @Query() query: GetAvailabilityBlocksDto,
  ) {
    this.assertHostMode(user);
    return this.availabilityService.getHostBlocks(listingId, user, query);
  }

  @Post('my-listings/:listingId/blocks')
  @Auth()
  @ApiOperation({ summary: 'Create a blocked date range for a host-owned listing' })
  @ApiResponse({ status: 201, description: 'Availability block created successfully' })
  async createBlock(
    @Param('listingId') listingId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateAvailabilityBlockDto,
  ) {
    this.assertHostMode(user);
    return this.availabilityService.createBlock(listingId, user, dto);
  }

  @Delete('blocks/:blockId')
  @Auth()
  @ApiOperation({ summary: 'Delete an availability block from a host-owned listing' })
  @ApiResponse({ status: 200, description: 'Availability block deleted successfully' })
  async deleteBlock(
    @Param('blockId') blockId: string,
    @CurrentUser() user: User,
  ) {
    this.assertHostMode(user);
    return this.availabilityService.deleteBlock(blockId, user);
  }

  private assertHostMode(user: User) {
    if (user.activeRole !== ActiveRole.Host) {
      throw new ForbiddenException('Only hosts in Host mode can manage listing availability');
    }
  }
}
