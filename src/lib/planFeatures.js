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
  // Iedereen (starter+)
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

  // Premium only
  check_in_week_2_4: ['premium'],
  schema_adjusted_on_review: ['premium'],
  event_programs: ['premium'],
  priority_support_24h: ['premium'],
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
