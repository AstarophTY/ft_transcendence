import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth.interfaces';
import { SaveBlocksDto } from './dto/save-blocks.dto';
import { WorldService } from './world.service';

@Controller('world')
@UseGuards(JwtAuthGuard)
export class WorldController {
  constructor(private readonly world: WorldService) {}

  /** One world profile per campus — drives the planet selection menu. */
  @Get()
  list() {
    return this.world.listWorlds();
  }

  /** Get personal world of the current user. */
  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.world.getUserWorld(user.userId);
  }

  /** A campus world: its generation profile plus every persisted block edit. */
  @Get(':campusId')
  get(@Param('campusId') campusId: string) {
    return this.world.getWorld(campusId);
  }

  /** Persist a batch of block edits (placed or broken) on a campus world. */
  @Post(':campusId/blocks')
  @HttpCode(HttpStatus.NO_CONTENT)
  save(
    @Param('campusId') campusId: string,
    @Body() dto: SaveBlocksDto,
  ): Promise<void> {
    return this.world.saveBlocks(campusId, dto.blocks);
  }

  /** Persist a batch of block edits on the user's personal world. */
  @Post('me/blocks')
  @HttpCode(HttpStatus.NO_CONTENT)
  saveMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: SaveBlocksDto,
  ): Promise<void> {
    return this.world.saveUserBlocks(user.userId, dto.blocks);
  }
}
