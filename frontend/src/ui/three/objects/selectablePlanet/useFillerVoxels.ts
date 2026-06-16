import { useMemo } from 'react'
import type { PreviewVoxel } from '@/types/maps/previewVoxel.ts'
import { generateTopRightEdge, generateTopFrontEdge, generateRightFrontEdge } from '@/ui/three/objects/selectablePlanet/generateEdges'
import { generateCornerOctant } from '@/ui/three/objects/selectablePlanet/generateCorner'
import {FillerVoxel} from "@/types/three/selectablePlanet.ts";

interface useFillerVoxelsParams {
  previewVoxels: PreviewVoxel[]
  newScale: number
  half: number
  inset: number
  getHeight: (voxelHeight: number) => number
}

export const useFillerVoxels = ({
  previewVoxels,
  newScale,
  half,
  inset,
  getHeight,
}: useFillerVoxelsParams): FillerVoxel[] => {
  const voxelGrid = useMemo(() => {
    const grid: Record<string, PreviewVoxel> = {}
    for (const v of previewVoxels) {
      grid[`${v.x},${v.z}`] = v
    }
    return grid
  }, [previewVoxels])

  const getVoxelInfo = useMemo(() => {
    return (x: number, z: number) => {
      const v = voxelGrid[`${x},${z}`]
      if (!v) return { height: 0, color: '#000000' }
      return {
        height: getHeight(v.y),
        color: v.color,
      }
    }
  }, [voxelGrid, getHeight])

  return useMemo(() => {
    const list: FillerVoxel[] = []
    const params = { getVoxelInfo, newScale, half, inset }

    generateTopRightEdge(params, list)
    generateTopFrontEdge(params, list)
    generateRightFrontEdge(params, list)
    generateCornerOctant(params, list)

    return list
  }, [getVoxelInfo, newScale, half, inset])
}
