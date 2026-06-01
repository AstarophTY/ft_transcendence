import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Message } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/interfaces/auth.interfaces';
import { SendMessageDto } from './dto/send-message.dto';
import { FriendsGateway } from './friends.gateway';
import { MessagesService } from './messages.service';

@Controller('friends/:friendId/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private readonly messages: MessagesService,
    private readonly gateway: FriendsGateway,
  ) {}

  /** Read my conversation with a friend. */
  @Get()
  conversation(
    @CurrentUser() user: AuthUser,
    @Param('friendId') friendId: string,
  ): Promise<Message[]> {
    return this.messages.getConversation(user.userId, friendId);
  }

  /** Send a message to a friend (rate-limited to curb spam). */
  @Post()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 10000 } })
  async send(
    @CurrentUser() user: AuthUser,
    @Param('friendId') friendId: string,
    @Body() dto: SendMessageDto,
  ): Promise<Message> {
    const message = await this.messages.send(user.userId, friendId, dto.content);
    this.gateway.emitToUser(friendId, 'message:new', { message });
    return message;
  }
}
