import { useRef } from 'react'
import type { Mesh } from 'three'

export function DefaultCanvas() {
  const mesh = useRef<Mesh>(null)

  return (
    <>
      <color args={['#ffffff']} />
      <mesh ref={mesh} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
    </>
  )
}