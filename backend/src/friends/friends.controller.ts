import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Friendship, Message } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/interfaces/auth.interfaces';
import { PublicUser } from '../users/users.select';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { FriendsService } from './friends.service';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friends: FriendsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<PublicUser[]> {
    return this.friends.listFriends(user.userId);
  }

  @Get('requests/incoming')
  incoming(@CurrentUser() user: AuthUser): Promise<Friendship[]> {
    return this.friends.listIncoming(user.userId);
  }

  @Get('requests/outgoing')
  outgoing(@CurrentUser() user: AuthUser): Promise<Friendship[]> {
    return this.friends.listOutgoing(user.userId);
  }

  @Post('requests')
  send(
    @CurrentUser() user: AuthUser,
    @Body() dto: SendFriendRequestDto,
  ): Promise<Friendship> {
    return this.friends.sendRequest(user.userId, dto.username);
  }

  @Post('requests/:id/accept')
  @HttpCode(HttpStatus.OK)
  accept(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<Friendship> {
    return this.friends.accept(user.userId, id);
  }

  @Delete('requests/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  decline(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.friends.decline(user.userId, id);
  }

  @Get(':friendId')
  profile(
    @CurrentUser() user: AuthUser,
    @Param('friendId') friendId: string,
  ): Promise<PublicUser> {
    return this.friends.getFriendProfile(user.userId, friendId);
  }

  @Delete(':friendId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('friendId') friendId: string,
  ): Promise<void> {
    return this.friends.removeFriend(user.userId, friendId);
  }

  @Get(':friendId/messages')
  conversation(
    @CurrentUser() user: AuthUser,
    @Param('friendId') friendId: string,
  ): Promise<Message[]> {
    return this.friends.getConversation(user.userId, friendId);
  }

  @Post(':friendId/messages')
  message(
    @CurrentUser() user: AuthUser,
    @Param('friendId') friendId: string,
    @Body() dto: SendMessageDto,
  ): Promise<Message> {
    return this.friends.sendMessage(user.userId, friendId, dto.content);
  }
}
