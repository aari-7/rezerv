import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Float, PresentationControls, RoundedBox } from '@react-three/drei'
import { useInView } from 'framer-motion'
import * as THREE from 'three'
import { BIKE_PARTS } from '../store.jsx'
import { Coin, Grow, PauseOffscreen, Studio, Tube } from './shared.jsx'


const FRAME = { color: '#D9572B', roughness: 0.3, metalness: 0.25, clearcoat: 0.8 }
const STEEL = { color: '#C9D2CE', roughness: 0.25, metalness: 0.9 }

function Wheel({ x, spin }) {
  const g = useRef()
  useFrame((_, dt) => { if (spin.current) g.current.rotation.z -= dt * spin.current })
  return (
    <group position={[x, 0, 0]}>
      <group ref={g}>
        <mesh><torusGeometry args={[0.72, 0.08, 20, 72]} /><meshStandardMaterial color="#1B1F1C" roughness={0.85} /></mesh>
        <mesh><torusGeometry args={[0.63, 0.024, 12, 72]} /><meshStandardMaterial {...STEEL} /></mesh>
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} rotation-z={(i / 9) * Math.PI}>
            <cylinderGeometry args={[0.008, 0.008, 1.26, 6]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
        ))}
        <mesh rotation-x={Math.PI / 2}><cylinderGeometry args={[0.08, 0.08, 0.16, 20]} /><meshStandardMaterial {...STEEL} /></mesh>
      </group>
    </group>
  )
}

function Bike({ p }) {
  const spin = useRef(0)
  const root = useRef()
  useFrame(({ clock }, dt) => {
    spin.current = THREE.MathUtils.damp(spin.current, p >= 1 ? 3 : 0.4, 2, dt)
    // a happy hop once the cycle is complete
    root.current.position.y = p >= 1 ? Math.abs(Math.sin(clock.elapsedTime * 3)) * 0.12 : 0
  })
  const BB = [-0.1, -0.05, 0], SEAT = [-0.42, 1.0, 0], HEAD_T = [0.72, 0.92, 0], HEAD_B = [0.82, 0.62, 0]
  const on = (i) => p >= BIKE_PARTS[i].at
  const mat = <meshPhysicalMaterial {...FRAME} />
  return (
    <group ref={root}>
      <Grow on={on(0)} at={[-1.1, 0, 0]}><Wheel x={-1.1} spin={spin} /></Grow>
      <Grow on={on(1)} at={[1.1, 0, 0]}><Wheel x={1.1} spin={spin} /></Grow>
      <Grow on={on(2)} at={[0.2, 0.4, 0]}>
        <Tube a={BB} b={SEAT} r={0.055}>{mat}</Tube>
        <Tube a={SEAT} b={HEAD_T} r={0.05}>{mat}</Tube>
        <Tube a={BB} b={HEAD_B} r={0.06}>{mat}</Tube>
        <Tube a={HEAD_B} b={HEAD_T} r={0.065}>{mat}</Tube>
        {[-0.07, 0.07].map((z) => (
          <group key={z}>
            <Tube a={[BB[0], BB[1], z]} b={[-1.1, 0, z]} r={0.03}>{mat}</Tube>
            <Tube a={[-0.38, 0.88, z]} b={[-1.1, 0, z]} r={0.028}>{mat}</Tube>
            <Tube a={[HEAD_B[0], HEAD_B[1], z]} b={[1.1, 0, z]} r={0.03}>{mat}</Tube>
          </group>
        ))}
      </Grow>
      <Grow on={on(3)} at={[-0.2, 0.5, 0]}>
        <Tube a={SEAT} b={[-0.47, 1.18, 0]} r={0.03}><meshStandardMaterial {...STEEL} /></Tube>
        <RoundedBox args={[0.46, 0.1, 0.22]} radius={0.05} position={[-0.47, 1.22, 0]}>
          <meshStandardMaterial color="#111A15" roughness={0.7} />
        </RoundedBox>
        <mesh position={BB} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.17, 0.17, 0.05, 32]} /><meshStandardMaterial {...STEEL} /></mesh>
        {[1, -1].map((s) => (
          <group key={s}>
            <Tube a={[BB[0], BB[1], s * 0.08]} b={[BB[0] + s * 0.12, BB[1] - s * 0.26, s * 0.12]} r={0.022}><meshStandardMaterial {...STEEL} /></Tube>
            <RoundedBox args={[0.2, 0.05, 0.1]} radius={0.02} position={[BB[0] + s * 0.12, BB[1] - s * 0.26, s * 0.18]}>
              <meshStandardMaterial color="#111A15" />
            </RoundedBox>
          </group>
        ))}
      </Grow>
      <Grow on={on(4)} at={[0.7, 1.15, 0]}>
        <Tube a={HEAD_T} b={[0.66, 1.2, 0]} r={0.035}><meshStandardMaterial {...STEEL} /></Tube>
        <Tube a={[0.62, 1.2, -0.42]} b={[0.62, 1.2, 0.42]} r={0.03}><meshStandardMaterial {...STEEL} /></Tube>
        {[-0.38, 0.38].map((z) => (
          <Tube key={z} a={[0.62, 1.2, z - 0.09]} b={[0.62, 1.2, z + 0.09]} r={0.05}><meshStandardMaterial color="#FFC83D" roughness={0.5} /></Tube>
        ))}
      </Grow>
      <Grow on={on(5)} at={[0.62, 1.3, 0.25]}>
        <mesh position={[0.62, 1.28, 0.25]}><sphereGeometry args={[0.08, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#FFC83D" metalness={0.8} roughness={0.25} /></mesh>
      </Grow>
    </group>
  )
}

// For goals other than the cycle: a stack of coins that grows toward the target.
function CoinTower({ p }) {
  const n = 24
  const stacks = useMemo(() => [[-0.9, 0.1], [0, -0.25], [0.9, 0.1]], [])
  return (
    <group position-y={-1.1}>
      {stacks.map(([x, z], si) =>
        Array.from({ length: n }, (_, i) => {
          const idx = si * n + i
          return (
            <Grow key={idx} on={idx / (n * 3) < p} at={[x, i * 0.1, z]} speed={10}>
              <Coin radius={0.4} position={[x + Math.sin(idx * 1.7) * 0.02, i * 0.1, z]} rotation-y={idx} />
            </Grow>
          )
        }),
      )}
    </group>
  )
}

export default function GoalScene({ p, kind }) {
  const wrap = useRef()
  const inView = useInView(wrap)
  return (
    <div ref={wrap} style={{ position: 'absolute', inset: 0 }}>
      <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0.8, 8.2], fov: 36 }} gl={{ antialias: true, alpha: true }}>
        <PauseOffscreen active={inView} />
        <Studio warm="#FFC83D" cool="#A7F0C9" />
        <PresentationControls global={false} cursor snap={false} speed={1.4} polar={[-0.2, 0.3]} azimuth={[-1.2, 1.2]} rotation={[0.12, -0.55, 0]}>
          <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.35}>
            <group position-y={kind === 'cycle' ? -0.2 : 0}>
              {kind === 'cycle' ? <Bike p={p} /> : <CoinTower p={p} />}
            </group>
          </Float>
        </PresentationControls>
        <ContactShadows position={[0, -1.25, 0]} opacity={0.5} scale={8} blur={2.4} far={2.5} resolution={256} color="#000" />
      </Canvas>
    </div>
  )
}
