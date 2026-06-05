/** Air / empty block. */
export const AIR = 0;

/**
 * Blocks that make up the generated world (terrain + trees). They are free to
 * place. Every other block is "paid": placing it costs a campus coin and
 * breaking a placed one refunds a coin. Values mirror the frontend Block enum.
 */
export const FREE_BLOCKS: ReadonlySet<number> = new Set([
  1, // Stone
  2, // Dirt
  3, // Grass
  4, // Wood
  5, // Leaves
  6, // Water
  7, // Sand
  9, // Bedrock
  125, // Gravel
  208, // Sandstone
]);

/** A block whose placement/break affects the campus coin budget. */
export const isPaidBlock = (block: number): boolean =>
  block !== AIR && !FREE_BLOCKS.has(block);
