import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'username may only contain letters, numbers, _ and -',
  })
  username!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message:
      'password must contain an uppercase letter, a lowercase letter, a number and a special character',
  })
  password!: string;
}
