import type React from 'react'
import type { Group } from 'three'

import type { LocalMap } from './maps/LocalMap'
import type { WorldBlock } from '@/lib/api/world'

export interface PlayerProps {
  localMap: LocalMap
  active: boolean
  playerRef: React.RefObject<Group>
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
  blocks?: WorldBlock[]
}
