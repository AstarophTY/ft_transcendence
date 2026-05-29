import {Perlin2D} from "../noise/Perlin2D";
import type {MapConfig} from "./MapConfig";


export class IslandMap {
    private perlin: Perlin2D;
    private config: MapConfig;

    constructor(config: MapConfig) {
        this.config = config;
        // Default to 4 octaves if not provided, for standard terrain bumpiness
        this.config.octaves = config.octaves || 4;
        this.perlin = new Perlin2D(config.seed);
    }

    /**
     * Calculates a multiplier to force the edges of the map to 0 altitude.
     * Creates a square island shape.
     */
    private getFalloff(x: number, z: number): number {
        // Normalize coordinates to range [-1.0, 1.0]
        const nx = (x / this.config.mapSize) * 2 - 1;
        const nz = (z / this.config.mapSize) * 2 - 1;

        // Calculate distance from center
        const distance = Math.max(Math.abs(nx), Math.abs(nz));

        if (distance >= 1) return 0;

        // Smooth curve towards the ocean
        return 1 - (distance * distance);
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

        // Fractional Brownian Motion (Stacking noise layers)
        for (let i = 0; i < this.config.octaves!; i++) {
            total += this.perlin.getNoise(x * this.config.scale * frequency, z * this.config.scale * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;  // Persistence (each layer is half as strong)
            frequency *= 2.0;  // Lacunarity (each layer has double the detail)
        }

        // Normalize from [-1.0, 1.0] back to [0.0, 1.0]
        const normalizedNoise = (total / maxValue + 1) / 2;

        // Apply the island mask
        const falloff = this.getFalloff(x, z);
        const finalHeightRaw = normalizedNoise * falloff;

        // Convert to integer block height
        return Math.floor(finalHeightRaw * this.config.maxHeight);
    }
}