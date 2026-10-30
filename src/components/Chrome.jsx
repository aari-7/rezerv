import { Suspense, lazy, useEffect, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { BUDDIES, GOALS, buddyOf, rupees, useStore } from '../store.jsx'
import { Icon } from '../icons.jsx'
import { Badge, Btn, Chip, Item, Money, Reveal, Stagger, ease, spring } from './ui.jsx'

const HeroScene = lazy(() => import('../three/HeroScene.jsx'))

export function Loader() {
  return (
    <motion.div className="loader" exit={{ y: '-101%' }} transition={{ duration: 0.7, ease }}>
      <div className="d" aria-label="Rezerv">
        {'REZERV'.split('').map((c, i) => (
          <motion.span key={i} initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ delay: 0.05 + i * 0.06, duration: 0.55, ease }}>{c}</motion.span>
        ))}
      </div>
      <motion.div className="sub marker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>pretend money · real habits</motion.div>
    </motion.div>
  )
}

export function Cursor() {
  const x = useMotionValue(-100), y = useMotionValue(-100)
  const sx = useSpring(x, { stiffness: 600, damping: 40 }), sy = useSpring(y, { stiffness: 600, damping: 40 })
  const [big, setBig] = useState(false)
  useEffect(() => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const move = (e) => { x.set(e.clientX); y.set(e.clientY); setBig(!!e.target.closest?.('button, a, input, canvas, label')) }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [x, y])
  return <motion.div className="cursor" style={{ x: sx, y: sy }} animate={{ scale: big ? 2.6 : 1, opacity: big ? 0.55 : 1 }} transition={spring} />
}

const TICK = ['No real money, ever', 'No sign-in', 'Nothing leaves this phone', 'Ages 8 to 18', '₹300 = one week of pocket money']
const Dot = () => <i className="dot" aria-hidden="true" />

export function Nav({ ready }) {
  const { state, totals } = useStore()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  const buddy = buddyOf(state.buddy)
  return (
    <>
      <motion.nav className="nav" initial={{ y: '-100%' }} animate={ready ? { y: 0 } : {}} transition={{ delay: 0.15, duration: 0.6, ease }}>
        <a href="#top" className="nav-logo"><Badge name={buddy.id} color={buddy.color} size={34} icon={18} />Rezerv</a>
        <div className="nav-mid" aria-hidden="true">
          <motion.div className="ticker" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}>
            {[...TICK, ...TICK].map((t, i) => <span key={i}><Dot />{t}</span>)}
          </motion.div>
        </div>
        <div className="nav-links">
          <a href="#spend">Spend</a><a href="#save">Save</a><a href="#ask">Ask</a><a href="#freeze">Freeze</a>
        </div>
        <a href="#spend" className="wallet-chip" aria-label={`Wallet: ${rupees(totals.wallet)}`}>
          <Icon name="wallet" size={22} /><Money value={Math.max(totals.wallet, 0)} className="d" />
        </a>
      </motion.nav>
      <motion.div className="progress" style={{ scaleX }} />
    </>
  )
}

const TABS = [['spend', 'Spend', 'wallet'], ['save', 'Save', 'piggy'], ['ask', 'Ask', 'ask'], ['freeze', 'Freeze', 'freeze']]

// Phone-only tab bar that tracks which section you're in.
export function TabBar({ ready }) {
  const [active, setActive] = useState(null)
  useEffect(() => {
    const els = TABS.map(([id]) => document.getElementById(id)).filter(Boolean)
    const io = new IntersectionObserver((list) => {
      for (const e of list) if (e.isIntersecting) setActive(e.target.id)
    }, { rootMargin: '-45% 0px -50% 0px' })
    els.forEach((el) => io.observe(el))
    const top = () => window.scrollY < window.innerHeight * 0.5 && setActive(null)
    window.addEventListener('scroll', top, { passive: true })
    return () => { io.disconnect(); window.removeEventListener('scroll', top) }
  }, [])
  return (
    <motion.nav className="tabbar" aria-label="Sections" initial={{ y: 120 }} animate={ready ? { y: 0 } : {}} transition={{ delay: 0.5, ...spring }}>
      {TABS.map(([id, label, icon]) => (
        <a key={id} href={`#${id}`} className={active === id ? 'on' : ''} aria-current={active === id ? 'true' : undefined}>
          {active === id && <motion.span layoutId="tab" className="tab-bg" transition={spring} />}
          <Icon name={icon} size={22} weight={active === id ? 'fill' : 'bold'} />
          <span>{label}</span>
        </a>
      ))}
    </motion.nav>
  )
}

