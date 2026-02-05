/**
 * Welkom-teksten voor ingelogde gebruikers op het dashboard.
 * Er wordt willekeurig één gekozen (of op basis van tijd/dag).
 */

export const WELCOME_GREETINGS = [
  'Welkom terug.',
  'Welkom terug, goed je weer te zien.',
  'Welkom terug. We gaan ervoor.',
  'Welkom terug. Fijn dat je er bent.',
]

export const WELCOME_FOLLOWUPS = [
  'Gaat het nog goed?',
  'Hoe gaat het vandaag?',
  'Alles goed?',
  'Hoe voel je je?',
  'Staat je schema nog goed?',
]

/** Geeft een willekeurige welkomstgroet. */
export function getRandomWelcome() {
  const greeting = WELCOME_GREETINGS[Math.floor(Math.random() * WELCOME_GREETINGS.length)]
  const followUp = WELCOME_FOLLOWUPS[Math.floor(Math.random() * WELCOME_FOLLOWUPS.length)]
  return { greeting, followUp }
}

/** Welkomsttekst op basis van uur (zelfde per dag voor consistentie). */
export function getWelcomeByTime() {
  const hour = new Date().getHours()
  const day = new Date().getDay()
  const index = (day * 24 + hour) % WELCOME_GREETINGS.length
  const followIndex = (day * 24 + hour) % WELCOME_FOLLOWUPS.length
  return {
    greeting: WELCOME_GREETINGS[index],
    followUp: WELCOME_FOLLOWUPS[followIndex],
  }
}
