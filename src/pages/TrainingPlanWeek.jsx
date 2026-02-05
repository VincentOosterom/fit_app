import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import WeekReviewForm from './WeekReviewForm'
import { getWeekEvaluationAvailability, formatAvailableDate } from '../utils/weekEvaluation'
import styles from './Plan.module.css'

export default function TrainingPlanWeek() {
  const { id, weekNum } = useParams()
  const { user } = useAuth()
  const weekNumber = Math.max(1, Math.min(4, parseInt(weekNum, 10) || 1))
  const [row, setRow] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id || !user?.id) {
      setLoading(false)
      return
    }
    let cancelled = false
    async function load() {
      const { data: planData } = await supabase.from('training_plans').select('*').eq('id', id).eq('user_id', user.id).single()
      if (cancelled) return
      setRow(planData)
      if (planData?.block_id) {
        const { data: r } = await supabase.from('week_reviews').select('*').eq('user_id', user.id).eq('block_id', planData.block_id)
        if (!cancelled) setReviews(r ?? [])
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [id, user?.id, weekNumber])

  const plan = row?.plan
  const week = plan?.weeks?.[weekNumber - 1]
  const existingReview = reviews.find((r) => r.week_number === weekNumber)
  const { available: evaluationAvailable, availableFrom } = getWeekEvaluationAvailability(row?.created_at, weekNumber)

  if (loading) return <p className={styles.muted}>Laden…</p>
  if (!row || !plan) return <p className={styles.muted}>Schema niet gevonden.</p>

  const sessions = week?.sessions ?? []

  return (
    <div className={styles.page}>
      <p className={styles.back}>
        <Link to={`/dashboard/training/${id}`}>← Terug naar schema</Link>
      </p>
      <h1>Week {weekNumber} – Training</h1>
      {week ? (
        <>
          <div className={styles.whyBlock}>
            <h2 className={styles.whyTitle}>Waarom deze week</h2>
            <p className={styles.whyText}>
              {week.rationale || `Deze week staat in het teken van ${week.focus ?? '—'}. Het volume (${week.volumeDescription ?? week.volumeMinutes ?? '—'}) past bij je doel en niveau.`}
            </p>
            {week.note && <p className={styles.whyTip}>{week.note}</p>}
          </div>

          <div className={styles.day}>
            <p><strong>Focus:</strong> {week.focus ?? '—'}</p>
            <p><strong>Volume:</strong> {week.volumeDescription ?? week.volumeMinutes ?? '—'}</p>
          </div>
          <div className={styles.day}>
            <h3>Sessies</h3>
            {sessions.length === 0 ? (
              <p className={styles.muted}>Geen sessies voor deze week.</p>
            ) : (
              <ul className={styles.list}>
                {sessions.map((s, i) => (
                  <li key={i}>
                    <strong>{s.dayLabel ?? `Sessie ${i + 1}`}</strong> — {s.type ?? '—'} · {s.durationMin ?? 0} min
                    {(s.rpeTarget || s.restBetweenSetsSec) && (
                      <span className={styles.sessionMeta}>
                        {s.rpeTarget && ` RPE ${s.rpeTarget}`}
                        {s.restBetweenSetsSec > 0 && ` · ${s.restBetweenSetsSec} sec rust tussen sets`}
                      </span>
                    )}
                    {s.exercises?.length > 0 && (
                      <ul>
                        {s.exercises.map((ex, j) => (
                          <li key={j}>{ex.name}: {ex.sets}×{ex.reps} {ex.note ? `— ${ex.note}` : ''}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}

      {row.block_id && (
        <div className={styles.day}>
          {!evaluationAvailable ? (
            <p className={styles.muted}>
              Evaluatie week {weekNumber} komt beschikbaar op <strong>{formatAvailableDate(availableFrom)}</strong>.
            </p>
          ) : (
            <WeekReviewForm blockId={row.block_id} weekNumber={weekNumber} existingReview={existingReview} />
          )}
        </div>
      )}
    </div>
  )
}
