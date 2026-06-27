import { Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';
import { MessagesService } from './messages.service';

@ApiTags('messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  @Auth()
  @ApiOperation({ summary: 'Get current user messaging inbox' })
  async getMyConversations(@CurrentUser() user: User) {
    return this.messagesService.getMyConversations(user.id);
  }

  @Post('conversations/booking/:bookingId')
  @Auth()
  @ApiOperation({ summary: 'Get or create a conversation for a confirmed booking' })
  @ApiResponse({ status: 400, description: 'Booking is not confirmed' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getOrCreateBookingConversation(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @CurrentUser() user: User,
  ) {
    return this.messagesService.getOrCreateConversationForBooking(
      bookingId,
      user.id,
    );
  }

  @Get('conversations/:conversationId/messages')
  @Auth()
  @ApiOperation({ summary: 'Get paginated message history for a conversation' })
  async getConversationMessages(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @CurrentUser() user: User,
    @Query() query: GetMessagesQueryDto,
  ) {
    return this.messagesService.getConversationMessages(
      conversationId,
      user.id,
      query,
    );
  }

  @Patch('conversations/:conversationId/read')
  @Auth()
  @ApiOperation({ summary: 'Mark a conversation read for the current user' })
  async markConversationRead(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @CurrentUser() user: User,
  ) {
    return this.messagesService.markConversationRead(conversationId, user.id);
  }
}
