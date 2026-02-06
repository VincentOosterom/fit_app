/**
 * TrainLogic: rule-based voedingsrichtlijn per week.
 * - Dagelijkse calorie-doel (TDEE-based) is leidend; maaltijdindeling mag dit nooit verlagen.
 * - Maaltijdpercentages tellen altijd op tot 100%; aantal maaltijden bepaalt alleen verdeling.
 * - Validatie- en correctielaag zorgt dat totaal binnen 97–103% van target valt (portie-aanpassing).
 */

import { getMealOptionsFromLibrary, FOOD_LIBRARY } from '../lib/foodLibrary'

const NUTRITION_DEBUG = (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') ||
  (typeof import.meta !== 'undefined' && import.meta.env?.DEV === true) ||
  (typeof window !== 'undefined' && window.__NUTRITION_DEBUG === true)

function debugLog(msg, data) {
  if (NUTRITION_DEBUG && typeof console !== 'undefined' && console.debug) {
    console.debug('[nutritionEngine]', msg, data != null ? data : '')
  }
}
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
const MEAL_SLOTS_6 = ['ontbijt', 'lunch', 'avond', 'snack1', 'snack2', 'snack3']

/** Slots per aantal maaltijden (2–6). */
function getSlotsForMeals(numMeals) {
  const n = Math.max(2, Math.min(6, numMeals))
  if (n === 2) return ['lunch', 'avond']
  if (n === 3) return ['ontbijt', 'lunch', 'avond']
  if (n === 4) return ['ontbijt', 'lunch', 'avond', 'snack1']
  if (n === 5) return MEAL_SLOTS
  return MEAL_SLOTS_6
}

/** Geeft alle alternatieven voor een maaltijdslot (voor "kies iets anders"). Optioneel gefilterd op input (dieet/allergieën). */
export function getMealOptions(energyLevel, mealSlot, input) {
  return getMealOptionsFromLibrary(energyLevel, mealSlot === 'snack3' ? 'snack1' : mealSlot, input)
}

const MEAL_LABELS_ARR = ['Ontbijt', 'Lunch', 'Avondeten', 'Snack', 'Snack', 'Snack']
const SLOT_LABELS = { ontbijt: 'Ontbijt', lunch: 'Lunch', avond: 'Avondeten', snack1: 'Snack', snack2: 'Snack', snack3: 'Snack' }

/** Maaltijdpercentages per aantal maaltijden (2–6). Altijd som = 100%. */
function getMealPercentages(numMeals) {
  const n = Math.max(2, Math.min(6, numMeals))
  if (n === 2) return [0.45, 0.55]
  if (n === 3) return [0.30, 0.35, 0.35]
  if (n === 4) return [0.25, 0.30, 0.35, 0.10]
  if (n === 5) return [0.20, 0.30, 0.35, 0.075, 0.075]
  return [0.18, 0.25, 0.32, 0.08, 0.08, 0.09]
}

/** Kiest uit options de maaltijd wiens kcal het dichtst bij targetKcal ligt; bij gelijke afstand voorkeur voor >= target. */
function pickBestMatch(options, targetKcal) {
  if (!options?.length) return null
  if (targetKcal == null) return options[0] || null
  let best = options[0]
  let bestDiff = Infinity
  for (const m of options) {
    const k = m.kcal != null ? m.kcal : 0
    const diff = Math.abs(k - targetKcal)
    const prefer = k >= targetKcal ? -0.5 : 0
    if (diff + prefer < bestDiff) {
      bestDiff = diff + prefer
      best = m
    }
  }
  return best
}

/** Zelfde als pickBestMatch maar sluit namen in excludedNames uit (voor variatie bij meerdere snacks). */
function pickBestMatchExcluding(options, targetKcal, excludedNames) {
  if (!options?.length) return null
  const exclude = excludedNames && excludedNames.size ? excludedNames : null
  const available = exclude ? options.filter((m) => !exclude.has((m.name || '').toLowerCase())) : options
  if (!available.length) return pickBestMatch(options, targetKcal)
  return pickBestMatch(available, targetKcal)
}

const CALORIE_MARGIN_LOW = 0.97
const CALORIE_MARGIN_HIGH = 1.03
const CORRECTION_MAX_ITERATIONS = 5

/**
 * Validatie- en correctielaag: breng dagtotaal binnen 97–103% van target.
 * Past porties aan (schaalt kcal en macro’s) met voorkeur voor koolhydraten en vetten; eiwit alleen indien nodig.
 */
function validateAndCorrectDay(meals, dailyCalorieTarget, macrosPerDay) {
  if (!meals?.length || dailyCalorieTarget <= 0) return { meals: meals || [], dayTotal: { kcal: 0, protein: 0, carbs: 0, fat: 0 } }

  const total = (list) => list.reduce((acc, m) => ({
    kcal: acc.kcal + (m.kcal || 0),
    protein: acc.protein + (m.protein || 0),
    carbs: acc.carbs + (m.carbs || 0),
    fat: acc.fat + (m.fat || 0),
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 })

  let current = meals.map((m) => ({
    ...m,
    kcal: m.kcal ?? 0,
    protein: m.protein ?? 0,
    carbs: m.carbs ?? 0,
    fat: m.fat ?? 0,
  }))
  let dayTotal = total(current)
  const targetLow = dailyCalorieTarget * CALORIE_MARGIN_LOW
  const targetHigh = dailyCalorieTarget * CALORIE_MARGIN_HIGH

  debugLog('day validation', {
    targetKcal: dailyCalorieTarget,
    generatedKcal: dayTotal.kcal,
    margin: `${CALORIE_MARGIN_LOW * 100}–${CALORIE_MARGIN_HIGH * 100}%`,
  })

  for (let iter = 0; iter < CORRECTION_MAX_ITERATIONS; iter++) {
    if (dayTotal.kcal >= targetLow && dayTotal.kcal <= targetHigh) {
      debugLog('day correction done', { iterations: iter, finalKcal: dayTotal.kcal, diff: dayTotal.kcal - dailyCalorieTarget })
      return { meals: current, dayTotal }
    }

    const factor = dailyCalorieTarget / (dayTotal.kcal || 1)
    current = current.map((m) => ({
      ...m,
      kcal: Math.round((m.kcal || 0) * factor),
      protein: Math.round((m.protein || 0) * factor),
      carbs: Math.round((m.carbs || 0) * factor),
      fat: Math.round((m.fat || 0) * factor),
    }))
    dayTotal = total(current)
  }

  debugLog('day correction final (max iterations)', { finalKcal: dayTotal.kcal, targetKcal: dailyCalorieTarget, diff: dayTotal.kcal - dailyCalorieTarget })
  return { meals: current, dayTotal }
}

/**
 * Bouwt één dag: dailyCalorieTarget is leidend. Maaltijdpercentages verdelen 100%.
 * Eerst maaltijden kiezen uit library, daarna validatie/correctie tot totaal binnen 97–103%.
 */
function buildDayMealsFromLibrary(dailyCalorieTarget, direction, input, dayIndex, numMeals = 5, macrosPerDay) {
  const mealPercentages = getMealPercentages(numMeals)
  const slots = getSlotsForMeals(numMeals)
  const allocation = mealPercentages.slice(0, slots.length)
  const sumPct = allocation.reduce((s, p) => s + p, 0)
  const normalized = sumPct > 0 ? allocation.map((p) => p / sumPct) : allocation

  const variance = (dayIndex * 31) % 120 - 60
  const targets = normalized.map((p, i) => Math.max(50, Math.round(p * dailyCalorieTarget) + Math.round((variance * (p * 10)) / 10)))

  const meals = []
  const chosenSnackNames = new Set()
  for (let i = 0; i < slots.length && i < targets.length; i++) {
    const slot = slots[i]
    const targetKcal = targets[i]
    const librarySlot = (slot === 'snack3' || slot === 'snack4') ? 'snack1' : slot
    const isSnack = slot.startsWith('snack')
    const options = getMealOptionsFromLibrary(direction, librarySlot, input)
    const chosen = isSnack
      ? pickBestMatchExcluding(options, targetKcal, chosenSnackNames)
      : pickBestMatch(options, targetKcal)
    if (chosen) {
      if (isSnack) chosenSnackNames.add((chosen.name || '').toLowerCase())
      meals.push({
        slot,
        meal: MEAL_LABELS_ARR[i] || 'Snack',
        name: chosen.name,
        kcal: chosen.kcal,
        protein: chosen.protein ?? 0,
        carbs: chosen.carbs ?? 0,
        fat: chosen.fat ?? 0,
        grams: chosen.grams ?? null,
      })
    }
  }

  let total = meals.reduce((acc, m) => ({
    kcal: acc.kcal + (m.kcal || 0),
    protein: acc.protein + (m.protein || 0),
    carbs: acc.carbs + (m.carbs || 0),
    fat: acc.fat + (m.fat || 0),
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 })

  let extraMealAdded = false
  if (total.kcal < dailyCalorieTarget * 0.92 && meals.length < 7) {
    const snackOpts = getMealOptionsFromLibrary(direction, 'snack1', input)
    const snackSlots = ['snack3', 'snack4']
    for (let s = 0; s < 2 && total.kcal < dailyCalorieTarget * 0.95; s++) {
      const gap = dailyCalorieTarget - total.kcal
      const extra = pickBestMatchExcluding(snackOpts, gap, chosenSnackNames)
      if (!extra || !(extra.kcal > 0)) break
      chosenSnackNames.add((extra.name || '').toLowerCase())
      const nextSlot = snackSlots[meals.length - 5] || 'snack3'
      meals.push({
        slot: nextSlot,
        meal: 'Snack',
        name: extra.name,
        kcal: extra.kcal,
        protein: extra.protein ?? 0,
        carbs: extra.carbs ?? 0,
        fat: extra.fat ?? 0,
        grams: extra.grams ?? null,
      })
      total = meals.reduce((acc, m) => ({
        kcal: acc.kcal + (m.kcal || 0),
        protein: acc.protein + (m.protein || 0),
        carbs: acc.carbs + (m.carbs || 0),
        fat: acc.fat + (m.fat || 0),
      }), { kcal: 0, protein: 0, carbs: 0, fat: 0 })
      extraMealAdded = true
    }
  }

  const { meals: correctedMeals, dayTotal: correctedTotal } = validateAndCorrectDay(meals, dailyCalorieTarget, macrosPerDay)
  return { meals: correctedMeals, dayTotal: correctedTotal, extraMealAdded }
}

/** Bouwt één week met 7 dagen. dailyCalorieTarget is leidend; correctielaag zorgt voor 97–103%. */
function buildOneWeek(input, nutritionGoal, direction, dailyKcal, weightKg, hasBodyInput, tdee, goalAdjustment, weekIndex) {
  const macros = hasBodyInput && weightKg
    ? calcMacrosFromCaloriesAndWeight(dailyKcal, weightKg, nutritionGoal)
    : caloriesToMacrosFallback(dailyKcal, getMacroSplit(nutritionGoal))
  const numMeals = Math.max(2, Math.min(6, Number(input?.meals_per_day) || 5))
  const days = []
  for (let d = 0; d < 7; d++) {
    const { meals, dayTotal, extraMealAdded } = buildDayMealsFromLibrary(dailyKcal, direction, input, d, numMeals, macros)
    days.push({
      dayNumber: d + 1,
      meals,
      dayTotal,
      extraMealAdded: extraMealAdded || undefined,
    })
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
  const numMeals = Math.max(2, Math.min(6, Number(input?.meals_per_day) || 5))
  const days = []
  for (let d = 0; d < 7; d++) {
    const { meals, dayTotal, extraMealAdded } = buildDayMealsFromLibrary(dailyKcal, direction, input, d, numMeals, macros)
    days.push({
      dayNumber: d + 1,
      meals,
      dayTotal,
      extraMealAdded: extraMealAdded || undefined,
    })
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
