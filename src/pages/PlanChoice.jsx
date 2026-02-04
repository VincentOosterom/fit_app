import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSubscription } from '../hooks/useSubscription'
import { PLAN_AMOUNTS, PLAN_NAMES } from '../lib/planFeatures'
import styles from './PlanChoice.module.css'

const PLANS = [
  { type: 'starter', name: 'Starter', amount: 795, features: ['4-weekse schema\'s', 'Wekelijkse evaluatie', 'Vervolg schema', 'Basis e-mail support'] },
  { type: 'pro', name: 'Pro', amount: 999, features: ['Alles van Starter', 'Voorbeeldmaaltijden + macro\'s', 'Concrete sessies met oefeningen', 'Supplementadvies', 'Export PDF', 'Support 48u', 'Progressie-overzicht'] },
  { type: 'premium', name: 'Premium', amount: 1495, features: ['Alles van Pro', 'Check-in week 2 & 4', 'Schema bijgesteld op evaluatie', 'Event-programma\'s', 'Prioriteit support 24u'] },
]

export default function PlanChoice() {
  const { planType, setPlan, loading, planPrices } = useSubscription()
  const prices = planPrices || PLAN_AMOUNTS
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleSelect = async (type) => {
    if (type === planType) return
    setSaving(true)
    setMessage('')
    const { error } = await setPlan(type)
    setSaving(false)
    if (error) setMessage(error)
    else setMessage(`Plan gewijzigd naar ${PLAN_NAMES[type]}.`)
  }

  if (loading) return <p className={styles.muted}>Laden…</p>

  return (
    <div className={styles.page}>
      <p className={styles.back}><Link to="/dashboard">← Terug naar dashboard</Link></p>
      <h1>Mijn plan</h1>
      <p className={styles.intro}>
        Kies het plan dat bij je past. Je kunt op elk moment upgraden of downgraden. Volgende factuur wordt aangepast.
      </p>

      {message && <p className={message.startsWith('Plan') ? styles.success : styles.error}>{message}</p>}

      <div className={styles.grid}>
        {PLANS.map((p) => (
          <div
            key={p.type}
            className={styles.card + (p.type === planType ? ' ' + styles.cardActive : '')}
          >
            {p.type === 'pro' && <span className={styles.badge}>Meest gekozen</span>}
            <h2>{p.name}</h2>
            <p className={styles.price}>
              € {((prices[p.type] ?? PLAN_AMOUNTS[p.type]) / 100).toFixed(2).replace('.', ',')} <span>/maand</span>
            </p>
            <ul className={styles.features}>
              {p.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <button
              type="button"
              className={p.type === planType ? styles.buttonCurrent : styles.button}
              disabled={p.type === planType || saving}
              onClick={() => handleSelect(p.type)}
            >
              {p.type === planType ? 'Huidige plan' : saving ? 'Bezig…' : `Kies ${p.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