export function Hero({ ready, onSceneReady, onStart }) {
  const { state, dispatch } = useStore()
  const [drops, setDrops] = useState(0)
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 800], [0, 160])
  const fade = useTransform(scrollY, [0, 600], [1, 0.25])

  useEffect(() => {
    if (!ready) return
    const id = setInterval(() => setDrops((d) => d + 1), 4500)
    return () => clearInterval(id)
  }, [ready])

  const lines = [['Pocket', 'money'], ['you', 'can'], ['see.']]
  let k = 0
  const show = (d, extra) => ({ initial: extra?.from, animate: ready ? extra?.to : extra?.from, transition: { delay: d, ...(extra?.t || { duration: 0.8, ease }) } })
  const sticker = (d, rot) => show(d, { from: { opacity: 0, scale: 0.5, rotate: rot * 4 }, to: { opacity: 1, scale: 1, rotate: rot }, t: spring })

  return (
    <header id="top" className="hero">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <motion.div className="chips" {...show(0.25, { from: { opacity: 0, y: 20 }, to: { opacity: 1, y: 0 } })}>
            <span className="chip solid">For kids 8–18</span>
            <span className="chip">Pretend money only</span>
          </motion.div>
          <h1>
            {lines.map((line, li) => (
              <span className="line" key={li}>
                {line.map((w) => (
                  <motion.span key={w} {...show(0.2 + k++ * 0.07, { from: { y: '105%', rotate: 6 }, to: { y: 0, rotate: 0 } })} style={{ marginRight: '.22em' }}>
                    {w === 'see.' ? <span className="pill">see.</span> : w}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>
          <motion.div {...show(0.6, { from: { opacity: 0, y: 24 }, to: { opacity: 1, y: 0 } })}>
            <p className="lead">Rezerv turns rupees into <b>days of your own pocket money</b>, builds your goal in 3D as you save, and lets a grown-up say yes before you buy.</p>
            <div className="hero-ctas">
              <Btn onClick={() => (state.setup ? document.getElementById('spend').scrollIntoView() : onStart())}>
                {state.setup ? 'Open my wallet' : 'Start my gullak'} <Icon name={state.setup ? 'down' : 'right'} size={20} />
              </Btn>
              <Btn className="paper" onClick={() => { dispatch({ type: 'demo' }); document.getElementById('spend').scrollIntoView() }}>See a demo</Btn>
            </div>
            <div className="trust">
              <span><Icon name="lock" size={18} /> No sign-in</span><span><Icon name="shield" size={18} /> No real money</span><span><Icon name="phone" size={18} /> Stays on this device</span>
            </div>
          </motion.div>
        </div>

        <motion.div className="hero-canvas" style={{ y, opacity: fade }}>
          <Suspense fallback={null}><HeroScene drops={drops} onHit={() => setDrops((d) => d + 1)} onReady={onSceneReady} /></Suspense>
          <motion.div className="sticker" style={{ top: '8%', left: '0%' }} {...sticker(0.7, -5)}>
            <Badge name="hourglass" color="var(--sun)" size={30} icon={16} /> ₹500 = 12 days of pocket money
          </motion.div>
          <motion.div className="sticker alt" style={{ top: '24%', right: '0%' }} {...sticker(0.85, 5)}>
            <Badge name="cycle" color="var(--mint)" size={30} icon={16} /> Cycle in 18 weeks
          </motion.div>
          <motion.div className="sticker" style={{ bottom: '15%', left: '2%' }} {...sticker(1, -3)}>
            <Badge name="check" color="var(--leaf)" size={30} icon={16} className="light" /> Mum said yes
          </motion.div>
          <motion.div className="hint marker" {...show(1.3, { from: { opacity: 0 }, to: { opacity: 0.85 } })}>tap the gullak</motion.div>
        </motion.div>
      </div>
    </header>
  )
}

const MARQ = [['₹300', 'one week of pocket money'], ['one ice cream', 'one day later'], ['ask first', 'buy happy'], ['sleep on it', 'spend smarter']]
export function Marquee() {
  return (
    <div className="marquee" aria-hidden="true">
      <motion.div className="row" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}>
        {[...MARQ, ...MARQ].map(([a, b], i) => <span key={i}>{a} <i>=</i> {b} <Dot /></span>)}
      </motion.div>
    </div>
  )
}

const HABITS = [
  ['eye', 'var(--sky)', 'Write it down', 'Money you track is money you control. Note every spend, even ₹10.'],
  ['piggy', 'var(--pink)', 'Pay yourself first', 'Drop coins in your gullak before you buy treats, not after.'],
  ['freeze', 'var(--ice)', 'Sleep on it', 'If you still want it tomorrow, it’s probably worth it.'],
  ['family', 'var(--sun)', 'Ask together', 'Big buys go better when your family decides with you.'],
]
export function Habits() {
  return (
    <section className="sec">
      <div className="wrap">
        <Reveal><h2 className="habits-title">Four habits.<br /><span>For life.</span></h2></Reveal>
        <Stagger className="habits">
          {HABITS.map(([icon, color, t, d], i) => (
            <Item key={t} className="habit" whileHover={{ y: -8, rotate: i % 2 ? 1 : -1 }} transition={spring}>
              <Badge name={icon} color={color} size={56} icon={28} />
              <h3>{t}</h3><p>{d}</p>
              <span className="habit-n">0{i + 1}</span>
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
          <ul className="promise">
            <li><Icon name="shield" size={18} /> Made-up amounts only. No bank, UPI, card or wallet.</li>
            <li><Icon name="eye" size={18} /> No real names, photos or schools. Your buddy is an animal.</li>
            <li><Icon name="phone" size={18} /> Everything is saved only in this browser.</li>
            <li className="marker">Built for the Children's Day Hackathon 2026</li>
          </ul>
          <div className="foot-acts">
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
  const [buddy, setBuddy] = useState(BUDDIES[0].id)
  const [start, setStart] = useState(500)
  const [allowance, setAllowance] = useState(300)
  const [goal, setGoal] = useState(GOALS[0])

  const finish = () => {
    dispatch({ type: 'setup', buddy, start, allowance, goal })
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
    { title: 'Pick your buddy', sub: 'No real names here. Your buddy stands in for you.',
      body: (
        <div className="buddies">
          {BUDDIES.map((b) => (
            <motion.button key={b.id} className={buddy === b.id ? 'on' : ''} onClick={() => setBuddy(b.id)} style={{ background: b.color }}
              whileHover={{ scale: 1.06, rotate: -4 }} whileTap={{ scale: 0.9 }} aria-label={b.id} aria-pressed={buddy === b.id}>
              <Icon name={b.id} size={34} weight={buddy === b.id ? 'fill' : 'bold'} />
            </motion.button>
          ))}
        </div>
      ) },
    { title: 'Your money', sub: 'Pretend amounts are fine. Guess if you need to.',
      body: (
        <>
          <span className="label">I have right now</span>
          <div className="chips">{[0, 100, 250, 500, 1000, 2000].map((n) => <Chip key={n} on={start === n} onClick={() => setStart(n)}>₹{n}</Chip>)}</div>
          <span className="label">I get every week</span>
          <div className="chips">{[100, 200, 300, 500, 1000].map((n) => <Chip key={n} on={allowance === n} onClick={() => setAllowance(n)}>₹{n}</Chip>)}</div>
        </>
      ) },
    { title: 'Saving for…', sub: 'You can change it any time.',
      body: (
        <div className="goal-pick">
          {GOALS.map((g) => (
            <motion.button key={g.id} className={goal.id === g.id ? 'on' : ''} onClick={() => setGoal(g)} whileTap={{ scale: 0.95 }} aria-pressed={goal.id === g.id}>
              <Icon name={g.icon} size={30} weight="duotone" /><b>{g.name}</b><span>{rupees(g.price)}</span>
            </motion.button>
          ))}
        </div>
      ) },
  ]
  const s = steps[step]

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="sheet" role="dialog" aria-modal="true" aria-labelledby="ob-title" onClick={(e) => e.stopPropagation()}
            initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 140, opacity: 0 }} transition={spring}>
            <div className="dots">{steps.map((_, i) => <i key={i} className={i <= step ? 'on' : ''} />)}</div>
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.3, ease }}>
                <h2 id="ob-title">{s.title}</h2>
                <p className="sheet-sub">{s.sub}</p>
                {s.body}
              </motion.div>
            </AnimatePresence>
            <div className="sheet-acts">
              {step ? <button className="link" onClick={() => setStep(step - 1)}><Icon name="left" size={18} /> Back</button> : <button className="link" onClick={onClose}>Not now</button>}
              <Btn onClick={() => (step < steps.length - 1 ? setStep(step + 1) : finish())}>{step < steps.length - 1 ? 'Next' : "Let's go"} <Icon name="right" size={20} /></Btn>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
