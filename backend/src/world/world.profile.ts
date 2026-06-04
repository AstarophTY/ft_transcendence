/** Terrain generation profile stored per campus world. */
export interface WorldProfile {
  seed: string;
  widthInChunks: number;
  depthInChunks: number;
  scale: number;
  octaves: number;
  persistence: number;
  relief: number;
  baseHeight: number;
  variationRange: number;
}

const rnd = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Build a fresh, randomised terrain profile for a campus. The seed is derived
 * from the campus id so it stays stable, while the shape parameters are drawn
 * from the same ranges as the old hardcoded demo planets.
 */
export function generateWorldProfile(campusId: string): WorldProfile {
  return {
    seed: `world-${campusId}`,
    widthInChunks: Math.floor(rnd(4, 7)),
    depthInChunks: Math.floor(rnd(4, 7)),
    scale: rnd(0.029, 0.06),
    octaves: Math.floor(rnd(3, 7)),
    persistence: rnd(0.35, 0.52),
    relief: rnd(0.52, 0.78),
    baseHeight: Math.round(rnd(13, 20)),
    variationRange: Math.round(rnd(10, 18)),
  };
}
