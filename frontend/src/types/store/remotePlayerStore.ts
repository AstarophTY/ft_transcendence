import * as THREE from 'three'

export type PlayerMode = 'player' | 'freecam'

export interface RemotePlayerMetadata {
    id: string
    username: string
    avatar: string
    skin: string
}

export interface RemoteTransform {
    username: string
    avatar: string
    pos: THREE.Vector3
    yaw: number
    camPos: THREE.Vector3
    camYaw: number
    camPitch: number
    mode: PlayerMode
    skin: string
}