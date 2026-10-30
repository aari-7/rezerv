import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'

// Pretend money only. Nothing ever leaves this browser.
const KEY = 'rezerv.v2'
export const HOUR = 3600000
export const FREEZE_MS = 24 * HOUR

export const CATS = {
  food: { label: 'Food', icon: 'food', color: '#D9572B' },
  fun: { label: 'Fun', icon: 'fun', color: '#4FB3E8' },
  stuff: { label: 'Stuff', icon: 'stuff', color: '#FFC83D' },
  gifts: { label: 'Gifts', icon: 'gifts', color: '#F28A9B' },
  other: { label: 'Other', icon: 'other', color: '#A7F0C9' },
}

// Things a kid can measure money in. They can add their own.
export const DEFAULT_THINGS = [
  { id: 'icecream', name: 'ice creams', icon: 'icecream', price: 50 },
  { id: 'cards', name: 'card packs', icon: 'cards', price: 100 },
  { id: 'movie', name: 'movie tickets', icon: 'ticket', price: 250 },
]
export const THING_ICONS = ['icecream', 'cookie', 'pizza', 'popcorn', 'cards', 'book', 'music', 'basketball', 'film', 'game']

export const GOALS = [
  { id: 'cycle', name: 'New cycle', icon: 'cycle', price: 4000 },
  { id: 'football', name: 'Football', icon: 'football', price: 800 },
  { id: 'headphones', name: 'Headphones', icon: 'headphones', price: 1500 },
  { id: 'game', name: 'Video game', icon: 'game', price: 2500 },
]

// Each slice of savings unlocks one more piece of the cycle.
export const BIKE_PARTS = [
  { at: 0.1, label: 'Back wheel' },
  { at: 0.25, label: 'Front wheel' },
  { at: 0.45, label: 'Frame' },
  { at: 0.65, label: 'Pedals + seat' },
  { at: 0.85, label: 'Handlebar' },
  { at: 1, label: 'Bell' },
]

export const BUDDIES = [
  { id: 'cat', color: '#FFC83D' }, { id: 'dog', color: '#D9572B' }, { id: 'rabbit', color: '#F28A9B' },
  { id: 'bird', color: '#4FB3E8' }, { id: 'fish', color: '#A7F0C9' }, { id: 'butterfly', color: '#FFFAF0' },
]
export const buddyOf = (id) => BUDDIES.find((b) => b.id === id) || BUDDIES[0]

const uid = () => Math.random().toString(36).slice(2, 9)

const blank = {
  setup: false,
  buddy: 'cat',
  allowance: 300, // pocket money per week
  things: DEFAULT_THINGS,
  entries: [], // { id, type: 'in' | 'out' | 'save', amount, label, cat, ts }
  goal: { ...GOALS[0], weekly: 200 },
  requests: [], // { id, item, price, why, status: 'pending'|'yes'|'no'|'talk', note, ts, bought }
  freezer: [], // { id, item, icon, price, frozenAt, resolved: null|'want'|'skip' }
  pin: null, // { salt, hash } created by a grown-up
}

function demo() {
  const t = Date.now()
  const d = (days) => t - days * 24 * HOUR
  return {
    ...blank,
    setup: true,
    buddy: 'rabbit',
    entries: [
      { id: uid(), type: 'in', amount: 1000, label: 'Pocket money', ts: d(9) },
      { id: uid(), type: 'in', amount: 500, label: 'Birthday from Nani', ts: d(6) },
      { id: uid(), type: 'out', amount: 60, label: 'Chips after school', cat: 'food', ts: d(5) },
      { id: uid(), type: 'out', amount: 150, label: 'Comic book', cat: 'stuff', ts: d(4) },
      { id: uid(), type: 'out', amount: 300, label: 'Movie with friends', cat: 'fun', ts: d(3) },
      { id: uid(), type: 'out', amount: 120, label: 'Gift for Riya', cat: 'gifts', ts: d(2) },
      { id: uid(), type: 'out', amount: 50, label: 'Vada pav', cat: 'food', ts: d(1) },
      { id: uid(), type: 'save', amount: 400, label: 'Into the gullak', ts: d(1) },
    ],
    requests: [
      { id: uid(), item: 'Cricket bat', price: 700, why: 'need', status: 'pending', note: '', ts: d(0.2), bought: false },
    ],
    freezer: [{ id: uid(), item: 'Toy drone', icon: 'drone', price: 1200, frozenAt: t - 23.9 * HOUR, resolved: null }],
  }
}

