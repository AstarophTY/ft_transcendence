import { Chunk } from "./Chunk.ts";
import { Block } from "@/types/Block";

/**
 * Represents a dynamically sized map of chunks.
 * Uses a flat 1D array for optimized memory access.
 */
export class LocalMap {
    public readonly widthInChunks: number;
    public readonly depthInChunks: number;

    // Flat 1D array storing the chunks
    private chunks: (Chunk | null)[];

    /**
     * @param widthInChunks The size of the map along the X axis (in chunks)
     * @param depthInChunks The size of the map along the Z axis (in chunks)
     */
    constructor(widthInChunks: number, depthInChunks: number) {
        this.widthInChunks = widthInChunks;
        this.depthInChunks = depthInChunks;
        this.chunks = new Array(widthInChunks * depthInChunks).fill(null);
    }

    /**
     * Converts 2D chunk coordinates to a flat 1D array index.
     */
    private getChunkIndex(chunkX: number, chunkZ: number): number {
        return chunkX + (chunkZ * this.widthInChunks);
    }

    /**
     * Checks if the given chunk coordinates are within the map boundaries.
     */
    public isChunkInBounds(chunkX: number, chunkZ: number): boolean {
        return chunkX >= 0 && chunkX < this.widthInChunks &&
            chunkZ >= 0 && chunkZ < this.depthInChunks;
    }

    /**
     * Injects a generated chunk at the specific grid coordinates.
     */
    public setChunk(chunkX: number, chunkZ: number, chunk: Chunk): void {
        if (!this.isChunkInBounds(chunkX, chunkZ)) return;
        this.chunks[this.getChunkIndex(chunkX, chunkZ)] = chunk;
    }

    /**
     * Retrieves a chunk at the specific grid coordinates.
     */
    public getChunk(chunkX: number, chunkZ: number): Chunk | null {
        if (!this.isChunkInBounds(chunkX, chunkZ)) return null;
        return this.chunks[this.getChunkIndex(chunkX, chunkZ)];
    }

    /**
     * Retrieves a block using GLOBAL world coordinates.
     * Automatically routes to the correct chunk and local coordinates.
     */
    public getGlobalBlock(globalX: number, globalY: number, globalZ: number): Block {
        // Find which chunk this block belongs to
        const chunkX = Math.floor(globalX / Chunk.WIDTH);
        const chunkZ = Math.floor(globalZ / Chunk.WIDTH);

        const chunk = this.getChunk(chunkX, chunkZ);

        // If the chunk isn't loaded or doesn't exist, treat it as air/void
        if (!chunk) return Block.Air;

        // Find the local coordinates INSIDE the chunk
        // Note: Using a double modulo formula properly handles negative global coordinates
        const localX = ((globalX % Chunk.WIDTH) + Chunk.WIDTH) % Chunk.WIDTH;
        const localZ = ((globalZ % Chunk.WIDTH) + Chunk.WIDTH) % Chunk.WIDTH;

        return chunk.getBlock(localX, globalY, localZ);
    }

    /**
     * Sets a block using GLOBAL world coordinates.
     */
    public setGlobalBlock(globalX: number, globalY: number, globalZ: number, block: Block): void {
        const chunkX = Math.floor(globalX / Chunk.WIDTH);
        const chunkZ = Math.floor(globalZ / Chunk.WIDTH);

        const chunk = this.getChunk(chunkX, chunkZ);
        if (!chunk) return; // Cannot place a block in an unloaded chunk

        const localX = ((globalX % Chunk.WIDTH) + Chunk.WIDTH) % Chunk.WIDTH;
        const localZ = ((globalZ % Chunk.WIDTH) + Chunk.WIDTH) % Chunk.WIDTH;

        chunk.setBlock(localX, globalY, localZ, block);
    }
}
