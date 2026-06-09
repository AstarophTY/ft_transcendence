import { IsString, IsNotEmpty } from 'class-validator';

/** Payload for casting a vote: the candidate the voter supports. */
export class VoteDto {
  @IsString() @IsNotEmpty()
  userId!: string;
}
