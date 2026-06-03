import { Perlin2D } from "../noise/Perlin2D";
import type { MapConfig } from "./MapConfig";
import { BiomeType, BIOME_CONFIGS, BiomeParameters } from "./Biome";

export class IslandMap {
    private perlin: Perlin2D;
    private biomePerlin: Perlin2D;
    private config: MapConfig;

    constructor(config: MapConfig) {
        this.config = config;
        this.config.octaves = config.octaves || 3;
        this.config.persistence = config.persistence ?? 0.35;
        this.config.lacunarity = config.lacunarity ?? 2;
        this.config.baseHeight = config.baseHeight ?? Math.floor(config.maxHeight * 0.28);
        this.config.variationRange = config.variationRange ?? Math.max(1, Math.floor(config.maxHeight * 0.25));
        this.config.relief = config.relief ?? 0.65;
        
        // Primary terrain noise generator
        this.perlin = new Perlin2D(config.seed);
        // Secondary noise generator for biome distributions
        this.biomePerlin = new Perlin2D(config.seed + "-biome");
    }

    /**
     * Gets the biome type at the given coordinate.
     */
    public getBiomeAt(x: number, z: number): BiomeType {
        const biomeNoiseVal = (this.biomePerlin.getNoise(x * 0.025, z * 0.025) + 1) / 2;

        if (biomeNoiseVal < 0.30) {
            return BiomeType.Desert;
        } else if (biomeNoiseVal < 0.45) {
            return BiomeType.Plains;
        } else if (biomeNoiseVal < 0.75) {
            return BiomeType.Forest;
        } else {
            return BiomeType.Mountain;
        }
    }

    /**
     * Computes the unblended terrain height for a single biome configuration.
     */
    private getBiomeHeightRaw(x: number, z: number, params: BiomeParameters): number {
        let total = 0;
        let frequency = 1;
        let amplitude = 1;
        let maxValue = 0;

        for (let i = 0; i < params.octaves; i++) {
            total += this.perlin.getNoise(x * params.scale * frequency, z * params.scale * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= params.persistence;
            frequency *= 2;
        }

        const normalizedNoise = (total / maxValue + 1) / 2;
        const smoothNoise = normalizedNoise * normalizedNoise * (3 - 2 * normalizedNoise);
        const softenedNoise = 0.5 + (smoothNoise - 0.5) * params.relief;

        const height = params.baseHeight + ((softenedNoise - 0.5) * params.variationRange);
        return Math.max(0, height);
    }

    /**
     * Gets the blended Y altitude for a specific (X, Z) coordinate across all biomes.
     */
    public getHeightAt(x: number, z: number): number {
        const biomeNoiseVal = (this.biomePerlin.getNoise(x * 0.025, z * 0.025) + 1) / 2;

        const hDesert = this.getBiomeHeightRaw(x, z, BIOME_CONFIGS[BiomeType.Desert]);
        const hPlains = this.getBiomeHeightRaw(x, z, BIOME_CONFIGS[BiomeType.Plains]);
        const hForest = this.getBiomeHeightRaw(x, z, BIOME_CONFIGS[BiomeType.Forest]);
        const hMountain = this.getBiomeHeightRaw(x, z, BIOME_CONFIGS[BiomeType.Mountain]);

        // Biome center points for interpolation (adjusted for new distributions)
        const p0 = 0.15;  // Center of Desert range [0.00, 0.30]
        const p1 = 0.375; // Center of Plains range [0.30, 0.45]
        const p2 = 0.60;  // Center of Forest range [0.45, 0.75]
        const p3 = 0.875; // Center of Mountain range [0.75, 1.00]

        let finalHeightRaw = 0;

        if (biomeNoiseVal <= p0) {
            finalHeightRaw = hDesert;
        } else if (biomeNoiseVal >= p3) {
            finalHeightRaw = hMountain;
        } else if (biomeNoiseVal < p1) {
            const t = (biomeNoiseVal - p0) / (p1 - p0);
            finalHeightRaw = (1 - t) * hDesert + t * hPlains;
        } else if (biomeNoiseVal < p2) {
            const t = (biomeNoiseVal - p1) / (p2 - p1);
            finalHeightRaw = (1 - t) * hPlains + t * hForest;
        } else {
            const t = (biomeNoiseVal - p2) / (p3 - p2);
            finalHeightRaw = (1 - t) * hForest + t * hMountain;
        }

        return Math.min(this.config.maxHeight, Math.floor(finalHeightRaw));
    }
}