import { IsString, MaxLength, MinLength } from 'class-validator';

/** Payload to create a campus from the admin panel. */
export class CreateCampusDto {
  @IsString() @MinLength(1) @MaxLength(60)
  label!: string;
}
