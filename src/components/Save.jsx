import { Suspense, lazy, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { BIKE_PARTS, GOALS, daysBack, rupees, useStore } from '../store.jsx'
import { Icon } from '../icons.jsx'
import { Badge, Burst, Chip, Item, Money, SectionHead, Stagger, spring, useToast } from './ui.jsx'

const GoalScene = lazy(() => import('../three/GoalScene.jsx'))

const TEMPTATIONS = [
  { icon: 'icecream', name: 'an ice cream', price: 50 },
  { icon: 'cookie', name: 'a pack of cookies', price: 40 },
  { icon: 'pizza', name: 'a pizza slice', price: 120 },
  { icon: 'game', name: 'a game skin', price: 400 },
]

const fmtDate = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

export default function Save() {
  const { state, dispatch, totals } = useStore()
  const toast = useToast()
  const { goal } = state
  const stage = useRef()
  // mount the 3D a screen early so its shaders compile before it's on screen
  const near = useInView(stage, { once: true, margin: '900px 0px' })
  const [fire, setFire] = useState(0)
  const [tempt, setTempt] = useState(TEMPTATIONS[0])
  const p = Math.min(Math.max(totals.saved, 0) / goal.price, 1)
  const left = Math.max(goal.price - totals.saved, 0)
  const weeks = goal.weekly > 0 ? Math.ceil(left / goal.weekly) : Infinity
  const eta = new Date(Date.now() + weeks * 7 * 864e5)
  const delay = daysBack(tempt.price, goal.weekly)
  const kind = goal.id === 'cycle' ? 'cycle' : 'coins'
  const nextPart = BIKE_PARTS.find((b) => p < b.at)

  const drop = (n) => {
    const before = p
    dispatch({ type: 'entry', entry: { type: 'save', amount: n, label: 'Into the gullak' } })
    const after = Math.min((totals.saved + n) / goal.price, 1)
    setFire(Date.now())
    const unlocked = kind === 'cycle' && BIKE_PARTS.find((b) => before < b.at && after >= b.at)
    toast(after >= 1 ? `You did it! ${goal.name} unlocked` : unlocked ? `New part unlocked: ${unlocked.label}` : `${rupees(n)} saved`, after >= 1 ? 'bell' : 'piggy')
  }
  const takeOut = () => {
    const n = Math.min(100, totals.saved)
    if (n > 0) dispatch({ type: 'entry', entry: { type: 'save', amount: -n, label: 'Took out of the gullak' } })
  }

  return (
    <section id="save" className="sec forest">
      <div className="wrap">
        <SectionHead num="02" q="How do I save for that cycle?" title={<>Watch your goal<br />build itself.</>}>
          Pick the thing you want. Every rupee you save adds a piece. Before you buy a treat, see how many days it pushes your goal back.
        </SectionHead>

        <Stagger className="save-grid">
          <Item className="stage">
            <div ref={stage} style={{ position: 'absolute', inset: 0 }}>
              {near && <Suspense fallback={null}><GoalScene p={p} kind={kind} /></Suspense>}
            </div>
            <div className="stage-top">
              <div className="pct">{Math.round(p * 100)}<small>%</small></div>
              <div className="marker">
                {p >= 1 ? 'Ring ring! It’s all yours' : kind === 'cycle' ? `next up: ${nextPart.label.toLowerCase()}` : 'every coin stacks up'}
                <span className="drag">drag to spin it</span>
              </div>
            </div>
            {kind === 'cycle' && (
              <div className="parts">
                {BIKE_PARTS.map((b) => (
                  <motion.span key={b.label} className={p >= b.at ? 'done' : ''} layout transition={spring}>
                    {p >= b.at && <Icon name="check" size={13} />}{b.label}
                  </motion.span>
                ))}
              </div>
            )}
            <Burst fire={p >= 1 ? fire : 0} />
          </Item>

          <Item className="card goal-card">
            <div className="goal-top">
              <motion.div key={goal.id} initial={{ rotate: -20, scale: 0.5 }} animate={{ rotate: 0, scale: 1 }} transition={spring}>
                <Badge name={goal.icon} color="var(--sun)" size={64} icon={32} className="lg" />
              </motion.div>
              <div>
                <span className="label" style={{ margin: 0 }}>Saving for</span>
                <h3 style={{ margin: 0 }}>{goal.name}</h3>
              </div>
            </div>
            <div className="chips scroll" style={{ marginTop: 14 }}>
              {GOALS.map((g) => (
                <Chip key={g.id} on={goal.id === g.id} onClick={() => dispatch({ type: 'goal', goal: g })}><Icon name={g.icon} size={18} /> {g.name}</Chip>
              ))}
            </div>

            <div className="meter" role="progressbar" aria-valuenow={Math.round(p * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Goal progress">
              <motion.span initial={false} animate={{ width: `${p * 100}%` }} transition={{ type: 'spring', stiffness: 60, damping: 16 }} />
            </div>
            <div className="meter-row"><Money value={Math.max(totals.saved, 0)} /><span>of {rupees(goal.price)}</span></div>

            <span className="label">Drop into your gullak</span>
            <div className="chips">
              {[20, 50, 100, 200].map((n) => (
                <Chip key={n} disabled={n > totals.wallet || p >= 1} onClick={() => drop(n)}><Icon name="coins" size={18} /> ₹{n}</Chip>
              ))}
            </div>
            {totals.saved > 0 && <button type="button" className="link sm" onClick={takeOut} style={{ marginTop: 6 }}>Take ₹100 back out</button>}
            {totals.wallet < 20 && p < 1 && <p className="tiny" style={{ marginTop: 8 }}>Add pocket money in Spend first.</p>}

            <label className="label" htmlFor="weekly">I can save every week: <b style={{ color: 'var(--clay)' }}>{rupees(goal.weekly)}</b></label>
            <input id="weekly" className="range" type="range" min={20} max={1000} step={10} value={goal.weekly}
              onChange={(e) => dispatch({ type: 'goal', goal: { weekly: Number(e.target.value) } })} />
            <p className="eta">
              {p >= 1 ? <>You've saved enough. Go get it with a grown-up!</> : <>About <b>{weeks} weeks</b> to go. That's around <b>{fmtDate(eta)}</b>.</>}
            </p>

            <div className="tempt">
              <span className="label">Temptation check</span>
              <div className="chips scroll">
                {TEMPTATIONS.map((t) => <Chip key={t.name} on={tempt === t} onClick={() => setTempt(t)}><Icon name={t.icon} size={18} /> ₹{t.price}</Chip>)}
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={tempt.name + goal.weekly + goal.id} className="tempt-out"
                  initial={{ opacity: 0, y: 12, rotateX: -40 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}>
                  <Icon name={tempt.icon} size={28} weight="duotone" />
                  <span>Buying {tempt.name} pushes your {goal.name.toLowerCase()} back <b>{delay} {delay === 1 ? 'day' : 'days'}</b></span>
                </motion.div>
              </AnimatePresence>
            </div>
          </Item>
        </Stagger>
      </div>
    </section>
  )
}
