import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../hooks/useProfile'
import { PLAN_NAMES, PLAN_FEATURES, PLAN_FEATURE_LABELS } from '../../lib/planFeatures'
import { COACH_TIER_NAMES, COACH_FEATURES, COACH_FEATURE_LABELS, getCoachClientLimit } from '../../lib/coachSubscription'
import styles from './Coach.module.css'

const PLAN_KEYS = ['starter', 'pro', 'premium']

function getFeaturesForPlan(planKey) {
  return Object.entries(PLAN_FEATURES)
    .filter(([, plans]) => plans.includes(planKey))
    .map(([key]) => ({ key, label: PLAN_FEATURE_LABELS[key] || key }))
}

export default function CoachPlans() {
  const { isCoach, loading: profileLoading, coachSubscription, clients = [] } = useProfile()
  const coachTier = coachSubscription ?? 'starter'
  const clientLimit = getCoachClientLimit(coachTier)
  const [prices, setPrices] = useState({ starter: 595, pro: 799, premium: 1195 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    supabase.rpc('get_coach_plan_prices').then(({ data }) => {
      if (!cancelled && data && typeof data === 'object') setPrices(data)
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (!profileLoading && !isCoach) return <Navigate to="/dashboard" replace />
  if (profileLoading) return <p className={styles.muted}>Laden…</p>

  const tableRows = Object.keys(PLAN_FEATURES).map((featureKey) => ({
    key: featureKey,
    label: PLAN_FEATURE_LABELS[featureKey] || featureKey,
    starter: PLAN_FEATURES[featureKey].includes('starter'),
    pro: PLAN_FEATURES[featureKey].includes('pro'),
    premium: PLAN_FEATURES[featureKey].includes('premium'),
  }))

  return (
    <div className={styles.page}>
      <Link to="/dashboard/coach" className={styles.backLink}>← Dashboard</Link>
      <h1>Plannen &amp; prijzen</h1>
      <p className={styles.intro}>
        Dit zijn de coach-tarieven voor de plannen. Je klanten kunnen inloggen en zien dezelfde omgeving als gewone klanten; zij kiezen of wijzigen hun plan zelf. Deze prijzen zijn door de beheerder ingesteld voor coaches.
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Jouw coach-abonnement</h2>
        <p className={styles.intro}>
          <strong>{COACH_TIER_NAMES[coachTier]}</strong>
          {clientLimit != null ? ` — max ${clientLimit} klanten` : ' — onbeperkt klanten'}
          {clientLimit != null && ` (nu ${clients.length})`}
        </p>
        <ul className={styles.featureList}>
          {Object.entries(COACH_FEATURES)
            .filter(([, tiers]) => tiers.includes(coachTier))
            .map(([key]) => (
              <li key={key}>{COACH_FEATURE_LABELS[key] || key}</li>
            ))}
        </ul>
      </section>

      {loading ? (
        <p className={styles.muted}>Prijzen laden…</p>
      ) : (
        <>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Vergelijk plannen</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
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
                    <td className={styles.cellFeature}>Schema resetten</td>
                    <td className={styles.cellPlan}>—</td>
                    <td className={styles.cellPlan}>1×</td>
                    <td className={styles.cellPlan}>Onbeperkt</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <h2 className={styles.sectionTitle}>Coach-prijzen per maand</h2>
          <div className={styles.planGrid}>
            {PLAN_KEYS.map((key) => {
              const features = getFeaturesForPlan(key)
              return (
                <div key={key} className={styles.planCard}>
                  <h2>{PLAN_NAMES[key] || key}</h2>
                  <p className={styles.price}>€ {((prices[key] ?? 0) / 100).toFixed(2).replace('.', ',')}</p>
                  <p className={styles.perMonth}>per maand</p>
                  <ul className={styles.featureList}>
                    {features.slice(0, 6).map(({ key: fk, label }) => (
                      <li key={fk}>{label}</li>
                    ))}
                    <li>{key === 'starter' ? 'Geen schema reset' : key === 'pro' ? 'Schema reset: 1×' : 'Schema reset: onbeperkt'}</li>
                  </ul>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
