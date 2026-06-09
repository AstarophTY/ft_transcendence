import { Controller, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { WorldService } from './world.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth.interfaces';

@Controller('vote')
@UseGuards(JwtAuthGuard)
export class VoteController {
  constructor(private readonly worldService: WorldService) {}

  @Post('join/:contestId')
  async join(@Param('contestId') contestId: string, @CurrentUser() user: AuthUser) {
    return this.worldService.joinContest(user.userId, contestId);
  }

  @Delete('quit/:contestId')
  async quit(@Param('contestId') contestId: string, @CurrentUser() user: AuthUser) {
    return this.worldService.quitContest(user.userId, contestId);
  }

  @Post(':contestId/vote')
  async vote(
    @Param('contestId') contestId: string,
    @Body('userId') targetUserId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.worldService.vote(user.userId, contestId, targetUserId);
  }
}