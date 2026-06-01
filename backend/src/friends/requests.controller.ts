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
import { Friendship, FriendshipStatus } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/interfaces/auth.interfaces';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { FriendsGateway } from './friends.gateway';
import { RequestsService } from './requests.service';

@Controller('friends/requests')
@UseGuards(JwtAuthGuard)
export class RequestsController {
  constructor(
    private readonly requests: RequestsService,
    private readonly gateway: FriendsGateway,
  ) {}

  @Get('incoming')
  incoming(@CurrentUser() user: AuthUser): Promise<Friendship[]> {
    return this.requests.listIncoming(user.userId);
  }

  @Get('outgoing')
  outgoing(@CurrentUser() user: AuthUser): Promise<Friendship[]> {
    return this.requests.listOutgoing(user.userId);
  }

  @Post()
  async send(
    @CurrentUser() user: AuthUser,
    @Body() dto: SendFriendRequestDto,
  ): Promise<Friendship> {
    const friendship = await this.requests.send(user.userId, dto.username);
    if (friendship.status === FriendshipStatus.ACCEPTED) {
      this.announceFriendship(friendship);
    } else {
      this.gateway.emitToUser(friendship.addresseeId, 'friend:request', {
        friendship,
      });
    }
    return friendship;
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  async accept(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<Friendship> {
    const friendship = await this.requests.accept(user.userId, id);
    this.announceFriendship(friendship);
    return friendship;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  decline(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.requests.decline(user.userId, id);
  }

  /** Notify both sides of a new friendship and sync their online status. */
  private announceFriendship(friendship: Friendship): void {
    const { requesterId, addresseeId } = friendship;
    this.gateway.emitToUser(requesterId, 'friend:accepted', { friendship });
    this.gateway.emitToUser(addresseeId, 'friend:accepted', { friendship });
    this.gateway.syncNewFriendship(requesterId, addresseeId);
  }
}
