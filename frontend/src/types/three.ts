import type React from 'react'
import type { Group } from 'three'

import type { LocalMap } from './maps/localMap.ts'
import {WorldBlock} from "@/types/api/world.ts";

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
