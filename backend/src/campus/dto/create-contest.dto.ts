import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** Fields an admin provides when opening a vote contest on a campus. */
export class CreateContestDto {
  @IsString() @MaxLength(120)
  title!: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;
}
