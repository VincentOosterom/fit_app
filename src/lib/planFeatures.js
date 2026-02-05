/**
 * Plan types: starter (7.95), pro (9.99), premium (14.95)
 * Features gating: wat zit bij welk plan.
 */

export const PLAN_AMOUNTS = {
  starter: 795,
  pro: 999,
  premium: 1495,
}

export const PLAN_NAMES = {
  starter: 'Starter',
  pro: 'Pro',
  premium: 'Premium',
}

export const PLAN_FEATURES = {
  // Iedereen (starter+): alle plannen hebben volledig voedingsschema
  full_nutrition: ['starter', 'pro', 'premium'],
  schema_4weeks: ['starter', 'pro', 'premium'],
  week_review: ['starter', 'pro', 'premium'],
  follow_up_schema: ['starter', 'pro', 'premium'],
  basis_support: ['starter', 'pro', 'premium'],

  // Pro+
  example_meals_macros: ['pro', 'premium'],
  concrete_training_sessions: ['pro', 'premium'],
  supplement_advice: ['pro', 'premium'],
  export_pdf: ['pro', 'premium'],
  boodschappenlijst: ['pro', 'premium'],
  priority_schema: ['pro', 'premium'],
  email_support_48h: ['pro', 'premium'],
  progress_overview: ['pro', 'premium'],

  // Pro+ (event = wedstrijd/event toevoegen)
  event_programs: ['pro', 'premium'],

  // Premium only
  check_in_week_2_4: ['premium'],
  schema_adjusted_on_review: ['premium'],
  priority_support_24h: ['premium'],
}

/** Menselijke labels voor plan-pagina. Starter = alle voeding inbegrepen. */
export const PLAN_FEATURE_LABELS = {
  full_nutrition: 'Volledig voedingsschema (alle weken, voorbeeldmaaltijden)',
  schema_4weeks: '4-weekse schema\'s (voeding + training)',
  week_review: 'Weekevaluatie na elke week',
  follow_up_schema: 'Vervolg schema na week 4',
  basis_support: 'Basis support',
  example_meals_macros: 'Voorbeeldmaaltijden met macro\'s',
  concrete_training_sessions: 'Concrete trainingssessies',
  supplement_advice: 'Supplementadvies',
  export_pdf: 'Schema\'s als PDF exporteren',
  boodschappenlijst: 'Boodschappenlijst per week',
  priority_schema: 'Prioriteit bij schema-generatie',
  email_support_48h: 'E-mail support (binnen 48 uur)',
  progress_overview: 'Voortgangsoverzicht',
  check_in_week_2_4: 'Check-in na week 2 en 4',
  schema_adjusted_on_review: 'Schema aanpassing op basis van evaluatie',
  event_programs: 'Programma\'s voor evenementen',
  priority_support_24h: 'Prioriteit support (binnen 24 uur)',
  reset_schema: 'Schema resetten en opnieuw beginnen',
}

const PLAN_ORDER = { starter: 0, pro: 1, premium: 2 }

/** Is newPlan een upgrade t.o.v. currentPlan? */
export function isUpgrade(currentPlanKey, newPlanKey) {
  return (PLAN_ORDER[newPlanKey] ?? 0) > (PLAN_ORDER[currentPlanKey] ?? 0)
}

/** Features die je verliest bij downgrade van fromPlan naar toPlan. */
export function getFeaturesLost(fromPlan, toPlan) {
  const fromLevel = PLAN_ORDER[fromPlan] ?? 0
  const toLevel = PLAN_ORDER[toPlan] ?? 0
  if (toLevel >= fromLevel) return []
  const lost = []
  for (const [featureKey, plans] of Object.entries(PLAN_FEATURES)) {
    const hadIt = plans.includes(fromPlan)
    const hasIt = plans.includes(toPlan)
    if (hadIt && !hasIt) lost.push(PLAN_FEATURE_LABELS[featureKey] || featureKey)
  }
  if (fromPlan === 'premium' && toPlan !== 'premium') lost.push('Schema reset: onbeperkt → ' + (toPlan === 'pro' ? '1×' : 'niet'))
  if (fromPlan === 'pro' && toPlan === 'starter') lost.push('Schema reset: 1× → niet')
  return lost
}

/** Kan gebruiker schema resetten op basis van plan en restart_count? */
export function canResetSchema(planType, restartCount) {
  if (planType === 'starter') return { canReset: false, reason: 'Upgrade naar Pro of Premium om opnieuw te beginnen.' }
  if (planType === 'pro') return { canReset: (restartCount ?? 0) < 1, reason: (restartCount ?? 0) >= 1 ? 'Je hebt je schema al één keer gereset.' : null }
  return { canReset: true, reason: null }
}

export function hasFeature(planType, feature) {
  const plans = PLAN_FEATURES[feature]
  if (!plans) return false
  return plans.includes(planType)
}

export function getUpgradeMessage(feature) {
  const plans = PLAN_FEATURES[feature]
  if (!plans || plans.length === 0) return 'Neem een ander plan voor deze functie.'
  const top = plans[plans.length - 1]
  const name = PLAN_NAMES[top]
  return `Neem ${name} voor deze functie.`
}

/**
 * Welke weken zijn zichtbaar en klikbaar op voeding/trainingsschema, per plan.
 * @param {string} planType - 'starter' | 'pro' | 'premium'
 * @param {number[]} reviewedWeekNumbers - bijv. [1, 2] = week 1 en 2 geëvalueerd
 * @returns {{ visible: number[], clickable: number[] }}
 */
export function getWeekAccess(planType, reviewedWeekNumbers = []) {
  const count = reviewedWeekNumbers.length
  if (planType === 'premium') {
    return { visible: [1, 2, 3, 4], clickable: [1, 2, 3, 4] }
  }
  if (planType === 'starter') {
    const visibleCount = Math.min(4, 1 + count)
    const visible = [1, 2, 3, 4].slice(0, visibleCount)
    return { visible, clickable: visible }
  }
  if (planType === 'pro') {
    const clickable = [1, 2]
    if (count >= 1) clickable.push(3)
    if (count >= 2) clickable.push(4)
    return { visible: [1, 2, 3, 4], clickable }
  }
  return { visible: [1, 2, 3, 4], clickable: [1, 2, 3, 4] }
}
