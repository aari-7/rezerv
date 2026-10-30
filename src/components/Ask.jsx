import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { daysBack, rupees, useStore } from '../store.jsx'
import { Btn, Burst, Chip, Item, SectionHead, Stagger, spring, useToast } from './ui.jsx'

const WHY = { need: 'I need it', want: 'I really want it', gift: "It's a gift for someone" }
const STAMP = { pending: 'Waiting…', yes: 'Yes!', no: 'Not now', talk: "Let's talk" }
const NOTES = ['Great choice!', 'Use your own savings', "Let's buy it on Saturday", 'Maybe for your birthday']

function Impact({ price }) {
  const { state, totals } = useStore()
  if (!price) return null
  const share = totals.wallet > 0 ? Math.round((price / totals.wallet) * 100) : null
  const days = daysBack(price, state.goal.weekly)
  return (
    <motion.div className="impact" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <span>👛 {share === null ? 'Your wallet is empty right now' : share > 100 ? `That's more than your ${rupees(totals.wallet)} wallet` : `That's ${share}% of your wallet`}</span>
      <span>{state.goal.emoji} Pushes your {state.goal.name.toLowerCase()} back {days} {days === 1 ? 'day' : 'days'}</span>
    </motion.div>
  )
}

function Request({ r, parent, children }) {
  return (
    <motion.div className="req" layout initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={spring}>
      <span className="t">{r.item}</span>
      <span className="p">{rupees(r.price)}</span>
      <span className="meta">{WHY[r.why]}{parent ? '' : ` · asked ${new Date(r.ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}</span>
      {!parent && (
        <AnimatePresence mode="wait">
          <motion.span key={r.status} className={'stamp ' + r.status}
            initial={r.status === 'pending' ? { opacity: 0 } : { scale: 2.4, rotate: -18, opacity: 0 }}
            animate={{ scale: 1, rotate: r.status === 'pending' ? 0 : -4, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
            {STAMP[r.status]}
          </motion.span>
        </AnimatePresence>
      )}
      {r.note && !parent && <span className="note">“{r.note}”</span>}
      {children}
    </motion.div>
  )
}

function KidSide() {
  const { state, dispatch, totals } = useStore()
  const toast = useToast()
  const [item, setItem] = useState('')
  const [price, setPrice] = useState('')
  const [why, setWhy] = useState('want')
  const n = Math.round(Number(price))
  const ok = item.trim() && n > 0

  const send = (e) => {
    e.preventDefault()
    if (!ok) return
    dispatch({ type: 'ask', req: { item: item.trim(), price: n, why } })
    toast('📨 Sent! Hand the phone to a grown-up')
    setItem(''); setPrice('')
  }

  return (
    <div className="card">
      <span className="label" style={{ marginTop: 0 }}>👧 Kid side</span>
      <h3>Can I buy this?</h3>
      <form onSubmit={send}>
        <label className="label" htmlFor="ask-item">What do you want?</label>
        <input id="ask-item" className="input" maxLength={40} placeholder="e.g. Football" value={item} onChange={(e) => setItem(e.target.value)} />
        <label className="label" htmlFor="ask-price">How much is it?</label>
        <div className="money-input">
          <span>₹</span>
          <input id="ask-price" className="input" inputMode="numeric" placeholder="0" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, '').slice(0, 6))} />
        </div>
        <span className="label">Why?</span>
        <div className="chips">
          {Object.entries(WHY).map(([id, t]) => <Chip key={id} on={why === id} onClick={() => setWhy(id)}>{t}</Chip>)}
        </div>
        <Impact price={n} />
        <div style={{ marginTop: 20 }}><Btn type="submit" disabled={!ok}>Ask a grown-up →</Btn></div>
      </form>

      <div className="reqs">
        <AnimatePresence initial={false}>
          {state.requests.map((r) => (
            <Request key={r.id} r={r}>
              {r.status === 'yes' && !r.bought && (
                <div className="acts">
                  <Btn type="button" className="sm leaf" disabled={r.price > totals.wallet} onClick={() => { dispatch({ type: 'bought', id: r.id }); toast(`🛍️ Added ${r.item} to your spending`) }}>I bought it</Btn>
                  {r.price > totals.wallet && <span style={{ fontWeight: 700, alignSelf: 'center' }}>Not enough in your wallet yet</span>}
                </div>
              )}
              {r.bought && <span className="meta">✓ Bought and written down</span>}
              {r.status !== 'pending' && (
                <div className="acts"><button type="button" className="link" onClick={() => dispatch({ type: 'removeRequest', id: r.id })}>Clear</button></div>
              )}
            </Request>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function ParentSide() {
  const { state, dispatch } = useStore()
  const [open, setOpen] = useState(false)
  const [ans, setAns] = useState('')
  const [shake, setShake] = useState(0)
  const [fire, setFire] = useState(0)
  const [notes, setNotes] = useState({})
  const q = useMemo(() => [6 + Math.floor(Math.random() * 4), 6 + Math.floor(Math.random() * 4)], [open])
  const pending = state.requests.filter((r) => r.status === 'pending')

  const unlock = (e) => {
    e.preventDefault()
    if (Number(ans) === q[0] * q[1]) { setOpen(true); setAns('') } else { setShake((s) => s + 1); setAns('') }
  }
  const decide = (r, status) => {
    dispatch({ type: 'decide', id: r.id, status, note: notes[r.id] || '' })
    if (status === 'yes') setFire(Date.now())
  }

  return (
    <div className="card ink parent-card">
      <span className="label" style={{ marginTop: 0, color: 'var(--sun)' }}>🧑 Parent corner</span>
      <h3>Decide together</h3>
      <Burst fire={fire} />
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.form key="gate" className="gate" onSubmit={unlock} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            <motion.div className="lock" animate={shake ? { x: [0, -12, 12, -8, 8, 0] } : {}} key={shake} transition={{ duration: 0.4 }}>🔒</motion.div>
            <p style={{ fontWeight: 700 }}>Grown-ups only. Quick check:</p>
            <p className="d" style={{ fontSize: '2.4rem', marginTop: 8 }}>{q[0]} × {q[1]} = ?</p>
            <div className="gate-row" style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <input className="input" inputMode="numeric" aria-label="Answer" value={ans} onChange={(e) => setAns(e.target.value.replace(/\D/g, '').slice(0, 3))} />
              <Btn type="submit" className="sun">Open</Btn>
            </div>
          </motion.form>
        ) : (
          <motion.div key="open" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <p style={{ fontWeight: 600, opacity: 0.8 }}>
              {pending.length ? `${pending.length} ${pending.length === 1 ? 'request is' : 'requests are'} waiting for you.` : 'No requests waiting. All caught up! ☕'}
            </p>
            <div className="reqs">
              <AnimatePresence initial={false}>
                {pending.map((r) => (
                  <Request key={r.id} r={r} parent>
                    <Impact price={r.price} />
                    <div className="acts">
                      {NOTES.map((t) => (
                        <Chip key={t} on={notes[r.id] === t} className="sm" onClick={() => setNotes((m) => ({ ...m, [r.id]: m[r.id] === t ? '' : t }))}>{t}</Chip>
                      ))}
                    </div>
                    <div className="acts">
                      <Btn type="button" className="sm leaf" onClick={() => decide(r, 'yes')}>✓ Yes</Btn>
                      <Btn type="button" className="sm sun" onClick={() => decide(r, 'talk')}>💬 Let's talk</Btn>
                      <Btn type="button" className="sm" onClick={() => decide(r, 'no')}>Not now</Btn>
                    </div>
                  </Request>
                ))}
              </AnimatePresence>
            </div>
            <button type="button" className="link" style={{ marginTop: 16 }} onClick={() => setOpen(false)}>🔒 Lock and hand back</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Ask() {
  return (
    <section id="ask" className="sec sun">
      <div className="wrap">
        <SectionHead num="03" q="Can I buy this, Mum?" title={<>Ask first.<br />Decide together.</>}>
          The kid asks and says why. The grown-up sees what it costs and how much it delays the goal, then answers with a note.
        </SectionHead>
        <Stagger className="ask-grid">
          <Item><KidSide /></Item>
          <Item><ParentSide /></Item>
        </Stagger>
      </div>
    </section>
  )
}
