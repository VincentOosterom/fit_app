import { useState } from 'react'
import styles from './Tooltip.module.css'

export default function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false)

  if (!text) return children

  return (
    <span className={styles.wrap}>
      {children}
      <span
        className={styles.trigger}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        aria-label={text}
      >
        <span className={styles.icon}>i</span>
        {visible && <span className={styles.bubble}>{text}</span>}
      </span>
    </span>
  )
}
