import { Chunk } from '@/models/maps/Chunk.ts'

export const CHUNKS_PER_SIDE = 32
export const MAP_SIZE_BLOCKS = CHUNKS_PER_SIDE * Chunk.WIDTH
export const RENDER_DISTANCE_CHUNKS = 12
