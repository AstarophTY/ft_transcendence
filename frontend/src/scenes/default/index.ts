import { registerScene } from '@/engine/scene-registry'
import { DefaultCanvas } from './DefaultCanvas'
import { DefaultHUD } from './DefaultHUD'
import { DefaultGUI } from './DefaultGUI'

registerScene({
  id: 'default',
  canvas: DefaultCanvas,
  hud: DefaultHUD,
  gui: DefaultGUI,
})
