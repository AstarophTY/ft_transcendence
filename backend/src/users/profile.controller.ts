import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/interfaces/auth.interfaces';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeUsernameDto } from './dto/change-username.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';
import { SelfUser } from './users.select';

@Controller('users/me')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  /** Full self profile (email + campus included, no password hash). */
  @Get()
  async me(@CurrentUser() user: AuthUser): Promise<SelfUser> {
    const me = await this.profile.getMe(user.userId);
    if (!me) throw new Error('User not found');
    return me;
  }

  /** Update freely-editable fields (display name, bio, email, prefs, status). */
  @Patch()
  update(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<SelfUser> {
    return this.profile.updateProfile(user.userId, dto);
  }

  /** Change username (rate-limited to once / 30 days). */
  @Patch('username')
  changeUsername(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangeUsernameDto,
  ): Promise<SelfUser> {
    return this.profile.changeUsername(user.userId, dto.username);
  }

  /** Change password (requires the current one). */
  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    return this.profile.changePassword(
      user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
