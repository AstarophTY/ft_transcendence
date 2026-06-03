import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'

import { connectWorldSocket } from '@/lib/worldSocket'
import { tokenStore } from '@/lib/api'
import { useCurvedSceneMaterials } from './player/useCurvedSceneMaterials'

const MODEL_PATH = '/three/assets/capsule/full_bodie/Body_AA_01.glb'

type PlayerMode = 'player' | 'freecam'

/** Last received transform of a remote player; mutated in place for lerping. */
interface RemoteTransform {
  pos: THREE.Vector3
  yaw: number
  camPos: THREE.Vector3
  camYaw: number
  mode: PlayerMode
}

type MovePayload = {
  id: string
  p: [number, number, number]
  r: number
  m: PlayerMode
  c?: [number, number, number]
  cr?: number
}

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
const RemotePlayer = ({ target }: { target: RemoteTransform }) => {
  const { scene } = useGLTF(MODEL_PATH)
  const body = useMemo(() => SkeletonUtils.clone(scene), [scene])
  useCurvedSceneMaterials(body)
  const cameraModel = useMemo(() => createCameraModel(), [])

  const bodyRef = useRef<THREE.Group>(null)
  const camRef = useRef<THREE.Group>(null)
  const spawned = useRef(false)

  useFrame(() => {
    const bodyGroup = bodyRef.current
    const camGroup = camRef.current
    if (!bodyGroup || !camGroup) return

    if (!spawned.current) {
      // Snap to the first known transforms so nothing slides in from origin.
      bodyGroup.position.copy(target.pos)
      bodyGroup.rotation.y = target.yaw
      camGroup.position.copy(target.camPos)
      camGroup.rotation.y = target.camYaw
      spawned.current = true
    } else {
      bodyGroup.position.lerp(target.pos, 0.25)
      bodyGroup.rotation.y = lerpAngle(bodyGroup.rotation.y, target.yaw, 0.25)
      camGroup.position.lerp(target.camPos, 0.25)
      camGroup.rotation.y = lerpAngle(camGroup.rotation.y, target.camYaw, 0.25)
    }

    camGroup.visible = target.mode === 'freecam'
  })

  return (
    <>
      <group ref={bodyRef}>
        <primitive object={body} scale={0.5} />
      </group>
      <group ref={camRef}>
        <primitive object={cameraModel} />
      </group>
    </>
  )
}

/**
 * Renders an avatar for every other player on the same island, driven by the
 * `/world` socket. Membership lives in React state (mount/unmount), while the
 * frequent transform updates are kept in a ref so they never trigger a re-render.
 */
const RemotePlayers = ({ campusId }: { campusId: string }) => {
  const [ids, setIds] = useState<string[]>([])
  const targets = useRef<Map<string, RemoteTransform>>(new Map())

  useEffect(() => {
    const token = tokenStore.access
    if (!token) return
    const socket = connectWorldSocket(token)
    const store = targets.current

    const upsert = ({ id, p, r, m, c, cr }: MovePayload) => {
      const mode: PlayerMode = m === 'freecam' ? 'freecam' : 'player'
      const camPos = c ?? p // fall back to the body when no camera is sent
      const camYaw = cr ?? r
      const existing = store.get(id)
      if (existing) {
        existing.pos.set(p[0], p[1], p[2])
        existing.yaw = r
        existing.mode = mode
        existing.camPos.set(camPos[0], camPos[1], camPos[2])
        existing.camYaw = camYaw
      } else {
        store.set(id, {
          pos: new THREE.Vector3(p[0], p[1], p[2]),
          yaw: r,
          camPos: new THREE.Vector3(camPos[0], camPos[1], camPos[2]),
          camYaw,
          mode,
        })
        setIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
      }
    }

    const onSnapshot = (players: MovePayload[]) => players.forEach(upsert)
    const onMove = (payload: MovePayload) => upsert(payload)
    const onLeave = ({ id }: { id: string }) => {
      store.delete(id)
      setIds((prev) => prev.filter((x) => x !== id))
    }

    socket
      .on('world:players', onSnapshot)
      .on('player:move', onMove)
      .on('player:leave', onLeave)

    return () => {
      socket
        .off('world:players', onSnapshot)
        .off('player:move', onMove)
        .off('player:leave', onLeave)
      store.clear()
      setIds([])
    }
  }, [campusId])

  return (
    <>
      {ids.map((id) => {
        const target = targets.current.get(id)
        return target ? <RemotePlayer key={id} target={target} /> : null
      })}
    </>
  )
}

export default RemotePlayers
