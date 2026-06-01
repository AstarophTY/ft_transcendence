import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { UserStatus } from '@prisma/client';

/** Fields an admin may edit on any account. Add a field to extend. */
export class AdminUpdateUserDto {
  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString() @MaxLength(40)
  displayName?: string;

  @IsOptional() @IsString() @MaxLength(280)
  bio?: string;

  @IsOptional() @IsString() @MaxLength(60)
  campus?: string;

  @IsOptional() @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional() @IsString() @MaxLength(80)
  statusMessage?: string;
}
