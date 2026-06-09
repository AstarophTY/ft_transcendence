import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

/** A single block edit: a position, the block placed (0 = Air/broken) and its
 * encoded orientation (2 bits per axis, 0..63). */
export class WorldBlockDto {
  @IsInt() x!: number;
  @IsInt() y!: number;
  @IsInt() z!: number;
  @IsInt() @Min(0) @Max(249) block!: number;
  @IsOptional() @IsInt() @Min(0) @Max(63) rotation?: number;
}

/** A batch of block edits to persist on a campus world. */
export class SaveBlocksDto {
  @IsArray()
  @ArrayMaxSize(4096)
  @ValidateNested({ each: true })
  @Type(() => WorldBlockDto)
  blocks!: WorldBlockDto[];
}
