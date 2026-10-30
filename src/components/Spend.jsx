import { useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { CATS, UNITS, rupees, useStore } from '../store.jsx'
import { Btn, Chip, Item, Money, SectionHead, Stagger, UnitIcon, spring, useToast } from './ui.jsx'

const QUICK = [20, 50, 100, 200, 500]
const MAX_TOKENS = 40

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
    toast(mode === 'out' ? `${CATS[cat].emoji} Noted: ${rupees(n)} spent` : `💰 ${rupees(n)} added to your wallet`)
    setAmount(''); setLabel('')
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="seg" role="tablist" aria-label="Money in or out">
        {[['out', 'I spent money'], ['in', 'I got money']].map(([id, txt]) => (
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
      <div className="chips" style={{ marginTop: 10 }}>
        {QUICK.map((q) => <Chip key={q} on={n === q} onClick={() => setAmount(String(q))}>₹{q}</Chip>)}
      </div>

      <AnimatePresence initial={false}>
        {mode === 'out' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <span className="label">On what?</span>
            <div className="chips">
              {Object.entries(CATS).map(([id, c]) => <Chip key={id} on={cat === id} onClick={() => setCat(id)}>{c.emoji} {c.label}</Chip>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <label className="label" htmlFor="lbl">{mode === 'out' ? 'What was it? (optional)' : 'From where? (optional)'}</label>
      <input id="lbl" className="input" maxLength={40} placeholder={mode === 'out' ? 'e.g. Chips after school' : 'e.g. Pocket money'} value={label} onChange={(e) => setLabel(e.target.value)} />

      <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <Btn type="submit" disabled={!ok} className={mode === 'in' ? 'leaf' : ''}>
          {mode === 'out' ? 'Add spending' : 'Add to wallet'} →
        </Btn>
        {tooMuch && <span style={{ fontWeight: 700, color: 'var(--clay)' }}>You only have {rupees(totals.wallet)}</span>}
      </div>
    </form>
  )
}

function Left() {
  const { totals } = useStore()
  const [uid, setUid] = useState('samosa')
  const unit = UNITS.find((u) => u.id === uid)
  const count = Math.floor(Math.max(totals.wallet, 0) / unit.price)
  const shown = Math.min(count, MAX_TOKENS)

  return (
    <div className="card">
      <div className="left-head">
        <span className="label" style={{ margin: 0 }}>What's left</span>
        <span style={{ fontWeight: 700, fontSize: '.9rem', opacity: 0.7 }}>{rupees(totals.inn)} in · {rupees(totals.out)} spent · {rupees(totals.saved)} saved</span>
      </div>
      <div style={{ marginTop: 10 }}><Money value={Math.max(totals.wallet, 0)} className="big-money" /></div>
      <div className="equals">
        = <AnimatePresence mode="popLayout">
          <motion.b key={uid + count} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={spring}>{count}</motion.b>
        </AnimatePresence>
        {count === 1 ? unit.one : unit.many}
      </div>
      <div className="chips" style={{ marginTop: 14 }}>
        {UNITS.map((u) => <Chip key={u.id} on={u.id === uid} onClick={() => setUid(u.id)}><UnitIcon unit={u} size={22} /> {u.many}</Chip>)}
      </div>
      <motion.div className="tokens" key={uid} initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.025 } } }} aria-hidden="true">
        {Array.from({ length: shown }, (_, i) => (
          <motion.span key={i} className="token" variants={{ h: { opacity: 0, y: -30, rotate: -30, scale: 0.4 }, s: { opacity: 1, y: 0, rotate: (i % 5) * 6 - 12, scale: 1, transition: spring } }}
            whileHover={{ scale: 1.3, rotate: 0, y: -4 }}>
            <UnitIcon unit={unit} size={36} />
          </motion.span>
        ))}
        {count > shown && <motion.span className="token more" variants={{ h: { opacity: 0 }, s: { opacity: 1 } }}>+{count - shown} more</motion.span>}
      </motion.div>
    </div>
  )
}

function WhereItWent() {
  const { state, totals, dispatch } = useStore()
  const cats = Object.entries(totals.byCat).sort((a, b) => b[1] - a[1])
  const top = cats[0]
  const recent = state.entries.filter((e) => e.type !== 'save').slice(0, 6)
  const samosas = (n) => Math.round(n / UNITS[0].price)

  return (
    <div className="card">
      <span className="label" style={{ marginTop: 0 }}>Where it went</span>
      {totals.out > 0 ? (
        <>
          <h3>Most went on {CATS[top[0]].emoji} {CATS[top[0]].label.toLowerCase()}</h3>
          <p style={{ fontWeight: 600, opacity: 0.75 }}>{rupees(top[1])}, that's {samosas(top[1])} samosas' worth.</p>
          <div className="bar" role="img" aria-label={cats.map(([id, v]) => `${CATS[id].label} ${rupees(v)}`).join(', ')}>
            {cats.map(([id, v], i) => (
              <motion.span key={id} style={{ background: CATS[id].color }}
                initial={{ width: 0 }}
                animate={{ width: `${(v / totals.out) * 100}%` }} transition={{ duration: 1, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }} />
            ))}
          </div>
          <div className="legend">
            {cats.map(([id, v]) => <span key={id}><i style={{ background: CATS[id].color }} />{CATS[id].label} {rupees(v)}</span>)}
          </div>
        </>
      ) : (
        <div className="empty">Nothing spent yet. Add your first spend and it shows up here.</div>
      )}

      <LayoutGroup>
        <ul className="list">
          <AnimatePresence initial={false}>
            {recent.map((e) => {
              const c = e.type === 'in' ? { emoji: '💰', color: '#A7F0C9' } : CATS[e.cat || 'other']
              return (
                <motion.li key={e.id} layout initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30, height: 0, padding: 0, margin: 0 }} transition={spring}>
                  <span className="ico" style={{ background: c.color }}>{c.emoji}</span>
                  <span className="what">{e.label}<small>{e.type === 'in' ? 'Money in' : `= ${samosas(e.amount)} samosas`}</small></span>
                  <span className="amt" style={{ color: e.type === 'in' ? 'var(--leaf)' : undefined }}>{e.type === 'in' ? '+' : '−'}{rupees(e.amount)}</span>
                  <button className="x" aria-label={`Remove ${e.label}`} onClick={() => dispatch({ type: 'removeEntry', id: e.id })}>✕</button>
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
        <SectionHead num="01" q="Where did all my money go?" title={<>See it as stuff,<br />not numbers.</>}>
          Write down what you spend. Rezerv shows what's left as samosas, ice creams or movie tickets, and which thing ate most of your money.
        </SectionHead>
        <Stagger className="spend-grid">
          <Item><AddMoney /></Item>
          <Item style={{ display: 'grid', gap: 28 }}>
            <Left />
            <WhereItWent />
          </Item>
        </Stagger>
      </div>
    </section>
  )
}

