import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'
import React, { useEffect } from 'react'

type Params = {
  active: boolean
  domElement: HTMLElement
  controlsRef: React.RefObject<PointerLockControlsImpl>
  keysRef: React.MutableRefObject<Record<string, boolean>>
}

export const usePlayerInput = ({ active, domElement, controlsRef, keysRef }: Params) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true
      if (active && e.code === 'ControlLeft') {
        controlsRef.current?.unlock()
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false
    }
    const handleClick = (e: MouseEvent) => {
      if (active && e.target === domElement) {
        controlsRef.current?.lock()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    domElement.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      domElement.removeEventListener('click', handleClick)
    }
  }, [active, domElement, controlsRef, keysRef])
}
