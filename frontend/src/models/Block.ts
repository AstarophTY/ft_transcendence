export enum Block {
  Air = 0,
  Stone = 1,
  Dirt = 2,
  Grass = 3,
  Wood = 4,
  Leaves = 5,
  Water = 6,
  Sand = 7,
  Glass = 8,
}

export interface BlockMeta {
  id: Block;
  name: string;
  color: string;
  category: string;
}

export const BLOCK_METADATA: Record<Exclude<Block, Block.Air>, BlockMeta> = {
  [Block.Stone]: { id: Block.Stone, name: "Stone", color: "#808080", category: "gray" },
  [Block.Dirt]: { id: Block.Dirt, name: "Dirt", color: "#8b4513", category: "brown" },
  [Block.Grass]: { id: Block.Grass, name: "Grass", color: "#228b22", category: "green" },
  [Block.Wood]: { id: Block.Wood, name: "Wood", color: "#a0522d", category: "brown" },
  [Block.Leaves]: { id: Block.Leaves, name: "Leaves", color: "#006400", category: "green" },
  [Block.Water]: { id: Block.Water, name: "Water", color: "#1e90ff", category: "blue" },
  [Block.Sand]: { id: Block.Sand, name: "Sand", color: "#f4a460", category: "yellow" },
  [Block.Glass]: { id: Block.Glass, name: "Glass", color: "#add8e6", category: "blue" },
};

export const BLOCKS_LIST = Object.values(BLOCK_METADATA);
