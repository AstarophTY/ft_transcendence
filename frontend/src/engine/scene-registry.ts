import type { ComponentType } from 'react'

export interface SceneDefinition {
  id: string
  canvas: ComponentType
  hud?: ComponentType
  gui?: ComponentType
}

const registry = new Map<string, SceneDefinition>()

export function registerScene(scene: SceneDefinition) {
  registry.set(scene.id, scene)
}

export function getScene(id: string): SceneDefinition | undefined {
  return registry.get(id)
}
