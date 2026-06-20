import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({ description: "The username of the user", example: "johndoe" })
  @IsString()
  @IsNotEmpty()
  public username!: string;

  @ApiProperty({ description: "The password of the user", example: "secretpassword" })
  @IsString()
  @IsNotEmpty()
  public password!: string;
}
