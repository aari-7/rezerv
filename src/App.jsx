import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useStore } from './store.jsx'
import { ToastProvider } from './components/ui.jsx'
import { Cursor, Footer, Habits, Hero, Loader, Marquee, Nav, Onboarding } from './components/Chrome.jsx'
import Spend from './components/Spend.jsx'
import Save from './components/Save.jsx'
import Ask from './components/Ask.jsx'
import Freeze from './components/Freeze.jsx'

export default function App() {
  const { state } = useStore()
  const [loading, setLoading] = useState(true)
  const [onboard, setOnboard] = useState(false)
  const done = useCallback(() => setLoading(false), [])
  const close = useCallback(() => setOnboard(false), [])

  // First visit: walk the kid through setup right after the intro.
  useEffect(() => {
    if (loading || state.setup) return
    const t = setTimeout(() => setOnboard(true), 1400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  return (
    <ToastProvider>
      <AnimatePresence>{loading && <Loader key="l" onDone={done} />}</AnimatePresence>
      <Cursor />
      <Nav onWallet={() => document.getElementById('spend').scrollIntoView()} />
      <main>
        <Hero onStart={() => setOnboard(true)} />
        <Marquee />
        <Spend />
        <Save />
        <Ask />
        <Freeze />
        <Habits />
      </main>
      <Footer />
      <Onboarding open={onboard} onClose={close} />
    </ToastProvider>
  )
}
