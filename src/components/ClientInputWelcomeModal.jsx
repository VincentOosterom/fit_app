import { useEffect } from 'react'
import styles from './ClientInputWelcomeModal.module.css'

const TIPS = [
  'Plan vaste momenten voor training – dan wordt het een gewoonte.',
  'Weekgemiddelden tellen meer dan één perfecte dag.',
  'Slaap en herstel horen bij je schema; we houden er rekening mee.',
  'Kleine stappen zijn nog steeds vooruitgang.',
  'Vul de evaluatie na elke week in – dan kunnen we je schema beter laten aansluiten.',
]

export default function ClientInputWelcomeModal({ onClose }) {
  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="welcome-modal-title">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 id="welcome-modal-title" className={styles.title}>
          Wat leuk dat je voor ons kiest!
        </h2>
        <p className={styles.intro}>
          We gaan samen een persoonlijk 4-weekse schema voor je opstellen. Eerst even je account en voorkeuren invullen – daarna kunnen we aan de slag.
        </p>

        <div className={styles.setupNote}>
          <span className={styles.setupIcon} aria-hidden>⏳</span>
          <p>We zetten je account voor je in elkaar. Vul onderstaand formulier in; op basis daarvan maken we je schema op maat.</p>
        </div>

        <div className={styles.tipsBlock}>
          <h3 className={styles.tipsTitle}>Tips voor het dagelijks leven &amp; motivatie</h3>
          <ul className={styles.tipsList}>
            {TIPS.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>

        <button type="button" onClick={onClose} className={styles.primaryBtn}>
          Naar het formulier
        </button>
      </div>
    </div>
  )
}
