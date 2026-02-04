/**
 * TrainLogic: voedingsrichtlijn per week met voorbeeldmaaltijden, kcal en macro's.
 * Weekgemiddelden + wat je kunt eten (voorbeelddag per week).
 */

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

// Voorbeeldmaaltijden per energieniveau (kcal + macro's per maaltijd)
const MEAL_EXAMPLES = {
  laag: {
    ontbijt: [
      { name: 'Havermout met banaan en noten', kcal: 320, protein: 10, carbs: 48, fat: 11 },
      { name: 'Griekse yoghurt met muesli', kcal: 280, protein: 18, carbs: 32, fat: 8 },
      { name: 'Eieren met volkorenbrood en avocado', kcal: 350, protein: 18, carbs: 28, fat: 18 },
    ],
    lunch: [
      { name: 'Salade met kip, quinoa en groenten', kcal: 420, protein: 35, carbs: 38, fat: 14 },
      { name: 'Volkoren wrap met hummus en groente', kcal: 380, protein: 14, carbs: 52, fat: 12 },
      { name: 'Soep met bruin brood en kaas', kcal: 400, protein: 16, carbs: 48, fat: 14 },
    ],
    avond: [
      { name: 'Zalm met zoete aardappel en broccoli', kcal: 520, protein: 38, carbs: 42, fat: 22 },
      { name: 'Kipfilet met rijst en groenten', kcal: 480, protein: 42, carbs: 48, fat: 12 },
      { name: 'Linzenstoof met volkorenrijst', kcal: 450, protein: 20, carbs: 68, fat: 10 },
    ],
    snack: [
      { name: 'Kwark of fruit', kcal: 120, protein: 12, carbs: 12, fat: 2 },
      { name: 'Noten of rijstwafel met pindakaas', kcal: 150, protein: 6, carbs: 10, fat: 11 },
    ],
  },
  medium: {
    ontbijt: [
      { name: 'Havermout met banaan, noten en honing', kcal: 400, protein: 12, carbs: 58, fat: 14 },
      { name: 'Griekse yoghurt met muesli en fruit', kcal: 360, protein: 22, carbs: 42, fat: 10 },
      { name: 'Eieren met volkorenbrood, avocado en tomaat', kcal: 420, protein: 22, carbs: 34, fat: 22 },
    ],
    lunch: [
      { name: 'Salade met kip, quinoa, noten en dressing', kcal: 520, protein: 40, carbs: 44, fat: 18 },
      { name: 'Volkoren wrap met kip, hummus en groente', kcal: 480, protein: 32, carbs: 52, fat: 16 },
      { name: 'Pasta met tonijn en groenten', kcal: 550, protein: 28, carbs: 62, fat: 20 },
    ],
    avond: [
      { name: 'Zalm met zoete aardappel, broccoli en olie', kcal: 620, protein: 42, carbs: 48, fat: 28 },
      { name: 'Kipfilet met aardappel en groenten', kcal: 560, protein: 48, carbs: 52, fat: 16 },
      { name: 'Rundergehakt met rijst en salade', kcal: 580, protein: 38, carbs: 54, fat: 22 },
    ],
    snack: [
      { name: 'Kwark met noten en fruit', kcal: 180, protein: 16, carbs: 18, fat: 6 },
      { name: 'Smoothie met banaan en pindakaas', kcal: 220, protein: 8, carbs: 28, fat: 10 },
    ],
  },
  hoog: {
    ontbijt: [
      { name: 'Havermout met banaan, noten, honing en pindakaas', kcal: 520, protein: 18, carbs: 62, fat: 22 },
      { name: 'Griekse yoghurt met muesli, fruit en noten', kcal: 450, protein: 26, carbs: 50, fat: 16 },
      { name: 'Eieren met volkorenbrood, avocado, kaas', kcal: 500, protein: 26, carbs: 38, fat: 26 },
    ],
    lunch: [
      { name: 'Salade met kip, quinoa, noten, kaas en dressing', kcal: 620, protein: 46, carbs: 48, fat: 24 },
      { name: 'Volkoren wrap met kip, hummus, avocado', kcal: 560, protein: 38, carbs: 52, fat: 22 },
      { name: 'Pasta met tonijn, groenten en olie', kcal: 640, protein: 32, carbs: 68, fat: 26 },
    ],
    avond: [
      { name: 'Zalm met zoete aardappel, broccoli, olie en noten', kcal: 720, protein: 44, carbs: 54, fat: 36 },
      { name: 'Kipfilet met aardappel, groenten en saus', kcal: 660, protein: 52, carbs: 58, fat: 24 },
      { name: 'Biefstuk met rijst, groenten en boter', kcal: 680, protein: 46, carbs: 56, fat: 28 },
    ],
    snack: [
      { name: 'Kwark met noten, fruit en muesli', kcal: 260, protein: 20, carbs: 26, fat: 10 },
      { name: 'Smoothie met banaan, pindakaas en melk', kcal: 320, protein: 14, carbs: 38, fat: 14 },
    ],
  },
}

const MEAL_SLOTS = ['ontbijt', 'lunch', 'avond', 'snack1', 'snack2']

/** Geeft alle alternatieven voor een maaltijdslot (voor "kies iets anders"). */
export function getMealOptions(energyLevel, mealSlot) {
  const meals = MEAL_EXAMPLES[energyLevel] || MEAL_EXAMPLES.medium
  if (mealSlot === 'snack1' || mealSlot === 'snack2') {
    return [...(meals.snack || [])]
  }
  const key = mealSlot === 'avond' ? 'avond' : mealSlot
  return [...(meals[key] || [])]
}

function pickExampleDay(energyLevel) {
  const meals = MEAL_EXAMPLES[energyLevel] || MEAL_EXAMPLES.medium
  return {
    ontbijt: meals.ontbijt[0],
    lunch: meals.lunch[0],
    avond: meals.avond[0],
    snack1: meals.snack[0],
    snack2: meals.snack[1],
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
    const totalExample = [
      exampleDay.ontbijt,
      exampleDay.lunch,
      exampleDay.avond,
      exampleDay.snack1,
      exampleDay.snack2,
    ].reduce((acc, m) => ({ kcal: acc.kcal + m.kcal, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }), { kcal: 0, protein: 0, carbs: 0, fat: 0 })

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
        { meal: 'Ontbijt', ...exampleDay.ontbijt },
        { meal: 'Lunch', ...exampleDay.lunch },
        { meal: 'Avondeten', ...exampleDay.avond },
        { meal: 'Snack', ...exampleDay.snack1 },
        { meal: 'Snack', ...exampleDay.snack2 },
      ],
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
