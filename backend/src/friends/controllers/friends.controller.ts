import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { FriendshipsService } from '@/friends/services/friendships.service';
import { FriendRequestsService } from '@/friends/services/friend-requests.service';
import { UserSearchService } from '@/friends/services/user-search.service';
import { SendRequestDto } from '../dto/send-request.dto';

@ApiTags('friends')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(
    private readonly friendshipsService: FriendshipsService,
    private readonly friendRequestsService: FriendRequestsService,
    private readonly userSearchService: UserSearchService,
  ) {}

  @Post('request')
  @ApiOperation({ summary: 'Send a friend request by username' })
  @ApiResponse({ status: 201, description: 'Friend request sent or auto-accepted.' })
  @ApiResponse({ status: 400, description: 'Invalid user or request already pending/accepted.' })
  sendRequest(
    @CurrentUser() user: any,
    @Body() body: SendRequestDto,
  ) {
    return this.friendRequestsService.sendFriendRequest(user.sub, body.username);
  }

  @Patch('request/:id/accept')
  @ApiOperation({ summary: 'Accept an incoming friend request' })
  @ApiResponse({ status: 200, description: 'Friend request accepted.' })
  acceptRequest(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) requestId: number,
  ) {
    return this.friendRequestsService.acceptFriendRequest(user.sub, requestId);
  }

  @Delete('request/:id')
  @ApiOperation({ summary: 'Decline or cancel a pending friend request' })
  @ApiResponse({ status: 200, description: 'Friend request declined/cancelled.' })
  rejectRequest(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) requestId: number,
  ) {
    return this.friendRequestsService.rejectFriendRequest(user.sub, requestId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a friend' })
  @ApiResponse({ status: 200, description: 'Friend removed successfully.' })
  removeFriend(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) friendId: number,
  ) {
    return this.friendshipsService.removeFriend(user.sub, friendId);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of accepted friends' })
  @ApiResponse({ status: 200, description: 'List of friends returned.' })
  getFriends(@CurrentUser() user: any) {
    return this.friendshipsService.getFriends(user.sub);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get list of pending incoming and outgoing requests' })
  @ApiResponse({ status: 200, description: 'Pending requests list returned.' })
  getPending(@CurrentUser() user: any) {
    return this.friendRequestsService.getPendingRequests(user.sub);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search other users by username query' })
  @ApiResponse({ status: 200, description: 'Search results returned.' })
  searchUsers(
    @CurrentUser() user: any,
    @Query('query') query: string,
  ) {
    return this.userSearchService.searchUsers(user.sub, query);
  }
}
