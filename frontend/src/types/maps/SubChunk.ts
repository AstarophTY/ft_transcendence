import {Block} from "@/types/Block";

/**
 * Represents a 16x16x16 section of the world.
 * * Optimization: This class uses a "Lazy Allocation" strategy. It remains in a
 * 'uniform' state (storing only one block type) until a different block is placed.
 * This significantly reduces RAM usage for empty (air) or solid underground chunks.
 */
export class SubChunk {
    public static readonly SIZE = 16;
    public static readonly VOLUME = 16 * 16 * 16;

    private isUniform: boolean;
    private uniformBlock: Block;

    private blocks: Uint16Array | null;

    constructor(defaultBlock: Block = Block.Air) {
        this.isUniform = true;
        this.uniformBlock = defaultBlock;
        this.blocks = null;
    }

    private getIndex(x: number, y: number, z: number): number {
        return x + (z << 4) + (y << 8);
    }

    public getBlock(x: number, y: number, z: number): Block {
        if (this.isUniform) {
            return this.uniformBlock;
        }
        return this.blocks![this.getIndex(x, y, z)];
    }

    public setBlock(x: number, y: number, z: number, block: Block): void {
        if (this.isUniform) {
            if (this.uniformBlock === block) return;

            this.blocks = new Uint16Array(SubChunk.VOLUME);
            this.blocks.fill(this.uniformBlock);
            this.isUniform = false;
        }

        this.blocks![this.getIndex(x, y, z)] = block;
    }
}
