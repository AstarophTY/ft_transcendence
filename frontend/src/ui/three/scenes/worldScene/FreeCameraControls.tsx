import { PointerLockControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'

import { getCurvatureOffset } from '../../utils/curvature'
import { useEditorStore } from '@/store/editorStore'
import { Tab } from '@/types/Editor'

interface FreeCameraControlsProps {
  heightMap: Uint16Array
  mapSize: number
  active: boolean
  playerRef: React.RefObject<THREE.Group>
  onUpdateHeightMap: (x: number, z: number, newHeight: number) => void
}

export const FreeCameraControls = ({
  heightMap,
  mapSize,
  active,
  playerRef,
  onUpdateHeightMap,
}: FreeCameraControlsProps) => {
  const { camera, gl, scene } = useThree()
  const controlsRef = useRef<PointerLockControlsImpl | null>(null)
  const keysRef = useRef<Record<string, boolean>>({})
  const previewRef = useRef<THREE.Mesh>(null)

  const updatePreview = () => {
    if (!previewRef.current) return

    const { tool } = useEditorStore.getState()
    if ((tool !== Tab.Add && tool !== Tab.Remove) || !controlsRef.current?.isLocked) {
      previewRef.current.visible = false
      return
    }

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)

    // Force update matrix world of the entire scene to be absolutely sure all world matrices are correct before raycasting
    scene.updateMatrixWorld(true)

    const intersects = raycaster.intersectObjects(scene.children, true)
    const hit = intersects.find(
      (item) =>
        (item.object as THREE.InstancedMesh).isInstancedMesh &&
        item.object !== previewRef.current
    )

    if (hit && hit.distance <= 30) {
      const point = hit.point
      const normal = hit.face?.normal
      if (normal) {
        const halfSize = mapSize / 2
        
        let targetX = 0
        let targetY = 0
        let targetZ = 0

        if (tool === Tab.Add) {
          const placePos = point.clone().addScaledVector(normal, 0.5)
          const x = Math.floor(placePos.x + halfSize)
          const z = Math.floor(placePos.z + halfSize)

          if (x >= 0 && x < mapSize && z >= 0 && z < mapSize) {
            const mapIndex = z * mapSize + x
            const currentHeight = heightMap[mapIndex] ?? 0
            if (currentHeight < 63) {
              targetX = x - halfSize + 0.5
              targetY = Math.floor(placePos.y) + 0.5
              targetZ = z - halfSize + 0.5
            } else {
              previewRef.current.visible = false
              return
            }
          } else {
            previewRef.current.visible = false
            return
          }
        } else { // Tab.Remove
          const blockPos = point.clone().addScaledVector(normal, -0.5)
          const x = Math.floor(blockPos.x + halfSize)
          const z = Math.floor(blockPos.z + halfSize)

          if (x >= 0 && x < mapSize && z >= 0 && z < mapSize) {
            const mapIndex = z * mapSize + x
            const currentHeight = heightMap[mapIndex] ?? 0
            if (currentHeight > 0) {
              targetX = x - halfSize + 0.5
              targetY = currentHeight + 0.5 // Centering in the existing block at height + 0.5
              targetZ = z - halfSize + 0.5
            } else {
              previewRef.current.visible = false
              return
            }
          } else {
            previewRef.current.visible = false
            return
          }
        }

        previewRef.current.position.set(targetX, targetY, targetZ)
        
        if (previewRef.current.material) {
          const color = tool === Tab.Add ? '#fbbf24' : '#ef4444'
          ;(previewRef.current.material as THREE.MeshBasicMaterial).color.set(color)
        }
        
        previewRef.current.visible = true
        return
      }
    }

    previewRef.current.visible = false
  }

  useEffect(() => {
    if (active) {
      if (playerRef.current) {
        camera.position.copy(playerRef.current.position)
        camera.position.y += 2
      } else {
        camera.position.set(0, 18, 24)
      }
      camera.lookAt(0, 0, 0)
    }
  }, [camera, active, playerRef])

  const handleEditorAction = (e: MouseEvent) => {
    if (e.button !== 0) return // Left click only

    const { tool } = useEditorStore.getState()
    if (tool !== Tab.Add && tool !== Tab.Remove) return

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)

    // Force update matrix world of the entire scene to be absolutely sure all world matrices are correct before raycasting
    scene.updateMatrixWorld(true)

    const intersects = raycaster.intersectObjects(scene.children, true)
    console.log("Raycast clicked. Active tool:", tool, "Intersections count:", intersects.length)
    if (intersects.length > 0) {
      const instancedHits = intersects.filter(item => (item.object as THREE.InstancedMesh).isInstancedMesh)
      console.log("InstancedMesh hits:", instancedHits.length, "Closest hit distance:", intersects[0].distance)
    }

    if (intersects.length === 0) return

    // Find the first intersected InstancedMesh (our terrain blocks)
    const hit = intersects.find((item) => (item.object as THREE.InstancedMesh).isInstancedMesh)
    if (!hit) return

    if (hit.distance > 30) return

    const point = hit.point
    const normal = hit.face?.normal
    if (!normal) return

    const halfSize = mapSize / 2

    if (tool === Tab.Remove) {
      // Break block: move slightly into the hit block
      const blockPos = point.clone().addScaledVector(normal, -0.5)
      const x = Math.floor(blockPos.x + halfSize)
      const z = Math.floor(blockPos.z + halfSize)

      if (x >= 0 && x < mapSize && z >= 0 && z < mapSize) {
        const mapIndex = z * mapSize + x
        const currentHeight = heightMap[mapIndex] ?? 0
        if (currentHeight > 0) {
          onUpdateHeightMap(x, z, currentHeight - 1)
        }
      }
    } else if (tool === Tab.Add) {
      // Place block: move slightly away from the hit block
      const placePos = point.clone().addScaledVector(normal, 0.5)
      const x = Math.floor(placePos.x + halfSize)
      const z = Math.floor(placePos.z + halfSize)

      if (x >= 0 && x < mapSize && z >= 0 && z < mapSize) {
        const mapIndex = z * mapSize + x
        const currentHeight = heightMap[mapIndex] ?? 0
        if (currentHeight < 63) { // Max height is Chunk.HEIGHT - 1 (63)
          onUpdateHeightMap(x, z, currentHeight + 1)
        }
      }
    }
  }

  useEffect(() => {
    if (!active) return
    const handleKeyDown = (event: KeyboardEvent) => {
      keysRef.current[event.code] = true
      if (active && event.code === 'ControlLeft') {
        controlsRef.current?.unlock()
      }
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      keysRef.current[event.code] = false
    }
    const handleMouseDown = (e: MouseEvent) => {
      if (!active) return
      if (!controlsRef.current?.isLocked) {
        if (e.target === gl.domElement) {
          controlsRef.current?.lock()
        }
      } else {
        handleEditorAction(e)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousedown', handleMouseDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousedown', handleMouseDown)
    }
  }, [gl.domElement, active, heightMap, onUpdateHeightMap])

  useFrame((_, delta) => {
    if (!active) return
    const moveSpeed = 12
    const verticalSpeed = 8
    const wallPadding = 0.4
    const halfSize = mapSize / 2
    const moveForward = keysRef.current.KeyW ? 1 : 0
    const moveBackward = keysRef.current.KeyS ? 1 : 0
    const moveLeft = keysRef.current.KeyA ? 1 : 0
    const moveRight = keysRef.current.KeyD ? 1 : 0
    const moveUp = keysRef.current.Space ? 1 : 0
    const moveDown = keysRef.current.ShiftLeft ? 1 : 0

    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()

    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize()

    const forwardAmount = (moveForward - moveBackward) * moveSpeed * delta
    const rightAmount = (moveRight - moveLeft) * moveSpeed * delta
    const upAmount = (moveUp - moveDown) * verticalSpeed * delta

    const nextPosition = camera.position.clone()
    nextPosition.addScaledVector(forward, forwardAmount)
    nextPosition.addScaledVector(right, rightAmount)
    nextPosition.y += upAmount

    // Boundary constraints
    nextPosition.x = THREE.MathUtils.clamp(nextPosition.x, -halfSize + wallPadding, halfSize - wallPadding)
    nextPosition.z = THREE.MathUtils.clamp(nextPosition.z, -halfSize + wallPadding, halfSize - wallPadding)

    // Function to check if a position is valid (not inside a block)
    const isValidPosition = (pos: THREE.Vector3) => {
      const mapX = Math.floor(pos.x + halfSize)
      const mapZ = Math.floor(pos.z + halfSize)
      const mapIndex = THREE.MathUtils.clamp(mapZ, 0, mapSize - 1) * mapSize + THREE.MathUtils.clamp(mapX, 0, mapSize - 1)
      const rawGroundHeight = heightMap[mapIndex] ?? 0
      const curvatureOffset = getCurvatureOffset(pos, camera.position)
      const groundHeight = rawGroundHeight - curvatureOffset
      // The block occupies space from groundHeight to groundHeight + 1
      // We are inside a block if our y is between groundHeight and groundHeight + 1
      const isInsideBlockVolume = pos.y >= groundHeight && pos.y <= groundHeight + 1
      return !isInsideBlockVolume
    }

    // Collision handling: check each axis separately for sliding
    const finalPosition = camera.position.clone()

    const getPhysicGroundHeight = (pos: THREE.Vector3) => {
      const mapX = Math.floor(pos.x + halfSize)
      const mapZ = Math.floor(pos.z + halfSize)
      const mapIndex = THREE.MathUtils.clamp(mapZ, 0, mapSize - 1) * mapSize + THREE.MathUtils.clamp(mapX, 0, mapSize - 1)
      const rawGroundHeight = heightMap[mapIndex] ?? 0
      const curvatureOffset = getCurvatureOffset(pos, camera.position)
      return rawGroundHeight - curvatureOffset
    }

    // Try vertical movement first
    const verticalPos = finalPosition.clone()
    verticalPos.y = nextPosition.y
    if (isValidPosition(verticalPos)) {
      finalPosition.y = nextPosition.y
    } else {
      // If moving into a block volume from above, snap to top
      const groundHeight = getPhysicGroundHeight(finalPosition)

      if (finalPosition.y > groundHeight + 1) {
        finalPosition.y = groundHeight + 1.1 // Stay slightly above
      } else if (finalPosition.y < groundHeight) {
        finalPosition.y = groundHeight - 0.1 // Stay slightly below if we were already under
      }
    }

    // Try horizontal X movement
    const xPos = finalPosition.clone()
    xPos.x = nextPosition.x
    if (isValidPosition(xPos)) {
      finalPosition.x = nextPosition.x
    }

    // Try horizontal Z movement
    const zPos = finalPosition.clone()
    zPos.z = nextPosition.z
    if (isValidPosition(zPos)) {
      finalPosition.z = nextPosition.z
    }

    camera.position.copy(finalPosition)
    updatePreview()
  })

  return active ? (
    <>
      <PointerLockControls ref={(node) => { controlsRef.current = node }} selector="#canvas-container" />
      <mesh ref={previewRef} visible={false}>
        <boxGeometry args={[1.01, 1.01, 1.01]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </>
  ) : null
}
