/**
 * Motivatiequotes voor de dashboard-carousel.
 * Zakelijk en sportief, geen hype (TrainLogic-stijl).
 */

export const MOTIVATION_QUOTES = [
  'Consistentie wint van intensiteit.',
  'Progressie gaat per week, niet per dag.',
  'Herstel is onderdeel van het plan.',
  'Eén training minder is geen reden om op te geven.',
  'Weekgemiddelden tellen meer dan één perfecte dag.',
  'Bouw rustig op — je lichaam past zich aan.',
  'Structuur geeft ruimte voor progressie.',
  'Vaste momenten maken het vol te houden.',
  'Kleine stappen zijn nog steeds vooruitgang.',
  'Plan je rust zoals je je training plant.',
  'Voeding ondersteunt je doelen; het is geen straf.',
  'Vergelijk je met gisteren, niet met een ander.',
  'Vier de weken die je volhoudt.',
  'Een slechte week maakt je schema niet slecht.',
  'Blijf bij het plan; pas na een blok bij.',
]

/** Willekeurige quote voor carousel. */
export function getRandomQuote() {
  return MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)]
}
