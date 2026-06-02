import { LocalMap } from "./LocalMap.ts";
import { Block } from "@/types/Block";
import { PreviewVoxel } from "./PreviewVoxel.ts";

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
        const stepX = Math.floor(totalWidth / resolution);
        const stepZ = Math.floor(totalDepth / resolution);

        if (stepX === 0 || stepZ === 0) return []; // Guard against invalid resolutions

        const MAX_HEIGHT = 63;

        for (let px = 0; px < resolution; px++) {
            for (let pz = 0; pz < resolution; pz++) {

                // Find the center coordinate of this sample region
                const realX = Math.floor(px * stepX + stepX / 2);
                const realZ = Math.floor(pz * stepZ + stepZ / 2);

                // Raycast downwards to find the surface block
                let surfaceY = 0;
                let surfaceBlock = Block.Air;

                for (let y = MAX_HEIGHT; y >= 0; y--) {
                    const block = this.continent.getGlobalBlock(realX, y, realZ);
                    if (block !== Block.Air) {
                        surfaceY = y;
                        surfaceBlock = block;
                        break;
                    }
                }

                if (surfaceBlock !== Block.Air) {
                    // Smooth the height by scaling it down relative to the horizontal step.
                    // This prevents the miniature from looking like sharp needles.
                    const smoothedY = surfaceY / stepX;

                    previewData.push({
                        x: px,
                        y: smoothedY,
                        z: pz,
                        block: surfaceBlock
                    });
                }
            }
        }

        return previewData;
    }
}
