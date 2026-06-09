import { Controller, Post, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { WorldService } from './world.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('vote')
@UseGuards(JwtAuthGuard)
export class VoteController {
  constructor(private readonly worldService: WorldService) {}

  @Post('join/:contestId')
  async join(@Param('contestId') contestId: string, @Req() req: any) {
    // Authentication middleware should provide the user in the request
    const userId = req.user.id;
    return this.worldService.joinContest(userId, contestId);
  }

  @Delete('quit/:contestId')
  async quit(@Param('contestId') contestId: string, @Req() req: any) {
    const userId = req.user.id;
    return this.worldService.quitContest(userId, contestId);
  }

  @Post(':contestId/vote')
  async vote(
    @Param('contestId') contestId: string,
    @Body('userId') targetUserId: string,
    @Req() req: any,
  ) {
    const voterId = req.user.id;
    return this.worldService.vote(voterId, contestId, targetUserId);
  }
}