import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Float, RoundedBox } from '@react-three/drei'
import { useInView } from 'framer-motion'
import * as THREE from 'three'
import { Coin, PauseOffscreen, Studio } from './shared.jsx'

const CLAY = '#C9552C'
const CREAM = '#F5E6C8'
const SLOT = [0, 0.93, 0.6]

// The gullak: a clay pot turned on a lathe, with painted bands and a coin slot.
function Gullak({ drops, onHit }) {
  const geo = useMemo(() => {
    const pts = [[0.001, -1.05], [0.5, -1.05], [0.62, -0.98], [0.95, -0.7], [1.15, -0.25], [1.19, 0.1], [1.09, 0.5], [0.82, 0.84], [0.46, 1.05], [0.3, 1.13], [0.33, 1.24], [0.36, 1.31], [0.24, 1.37], [0.001, 1.38]]
    const curve = new THREE.SplineCurve(pts.map(([x, y]) => new THREE.Vector2(x, y)))
    const g = new THREE.LatheGeometry(curve.getPoints(90), 110)
    g.computeVertexNormals()
    return g
  }, [])
  const dots = useMemo(() => Array.from({ length: 14 }, (_, i) => (i / 14) * Math.PI * 2), [])
  const [hover, setHover] = useState(false)
  const body = useRef()
  const squash = useRef(0)

  useEffect(() => { squash.current = 1 }, [drops])
  useFrame((_, dt) => {
    squash.current = THREE.MathUtils.damp(squash.current, 0, 5, dt)
    const k = Math.sin(squash.current * Math.PI) * 0.06
    body.current.scale.set(1 + k, 1 - k, 1 + k)
  })

  return (
    <group
      onClick={(e) => { e.stopPropagation(); onHit() }}
      onPointerOver={() => { setHover(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = '' }}
      scale={hover ? 1.04 : 1}>
      <group ref={body}>
        <mesh geometry={geo}>
          <meshPhysicalMaterial color={CLAY} roughness={0.55} clearcoat={0.35} clearcoatRoughness={0.4} />
        </mesh>
        {[[0.1, 1.2], [-0.42, 1.08]].map(([y, r]) => (
          <mesh key={y} position-y={y} rotation-x={Math.PI / 2}>
            <torusGeometry args={[r, 0.035, 12, 100]} />
            <meshStandardMaterial color={CREAM} roughness={0.6} />
          </mesh>
        ))}
        {dots.map((a, i) => (
          <mesh key={a} position={[Math.sin(a) * 1.13, 0.4 + (i % 2) * 0.12, Math.cos(a) * 1.13]}>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshStandardMaterial color={i % 2 ? '#FFC83D' : CREAM} roughness={0.5} />
          </mesh>
        ))}
        <mesh position={SLOT} rotation-x={-Math.PI / 4}>
          <boxGeometry args={[0.6, 0.11, 0.14]} />
          <meshStandardMaterial color="#2A1209" roughness={0.9} />
        </mesh>
      </group>
      <CoinDrops drops={drops} />
    </group>
  )
}

// Coins fall from above into the slot each time `drops` changes.
function CoinDrops({ drops }) {
  const N = 9
  const refs = useRef([])
  const st = useRef(Array.from({ length: N }, () => ({ live: false, t: 0, delay: 0, spin: 0 })))
  useEffect(() => {
    if (!drops) return
    let k = 0
    for (const s of st.current) {
      if (s.live || k >= 3) continue
      Object.assign(s, { live: true, t: 0, delay: k * 0.2, spin: Math.random() * 6 })
      k++
    }
  }, [drops])
  useFrame((_, dt) => {
    st.current.forEach((s, i) => {
      const m = refs.current[i]
      if (!m) return
      if (!s.live) { m.visible = false; return }
      s.t += dt
      const p = Math.min(Math.max(s.t - s.delay, 0) / 0.85, 1)
      m.visible = s.t > s.delay
      const e = p * p * (3 - 2 * p)
      m.position.set(SLOT[0], 3 - (3 - SLOT[1]) * e, SLOT[2] + (1 - e) * 0.15)
      m.rotation.set(Math.PI / 2 - Math.PI / 4 * e, s.spin * (1 - e), 0)
      m.scale.setScalar(p > 0.82 ? Math.max(1 - (p - 0.82) / 0.18, 0.001) : 1)
      if (p >= 1) s.live = false
    })
  })
  return Array.from({ length: N }, (_, i) => (
    <group key={i} ref={(el) => (refs.current[i] = el)} visible={false}>
      <Coin radius={0.26} />
    </group>
  ))
}

function Gift(props) {
  const ribbon = { color: '#FFC83D', roughness: 0.35, metalness: 0.1 }
  return (
    <group {...props}>
      <RoundedBox args={[0.8, 0.62, 0.8]} radius={0.07} smoothness={4}>
        <meshPhysicalMaterial color="#F28A9B" roughness={0.45} clearcoat={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.9, 0.14, 0.9]} radius={0.05} position-y={0.34} smoothness={4}>
        <meshPhysicalMaterial color="#F28A9B" roughness={0.45} clearcoat={0.4} />
      </RoundedBox>
      <mesh position-y={0.05}><boxGeometry args={[0.16, 0.74, 0.82]} /><meshStandardMaterial {...ribbon} /></mesh>
      <mesh position-y={0.05}><boxGeometry args={[0.82, 0.74, 0.16]} /><meshStandardMaterial {...ribbon} /></mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.14, 0.5, 0]} rotation={[0, 0, s * 0.6]}>
          <torusGeometry args={[0.13, 0.045, 12, 32]} />
          <meshStandardMaterial {...ribbon} />
        </mesh>
      ))}
    </group>
  )
}

