export interface FillerVoxel {
    x: number
    y: number
    z: number
    color: string
}

export interface GetVoxelInfo {
    (x: number, z: number): { height: number; color: string }
}

export interface CornerParams {
    getVoxelInfo: GetVoxelInfo
    newScale: number
    inset: number
}

export interface GetVoxelInfo {
    (x: number, z: number): { height: number; color: string }
}

export interface EdgeParams {
    getVoxelInfo: GetVoxelInfo
    newScale: number
    half: number
    inset: number
}
