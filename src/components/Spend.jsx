import { useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { CATS, THING_ICONS, daysOf, fmtDays, rupees, useStore } from '../store.jsx'
import { Icon } from '../icons.jsx'
import { Badge, Btn, Chip, Item, Money, SectionHead, Stagger, spring, useToast } from './ui.jsx'

const QUICK = [20, 50, 100, 200, 500]
const ALLOWANCES = [100, 200, 300, 500, 1000]
const MAX_TILES = 28

function AddMoney() {
  const { dispatch, totals } = useStore()
  const toast = useToast()
  const [mode, setMode] = useState('out')
  const [amount, setAmount] = useState('')
  const [label, setLabel] = useState('')
  const [cat, setCat] = useState('food')
  const n = Math.round(Number(amount))
  const tooMuch = mode === 'out' && n > totals.wallet
  const ok = n > 0 && !tooMuch

  const submit = (e) => {
    e.preventDefault()
    if (!ok) return
    dispatch({ type: 'entry', entry: mode === 'out'
      ? { type: 'out', amount: n, label: label.trim() || CATS[cat].label, cat }
      : { type: 'in', amount: n, label: label.trim() || 'Pocket money' } })
    toast(mode === 'out' ? `Noted: ${rupees(n)} on ${CATS[cat].label.toLowerCase()}` : `${rupees(n)} added to your wallet`, mode === 'out' ? CATS[cat].icon : 'wallet')
    setAmount(''); setLabel('')
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="seg" role="tablist" aria-label="Money in or out">
        {[['out', 'I spent'], ['in', 'I got money']].map(([id, txt]) => (
          <button key={id} type="button" role="tab" aria-selected={mode === id} className={mode === id ? 'on' : ''} onClick={() => setMode(id)}>
            {mode === id && <motion.span layoutId="seg" className="bg" transition={spring} />}
            {txt}
          </button>
        ))}
      </div>

      <label className="label" htmlFor="amt">How much?</label>
      <div className="money-input">
        <span>₹</span>
        <input id="amt" className="input" inputMode="numeric" placeholder="0" value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, '').slice(0, 6))} />
      </div>
      <div className="chips scroll" style={{ marginTop: 10 }}>
        {QUICK.map((q) => <Chip key={q} on={n === q} onClick={() => setAmount(String(q))}>₹{q}</Chip>)}
      </div>

      <AnimatePresence initial={false}>
        {mode === 'out' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <span className="label">On what?</span>
            <div className="cat-grid">
              {Object.entries(CATS).map(([id, c]) => (
                <motion.button type="button" key={id} className={'cat' + (cat === id ? ' on' : '')} onClick={() => setCat(id)} aria-pressed={cat === id}
                  whileTap={{ scale: 0.92 }} transition={spring}>
                  <Badge name={c.icon} color={c.color} size={40} icon={20} />
                  <span>{c.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <label className="label" htmlFor="lbl">{mode === 'out' ? 'What was it?' : 'From where?'} <span className="opt">optional</span></label>
      <input id="lbl" className="input" maxLength={40} placeholder={mode === 'out' ? 'e.g. Chips after school' : 'e.g. Pocket money'} value={label} onChange={(e) => setLabel(e.target.value)} />

      <div className="form-foot">
        <Btn type="submit" disabled={!ok} className={mode === 'in' ? 'leaf wide' : 'wide'}>
          {mode === 'out' ? 'Add spending' : 'Add to wallet'} <Icon name="right" size={20} />
        </Btn>
        {tooMuch && <span className="warn">You only have {rupees(totals.wallet)}</span>}
      </div>
    </form>
  )
}

function AddThing({ onDone }) {
  const { dispatch } = useStore()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [icon, setIcon] = useState(THING_ICONS[0])
  const n = Math.round(Number(price))
  const ok = name.trim() && n > 0
  const add = (e) => {
    e.preventDefault()
    if (!ok) return
    const thing = { id: 't' + Date.now().toString(36), name: name.trim(), price: n, icon }
    dispatch({ type: 'addThing', thing })
    onDone(thing)
  }
  return (
    <motion.form className="add-thing" onSubmit={add} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
      <div className="add-thing-in">
        <span className="label" style={{ marginTop: 0 }}>Measure money in something you love</span>
        <div className="icon-row">
          {THING_ICONS.map((i) => (
            <button type="button" key={i} className={'icon-pick' + (icon === i ? ' on' : '')} onClick={() => setIcon(i)} aria-label={i} aria-pressed={icon === i}>
              <Icon name={i} size={20} />
            </button>
          ))}
        </div>
        <div className="two">
          <input className="input" maxLength={24} placeholder="e.g. vada pavs" aria-label="Thing name (plural)" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="money-input sm">
            <span>₹</span>
            <input className="input" inputMode="numeric" placeholder="price" aria-label="Price of one" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, '').slice(0, 5))} />
          </div>
        </div>
        <Btn type="submit" className="sm ink" disabled={!ok}>Add it</Btn>
      </div>
    </motion.form>
  )
}

