import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { UserStatus } from '@prisma/client';

/**
 * Freely-editable profile fields (no cooldown). To let users edit a new field,
 * add it both here and to `SELF_USER_SELECT` — the service persists whatever
 * this DTO validates.
 */
export class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(40)
  displayName?: string;

  @IsOptional() @IsString() @MaxLength(280)
  bio?: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString() @MaxLength(8)
  language?: string;

  @IsOptional() @IsString() @MaxLength(16)
  theme?: string;

  @IsOptional() @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional() @IsString() @MaxLength(80)
  statusMessage?: string;

  @IsOptional() @IsString() @MaxLength(9)
  skinColor?: string;
}
