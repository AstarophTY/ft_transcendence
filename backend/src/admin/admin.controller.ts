import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthUser } from '../auth/interfaces/auth.interfaces';
import { AdminUser } from '../users/users.select';
import { AdminService, AdminStats } from './admin.service';
import { SetRoleDto } from './dto/set-role.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats(): Promise<AdminStats> {
    return this.admin.getStats();
  }

  @Get('users')
  users(): Promise<AdminUser[]> {
    return this.admin.listUsers();
  }

  @Patch('users/:id/role')
  setRole(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() dto: SetRoleDto,
  ): Promise<AdminUser> {
    return this.admin.setRole(admin.userId, id, dto.role);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.admin.deleteUser(admin.userId, id);
  }
}