function Left() {
  const { state, dispatch, totals } = useStore()
  const [unit, setUnit] = useState('days')
  const [adding, setAdding] = useState(false)
  const [editAllow, setEditAllow] = useState(false)
  const wallet = Math.max(totals.wallet, 0)
  const thing = state.things.find((t) => t.id === unit)
  const isDays = !thing
  const count = isDays ? Math.floor(daysOf(wallet, state.allowance)) : Math.floor(wallet / thing.price)
  const shown = Math.min(count, MAX_TILES)
  const word = isDays ? (count === 1 ? 'day of pocket money' : 'days of pocket money') : thing.name

  return (
    <div className="card left-card">
      <div className="left-head">
        <span className="label" style={{ margin: 0 }}>What's left</span>
        <span className="tiny">{rupees(totals.inn)} in · {rupees(totals.out)} spent · {rupees(totals.saved)} saved</span>
      </div>
      <Money value={wallet} className="big-money" />
      <div className="equals">
        <span>lasts</span>
        <AnimatePresence mode="popLayout">
          <motion.b key={unit + count} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={spring}>{count}</motion.b>
        </AnimatePresence>
        <span>{word}</span>
      </div>
      {isDays && (
        <p className="tiny" style={{ marginTop: 4 }}>
          Based on {rupees(state.allowance)} a week. <button type="button" className="link sm" onClick={() => setEditAllow((v) => !v)}>{editAllow ? 'done' : 'change'}</button>
        </p>
      )}
      <AnimatePresence>
        {isDays && editAllow && (
          <motion.div className="chips" style={{ marginTop: 10, overflow: 'hidden' }} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            {ALLOWANCES.map((a) => <Chip key={a} on={state.allowance === a} onClick={() => dispatch({ type: 'allowance', amount: a })}>₹{a}/wk</Chip>)}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="chips scroll units">
        <Chip on={isDays} onClick={() => setUnit('days')}><Icon name="hourglass" size={18} /> Days</Chip>
        {state.things.map((t) => (
          <Chip key={t.id} on={unit === t.id} onClick={() => setUnit(t.id)}><Icon name={t.icon} size={18} /> {t.name}</Chip>
        ))}
        <Chip on={adding} onClick={() => setAdding((v) => !v)} className="dashed"><Icon name={adding ? 'x' : 'plus'} size={18} /> My own</Chip>
      </div>
      <AnimatePresence>{adding && <AddThing onDone={(t) => { setAdding(false); setUnit(t.id) }} />}</AnimatePresence>

      <motion.div className="tiles" key={unit} initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.03 } } }} aria-hidden="true">
        {Array.from({ length: shown }, (_, i) => (
          <motion.span key={i} className={'tile' + (isDays ? ' day' : '')}
            variants={{ h: { opacity: 0, rotateX: -95, y: -10 }, s: { opacity: 1, rotateX: 0, y: 0, transition: { type: 'spring', stiffness: 260, damping: 18 } } }}
            whileHover={{ y: -4, rotate: (i % 2 ? 4 : -4) }}>
            {isDays ? <><i /><b>{i + 1}</b></> : <Icon name={thing.icon} size={22} weight="duotone" />}
          </motion.span>
        ))}
        {count > shown && <motion.span className="tile more" variants={{ h: { opacity: 0 }, s: { opacity: 1 } }}>+{count - shown}</motion.span>}
        {count === 0 && <span className="tiny">Nothing left to count yet. Add money on the left.</span>}
      </motion.div>
      {thing && !DEFAULT_IDS.has(thing.id) && (
        <button type="button" className="link sm" style={{ marginTop: 8 }} onClick={() => { dispatch({ type: 'removeThing', id: thing.id }); setUnit('days') }}>
          Remove “{thing.name}”
        </button>
      )}
    </div>
  )
}
const DEFAULT_IDS = new Set(['icecream', 'cards', 'movie'])

