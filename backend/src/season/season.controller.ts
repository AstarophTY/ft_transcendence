import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthUser } from '../auth/interfaces/auth.interfaces';
import { CreateSeasonDto } from './dto/create-season.dto';
import { SeasonVoteDto } from './dto/season-vote.dto';
import { SeasonCampusVoteDto } from './dto/season-campus-vote.dto';
import { SeasonService } from './season.service';
import { UpdateSeasonDto } from './dto/update-season.dto';

@Controller('season')
@UseGuards(JwtAuthGuard)
export class SeasonController {
  constructor(private readonly season: SeasonService) {}

  /** The active season + its current phase (any signed-in user). */
  @Get('current')
  current() {
    return this.season.getCurrent();
  }

  /** Every campus with its members' islands and vote counts. */
  @Get('ballot')
  ballot(@CurrentUser() user: AuthUser) {
    return this.season.getBallot(user.userId);
  }

  /** Cast or switch a vote for a campus member's island. */
  @Post('vote')
  vote(@Body() dto: SeasonVoteDto, @CurrentUser() user: AuthUser) {
    return this.season.vote(user.userId, dto.candidateId);
  }

  /** Cast or switch a campus-level vote (campus-less accounts only). */
  @Post('vote-campus')
  voteCampus(@Body() dto: SeasonCampusVoteDto, @CurrentUser() user: AuthUser) {
    return this.season.voteCampus(user.userId, dto.campusId);
  }

  // --- admin -----------------------------------------------------------------

  /** Every season (past, running and queued) for the admin overview. */
  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  all() {
    return this.season.listAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateSeasonDto) {
    return this.season.create(dto);
  }

  @Patch()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  update(@Body() dto: UpdateSeasonDto) {
    return this.season.update(dto);
  }

  @Post('end-build')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  endBuild() {
    return this.season.endBuildNow();
  }

  @Post('open-vote')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  openVote() {
    return this.season.openVoteNow();
  }

  @Post('close-vote')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  closeVote() {
    return this.season.closeVoteNow();
  }

  @Post('finalize')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  finalize() {
    return this.season.finalizeNow();
  }

  /** Delete a season and its ballots/results (does not touch world blocks). */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.season.remove(id);
  }
}
