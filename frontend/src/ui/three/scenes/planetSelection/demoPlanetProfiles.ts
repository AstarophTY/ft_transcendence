export type DemoPlanetProfile = {
  seed: string
  widthInChunks: number
  depthInChunks: number
  scale: number
  octaves: number
  persistence: number
  relief: number
  baseHeight: number
  variationRange: number
}

export const DEMO_PLANET_PROFILES: DemoPlanetProfile[] = [
  { seed: 'planet-selection-demo-0', widthInChunks: 4, depthInChunks: 4, scale: 0.045, octaves: 4, persistence: 0.45, relief: 0.65, baseHeight: 17, variationRange: 16 },
  { seed: 'planet-selection-demo-1', widthInChunks: 5, depthInChunks: 4, scale: 0.038, octaves: 3, persistence: 0.38, relief: 0.58, baseHeight: 15, variationRange: 14 },
  { seed: 'planet-selection-demo-2', widthInChunks: 4, depthInChunks: 5, scale: 0.052, octaves: 5, persistence: 0.42, relief: 0.72, baseHeight: 19, variationRange: 12 },
  { seed: 'planet-selection-demo-3', widthInChunks: 6, depthInChunks: 4, scale: 0.033, octaves: 4, persistence: 0.5, relief: 0.55, baseHeight: 13, variationRange: 18 },
  { seed: 'planet-selection-demo-4', widthInChunks: 5, depthInChunks: 5, scale: 0.06, octaves: 6, persistence: 0.35, relief: 0.78, baseHeight: 18, variationRange: 10 },
  { seed: 'planet-selection-demo-5', widthInChunks: 4, depthInChunks: 6, scale: 0.041, octaves: 4, persistence: 0.48, relief: 0.62, baseHeight: 16, variationRange: 15 },
  { seed: 'planet-selection-demo-6', widthInChunks: 6, depthInChunks: 5, scale: 0.029, octaves: 5, persistence: 0.4, relief: 0.68, baseHeight: 14, variationRange: 17 },
  { seed: 'planet-selection-demo-7', widthInChunks: 5, depthInChunks: 6, scale: 0.055, octaves: 3, persistence: 0.52, relief: 0.52, baseHeight: 20, variationRange: 11 },
  { seed: 'planet-selection-demo-8', widthInChunks: 4, depthInChunks: 4, scale: 0.047, octaves: 6, persistence: 0.36, relief: 0.74, baseHeight: 18, variationRange: 13 },
  { seed: 'planet-selection-demo-9', widthInChunks: 6, depthInChunks: 6, scale: 0.036, octaves: 4, persistence: 0.43, relief: 0.6, baseHeight: 15, variationRange: 16 },
]
