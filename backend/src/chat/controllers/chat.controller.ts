import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { ChatService } from '@/chat/services/chat.service';

@ApiTags('chat')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Get list of active direct message conversations' })
  @ApiResponse({ status: 200, description: 'List of conversations returned.' })
  getConversations(@CurrentUser() user: any) {
    return this.chatService.getConversations(user.sub);
  }

  @Get('global')
  @ApiOperation({ summary: 'Get global chat message history' })
  @ApiResponse({ status: 200, description: 'Global message history returned.' })
  getGlobalHistory(
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
  ) {
    return this.chatService.getGlobalMessageHistory(
      limit ? Number(limit) : 100,
      skip ? Number(skip) : 0,
    );
  }

  @Get('messages/:friendId')
  @ApiOperation({ summary: 'Get message history with a specific friend' })
  @ApiResponse({ status: 200, description: 'Message history returned.' })
  getMessageHistory(
    @CurrentUser() user: any,
    @Param('friendId', ParseIntPipe) friendId: number,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
  ) {
    return this.chatService.getMessageHistory(
      user.sub,
      friendId,
      limit ? Number(limit) : 100,
      skip ? Number(skip) : 0,
    );
  }
}
