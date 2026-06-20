import { registerScene } from '@/engine/scene-registry'
import { DefaultCanvas } from '@/scenes/default/DefaultCanvas'
import { DefaultHUD } from '@/scenes/default/DefaultHUD'
import { DefaultGUI } from '@/scenes/default/DefaultGUI'

registerScene({
  id: 'default',
  canvas: DefaultCanvas,
  hud: DefaultHUD,
  gui: DefaultGUI,
})
