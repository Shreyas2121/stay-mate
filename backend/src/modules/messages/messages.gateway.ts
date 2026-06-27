import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { SocketConversationDto, SocketSendMessageDto } from './dto/socket-message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesService } from './messages.service';

type AuthenticatedSocket = Socket & {
  data: Socket['data'] & {
    user?: { id: string; email: string };
  };
};

@WebSocketGateway({
  namespace: '/messages',
  cors: {
    origin: 'http://localhost:3005',
    credentials: true,
  },
})
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class MessagesGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(MessagesGateway.name);

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.emit('message_error', {
          code: 'Unauthorized',
          message: 'Missing socket auth token',
        });
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET') || 'secretKey',
      });
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        client.emit('message_error', {
          code: 'Unauthorized',
          message: 'Socket user not found',
        });
        client.disconnect(true);
        return;
      }

      client.data.user = { id: user.id, email: user.email };
    } catch (error) {
      this.logger.warn(`Socket auth failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      client.emit('message_error', {
        code: 'Unauthorized',
        message: 'Invalid socket auth token',
      });
      client.disconnect(true);
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: SocketConversationDto,
  ) {
    const user = this.getSocketUser(client);
    if (!user) return;

    try {
      await this.messagesService.assertConversationParticipant(
        dto.conversationId,
        user.id,
      );
      await client.join(this.getConversationRoom(dto.conversationId));
      client.emit('conversation_joined', { conversationId: dto.conversationId });
    } catch (error) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: SocketSendMessageDto,
  ) {
    const user = this.getSocketUser(client);
    if (!user) return;

    try {
      const message = await this.messagesService.sendMessage(
        dto.conversationId,
        user.id,
        { content: dto.content } as SendMessageDto,
      );
      this.server
        .to(this.getConversationRoom(dto.conversationId))
        .emit('message_created', {
          conversationId: dto.conversationId,
          message,
        });
    } catch (error) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: SocketConversationDto,
  ) {
    const user = this.getSocketUser(client);
    if (!user) return;

    try {
      const result = await this.messagesService.markConversationRead(
        dto.conversationId,
        user.id,
      );
      this.server
        .to(this.getConversationRoom(dto.conversationId))
        .emit('messages_read', {
          conversationId: dto.conversationId,
          readerId: user.id,
          updatedCount: result.updatedCount,
        });
    } catch (error) {
      this.emitError(client, error);
    }
  }

  private extractToken(client: Socket) {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string') {
      return authToken.startsWith('Bearer ') ? authToken.slice(7) : authToken;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }

    return null;
  }

  private getSocketUser(client: AuthenticatedSocket) {
    const user = client.data.user;
    if (!user) {
      client.disconnect(true);
      return null;
    }
    return user;
  }

  private getConversationRoom(conversationId: string) {
    return `conversation:${conversationId}`;
  }

  private emitError(client: Socket, error: unknown) {
    const message = error instanceof Error ? error.message : 'Messaging error';
    const code = error instanceof Error ? error.constructor.name : 'Error';
    client.emit('message_error', { code, message });
  }
}




