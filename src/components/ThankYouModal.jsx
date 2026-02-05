import { useState, useEffect } from 'react'
import styles from './ThankYouModal.module.css'

const LOADING_SECONDS = 15

/**
 * Popup na input-opslaan of na "Schema genereren":
 * Eerst load-spinner + "We maken je nieuwe schema" (15 sec), daarna knop "Je schema is klaar, bekijk hem".
 * @param {boolean} isReady - Optioneel: bij Dashboard pas knop tonen als generatie klaar én 15 sec verstreken.
 */
export default function ThankYouModal({ onClose, isReady = true }) {
  const [fifteenSecElapsed, setFifteenSecElapsed] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setFifteenSecElapsed(true), LOADING_SECONDS * 1000)
    return () => clearTimeout(id)
  }, [])

  const showButton = fifteenSecElapsed && isReady

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="thankyou-title">
      <div className={styles.card}>
        <h2 id="thankyou-title" className={styles.title}>
          {showButton ? 'Klaar!' : 'We maken je nieuwe schema'}
        </h2>
        {showButton ? (
          <p className={styles.readyText}>Je schema staat klaar. Bekijk hem hieronder.</p>
        ) : (
          <div className={styles.loadWrap} aria-hidden="true">
            <div className={styles.spinner} />
            <p className={styles.loadText}>Dit duurt ongeveer {LOADING_SECONDS} seconden…</p>
          </div>
        )}
        {showButton && (
          <button type="button" onClick={onClose} className={styles.closeBtn}>
            Je schema is klaar, bekijk hem
          </button>
        )}
      </div>
    </div>
  )
}
