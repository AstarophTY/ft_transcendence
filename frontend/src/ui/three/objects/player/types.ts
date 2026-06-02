import type { Group } from 'three'
import React from "react";

export interface PlayerProps {
  heightMap: Uint16Array
  mapSize: number
  active: boolean
  playerRef: React.RefObject<Group>
}
