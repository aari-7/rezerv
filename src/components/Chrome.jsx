import { Suspense, lazy, useEffect, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { BUDDIES, GOALS, rupees, useStore } from '../store.jsx'
import { Btn, Chip, Item, Money, Reveal, Samosa, Stagger, ease, spring } from './ui.jsx'

const HeroScene = lazy(() => import('../three/HeroScene.jsx'))

export function Loader({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 1500); return () => clearTimeout(t) }, [onDone])
  return (
    <motion.div className="loader" exit={{ y: '-101%' }} transition={{ duration: 0.8, ease }}>
      <div className="d" aria-label="Rezerv">
        {'REZERV'.split('').map((c, i) => (
          <motion.span key={i} initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ delay: 0.1 + i * 0.07, duration: 0.6, ease }}>{c}</motion.span>
        ))}
      </div>
      <motion.div className="sub marker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>pretend money · real habits</motion.div>
    </motion.div>
  )
}

export function Cursor() {
  const x = useMotionValue(-100), y = useMotionValue(-100)
  const sx = useSpring(x, { stiffness: 600, damping: 40 }), sy = useSpring(y, { stiffness: 600, damping: 40 })
  const [big, setBig] = useState(false)
  useEffect(() => {
    const move = (e) => { x.set(e.clientX); y.set(e.clientY); setBig(!!e.target.closest?.('button, a, input, canvas, label')) }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [x, y])
  return <motion.div className="cursor" style={{ x: sx, y: sy }} animate={{ scale: big ? 2.6 : 1, opacity: big ? 0.55 : 1 }} transition={spring} />
}

const TICK = ['No real money, ever', 'No sign-in', 'Nothing leaves this phone', 'Ages 8 to 18', '₹500 = 25 samosas']

export function Nav({ onWallet }) {
  const { state, totals } = useStore()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  return (
    <>
      <motion.nav className="nav" initial={{ y: '-100%' }} animate={{ y: 0 }} transition={{ delay: 1.7, duration: 0.6, ease }}>
        <a href="#top" className="nav-logo"><i>{state.buddy}</i>Rezerv</a>
        <div className="nav-mid" aria-hidden="true">
          <motion.div className="ticker" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}>
            {[...TICK, ...TICK].map((t, i) => <span key={i}>✦ {t}</span>)}
          </motion.div>
        </div>
        <div className="nav-links">
          <a href="#spend">Spend</a><a href="#save">Save</a><a href="#ask">Ask</a><a href="#freeze">Freeze</a>
        </div>
        <motion.button className="wallet-chip" onClick={onWallet} whileTap={{ scale: 0.95 }} aria-label={`Wallet: ${rupees(totals.wallet)}`}>
          <span>👛</span><Money value={Math.max(totals.wallet, 0)} className="d" />
        </motion.button>
      </motion.nav>
      <motion.div className="progress" style={{ scaleX }} />
    </>
  )
}

