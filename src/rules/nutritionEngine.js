/**
 * TrainLogic: rule-based voedingsrichtlijn per week.
 * - Kcal en macro's op basis van client input: BMR (Mifflin-St Jeor), TDEE, doelaanpassing, eiwit/vet per kg.
 * - Weekgemiddelden + voorbeeldmaaltijden uit food library.
 */

import { getMealOptionsFromLibrary, FOOD_LIBRARY } from '../lib/foodLibrary'
import {
  calcTDEE,
  getGoalCalorieAdjustment,
  calcMacrosFromCaloriesAndWeight,
  getNutritionWeekRationale,
  getMacroRulesPerKg,
} from './nutritionRules'

// Per week energie-richting (voor maaltijdkeuze laag/medium/hoog)
function getWeeklyEnergyDirection(nutritionGoal) {
  if (nutritionGoal === 'vetverlies')
    return ['laag', 'laag', 'medium', 'medium']
  if (nutritionGoal === 'prestatie')
    return ['medium', 'hoog', 'hoog', 'medium']
  return ['medium', 'medium', 'medium', 'medium']
}

/** Fallback wanneer gewicht/lengte/leeftijd ontbreken */
function getWeeklyCaloriesFallback(energyLevel) {
  const base = 2000
  if (energyLevel === 'laag') return Math.round(base * 0.85)
  if (energyLevel === 'hoog') return Math.round(base * 1.15)
  return Math.round(base)
}

/** Macro-verhouding fallback (wanneer geen gewicht) */
function getMacroSplit(nutritionGoal) {
  if (nutritionGoal === 'vetverlies') return { protein: 0.35, carbs: 0.40, fat: 0.25 }
  if (nutritionGoal === 'prestatie') return { protein: 0.25, carbs: 0.50, fat: 0.25 }
  return { protein: 0.30, carbs: 0.45, fat: 0.25 }
}

function caloriesToMacrosFallback(kcal, split) {
  return {
    protein: Math.round((kcal * split.protein) / 4),
    carbs: Math.round((kcal * split.carbs) / 4),
    fat: Math.round((kcal * split.fat) / 9),
  }
}

// Afgeleid van food library voor admin-overzicht (zelfde structuur als voorheen)
function buildMealExamplesFromLibrary() {
  const levels = ['laag', 'medium', 'hoog']
  const result = {}
  for (const level of levels) {
    result[level] = {
      ontbijt: FOOD_LIBRARY.ontbijt.filter((m) => m.energyLevel === level).map(({ name, kcal, protein, carbs, fat }) => ({ name, kcal, protein, carbs, fat })),
      lunch: FOOD_LIBRARY.lunch.filter((m) => m.energyLevel === level).map(({ name, kcal, protein, carbs, fat }) => ({ name, kcal, protein, carbs, fat })),
      avond: FOOD_LIBRARY.avond.filter((m) => m.energyLevel === level).map(({ name, kcal, protein, carbs, fat }) => ({ name, kcal, protein, carbs, fat })),
      snack: FOOD_LIBRARY.snack.filter((m) => m.energyLevel === level).map(({ name, kcal, protein, carbs, fat }) => ({ name, kcal, protein, carbs, fat })),
    }
  }
  return result
}

const MEAL_EXAMPLES = buildMealExamplesFromLibrary()

const MEAL_SLOTS = ['ontbijt', 'lunch', 'avond', 'snack1', 'snack2']

/** Geeft alle alternatieven voor een maaltijdslot (voor "kies iets anders"). Optioneel gefilterd op input (dieet/allergieën). */
export function getMealOptions(energyLevel, mealSlot, input) {
  return getMealOptionsFromLibrary(energyLevel, mealSlot, input)
}

