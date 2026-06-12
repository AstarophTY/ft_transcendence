import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useEffect, useMemo } from 'react'
import { AxiosError } from 'axios'

import { usePlanetStore } from '@/store/planetStore.ts'
import { listWorlds } from '@/lib/api/world'
import { useAuth } from '@/store/auth'

import { WHEEL_SENSITIVITY } from './planetSelection/constants'
import { createDemoPlanetMap } from './planetSelection/createDemoPlanetMap'
import { toast } from 'sonner'
import i18n from '@/i18n'
import PlanetRail from './planetSelection/PlanetRail'

const CameraController = () => {
  const { camera } = useThree()

  useFrame((_, delta) => {
    const sceneMode = usePlanetStore.getState().sceneMode
    if (sceneMode === 'zooming' || sceneMode === 'zooming-private') {
      const isPrivate = sceneMode === 'zooming-private'
      const privatePos = usePlanetStore.getState().privatePlanetPos

      let targetPos = new THREE.Vector3(0, 0.4, 0.8)
      let targetLookAt = new THREE.Vector3(0, 0, 0)

      if (isPrivate && privatePos) {
        const satPos = new THREE.Vector3(...privatePos)
        targetLookAt.copy(satPos)
        targetPos.copy(satPos).add(new THREE.Vector3(0.2, 0.1, 0.45))
      } else if (isPrivate) {
        targetPos.set(0.8, 0.5, 1.2)
        targetLookAt.set(0.8, 0.4, 0)
      }

      camera.position.lerp(targetPos, delta * 5)
      
      const currentQuaternion = camera.quaternion.clone()
      camera.lookAt(targetLookAt)
      const targetQuaternion = camera.quaternion.clone()
      camera.quaternion.copy(currentQuaternion)
      camera.quaternion.slerp(targetQuaternion, delta * 6)

      if (camera.position.distanceTo(targetPos) < 0.15) {
        usePlanetStore.getState().setSceneMode('world')
      }
    } else if (sceneMode === 'selection') {
      const defaultPos = new THREE.Vector3(0, 1.2, 4.5)
      const targetLookAt = new THREE.Vector3(0, 0, 0)

      camera.position.lerp(defaultPos, delta * 4)

      // Gradually reset rotation to look at the center planets
      const currentQuaternion = camera.quaternion.clone()
      camera.lookAt(targetLookAt)
      const targetQuaternion = camera.quaternion.clone()
      camera.quaternion.copy(currentQuaternion)
      camera.quaternion.slerp(targetQuaternion, delta * 4)

      // Hide the takeoff loading overlay once the camera has flown back to space.
      if (usePlanetStore.getState().isTakingOff && camera.position.distanceTo(defaultPos) < 0.1) {
        usePlanetStore.getState().setTakingOff(false)
      }
    }
  })

  return null
}

const PlanetSelectionScene = () => {
  const user = useAuth((state) => state.user)
  const worlds = usePlanetStore((state) => state.worlds)
  const setWorlds = usePlanetStore((state) => state.setWorlds)

  // One island per campus, loaded from the backend.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    // A backend restart (hot-reload / deploy) briefly 502s the API and refuses
    // the websocket. Rather than stranding the user on an empty list with an
    // error toast until they refresh, retry transient failures with backoff so
    // planet selection recovers on its own once the backend is back.
    const load = (attempt = 0) => {
      listWorlds()
        .then((data) => {
          if (!cancelled) setWorlds(data)
        })
        .catch((err) => {
          if (cancelled) return
          if (err instanceof AxiosError && err.response?.status === 401) return
          const status = err.response?.status
          const transient = !err.response || status === 502 || status === 503 || status === 504
          if (transient && attempt < 5) {
            timer = setTimeout(() => load(attempt + 1), Math.min(1000 * 2 ** attempt, 8000))
            return
          }
          toast.error(i18n.t('world.loadFailed'))
        })
    }
    load()


    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [setWorlds, user?.userId])

  const planetMaps = useMemo(
    () => worlds.map((world) => createDemoPlanetMap(world)),
    [worlds],
  )

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (usePlanetStore.getState().sceneMode !== 'selection') return
      if (planetMaps.length === 0) return

      const canvasContainer = document.getElementById('canvas-container')
      if (canvasContainer && !canvasContainer.contains(event.target as Node)) {
        return
      }

      event.preventDefault()

      const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX
      const currentOffset = usePlanetStore.getState().targetOffset
      const newOffset = THREE.MathUtils.clamp(currentOffset + delta * WHEEL_SENSITIVITY, 0, 1)
      const newIndex = Math.round(newOffset * (planetMaps.length - 1))

      usePlanetStore.setState({ targetOffset: newOffset })
      usePlanetStore.getState().setActiveIndex(newIndex)
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [planetMaps.length])

  return (
    <>
      <CameraController />
      <PlanetRail planetMaps={planetMaps} />
    </>
  )
}

export default PlanetSelectionScene
