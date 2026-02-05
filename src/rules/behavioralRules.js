/**
 * Rule-based behavioral coaching. Deterministic, no AI.
 * - Adaptive rules: missed sessions → reduce volume; rapid weight loss → increase calories; poor adherence → simplify
 * - Progress: completion rate, consistency (streaks)
 * Used by week reviews and (optionally) plan generation.
 */

/**
 * Suggestie voor volgende blok op basis van weekevaluaties.
 * @param {Array<{week_number: number, completed_sessions?: number, planned_sessions?: number, energy_level?: number, difficulty?: number, wants_follow_up?: boolean}>} reviews
 * @param {number} plannedSessionsPerWeek
 * @returns {{ action: 'reduce_volume'|'simplify'|'maintain'|'increase_intensity', message: string }}
 */
export function getAdaptiveSuggestion(reviews, plannedSessionsPerWeek) {
  if (!reviews?.length) return { action: 'maintain', message: 'Geen evaluaties; we houden het schema aan.' }

  const completed = reviews.reduce((sum, r) => sum + (r.completed_sessions ?? 0), 0)
  const planned = reviews.reduce((sum, r) => sum + (r.planned_sessions ?? plannedSessionsPerWeek * 4), 0)
  const completionRate = planned > 0 ? completed / planned : 1

  if (completionRate < 0.6) {
    return {
      action: 'reduce_volume',
      message: 'Je hebt minder sessies kunnen doen dan gepland. In het volgende blok kunnen we het volume of aantal dagen iets verlagen zodat het beter haalbaar is.',
    }
  }

  const avgEnergy = reviews.reduce((s, r) => s + (r.energy_level ?? 3), 0) / reviews.length
  const avgDifficulty = reviews.reduce((s, r) => s + (r.difficulty ?? 3), 0) / reviews.length

  if (avgEnergy < 2.5 && avgDifficulty > 3.5) {
    return {
      action: 'simplify',
      message: 'Energie en ervaren moeilijkheid wijzen op een zwaar blok. We kunnen het volgende schema iets lichter of eenvoudiger maken.',
    }
  }

  if (completionRate >= 0.9 && avgEnergy >= 4) {
    return {
      action: 'increase_intensity',
      message: 'Goede naleving en energie. In een volgend blok kunnen we het volume of de intensiteit licht verhogen.',
    }
  }

  return { action: 'maintain', message: 'We houden dezelfde opzet aan. Vul na week 4 de evaluatie in voor een eventueel vervolg op maat.' }
}

/**
 * Eenvoudige "streak" van weken met voldoende voltooide sessies.
 * @param {Array<{completed_sessions?: number, planned_sessions?: number}>} reviews
 * @param {number} threshold - ratio (0-1) om als "voltooid" te tellen
 */
export function getConsistencyStreak(reviews, threshold = 0.7) {
  if (!reviews?.length) return 0
  let streak = 0
  for (const r of reviews.sort((a, b) => a.week_number - b.week_number)) {
    const planned = r.planned_sessions ?? 1
    const completed = r.completed_sessions ?? 0
    if (planned > 0 && completed / planned >= threshold) streak++
    else break
  }
  return streak
}
