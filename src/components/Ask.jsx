import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { daysBack, daysOf, fmtDays, hashPin, newSalt, rupees, useStore } from '../store.jsx'
import { Icon } from '../icons.jsx'
import PinPad from './PinPad.jsx'
import { Btn, Burst, Chip, Item, SectionHead, Stagger, spring, useToast } from './ui.jsx'

const WHY = { need: 'I need it', want: 'I really want it', gift: "It's a gift" }
const STAMP = { pending: 'Waiting for a grown-up', yes: 'Yes!', no: 'Not now', talk: "Let's talk" }
const NOTES = ['Great choice', 'Use your own savings', "Let's buy it on Saturday", 'Maybe for your birthday']
const MAX_TRIES = 5
const LOCKOUT_MS = 30000
const IDLE_MS = 120000

function Impact({ price }) {
  const { state, totals } = useStore()
  if (!price) return null
  const share = totals.wallet > 0 ? Math.round((price / totals.wallet) * 100) : null
  const days = daysBack(price, state.goal.weekly)
  return (
    <motion.div className="impact" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <span><Icon name="wallet" size={18} /> {share === null ? 'The wallet is empty right now' : share > 100 ? `More than the whole ${rupees(totals.wallet)} wallet` : `${share}% of the wallet`}</span>
      <span><Icon name="hourglass" size={18} /> {fmtDays(daysOf(price, state.allowance))} of pocket money</span>
      <span><Icon name={state.goal.icon} size={18} /> Pushes the {state.goal.name.toLowerCase()} back {days} {days === 1 ? 'day' : 'days'}</span>
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
    toast('Sent. Hand the phone to a grown-up', 'ask')
    setItem(''); setPrice('')
  }

  return (
    <div className="card">
      <span className="label" style={{ marginTop: 0 }}>Kid side</span>
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
        <div className="form-foot"><Btn type="submit" className="wide" disabled={!ok}>Ask a grown-up <Icon name="right" size={20} /></Btn></div>
      </form>

      <div className="reqs">
        <AnimatePresence initial={false}>
          {state.requests.map((r) => (
            <Request key={r.id} r={r}>
              {r.status === 'yes' && !r.bought && (
                <div className="acts">
                  <Btn type="button" className="sm leaf" disabled={r.price > totals.wallet} onClick={() => { dispatch({ type: 'bought', id: r.id }); toast(`${r.item} added to your spending`, 'stuff') }}>I bought it</Btn>
                  {r.price > totals.wallet && <span className="warn">Not enough in your wallet yet</span>}
                </div>
              )}
              {r.bought && <span className="meta"><Icon name="check" size={14} /> Bought and written down</span>}
              {r.status !== 'pending' && (
                <div className="acts"><button type="button" className="link sm" onClick={() => dispatch({ type: 'removeRequest', id: r.id })}>Clear</button></div>
              )}
            </Request>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Parent corner: create a PIN once, then unlock with it.
function ParentSide() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(null) // first entry while creating a PIN
  const [err, setErr] = useState(0)
  const [msg, setMsg] = useState('')
  const [tries, setTries] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [forgot, setForgot] = useState(false)
  const [fire, setFire] = useState(0)
  const [notes, setNotes] = useState({})
  const idle = useRef()
  const pending = state.requests.filter((r) => r.status === 'pending')
  const locked = lockedUntil > now

  useEffect(() => {
    if (!locked) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [locked])

  const lock = useCallback(() => { setOpen(false); setMsg('') }, [])
  const poke = useCallback(() => {
    clearTimeout(idle.current)
    idle.current = setTimeout(() => { lock(); toast('Parent corner locked itself', 'lock') }, IDLE_MS)
  }, [lock, toast])
  useEffect(() => () => clearTimeout(idle.current), [])
  useEffect(() => { if (open) poke(); else clearTimeout(idle.current) }, [open, poke])

  const fail = (text) => { setErr((e) => e + 1); setMsg(text) }

  const create = async (pin) => {
    if (!draft) { setDraft(pin); setMsg(''); return }
    if (pin !== draft) { setDraft(null); return fail("Those didn't match. Start again.") }
    const salt = newSalt()
    dispatch({ type: 'setPin', pin: { salt, hash: await hashPin(pin, salt) } })
    setDraft(null); setOpen(true); setMsg('')
    toast('Parent PIN saved', 'shield')
  }

  const unlock = async (pin) => {
    if ((await hashPin(pin, state.pin.salt)) === state.pin.hash) {
      setTries(0); setOpen(true); setMsg(''); return
    }
    const t = tries + 1
    setTries(t)
    if (t >= MAX_TRIES) {
      setLockedUntil(Date.now() + LOCKOUT_MS); setNow(Date.now()); setTries(0)
      fail('Too many tries. Wait 30 seconds.')
    } else fail(`Wrong PIN. ${MAX_TRIES - t} ${MAX_TRIES - t === 1 ? 'try' : 'tries'} left.`)
  }

  const decide = (r, status) => {
    poke()
    dispatch({ type: 'decide', id: r.id, status, note: notes[r.id] || '' })
    if (status === 'yes') setFire(Date.now())
  }

  const view = !state.pin ? 'create' : open ? 'open' : forgot ? 'forgot' : 'locked'

  return (
    <div className="card ink parent-card" onPointerDown={open ? poke : undefined}>
      <div className="parent-head">
        <div>
          <span className="label" style={{ marginTop: 0, color: 'var(--sun)' }}>Grown-up corner</span>
          <h3>Decide together</h3>
        </div>
        <span className={'lock-badge' + (open ? ' open' : '')}><Icon name={open ? 'unlock' : 'lock'} size={20} /></span>
      </div>
      <Burst fire={fire} />
      <AnimatePresence mode="wait">
        {view === 'create' && (
          <motion.div key={'create' + !!draft} className="gate" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <p className="gate-title">{draft ? 'Type it once more' : 'Grown-up: create a Parent PIN'}</p>
            <p className="gate-sub">{draft ? 'Just to be sure.' : 'Pick 4 digits only you know. Kids, look away!'}</p>
            <PinPad onComplete={create} errorKey={err} label="Create parent PIN" />
            {msg && <p className="gate-msg">{msg}</p>}
          </motion.div>
        )}
        {view === 'locked' && (
          <motion.div key="locked" className="gate" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <p className="gate-title">{pending.length ? `${pending.length} ${pending.length === 1 ? 'request' : 'requests'} waiting` : 'Grown-ups only'}</p>
            <p className="gate-sub">Enter the Parent PIN</p>
            <PinPad onComplete={unlock} errorKey={err} disabled={locked} label="Enter parent PIN" />
            {locked ? <p className="gate-msg">Locked. Try again in {Math.ceil((lockedUntil - now) / 1000)}s.</p> : msg && <p className="gate-msg">{msg}</p>}
            <button type="button" className="link sm" onClick={() => setForgot(true)}>Forgot the PIN?</button>
          </motion.div>
        )}
        {view === 'forgot' && (
          <motion.div key="forgot" className="gate" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <p className="gate-title">Reset the Parent PIN?</p>
            <p className="gate-sub">A grown-up will make a new one. Anything still waiting gets cancelled, so nobody can approve their own request.</p>
            <div className="acts center">
              <Btn type="button" className="sm sun" onClick={() => { dispatch({ type: 'resetPin' }); setForgot(false); setMsg('') }}>Reset PIN</Btn>
              <Btn type="button" className="sm paper" onClick={() => setForgot(false)}>Cancel</Btn>
            </div>
          </motion.div>
        )}
        {view === 'open' && (
          <motion.div key="open" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <p className="tiny" style={{ color: 'var(--paper)' }}>
              {pending.length ? `${pending.length} ${pending.length === 1 ? 'request is' : 'requests are'} waiting for you.` : 'Nothing waiting. All caught up.'}
            </p>
            <div className="reqs">
              <AnimatePresence initial={false}>
                {pending.map((r) => (
                  <Request key={r.id} r={r} parent>
                    <Impact price={r.price} />
                    <span className="label" style={{ margin: '6px 0 0', gridColumn: '1 / -1' }}>Add a note</span>
                    <div className="acts">
                      {NOTES.map((t) => (
                        <Chip key={t} on={notes[r.id] === t} className="sm" onClick={() => setNotes((m) => ({ ...m, [r.id]: m[r.id] === t ? '' : t }))}>{t}</Chip>
                      ))}
                    </div>
                    <div className="acts decide">
                      <Btn type="button" className="sm leaf" onClick={() => decide(r, 'yes')}><Icon name="check" size={18} /> Yes</Btn>
                      <Btn type="button" className="sm sun" onClick={() => decide(r, 'talk')}>Let's talk</Btn>
                      <Btn type="button" className="sm" onClick={() => decide(r, 'no')}>Not now</Btn>
                    </div>
                  </Request>
                ))}
              </AnimatePresence>
            </div>
            <Btn type="button" className="sm paper" style={{ marginTop: 18 }} onClick={lock}><Icon name="lock" size={18} /> Lock and hand back</Btn>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Ask() {
  const { state } = useStore()
  const [side, setSide] = useState('kid')
  const waiting = state.requests.filter((r) => r.status === 'pending').length
  return (
    <section id="ask" className="sec sun">
      <div className="wrap">
        <SectionHead num="03" q="Can I buy this, Mum?" title={<>Ask first.<br />Decide together.</>}>
          The kid asks and says why. A grown-up unlocks their corner with a private PIN, sees what it really costs, and answers with a note.
        </SectionHead>
        <div className="seg side-switch" role="tablist" aria-label="Show kid or grown-up side">
          {[['kid', 'Kid'], ['parent', `Grown-up${waiting ? ` (${waiting})` : ''}`]].map(([id, t]) => (
            <button key={id} type="button" role="tab" aria-selected={side === id} className={side === id ? 'on' : ''} onClick={() => setSide(id)}>
              {side === id && <motion.span layoutId="side" className="bg" transition={spring} />}{t}
            </button>
          ))}
        </div>
        <Stagger className="ask-grid" >
          <Item className={'ask-col' + (side === 'kid' ? ' show' : '')}><KidSide /></Item>
          <Item className={'ask-col' + (side === 'parent' ? ' show' : '')}><ParentSide /></Item>
        </Stagger>
      </div>
    </section>
  )
}
