import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Campus, CampusRequest, Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CampusService } from './campus.service';

@Controller('campus')
@UseGuards(JwtAuthGuard)
export class CampusController {
  constructor(private readonly campus: CampusService) {}

  @Get()
  list(): Promise<Campus[]> {
    return this.campus.list();
  }

  @Get('requests')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  listRequests(): Promise<CampusRequest[]> {
    return this.campus.listRequests();
  }

  @Post('requests/:id/approve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  approve(@Param('id') id: string): Promise<Campus> {
    return this.campus.approve(id);
  }

  @Post('requests/:id/decline')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  decline(@Param('id') id: string): Promise<void> {
    return this.campus.decline(id);
  }
}
