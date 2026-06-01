import { usePlanetStore } from '../../store/planetStore'
import { Card } from '@/components/shadcn/card'
import { Button } from '@/components/shadcn/button'

export default function PlanetQuickSelect() {
  const planetCount = usePlanetStore((state) => state.planetCount)
  const activeIndex = usePlanetStore((state) => state.activeIndex)
  const setTargetOffset = usePlanetStore((state) => state.setTargetOffset)
  const setActiveIndex = usePlanetStore((state) => state.setActiveIndex)

  const handleSelect = (index: number) => {
    const newOffset = index / (planetCount - 1 || 1)
    
    setTargetOffset(newOffset)
    setActiveIndex(index)
  }

  const planets = Array.from({ length: planetCount })

  if (planetCount <= 0) return null

  return (
    <div className='absolute bottom-2 left-0 w-full flex justify-center'>
			<Card className='px-4 py-3 flex-row gap-3'>
      {planets.map((_, index) => {
        const isActive = index === activeIndex
        return (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              isActive 
                ? 'bg-white scale-125' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Select planet ${index + 1}`}
          />
        )
      })}
      </Card>
    </div>
  )
}
