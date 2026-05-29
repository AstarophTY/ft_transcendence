import {SubChunk} from "./SubChunk.ts";
import {Block} from "../Block.ts";

/**
 * Represents a vertical column of blocks (16x64x16).
 * * This class acts as a container for multiple SubChunks, dividing the total
 * height into smaller 16x16x16 segments. It handles the vertical coordinate
 * mapping to ensure that block data is routed to the correct SubChunk based on height.
 */
export class Chunk {
    public static readonly WIDTH = 16;
    public static readonly HEIGHT = 64;
    public static readonly SUBCHUNKS_COUNT = 4;

    private subChunks: SubChunk[];

    constructor() {
        this.subChunks = Array.from(
            { length: Chunk.SUBCHUNKS_COUNT },
            () => new SubChunk(Block.Air)
        );
    }

    public getBlock(x: number, y: number, z: number): Block {
        if (y < 0 || y >= Chunk.HEIGHT) return Block.Air;
        const subChunkIndex = Math.floor(y / SubChunk.SIZE);
        const localY = y % SubChunk.SIZE;
        return this.subChunks[subChunkIndex].getBlock(x, localY, z);
    }

    public setBlock(x: number, y: number, z: number, block: Block): void {
        if (y < 0 || y >= Chunk.HEIGHT) return;
        const subChunkIndex = Math.floor(y / SubChunk.SIZE);
        const localY = y % SubChunk.SIZE;
        this.subChunks[subChunkIndex].setBlock(x, localY, z, block);
    }
}