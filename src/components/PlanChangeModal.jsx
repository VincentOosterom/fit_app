import { useEffect } from 'react'
import { PLAN_NAMES, getFeaturesLost } from '../lib/planFeatures'
import Confetti from './Confetti'
import styles from './PlanChangeModal.module.css'

export default function PlanChangeModal({ type, previousPlanKey, newPlanKey, onClose }) {
  const isUpgrade = type === 'upgrade'
  const newPlanName = PLAN_NAMES[newPlanKey] || newPlanKey
  const lostFeatures = !isUpgrade && previousPlanKey && newPlanKey ? getFeaturesLost(previousPlanKey, newPlanKey) : []

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="plan-modal-title">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {isUpgrade && <Confetti />}
        <h2 id="plan-modal-title" className={styles.title}>
          {isUpgrade ? 'Gefeliciteerd met je upgrade!' : 'Helaas dat je voor een lager plan kiest'}
        </h2>
        {isUpgrade ? (
          <>
            <p className={styles.text}>
              Je bent nu op <strong>{newPlanName}</strong>. Geniet van de extra mogelijkheden; de wijziging geldt voor je volgende factuur.
            </p>
            <p className={styles.sub}>Bedankt voor je vertrouwen.</p>
          </>
        ) : (
          <>
            <p className={styles.text}>
              Je hebt gekozen voor <strong>{newPlanName}</strong>. Vanaf je volgende factuur heb je geen toegang meer tot het volgende:
            </p>
            <ul className={styles.lostList}>
              {lostFeatures.map((label, i) => (
                <li key={i}>{label}</li>
              ))}
            </ul>
            <p className={styles.sub}>Je kunt altijd weer upgraden als je deze functies weer wilt.</p>
          </>
        )}
        <button type="button" onClick={onClose} className={styles.closeBtn}>
          Sluiten
        </button>
      </div>
    </div>
  )
}
