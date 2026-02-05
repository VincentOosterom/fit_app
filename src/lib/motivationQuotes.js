/**
 * Motivatiequotes voor de dashboard-carousel.
 * Mix van fitness, mindset en algemene inspiratie (TrainLogic-stijl).
 */

export const MOTIVATION_QUOTES = [
  /* Fitness & training */
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
  'Sterker worden gaat over jaren, niet over weken.',
  'Rust is geen luiheid; het is onderdeel van het programma.',
  /* Mindset & algemeen */
  'Begin. De rest volgt.',
  'Niet perfect, wel gedaan.',
  'Discipline is kiezen wat je op de lange termijn wilt boven wat je nu wilt.',
  'Je hoeft niet de beste te zijn; je hoeft beter te worden dan gisteren.',
  'Wat je vandaag doet, telt over een jaar.',
  'Kleine gewoontes, groot effect.',
  'Focus op het proces; de uitkomst komt vanzelf.',
  'Stop met vergelijken. Start met doen.',
  'De enige slechte training is de training die je niet doet.',
  'Twijfel is normaal. Doorgaan is de keuze.',
  'Rust wanneer je moet, niet wanneer je opgeeft.',
  'Je bent sterker dan je denkt.',
  'Elke dag een beetje is beter dan één keer alles.',
  'Geen excuus, geen uitstel.',
  'Het gaat niet om motivatie; het gaat om gewoonte.',
]

/** Willekeurige quote voor carousel. */
export function getRandomQuote() {
  return MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)]
}
