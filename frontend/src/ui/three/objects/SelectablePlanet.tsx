import { useEffect, useMemo, useRef, useState, ElementType } from 'react'
import { ThreeEvent, useFrame } from '@react-three/fiber'
import { Billboard, Html } from '@react-three/drei'
import * as THREE from 'three'

import type { PlanetMap } from '@/types/maps/PlanetMap.ts'
import { usePlanetStore } from '@/store/planetStore.ts'
import { useAuth } from '@/store/auth'

import PlanetPreviewFaces from './selectablePlanet/PlanetPreviewFaces'
import { useSelectablePlanetAnimation } from './selectablePlanet/useSelectablePlanetAnimation'

const BoxGeometry = 'boxGeometry' as unknown as ElementType

interface SelectablePlanetProps {
  map: PlanetMap
  index: number
  totalCount: number
}

function Satellite({ onClick }: { onClick: (event: ThreeEvent<MouseEvent>) => void }) {
  const satelliteRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!satelliteRef.current) return
    const t = state.clock.getElapsedTime()
    const radius = 1
    const speed = 0.5
    satelliteRef.current.position.set(
      Math.cos(t * speed) * radius,
      Math.sin(t * speed * 0.5) * 0.5,
      Math.sin(t * speed) * radius
    )
    satelliteRef.current.rotation.y += 0.01
  })

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.emissive.set('#fbbf24');
      materialRef.current.emissiveIntensity = hovered ? 1.0 : 0.5;
    }
  }, [hovered]);

  return (
    <mesh ref={satelliteRef} onClick={onClick} onPointerOver={() => {
      document.body.style.cursor = 'pointer';
      setHovered(true);
    }}
    onPointerOut={() => {
      document.body.style.cursor = 'auto';
      setHovered(false);
    }}>
      <Billboard position={[0, 0.5, 0]}>
        <Html center transform sprite distanceFactor={3}>
          Private planet
        </Html>
      </Billboard>
      <BoxGeometry args={[0.2, 0.2, 0.2]} />
      <meshStandardMaterial ref={materialRef} color="#fbbf24" />
    </mesh>    
  )
}

const SelectablePlanet = ({ map, index, totalCount }: SelectablePlanetProps) => {
  const planetRef = useRef<THREE.Group>(null)
  const blendRef = useRef(0)
  const [hovered, setHovered] = useState(false)
  
  const user = useAuth((s) => s.user)
  const worlds = usePlanetStore((s) => s.worlds)
  // const activeIndex = usePlanetStore((s) => s.activeIndex)

  const isPlayerCampus = user && (
    (user.campusId && worlds[index]?.campusId === user.campusId) ||
    (!user.campusId && index === 0) ||
    (user.campusId && !worlds.some(w => w.campusId === user.campusId) && index === 0)
  );
  const label = worlds[index]?.label || 'Unknown';
  // const isActive = activeIndex === index

  useSelectablePlanetAnimation({ planetRef, blendRef, hovered, index, totalCount })

  const factor = 64
  const previewVoxels = useMemo(() => map.getPreview(factor), [map])
  const scale = 1 / factor
  const half = 0.5
  const inset = 0.01

  const minHeight = useMemo(() => {
    if (previewVoxels.length === 0) return 0
    return previewVoxels.reduce((lowest, voxel) => Math.min(lowest, voxel.y), previewVoxels[0]!.y)
  }, [previewVoxels])

  const getHeight = (voxelHeight: number) => Math.max(0, voxelHeight - minHeight) * scale

  // Average color of the whole planet, used to tint the base cube so the flat
  // areas (where no height face is drawn) take the terrain color instead of grey.
  const baseColor = useMemo(() => {
    if (previewVoxels.length === 0) return '#9ca3af'
    let r = 0, g = 0, b = 0
    for (const voxel of previewVoxels) {
      const n = parseInt(voxel.color.slice(1), 16)
      r += (n >> 16) & 255
      g += (n >> 8) & 255
      b += n & 255
    }
    const count = previewVoxels.length
    const channel = (v: number) => Math.round(v / count).toString(16).padStart(2, '0')
    return `#${channel(r)}${channel(g)}${channel(b)}`
  }, [previewVoxels])

  return (
    <group ref={planetRef}>
      <mesh
        onPointerOver={() => {
          document.body.style.cursor = 'pointer'
          setHovered(true)
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
          setHovered(false)
        }}
        onClick={(e) => {
          e.stopPropagation()
          const storeState = usePlanetStore.getState();
          if (storeState.activeIndex === index) {
            storeState.setIsPrivateWorld(false);
            storeState.setSceneMode('zooming');
          } else {
            storeState.setTargetOffset(index / (totalCount - 1))
            storeState.setActiveIndex(index);
          }
        }}
      >
        <BoxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={baseColor} />
      </mesh>

      <PlanetPreviewFaces
        previewVoxels={previewVoxels}
        scale={scale}
        half={half}
        inset={inset}
        getHeight={getHeight}
      />
        <Billboard position={[0, 1.5, 0]}>
          <Html center transform sprite distanceFactor={6} zIndexRange={[100, 0]}>
            {label}
          </Html>
        </Billboard>


      {isPlayerCampus &&
      <Satellite onClick={(e) => {
          e.stopPropagation();
          const storeState = usePlanetStore.getState();
            storeState.setIsPrivateWorld(true);
            storeState.setSceneMode('zooming-private');
        }}
      />
    }
    </group>
  )
}

export default SelectablePlanet
