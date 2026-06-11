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
import { Campus, Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CampusService } from './campus.service';
import { CreateCampusDto } from './dto/create-campus.dto';
import { UpdateCampusDto } from './dto/update-campus.dto';

@Controller('campus')
@UseGuards(JwtAuthGuard)
export class CampusController {
  constructor(private readonly campus: CampusService) {}

  /** Approved campuses — visible to any signed-in user. */
  @Get()
  list(): Promise<Campus[]> {
    return this.campus.list();
  }

  // --- staff only ----------------------------------------------------------

  /** Every campus with its members and coin balance. */
  @Get('manage')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  listWithMembers() {
    return this.campus.listWithMembers();
  }

  /** Create a campus from just a name. */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateCampusDto): Promise<Campus> {
    return this.campus.create(dto);
  }

  /** Rename a campus and/or set its coin balance. */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCampusDto,
  ): Promise<Campus> {
    return this.campus.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.campus.remove(id);
  }

  /** Attach a single user to a campus. */
  @Post(':id/members/:userId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  addMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    return this.campus.addMember(id, userId);
  }

  /** Detach a single member from a campus. */
  @Delete(':id/members/:userId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    return this.campus.removeMember(id, userId);
  }
}
