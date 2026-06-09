import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** Fields an admin may edit on an existing vote contest. */
export class UpdateContestDto {
  @IsOptional() @IsString() @MaxLength(120)
  title?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @IsOptional() @IsDateString()
  startsAt?: string;

  @IsOptional() @IsDateString()
  endsAt?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
