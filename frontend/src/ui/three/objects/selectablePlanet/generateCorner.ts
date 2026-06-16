import {CornerParams, FillerVoxel} from "@/types/three/selectablePlanet.ts";

export const generateCornerOctant = (
  { getVoxelInfo, newScale, inset }: CornerParams,
  list: FillerVoxel[]
) => {
  const topCorner = getVoxelInfo(31, 31)
  const rightCorner = getVoxelInfo(32, 31)
  const frontCorner = getVoxelInfo(31, 32)

  const R_top = Math.round(topCorner.height / newScale)
  const R_right = Math.round(rightCorner.height / newScale)
  const R_front = Math.round(frontCorner.height / newScale)
  const R = Math.min(Math.min(R_top, R_right), R_front)

  if (R > 0) {
    for (let i = 1; i <= R; i++) {
      for (let j = 1; j <= R; j++) {
        for (let k = 1; k <= R; k++) {
          if (i * i + j * j + k * k <= R * R) {
            let color = frontCorner.color
            if (i >= j && i >= k) {
              color = rightCorner.color
            } else if (j >= i && j >= k) {
              color = topCorner.color
            }
            list.push({
              x: (0.5 - inset) + (i - 0.5) * newScale,
              y: (0.5 - inset) + (j - 0.5) * newScale,
              z: (0.5 - inset) + (k - 0.5) * newScale,
              color,
            })
          }
        }
      }
    }
  }
}
