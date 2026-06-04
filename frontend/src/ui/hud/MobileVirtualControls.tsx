import { 
  ArrowUpToLine,
  ArrowDownToLine,
  Eye,
  Video
} from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { usePlanetStore } from '@/store/planetStore'
import { Joystick } from 'react-joystick-component'
import { useIsTouchDevice } from '@/hooks/use-mobile.tsx'
import { useRef, useState } from 'react'

export default function MobileVirtualControls() {
  const inEditor = useEditorStore((s) => s.in_editor)
  const activeEditor = useEditorStore((s) => s.activeEditor)
  const theme = usePlanetStore((s) => s.theme)
  const isTouch = useIsTouchDevice()
  const leftMoved = useRef(false)
  const rightMoved = useRef(false)
  const [leftActive, setLeftActive] = useState(false)
  const [rightActive, setRightActive] = useState(false)

  if (!isTouch) return null

  const dispatchKey = (code: string, isDown: boolean) => {
    const event = new KeyboardEvent(isDown ? 'keydown' : 'keyup', { code })
    window.dispatchEvent(event)
  }

  const handleLeftStart = () => {
    leftMoved.current = false
    setLeftActive(true)
  }

  const handleLeftMove = (event: { x: number | null; y: number | null }) => {
    if (Math.abs(event.x ?? 0) > 0.15 || Math.abs(event.y ?? 0) > 0.15) {
      leftMoved.current = true
    }
    handleMove(event)
  }

  const handleLeftStop = () => {
    handleStop()
    setLeftActive(false)
    if (!leftMoved.current) {
      dispatchKey('Space', true)
      setTimeout(() => dispatchKey('Space', false), 50)
    }
  }

  const handleRightStart = () => {
    rightMoved.current = false
    setRightActive(true)
  }

  const handleRightMove = (event: { x: number | null; y: number | null }) => {
    if (Math.abs(event.x ?? 0) > 0.15 || Math.abs(event.y ?? 0) > 0.15) {
      rightMoved.current = true
    }
    handleLook(event)
  }

  const handleRightStop = () => {
    handleLookStop()
    setRightActive(false)
    if (!rightMoved.current) {
      dispatchKey('Enter', true)
      setTimeout(() => dispatchKey('Enter', false), 50)
    }
  }

  // Left Joystick: Movement mapping (W, S, A, D)
  const handleMove = (event: { x: number | null; y: number | null }) => {
    const x = event.x ?? 0
    const y = event.y ?? 0

    // Up/Down (Forward/Backward)
    if (y > 0.35) {
      dispatchKey('KeyW', true)
      dispatchKey('KeyS', false)
    } else if (y < -0.35) {
      dispatchKey('KeyS', true)
      dispatchKey('KeyW', false)
    } else {
      dispatchKey('KeyW', false)
      dispatchKey('KeyS', false)
    }

    // Left/Right
    if (x > 0.35) {
      dispatchKey('KeyD', true)
      dispatchKey('KeyA', false)
    } else if (x < -0.35) {
      dispatchKey('KeyA', true)
      dispatchKey('KeyD', false)
    } else {
      dispatchKey('KeyA', false)
      dispatchKey('KeyD', false)
    }
  }

  const handleStop = () => {
    dispatchKey('KeyW', false)
    dispatchKey('KeyS', false)
    dispatchKey('KeyA', false)
    dispatchKey('KeyD', false)
  }

  // Right Joystick: Camera Rotation mapping (ArrowUp, ArrowDown, ArrowLeft, ArrowRight)
  const handleLook = (event: { x: number | null; y: number | null }) => {
    const x = event.x ?? 0
    const y = event.y ?? 0

    // Camera Up/Down (Inverted vertical movement as requested)
    if (y > 0.35) {
      dispatchKey('ArrowDown', true)
      dispatchKey('ArrowUp', false)
    } else if (y < -0.35) {
      dispatchKey('ArrowUp', true)
      dispatchKey('ArrowDown', false)
    } else {
      dispatchKey('ArrowUp', false)
      dispatchKey('ArrowDown', false)
    }

    // Camera Left/Right
    if (x > 0.35) {
      dispatchKey('ArrowRight', true)
      dispatchKey('ArrowLeft', false)
    } else if (x < -0.35) {
      dispatchKey('ArrowLeft', true)
      dispatchKey('ArrowRight', false)
    } else {
      dispatchKey('ArrowLeft', false)
      dispatchKey('ArrowRight', false)
    }
  }

  const handleLookStop = () => {
    dispatchKey('ArrowUp', false)
    dispatchKey('ArrowDown', false)
    dispatchKey('ArrowLeft', false)
    dispatchKey('ArrowRight', false)
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-40 select-none">
      {/* Full-screen tap zone for block placement/interaction */}
      <div 
        className="absolute inset-0 pointer-events-auto z-0 touch-none"
        onPointerDown={(e) => {
          if (e.button !== 0) return
          dispatchKey('Enter', true)
        }}
        onPointerUp={(e) => {
          if (e.button !== 0) return
          dispatchKey('Enter', false)
        }}
        onPointerCancel={() => dispatchKey('Enter', false)}
      />

      {/* Left side: Movement Joystick */}
      <div 
        className="absolute pointer-events-auto flex items-end gap-2 z-10
                   portrait:left-8 portrait:bottom-20
                   landscape:left-20 landscape:bottom-10"
      >
        <div className={`p-2 rounded-full backdrop-blur-md border shadow-lg transition-all duration-150 ${
          leftActive 
            ? 'bg-background/80 border-primary/40 scale-95 brightness-125' 
            : 'bg-background/30 border-border/30 hover:bg-background/45'
        }`}>
          <Joystick
            size={90}
            sticky={false}
            baseColor={theme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}
            stickColor={theme === 'light' ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.3)'}
            start={handleLeftStart}
            move={handleLeftMove}
            stop={handleLeftStop}
          />
        </div>

        {/* Height control buttons (Space / Shift) for Free Camera Mode */}
        {inEditor && (
          <div className="flex flex-col gap-1 p-1 rounded-xl bg-background/50 backdrop-blur-md border border-border/30 shadow-lg">
            <button
              onPointerDown={() => dispatchKey('Space', true)}
              onPointerUp={() => dispatchKey('Space', false)}
              onPointerCancel={() => dispatchKey('Space', false)}
              onPointerLeave={() => dispatchKey('Space', false)}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/40 border border-border/30 text-foreground active:bg-primary/40 active:scale-95 select-none touch-none"
              aria-label="Move Up"
            >
              <ArrowUpToLine className="size-5" />
            </button>
            <button
              onPointerDown={() => dispatchKey('ShiftLeft', true)}
              onPointerUp={() => dispatchKey('ShiftLeft', false)}
              onPointerCancel={() => dispatchKey('ShiftLeft', false)}
              onPointerLeave={() => dispatchKey('ShiftLeft', false)}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/40 border border-border/30 text-foreground active:bg-primary/40 active:scale-95 select-none touch-none"
              aria-label="Move Down"
            >
              <ArrowDownToLine className="size-5" />
            </button>
          </div>
        )}
      </div>

      {/* Right side: Camera Rotation Joystick & Action Button (with Freecam Toggle stacked above) */}
      <div 
        className="absolute pointer-events-auto flex flex-col items-end gap-3 z-10
                   portrait:right-8 portrait:bottom-20
                   landscape:right-10 landscape:bottom-10"
      >
        {/* Freecam Mode Toggle Button */}
        <button
          onClick={() => activeEditor(!inEditor)}
          className="flex h-10 px-3.5 items-center justify-center gap-1.5 rounded-xl bg-background/60 backdrop-blur-md border border-border/30 text-foreground font-semibold text-xs shadow-lg active:scale-95 active:bg-background/80 transition-all select-none pointer-events-auto"
        >
          {inEditor ? (
            <>
              <Eye className="size-4 text-primary" />
              <span>Exit Freecam</span>
            </>
          ) : (
            <>
              <Video className="size-4" />
              <span>Freecam</span>
            </>
          )}
        </button>

        <div className={`p-2 rounded-full backdrop-blur-md border shadow-lg transition-all duration-150 ${
          rightActive 
            ? 'bg-background/80 border-primary/40 scale-95 brightness-125' 
            : 'bg-background/30 border-border/30 hover:bg-background/45'
        }`}>
          <Joystick
            size={90}
            sticky={false}
            baseColor={theme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}
            stickColor={theme === 'light' ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.3)'}
            start={handleRightStart}
            move={handleRightMove}
            stop={handleRightStop}
          />
        </div>
      </div>
    </div>
  )
}
