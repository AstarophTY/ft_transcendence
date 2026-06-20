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
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import type { UserPayload } from "@/auth/decorators/current-user.decorator";
import { CurrentUser } from "@/auth/decorators/current-user.decorator";
import type { FriendshipsService } from "@/friends/services/friendships.service";
import type { FriendRequestsService } from "@/friends/services/friend-requests.service";
import type { UserSearchService } from "@/friends/services/user-search.service";
import type { SendRequestDto } from "../dto/send-request.dto";

@ApiTags("friends")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@Controller("friends")
export class FriendsController {
  public constructor(
    private readonly friendshipsService: FriendshipsService,
    private readonly friendRequestsService: FriendRequestsService,
    private readonly userSearchService: UserSearchService,
  ) {}

  @Post("request")
  @ApiOperation({ summary: "Send a friend request by username" })
  @ApiResponse({ description: "Friend request sent or auto-accepted.", status: 201 })
  @ApiResponse({ description: "Invalid user or request already pending/accepted.", status: 400 })
  public async sendRequest(
    @CurrentUser() user: UserPayload,
    @Body() body: SendRequestDto,
  ): Promise<unknown> {
    return this.friendRequestsService.sendFriendRequest(user.sub, body.username);
  }

  @Patch("request/:id/accept")
  @ApiOperation({ summary: "Accept an incoming friend request" })
  @ApiResponse({ description: "Friend request accepted.", status: 200 })
  public async acceptRequest(
    @CurrentUser() user: UserPayload,
    @Param("id", ParseIntPipe) requestId: number,
  ): Promise<unknown> {
    return this.friendRequestsService.acceptFriendRequest(user.sub, requestId);
  }

  @Delete("request/:id")
  @ApiOperation({ summary: "Decline or cancel a pending friend request" })
  @ApiResponse({ description: "Friend request declined/cancelled.", status: 200 })
  public async rejectRequest(
    @CurrentUser() user: UserPayload,
    @Param("id", ParseIntPipe) requestId: number,
  ): Promise<unknown> {
    return this.friendRequestsService.rejectFriendRequest(user.sub, requestId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remove a friend" })
  @ApiResponse({ description: "Friend removed successfully.", status: 200 })
  public async removeFriend(
    @CurrentUser() user: UserPayload,
    @Param("id", ParseIntPipe) friendId: number,
  ): Promise<unknown> {
    return this.friendshipsService.removeFriend(user.sub, friendId);
  }

  @Get()
  @ApiOperation({ summary: "Get list of accepted friends" })
  @ApiResponse({ description: "List of friends returned.", status: 200 })
  public async getFriends(@CurrentUser() user: UserPayload): Promise<unknown> {
    return this.friendshipsService.getFriends(user.sub);
  }

  @Get("pending")
  @ApiOperation({ summary: "Get list of pending incoming and outgoing requests" })
  @ApiResponse({ description: "Pending requests list returned.", status: 200 })
  public async getPending(@CurrentUser() user: UserPayload): Promise<unknown> {
    return this.friendRequestsService.getPendingRequests(user.sub);
  }

  @Get("search")
  @ApiOperation({ summary: "Search other users by username query" })
  @ApiResponse({ description: "Search results returned.", status: 200 })
  public async searchUsers(
    @CurrentUser() user: UserPayload,
    @Query("query") query: string,
  ): Promise<unknown> {
    return this.userSearchService.searchUsers(user.sub, query);
  }
}
