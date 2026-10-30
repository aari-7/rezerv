import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { AnimatePresence, motion, useSpring, useTransform } from 'framer-motion'
import { rupees } from '../store.jsx'
import { Icon } from '../icons.jsx'

export const ease = [0.22, 1, 0.36, 1]
export const spring = { type: 'spring', stiffness: 380, damping: 26 }

// Scroll-triggered fade-up, used for single blocks.
export function Reveal({ children, delay = 0, y = 40, className, style }) {
  return (
    <motion.div className={className} style={style}
      initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.8, ease, delay }}>
      {children}
    </motion.div>
  )
}

// Staggered reveal: wrap children in <Item> to have them arrive one after another.
const group = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } }
export const itemV = { hidden: { opacity: 0, y: 32, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease } } }

export function Stagger({ children, className, amount = 0.08 }) {
  return (
    <motion.div className={className} variants={group} initial="hidden" whileInView="show" viewport={{ once: true, amount }}>
      {children}
    </motion.div>
  )
}
export const Item = ({ children, className, ...rest }) => <motion.div className={className} variants={itemV} {...rest}>{children}</motion.div>

// Tactile buttons: lift on hover, squash on tap.
export const Btn = ({ className = '', children, ...rest }) => (
  <motion.button className={'btn ' + className} whileHover={{ y: -3 }} whileTap={{ y: 4, scale: 0.98 }} transition={spring} {...rest}>
    {children}
  </motion.button>
)
export const Chip = ({ on, className = '', children, ...rest }) => (
  <motion.button type="button" className={'chip ' + (on ? 'on ' : '') + className} aria-pressed={!!on}
    whileHover={{ y: -2 }} whileTap={{ scale: 0.94 }} transition={spring} {...rest}>
    {children}
  </motion.button>
)

export function Money({ value, className }) {
  const mv = useSpring(value, { stiffness: 90, damping: 20 })
  const text = useTransform(mv, (v) => rupees(v))
  useEffect(() => { mv.set(value) }, [mv, value])
  return <motion.span className={className}>{text}</motion.span>
}

// Icon sitting in a coloured, outlined tile.
export const Badge = ({ name, color = 'var(--sun)', size = 44, icon = 22, className = '' }) => (
  <span className={'badge ' + className} style={{ background: color, width: size, height: size }}>
    <Icon name={name} size={icon} weight="bold" />
  </span>
)

const COLORS = ['#D9572B', '#FFC83D', '#1F7A55', '#4FB3E8', '#F28A9B', '#A7F0C9']
export function Burst({ fire }) {
  return (
    <AnimatePresence>
      {fire ? (
        <div className="burst" key={fire}>
          {Array.from({ length: 22 }, (_, i) => {
            const a = (i / 22) * Math.PI * 2 + Math.random() * 0.3
            const d = 90 + Math.random() * 120
            return (
              <motion.i key={i} style={{ background: COLORS[i % COLORS.length] }}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
                animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d + 60, opacity: 0, rotate: 360 * (Math.random() - 0.5) * 2, scale: 1 }}
                transition={{ duration: 1.1 + Math.random() * 0.5, ease: [0.15, 0.8, 0.3, 1] }} />
            )
          })}
        </div>
      ) : null}
    </AnimatePresence>
  )
}

const ToastCtx = createContext(() => {})
export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null)
  const show = useCallback((text, icon = 'check') => setMsg({ text, icon, k: Date.now() }), [])
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), 2600)
    return () => clearTimeout(t)
  }, [msg])
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <AnimatePresence>
        {msg && (
          <motion.div key={msg.k} className="toast" role="status"
            initial={{ y: 80, x: '-50%', opacity: 0 }} animate={{ y: 0, x: '-50%', opacity: 1 }} exit={{ y: 80, x: '-50%', opacity: 0 }} transition={spring}>
            <span className="toast-ico"><Icon name={msg.icon} size={16} weight="bold" /></span>{msg.text}
          </motion.div>
        )}
      </AnimatePresence>
    </ToastCtx.Provider>
  )
}
export const useToast = () => useContext(ToastCtx)

export function SectionHead({ num, q, title, children }) {
  return (
    <div className="sec-head">
      <motion.div className="sec-num" initial={{ opacity: 0, x: -40, rotate: -8 }} whileInView={{ opacity: 1, x: 0, rotate: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.9, ease }}>{num}</motion.div>
      <Stagger amount={0.4}>
        <Item><span className="q marker">“{q}”</span></Item>
        <Item><h2>{title}</h2></Item>
      </Stagger>
      {children && <Reveal className="sub" delay={0.2} y={20}><p>{children}</p></Reveal>}
    </div>
  )
}
