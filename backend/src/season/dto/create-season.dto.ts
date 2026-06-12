import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/** Fields an admin provides to open a new global season. */
export class CreateSeasonDto {
  @IsString() @MaxLength(120)
  title!: string;

  @IsDateString()
  buildStartsAt!: string;

  @IsDateString()
  buildEndsAt!: string;

  /** Minutes between the end of building and the vote opening. */
  @IsInt() @Min(0)
  voteDelayMinutes!: number;

  /** How long the vote stays open, in minutes. */
  @IsInt() @Min(1)
  voteDurationMinutes!: number;

  /**
   * Acknowledge that an immediate season (build starts now/in the past) will end
   * the running season and reset every world. Required only for that case; a
   * future-scheduled season just queues and never needs it.
   */
  @IsOptional() @IsBoolean()
  force?: boolean;
}
