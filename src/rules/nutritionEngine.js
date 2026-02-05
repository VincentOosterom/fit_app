/**
 * TrainLogic: voedingsrichtlijn per week met voorbeeldmaaltijden, kcal en macro's.
 * Weekgemiddelden + wat je kunt eten (voorbeelddag per week).
 * Maaltijden komen uit de food library (~50 opties).
 */

import { getMealOptionsFromLibrary, FOOD_LIBRARY } from '../lib/foodLibrary'

// Per week energie-richting
function getWeeklyEnergyDirection(nutritionGoal) {
  if (nutritionGoal === 'vetverlies')
    return ['laag', 'laag', 'medium', 'medium']
  if (nutritionGoal === 'prestatie')
    return ['medium', 'hoog', 'hoog', 'medium']
  return ['medium', 'medium', 'medium', 'medium']
}

function getWeeklyCalories(input, energyLevel) {
  const base = 2000
  if (energyLevel === 'laag') return Math.round(base * 0.85)
  if (energyLevel === 'hoog') return Math.round(base * 1.15)
  return Math.round(base)
}

// Macro-verhouding (eiwit/koolhydraten/vet) per doel
function getMacroSplit(nutritionGoal) {
  if (nutritionGoal === 'vetverlies') return { protein: 0.35, carbs: 0.40, fat: 0.25 }
  if (nutritionGoal === 'prestatie') return { protein: 0.25, carbs: 0.50, fat: 0.25 }
  return { protein: 0.30, carbs: 0.45, fat: 0.25 }
}

function caloriesToMacros(kcal, split) {
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

/** Geeft alle alternatieven voor een maaltijdslot (voor "kies iets anders") — uit food library. */
export function getMealOptions(energyLevel, mealSlot) {
  return getMealOptionsFromLibrary(energyLevel, mealSlot)
}

function pickExampleDay(energyLevel) {
  const snackOpts = getMealOptionsFromLibrary(energyLevel, 'snack1')
  return {
    ontbijt: getMealOptionsFromLibrary(energyLevel, 'ontbijt')[0] || null,
    lunch: getMealOptionsFromLibrary(energyLevel, 'lunch')[0] || null,
    avond: getMealOptionsFromLibrary(energyLevel, 'avond')[0] || null,
    snack1: snackOpts[0] || null,
    snack2: snackOpts[1] || snackOpts[0] || null,
  }
}

export function buildNutritionPlan(input) {
  const nutritionGoal = input.nutrition_goal || 'onderhoud'
  const split = getMacroSplit(nutritionGoal)
  const energyByWeek = getWeeklyEnergyDirection(nutritionGoal)
  const weeks = []

  for (let w = 0; w < 4; w++) {
    const direction = energyByWeek[w] || 'medium'
    const dailyKcal = getWeeklyCalories(input, direction)
    const macros = caloriesToMacros(dailyKcal, split)
    const exampleDay = pickExampleDay(direction)
    const mealsForTotal = [
      exampleDay.ontbijt,
      exampleDay.lunch,
      exampleDay.avond,
      exampleDay.snack1,
      exampleDay.snack2,
    ].filter(Boolean)
    const totalExample = mealsForTotal.reduce((acc, m) => ({ kcal: acc.kcal + m.kcal, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }), { kcal: 0, protein: 0, carbs: 0, fat: 0 })

    const weekTip = direction === 'laag'
      ? 'Spreid je maaltijden; eet voldoende eiwit om spiermassa te behouden.'
      : direction === 'hoog'
        ? 'Eet voldoende koolhydraten rond training; neem een extra snack indien nodig.'
        : 'Houd het weekgemiddelde aan; een dag iets meer of minder is geen probleem.'
    weeks.push({
      weekNumber: w + 1,
      weekName: `Week ${w + 1}`,
      energyDirection: direction,
      averageCaloriesPerDay: dailyKcal,
      macrosPerDay: macros,
      note: direction === 'laag' ? 'Weekgemiddelde. Geen dagrestrictie.' : null,
      weekTip,
      exampleMeals: [
        exampleDay.ontbijt && { meal: 'Ontbijt', ...exampleDay.ontbijt },
        exampleDay.lunch && { meal: 'Lunch', ...exampleDay.lunch },
        exampleDay.avond && { meal: 'Avondeten', ...exampleDay.avond },
        exampleDay.snack1 && { meal: 'Snack', ...exampleDay.snack1 },
        exampleDay.snack2 && { meal: 'Snack', ...exampleDay.snack2 },
      ].filter(Boolean),
      exampleDayTotal: totalExample,
    })
  }

  return {
    generatedAt: new Date().toISOString(),
    nutritionGoal,
    dietaryNote: input.dietary_prefs || null,
    restrictions: input.restrictions || null,
    weeks,
  }
}

export { MEAL_SLOTS, MEAL_EXAMPLES }

/** Labels voor admin-overzicht */
export const MEAL_SLOT_LABELS = { ontbijt: 'Ontbijt', lunch: 'Lunch', avond: 'Avondeten', snack: 'Snack' }
