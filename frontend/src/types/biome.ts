export enum BiomeType {
    Desert = 'desert',
    Plains = 'plains',
    Forest = 'forest',
    Mountain = 'mountain'
}

export interface BiomeParameters {
    baseHeight: number
    variationRange: number
    scale: number
    octaves: number
    persistence: number
    relief: number
}