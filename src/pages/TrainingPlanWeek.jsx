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
  const [overrides, setOverrides] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id || !user?.id) {
      setLoading(false)
      return
    }
    let cancelled = false
    async function load() {
      const { data } = await supabase.from('training_plans').select('*').eq('id', id).eq('user_id', user.id).single()
      if (cancelled) return
      setRow(data)
      if (data?.block_id) {
        const { data: r } = await supabase.from('week_reviews').select('*').eq('user_id', user.id).eq('block_id', data.block_id)
        if (!cancelled) setReviews(r ?? [])
      }
      const { data: overrideRows } = await supabase
        .from('exercise_overrides')
        .select('session_index, exercise_index, option_index')
        .eq('training_plan_id', id)
        .eq('week_number', weekNumber)
      if (!cancelled && overrideRows) {
        const map = {}
        overrideRows.forEach((o) => { map[`${o.session_index}_${o.exercise_index}`] = o.option_index })
        setOverrides(map)
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [id, user?.id, weekNumber])

  useEffect(() => {
    if (!row?.block_id || !user?.id) return
    let cancelled = false
    supabase.from('week_reviews').select('*').eq('user_id', user.id).eq('block_id', row.block_id).then(({ data }) => {
      if (!cancelled) setReviews(data ?? [])
    })
    return () => { cancelled = true }
  }, [row?.block_id, user?.id])

  const plan = row?.plan
  const week = plan?.weeks?.[weekNumber - 1]
  const existingReview = reviews.find((r) => r.week_number === weekNumber)
  const { available: evaluationAvailable, availableFrom } = getWeekEvaluationAvailability(row?.created_at, weekNumber)

  const getExerciseOption = (ex, optionIndex) => {
    const options = [ex, ...(ex.alternatives || [])]
    return options[Math.min(optionIndex ?? 0, options.length - 1)] || ex
  }

  const handleSwapExercise = async (sessionIndex, exerciseIndex, exercise) => {
    if (!user?.id || !id) return
    const options = [exercise, ...(exercise.alternatives || [])]
    if (options.length <= 1) return
    const key = `${sessionIndex}_${exerciseIndex}`
    const current = overrides[key] ?? 0
    const next = (current + 1) % options.length
    const { error } = await supabase.from('exercise_overrides').upsert(
      { user_id: user.id, training_plan_id: id, week_number: weekNumber, session_index: sessionIndex, exercise_index: exerciseIndex, option_index: next },
      { onConflict: 'user_id,training_plan_id,week_number,session_index,exercise_index' }
    )
    if (!error) setOverrides((o) => ({ ...o, [key]: next }))
  }

  if (loading) return <p className={styles.muted}>Laden…</p>
  if (!row || !plan) return <p className={styles.muted}>Schema niet gevonden.</p>

  return (
    <div className={styles.page}>
      <p className={styles.back}>
        <Link to={`/dashboard/training/${id}`}>← Terug naar schema</Link>
      </p>
      <h1>Week {weekNumber} – Training</h1>

      {week && (
        <>
          <div className={styles.day}>
            <p><strong>Focus:</strong> {week.focus}</p>
            {(week.volumeDescription ?? week.volumeMinutes) && (
              <p><strong>Volume:</strong> {week.volumeDescription ?? `${week.volumeMinutes} min`}</p>
            )}
            {week.intenseSessions != null && (
              <p><strong>Intensieve sessies:</strong> {week.intenseSessions}</p>
            )}
            {week.note && <p className={styles.calories}>{week.note}</p>}
          </div>

          {(week.sessions ?? []).length > 0 && (
            <div className={styles.day}>
              <h3>Concrete sessies deze week</h3>
              <p className={styles.calories}>Per sessie: type, duur en voorbeeldoefeningen. Klik op &quot;Kies andere oefening&quot; voor een vergelijkbaar alternatief.</p>
              <ul className={styles.sessionList}>
                {(week.sessions ?? []).map((sess, si) => (
                  <li key={si} className={styles.sessionItem}>
                    <strong>{sess.dayLabel}</strong> — {sess.type} · {sess.durationMin} min
                    <ul className={styles.exerciseList}>
                      {(sess.exercises ?? []).map((ex, ei) => {
                        const optionIdx = overrides[`${si}_${ei}`] ?? 0
                        const chosen = getExerciseOption(ex, optionIdx)
                        const hasAlternatives = (ex.alternatives?.length ?? 0) > 0
                        return (
                          <li key={ei} className={styles.exerciseRow}>
                            <span>
                              {chosen.name}: {chosen.sets}×{chosen.reps}
                              {chosen.note ? ` · ${chosen.note}` : ''}
                            </span>
                            {hasAlternatives && (
                              <button type="button" className={styles.swapBtn} onClick={() => handleSwapExercise(si, ei, ex)}>
                                Kies andere oefening
                              </button>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {row.block_id && (
        <div className={styles.day}>
          {!evaluationAvailable ? (
            <p className={styles.muted}>
              Evaluatie week {weekNumber} komt beschikbaar op <strong>{formatAvailableDate(availableFrom)}</strong> — na afloop van die week.
            </p>
          ) : (
            <WeekReviewForm blockId={row.block_id} weekNumber={weekNumber} existingReview={existingReview} />
          )}
        </div>
      )}
    </div>
  )
}
