import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { VALIDATION_MESSAGES as M } from '../../common/validation-messages';

export class ChangeUsernameDto {
  @IsString({ message: M.USERNAME_LENGTH })
  @MinLength(3, { message: M.USERNAME_LENGTH })
  @MaxLength(20, { message: M.USERNAME_LENGTH })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: M.USERNAME_PATTERN })
  username!: string;
}