function reducer(s, a) {
  switch (a.type) {
    case 'setup':
      return { ...s, setup: true, buddy: a.buddy, allowance: a.allowance, goal: { ...s.goal, ...a.goal },
        entries: a.start > 0 ? [{ id: uid(), type: 'in', amount: a.start, label: 'Starting money', ts: Date.now() }, ...s.entries] : s.entries }
    case 'allowance':
      return { ...s, allowance: a.amount }
    case 'addThing':
      return { ...s, things: [...s.things, { id: uid(), ...a.thing }] }
    case 'removeThing':
      return { ...s, things: s.things.filter((t) => t.id !== a.id) }
    case 'entry':
      return { ...s, entries: [{ id: uid(), ts: Date.now(), ...a.entry }, ...s.entries] }
    case 'removeEntry':
      return { ...s, entries: s.entries.filter((e) => e.id !== a.id) }
    case 'goal':
      return { ...s, goal: { ...s.goal, ...a.goal } }
    case 'ask':
      return { ...s, requests: [{ id: uid(), ts: Date.now(), status: 'pending', note: '', bought: false, ...a.req }, ...s.requests] }
    case 'decide':
      return { ...s, requests: s.requests.map((r) => (r.id === a.id ? { ...r, status: a.status, note: a.note ?? r.note } : r)) }
    case 'bought': {
      const r = s.requests.find((x) => x.id === a.id)
      return { ...s,
        requests: s.requests.map((x) => (x.id === a.id ? { ...x, bought: true } : x)),
        entries: [{ id: uid(), type: 'out', amount: r.price, label: r.item, cat: 'stuff', ts: Date.now() }, ...s.entries] }
    }
    case 'removeRequest':
      return { ...s, requests: s.requests.filter((r) => r.id !== a.id) }
    case 'setPin':
      return { ...s, pin: a.pin }
    case 'resetPin':
      // Wiping the PIN also cancels anything waiting, so a kid can't reset it and approve their own request.
      return { ...s, pin: null,
        requests: s.requests.map((r) => (r.status === 'pending' ? { ...r, status: 'no', note: 'The parent PIN was reset. Please ask again.' } : r)) }
    case 'freeze':
      return { ...s, freezer: [{ id: uid(), frozenAt: Date.now(), resolved: null, ...a.item }, ...s.freezer] }
    case 'skipTime':
      return { ...s, freezer: s.freezer.map((f) => (f.id === a.id ? { ...f, frozenAt: Date.now() - FREEZE_MS } : f)) }
    case 'thaw': {
      const f = s.freezer.find((x) => x.id === a.id)
      const next = { ...s, freezer: s.freezer.map((x) => (x.id === a.id ? { ...x, resolved: a.choice } : x)) }
      if (a.choice === 'want')
        next.requests = [{ id: uid(), item: f.item, price: f.price, why: 'want', status: 'pending', note: '', ts: Date.now(), bought: false }, ...s.requests]
      return next
    }
    case 'demo':
      return { ...demo(), pin: s.pin }
    case 'reset':
      return blank
    default:
      return s
  }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...blank, ...JSON.parse(raw) } : blank
  } catch {
    return blank
  }
}

const Ctx = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* private mode: keep going in memory */ }
  }, [state])

  const totals = useMemo(() => {
    let inn = 0, out = 0, saved = 0
    const byCat = {}
    for (const e of state.entries) {
      if (e.type === 'in') inn += e.amount
      else if (e.type === 'out') { out += e.amount; byCat[e.cat || 'other'] = (byCat[e.cat || 'other'] || 0) + e.amount }
      else if (e.type === 'save') saved += e.amount
    }
    const notWasted = state.freezer.filter((f) => f.resolved === 'skip').reduce((n, f) => n + f.price, 0)
    return { inn, out, saved, wallet: inn - out - saved, byCat, notWasted }
  }, [state.entries, state.freezer])

  return <Ctx.Provider value={{ state, dispatch, totals }}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)

export const rupees = (n) => '₹' + Math.round(n).toLocaleString('en-IN')

// Money measured in time: how many days of pocket money an amount is worth.
export const daysOf = (amount, allowance) => (allowance > 0 ? amount / (allowance / 7) : 0)
export function fmtDays(n) {
  if (n < 1) return 'less than a day'
  const v = n < 10 ? Math.round(n * 2) / 2 : Math.round(n)
  return `${v} ${v === 1 ? 'day' : 'days'}`
}

// How many days a purchase pushes the goal back, at the current saving speed.
export const daysBack = (price, weekly) => (weekly > 0 ? Math.max(1, Math.ceil(price / (weekly / 7))) : Infinity)

// The parent PIN is never stored, only a salted SHA-256 hash of it.
export async function hashPin(pin, salt) {
  const data = new TextEncoder().encode(`${salt}:${pin}`)
  if (crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', data)
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  let h = 0
  for (const b of data) h = (Math.imul(h, 31) + b) | 0
  return String(h)
}
export const newSalt = () => [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, '0')).join('')
