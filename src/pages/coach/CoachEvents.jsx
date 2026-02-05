import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../hooks/useProfile'
import { hasCoachFeature, getCoachUpgradeMessage } from '../../lib/coachSubscription'
import styles from './Coach.module.css'

export default function CoachEvents() {
  const { isCoach, clients, loading, coachSubscription } = useProfile()
  const tier = coachSubscription ?? 'starter'
  const canAccess = hasCoachFeature(tier, 'event_trainingsprogrammas')
  const [events, setEvents] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(true)

  useEffect(() => {
    if (!isCoach || !clients?.length) {
      setLoadingEvents(false)
      return
    }
    const ids = clients.map((c) => c.id)
    supabase.from('client_input').select('user_id, event_date, event_name').in('user_id', ids).not('event_date', 'is', null)
      .then(({ data }) => {
        setEvents(data ?? [])
        setLoadingEvents(false)
      })
  }, [isCoach, clients])

  if (!loading && !isCoach) return <Navigate to="/dashboard" replace />
  if (loading) return <p className={styles.muted}>Laden…</p>
  if (!canAccess) {
    return (
      <div className={styles.page}>
        <h1>Event planning</h1>
        <p className={styles.limitReached}>{getCoachUpgradeMessage('event_trainingsprogrammas')}</p>
        <Link to="/dashboard/coach/plannen" className={styles.backLink}>← Plannen &amp; prijzen</Link>
      </div>
    )
  }

  const withDate = events.filter((e) => e.event_date)
  withDate.sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
  const clientMap = (clients ?? []).reduce((acc, c) => { acc[c.id] = c; return acc }, {})

  return (
    <div className={styles.page}>
      <h1>Event planning</h1>
      <p className={styles.intro}>
        Overzicht van events en wedstrijden van je klanten. Plan schema&apos;s en taper rond deze data.
      </p>
      {loadingEvents ? (
        <p className={styles.muted}>Laden…</p>
      ) : withDate.length === 0 ? (
        <section className={styles.section}>
          <p className={styles.muted}>Geen events gevonden. Klanten kunnen in Mijn input een eventdatum invullen.</p>
        </section>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Klant</th>
                <th>Event</th>
                <th>Datum</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {withDate.map((e) => (
                <tr key={`${e.user_id}-${e.event_date}`}>
                  <td>{clientMap[e.user_id]?.full_name || clientMap[e.user_id]?.email || '—'}</td>
                  <td>{e.event_name || '—'}</td>
                  <td>{e.event_date ? new Date(e.event_date).toLocaleDateString('nl-NL') : '—'}</td>
                  <td><Link to={`/dashboard/coach/klanten/${e.user_id}`} className={styles.link}>Klant</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
