import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'

// Pause rendering while the canvas is scrolled out of view.
export function PauseOffscreen({ active }) {
  const setFrameloop = useThree((s) => s.setFrameloop)
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    setFrameloop(active ? 'always' : 'demand')
    if (active) invalidate()
  }, [active, setFrameloop, invalidate])
  return null
}

// Studio lighting baked from light panels, so nothing is fetched from a CDN.
export function Studio({ warm = '#FFC83D', cool = '#A7F0C9' }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 6, 5]} intensity={2.4} color="#FFF3DE" />
      <directionalLight position={[-5, 1, -3]} intensity={0.9} color={cool} />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2.2} position={[0, 5, 4]} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={1.2} color={warm} position={[-5, 1, 2]} rotation-y={Math.PI / 3} scale={[3, 6, 1]} />
        <Lightformer form="rect" intensity={0.8} color={cool} position={[5, 0, 1]} rotation-y={-Math.PI / 3} scale={[3, 6, 1]} />
        <Lightformer form="circle" intensity={1.5} position={[0, -4, 2]} scale={4} />
      </Environment>
    </>
  )
}

export const gold = { color: '#F4B400', metalness: 0.85, roughness: 0.26 }

export function Coin({ radius = 0.3, ...props }) {
  return (
    <group {...props}>
      <mesh>
        <cylinderGeometry args={[radius, radius, radius * 0.24, 48]} />
        <meshStandardMaterial {...gold} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position-y={s * radius * 0.12} rotation-x={Math.PI / 2}>
          <torusGeometry args={[radius * 0.78, radius * 0.06, 12, 48]} />
          <meshStandardMaterial {...gold} color="#E09A00" />
        </mesh>
      ))}
    </group>
  )
}

// A cylinder stretched between two points.
export function Tube({ a, b, r = 0.05, children }) {
  const { pos, quat, len } = useMemo(() => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b)
    const dir = B.clone().sub(A)
    return {
      len: dir.length(),
      pos: A.clone().add(B).multiplyScalar(0.5),
      quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()),
    }
  }, [a, b])
  return (
    <mesh position={pos} quaternion={quat}>
      <cylinderGeometry args={[r, r, len, 20]} />
      {children}
    </mesh>
  )
}

// Grows its children in from nothing (and back out) around a pivot point.
export function Grow({ on, at = [0, 0, 0], speed = 7, children }) {
  const g = useRef()
  const s = useRef(on ? 1 : 0)
  useFrame((_, dt) => {
    s.current = THREE.MathUtils.damp(s.current, on ? 1 : 0, speed, dt)
    const v = s.current
    // a little overshoot so parts "pop" into place
    const pop = v < 0.999 ? v + Math.sin(v * Math.PI) * 0.18 : 1
    g.current.scale.setScalar(Math.max(pop, 0.0001))
    g.current.visible = v > 0.01
  })
  return (
    <group position={at}>
      <group ref={g}>
        <group position={at.map((n) => -n)}>{children}</group>
      </group>
    </group>
  )
}
