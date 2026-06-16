import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef, useState, ElementType } from 'react'
import * as THREE from 'three'
import UserBadge from '@/ui/hud/UserBadge'
import { useAvatar, tintAvatar } from '@/ui/three/objects/player/useAvatar'
import { Billboard, Html } from '@react-three/drei'
import { usePlanetStore } from '@/store/planetStore'
import { MAP_SIZE_BLOCKS, PRIVATE_MAP_SIZE } from '@/config/worldScene.ts'
import { Chunk } from '@/types/maps/chunk.ts'
import { useRemotePlayersStore, remoteTransforms } from '@/store/remotePlayersStore'
import { useAuth } from '@/store/auth'
import {RemoteTransform} from "@/types/store/remotePlayerStore.ts";



const MODEL_OFFSET = Math.PI
const Primitive = 'primitive' as unknown as ElementType

/** Shortest-path angular interpolation so the avatar never spins the long way. */
const lerpAngle = (a: number, b: number, t: number): number => {
  const diff = THREE.MathUtils.euclideanModulo(b - a + Math.PI, Math.PI * 2) - Math.PI
  return a + diff * t
}

/** A small, translucent camera prop shown where a remote player is in freecam. */
const createCameraModel = (): THREE.Group => {
  const bodyMat = new THREE.MeshStandardMaterial({
    color: '#2b2b30',
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  })
  const lensMat = new THREE.MeshStandardMaterial({
    color: '#4aa3ff',
    metalness: 0.3,
    roughness: 0.4,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  })

  const group = new THREE.Group()
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 1.4), bodyMat)
  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.32, 0.5, 16),
    lensMat,
  )
  lens.rotation.x = Math.PI / 2
  lens.position.set(0, 0, 0.9)
  const viewfinder = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), bodyMat)
  viewfinder.position.set(0, 0.55, -0.1)
  group.add(body, lens, viewfinder)
  group.scale.setScalar(0.45) // smaller than the player avatar
  return group
}

/**
 * One remote player. The body avatar is always shown at the player's position;
 * in freecam an extra translucent camera marker is shown where they are flying.
 */
const RemotePlayer = ({ id, target }: { id: string; target: RemoteTransform }) => {
  const { camera } = useThree()
  const renderDistance = usePlanetStore((state) => state.renderDistance)
  const { body, eyes } = useAvatar()
  const cameraModel = useMemo(() => createCameraModel(), [])

  const bodyRef = useRef<THREE.Group>(null)
  const camRef = useRef<THREE.Group>(null)
  const spawned = useRef(false)
  const appliedSkin = useRef<string>('')
  const [visible, setVisible] = useState(true)

  useFrame(() => {
    const bodyGroup = bodyRef.current
    const camGroup = camRef.current
    if (!bodyGroup || !camGroup) return

    // Calculate if player is within render distance chunks of the camera
    const isPrivate = usePlanetStore.getState().isPrivateWorld
    const mapSize = isPrivate ? PRIVATE_MAP_SIZE : MAP_SIZE_BLOCKS

    const cameraChunkX = Math.floor((camera.position.x + mapSize / 2) / Chunk.WIDTH)
    const cameraChunkZ = Math.floor((camera.position.z + mapSize / 2) / Chunk.WIDTH)

    const playerChunkX = Math.floor((target.pos.x + mapSize / 2) / Chunk.WIDTH)
    const playerChunkZ = Math.floor((target.pos.z + mapSize / 2) / Chunk.WIDTH)

    const dx = playerChunkX - cameraChunkX
    const dz = playerChunkZ - cameraChunkZ
    const distSq = dx * dx + dz * dz
    const isWithinRenderDistance = distSq <= renderDistance * renderDistance

    if (visible !== isWithinRenderDistance) {
      setVisible(isWithinRenderDistance)
    }

    if (!spawned.current) {
      bodyGroup.position.copy(target.pos)
      bodyGroup.rotation.y = target.yaw + MODEL_OFFSET
      camGroup.rotation.order = 'YXZ'
      camGroup.position.copy(target.camPos)
      camGroup.rotation.y = target.camYaw
      camGroup.rotation.x = -target.camPitch
      spawned.current = true
    } else {
      bodyGroup.position.lerp(target.pos, 0.25)
      bodyGroup.rotation.y = lerpAngle(
        bodyGroup.rotation.y,
        target.yaw + MODEL_OFFSET,
        0.25
      )
      camGroup.position.lerp(target.camPos, 0.25)
      camGroup.rotation.y = lerpAngle(camGroup.rotation.y, target.camYaw, 0.25)
      camGroup.rotation.x = lerpAngle(camGroup.rotation.x, -target.camPitch, 0.25)
    }

    // Re-tint only when the peer's skin actually changed.
    if (target.skin !== appliedSkin.current) {
      tintAvatar(body, target.skin)
      appliedSkin.current = target.skin
    }

    bodyGroup.visible = isWithinRenderDistance
    camGroup.visible = target.mode === 'freecam' && isWithinRenderDistance
  })

  return (
    <>
      <group ref={bodyRef}>
        <Primitive object={body} scale={0.5} />
        <Primitive object={eyes} scale={0.5} />
        {visible && (
          <Billboard position={[0, 1.5, 0]}>
            <Html center transform sprite distanceFactor={6} zIndexRange={[100, 0]}>
              <UserBadge user={{
                    username: target.username,
                    userId: id,
                    avatar: target.avatar,
                    email: null,
                    role: 'USER',
                    campusId: null
                  }}/>
            </Html>
          </Billboard>
        )}
      </group>
      <group ref={camRef}>
        <Primitive object={cameraModel} />
      </group>
    </>
  )
}

/**
 * Renders an avatar for every other player on the same island, driven by the
 * `/world` socket. Membership lives in React state (mount/unmount), while the
 * frequent transform updates are kept in a ref so they never trigger a re-render.
 */
const RemotePlayers = () => {
  const ids = useRemotePlayersStore((s) => s.playerIds)
  const localUserId = useAuth((s) => s.user?.userId)

  return (
    <>
      {ids.map((id) => {
        if (id === localUserId) return null
        const target = remoteTransforms.get(id)
        return target ? <RemotePlayer key={id} id={id} target={target} /> : null
      })}
    </>
  )
}

export default RemotePlayers
