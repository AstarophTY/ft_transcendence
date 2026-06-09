import React, { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

import { Chunk } from '@/types/maps/Chunk.ts'
import { LocalMap } from '@/types/maps/LocalMap'
import { Block } from '@/types/Block'
import { BlockMetadata } from '@/config/Block'

export interface MinimapProps {
  localMap: LocalMap
  mapVersion: number
  playerRef: React.RefObject<THREE.Group | null>
  currentMode: 'freecam' | 'player'
  mapSize: number
}

export const Minimap = ({
  localMap,
  mapVersion,
  playerRef,
  currentMode,
  mapSize
}: MinimapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mapCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const { camera } = useThree()

  useEffect(() => {
    if (!mapCanvasRef.current) {
      mapCanvasRef.current = document.createElement('canvas')
      mapCanvasRef.current.width = mapSize
      mapCanvasRef.current.height = mapSize
    }
    const mCanvas = mapCanvasRef.current
    const ctx = mCanvas.getContext('2d')
    if (!ctx) return
    
    const imageData = ctx.createImageData(mapSize, mapSize)
    const data = imageData.data

    for (let cx = 0; cx < localMap.widthInChunks; cx++) {
      for (let cz = 0; cz < localMap.depthInChunks; cz++) {
        const chunk = localMap.getChunk(cx, cz)
        if (!chunk) continue
        
        for (let x = 0; x < Chunk.WIDTH; x++) {
          for (let z = 0; z < Chunk.WIDTH; z++) {
            const globalX = cx * Chunk.WIDTH + x
            const globalZ = cz * Chunk.WIDTH + z
            
            let topBlock = Block.Air
            let topY = 0
            for (let y = Chunk.HEIGHT - 1; y >= 0; y--) {
              const b = chunk.getBlock(x, y, z)
              if (b !== Block.Air && b !== Block.Glass && b !== Block.Water) {
                topBlock = b
                topY = y
                break
              } else if (b === Block.Water) {
                topBlock = b
                topY = y
                break
              }
            }
            
            const idx = (globalZ * mapSize + globalX) * 4
            if (topBlock !== Block.Air) {
              const hex = BlockMetadata[topBlock as keyof typeof BlockMetadata]?.color || '#ffffff'
              const r = parseInt(hex.slice(1, 3), 16) || 255
              const g = parseInt(hex.slice(3, 5), 16) || 255
              const b = parseInt(hex.slice(5, 7), 16) || 255
              
              let shade = 0.7 + (topY / Chunk.HEIGHT) * 0.3
              if (topBlock === Block.Water) shade = 0.9
              
              data[idx] = Math.floor(r * shade)
              data[idx + 1] = Math.floor(g * shade)
              data[idx + 2] = Math.floor(b * shade)
              data[idx + 3] = 255
            } else {
              data[idx] = 0
              data[idx + 1] = 0
              data[idx + 2] = 0
              data[idx + 3] = 0
            }
          }
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0)
  }, [localMap, mapVersion, mapSize])

  useFrame(() => {
    const canvas = canvasRef.current
    const mCanvas = mapCanvasRef.current
    if (!canvas || !mCanvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    
    ctx.clearRect(0, 0, width, height)

    let px = 0, pz = 0, ry = 0
    if (currentMode === 'player' && playerRef.current) {
      px = playerRef.current.position.x
      pz = playerRef.current.position.z
      const euler = new THREE.Euler().setFromQuaternion(playerRef.current.quaternion, 'YXZ')
      ry = euler.y
    } else {
      px = camera.position.x
      pz = camera.position.z
      ry = camera.rotation.y
    }

    const halfMap = mapSize / 2
    const cx = px + halfMap
    const cz = pz + halfMap

    const zoom = 4
    
    ctx.save()
    ctx.translate(width / 2, height / 2)
    
    ctx.save()
    ctx.scale(zoom, zoom)
    ctx.translate(-cx, -cz)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(mCanvas, 0, 0)
    ctx.restore()

    ctx.rotate(-ry + Math.PI)
    
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.moveTo(0, 6)
    ctx.lineTo(4, -5)
    ctx.lineTo(0, -2)
    ctx.lineTo(-4, -5)
    ctx.closePath()
    ctx.fill()
    
    ctx.lineWidth = 1
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()
    
    ctx.restore()
  })

  return (
    <Html
      fullscreen
      zIndexRange={[50, 50]}
      calculatePosition={(_, __, size) => [size.width / 2, size.height / 2]}
      style={{ pointerEvents: 'none' }}
    >
      <div className="absolute top-3 pl-18 lg:pl-3">
        <div className="w-20 h-20 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-border/50 shadow-xl bg-background/80 backdrop-blur-md pointer-events-none">
          <canvas ref={canvasRef} width={144} height={144} className="w-full h-full" />
        </div>
      </div>
    </Html>
  )
}