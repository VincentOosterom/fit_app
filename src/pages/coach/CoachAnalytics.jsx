import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import { hasCoachFeature, getCoachUpgradeMessage } from '../../lib/coachSubscription'
import styles from './Coach.module.css'

export default function CoachAnalytics() {
  const { user } = useAuth()
  const { isCoach, clients, loading, coachSubscription } = useProfile()
  const tier = coachSubscription ?? 'starter'
  const canAccess = hasCoachFeature(tier, 'analytics')
  const [stats, setStats] = useState({ plans: 0, reviews: 0, messages: 0 })

  useEffect(() => {
    if (!isCoach || !user?.id) {
      setStats({ plans: 0, reviews: 0, messages: 0 })
      return
    }
    const ids = (clients ?? []).map((c) => c.id)
    Promise.all([
      ids.length ? supabase.from('nutrition_plans').select('id').in('user_id', ids) : Promise.resolve({ data: [] }),
      ids.length ? supabase.from('training_plans').select('id').in('user_id', ids) : Promise.resolve({ data: [] }),
      ids.length ? supabase.from('week_reviews').select('id').in('user_id', ids) : Promise.resolve({ data: [] }),
      supabase.from('coach_messages').select('id').eq('coach_id', user.id),
    ]).then(([n, t, r, m]) => {
      const nutritionCount = (n.data ?? []).length
      const trainingCount = (t.data ?? []).length
      setStats({
        plans: nutritionCount + trainingCount,
        reviews: (r.data ?? []).length,
        messages: (m.data ?? []).length,
      })
    }).catch(() => {})
  }, [isCoach, clients])

  if (!loading && !isCoach) return <Navigate to="/dashboard" replace />
  if (loading) return <p className={styles.muted}>Laden…</p>
  if (!canAccess) {
    return (
      <div className={styles.page}>
        <h1>Analytics</h1>
        <p className={styles.limitReached}>{getCoachUpgradeMessage('analytics')}</p>
        <Link to="/dashboard/coach/plannen" className={styles.backLink}>← Plannen &amp; prijzen</Link>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <h1>Analytics</h1>
      <p className={styles.intro}>
        Overzicht en inzichten over je klanten, schema&apos;s en engagement.
      </p>
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{clients?.length ?? 0}</div>
          <div className={styles.statLabel}>Klanten</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.plans}</div>
          <div className={styles.statLabel}>Schema&apos;s totaal</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.reviews}</div>
          <div className={styles.statLabel}>Weekevaluaties</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.messages}</div>
          <div className={styles.statLabel}>Berichten</div>
        </div>
      </div>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Grafieken</h2>
        <div className={styles.chartPlaceholder}>
          Hier kunnen later grafieken komen: adherence per klant, voortgang gewicht, aantal check-ins per week.
        </div>
      </section>
    </div>
  )
}
