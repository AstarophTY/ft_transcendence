import { usePlanetStore } from '../../../store/planetStore'

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
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 p-3 bg-gray-900/50 backdrop-blur rounded-full pointer-events-auto">
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
    </div>
  )
}
