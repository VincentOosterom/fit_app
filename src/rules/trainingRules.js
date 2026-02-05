/**
 * Rule-based training rules. Deterministic, no AI.
 * - Periodization: 4-week mesocycles (Base/Volume/Intensity/Deload or Taper)
 * - Progressive overload: week 4 volume -20% to -30%
 * - Session split by days per week: 1-2 Full body, 3-4 Upper/Lower, 5-6 PPL, 7 Rotating
 * - Intensity: RPE targets, rest recommendations
 */

/** Split type by training days per week */
export const SPLIT_BY_DAYS = {
  1: 'full_body',
  2: 'full_body',
  3: 'upper_lower',
  4: 'upper_lower',
  5: 'push_pull_legs',
  6: 'push_pull_legs',
  7: 'rotating',
}

export function getSplitType(daysPerWeek) {
  const d = Math.min(7, Math.max(1, Number(daysPerWeek) ?? 3))
  return SPLIT_BY_DAYS[d] || 'upper_lower'
}

/** Week 4 volume reduction (deload): 20-30% */
export const DELOAD_VOLUME_FACTOR = 0.75

/** Progressive overload: week 2 and 3 slightly higher volume than week 1 */
export function getWeekVolumeMultipliers(goal) {
  const g = ['kracht_endurance', 'sportevenement'].includes(goal) ? 'prestatie' : goal
  const isDeloadFourth = ['prestatie', 'spieropbouw', 'onderhoud', 'conditie', 'kracht_endurance', 'sportevenement', 'fit_vanaf_nul', 'marathon', 'hyrox'].includes(g)
  if (isDeloadFourth) return [1.0, 1.07, 1.07, DELOAD_VOLUME_FACTOR]
  return [1.0, 1.05, 1.05, 1.0]
}

/** RPE (1-10) per phase. Rule-based. */
export function getRPEForPhase(phaseLabel, weekIndex) {
  const p = (phaseLabel || '').toLowerCase()
  if (p.includes('deload') || p.includes('taper') || p.includes('stabilisatie')) return { min: 6, max: 7, note: 'Rustig aan voor herstel' }
  if (p.includes('techniek') || p.includes('basis')) return { min: 6, max: 7, note: 'Focus op techniek, niet op max' }
  if (p.includes('volume')) return { min: 7, max: 8, note: 'Zwaar maar haalbaar' }
  if (p.includes('intensiteit')) return { min: 8, max: 9, note: 'Laatste set(s) tot nabij falen' }
  return { min: 7, max: 8, note: '' }
}

/** Rest tussen sets (seconden) per type */
export function getRestSeconds(sessionType) {
  const t = (sessionType || '').toLowerCase()
  if (t.includes('kracht') || t.includes('volume')) return 90
  if (t.includes('metabolisch') || t.includes('interval')) return 30
  if (t.includes('duur')) return 0
  return 60
}

/**
 * Rationale (uitleg) per week voor het trainingsschema. Rule-based, Nederlands.
 */
export function getTrainingWeekRationale(weekIndex, focus, volumeMinutes, volumeMultiplier, goal, daysPerWeek) {
  const weekNum = weekIndex + 1
  const splitType = getSplitType(daysPerWeek)
  const splitLabel = splitType === 'full_body' ? 'full body' : splitType === 'upper_lower' ? 'upper/lower' : splitType === 'push_pull_legs' ? 'push/pull/benen' : 'roterend'
  const isDeload = volumeMultiplier < 1

  if (weekNum === 1) {
    return `Week 1 is de basis: we starten met ${focus || 'techniek en opbouw'}. Het volume (ca. ${Math.round(volumeMinutes / 60)}u) en je ${splitLabel}-indeling sluiten aan op ${daysPerWeek} training(s) per week. We vermijden te snel te veel; zo voorkom je blessures en bouw je een stabiele basis.`
  }
  if (weekNum === 2) {
    return `Week 2: we bouwen licht op in volume (progressieve overload). Focus blijft ${focus || 'volume'}. Je lichaam past zich aan; dezelfde ${splitLabel}-structuur houdt het overzichtelijk. Alle sessies blijven binnen de afgesproken minuten.`
  }
  if (weekNum === 3) {
    return `Week 3 is de zwaarste week: hoogste volume en intensiteit (${focus || 'intensiteit'}). Dit past bij een 4-weeks mesocyclus. Na deze week volgt bewust een lichtere week. RPE en rust tussen sets zijn afgestemd op dit blok.`
  }
  if (weekNum === 4) {
    if (isDeload) {
      return `Week 4 is een deload: we verlagen het volume met ca. 25% zodat je kunt herstellen. Dit vermindert het risico op overtraining en bereidt je voor op een volgend blok of een event. ${focus || 'Stabilisatie'} staat centraal. Na week 4 vul je de evaluatie in; dan kunnen we het volgende schema eventueel aanpassen.`
    }
    return `Week 4: we stabiliseren. Het volume blijft gelijk aan week 3 of iets lager. Focus: ${focus || 'stabilisatie'}. Na deze week kun je in de evaluatie aangeven of je een vervolg wilt en of we iets moeten wijzigen.`
  }
  return `Week ${weekNum}: ${focus || '—'}. Volume ca. ${Math.round(volumeMinutes / 60)}u. ${splitLabel}.`
}
