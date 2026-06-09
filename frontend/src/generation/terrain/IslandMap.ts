import { Perlin2D } from "@/generation";
import type { MapConfig } from "@/generation";
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

    private getPositionWeights(x: number, z: number): { wFlat: number; wBorder: number } {
        const mapSize = this.config.mapSize;

        // If constraints are not enabled, or the map is small (e.g. planet selection preview), skip them
        if (this.config.applyConstraints === false || mapSize < 256) {
            return { wFlat: 0, wBorder: 1.0 };
        }

        const centerX = mapSize / 2;
        const centerZ = mapSize / 2;

        // Clamp coordinates to safely calculate distance masks
        const cx = Math.max(0, Math.min(mapSize - 1, x));
        const cz = Math.max(0, Math.min(mapSize - 1, z));

        // 4x4 chunks in blocks: 4 * 16 = 64 blocks square.
        // Half size is 32 blocks.
        const left = centerX - 32;
        const right = centerX + 32;
        const top = centerZ - 32;
        const bottom = centerZ + 32;

        // Distance from the flat center area bounds
        const dx = Math.max(0, left - cx, cx - right);
        const dz = Math.max(0, top - cz, cz - bottom);
        const distFromFlat = Math.sqrt(dx * dx + dz * dz);

        // 1 chunk transition width (16 blocks) for smooth flat-to-terrain blending starting immediately at the edge
        const transitionWidth = 16;
        let wFlat = 0;
        if (distFromFlat === 0) {
            wFlat = 1.0;
        } else if (distFromFlat < transitionWidth) {
            const rawFactor = 1.0 - (distFromFlat / transitionWidth);
            wFlat = rawFactor * rawFactor * (3 - 2 * rawFactor); // Smoothstep
        }

        // Distance from the closest border
        const distFromBorder = Math.min(cx, cz, mapSize - 1 - cx, mapSize - 1 - cz);
        // 4 chunks border width (64 blocks) for border flattening
        const borderWidth = 64;
        let wBorder = 1.0;
        if (distFromBorder < borderWidth) {
            const rawFactor = distFromBorder / borderWidth;
            wBorder = rawFactor * rawFactor * (3 - 2 * rawFactor); // Smoothstep
        }

        return { wFlat, wBorder };
    }

    /**
     * Gets the biome type at the given coordinate.
     */
    public getBiomeAt(x: number, z: number): BiomeType {
        const { wFlat } = this.getPositionWeights(x, z);

        // Normal biome noise
        const normalNoise = (this.biomePerlin.getNoise(x * 0.025, z * 0.025) + 1) / 2;
        // Blend noise towards Plains center (0.42) based on wFlat so center becomes Plains
        const biomeNoiseVal = (1 - wFlat) * normalNoise + wFlat * 0.42;

        if (biomeNoiseVal < 0.38) {
            return BiomeType.Desert;
        } else if (biomeNoiseVal < 0.46) {
            return BiomeType.Plains;
        } else if (biomeNoiseVal < 0.65) {
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
        const { wFlat, wBorder } = this.getPositionWeights(x, z);

        // Blended biome noise for height calculation
        const normalNoise = (this.biomePerlin.getNoise(x * 0.025, z * 0.025) + 1) / 2;
        const biomeNoiseVal = (1 - wFlat) * normalNoise + wFlat * 0.42;

        const hDesert = this.getBiomeHeightRaw(x, z, BIOME_CONFIGS[BiomeType.Desert]);
        const hPlains = this.getBiomeHeightRaw(x, z, BIOME_CONFIGS[BiomeType.Plains]);
        const hForest = this.getBiomeHeightRaw(x, z, BIOME_CONFIGS[BiomeType.Forest]);
        const hMountain = this.getBiomeHeightRaw(x, z, BIOME_CONFIGS[BiomeType.Mountain]);

        // Biome center points for interpolation (adjusted for new distributions)
        const p0 = 0.19;  // Center of Desert range [0.00, 0.38]
        const p1 = 0.42;  // Center of Plains range [0.38, 0.46]
        const p2 = 0.555; // Center of Forest range [0.46, 0.65]
        const p3 = 0.825; // Center of Mountain range [0.65, 1.00]

        let normalHeight = 0;

        if (biomeNoiseVal <= p0) {
            normalHeight = hDesert;
        } else if (biomeNoiseVal >= p3) {
            normalHeight = hMountain;
        } else if (biomeNoiseVal < p1) {
            const t = (biomeNoiseVal - p0) / (p1 - p0);
            normalHeight = (1 - t) * hDesert + t * hPlains;
        } else if (biomeNoiseVal < p2) {
            const t = (biomeNoiseVal - p1) / (p2 - p1);
            normalHeight = (1 - t) * hPlains + t * hForest;
        } else {
            const t = (biomeNoiseVal - p2) / (p3 - p2);
            normalHeight = (1 - t) * hForest + t * hMountain;
        }

        // Apply flat center constraint: blend with flat Plains base height (12)
        let blendedHeight = (1 - wFlat) * normalHeight + wFlat * 12;

        // Radical solution: fill holes around the flat center area to level 12
        if (this.config.applyConstraints !== false && this.config.mapSize >= 256) {
            blendedHeight = Math.max(12, blendedHeight);
        }

        // Apply border constraint: blend with classic ground level (10)
        const finalHeightRaw = (1 - wBorder) * 10 + wBorder * blendedHeight;

        return Math.min(this.config.maxHeight, Math.floor(finalHeightRaw));
    }
}