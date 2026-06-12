import { IsEmail, IsString, MinLength } from 'class-validator';
import { VALIDATION_MESSAGES as M } from '../../common/validation-messages';

export class LoginDto {
  @IsEmail({}, { message: M.EMAIL })
  email!: string;

  @IsString({ message: M.PASSWORD_LENGTH })
  @MinLength(8, { message: M.PASSWORD_LENGTH })
  password!: string;
}
