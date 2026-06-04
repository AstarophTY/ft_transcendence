import { usePlanetStore } from '@/store/planetStore.ts'
import { Card } from '@/ui/shadcn/card.tsx'
import {   
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/ui/shadcn/tooltip.tsx'

export default function PlanetQuickSelect() {
  const worlds = usePlanetStore((state) => state.worlds)
  const planetCount = usePlanetStore((state) => state.planetCount)
  const activeIndex = usePlanetStore((state) => state.activeIndex)
  const setTargetOffset = usePlanetStore((state) => state.setTargetOffset)
  const setActiveIndex = usePlanetStore((state) => state.setActiveIndex)

  const handleSelect = (index: number) => {
    const newOffset = index / (planetCount - 1 || 1)
    
    setTargetOffset(newOffset)
    setActiveIndex(index)
  }

  if (planetCount <= 0) return null

  return (
    <div className='absolute bottom-2 left-0 w-full flex justify-center'>
			<Card className='px-4 py-3 flex-row gap-3'>
      {worlds.map((world, index) => {
        const isActive = index === activeIndex
        return (
          <Tooltip key={world.campusId}>
            <TooltipTrigger>
                <button
                onClick={() => handleSelect(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'bg-foreground scale-125' 
                    : 'bg-foreground/50 hover:bg-foreground/75'
                }`}
                aria-label={`Select planet ${world.label}`}
              />
            </TooltipTrigger>
            <TooltipContent>
              {world.label}
            </TooltipContent>
          </Tooltip>
        )
      })}
      </Card>
    </div>
  )
}
