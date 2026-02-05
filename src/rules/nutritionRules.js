/**
 * Rule-based nutrition calculations. Deterministic, no AI.
 * - BMR: Mifflin-St Jeor
 * - TDEE: BMR × activity multiplier + training expenditure
 * - Goal-based calorie adjustment
 * - Macro distribution: protein 1.8–2.2 g/kg, fat 0.8–1 g/kg, carbs = remainder
 * - Carb cycling: more carbs on training days
 */

/** Activity multipliers (PAL) for TDEE. Based on days_per_week + sedentary baseline. */
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,       // weinig beweging
  light: 1.375,        // 1–2 dagen licht actief
  moderate: 1.55,       // 3–4 dagen matig actief
  active: 1.725,       // 5–6 dagen actief
  veryActive: 1.9,    // 7 dagen of zwaar werk
}

/**
 * BMR volgens Mifflin-St Jeor (kcal/dag).
 * @param {number} weightKg
 * @param {number} heightCm
 * @param {number} age
 * @param {string} sex - 'm' | 'v' | 'x' (x = gemiddelde formule)
 */
export function calcBMR(weightKg, heightCm, age, sex) {
  if (!weightKg || !heightCm || !age) return null
  const w = weightKg
  const h = heightCm
  const a = age
  if (sex === 'm') return 10 * w + 6.25 * h - 5 * a + 5
  if (sex === 'v') return 10 * w + 6.25 * h - 5 * a - 161
  return (10 * w + 6.25 * h - 5 * a + 5 + (10 * w + 6.25 * h - 5 * a - 161)) / 2
}

/**
 * Activity level uit days_per_week (training) + algemene beweging.
 * @param {number} daysPerWeek - trainingsdagen
 */
export function getActivityMultiplier(daysPerWeek) {
  const d = Math.min(7, Math.max(0, Number(daysPerWeek) ?? 3))
  if (d <= 1) return ACTIVITY_MULTIPLIERS.sedentary
  if (d <= 2) return ACTIVITY_MULTIPLIERS.light
  if (d <= 4) return ACTIVITY_MULTIPLIERS.moderate
  if (d <= 6) return ACTIVITY_MULTIPLIERS.active
  return ACTIVITY_MULTIPLIERS.veryActive
}

/**
 * Geschatte kcal per trainingssessie (minuten × factor). Rule: ~5–8 kcal/min afhankelijk van intensiteit.
 * @param {number} sessionMinutes
 * @param {number} sessionsPerWeek
 */
export function getWeeklyTrainingKcal(sessionMinutes, sessionsPerWeek) {
  const min = Math.min(180, Math.max(0, Number(sessionMinutes) ?? 60))
  const sessions = Math.min(7, Math.max(0, Number(sessionsPerWeek) ?? 3))
  const kcalPerMin = 6
  return min * sessions * kcalPerMin
}

/**
 * TDEE (kcal/dag, weekgemiddelde). BMR × PAL + (wekelijke training kcal / 7).
 */
export function calcTDEE(input) {
  const bmr = calcBMR(
    input.weight_kg,
    input.height_cm,
    input.age,
    input.sex
  )
  if (bmr == null) return null
  const pal = getActivityMultiplier(input.days_per_week)
  const tdeeBase = bmr * pal
  const weeklyTrainingKcal = getWeeklyTrainingKcal(input.session_minutes, input.days_per_week)
  const dailyTrainingKcal = weeklyTrainingKcal / 7
  return Math.round(tdeeBase + dailyTrainingKcal)
}

/**
 * Doelgebaseerde aanpassing van calorieën t.o.v. TDEE.
 * - vetverlies: -15 tot -20%
 * - prestatie / spieropbouw: +10%
 * - onderhoud: 0%
 */
export function getGoalCalorieAdjustment(nutritionGoal) {
  switch (nutritionGoal) {
    case 'vetverlies':
      return { factor: 0.82, label: '−18%', description: 'licht calorietekort voor vetverlies met behoud van spiermassa' }
    case 'prestatie':
      return { factor: 1.10, label: '+10%', description: 'licht overschot voor prestatie en herstel' }
    default:
      return { factor: 1.0, label: '0%', description: 'onderhoud: energie-inname gelijk aan verbruik' }
  }
}

