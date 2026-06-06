import { PointerLockControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'


import { useEditorStore } from '@/store/editorStore'
import { Tab, Shape } from '@/types/Editor'
import { Block } from '@/types/Block'
import { LocalMap } from '@/types/maps/LocalMap'
import { Chunk } from '@/types/maps/Chunk'
import { useIsTouchDevice } from '@/hooks/use-mobile.tsx'

interface FreeCameraControlsProps {
  localMap: LocalMap
  mapSize: number
  active: boolean
  playerRef: React.RefObject<THREE.Group>
  onUpdateBlock: (x: number, y: number, z: number, block: Block | null, rotation?: number) => void
  onLookupBlock: (x :number, y: number, z: number) => void
}

const getAffectedBlocks = (
  cx: number, cy: number, cz: number,
  shape: Shape, shapeSize: number, mapSize: number
) => {
  const blocks: {x: number, y: number, z: number}[] = []
  const radius = shapeSize - 1

  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const x = cx + dx
        const y = cy + dy
        const z = cz + dz

        if (x < 0 || x >= mapSize || y < 0 || y >= 64 || z < 0 || z >= mapSize) {
          continue
        }

        if (shape === Shape.Sphere && radius > 0) {
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
          if (dist > radius + 0.5) {
            continue
          }
        }
        blocks.push({x, y, z})
      }
    }
  }
  return blocks
}

