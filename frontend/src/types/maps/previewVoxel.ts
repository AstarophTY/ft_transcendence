import { Block } from "@/types/block.ts";

export interface PreviewVoxel {
    x: number;
    y: number;
    z: number;
    block: Block;
    /** Averaged hex color of the blocks in the sampled region. */
    color: string;
}
