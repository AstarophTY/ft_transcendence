import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { VALIDATION_MESSAGES as M } from '../../common/validation-messages';

export class RegisterDto {
  @IsEmail({}, { message: M.EMAIL })
  email!: string;

  @IsString({ message: M.USERNAME_LENGTH })
  @MinLength(3, { message: M.USERNAME_LENGTH })
  @MaxLength(20, { message: M.USERNAME_LENGTH })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: M.USERNAME_PATTERN })
  username!: string;

  @IsString({ message: M.PASSWORD_LENGTH })
  @MinLength(8, { message: M.PASSWORD_LENGTH })
  @MaxLength(72, { message: M.PASSWORD_LENGTH })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message: M.PASSWORD_PATTERN,
  })
  password!: string;
}
