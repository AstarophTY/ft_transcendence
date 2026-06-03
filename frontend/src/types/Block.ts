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
  Bedrock = 9,
  Pumpkin = 10,
  Furnace = 11,
  Plank = 12
}

export interface BlockMeta {
  id: Block;
  name: string;
  color: string;
  category: string;
}

