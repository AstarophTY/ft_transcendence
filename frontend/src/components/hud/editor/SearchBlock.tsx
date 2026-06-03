import { useState, useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Input } from '@/components/shadcn/input';
import { Card } from '@/components/shadcn/card';
import { ScrollArea } from '@/components/shadcn/scroll-area';
import { BlocksList } from '@/config/Block';
import { useEditorStore } from '@/store/editorStore';
import { motion, useDragControls } from 'motion/react';
import { GripHorizontal } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';

// Global cache for 3D previews as data URLs (PNG)
const previewCache = new Map<string, string>();
const pendingPromises = new Map<string, Promise<string>>();

let globalRenderer: THREE.WebGLRenderer | null = null;
let globalScene: THREE.Scene | null = null;
let globalCamera: THREE.OrthographicCamera | null = null;
let globalBox: THREE.Mesh | null = null;
const textureLoader = new THREE.TextureLoader();

function initGlobalRenderer() {
  if (globalRenderer) return;

  globalRenderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  globalRenderer.setSize(96, 96);
  globalRenderer.shadowMap.enabled = false;

  globalScene = new THREE.Scene();

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  globalScene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.85);
  dirLight1.position.set(5, 8, 5);
  globalScene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.25);
  dirLight2.position.set(-5, 4, -3);
  globalScene.add(dirLight2);

  const d = 0.82;
  globalCamera = new THREE.OrthographicCamera(-d, d, d, -d, 0.1, 20);
  globalCamera.position.set(2, 1.63, 2);
  globalCamera.lookAt(0, -0.05, 0);

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const placeholderMaterials = Array.from({ length: 6 }).map(() =>
    new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  globalBox = new THREE.Mesh(geometry, placeholderMaterials);
  globalScene.add(globalBox);
}

function getBlockPreview(name: string, color: string): Promise<string> {
  const cacheKey = `${name}_${color}`;
  if (previewCache.has(cacheKey)) {
    return Promise.resolve(previewCache.get(cacheKey)!);
  }
  if (pendingPromises.has(cacheKey)) {
    return pendingPromises.get(cacheKey)!;
  }

  const promise = new Promise<string>((resolve) => {
    initGlobalRenderer();

    const blockName = name.toLowerCase();
    const texturePath = `/three/assets/blocks/textures/${blockName}.png`;

    const renderAndCache = (materials: THREE.MeshStandardMaterial[]) => {
      if (!globalBox || !globalScene || !globalRenderer || !globalCamera) {
        resolve('');
        return;
      }
      
      const oldMaterials = globalBox.material as THREE.Material[];
      globalBox.material = materials;

      globalRenderer.render(globalScene, globalCamera);
      const dataUrl = globalRenderer.domElement.toDataURL('image/png');
      previewCache.set(cacheKey, dataUrl);

      materials.forEach((mat) => {
        if (mat.map) mat.map.dispose();
        mat.dispose();
      });

      if (Array.isArray(oldMaterials)) {
        oldMaterials.forEach((m) => m.dispose());
      }

      resolve(dataUrl);
    };

    textureLoader.load(
      texturePath,
      (texture) => {
        texture.magFilter = THREE.NearestFilter;
        texture.colorSpace = THREE.SRGBColorSpace;

        const w = 1 / 6;
        const faceUVs = [
          { offset: [2 * w, 0], repeat: [w, 1], rotation: 0 }, // Right (+X)
          { offset: [4 * w, 0], repeat: [w, 1], rotation: 0 }, // Left (-X)
          { offset: [0 * w, 0], repeat: [w, 1], rotation: 0 }, // Top (+Y)
          { offset: [5 * w, 0], repeat: [w, 1], rotation: 0 }, // Bottom (-Y)
          { offset: [3 * w, 0], repeat: [w, 1], rotation: 0 }, // Front (+Z)
          { offset: [1 * w, 0], repeat: [w, 1], rotation: 0 }  // Back (-Z)
        ];

        const materials = Array.from({ length: 6 }).map((_, index) => {
          const mat = new THREE.MeshStandardMaterial({ color: '#ffffff' });
          const faceTex = texture.clone();
          const config = faceUVs[index];

          faceTex.repeat.set(config.repeat[0], config.repeat[1]);
          faceTex.center.set(0.5, 0.5);
          faceTex.offset.set(
            config.offset[0] + config.repeat[0] / 2 - 0.5,
            config.offset[1] + config.repeat[1] / 2 - 0.5
          );
          faceTex.rotation = config.rotation;
          faceTex.needsUpdate = true;

          mat.map = faceTex;

          // Transparency
          if (
            blockName === 'water_still' || 
            blockName === 'water_flow' || 
            blockName === 'glass' || 
            blockName.includes('stained_glass') || 
            blockName === 'ice'
          ) {
            mat.transparent = true;
            mat.opacity = (blockName.includes('water') || blockName === 'ice') ? 0.6 : 0.8;
          }

          // Biome tints
          if (blockName === 'grass_block' && index === 2) {
            mat.color.setHex(0x5ebb2d);
          } else if (blockName === 'grass_block' && (index === 0 || index === 4)) {
            mat.color.setHex(0x5ebb2d);
          } else if (blockName === 'water_still' || blockName === 'water_flow') {
            mat.color.setHex(0x2a5eff);
          } else if (blockName.includes('leaves')) {
            mat.color.setHex(0x4a8f28);
            mat.transparent = true;
            mat.alphaTest = 0.1;
          }

          return mat;
        });

        texture.dispose();
        renderAndCache(materials);
      },
      undefined,
      () => {
        // Fallback
        const materials = Array.from({ length: 6 }).map(() => {
          const mat = new THREE.MeshStandardMaterial({ color: color });
          if (
            blockName === 'water_still' || 
            blockName === 'water_flow' || 
            blockName === 'glass' || 
            blockName.includes('stained_glass') || 
            blockName === 'ice'
          ) {
            mat.transparent = true;
            mat.opacity = 0.6;
          }
          return mat;
        });
        renderAndCache(materials);
      }
    );
  });

  pendingPromises.set(cacheKey, promise);
  return promise;
}

