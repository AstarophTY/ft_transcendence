import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'
import React, { useEffect } from 'react'

import { isEditableTarget } from '@/lib/utils'

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
      // Ignore game controls while typing in an input/textarea/etc.
      if (isEditableTarget(e)) return
      keysRef.current[e.code] = true
      if (active && (e.code === 'ControlLeft' || e.code === 'KeyE' || e.code === 'Escape')) {
        // Toggle the cursor: free it to use the UI, or re-lock to control the
        // camera again — so no manual click is needed to get back in.
        if (controlsRef.current?.isLocked) {
          controlsRef.current.unlock()
        } else if (performance.now() - lastUnlockTime >= 1250) {
          controlsRef.current?.lock()
        }
        // E doubles as a rotation key when unlocked; clear it so toggling
        // doesn't immediately spin the camera.
        keysRef.current.KeyE = false
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
