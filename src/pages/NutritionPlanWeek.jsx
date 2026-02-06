import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { hasFeature, getUpgradeMessage } from '../lib/planFeatures'
import WeekReviewForm from './WeekReviewForm'
import { getWeekEvaluationAvailability, formatAvailableDate } from '../utils/weekEvaluation'
import { getMealOptions as getMealOptionsStatic, MEAL_SLOTS, buildNextNutritionWeek } from '../rules/nutritionEngine'
import { useFoodLibrary } from '../hooks/useFoodLibrary'
import { getShoppingListForMeals } from '../lib/foodLibrary'
import styles from './Plan.module.css'

const MEAL_LABELS = { ontbijt: 'Ontbijt', lunch: 'Lunch', avond: 'Avondeten', snack1: 'Snack', snack2: 'Snack', snack3: 'Snack', snack4: 'Snack' }

export default function NutritionPlanWeek() {
  const { id, weekNum } = useParams()
  const { user } = useAuth()
  const { planType } = useSubscription()
  const weekNumber = Math.max(1, Math.min(4, parseInt(weekNum, 10) || 1))
  const [row, setRow] = useState(null)
  const [reviews, setReviews] = useState([])
  const [clientInput, setClientInput] = useState(null)
  const [overridesByDay, setOverridesByDay] = useState({}) // { [dayNumber]: { [mealSlot]: optionIndex } }
  const [selectedDay, setSelectedDay] = useState(1)
  const [loading, setLoading] = useState(true)
  const canBoodschappen = hasFeature(planType, 'boodschappenlijst')
  const showSevenDays = hasFeature(planType, 'example_meals_macros')
  const { getMealOptions: getMealOptionsFromDb, loading: foodLibraryLoading } = useFoodLibrary()
  const getMealOptions = (energyLevel, mealSlot) =>
    (foodLibraryLoading ? getMealOptionsStatic : getMealOptionsFromDb)(energyLevel, mealSlot, clientInput)

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
      const { data: inputData } = await supabase.from('client_input').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(1).maybeSingle()
      if (!cancelled) setClientInput(inputData ?? null)
      const { data: overrideRows } = await supabase
        .from('meal_overrides')
        .select('meal_slot, day_number, option_index')
        .eq('nutrition_plan_id', id)
        .eq('week_number', weekNumber)
      if (!cancelled && overrideRows) {
        const byDay = {}
        overrideRows.forEach((o) => {
          const d = o.day_number ?? 1
            if (!byDay[d]) byDay[d] = {}
            byDay[d][o.meal_slot] = o.option_index
        })
        setOverridesByDay(byDay)
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

  const handleReviewSubmitted = async () => {
    if (!id || !user?.id || !row?.block_id || weekNumber > 3) return
    try {
      const { data: planRow } = await supabase.from('nutrition_plans').select('plan').eq('id', id).eq('user_id', user.id).single()
      const plan = planRow?.plan
      if (!plan?.weeks || plan.weeks.length !== weekNumber) return
      const { data: inputRow } = await supabase.from('client_input').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(1).maybeSingle()
      const input = inputRow ?? {}
      const { data: blockReviews } = await supabase.from('week_reviews').select('*').eq('user_id', user.id).eq('block_id', row.block_id).order('week_number')
      const previousReview = blockReviews?.find((r) => r.week_number === weekNumber) ?? null
      const previousWeek = plan.weeks[weekNumber - 1]
      const nextWeek = buildNextNutritionWeek(plan, input, previousWeek, previousReview, weekNumber)
      const updatedPlan = { ...plan, weeks: [...plan.weeks, nextWeek] }
      await supabase.from('nutrition_plans').update({ plan: updatedPlan }).eq('id', id).eq('user_id', user.id)
      setRow((r) => (r ? { ...r, plan: updatedPlan } : r))
    } catch (_) {}
  }

  const dayNumber = showSevenDays ? selectedDay : 1
  const overridesForDay = overridesByDay[dayNumber] ?? {}

  const handleSwapMeal = async (mealSlot, forDayNumber = dayNumber) => {
    if (!user?.id || !id || !week) return
    const options = getMealOptions(week.energyDirection, mealSlot)
    if (options.length <= 1) return
    const dayOverrides = overridesByDay[forDayNumber] ?? {}
    const current = dayOverrides[mealSlot] ?? 0
    const next = (current + 1) % options.length
    const { error } = await supabase.from('meal_overrides').upsert(
      { user_id: user.id, nutrition_plan_id: id, week_number: weekNumber, day_number: forDayNumber, meal_slot: mealSlot, option_index: next },
      { onConflict: 'user_id,nutrition_plan_id,week_number,day_number,meal_slot' }
    )
    if (!error) setOverridesByDay((o) => ({ ...o, [forDayNumber]: { ...(o[forDayNumber] ?? {}), [mealSlot]: next } }))
  }

  if (loading) return <p className={styles.muted}>Laden…</p>
  if (!row || !plan) return <p className={styles.muted}>Schema niet gevonden.</p>

  const weekDays = showSevenDays && week?.days?.length ? week.days : null

  const buildDisplayMealsForDay = (forDayNumber) => {
    if (!week) return []
    const dayData = weekDays ? weekDays[forDayNumber - 1] : null
    const planMeals = dayData?.meals ?? week?.exampleMeals ?? []
    const overrides = overridesByDay[forDayNumber] ?? {}

    return planMeals.map((planMeal, i) => {
      const slot = planMeal.slot || MEAL_SLOTS[i]
      const librarySlot = (slot === 'snack3' || slot === 'snack4') ? 'snack1' : slot
      const options = getMealOptions(week.energyDirection, librarySlot)
      const overrideIdx = overrides[slot]
      const m = (overrideIdx != null && options[overrideIdx]) ? options[overrideIdx] : planMeal
      const mealLabel = MEAL_LABELS[slot] || 'Snack'
      return {
        slot,
        meal: mealLabel,
        name: m.name,
        kcal: m.kcal,
        protein: m.protein ?? 0,
        carbs: m.carbs ?? 0,
        fat: m.fat ?? 0,
        grams: m.grams ?? null,
        optionsCount: options.length,
      }
    }).filter((m) => m.name)
  }

  const buildTotals = (meals) => meals.reduce(
    (acc, m) => ({ kcal: acc.kcal + (m.kcal || 0), protein: acc.protein + (m.protein || 0), carbs: acc.carbs + (m.carbs || 0), fat: acc.fat + (m.fat || 0) }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const displayMeals = buildDisplayMealsForDay(dayNumber)
  const displayTotal = displayMeals.length ? buildTotals(displayMeals) : (weekDays ? weekDays[dayNumber - 1]?.dayTotal : week?.exampleDayTotal)

  const handleDownloadBoodschappen = () => {
    const list = getShoppingListForMeals(displayMeals)
    const lines = [
      `Boodschappenlijst – Week ${weekNumber}`,
      'Precies wat je nodig hebt voor deze voorbeelddag.',
      '',
      ...displayMeals.map((m) => `• ${m.meal}: ${m.name}${m.grams ? ` (${m.grams})` : ''}`),
      '',
      'Ingrediënten:',
      ...list.map((i) => `• ${i}`),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `Boodschappenlijst-week-${weekNumber}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className={styles.page}>
      <p className={styles.back}>
        <Link to={`/dashboard/voeding/${id}`}>← Terug naar schema</Link>
      </p>
      <h1>Week {weekNumber} – Voeding</h1>
      <p className={styles.disclaimer}>Raadpleeg altijd een arts of diëtist voor vragen of bij twijfel over voeding of gezondheid.</p>

      {!week && weekNumber > 1 ? (
        <p className={styles.muted}>
          De richtlijnen voor week {weekNumber} worden bepaald na je evaluatie van week {weekNumber - 1}. Vul die eerst in op de vorige week-pagina.
        </p>
      ) : null}
      {week ? (
        <>
          <div className={styles.whyBlock}>
            <h2 className={styles.whyTitle}>Waarom deze week</h2>
            <p className={styles.whyText}>
              {week.rationale || `Deze week hanteren we een ${week.energyDirection === 'hoog' ? 'hoge' : week.energyDirection === 'laag' ? 'lagere' : 'medium'} energie-inname (${week.averageCaloriesPerDay ?? '—'} kcal/dag gemiddeld). Dat sluit aan bij je voedingsdoel.`}
            </p>
            {week.weekTip && <p className={styles.whyTip}>{week.weekTip}</p>}
          </div>

          <div className={styles.day}>
            <p><strong>Energie:</strong> {week.energyDirection === 'hoog' ? 'Hoog' : week.energyDirection === 'laag' ? 'Laag' : 'Medium'}</p>
            {week.averageCaloriesPerDay != null && (
              <p><strong>Weekgemiddelde:</strong> ca. {week.averageCaloriesPerDay} kcal/dag</p>
            )}
            {week.macrosPerDay && (
              <p><strong>Macro’s per dag:</strong> Eiwit {week.macrosPerDay.protein}g · Koolhydraten {week.macrosPerDay.carbs}g · Vet {week.macrosPerDay.fat}g</p>
            )}
          </div>

          <div className={styles.day}>
            <p className={styles.calories}>Vind je iets niet lekker? Klik op &quot;Kies iets anders&quot; voor een vergelijkbaar alternatief.</p>

            {canBoodschappen ? (
              <p className={styles.calories}>
                <button type="button" className={styles.shoppingBtn} onClick={handleDownloadBoodschappen}>
                  Download boodschappenlijst {showSevenDays ? `dag ${selectedDay}` : 'deze week'}
                </button>
              </p>
            ) : (
              <p className={styles.cardLock}>{getUpgradeMessage('boodschappenlijst')}</p>
            )}

            {showSevenDays && weekDays ? (
              <div>
                {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                  const dayData = weekDays[d - 1]
                  const meals = buildDisplayMealsForDay(d)
                  const total = meals.length ? buildTotals(meals) : null
                  const extraMealAdded = dayData?.extraMealAdded
                  return (
                    <details key={d} open={d === selectedDay} onToggle={(e) => { if (e.currentTarget.open) setSelectedDay(d) }}>
                      <summary><strong>Dag {d}</strong>{total ? ` — ${total.kcal} kcal (E${total.protein} K${total.carbs} V${total.fat})` : ''}</summary>
                      {extraMealAdded && (
                        <p className={styles.extraMealInfo}>
                          We hebben een extra maaltijd toegevoegd zodat je dagtotaal beter aansluit op het weekgemiddelde ({week.averageCaloriesPerDay ?? '—'} kcal/dag).
                        </p>
                      )}
                      <ul className={styles.mealList} style={{ marginTop: '0.75rem' }}>
                        {meals.map((m, i) => (
                          <li key={i} className={styles.mealRow}>
                            <span>
                              <strong>{m.meal}:</strong> {m.name}{m.grams ? ` — ${m.grams}` : ''} · {m.kcal} kcal · E{m.protein}g K{m.carbs}g V{m.fat}g
                            </span>
                            {m.optionsCount > 1 && (
                              <button type="button" className={styles.swapBtn} onClick={() => handleSwapMeal(m.slot, d)}>
                                Dit vind ik niet lekker — kies iets anders
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )
                })}
              </div>
            ) : (
              <>
                <h3>Wat je kunt eten (voorbeelddag)</h3>
                <ul className={styles.mealList}>
                  {displayMeals.map((m, i) => (
                    <li key={i} className={styles.mealRow}>
                      <span>
                        <strong>{m.meal}:</strong> {m.name}{m.grams ? ` — ${m.grams}` : ''} · {m.kcal} kcal · E{m.protein}g K{m.carbs}g V{m.fat}g
                      </span>
                      {m.optionsCount > 1 && (
                        <button type="button" className={styles.swapBtn} onClick={() => handleSwapMeal(m.slot, 1)}>
                          Dit vind ik niet lekker — kies iets anders
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {displayTotal && (
                  <p className={styles.calories}>Totaal voorbeeld: {displayTotal.kcal} kcal · E{displayTotal.protein}g K{displayTotal.carbs}g V{displayTotal.fat}g</p>
                )}
              </>
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
            <WeekReviewForm blockId={row.block_id} weekNumber={weekNumber} existingReview={existingReview} onSubmitted={handleReviewSubmitted} />
          )}
        </div>
      )}
    </div>
  )
}
