import { create } from 'zustand'
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

/** 
 * Non-reactive map for high-frequency transform updates.
 * RemotePlayers.tsx reads from this during the useFrame loop.
 */
export const remoteTransforms = new Map<string, RemoteTransform>()

interface RemotePlayersState {
  playerIds: string[]
  metadata: Map<string, RemotePlayerMetadata>
  
  /** Authoritative sync of all players on join. */
  setPlayers: (players: { id: string; u?: string; a?: string; skin?: string; p: [number, number, number]; r: number; m: PlayerMode; c?: [number, number, number]; cr?: number; cp?: number }[]) => void
  
  /** Incremental update for a single player. */
  upsertPlayer: (p: { id: string; u?: string; a?: string; skin?: string; p: [number, number, number]; r: number; m: PlayerMode; c?: [number, number, number]; cr?: number; cp?: number }) => void
  
  removePlayer: (id: string) => void
  updateAvatar: (id: string, avatar: string | null) => void
  clear: () => void
}

const updateTransform = (id: string, p: any) => {
  const mode: PlayerMode = p.m === 'freecam' ? 'freecam' : 'player'
  const camPos = p.c ?? p.p
  const camYaw = p.cr ?? p.r
  const camPitch = p.cp ?? 0
  const skin = p.skin ?? '#ffffff'

  const existing = remoteTransforms.get(id)
  if (existing) {
    if (p.u) existing.username = p.u
    if (p.a !== undefined) existing.avatar = p.a || ''
    existing.pos.set(p.p[0], p.p[1], p.p[2])
    existing.yaw = p.r
    existing.mode = mode
    existing.camPos.set(camPos[0], camPos[1], camPos[2])
    existing.camYaw = camYaw
    existing.camPitch = camPitch
    existing.skin = skin
  } else {
    remoteTransforms.set(id, {
      username: p.u || 'Unknown',
      avatar: p.a || '',
      pos: new THREE.Vector3(p.p[0], p.p[1], p.p[2]),
      yaw: p.r,
      camPos: new THREE.Vector3(camPos[0], camPos[1], camPos[2]),
      camYaw,
      camPitch,
      mode,
      skin,
    })
  }
}

export const useRemotePlayersStore = create<RemotePlayersState>((set, get) => ({
  playerIds: [],
  metadata: new Map(),

  setPlayers: (players) => {
    const newMetadata = new Map<string, RemotePlayerMetadata>()
    const newIds: string[] = []
    
    // Clear stale transforms
    const present = new Set(players.map(p => p.id))
    for (const id of remoteTransforms.keys()) {
      if (!present.has(id)) remoteTransforms.delete(id)
    }

    players.forEach((p) => {
      newIds.push(p.id)
      newMetadata.set(p.id, {
        id: p.id,
        username: p.u || 'Unknown',
        avatar: p.a || '',
        skin: p.skin || '#ffffff'
      })
      updateTransform(p.id, p)
    })

    set({ playerIds: newIds, metadata: newMetadata })
  },

  upsertPlayer: (p) => {
    const { metadata, playerIds } = get()
    const existing = metadata.get(p.id)
    
    updateTransform(p.id, p)

    const updatedMetadata = new Map(metadata)
    updatedMetadata.set(p.id, {
      id: p.id,
      username: p.u || existing?.username || 'Unknown',
      avatar: p.a !== undefined ? (p.a || '') : (existing?.avatar || ''),
      skin: p.skin || existing?.skin || '#ffffff'
    })

    if (playerIds.includes(p.id)) {
      set({ metadata: updatedMetadata })
    } else {
      set({ playerIds: [...playerIds, p.id], metadata: updatedMetadata })
    }
  },

  removePlayer: (id) => {
    const { metadata, playerIds } = get()
    remoteTransforms.delete(id)
    const updatedMetadata = new Map(metadata)
    updatedMetadata.delete(id)
    set({
      playerIds: playerIds.filter((pid) => pid !== id),
      metadata: updatedMetadata
    })
  },

  updateAvatar: (id, avatar) => {
    const { metadata } = get()
    const existing = metadata.get(id)
    if (!existing) return

    const updatedMetadata = new Map(metadata)
    updatedMetadata.set(id, { ...existing, avatar: avatar || '' })
    
    const transform = remoteTransforms.get(id)
    if (transform) transform.avatar = avatar || ''
    
    set({ metadata: updatedMetadata })
  },

  clear: () => {
    remoteTransforms.clear()
    set({ playerIds: [], metadata: new Map() })
  }
}))
