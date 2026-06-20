import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import type { UserPayload } from "@/auth/decorators/current-user.decorator";
import { CurrentUser } from "@/auth/decorators/current-user.decorator";
import { ChatService } from "@/chat/services/chat.service";

@ApiTags("chat")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@Controller("chat")
export class ChatController {
  public constructor(private readonly chatService: ChatService) {}

  @Get("conversations")
  @ApiOperation({ summary: "Get list of active direct message conversations" })
  @ApiResponse({ description: "List of conversations returned.", status: 200 })
  public async getConversations(@CurrentUser() user: UserPayload): Promise<unknown> {
    return this.chatService.getConversations(user.sub);
  }

  @Get("global")
  @ApiOperation({ summary: "Get global chat message history" })
  @ApiResponse({ description: "Global message history returned.", status: 200 })
  public async getGlobalHistory(
    @Query("limit") limit?: number,
    @Query("skip") skip?: number,
  ): Promise<unknown> {
    return this.chatService.getGlobalMessageHistory(
      limit ? Number(limit) : 100,
      skip ? Number(skip) : 0,
    );
  }

  @Get("messages/:friendId")
  @ApiOperation({ summary: "Get message history with a specific friend" })
  @ApiResponse({ description: "Message history returned.", status: 200 })
  public async getMessageHistory(
    @CurrentUser() user: UserPayload,
    @Param("friendId", ParseIntPipe) friendId: number,
    @Query("limit") limit?: number,
    @Query("skip") skip?: number,
  ): Promise<unknown> {
    return this.chatService.getMessageHistory(
      user.sub,
      friendId,
      limit ? Number(limit) : 100,
      skip ? Number(skip) : 0,
    );
  }
}
