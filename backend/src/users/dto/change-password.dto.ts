import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { VALIDATION_MESSAGES as M } from '../../common/validation-messages';

export class ChangePasswordDto {
  @IsString({ message: M.CURRENT_PASSWORD_REQUIRED })
  currentPassword!: string;

  @IsString({ message: M.PASSWORD_LENGTH })
  @MinLength(8, { message: M.PASSWORD_LENGTH })
  @MaxLength(72, { message: M.PASSWORD_LENGTH })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message: M.PASSWORD_PATTERN,
  })
  newPassword!: string;
}
