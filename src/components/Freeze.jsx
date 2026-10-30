import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FREEZE_MS, rupees, useStore } from '../store.jsx'
import { Icon } from '../icons.jsx'
import { Btn, Burst, Item, Money, SectionHead, Stagger, spring, useToast } from './ui.jsx'

const ICONS = ['game', 'sneaker', 'headphones', 'drone', 'phone', 'guitar']
const FLAKES = [[8, 12], [78, 8], [86, 62], [14, 70], [50, 84]]

function useNow() {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

const clock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':')
}

function Cube({ f, now }) {
  const { dispatch } = useStore()
  const toast = useToast()
  const [fire, setFire] = useState(0)
  const left = f.frozenAt + FREEZE_MS - now
  const thawed = left <= 0

  const choose = (choice) => {
    dispatch({ type: 'thaw', id: f.id, choice })
    if (choice === 'skip') { setFire(Date.now()); toast(`${rupees(f.price)} kept in your pocket`, 'piggy') }
    else toast('Sent to the grown-up corner', 'ask')
  }

  return (
    <motion.div layout className={'cube' + (thawed ? ' thawed' : '')}
      initial={{ opacity: 0, scale: 0.6, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ y: -6, rotate: thawed ? 0 : 1.5 }} transition={spring}>
      {!thawed && FLAKES.map(([x, y], i) => (
        <motion.span key={i} className="flake" style={{ left: `${x}%`, top: `${y}%` }} aria-hidden="true"
          animate={{ rotate: 360 }} transition={{ duration: 12 + i * 3, repeat: Infinity, ease: 'linear' }}><Icon name="freeze" size={18 + (i % 3) * 6} weight="duotone" /></motion.span>
      ))}
      <Burst fire={fire} />
      <motion.div className="big" animate={thawed && !f.resolved ? { rotate: [0, -8, 8, -4, 0] } : {}} transition={{ duration: 0.8, repeat: thawed && !f.resolved ? Infinity : 0, repeatDelay: 1.6 }}><Icon name={f.icon} size={44} weight="duotone" /></motion.div>
      <div className="t">{f.item} · {rupees(f.price)}</div>

      {f.resolved ? (
        <div className="done-msg">{f.resolved === 'skip' ? `Melted away. ${rupees(f.price)} saved!` : 'Still wanted. Sent to a grown-up.'}</div>
      ) : thawed ? (
        <>
          <p style={{ fontWeight: 800, marginTop: 8 }}>A day later… do you still want it?</p>
          <div className="acts">
            <Btn type="button" className="sm leaf" onClick={() => choose('skip')}>Nah, skip it</Btn>
            <Btn type="button" className="sm paper" onClick={() => choose('want')}>Yes, ask</Btn>
          </div>
        </>
      ) : (
        <>
          <div className="clock" aria-label="Time left">{clock(left)}</div>
          <div className="acts">
            <button type="button" className="link" onClick={() => dispatch({ type: 'skipTime', id: f.id })}><Icon name="hourglass" size={16} /> Skip the wait (demo)</button>
          </div>
        </>
      )}
    </motion.div>
  )
}

export default function Freeze() {
  const { state, dispatch, totals } = useStore()
  const toast = useToast()
  const now = useNow()
  const [item, setItem] = useState('')
  const [price, setPrice] = useState('')
  const [icon, setIcon] = useState(ICONS[0])
  const n = Math.round(Number(price))
  const ok = item.trim() && n > 0
  const skipped = state.freezer.filter((f) => f.resolved === 'skip').length

  const freeze = (e) => {
    e.preventDefault()
    if (!ok) return
    dispatch({ type: 'freeze', item: { item: item.trim(), price: n, icon } })
    toast('Frozen for 24 hours', 'freeze')
    setItem(''); setPrice('')
  }

  return (
    <section id="freeze" className="sec ice">
      <div className="wrap">
        <SectionHead num="04" q="What if money worked like… a freezer?" title={<>Freeze it.<br />Decide tomorrow.</>}>
          Want something right now? Put it on ice for 24 hours. Most wants melt by tomorrow, and the money stays in your pocket. Our out-of-the-box idea.
        </SectionHead>
        <Stagger className="freeze-grid">
          <Item>
            <form className="card" onSubmit={freeze}>
              <h3>Put a want on ice</h3>
              <span className="label">Pick a picture</span>
              <div className="icon-row">
                {ICONS.map((i) => (
                  <button type="button" key={i} className={'icon-pick' + (icon === i ? ' on' : '')} onClick={() => setIcon(i)} aria-label={i} aria-pressed={icon === i}>
                    <Icon name={i} size={22} />
                  </button>
                ))}
              </div>
              <label className="label" htmlFor="fz-item">What do you want?</label>
              <input id="fz-item" className="input" maxLength={40} placeholder="e.g. New sneakers" value={item} onChange={(e) => setItem(e.target.value)} />
              <label className="label" htmlFor="fz-price">How much?</label>
              <div className="money-input">
                <span>₹</span>
                <input id="fz-price" className="input" inputMode="numeric" placeholder="0" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, '').slice(0, 6))} />
              </div>
              <div className="form-foot"><Btn type="submit" className="wide" disabled={!ok} style={{ background: 'var(--ice-d)' }}><Icon name="freeze" size={20} /> Freeze for 24 hours</Btn></div>
            </form>
            <div className="kept">
              <Money value={totals.notWasted} className="d" />
              <span style={{ fontWeight: 700 }}>kept in your pocket from {skipped} melted {skipped === 1 ? 'want' : 'wants'}</span>
            </div>
          </Item>
          <Item>
            {state.freezer.length ? (
              <motion.div className="cubes" layout>
                <AnimatePresence initial={false}>
                  {state.freezer.map((f) => <Cube key={f.id} f={f} now={now} />)}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="empty" style={{ marginTop: 0, background: '#EAFBFE' }}>Your freezer is empty. Freeze your first want and decide tomorrow.</div>
            )}
          </Item>
        </Stagger>
      </div>
    </section>
  )
}
