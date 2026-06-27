import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class SocketSendMessageDto {
  @IsUUID()
  conversationId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}

export class SocketConversationDto {
  @IsUUID()
  conversationId: string;
}
