import { useState, useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Input } from '@/ui/shadcn/input.tsx';
import { Card } from '@/ui/shadcn/card.tsx';
import { ScrollArea } from '@/ui/shadcn/scroll-area.tsx';
import { BlocksList } from '@/config/Block.ts';
import { isPaidBlock } from '@/config/worldBlocks.ts';
import { useEditorStore } from '@/store/editorStore.ts';
import { usePlanetStore } from '@/store/planetStore.ts';
import { motion, useDragControls } from 'motion/react';
import { GripHorizontal, X, Coins } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile.tsx';
import { useTranslation } from 'react-i18next';
import { useWorldEconomy } from '@/store/worldEconomy.ts';
import { Block } from '@/types/Block';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select.tsx';

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
            blockName.includes('water') || 
            blockName.includes('glass') || 
            blockName === 'ice'
          ) {
            mat.transparent = true;
            mat.opacity = (blockName.includes('water') || blockName === 'ice') ? 0.6 : 0.8;
          }

          // Biome tints
          if ((blockName === 'grass_block' || blockName === 'grass') && index === 2) {
            mat.color.setHex(0x5ebb2d);
          } else if ((blockName === 'grass_block' || blockName === 'grass') && (index === 0 || index === 4)) {
            mat.color.setHex(0x5ebb2d);
          } else if (blockName.includes('water')) {
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
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { selectedBlock, setSelectedBlock, setCatalogOpen } = useEditorStore();
  const coins = useWorldEconomy((s) => s.coins);
  const isPrivateWorld = usePlanetStore((s) => s.isPrivateWorld);
  const dragControls = useDragControls();
  const isMobile = useIsMobile();

  const categories = useMemo(() => {
    const cats = new Set(BlocksList.map((b) => b.category));
    return ['all', ...Array.from(cats)];
  }, []);

  const blockLabel = (name: string) =>
    t(`blocks.${name}`, { defaultValue: name.replace(/_/g, ' ') });

  const filteredBlocks = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return BlocksList.filter((block) => {
      if (block.id === Block.Bedrock) return false;
      const matchesSearch =
        block.name.toLowerCase().includes(term) ||
        blockLabel(block.name).toLowerCase().includes(term);
      const matchesCategory = selectedCategory === 'all' || block.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory, t]);

  const [visibleCount, setVisibleCount] = useState(48);

  useEffect(() => {
    setVisibleCount(48);
  }, [searchTerm, selectedCategory]);

  const displayedBlocks = useMemo(() => {
    return filteredBlocks.slice(0, visibleCount);
  }, [filteredBlocks, visibleCount]);

  const sentinelRef = useRef<HTMLButtonElement | null>(null);

  const loadMore = () =>
    setVisibleCount((prev) =>
      prev < filteredBlocks.length ? prev + 48 : prev
    );

  // Drive pagination from the viewport's scroll position instead of an
  // IntersectionObserver: the observer stops firing inside the Radix
  // ScrollArea viewport on touch devices, leaving the list stuck on the
  // "loading more" row. A scroll listener works reliably on mobile and desktop.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const viewport = sentinel.closest(
      '[data-radix-scroll-area-viewport]'
    ) as HTMLElement | null;
    if (!viewport) return;

    const maybeLoadMore = () => {
      if (
        viewport.scrollTop + viewport.clientHeight >=
        viewport.scrollHeight - 150
      ) {
        loadMore();
      }
    };

    viewport.addEventListener('scroll', maybeLoadMore, { passive: true });
    // Also fill the viewport when the current batch is shorter than it.
    maybeLoadMore();

    return () => viewport.removeEventListener('scroll', maybeLoadMore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedBlocks, filteredBlocks.length]);

  return (
    <div className="
      /* Desktop (Default) */
      absolute top-16 right-16 w-[400px] h-[500px] z-50
      
      /* Mobile Portrait */
      max-md:fixed max-md:bottom-0 max-md:inset-x-0 max-md:top-auto max-md:right-auto max-md:w-full max-md:h-[60vh]
      
      /* Mobile/Tablet Landscape */
      max-lg:landscape:fixed max-lg:landscape:top-0 max-lg:landscape:bottom-0 max-lg:landscape:right-0 max-lg:landscape:left-auto max-lg:landscape:w-[320px] max-lg:landscape:h-full
    ">
      <motion.div 
        key={isMobile ? 'mobile' : 'desktop'}
        drag={!isMobile}
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        className="
          flex flex-col h-full w-full space-y-4 p-4 pointer-events-auto 
          bg-background/60 backdrop-blur-md supports-[backdrop-filter]:bg-background/40 
          shadow-lg
          
          /* Desktop */
          rounded-xl border border-border/40
          
          /* Mobile Portrait */
          max-md:rounded-t-2xl max-md:rounded-b-none max-md:border-t max-md:border-x-0 max-md:border-b-0
          
          /* Mobile Landscape */
          max-lg:landscape:rounded-l-2xl max-lg:landscape:rounded-r-none max-lg:landscape:border-l max-lg:landscape:border-y-0 max-lg:landscape:border-r-0
        "
      >
        {/* Visual Handle for bottom sheet - Only visible on Mobile Portrait */}
        <div className="hidden max-md:portrait:block w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto -mt-1 mb-2" />

        <div className="flex flex-col space-y-2">
          <div 
            className={`flex items-center justify-between pb-1 ${isMobile ? '' : 'cursor-grab active:cursor-grabbing'}`}
            onPointerDown={(e) => !isMobile && dragControls.start(e)}
          >
            <div className="flex items-center gap-2">
              {!isMobile && <GripHorizontal className="h-5 w-5 text-muted-foreground" />}
              <h2 className="text-lg font-bold select-none">{t('editor.catalog.title')}</h2>
            </div>

            <div className="flex items-center gap-2">
              {coins !== null && (
                <div
                  title={t('editor.economy.budget')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/20 border border-border/30 select-none"
                >
                  <Coins className="h-4 w-4 shrink-0 text-yellow-500" />
                  <span className="text-sm font-mono font-bold text-foreground tabular-nums">{coins}</span>
                  <span className="sr-only">{t('editor.economy.coins')}</span>
                </div>
              )}

              {/* Close button */}
            {isMobile && (
              <button 
                onClick={() => setCatalogOpen(false)}
                className="p-1 rounded-md hover:bg-muted/20 active:scale-95 transition-all text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={t('editor.closeCatalog')}
              >
                <X className="h-5 w-5" />
              </button>
            )}
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder={t('editor.catalog.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-background/20 backdrop-blur-xs border-border/30 focus-visible:ring-1 focus-visible:ring-primary/50"
            />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[120px] capitalize bg-background/20 backdrop-blur-xs border-border/30 focus:ring-1 focus:ring-primary/50">
                <SelectValue placeholder={t('editor.catalog.colorPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="capitalize">
                    {t(`editor.categories.${category}`, { defaultValue: category })}
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
                className={`flex flex-col cursor-pointer transition-all hover:scale-105 active:scale-95 overflow-hidden bg-background/30 backdrop-blur-xs border border-border/30 hover:bg-background/45 ${
                  selectedBlock === block.id
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => {
                  setSelectedBlock(block.id);
                  if (isMobile) {
                    setCatalogOpen(false);
                  }
                }}
              >
                <div
                  className="h-20 w-full flex items-center justify-center border-b bg-muted/10 relative"
                >
                  {!isPrivateWorld && !isPaidBlock(block.id) && (
                    <span
                      title={t('editor.economy.freeBlock')}
                      className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full bg-green-500/85 text-white text-[10px] font-bold uppercase tracking-wide leading-none shadow-sm select-none"
                    >
                      {t('editor.free')}
                    </span>
                  )}
                  <BlockPreview name={block.name} color={block.color} />
                </div>
                <div className="p-2 text-center text-sm font-medium truncate">
                  {blockLabel(block.name)}
                </div>
              </Card>
            ))}

            {filteredBlocks.length > visibleCount && (
              <button
                ref={sentinelRef}
                type="button"
                onClick={loadMore}
                className="col-span-full h-9 flex items-center justify-center text-xs text-muted-foreground hover:text-foreground active:scale-95 transition-all cursor-pointer"
              >
                {t('editor.catalog.loadingMore')}
              </button>
            )}

            {filteredBlocks.length === 0 && (
              <div className="col-span-full py-8 text-center text-muted-foreground">
                {t('editor.catalog.noBlocks')}
              </div>
            )}
          </div>
        </ScrollArea>
      </motion.div>
    </div>
  );
}