function WhereItWent() {
  const { state, totals, dispatch } = useStore()
  const cats = Object.entries(totals.byCat).sort((a, b) => b[1] - a[1])
  const top = cats[0]
  const recent = state.entries.filter((e) => e.type !== 'save').slice(0, 6)
  const days = (n) => fmtDays(daysOf(n, state.allowance))

  return (
    <div className="card">
      <span className="label" style={{ marginTop: 0 }}>Where it went</span>
      {totals.out > 0 ? (
        <>
          <h3>Most went on {CATS[top[0]].label.toLowerCase()}</h3>
          <p className="tiny" style={{ fontSize: '1rem' }}>{rupees(top[1])}. That's {days(top[1])} of pocket money.</p>
          <div className="bar" role="img" aria-label={cats.map(([id, v]) => `${CATS[id].label} ${rupees(v)}`).join(', ')}>
            {cats.map(([id, v], i) => (
              <motion.span key={id} style={{ background: CATS[id].color }}
                initial={{ width: 0 }} animate={{ width: `${(v / totals.out) * 100}%` }} transition={{ duration: 1, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }} />
            ))}
          </div>
          <div className="legend">
            {cats.map(([id, v]) => <span key={id}><i style={{ background: CATS[id].color }} />{CATS[id].label} {rupees(v)}</span>)}
          </div>
        </>
      ) : (
        <div className="empty">Nothing spent yet. Your first spend shows up here.</div>
      )}

      <LayoutGroup>
        <ul className="list">
          <AnimatePresence initial={false}>
            {recent.map((e) => {
              const c = e.type === 'in' ? { icon: 'coins', color: '#A7F0C9' } : CATS[e.cat || 'other']
              return (
                <motion.li key={e.id} layout initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={spring}>
                  <Badge name={c.icon} color={c.color} size={42} icon={20} />
                  <span className="what">{e.label}<small>{e.type === 'in' ? 'Money in' : `${days(e.amount)} of pocket money`}</small></span>
                  <span className="amt" style={{ color: e.type === 'in' ? 'var(--leaf)' : undefined }}>{e.type === 'in' ? '+' : '−'}{rupees(e.amount)}</span>
                  <button className="x" aria-label={`Remove ${e.label}`} onClick={() => dispatch({ type: 'removeEntry', id: e.id })}><Icon name="x" size={16} /></button>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      </LayoutGroup>
    </div>
  )
}

export default function Spend() {
  return (
    <section id="spend" className="sec">
      <div className="wrap">
        <SectionHead num="01" q="Where did all my money go?" title={<>Money is time.<br />See how much.</>}>
          Note what you spend. Rezerv shows what's left as days of your own pocket money, or in the things you love, and which spending ate the most.
        </SectionHead>
        <Stagger className="spend-grid">
          <Item><AddMoney /></Item>
          <Item className="stack">
            <Left />
            <WhereItWent />
          </Item>
        </Stagger>
      </div>
    </section>
  )
}
