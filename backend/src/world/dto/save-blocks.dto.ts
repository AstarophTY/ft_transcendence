import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

/** A single block edit: a position and the block placed there (0 = Air/broken). */
export class WorldBlockDto {
  @IsInt() x!: number;
  @IsInt() y!: number;
  @IsInt() z!: number;
  @IsInt() @Min(0) @Max(12) block!: number;
}

/** A batch of block edits to persist on a campus world. */
export class SaveBlocksDto {
  @IsArray()
  @ArrayMaxSize(4096)
  @ValidateNested({ each: true })
  @Type(() => WorldBlockDto)
  blocks!: WorldBlockDto[];
}
