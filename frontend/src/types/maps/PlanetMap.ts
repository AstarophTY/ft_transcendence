import { LocalMap } from "./LocalMap.ts";
import { Block } from "@/types/Block";
import { BlockMetadata } from "@/config/Block";
import { PreviewVoxel } from "./PreviewVoxel.ts";

const BLOCK_COLORS = BlockMetadata as Record<number, { color: string }>;

const hexToRgb = (hex: string): [number, number, number] => {
    const value = parseInt(hex.replace("#", ""), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const rgbToHex = (r: number, g: number, b: number): string =>
    "#" +
    [r, g, b]
        .map((n) => Math.round(n).toString(16).padStart(2, "0"))
        .join("");

export class PlanetMap {
    public continent: LocalMap;
    public islands: LocalMap[];

    constructor(continent: LocalMap, islands: LocalMap[] = []) {
        this.continent = continent;
        this.islands = islands;
    }

    /**
     * Generates a hyper-simplified voxel preview of the continent.
     * Uses downsampling to create a lightweight representation.
     * * @param resolution The size of the preview grid (e.g., 16 means a 16x16 miniature).
     * @returns An array of simplified voxel data.
     */
    public getPreview(resolution: number = 16): PreviewVoxel[] {
        const previewData: PreviewVoxel[] = [];

        // Calculate total map dimensions in blocks
        const totalWidth = this.continent.widthInChunks * 16;
        const totalDepth = this.continent.depthInChunks * 16;

        // Calculate the sampling step (how many real blocks make up one preview block)
        const stepX = totalWidth / resolution;
        const stepZ = totalDepth / resolution;

        if (stepX === 0 || stepZ === 0) return []; // Guard against invalid resolutions

        const MAX_HEIGHT = 63;

        for (let px = 0; px < resolution; px++) {
            for (let pz = 0; pz < resolution; pz++) {

                // Average the surface over the whole sample region instead of
                // point-sampling its center, so the miniature looks smooth.
                const startX = Math.floor(px * stepX);
                const startZ = Math.floor(pz * stepZ);
                let endX = Math.floor((px + 1) * stepX);
                let endZ = Math.floor((pz + 1) * stepZ);

                // Prevent holes if resolution is larger than the map size
                if (endX <= startX) endX = Math.min(startX + 1, totalWidth);
                if (endZ <= startZ) endZ = Math.min(startZ + 1, totalDepth);

                let heightSum = 0;
                let surfaceCount = 0;
                let rSum = 0, gSum = 0, bSum = 0;
                const blockCounts = new Map<Block, number>();

                for (let realX = startX; realX < endX; realX++) {
                    for (let realZ = startZ; realZ < endZ; realZ++) {
                        // Raycast downwards to find the surface block of this column.
                        for (let y = MAX_HEIGHT; y >= 0; y--) {
                            const block = this.continent.getGlobalBlock(realX, y, realZ);
                            if (block !== Block.Air) {
                                heightSum += y;
                                surfaceCount++;
                                blockCounts.set(block, (blockCounts.get(block) ?? 0) + 1);

                                // Accumulate the block color to average it later.
                                const hex = BLOCK_COLORS[block]?.color ?? "#808080";
                                const [r, g, b] = hexToRgb(hex);
                                rSum += r; gSum += g; bSum += b;
                                break;
                            }
                        }
                    }
                }

                if (surfaceCount > 0) {
                    // Most common surface block in the region (for the block id).
                    let surfaceBlock = Block.Air;
                    let best = 0;
                    for (const [block, count] of blockCounts) {
                        if (count > best) {
                            best = count;
                            surfaceBlock = block;
                        }
                    }

                    const averagedY = heightSum / surfaceCount;
                    // Smooth the height by scaling it down relative to the step,
                    // preventing the miniature from looking like sharp needles.
                    const smoothedY = averagedY / stepX;

                    previewData.push({
                        x: px,
                        y: smoothedY,
                        z: pz,
                        block: surfaceBlock,
                        color: rgbToHex(rSum / surfaceCount, gSum / surfaceCount, bSum / surfaceCount)
                    });
                }
            }
        }

        return previewData;
    }
}
