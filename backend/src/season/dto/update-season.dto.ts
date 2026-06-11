import { IsDateString, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/** Editable fields of the running season. */
export class UpdateSeasonDto {
  @IsOptional() @IsString() @MaxLength(120)
  title?: string;

  @IsOptional() @IsDateString()
  buildStartsAt?: string;

  @IsOptional() @IsDateString()
  buildEndsAt?: string;

  @IsOptional() @IsInt() @Min(0)
  voteDelayMinutes?: number;

  @IsOptional() @IsInt() @Min(1)
  voteDurationMinutes?: number;
}
