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
import { AdminService, AdminStats, SignupPoint } from './admin.service';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
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

  @Get('signups')
  signups(): Promise<SignupPoint[]> {
    return this.admin.getSignupsByDay();
  }

  @Get('users')
  users(): Promise<AdminUser[]> {
    return this.admin.listUsers();
  }

  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
  ): Promise<AdminUser> {
    return this.admin.updateUser(id, dto);
  }

  @Patch('users/:id/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPassword(
    @Param('id') id: string,
    @Body() dto: AdminResetPasswordDto,
  ): Promise<void> {
    return this.admin.resetPassword(id, dto.newPassword);
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
