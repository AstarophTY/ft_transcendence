import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/** Fields an admin may edit on a campus. */
export class UpdateCampusDto {
  @IsOptional() @IsString() @MaxLength(60)
  label?: string;

  @IsOptional() @IsInt() @Min(0)
  coins?: number;
}
