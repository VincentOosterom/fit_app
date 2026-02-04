import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import WeekReviewForm from './WeekReviewForm'
import { getWeekEvaluationAvailability, formatAvailableDate } from '../utils/weekEvaluation'
import { getMealOptions, MEAL_SLOTS } from '../rules/nutritionEngine'
import styles from './Plan.module.css'

const MEAL_LABELS = { ontbijt: 'Ontbijt', lunch: 'Lunch', avond: 'Avondeten', snack1: 'Snack', snack2: 'Snack' }

export default function NutritionPlanWeek() {
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
      const { data: planData } = await supabase.from('nutrition_plans').select('*').eq('id', id).eq('user_id', user.id).single()
      if (cancelled) return
      setRow(planData)
      if (planData?.block_id) {
        const { data: r } = await supabase.from('week_reviews').select('*').eq('user_id', user.id).eq('block_id', planData.block_id)
        if (!cancelled) setReviews(r ?? [])
      }
      const { data: overrideRows } = await supabase
        .from('meal_overrides')
        .select('meal_slot, option_index')
        .eq('nutrition_plan_id', id)
        .eq('week_number', weekNumber)
      if (!cancelled && overrideRows) {
        const map = {}
        overrideRows.forEach((o) => { map[o.meal_slot] = o.option_index })
        setOverrides(map)
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

  const handleSwapMeal = async (mealSlot) => {
    if (!user?.id || !id || !week) return
    const options = getMealOptions(week.energyDirection, mealSlot)
    if (options.length <= 1) return
    const current = overrides[mealSlot] ?? 0
    const next = (current + 1) % options.length
    const { error } = await supabase.from('meal_overrides').upsert(
      { user_id: user.id, nutrition_plan_id: id, week_number: weekNumber, meal_slot: mealSlot, option_index: next },
      { onConflict: 'user_id,nutrition_plan_id,week_number,meal_slot' }
    )
    if (!error) setOverrides((o) => ({ ...o, [mealSlot]: next }))
  }

  if (loading) return <p className={styles.muted}>Laden…</p>
  if (!row || !plan) return <p className={styles.muted}>Schema niet gevonden.</p>

  const displayMeals = week ? MEAL_SLOTS.map((slot) => {
    const options = getMealOptions(week.energyDirection, slot)
    const idx = overrides[slot] ?? 0
    const m = options[idx] || options[0]
    return m ? { slot, meal: MEAL_LABELS[slot], ...m, optionsCount: options.length } : null
  }).filter(Boolean) : []

  const displayTotal = displayMeals.length
    ? displayMeals.reduce((acc, m) => ({ kcal: acc.kcal + m.kcal, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }), { kcal: 0, protein: 0, carbs: 0, fat: 0 })
    : week?.exampleDayTotal

  return (
    <div className={styles.page}>
      <p className={styles.back}>
        <Link to={`/dashboard/voeding/${id}`}>← Terug naar schema</Link>
      </p>
      <h1>Week {weekNumber} – Voeding</h1>
      <p className={styles.disclaimer}>Raadpleeg altijd een arts of diëtist voor vragen of bij twijfel over voeding of gezondheid.</p>

      {week ? (
        <>
          <div className={styles.day}>
            <p><strong>Energie:</strong> {week.energyDirection === 'hoog' ? 'Hoog' : week.energyDirection === 'laag' ? 'Laag' : 'Medium'}</p>
            {week.averageCaloriesPerDay != null && (
              <p><strong>Weekgemiddelde:</strong> ca. {week.averageCaloriesPerDay} kcal/dag</p>
            )}
            {week.macrosPerDay && (
              <p><strong>Macro’s per dag:</strong> Eiwit {week.macrosPerDay.protein}g · Koolhydraten {week.macrosPerDay.carbs}g · Vet {week.macrosPerDay.fat}g</p>
            )}
            {week.weekTip && <p className={styles.calories}>{week.weekTip}</p>}
          </div>

          <div className={styles.day}>
            <h3>Wat je kunt eten (voorbeelddag)</h3>
            <p className={styles.calories}>Vind je iets niet lekker? Klik op &quot;Kies iets anders&quot; voor een vergelijkbaar alternatief.</p>
            <ul className={styles.mealList}>
              {displayMeals.map((m, i) => (
                <li key={i} className={styles.mealRow}>
                  <span>
                    <strong>{m.meal}:</strong> {m.name} · {m.kcal} kcal · E{m.protein}g K{m.carbs}g V{m.fat}g
                  </span>
                  {m.optionsCount > 1 && (
                    <button type="button" className={styles.swapBtn} onClick={() => handleSwapMeal(m.slot)}>
                      Dit vind ik niet lekker — kies iets anders
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {displayTotal && (
              <p className={styles.calories}>Totaal voorbeeld: {displayTotal.kcal} kcal · E{displayTotal.protein}g K{displayTotal.carbs}g V{displayTotal.fat}g</p>
            )}
          </div>
        </>
      ) : null}

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
