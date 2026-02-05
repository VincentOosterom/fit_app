import { useState, useEffect } from 'react'
import { useSubscription } from '../hooks/useSubscription'
import { PLAN_NAMES, PLAN_FEATURES, PLAN_FEATURE_LABELS, isUpgrade } from '../lib/planFeatures'
import PlanChangeModal from '../components/PlanChangeModal'
import styles from './PlanChoice.module.css'

const PLAN_KEYS = ['starter', 'pro', 'premium']
const FEATURES_PREVIEW = 4

function getFeaturesForPlan(planKey) {
  return Object.entries(PLAN_FEATURES)
    .filter(([, plans]) => plans.includes(planKey))
    .map(([key]) => ({ key, label: PLAN_FEATURE_LABELS[key] || key }))
}

export default function PlanChoice() {
  const { planType, planName, amountFormatted, setPlan, loading, planPrices } = useSubscription()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [modal, setModal] = useState(null)
  const [confirmPlanKey, setConfirmPlanKey] = useState(null)
  const [expandedPlan, setExpandedPlan] = useState(null)

  const handlePlanClick = (key) => {
    if (key === planType || saving) return
    setConfirmPlanKey(key)
  }

  const handleConfirmCancel = () => setConfirmPlanKey(null)

  const handleConfirmOk = async () => {
    const key = confirmPlanKey
    if (!key || key === planType) {
      setConfirmPlanKey(null)
      return
    }
    const previousPlanKey = planType
    setSaving(true)
    setMessage('')
    setConfirmPlanKey(null)
    const result = await setPlan(key)
    setSaving(false)
    if (result?.error) {
      setMessage(result.error)
    } else {
      setMessage('Plan bijgewerkt. Wijziging geldt voor de volgende factuur.')
      setModal({
        type: isUpgrade(previousPlanKey, key) ? 'upgrade' : 'downgrade',
        previousPlanKey,
        newPlanKey: key,
      })
    }
  }

  const closeModal = () => setModal(null)

  useEffect(() => {
    if (!confirmPlanKey) return
    const onEscape = (e) => { if (e.key === 'Escape') setConfirmPlanKey(null) }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [confirmPlanKey])

  if (loading) return <p className={styles.muted}>Laden…</p>

  const tableRows = Object.keys(PLAN_FEATURES).map((featureKey) => ({
    key: featureKey,
    label: PLAN_FEATURE_LABELS[featureKey] || featureKey,
    starter: PLAN_FEATURES[featureKey].includes('starter'),
    pro: PLAN_FEATURES[featureKey].includes('pro'),
    premium: PLAN_FEATURES[featureKey].includes('premium'),
  }))

  return (
    <div className={styles.page}>
      <h1>Plan & factuur</h1>
      <p className={styles.intro}>
        Je huidige plan: <strong>{planName}</strong> — {amountFormatted}/maand. Bij <strong>Starter</strong> heb je al een volledig voedingsschema (alle weken, voorbeeldmaaltijden). Pro en Premium voegen o.a. PDF-export, boodschappenlijst en meer support toe. Kies hieronder een ander plan; de wijziging geldt voor de volgende factuur.
      </p>

      <section className={styles.tableSection}>
        <h2 className={styles.tableTitle}>Vergelijk de plannen</h2>
        <div className={styles.tableWrap}>
          <table className={styles.comparisonTable}>
            <thead>
              <tr>
                <th className={styles.cellFeature}>Functie</th>
                <th className={styles.cellPlan}>Starter</th>
                <th className={styles.cellPlan}>Pro</th>
                <th className={styles.cellPlan}>Premium</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.key}>
                  <td className={styles.cellFeature}>{row.label}</td>
                  <td className={styles.cellPlan}>{row.starter ? '✓' : '—'}</td>
                  <td className={styles.cellPlan}>{row.pro ? '✓' : '—'}</td>
                  <td className={styles.cellPlan}>{row.premium ? '✓' : '—'}</td>
                </tr>
              ))}
              <tr>
                <td className={styles.cellFeature}>Schema resetten en opnieuw beginnen</td>
                <td className={styles.cellPlan}>—</td>
                <td className={styles.cellPlan}>1×</td>
                <td className={styles.cellPlan}>Onbeperkt</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <h2 className={styles.chooseTitle}>Kies je plan</h2>
      <div className={styles.planGrid}>
        {PLAN_KEYS.map((key) => {
          const isCurrent = planType === key
          const features = getFeaturesForPlan(key)
          const resetLabel = key === 'starter' ? 'Geen schema reset' : key === 'pro' ? 'Schema reset: 1×' : 'Schema reset: onbeperkt'
          const allItems = [...features.map((f) => f.label), resetLabel]
          const isExpanded = expandedPlan === key
          const previewItems = allItems.slice(0, FEATURES_PREVIEW)
          const moreCount = allItems.length - FEATURES_PREVIEW
          const showMoreBtn = moreCount > 0 && !isExpanded
          return (
            <div key={key} className={isCurrent ? styles.planCardCurrent : styles.planCard}>
              {isCurrent && <span className={styles.badge}>Huidige plan</span>}
              <div className={styles.planCardInner}>
                <h2>{PLAN_NAMES[key] || key}</h2>
                <p className={styles.price}>€ {((planPrices[key] ?? 0) / 100).toFixed(2).replace('.', ',')}</p>
                <p className={styles.perMonth}>per maand</p>
                <ul className={styles.featureList}>
                  {(isExpanded ? allItems : previewItems).map((label, i) => (
                    <li key={i}>{label}</li>
                  ))}
                </ul>
                {showMoreBtn && (
                  <button
                    type="button"
                    onClick={() => setExpandedPlan(key)}
                    className={styles.seeMoreBtn}
                  >
                    Zie wat je krijgt ({moreCount} meer)
                  </button>
                )}
                {isExpanded && moreCount > 0 && (
                  <button type="button" onClick={() => setExpandedPlan(null)} className={styles.seeLessBtn}>
                    Minder tonen
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => handlePlanClick(key)}
                disabled={saving || isCurrent}
                className={isCurrent ? styles.btnCurrent : styles.btnSelect}
              >
                {isCurrent ? 'Huidige plan' : 'Kies dit plan'}
              </button>
            </div>
          )
        })}
      </div>
      {message && <p className={styles.message}>{message}</p>}

      {confirmPlanKey && (
        <div className={styles.confirmOverlay} onClick={handleConfirmCancel} role="dialog" aria-modal="true" aria-labelledby="confirm-plan-title">
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h2 id="confirm-plan-title" className={styles.confirmTitle}>Weet je het zeker?</h2>
            <p className={styles.confirmText}>
              Je wijzigt naar <strong>{PLAN_NAMES[confirmPlanKey] || confirmPlanKey}</strong>. De wijziging geldt voor je volgende factuur.
            </p>
            <div className={styles.confirmActions}>
              <button type="button" onClick={handleConfirmCancel} className={styles.confirmBtnSecondary}>
                Annuleren
              </button>
              <button type="button" onClick={handleConfirmOk} disabled={saving} className={styles.confirmBtnPrimary}>
                {saving ? 'Bezig…' : 'Ja, wijzig plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <PlanChangeModal
          type={modal.type}
          previousPlanKey={modal.previousPlanKey}
          newPlanKey={modal.newPlanKey}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