export const FreeCameraControls = ({
  localMap,
  mapSize,
  active,
  playerRef,
  onUpdateBlock,
  onLookupBlock
}: FreeCameraControlsProps) => {
  const { camera, gl, scene } = useThree()
  const isTouch = useIsTouchDevice()
  const controlsRef = useRef<PointerLockControlsImpl | null>(null)
  const keysRef = useRef<Record<string, boolean>>({})
const BoxGeometry = 'boxGeometry' as unknown as React.ElementType
const SphereGeometry = 'sphereGeometry' as unknown as React.ElementType

  const previewGroupRef = useRef<THREE.Group>(null)
  const cubePreviewRef = useRef<THREE.Mesh>(null)
  const spherePreviewRef = useRef<THREE.Mesh>(null)
  const cubeMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  const sphereMaterialRef = useRef<THREE.MeshBasicMaterial>(null)

  useEffect(() => {
    if (previewGroupRef.current) previewGroupRef.current.visible = false
    if (spherePreviewRef.current) spherePreviewRef.current.visible = false
    if (cubeMaterialRef.current) {
      cubeMaterialRef.current.transparent = true
      cubeMaterialRef.current.depthWrite = false
      cubeMaterialRef.current.wireframe = false
    }
    if (sphereMaterialRef.current) {
      sphereMaterialRef.current.transparent = true
      sphereMaterialRef.current.depthWrite = false
      sphereMaterialRef.current.wireframe = false
    }
  }, [])

  const updatePreview = () => {
    if (!previewGroupRef.current || !cubePreviewRef.current || !spherePreviewRef.current) return

    const { tool, shape, shapeSize } = useEditorStore.getState()
    const isRotate = tool === Tab.RotateX || tool === Tab.RotateY || tool === Tab.RotateZ
    const isActionTool = tool === Tab.Add || tool === Tab.Remove || tool === Tab.Lookup || isRotate
    if (!isActionTool || (!isTouch && !controlsRef.current?.isLocked)) {
      previewGroupRef.current.visible = false
      return
    }

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)

    // Force update matrix world of the entire scene to be absolutely sure all world matrices are correct before raycasting
    scene.updateMatrixWorld(true)

    const intersects = raycaster.intersectObjects(scene.children, true)
    const hit = intersects.find(
      (item) =>
        item.object !== cubePreviewRef.current &&
        item.object !== spherePreviewRef.current &&
        (item.object as THREE.InstancedMesh).isInstancedMesh
    )

    if (hit && hit.distance <= 30) {
      const point = hit.point
      let normal = hit.face?.normal
      if (normal) {
        const instMesh = hit.object as THREE.InstancedMesh
        if (instMesh.isInstancedMesh && hit.instanceId !== undefined) {
          const instMatrix = new THREE.Matrix4()
          instMesh.getMatrixAt(hit.instanceId, instMatrix)
          normal = normal.clone().transformDirection(instMatrix)
        }
        const halfSize = mapSize / 2
        
        let targetX = 0
        let targetY = 0
        let targetZ = 0
        let showPreview = false

        let blockPos = point.clone()
        if (tool === Tab.Add) {
           blockPos.addScaledVector(normal, 0.5)
        } else {
           blockPos.addScaledVector(normal, -0.5)
        }

        const x = Math.floor(blockPos.x + halfSize)
        const y = Math.floor(blockPos.y)
        const z = Math.floor(blockPos.z + halfSize)

        if (x >= 0 && x < mapSize && y >= 0 && y < 64 && z >= 0 && z < mapSize) {
            targetX = x - halfSize + 0.5
            targetY = y + 0.5
            targetZ = z - halfSize + 0.5
            showPreview = true
        }

        if (showPreview) {
          previewGroupRef.current.position.set(targetX, targetY, targetZ)
          
          let color = '#fbbf24' // Add: gold
          if (tool === Tab.Remove) {
            color = '#ef4444' // Remove: red
          } else if (tool === Tab.RotateX) {
            color = '#ec4899' // Rotate X: pink
          } else if (tool === Tab.RotateY) {
            color = '#10b981' // Rotate Y: green
          } else if (tool === Tab.RotateZ) {
            color = '#3b82f6' // Rotate Z: blue
          } else if (tool === Tab.Lookup) {
            color = '#00d9ff'
          }
          
          const matCube = cubePreviewRef.current.material as THREE.MeshBasicMaterial
          const matSphere = spherePreviewRef.current.material as THREE.MeshBasicMaterial
          matCube.color.set(color)
          matSphere.color.set(color)
          
          let radius = shapeSize - 1
          if (tool == Tab.Lookup) {
            radius = 0
          }
          const scaleVal = (radius * 2 + 1) * (tool === Tab.Add ? 1.0 : 1.02)
          
          if (shape === Shape.Sphere && radius > 0) {
            cubePreviewRef.current.visible = false
            spherePreviewRef.current.visible = true
            const sphereScale = (radius + 0.5) * 2 * (tool === Tab.Add ? 1.0 : 1.02)
            spherePreviewRef.current.scale.set(sphereScale, sphereScale, sphereScale)
          } else {
            cubePreviewRef.current.visible = true
            spherePreviewRef.current.visible = false
            cubePreviewRef.current.scale.set(scaleVal, scaleVal, scaleVal)
          }

          previewGroupRef.current.visible = true
          return
        }
      }
    }

    previewGroupRef.current.visible = false
  }

  useEffect(() => {
    if (active) {
      camera.rotation.order = 'YXZ'
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
    if (e.button !== 0 && e.button !== 1) return // Left click or middle click only

    const { tool, selectedBlock, shape, shapeSize, setSelectedBlock } = useEditorStore.getState()
    if (e.button === 0 && !(Object.values(Tab).includes(tool as Tab))) return

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)

    // Force update matrix world of the entire scene to be absolutely sure all world matrices are correct before raycasting
    scene.updateMatrixWorld(true)

    const intersects = raycaster.intersectObjects(scene.children, true)
    if (intersects.length === 0) return

    const hit = intersects.find((item) => {
      const obj = item.object
      if (obj === cubePreviewRef.current || obj === spherePreviewRef.current || obj === previewGroupRef.current) return false
      return (obj as THREE.InstancedMesh).isInstancedMesh
    })

    if (!hit) return
    if (hit.distance > 30) return

    const point = hit.point
    let normal = hit.face?.normal
    if (!normal) return

    const instMesh = hit.object as THREE.InstancedMesh
    if (instMesh.isInstancedMesh && hit.instanceId !== undefined) {
      const instMatrix = new THREE.Matrix4()
      instMesh.getMatrixAt(hit.instanceId, instMatrix)
      normal = normal.clone().transformDirection(instMatrix)
    }

    const halfSize = mapSize / 2
    let blockPos = point.clone()
    
    if (e.button === 0 && tool === Tab.Add) {
       blockPos.addScaledVector(normal, 0.5)
    } else {
       blockPos.addScaledVector(normal, -0.5)
    }

    const centerX = Math.floor(blockPos.x + halfSize)
    const centerY = Math.floor(blockPos.y)
    const centerZ = Math.floor(blockPos.z + halfSize)

    if (e.button === 1) {
      const block = localMap.getGlobalBlock(centerX, centerY, centerZ)
      if (block !== Block.Air && block !== Block.Bedrock && block !== Block.Water) {
        setSelectedBlock(block)
      }
      return
    }

    const blocksToUpdate = getAffectedBlocks(centerX, centerY, centerZ, shape, shapeSize, mapSize)

    for (const pos of blocksToUpdate) {
      const { x, y, z } = pos
      if (tool === Tab.Remove) {
        const block = localMap.getGlobalBlock(x, y, z)
        if (block !== Block.Air && block !== Block.Bedrock) {
          onUpdateBlock(x, y, z, null)
        }
      } else if (tool === Tab.Add) {
        const block = localMap.getGlobalBlock(x, y, z)
        if (block === Block.Air || block === Block.Water) {
          onUpdateBlock(x, y, z, selectedBlock)
        }
      } else if (tool === Tab.Lookup) {
        onLookupBlock(x, y, z)
      } else if (tool === Tab.RotateX || tool === Tab.RotateY || tool === Tab.RotateZ) {
        const block = localMap.getGlobalBlock(x, y, z)
        if (block !== Block.Air && block !== Block.Bedrock) {
          const currentRotation = localMap.getGlobalBlockRotation(x, y, z)
          
          let rx = currentRotation & 3
          let ry = (currentRotation >> 2) & 3
          let rz = (currentRotation >> 4) & 3

          if (tool === Tab.RotateX) {
            rx = (rx + 1) % 4
          } else if (tool === Tab.RotateY) {
            ry = (ry + 1) % 4
          } else if (tool === Tab.RotateZ) {
            rz = (rz + 1) % 4
          }

          const nextRotation = rx | (ry << 2) | (rz << 4)
          onUpdateBlock(x, y, z, block, nextRotation)
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
      if (active && event.code === 'Enter') {
        handleEditorAction({ button: 0 } as MouseEvent)
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

    const handleWheel = (e: WheelEvent) => {
      if (!active || !controlsRef.current?.isLocked) return
      const { shapeSize, setShapeSize } = useEditorStore.getState()
      if (e.deltaY < 0) {
        setShapeSize(Math.min(5, shapeSize + 1))
      } else {
        setShapeSize(Math.max(1, shapeSize - 1))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('wheel', handleWheel)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('wheel', handleWheel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl.domElement, active, localMap, onUpdateBlock, onLookupBlock])

  useFrame((_, delta) => {
    if (!active) return

    // Arrow key/Q/E/R/F rotation support for mobile/unlocked viewports
    if (!controlsRef.current?.isLocked) {
      const rotSpeed = 1.5 // radians per second
      if (keysRef.current.ArrowLeft || keysRef.current.KeyQ) {
        camera.rotation.y += rotSpeed * delta
      }
      if (keysRef.current.ArrowRight || keysRef.current.KeyE) {
        camera.rotation.y -= rotSpeed * delta
      }
      if (keysRef.current.ArrowUp) {
        camera.rotation.x -= rotSpeed * delta
        camera.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, camera.rotation.x))
      } else if (keysRef.current.KeyR) {
        camera.rotation.x += rotSpeed * delta
        camera.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, camera.rotation.x))
      }
      
      if (keysRef.current.ArrowDown) {
        camera.rotation.x += rotSpeed * delta
        camera.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, camera.rotation.x))
      } else if (keysRef.current.KeyF) {
        camera.rotation.x -= rotSpeed * delta
        camera.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, camera.rotation.x))
      }
    }

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
      const globalX = Math.floor(pos.x + halfSize)
      const globalZ = Math.floor(pos.z + halfSize)
      const adjustedY = Math.floor(pos.y)

      if (adjustedY < 0) return false
      if (adjustedY >= Chunk.HEIGHT) return true // skies

      const block = localMap.getGlobalBlock(globalX, adjustedY, globalZ)
      return !(block !== Block.Air && block !== Block.Water);

    }

    // Collision handling: check each axis separately for sliding
    const finalPosition = camera.position.clone()

    const getPhysicGroundHeight = (pos: THREE.Vector3) => {
      const globalX = Math.floor(pos.x + halfSize)
      const globalZ = Math.floor(pos.z + halfSize)
      let highestSolid = 0
      for (let y = Chunk.HEIGHT - 1; y >= 0; y--) {
        const block = localMap.getGlobalBlock(globalX, y, globalZ)
        if (block !== Block.Air && block !== Block.Water) {
          highestSolid = y + 1
          break
        }
      }
      return highestSolid
    }

    // Try vertical movement first
    const verticalPos = finalPosition.clone()
    verticalPos.y = nextPosition.y
    if (isValidPosition(verticalPos)) {
      finalPosition.y = nextPosition.y
    } else {
      // If moving into a block volume from above, snap to top
      const groundHeight = getPhysicGroundHeight(finalPosition)

      if (finalPosition.y > groundHeight) {
        finalPosition.y = groundHeight + 0.1 // Stay slightly above
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
      <group ref={previewGroupRef}>
        <mesh ref={cubePreviewRef}>
          <BoxGeometry args={[1.01, 1.01, 1.01]} />
          <meshBasicMaterial ref={cubeMaterialRef} color="#fbbf24" opacity={0.4} />
        </mesh>
        <mesh ref={spherePreviewRef}>
          <SphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial ref={sphereMaterialRef} color="#fbbf24" opacity={0.4} />
        </mesh>
      </group>
    </>
  ) : null
}
