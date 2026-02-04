/**
 * Evaluatie week N komt pas beschikbaar na N volle weken sinds start schema.
 * Bijv. klant registreert woensdag → evaluatie week 1 komt woensdag de week erna.
 */
const MS_PER_DAY = 24 * 60 * 60 * 1000
const DAYS_PER_WEEK = 7

export function getWeekEvaluationAvailability(planCreatedAt, weekNumber) {
  if (!planCreatedAt || weekNumber < 1 || weekNumber > 4) return { available: false, availableFrom: null }
  const start = new Date(planCreatedAt).getTime()
  const daysUntilAvailable = weekNumber * DAYS_PER_WEEK
  const availableFrom = new Date(start + daysUntilAvailable * MS_PER_DAY)
  const now = Date.now()
  return {
    available: now >= availableFrom.getTime(),
    availableFrom,
  }
}

export function formatAvailableDate(date) {
  return date.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
