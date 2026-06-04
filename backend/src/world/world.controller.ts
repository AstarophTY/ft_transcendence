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
}
