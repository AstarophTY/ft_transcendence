import {Perlin2D} from "../noise/Perlin2D";
import type {MapConfig} from "./MapConfig";


export class IslandMap {
    private perlin: Perlin2D;
    private config: MapConfig;

    constructor(config: MapConfig) {
        this.config = config;
        this.config.octaves = config.octaves || 3;
        this.config.persistence = config.persistence ?? 0.35;
        this.config.lacunarity = config.lacunarity ?? 2;
        this.config.baseHeight = config.baseHeight ?? Math.floor(config.maxHeight * 0.28);
        this.config.variationRange = config.variationRange ?? Math.max(1, Math.floor(config.maxHeight * 0.25));
        this.config.relief = config.relief ?? 0.65;
        this.perlin = new Perlin2D(config.seed);
    }

    /**
     * Gets the final Y altitude for a specific (X, Z) coordinate.
     * Ready to be used for a hollow shell generation.
     */
    public getHeightAt(x: number, z: number): number {
        let total = 0;
        let frequency = 1;
        let amplitude = 1;
        let maxValue = 0;

        // Fractional Brownian Motion with a very low contrast, suitable for plains.
        for (let i = 0; i < this.config.octaves!; i++) {
            total += this.perlin.getNoise(x * this.config.scale * frequency, z * this.config.scale * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= this.config.persistence!;
            frequency *= this.config.lacunarity!;
        }

        // Normalize from [-1.0, 1.0] back to [0.0, 1.0]
        const normalizedNoise = (total / maxValue + 1) / 2;
        const smoothNoise = normalizedNoise * normalizedNoise * (3 - 2 * normalizedNoise);
        const softenedNoise = 0.5 + (smoothNoise - 0.5) * this.config.relief!;

        // Keep the terrain mostly flat and avoid a radial "dome" shape.
        const plainsHeight = this.config.baseHeight! + ((softenedNoise - 0.5) * this.config.variationRange!);
        const finalHeightRaw = Math.max(0, plainsHeight);

        // Convert to integer block height
        return Math.min(this.config.maxHeight, Math.floor(finalHeightRaw));
    }
}