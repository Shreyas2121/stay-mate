import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 'Hi, what time is check-in?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}
