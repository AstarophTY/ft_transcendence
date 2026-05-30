import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/interfaces/auth.interfaces';
import { PublicUser } from '../users/users.select';
import { FriendsGateway } from './friends.gateway';
import { FriendsService } from './friends.service';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(
    private readonly friends: FriendsService,
    private readonly gateway: FriendsGateway,
  ) {}

  /** List my friends (public profiles, no email). */
  @Get()
  list(@CurrentUser() user: AuthUser): Promise<PublicUser[]> {
    return this.friends.listFriends(user.userId);
  }

  /** Example: get info about a friend (avatar, name, …) — never the email. */
  @Get(':friendId')
  profile(
    @CurrentUser() user: AuthUser,
    @Param('friendId') friendId: string,
  ): Promise<PublicUser> {
    return this.friends.getFriendProfile(user.userId, friendId);
  }

  /** Remove a friend. */
  @Delete(':friendId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('friendId') friendId: string,
  ): Promise<void> {
    await this.friends.removeFriend(user.userId, friendId);
    this.gateway.emitToUser(friendId, 'friend:removed', { userId: user.userId });
  }
}
