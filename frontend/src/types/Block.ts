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

