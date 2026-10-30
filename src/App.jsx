import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useStore } from './store.jsx'
import { ToastProvider } from './components/ui.jsx'
import { Cursor, Footer, Habits, Hero, Loader, Marquee, Nav, Onboarding, TabBar } from './components/Chrome.jsx'
import Spend from './components/Spend.jsx'
import Save from './components/Save.jsx'
import Ask from './components/Ask.jsx'
import Freeze from './components/Freeze.jsx'

const MIN_LOADER = 700
const MAX_LOADER = 3500

export default function App() {
  const { state } = useStore()
  const [sceneReady, setSceneReady] = useState(false)
  const [minDone, setMinDone] = useState(false)
  const [ready, setReady] = useState(false)
  const [onboard, setOnboard] = useState(false)
  const close = useCallback(() => setOnboard(false), [])
  const onSceneReady = useCallback(() => setSceneReady(true), [])

  // Keep the intro up until the 3D has drawn its first frames, so shader
  // compilation happens behind it instead of stuttering the page.
  useEffect(() => {
    const a = setTimeout(() => setMinDone(true), MIN_LOADER)
    const b = setTimeout(() => setReady(true), MAX_LOADER)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [])
  useEffect(() => { if (minDone && sceneReady) setReady(true) }, [minDone, sceneReady])

  // Warm up the second 3D scene once the page is idle.
  useEffect(() => {
    if (!ready) return
    const id = (window.requestIdleCallback || setTimeout)(() => import('./three/GoalScene.jsx'))
    return () => (window.cancelIdleCallback || clearTimeout)(id)
  }, [ready])

  // First visit: walk the kid through setup right after the intro.
  useEffect(() => {
    if (!ready || state.setup) return
    const t = setTimeout(() => setOnboard(true), 1300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return (
    <ToastProvider>
      <AnimatePresence>{!ready && <Loader key="l" />}</AnimatePresence>
      <Cursor />
      <Nav ready={ready} />
      <main>
        <Hero ready={ready} onSceneReady={onSceneReady} onStart={() => setOnboard(true)} />
        <Marquee />
        <Spend />
        <Save />
        <Ask />
        <Freeze />
        <Habits />
      </main>
      <Footer />
      <TabBar ready={ready} />
      <Onboarding open={onboard} onClose={close} />
    </ToastProvider>
  )
}
