import type { Group } from 'three'

import type { Block } from '@/types/Block'

export interface PlayerProps {
  heightMap: Uint16Array
  mapSize: number
  active: boolean
  playerRef: React.RefObject<Group>
  placedBlocks?: Record<string, Block>
}

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
