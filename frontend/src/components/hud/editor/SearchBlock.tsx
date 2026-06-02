import { useState, useMemo } from 'react';
import { Input } from '@/components/shadcn/input';
import { Card } from '@/components/shadcn/card';
import { ScrollArea } from '@/components/shadcn/scroll-area';
import { BLOCKS_LIST } from '@/models/Block';
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

export function SearchBlock() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { selectedBlock, setSelectedBlock } = useEditorStore();
  const dragControls = useDragControls();

  const categories = useMemo(() => {
    const cats = new Set(BLOCKS_LIST.map((b) => b.category));
    return ['all', ...Array.from(cats)];
  }, []);

  const filteredBlocks = useMemo(() => {
    return BLOCKS_LIST.filter((block) => {
      const matchesSearch = block.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || block.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  return (
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
          {filteredBlocks.map((block) => (
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
                className="h-20 w-full flex items-center justify-center border-b"
                style={{ backgroundColor: block.color }}
              >
                {/* add three js visualize*/}
              </div>
              <div className="p-2 text-center text-sm font-medium">
                {block.name}
              </div>
            </Card>
          ))}
          {filteredBlocks.length === 0 && (
            <div className="col-span-full py-8 text-center text-muted-foreground">
              No blocks found.
            </div>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
}
