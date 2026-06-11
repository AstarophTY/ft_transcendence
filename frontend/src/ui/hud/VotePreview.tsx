/* eslint-disable react/no-unknown-property */
import { useEffect, useState, useMemo } from 'react'
import { motion, useDragControls } from 'motion/react'
import { X, Loader2, GripHorizontal } from 'lucide-react'
import { Button } from '@/ui/shadcn/button.tsx'
import { useIsMobile } from '@/hooks/use-mobile.tsx'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Center } from '@react-three/drei'
import * as THREE from 'three'
import { api } from '@/lib/api'
import { BlockMetadata } from '@/config/Block.ts'
import { Block, BlockMeta } from '@/types/Block.ts'
import { useTranslation } from 'react-i18next'

interface VotePreviewProps {
  userId: string | null
  onClose: () => void
  onVote?: () => void
  canVote?: boolean
  isVoting?: boolean
}

interface EditedBlock {
  x: number
  y: number
  z: number
  block: Block
  rotation?: number
}

const BASE_MAP = new Map<string, {block: Block, rotation: number}>()
for (let x = 0; x < 64; x++) {
  for (let z = 0; z < 64; z++) {
    BASE_MAP.set(`${x},0,${z}`, {block: Block.Bedrock, rotation: 0})
    for (let y = 1; y <= 5; y++) {
       let b = Block.Stone
       if (y === 5) b = Block.Grass
       else if (y > 2) b = Block.Dirt
       BASE_MAP.set(`${x},${y},${z}`, {block: b, rotation: 0})
    }
  }
}

const TEXTURE_MATERIALS = new Map<Exclude<Block, Block.Air>, THREE.Material[]>()
const getBlockMaterials = (blockType: Exclude<Block, Block.Air>, meta: BlockMeta) => {
  if (TEXTURE_MATERIALS.has(blockType)) return TEXTURE_MATERIALS.get(blockType)!
  
  const textureLoader = new THREE.TextureLoader()
  const mats = Array.from({ length: 6 }).map(() => {
    const mat = new THREE.MeshStandardMaterial({ color: meta.color, envMapIntensity: 0 })
    if (blockType === Block.Water) {
      mat.transparent = true
      mat.opacity = 0.6
      mat.depthWrite = false
    }
    return mat
  })
  
  const texturePath = `/three/assets/blocks/textures/${meta.name.toLowerCase()}.png`
  textureLoader.load(
    texturePath,
    (texture) => {
      texture.magFilter = THREE.NearestFilter
      texture.colorSpace = THREE.SRGBColorSpace
      
      const w = 1 / 6
      const faceUVs = [
        { offset: [2 * w, 0], repeat: [w, 1], rotation: 0 },
        { offset: [4 * w, 0], repeat: [w, 1], rotation: 0 },
        { offset: [0, 0], repeat: [w, 1], rotation: 0 },
        { offset: [5 * w, 0], repeat: [w, 1], rotation: 0 },
        { offset: [3 * w, 0], repeat: [w, 1], rotation: 0 },
        { offset: [w, 0], repeat: [w, 1], rotation: 0 }
      ]
      
      mats.forEach((mat, index) => {
        const faceTex = texture.clone()
        const config = faceUVs[index]
        
        faceTex.repeat.set(config.repeat[0], config.repeat[1])
        faceTex.center.set(0.5, 0.5)
        faceTex.offset.set(config.offset[0] + config.repeat[0] / 2 - 0.5, config.offset[1] + config.repeat[1] / 2 - 0.5)
        faceTex.rotation = config.rotation
        faceTex.needsUpdate = true
        mat.map = faceTex
        mat.color.set(new THREE.Color('#ffffff'))
        mat.needsUpdate = true
      })
    },
    undefined,
    () => {}
  )
  
  TEXTURE_MATERIALS.set(blockType, mats)
  return mats
}