function Star(props) {
  const geo = useMemo(() => {
    const shape = new THREE.Shape()
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 0.2 : 0.46
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2
      shape[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r)
    }
    shape.closePath()
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 4 })
    g.center()
    return g
  }, [])
  return (
    <mesh geometry={geo} {...props}>
      <meshPhysicalMaterial color="#FFC83D" roughness={0.3} metalness={0.2} clearcoat={0.8} />
    </mesh>
  )
}

function IceCream(props) {
  return (
    <group {...props}>
      <mesh position-y={-0.38} rotation-x={Math.PI}>
        <coneGeometry args={[0.25, 0.72, 28]} />
        <meshStandardMaterial color="#D69047" roughness={0.75} />
      </mesh>
      <mesh position-y={0.06}><sphereGeometry args={[0.29, 32, 32]} /><meshPhysicalMaterial color="#F28A9B" roughness={0.45} clearcoat={0.4} /></mesh>
      <mesh position-y={0.38}><sphereGeometry args={[0.25, 32, 32]} /><meshPhysicalMaterial color="#A7F0C9" roughness={0.45} clearcoat={0.4} /></mesh>
      <mesh position-y={0.66}><sphereGeometry args={[0.07, 16, 16]} /><meshPhysicalMaterial color="#D21F2C" roughness={0.2} clearcoat={1} /></mesh>
    </group>
  )
}

function Note(props) {
  return (
    <group {...props}>
      <RoundedBox args={[1.1, 0.56, 0.03]} radius={0.012} smoothness={3}>
        <meshStandardMaterial color="#86C79A" roughness={0.6} />
      </RoundedBox>
      <mesh position-z={0.02}><circleGeometry args={[0.16, 32]} /><meshStandardMaterial color="#1F7A55" /></mesh>
      <mesh position={[0, 0, 0.018]}><ringGeometry args={[0.2, 0.235, 4, 1, Math.PI / 4]} /><meshStandardMaterial color="#F5EFE1" /></mesh>
    </group>
  )
}

// Tells the page the scene has actually drawn, so the intro can lift.
function ReadySignal({ onReady }) {
  const n = useRef(0)
  useFrame(() => { if (++n.current === 3) onReady?.() })
  return null
}

// Tilts the whole scene toward the pointer.
function Rig({ children }) {
  const g = useRef()
  // shrink the whole arrangement on narrow canvases so nothing gets clipped
  const fit = useThree((s) => Math.min(1, s.viewport.width / 6))
  useFrame(({ pointer, clock }, dt) => {
    g.current.rotation.y = THREE.MathUtils.damp(g.current.rotation.y, pointer.x * 0.45 + Math.sin(clock.elapsedTime * 0.3) * 0.12, 3, dt)
    g.current.rotation.x = THREE.MathUtils.damp(g.current.rotation.x, -pointer.y * 0.18, 3, dt)
  })
  return <group ref={g} scale={fit}>{children}</group>
}

export default function HeroScene({ drops, onHit, onReady }) {
  const wrap = useRef()
  const inView = useInView(wrap)
  return (
    <div ref={wrap} style={{ position: 'absolute', inset: 0 }}>
      <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0.4, 8.6], fov: 34 }} gl={{ antialias: true, alpha: true }}>
        <PauseOffscreen active={inView} />
        <ReadySignal onReady={onReady} />
        <Studio />
        <Rig>
          <Float speed={1.3} rotationIntensity={0.12} floatIntensity={0.5}>
            <group scale={1.12}>
              <Gullak drops={drops} onHit={onHit} />
            </group>
          </Float>
          <Float speed={2} rotationIntensity={1.2} floatIntensity={1.4} position={[-2.35, 1.35, -0.4]}>
            <Gift rotation={[0.3, 0.6, -0.15]} scale={0.95} />
          </Float>
          <Float speed={1.7} rotationIntensity={0.8} floatIntensity={1.2} position={[2.35, 1.0, -0.2]}>
            <IceCream rotation={[0, 0, -0.35]} scale={0.95} />
          </Float>
          <Float speed={2.4} rotationIntensity={2} floatIntensity={1.6} position={[-2.0, -1.05, 0.9]}>
            <Coin radius={0.34} rotation={[1.2, 0, 0.4]} />
          </Float>
          <Float speed={1.5} rotationIntensity={1} floatIntensity={1.3} position={[2.15, -1.15, 0.6]}>
            <Note rotation={[-0.4, -0.5, 0.35]} />
          </Float>
          <Float speed={2.2} rotationIntensity={2} floatIntensity={1.8} position={[1.05, 2.2, -1.2]}>
            <Coin radius={0.22} rotation={[0.4, 0, 1]} />
          </Float>
          <Float speed={1.9} rotationIntensity={1.6} floatIntensity={1.2} position={[-1.2, 2.25, -1.5]}>
            <Star rotation={[0.2, -0.5, 0.3]} scale={0.85} />
          </Float>
        </Rig>
        <ContactShadows position={[0, -1.85, 0]} opacity={0.38} scale={10} blur={2.8} far={3.2} resolution={256} frames={1} color="#5A2A12" />
      </Canvas>
    </div>
  )
}
