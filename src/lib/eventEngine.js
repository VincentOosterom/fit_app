/**
 * Event & Wedstrijd module – rule-based, uitbreidbaar.
 * Periodisering, taper, wedstrijdvoeding (carb load, racedag, herstel).
 */

export const EVENT_TYPES = [
  { value: 'marathon', label: 'Marathon' },
  { value: 'halve_marathon', label: 'Halve marathon' },
  { value: '10km', label: '10 km' },
  { value: '5km', label: '5 km' },
  { value: 'triathlon', label: 'Triathlon' },
  { value: 'hyrox', label: 'Hyrox' },
  { value: 'wedstrijd', label: 'Wedstrijd (overig)' },
  { value: 'sportdag', label: 'Sportdag / evenement' },
  { value: 'anders', label: 'Anders' },
]

export const PRESTATIEDOELEN = [
  { value: 'finishen', label: 'Finishen' },
  { value: 'pr', label: 'PR / persoonlijk record' },
  { value: 'tijd', label: 'Specifieke tijd' },
  { value: 'plezier', label: 'Plezier / meedoen' },
]

/** Weken tot event (vanaf vandaag). */
export function getWeeksUntilEvent(eventDate) {
  if (!eventDate) return null
  const d = typeof eventDate === 'string' ? new Date(eventDate) : eventDate
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  const diff = Math.ceil((d - today) / (7 * 24 * 60 * 60 * 1000))
  return diff < 0 ? 0 : diff
}

/** Fase op basis van weken tot event: base, build, peak, taper, race. */
export function getPeriodizationPhase(weeksUntil) {
  if (weeksUntil == null || weeksUntil < 0) return null
  if (weeksUntil === 0) return { phase: 'race', label: 'Wedstrijddag', focus: 'Rust, koolhydraten, pacing' }
  if (weeksUntil <= 1) return { phase: 'taper', label: 'Taper', focus: 'Volume omlaag, intensiteit behouden, herstel' }
  if (weeksUntil <= 3) return { phase: 'peak', label: 'Peak', focus: 'Specifieke intensiteit, simulaties' }
  if (weeksUntil <= 6) return { phase: 'build', label: 'Opbouw', focus: 'Volume en intensiteit opbouwen' }
  return { phase: 'base', label: 'Basis', focus: 'Duur en techniek' }
}

/** Aantal taperweken (rule: 1–2 weken voor korte wedstrijd, 2–3 voor marathon). */
export function getTaperWeeks(eventType, weeksUntil) {
  if (weeksUntil <= 0) return 0
  const isLong = ['marathon', 'halve_marathon', 'triathlon'].includes(eventType)
  return isLong ? Math.min(3, weeksUntil) : Math.min(2, weeksUntil)
}

/** Carb loading: 2–3 dagen voor wedstrijd, hogere koolhydraten. */
export function getCarbLoadPlan(eventType) {
  const days = ['marathon', 'halve_marathon', 'triathlon'].includes(eventType) ? 3 : 2
  return {
    dagenVoorWedstrijd: days,
    richtlijn: `${days} dagen voor de wedstrijd: verhoog koolhydraten naar ca. 7–8 g/kg, beperk vet en vezels licht. Eet bekend voedsel.`,
    voorbeeld: days === 3
      ? 'Dag -3: normaal. Dag -2 en -1: meer brood, pasta, rijst, fruit; lichte maaltijden de avond voor de wedstrijd.'
      : 'Dag -2 en -1: extra koolhydraten bij elke maaltijd; geen zware of vette maaltijd de avond ervoor.',
  }
}

/** Racedag voeding (rule-based). */
export function getRaceDayNutrition(eventType, durationMinutes) {
  const isLong = (durationMinutes ?? 0) > 90 || ['marathon', 'halve_marathon', 'triathlon'].includes(eventType)
  return {
    ontbijt: isLong
      ? '2–3 uur voor start: licht ontbijt (brood, banaan, eventueel beetje pindakaas). Geen nieuw voedsel.'
      : '1–1,5 uur voor start: lichte koolhydraatrijke snack of klein ontbijt.',
    onderweg: isLong ? 'Neem elk 45–60 min gel of sportdrank; water bij dorst.' : 'Water; bij >45 min eventueel gel of sportdrank.',
    naFinish: 'Binnen 30–45 min: koolhydraten + eiwit (recovery shake, banaan + kwark, of maaltijd).',
  }
}

/** Herstelvoeding na wedstrijd. */
export function getRecoveryNutrition(eventType) {
  return {
    dag1: 'Eiwitrijk + voldoende koolhydraten. Geen zware training. Hydrateren.',
    dag2_3: 'Normale voeding, herstelmaaltijden. Rustige beweging mag.',
    week1: 'Geleidelijk terug naar je normale schema; luister naar je lichaam.',
  }
}

/** Simpele readiness score (0–100) op basis van ingestelde velden. Placeholder voor latere koppeling aan week_reviews. */
export function getReadinessScore(weeksUntil, phase, blockReviewsCount) {
  if (weeksUntil === 0) return 100
  const phaseScore = { base: 40, build: 55, peak: 75, taper: 90, race: 100 }[phase?.phase] ?? 50
  const reviewBonus = Math.min(20, (blockReviewsCount ?? 0) * 5)
  return Math.min(100, phaseScore + reviewBonus)
}