const PreviewMap = ({ editedBlocks }: { editedBlocks: EditedBlock[] }) => {
  const instances = useMemo(() => {
    const map = new Map(BASE_MAP)

    for (const b of editedBlocks) {
       if (b.block === Block.Air) {
         map.delete(`${b.x},${b.y},${b.z}`)
       } else {
         map.set(`${b.x},${b.y},${b.z}`, {block: b.block, rotation: b.rotation || 0})
       }
    }

    const grouped = new Map<Block, THREE.Matrix4[]>()
    
    const offsetX = -32
    const offsetZ = -32

    map.forEach((val, key) => {
       const [x, y, z] = key.split(',').map(Number)
       if (!grouped.has(val.block)) grouped.set(val.block, [])
       
       const matrix = new THREE.Matrix4()
       const position = new THREE.Vector3((x + offsetX) * 2 + 1, y * 2 + 1, (z + offsetZ) * 2 + 1)
       const quaternion = new THREE.Quaternion()
       if (val.rotation) {
          quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (val.rotation * Math.PI) / 2)
       }
       matrix.compose(position, quaternion, new THREE.Vector3(1, 1, 1))
       
       grouped.get(val.block)!.push(matrix)
    })

    return grouped
  }, [editedBlocks])

  return (
    <group>
      {Array.from(instances.entries()).map(([blockId, matrices]) => {
         const meta = BlockMetadata[blockId as keyof typeof BlockMetadata]
         if (!meta) return null
         const materials = getBlockMaterials(blockId as Exclude<Block, Block.Air>, meta)
         
         return (
           <instancedMesh key={blockId} args={[undefined as unknown as THREE.BufferGeometry, undefined as unknown as THREE.Material, matrices.length]} material={materials}
             ref={(mesh) => {
               if (mesh) {
                 matrices.forEach((mat, i) => mesh.setMatrixAt(i, mat))
                 mesh.instanceMatrix.needsUpdate = true
               }
             }}
           >
             <boxGeometry args={[2, 2, 2]} />
           </instancedMesh>
         )
      })}
    </group>
  )
}

export const VotePreview = ({ userId, onClose, onVote, canVote, isVoting }: VotePreviewProps) => {
  const { t } = useTranslation()
  const dragControls = useDragControls()
  const isMobile = useIsMobile()
  const [blocks, setBlocks] = useState<EditedBlock[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    let active = true
    setLoading(true)
    api.get(`/world/${userId}`).then(res => {
       if (!active) return
       setBlocks(res.data.blocks || [])
       setLoading(false)
    }).catch(err => {
       if (!active) return
       console.error(err)
       setBlocks([])
       setLoading(false)
    })
    return () => { active = false }
  }, [userId])

  if (!userId) return null

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] max-w-[800px] z-[60] max-md:bottom-0 max-md:inset-x-0 max-md:top-auto max-md:left-auto max-md:translate-x-0 max-md:translate-y-0 max-md:w-full max-md:h-[80vh]">
      <motion.div 
        key={isMobile ? 'mobile' : 'desktop'}
        drag={!isMobile}
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        className="flex flex-col h-full w-full pointer-events-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg rounded-xl border border-border/40 max-md:rounded-t-2xl max-md:rounded-b-none max-md:border-t max-md:border-x-0 max-md:border-b-0"
      >
        <div className="hidden max-md:portrait:block w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-2 mb-1" />

        <div 
          className={`flex items-center justify-between p-4 border-b border-border/40 ${isMobile ? '' : 'cursor-grab active:cursor-grabbing'}`}
          onPointerDown={(e) => !isMobile && dragControls.start(e)}
        >
          <div className="flex items-center gap-2">
            <GripHorizontal className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold select-none">{t('vote.previewTitle', { defaultValue: 'World Preview' })}</h2>
          </div>
          <div className="flex items-center gap-2">
            {canVote && onVote && (
              <Button disabled={isVoting} onClick={onVote} size="sm" className="max-md:h-8 max-md:text-xs">
                {isVoting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('vote.vote', { defaultValue: 'Vote' })}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden rounded-b-xl max-md:rounded-none">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">{t('world.loading', { defaultValue: 'Loading world...' })}</p>
            </div>
          ) : (
            <Canvas camera={{ position: [80, 80, 80], fov: 45 }}>
              <ambientLight intensity={0.8} />
              <directionalLight position={[50, 100, 50]} intensity={1.5} />
              <directionalLight position={[-50, 50, -50]} intensity={0.5} />
              <Center>
                <PreviewMap editedBlocks={blocks || []} />
              </Center>
              <OrbitControls makeDefault autoRotate autoRotateSpeed={1} maxPolarAngle={Math.PI / 2 - 0.05} />
            </Canvas>
          )}
        </div>
      </motion.div>
    </div>
  )
}