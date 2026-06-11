import { IsNotEmpty, IsString } from 'class-validator';

/** Cast (or switch) a vote for a campus member's island. */
export class SeasonVoteDto {
  /** The user whose personal island is being voted for. */
  @IsString() @IsNotEmpty()
  candidateId!: string;
}