export function Hero({ onStart }) {
  const { state, dispatch } = useStore()
  const [drops, setDrops] = useState(0)
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 800], [0, 180])
  const rot = useTransform(scrollY, [0, 800], [0, -6])
  const fade = useTransform(scrollY, [0, 600], [1, 0.2])

  useEffect(() => { const id = setInterval(() => setDrops((d) => d + 1), 4500); return () => clearInterval(id) }, [])

  const words = [['Pocket', 'money'], ['you', 'can'], ['see.']]
  let k = 0
  return (
    <header id="top" className="hero">
      <div className="wrap hero-grid">
        <div>
          <motion.div className="chips" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8, duration: 0.6, ease }}>
            <span className="chip" style={{ background: 'var(--sun)' }}>For kids 8–18</span>
            <span className="chip">₹ pretend money only</span>
          </motion.div>
          <h1 style={{ marginTop: 22 }}>
            {words.map((line, li) => (
              <span className="line" key={li}>
                {line.map((w) => {
                  const d = 1.75 + k++ * 0.08
                  const inner = w === 'see.' ? <span className="pill">see.</span> : w
                  return (
                    <motion.span key={w} initial={{ y: '105%', rotate: 6 }} animate={{ y: 0, rotate: 0 }} transition={{ delay: d, duration: 0.8, ease }} style={{ marginRight: '.22em' }}>
                      {inner}
                    </motion.span>
                  )
                })}
              </span>
            ))}
          </h1>
          <Reveal delay={2.2} y={24}>
            <p className="lead">Rezerv shows your money as <b>samosas, not numbers</b>. It helps you save for that cycle, and lets you ask Mum or Dad before you buy anything.</p>
            <div className="hero-ctas">
              <Btn onClick={() => (state.setup ? document.getElementById('spend').scrollIntoView() : onStart())}>{state.setup ? 'Open my wallet ↓' : 'Start my gullak →'}</Btn>
              <Btn className="paper" onClick={() => { dispatch({ type: 'demo' }); document.getElementById('spend').scrollIntoView() }}>See a demo</Btn>
            </div>
            <div className="trust">
              <span>🔒 No sign-in</span><span>📵 No real money</span><span>🏠 Stays on this device</span>
            </div>
          </Reveal>
        </div>

        <motion.div className="hero-canvas" style={{ y, rotate: rot, opacity: fade }}>
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.6, duration: 1.2, ease }} style={{ position: 'absolute', inset: 0 }}>
            <Suspense fallback={null}><HeroScene drops={drops} onHit={() => setDrops((d) => d + 1)} /></Suspense>
          </motion.div>
          <motion.div className="sticker" style={{ top: '9%', left: '2%' }} initial={{ opacity: 0, scale: 0.5, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: -6 }} transition={{ delay: 2.4, ...spring }}>
            <Samosa size={26} /> ₹500 = 25 samosas
          </motion.div>
          <motion.div className="sticker alt" style={{ top: '20%', right: '0%', background: 'var(--mint)' }} initial={{ opacity: 0, scale: 0.5, rotate: 20 }} animate={{ opacity: 1, scale: 1, rotate: 5 }} transition={{ delay: 2.55, ...spring }}>
            🚲 cycle in 18 weeks
          </motion.div>
          <motion.div className="sticker" style={{ bottom: '16%', left: '0%', background: 'var(--sun)' }} initial={{ opacity: 0, scale: 0.5, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: -3 }} transition={{ delay: 2.7, ...spring }}>
            ✅ Mum said yes!
          </motion.div>
          <motion.div className="hint marker" initial={{ opacity: 0 }} animate={{ opacity: 0.85 }} transition={{ delay: 3 }}>tap the gullak ↑</motion.div>
        </motion.div>
      </div>
    </header>
  )
}

const MARQ = [['₹500', '25 samosas'], ['₹500', '10 ice creams'], ['1 ice cream', '1 day later'], ['ask first', 'buy happy']]
export function Marquee() {
  return (
    <div className="marquee" aria-hidden="true">
      <motion.div className="row" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}>
        {[...MARQ, ...MARQ].map(([a, b], i) => <span key={i}>{a} <i>=</i> {b} <i>✦</i></span>)}
      </motion.div>
    </div>
  )
}

