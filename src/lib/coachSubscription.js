/**
 * Coach abonnementsstructuur: drie niveaus met max klanten en role-based features.
 * Uitbreidbaar: voeg keys toe aan COACH_FEATURES en COACH_FEATURE_LABELS.
 */

export const COACH_TIERS = ['starter', 'pro', 'premium']

export const COACH_TIER_NAMES = {
  starter: 'Starter',
  pro: 'Pro',
  premium: 'Premium',
}

/** Max aantal klanten per tier; null = onbeperkt */
export const COACH_CLIENT_LIMITS = {
  starter: 10,
  pro: 50,
  premium: null,
}

/**
 * Welke features heeft welk coach-abonnement?
 * Feature key -> array van tiers die deze feature hebben.
 */
export const COACH_FEATURES = {
  // Starter
  max_clients_starter: ['starter', 'pro', 'premium'],
  basis_schema_generator: ['starter', 'pro', 'premium'],
  basis_voedingsrichtlijnen: ['starter', 'pro', 'premium'],
  progress_tracking: ['starter', 'pro', 'premium'],

  // Pro
  max_clients_pro: ['pro', 'premium'],
  adaptive_schema_engine: ['pro', 'premium'],
  event_trainingsprogrammas: ['pro', 'premium'],
  messaging: ['pro', 'premium'],
  analytics: ['pro', 'premium'],
  automatiseringen: ['pro', 'premium'],

  // Premium
  max_clients_unlimited: ['premium'],
  white_label: ['premium'],
  team_coaching: ['premium'],
  advanced_analytics: ['premium'],
  business_tools: ['premium'],
  integraties: ['premium'],
}

/** Menselijke labels voor coach-features (UI, vergelijk-tabel) */
export const COACH_FEATURE_LABELS = {
  max_clients_starter: 'Max 10 klanten',
  basis_schema_generator: 'Basis schema generator',
  basis_voedingsrichtlijnen: 'Basis voedingsrichtlijnen',
  progress_tracking: 'Progress tracking',

  max_clients_pro: 'Max 50 klanten',
  adaptive_schema_engine: 'Adaptive schema engine',
  event_trainingsprogrammas: 'Event trainingsprogramma\'s',
  messaging: 'Messaging',
  analytics: 'Analytics',
  automatiseringen: 'Automatiseringen',

  max_clients_unlimited: 'Onbeperkt klanten',
  white_label: 'White label opties',
  team_coaching: 'Team coaching',
  advanced_analytics: 'Advanced analytics',
  business_tools: 'Business tools',
  integraties: 'Integraties',
}

const COACH_TIER_ORDER = { starter: 0, pro: 1, premium: 2 }

/** Heeft deze coach-tier toegang tot deze feature? */
export function hasCoachFeature(tier, feature) {
  if (!tier || !feature) return false
  const tiers = COACH_FEATURES[feature]
  if (!tiers) return false
  return tiers.includes(tier)
}

/** Max aantal klanten voor deze tier; null = onbeperkt */
export function getCoachClientLimit(tier) {
  return COACH_CLIENT_LIMITS[tier] ?? null
}

/** Mag deze coach nog een klant toevoegen? */
export function canAddCoachClient(tier, currentClientCount) {
  const limit = getCoachClientLimit(tier)
  if (limit === null) return { allowed: true, limit: null }
  return {
    allowed: currentClientCount < limit,
    limit,
    remaining: Math.max(0, limit - currentClientCount),
  }
}

/** Upgrade-bericht voor een feature (laagste tier die het heeft) */
export function getCoachUpgradeMessage(feature) {
  const tiers = COACH_FEATURES[feature]
  if (!tiers || tiers.length === 0) return 'Upgrade je coach-abonnement voor deze functie.'
  const tier = tiers[0]
  return `Upgrade naar ${COACH_TIER_NAMES[tier]} voor deze functie.`
}

/** Alle feature keys (voor vergelijk-tabellen / uitbreidbaar) */
export function getCoachFeatureKeys() {
  return Object.keys(COACH_FEATURES)
}

/** Is tier A een upgrade t.o.v. tier B? */
export function isCoachTierUpgrade(fromTier, toTier) {
  return (COACH_TIER_ORDER[toTier] ?? 0) > (COACH_TIER_ORDER[fromTier] ?? 0)
}
