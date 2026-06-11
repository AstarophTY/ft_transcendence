import { IsNotEmpty, IsString } from 'class-validator';

/** Cast (or switch) a campus-level vote (campus-less accounts only). */
export class SeasonCampusVoteDto {
  /** The campus being voted for. */
  @IsString() @IsNotEmpty()
  campusId!: string;
}
