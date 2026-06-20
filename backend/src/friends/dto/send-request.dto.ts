import { IsNotEmpty, IsString } from "class-validator";

export class SendRequestDto {
  @IsString()
  @IsNotEmpty()
  public username!: string;
}
