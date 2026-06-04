export interface MapConfig {
    seed: string;
    mapSize: number;
    maxHeight: number;
    scale: number;
    octaves?: number;
    persistence?: number;
    lacunarity?: number;
    baseHeight?: number;
    variationRange?: number;
    relief?: number;
    applyConstraints?: boolean;
}