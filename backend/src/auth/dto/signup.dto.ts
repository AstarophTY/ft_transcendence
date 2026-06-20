import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length, Matches, MaxLength, MinLength } from "class-validator";

export class SignupDto {
  @ApiProperty({
    description:
      "The username of the user (3 to 20 characters, alphanumeric, underscores, or hyphens)",
    example: "johndoe",
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 20, { message: "Username must be between 3 and 20 characters long" })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: "Username can only contain alphanumeric characters, underscores, and hyphens",
  })
  public username!: string;

  @ApiProperty({
    description:
      "The password of the user (8 to 64 characters, at least 1 uppercase, 1 lowercase, 1 number, and 1 special character)",
    example: "Secret123!",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @MaxLength(64, { message: "Password must be at most 64 characters long" })
  @Matches(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  @Matches(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
  @Matches(/[0-9]/, { message: "Password must contain at least one number" })
  @Matches(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" })
  public password!: string;
}
