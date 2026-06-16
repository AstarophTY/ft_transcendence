import {Block} from "@/types/block.ts";

/** Terrain generation profile of a campus world (mirrors the backend). */
export interface WorldProfile {
    seed: string
    widthInChunks: number
    depthInChunks: number
    scale: number
    octaves: number
    persistence: number
    relief: number
    baseHeight: number
    variationRange: number
}

/** A campus world in the selection menu: its campus plus its terrain profile. */
export interface CampusWorld extends WorldProfile {
    campusId: string
    label: string
    blocks?: WorldBlock[]
}

/** A single persisted block edit (block = 0/Air for a broken block). */
export interface WorldBlock {
    x: number
    y: number
    z: number
    block: Block
    /** Encoded orientation (2 bits per X/Y/Z axis, 0..63); 0 = unrotated. */
    rotation: number
}

/** A campus world with its profile and every persisted block edit. */
export interface WorldDetail extends WorldProfile {
    campusId: string
    blocks: WorldBlock[]
}