import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'
import React, { useEffect } from 'react'

type Params = {
  active: boolean
  domElement: HTMLElement
  controlsRef: React.RefObject<PointerLockControlsImpl>
  keysRef: React.MutableRefObject<Record<string, boolean>>
}

let lastUnlockTime = 0

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
        if (performance.now() - lastUnlockTime < 1250) {
          e.stopPropagation()
          e.preventDefault()
          return
        }
        controlsRef.current?.lock()
      }
    }
    const handlePointerLockChange = () => {
      if (!document.pointerLockElement) {
        lastUnlockTime = performance.now()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    domElement.addEventListener('click', handleClick)
    document.addEventListener('pointerlockchange', handlePointerLockChange)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      domElement.removeEventListener('click', handleClick)
      document.removeEventListener('pointerlockchange', handlePointerLockChange)
    }
  }, [active, domElement, controlsRef, keysRef])
}