/**
 * Macro-verdeling (gram per kg lichaamsgewicht per dag).
 * - Eiwit: 1,8–2,2 g/kg (vetverlies/prestatie iets hoger)
 * - Vet: 0,8–1 g/kg
 * - Koolhydraten: resterende kcal (4 kcal/g)
 */
export function getMacroRulesPerKg(nutritionGoal) {
  const proteinPerKg = nutritionGoal === 'vetverlies' || nutritionGoal === 'prestatie' ? 2.0 : 1.8
  const fatPerKg = 0.9
  return { proteinPerKg, fatPerKg }
}

/**
 * Bereken macro's in grammen uit calorieën en gewicht.
 * Eerst eiwit en vet vast (g/kg), dan koolhydraten = rest.
 */
export function calcMacrosFromCaloriesAndWeight(dailyKcal, weightKg, nutritionGoal) {
  const { proteinPerKg, fatPerKg } = getMacroRulesPerKg(nutritionGoal)
  const protein = Math.round(proteinPerKg * weightKg)
  const fat = Math.round(fatPerKg * weightKg)
  const proteinKcal = protein * 4
  const fatKcal = fat * 9
  const carbsKcal = Math.max(0, dailyKcal - proteinKcal - fatKcal)
  const carbs = Math.round(carbsKcal / 4)
  return { protein, carbs, fat }
}

/**
 * Carb cycling: factor voor koolhydraten op trainingsdag vs rustdag.
 * Trainingdag: 1.1–1.15, rustdag: 0.9–0.95 (weekgemiddelde blijft gelijk).
 */
export function getCarbCycleFactors(daysPerWeek) {
  const d = Math.min(7, Math.max(1, Number(daysPerWeek) ?? 3))
  if (d >= 5) return { trainingDay: 1.12, restDay: 0.88 }
  if (d >= 3) return { trainingDay: 1.10, restDay: 0.90 }
  return { trainingDay: 1.05, restDay: 0.95 }
}

/**
 * Rationale (uitleg) per week voor het voedingsschema. Rule-based, Nederlands.
 */
export function getNutritionWeekRationale(weekIndex, nutritionGoal, energyDirection, dailyKcal, tdee, goalAdjustment) {
  const weekNum = weekIndex + 1
  const goals = {
    vetverlies: 'vetverlies',
    prestatie: 'prestatie en herstel',
    onderhoud: 'onderhoud',
  }
  const goalLabel = goals[nutritionGoal] || 'onderhoud'
  const base = `Week ${weekNum} sluit aan bij je doel (${goalLabel}). `
  if (weekNum === 1) {
    return base + `We starten met ${dailyKcal} kcal per dag (gemiddeld). Dit is gebaseerd op je TDEE (ca. ${tdee ?? '—'} kcal) ${goalAdjustment ? `met een aanpassing van ${goalAdjustment.label} voor je doel.` : '.'} De eerste week is een stabiele basis om aan te wennen.`
  }
  if (weekNum === 2) {
    return base + `Het weekgemiddelde van ${dailyKcal} kcal wordt volgehouden. Je lichaam past zich aan; we vermijden grote schommelingen. Eiwit blijft hoog voor behoud of opbouw van spiermassa.`
  }
  if (weekNum === 3) {
    return base + `We blijven op ${dailyKcal} kcal. Na twee weken kunnen we je voortgang (gewicht, energie) in de weekevaluatie meenemen. Koolhydraten rond je trainingen ondersteunen je prestaties.`
  }
  if (weekNum === 4) {
    return base + `Week 4: we handhaven ${dailyKcal} kcal. Dit sluit aan bij het einde van de trainingsperiode (vaak een lichtere week). Na week 4 kun je in de evaluatie aangeven of je een vervolg wilt en of we iets moeten bijstellen.`
  }
  return base + `Gemiddeld ${dailyKcal} kcal per dag.`
}