/** Pikt één dag met optioneel variatie-index (voor Dag 1..7). dayIndex 0 = eerste opties, 1 = tweede, etc. */
function pickDayN(energyLevel, dayIndex, input) {
  const ontbijtOpts = getMealOptionsFromLibrary(energyLevel, 'ontbijt', input)
  const lunchOpts = getMealOptionsFromLibrary(energyLevel, 'lunch', input)
  const avondOpts = getMealOptionsFromLibrary(energyLevel, 'avond', input)
  const snackOpts = getMealOptionsFromLibrary(energyLevel, 'snack1', input)
  const pick = (arr, i) => arr[i % (arr.length || 1)] || arr[0] || null
  return {
    ontbijt: pick(ontbijtOpts, dayIndex),
    lunch: pick(lunchOpts, dayIndex),
    avond: pick(avondOpts, dayIndex),
    snack1: pick(snackOpts, dayIndex),
    snack2: pick(snackOpts, dayIndex + 1),
  }
}

/** Schaalt maaltijden zodat de dagtotaal gelijk is aan targetKcal (weekgemiddelde). Voorbeelddag sluit zo aan op weekgemiddelde. */
function scaleMealsToTarget(meals, targetKcal) {
  if (!meals?.length || targetKcal <= 0) return { meals: [], total: { kcal: 0, protein: 0, carbs: 0, fat: 0 } }
  const totalKcal = meals.reduce((s, m) => s + (m.kcal || 0), 0)
  if (totalKcal <= 0) return { meals: meals.map((m) => ({ ...m })), total: meals.reduce((acc, m) => ({ kcal: acc.kcal + m.kcal, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }), { kcal: 0, protein: 0, carbs: 0, fat: 0 }) }
  const factor = targetKcal / totalKcal
  const scaled = meals.map((m) => ({
    ...m,
    kcal: Math.round((m.kcal || 0) * factor),
    protein: Math.round((m.protein || 0) * factor),
    carbs: Math.round((m.carbs || 0) * factor),
    fat: Math.round((m.fat || 0) * factor),
  }))
  const total = scaled.reduce((acc, m) => ({
    kcal: acc.kcal + m.kcal,
    protein: acc.protein + m.protein,
    carbs: acc.carbs + m.carbs,
    fat: acc.fat + m.fat,
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 })
  return { meals: scaled, total }
}

const MEAL_LABELS_ARR = ['Ontbijt', 'Lunch', 'Avondeten', 'Snack', 'Snack']

/** Bouwt één week met 7 dagen (Dag 1..7); elke dag eigen maaltijden, geschaald naar weekgemiddelde. Behoudt exampleMeals/exampleDayTotal voor backwards compat (dag 1). */
function buildOneWeek(input, nutritionGoal, direction, dailyKcal, weightKg, hasBodyInput, tdee, goalAdjustment, weekIndex) {
  const macros = hasBodyInput && weightKg
    ? calcMacrosFromCaloriesAndWeight(dailyKcal, weightKg, nutritionGoal)
    : caloriesToMacrosFallback(dailyKcal, getMacroSplit(nutritionGoal))
  const days = []
  for (let d = 0; d < 7; d++) {
    const dayMeals = pickDayN(direction, d, input)
    const mealsForTotal = [dayMeals.ontbijt, dayMeals.lunch, dayMeals.avond, dayMeals.snack1, dayMeals.snack2].filter(Boolean)
    const { meals: scaledMeals, total: scaledTotal } = scaleMealsToTarget(mealsForTotal, dailyKcal)
    const meals = scaledMeals.map((m, i) => ({ meal: MEAL_LABELS_ARR[i] || 'Maaltijd', ...m }))
    days.push({ dayNumber: d + 1, meals, dayTotal: scaledTotal })
  }
  const weekTip = direction === 'laag'
    ? 'Spreid je maaltijden; eet voldoende eiwit om spiermassa te behouden.'
    : direction === 'hoog'
      ? 'Eet voldoende koolhydraten rond training; neem een extra snack indien nodig.'
      : 'Houd het weekgemiddelde aan; een dag iets meer of minder is geen probleem.'
  const rationale = getNutritionWeekRationale(weekIndex, nutritionGoal, direction, dailyKcal, tdee ?? null, goalAdjustment)
  return {
    weekNumber: weekIndex + 1,
    weekName: `Week ${weekIndex + 1}`,
    energyDirection: direction,
    averageCaloriesPerDay: dailyKcal,
    macrosPerDay: macros,
    note: direction === 'laag' ? 'Weekgemiddelde. Geen dagrestrictie.' : null,
    weekTip,
    rationale,
    days,
    exampleMeals: days[0]?.meals ?? [],
    exampleDayTotal: days[0]?.dayTotal ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  }
}

/**
 * Bepaalt aanpassing voor de volgende week op basis van evaluatie.
 * - Goed + geen honger/futloos → gelijk houden.
 * - Slecht of honger/futloos → bij vetverlies: kcal omlaag, eiwit omhoog.
 * - weight_kg in review kan later gebruikt worden voor "kg minder" (startgewicht vs eindgewicht).
 */
function getAdaptation(previousReview, nutritionGoal) {
  const howWent = previousReview?.how_went
  const hungry = previousReview?.hungry_or_futloos
  const noHunger = !hungry || hungry === 'geen'

  if (nutritionGoal === 'vetverlies') {
    if (howWent === 'goed' && noHunger) return { kcalFactor: 1, proteinBonus: 0 }
    if (howWent === 'slecht' || (hungry && hungry !== 'geen')) return { kcalFactor: 0.92, proteinBonus: 0.2 }
    if (howWent === 'redelijk') return { kcalFactor: 0.97, proteinBonus: 0.1 }
    return { kcalFactor: 1, proteinBonus: 0 }
  }
  if (nutritionGoal === 'prestatie' || nutritionGoal === 'onderhoud') {
    if (howWent === 'goed') return { kcalFactor: 1, proteinBonus: 0 }
    if (howWent === 'slecht') return { kcalFactor: 0.97, proteinBonus: 0.1 }
    return { kcalFactor: 1, proteinBonus: 0 }
  }
  return { kcalFactor: 1, proteinBonus: 0 }
}

/**
 * Bouwt de volgende week (2, 3 of 4) na een weekevaluatie. Adapteert kcal en eiwit op basis van review.
 * @param {object} plan - bestaand plan (bevat weeks[0..n-1], nutritionGoal, tdee, goalAdjustment)
 * @param {object} input - client_input
 * @param {object} previousWeek - plan.weeks[weekIndex-1]
 * @param {object} previousReview - week_review van de afgelopen week
 * @param {number} nextWeekIndex - 0-based (1 = week 2, 2 = week 3, 3 = week 4)
 */
export function buildNextNutritionWeek(plan, input, previousWeek, previousReview, nextWeekIndex) {
  const nutritionGoal = plan?.nutritionGoal || input?.nutrition_goal || 'onderhoud'
  const energyByWeek = getWeeklyEnergyDirection(nutritionGoal)
  const direction = energyByWeek[nextWeekIndex] || 'medium'
  const weightKg = input?.weight_kg != null ? Number(input.weight_kg) : null
  const hasBodyInput = weightKg && input?.height_cm != null && input?.age != null
  const adaptation = getAdaptation(previousReview, nutritionGoal)
  let dailyKcal = previousWeek?.averageCaloriesPerDay ?? 2000
  dailyKcal = Math.round(dailyKcal * adaptation.kcalFactor)
  const proteinBonus = adaptation.proteinBonus
  const tdee = plan?.tdee ?? null
  const goalAdjustment = plan?.goalAdjustment ? { factor: plan.goalAdjustment.factor || 1, label: plan.goalAdjustment.label, description: plan.goalAdjustment.description } : getGoalCalorieAdjustment(nutritionGoal)
  let macros
  if (hasBodyInput && weightKg) {
    const { proteinPerKg, fatPerKg } = getMacroRulesPerKg(nutritionGoal)
    const proteinPerKgAdj = proteinPerKg + proteinBonus
    const protein = Math.round(proteinPerKgAdj * weightKg)
    const fat = Math.round(fatPerKg * weightKg)
    const proteinKcal = protein * 4
    const fatKcal = fat * 9
    const carbsKcal = Math.max(0, dailyKcal - proteinKcal - fatKcal)
    macros = { protein, carbs: Math.round(carbsKcal / 4), fat }
  } else {
    const split = getMacroSplit(nutritionGoal)
    if (proteinBonus > 0) split.protein = Math.min(0.45, split.protein + 0.05)
    macros = caloriesToMacrosFallback(dailyKcal, split)
  }
  const days = []
  for (let d = 0; d < 7; d++) {
    const dayMeals = pickDayN(direction, d, input)
    const mealsForTotal = [dayMeals.ontbijt, dayMeals.lunch, dayMeals.avond, dayMeals.snack1, dayMeals.snack2].filter(Boolean)
    const { meals: scaledMeals, total: scaledTotal } = scaleMealsToTarget(mealsForTotal, dailyKcal)
    const meals = scaledMeals.map((m, i) => ({ meal: MEAL_LABELS_ARR[i] || 'Maaltijd', ...m }))
    days.push({ dayNumber: d + 1, meals, dayTotal: scaledTotal })
  }
  const weekTip = direction === 'laag' ? 'Spreid je maaltijden; eet voldoende eiwit om spiermassa te behouden.' : direction === 'hoog' ? 'Eet voldoende koolhydraten rond training.' : 'Houd het weekgemiddelde aan.'
  const rationale = getNutritionWeekRationale(nextWeekIndex, nutritionGoal, direction, dailyKcal, tdee, goalAdjustment)
  return {
    weekNumber: nextWeekIndex + 1,
    weekName: `Week ${nextWeekIndex + 1}`,
    energyDirection: direction,
    averageCaloriesPerDay: dailyKcal,
    macrosPerDay: macros,
    note: direction === 'laag' ? 'Weekgemiddelde. Geen dagrestrictie.' : null,
    weekTip,
    rationale,
    days,
    exampleMeals: days[0]?.meals ?? [],
    exampleDayTotal: days[0]?.dayTotal ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  }
}

/** Genereert alleen week 1 bij aanmaak. Week 2–4 volgen na evaluatie (adaptief). */
export function buildNutritionPlan(input) {
  const nutritionGoal = input.nutrition_goal || 'onderhoud'
  const energyByWeek = getWeeklyEnergyDirection(nutritionGoal)
  const weightKg = input.weight_kg != null ? Number(input.weight_kg) : null
  const hasBodyInput = weightKg && input.height_cm != null && input.age != null

  let baseDailyKcal
  let tdee
  let goalAdjustment

  if (hasBodyInput) {
    tdee = calcTDEE(input)
    goalAdjustment = getGoalCalorieAdjustment(nutritionGoal)
    baseDailyKcal = tdee != null ? Math.round(tdee * goalAdjustment.factor) : 2000
  } else {
    baseDailyKcal = 2000
    goalAdjustment = getGoalCalorieAdjustment(nutritionGoal)
  }

  const direction = energyByWeek[0] || 'medium'
  const dailyKcal = hasBodyInput ? baseDailyKcal : getWeeklyCaloriesFallback(direction)
  const week1 = buildOneWeek(input, nutritionGoal, direction, dailyKcal, weightKg, hasBodyInput, tdee, goalAdjustment, 0)

  return {
    generatedAt: new Date().toISOString(),
    nutritionGoal,
    tdee: tdee ?? null,
    goalAdjustment: goalAdjustment ? { label: goalAdjustment.label, description: goalAdjustment.description, factor: goalAdjustment.factor } : null,
    dietaryNote: input.dietary_prefs || null,
    restrictions: input.restrictions || null,
    weeks: [week1],
  }
}

export { MEAL_SLOTS, MEAL_EXAMPLES }

/** Labels voor admin-overzicht */
export const MEAL_SLOT_LABELS = { ontbijt: 'Ontbijt', lunch: 'Lunch', avond: 'Avondeten', snack: 'Snack' }
