import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { usePlanetStore } from "@/store/planetStore"

/** Fullscreen loading overlay shown while taking off back to planet selection. */
export default function TakeoffOverlay() {
  const { t } = useTranslation()
  const isTakingOff = usePlanetStore((s) => s.isTakingOff)
  const setTakingOff = usePlanetStore((s) => s.setTakingOff)

  // Safety net: never let the overlay get stuck if the camera never settles.
  useEffect(() => {
    if (!isTakingOff) return
    const timer = window.setTimeout(() => setTakingOff(false), 5000)
    return () => window.clearTimeout(timer)
  }, [isTakingOff, setTakingOff])

  if (!isTakingOff) return null

  return (
    <div className="pointer-events-auto absolute inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
      <h2 className="text-2xl font-bold tracking-tight text-primary">{t('auth.takingOff')}</h2>
    </div>
  )
}
