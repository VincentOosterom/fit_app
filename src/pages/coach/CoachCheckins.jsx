import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../hooks/useProfile'
import styles from './Coach.module.css'

export default function CoachCheckins() {
  const { isCoach, clients, loading } = useProfile()
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(true)

  useEffect(() => {
    if (!isCoach || !clients?.length) {
      setLoadingReviews(false)
      return
    }
    const ids = clients.map((c) => c.id)
    supabase.from('week_reviews').select('*').in('user_id', ids).order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => {
        setReviews(data ?? [])
        setLoadingReviews(false)
      })
  }, [isCoach, clients])

  if (!loading && !isCoach) return <Navigate to="/dashboard" replace />
  if (loading) return <p className={styles.muted}>Laden…</p>

  const clientMap = (clients ?? []).reduce((acc, c) => { acc[c.id] = c; return acc }, {})

  return (
    <div className={styles.page}>
      <h1>Check-in en feedback</h1>
      <p className={styles.intro}>
        Weekevaluaties en feedback van je klanten. Bekijk hoe het gaat en reageer waar nodig.
      </p>
      {loadingReviews ? (
        <p className={styles.muted}>Laden…</p>
      ) : reviews.length === 0 ? (
        <section className={styles.section}>
          <p className={styles.muted}>Nog geen weekevaluaties. Klanten vullen na elke week een korte evaluatie in.</p>
        </section>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Klant</th>
                <th>Block · Week</th>
                <th>Hoe ging het</th>
                <th>Datum</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td>{clientMap[r.user_id]?.full_name || clientMap[r.user_id]?.email || '—'}</td>
                  <td>Week {r.week_number}</td>
                  <td>{r.how_went ?? '—'}</td>
                  <td>{r.created_at ? new Date(r.created_at).toLocaleDateString('nl-NL') : '—'}</td>
                  <td><Link to={`/dashboard/coach/klanten/${r.user_id}`} className={styles.link}>Klant</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
