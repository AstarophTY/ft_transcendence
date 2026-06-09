import { Block } from '@/types/Block'

/**
 * Blocks that make up the generated world (terrain + trees) — free to place.
 * Every other block is "paid": placing it spends a campus coin and breaking a
 * placed one refunds a coin. Must mirror the backend `FREE_BLOCKS`.
 */
export const FREE_BLOCKS: ReadonlySet<Block> = new Set([
  Block.Stone,
  Block.Dirt,
  Block.Grass,
  Block.Wood,
  Block.Leaves,
  Block.Water,
  Block.Sand,
  Block.Gravel,
  Block.Sandstone,
])

/** Whether placing/breaking this block affects the campus coin budget. */
export const isPaidBlock = (block: Block): boolean =>
  block !== Block.Air && !FREE_BLOCKS.has(block)