const HABITS = [
  ['👀', 'Write it down', 'Money you track is money you control. Note every spend, even ₹10.'],
  ['🐷', 'Pay yourself first', 'Drop coins in your gullak before you buy treats, not after.'],
  ['🧊', 'Sleep on it', 'If you still want it tomorrow, it’s probably worth it.'],
  ['🤝', 'Ask together', 'Big buys go better when your family decides with you.'],
]
export function Habits() {
  return (
    <section className="sec">
      <div className="wrap">
        <Reveal><h2 style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)', marginBottom: 40 }}>Four habits.<br /><span style={{ color: 'var(--clay)' }}>For life.</span></h2></Reveal>
        <Stagger className="habits">
          {HABITS.map(([e, t, d]) => (
            <Item key={t} className="habit" whileHover={{ y: -8, rotate: -1 }} transition={spring}>
              <div className="n">{e}</div><h3>{t}</h3><p>{d}</p>
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

export function Footer() {
  const { dispatch } = useStore()
  const [sure, setSure] = useState(false)
  return (
    <footer className="foot">
      <div className="wrap">
        <motion.div className="mark" initial={{ y: 120, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1, ease }}>Rezerv.</motion.div>
        <div className="foot-row">
          <div className="promise">
            <span>✦ Made-up amounts only. No bank, UPI, card or wallet.</span>
            <span>✦ No real names, photos or schools. Your buddy is an animal.</span>
            <span>✦ Everything is saved only in this browser.</span>
            <span className="marker" style={{ fontSize: '1.3rem', color: 'var(--sun)', marginTop: 8 }}>Built for the Children's Day Hackathon 2026</span>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Btn className="sun sm" onClick={() => { dispatch({ type: 'demo' }); window.scrollTo({ top: 0 }) }}>Load demo</Btn>
            <Btn className="paper sm" onClick={() => { if (sure) { dispatch({ type: 'reset' }); setSure(false); window.scrollTo({ top: 0 }) } else setSure(true) }}>
              {sure ? 'Tap again to erase' : 'Start over'}
            </Btn>
          </div>
        </div>
      </div>
    </footer>
  )
}

export function Onboarding({ open, onClose }) {
  const { dispatch } = useStore()
  const [step, setStep] = useState(0)
  const [buddy, setBuddy] = useState(BUDDIES[0])
  const [start, setStart] = useState(500)
  const [goal, setGoal] = useState(GOALS[0])

  const finish = () => {
    dispatch({ type: 'setup', buddy, start, goal })
    onClose()
    setTimeout(() => document.getElementById('spend')?.scrollIntoView(), 300)
  }
  useEffect(() => { if (open) setStep(0) }, [open])
  useEffect(() => {
    if (!open) return
    const esc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [open, onClose])

  const steps = [
    { title: 'Pick your buddy', sub: 'No real names here. Your buddy is you!',
      body: <div className="buddies">{BUDDIES.map((b) => <motion.button key={b} className={buddy === b ? 'on' : ''} onClick={() => setBuddy(b)} whileHover={{ scale: 1.08, rotate: -4 }} whileTap={{ scale: 0.9 }} aria-label={`Buddy ${b}`}>{b}</motion.button>)}</div> },
    { title: 'How much do you have?', sub: 'Pretend money is fine. Guess if you need to.',
      body: <div className="chips" style={{ margin: '18px 0' }}>{[100, 250, 500, 1000, 2000].map((n) => <Chip key={n} on={start === n} onClick={() => setStart(n)}>₹{n}</Chip>)}<Chip on={start === 0} onClick={() => setStart(0)}>₹0 for now</Chip></div> },
    { title: 'What are you saving for?', sub: 'You can change it any time.',
      body: <div className="chips" style={{ margin: '18px 0' }}>{GOALS.map((g) => <Chip key={g.id} on={goal.id === g.id} onClick={() => setGoal(g)}>{g.emoji} {g.name} · {rupees(g.price)}</Chip>)}</div> },
  ]
  const s = steps[step]

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="sheet" role="dialog" aria-modal="true" aria-labelledby="ob-title" onClick={(e) => e.stopPropagation()}
            initial={{ y: 80, scale: 0.92, rotate: -2 }} animate={{ y: 0, scale: 1, rotate: 0 }} exit={{ y: 60, opacity: 0 }} transition={spring}>
            <div className="dots">{steps.map((_, i) => <i key={i} className={i <= step ? 'on' : ''} />)}</div>
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.3, ease }}>
                <h2 id="ob-title">{s.title}</h2>
                <p style={{ fontWeight: 600 }}>{s.sub}</p>
                {s.body}
              </motion.div>
            </AnimatePresence>
            <div className="sheet-acts">
              {step ? <button className="link" onClick={() => setStep(step - 1)}>← Back</button> : <button className="link" onClick={onClose}>Not now</button>}
              <Btn onClick={() => (step < steps.length - 1 ? setStep(step + 1) : finish())}>{step < steps.length - 1 ? 'Next →' : `Let's go ${buddy}`}</Btn>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
