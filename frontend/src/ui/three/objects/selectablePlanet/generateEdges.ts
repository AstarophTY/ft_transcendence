import {EdgeParams, FillerVoxel} from "@/types/three/selectablePlanet.ts";

export const generateTopRightEdge = (
  { getVoxelInfo, newScale, half, inset }: EdgeParams,
  list: FillerVoxel[]
) => {
  for (let vz = 0; vz <= 31; vz++) {
    const topInfo = getVoxelInfo(31, vz)
    const rightInfo = getVoxelInfo(32, vz)

    const R_top = Math.round(topInfo.height / newScale)
    const R_right = Math.round(rightInfo.height / newScale)
    const R = Math.min(R_top, R_right)

    if (R > 0) {
      for (let i = 1; i <= R; i++) {
        for (let j = 1; j <= R; j++) {
          if (i * i + j * j <= R * R) {
            list.push({
              x: (0.5 - inset) + (i - 0.5) * newScale,
              y: (0.5 - inset) + (j - 0.5) * newScale,
              z: vz * newScale - half + newScale / 2,
              color: i >= j ? rightInfo.color : topInfo.color,
            })
          }
        }
      }
    }
  }
}

export const generateTopFrontEdge = (
  { getVoxelInfo, newScale, half, inset }: EdgeParams,
  list: FillerVoxel[]
) => {
  for (let vx = 0; vx <= 31; vx++) {
    const topInfo = getVoxelInfo(vx, 31)
    const frontInfo = getVoxelInfo(vx, 32)

    const R_top = Math.round(topInfo.height / newScale)
    const R_front = Math.round(frontInfo.height / newScale)
    const R = Math.min(R_top, R_front)

    if (R > 0) {
      for (let i = 1; i <= R; i++) {
        for (let j = 1; j <= R; j++) {
          if (i * i + j * j <= R * R) {
            list.push({
              x: vx * newScale - half + newScale / 2,
              y: (0.5 - inset) + (j - 0.5) * newScale,
              z: (0.5 - inset) + (i - 0.5) * newScale,
              color: i >= j ? frontInfo.color : topInfo.color,
            })
          }
        }
      }
    }
  }
}

export const generateRightFrontEdge = (
  { getVoxelInfo, newScale, half, inset }: EdgeParams,
  list: FillerVoxel[]
) => {
  for (let k = 0; k <= 31; k++) {
    const rightInfo = getVoxelInfo(63 - k, 31)
    const frontInfo = getVoxelInfo(31, 63 - k)

    const R_right = Math.round(rightInfo.height / newScale)
    const R_front = Math.round(frontInfo.height / newScale)
    const R = Math.min(R_right, R_front)

    if (R > 0) {
      for (let i = 1; i <= R; i++) {
        for (let j = 1; j <= R; j++) {
          if (i * i + j * j <= R * R) {
            list.push({
              x: (0.5 - inset) + (i - 0.5) * newScale,
              y: k * newScale - half + newScale / 2,
              z: (0.5 - inset) + (j - 0.5) * newScale,
              color: i >= j ? rightInfo.color : frontInfo.color,
            })
          }
        }
      }
    }
  }
}