export function BlockPreview({ name, color }: { name: string; color: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getBlockPreview(name, color).then((url) => {
      if (active) {
        setDataUrl(url);
      }
    });
    return () => {
      active = false;
    };
  }, [name, color]);

  if (!dataUrl) {
    return (
      <div 
        className="w-12 h-12 rounded shadow-inner animate-pulse"
        style={{ backgroundColor: color }}
      />
    );
  }

  return (
    <img 
      src={dataUrl} 
      alt={name} 
      className="w-16 h-16 object-contain select-none transition-transform duration-200 hover:scale-110 active:scale-95"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

export function SearchBlock() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { selectedBlock, setSelectedBlock } = useEditorStore();
  const dragControls = useDragControls();

  const categories = useMemo(() => {
    const cats = new Set(BlocksList.map((b) => b.category));
    return ['all', ...Array.from(cats)];
  }, []);

  const filteredBlocks = useMemo(() => {
    return BlocksList.filter((block) => {
      const matchesSearch = block.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || block.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const [visibleCount, setVisibleCount] = useState(48);

  useEffect(() => {
    setVisibleCount(48);
  }, [searchTerm, selectedCategory]);

  const displayedBlocks = useMemo(() => {
    return filteredBlocks.slice(0, visibleCount);
  }, [filteredBlocks, visibleCount]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((prev) => prev + 48);
      }
    }, { rootMargin: '100px' });

    observer.observe(sentinel);
    return () => {
      observer.unobserve(sentinel);
    };
  }, [displayedBlocks]);

  return (
    <div className="absolute top-16 right-16 w-[400px] h-[500px] z-50">
      <motion.div 
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        className="flex flex-col h-full w-full space-y-4 p-4 pointer-events-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-xl border shadow-lg"
      >
        <div className="flex flex-col space-y-2">
          <div 
            className="flex items-center justify-between cursor-grab active:cursor-grabbing pb-1"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <div className="flex items-center gap-2">
              <GripHorizontal className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-bold select-none">Block Catalog</h2>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Search blocks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[120px] capitalize">
                <SelectValue placeholder="Color" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="capitalize">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-1">
            {displayedBlocks.map((block) => (
              <Card
                key={block.id}
                className={`flex flex-col cursor-pointer transition-all hover:scale-105 active:scale-95 overflow-hidden ${
                  selectedBlock === block.id
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedBlock(block.id)}
              >
                <div 
                  className="h-20 w-full flex items-center justify-center border-b bg-muted/10 relative"
                >
                  <BlockPreview name={block.name} color={block.color} />
                </div>
                <div className="p-2 text-center text-sm font-medium truncate">
                  {block.name.replace(/_/g, ' ')}
                </div>
              </Card>
            ))}

            {filteredBlocks.length > visibleCount && (
              <div 
                ref={sentinelRef}
                className="col-span-full h-8 flex items-center justify-center text-xs text-muted-foreground"
              >
                Loading more blocks...
              </div>
            )}

            {filteredBlocks.length === 0 && (
              <div className="col-span-full py-8 text-center text-muted-foreground">
                No blocks found.
              </div>
            )}
          </div>
        </ScrollArea>
      </motion.div>
    </div>
  );
}
