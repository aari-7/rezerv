import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '../icons.jsx'
import { spring } from './ui.jsx'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back']

// A phone-style PIN pad. Calls onComplete once `length` digits are entered.
// Bump `errorKey` to shake and clear it.
export default function PinPad({ length = 4, onComplete, errorKey = 0, disabled = false, label }) {
  const [pin, setPin] = useState('')

  useEffect(() => { setPin('') }, [errorKey])

  const press = (k) => {
    if (disabled) return
    if (k === 'back') return setPin(pin.slice(0, -1))
    if (!/\d/.test(k) || pin.length >= length) return
    const next = pin + k
    setPin(next)
    if (next.length === length) setTimeout(() => onComplete(next), 120)
  }

  return (
    <div className="pin" tabIndex={0} aria-label={label}
      onKeyDown={(e) => {
        if (/^\d$/.test(e.key)) press(e.key)
        else if (e.key === 'Backspace') press('back')
      }}>
      <motion.div className="pin-dots" key={errorKey} animate={errorKey ? { x: [0, -14, 14, -10, 10, -4, 0] } : {}} transition={{ duration: 0.45 }}
        role="status" aria-label={`${pin.length} of ${length} digits entered`}>
        {Array.from({ length }, (_, i) => (
          <motion.i key={i} className={i < pin.length ? 'on' : ''} animate={{ scale: i < pin.length ? [1, 1.35, 1] : 1 }} transition={{ duration: 0.25 }} />
        ))}
      </motion.div>
      <div className="pin-keys">
        {KEYS.map((k, i) => k === '' ? <span key={i} /> : (
          <motion.button key={i} type="button" className={'pin-key' + (k === 'back' ? ' ghost' : '')} disabled={disabled}
            onClick={() => press(k)} whileTap={{ scale: 0.88 }} transition={spring} aria-label={k === 'back' ? 'Delete' : k}>
            {k === 'back' ? <Icon name="back" size={24} /> : k}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
