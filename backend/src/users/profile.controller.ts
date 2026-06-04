import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/interfaces/auth.interfaces';
import {
  AVATAR_URL_PREFIX,
  avatarMulterOptions,
} from './avatar.upload';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeUsernameDto } from './dto/change-username.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';
import { SelfProfile, SelfUser } from './users.select';

@Controller('users/me')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  /** Full self profile (email + campus included, no password hash). */
  @Get()
  async me(@CurrentUser() user: AuthUser): Promise<SelfProfile> {
    const me = await this.profile.getMe(user.userId);
    // Stale token (e.g. user deleted / DB reset): 401 so the client logs out
    // and redirects to login instead of getting a 500.
    if (!me) throw new UnauthorizedException('User not found');
    return me;
  }

  /** Live 42 logtime diagnostics (why coins may stay at 0). */
  @Get('logtime')
  logtime(
    @CurrentUser() user: AuthUser,
  ): Promise<Record<string, unknown>> {
    return this.profile.debugLogtime(user.userId);
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
  /** Upload / replace the avatar image (multipart field: `file`). */
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', avatarMulterOptions))
  uploadAvatar(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<SelfUser> {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.profile.setAvatar(
      user.userId,
      `${AVATAR_URL_PREFIX}/${file.filename}`,
    );
  }

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
