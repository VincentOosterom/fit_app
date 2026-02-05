/**
 * Client input schema en default builders voor adaptive coaching.
 * Geschikt voor rule-based training & nutrition engine.
 */
import { z } from 'zod'

const score1to5 = z.number().int().min(1).max(5).optional().nullable()
const score1to5Required = z.number().int().min(1).max(5)

export const clientInputSchema = z.object({
  // Basis
  age: z.number().int().min(14).max(120).optional().nullable(),
  height_cm: z.number().min(100).max(250).optional().nullable(),
  weight_kg: z.number().min(30).max(300).optional().nullable(),
  sex: z.enum(['m', 'v', 'x']).optional().nullable().or(z.literal('')),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'gevorderd', 'expert']).optional(),
  main_sport: z.string().optional().nullable(),
  goal: z.string().optional(),
  event_date: z.string().optional().nullable(),
  days_per_week: z.number().int().min(1).max(7).optional(),
  session_minutes: z.number().int().min(15).max(180).optional(),
  nutrition_goal: z.enum(['prestatie', 'onderhoud', 'vetverlies']).optional(),
  dietary_prefs: z.string().optional().nullable(),
  restrictions: z.string().optional().nullable(),
  wants_nutrition: z.boolean().optional(),
  wants_training: z.boolean().optional(),
  // Legacy (blijven voor compat)
  injuries_limitations: z.string().optional().nullable(),
  work_load: z.string().optional().nullable(),
  stress_level: z.string().optional().nullable(),
  uses_supplements: z.boolean().optional(),
  supplements_notes: z.string().optional().nullable(),
  // 1. Herstel & readiness
  sleep_hours: z.number().min(0).max(24).optional().nullable(),
  sleep_quality: score1to5,
  daily_energy: score1to5,
  motivation_level: score1to5,
  recovery_score: score1to5,
  // 2. Stress/workload als score
  stress_score: score1to5,
  workload_score: score1to5,
  // 3. Trainingsomgeving
  training_location: z.enum(['gym', 'thuis', 'buiten', 'gemengd']).optional().nullable(),
  equipment_available: z.array(z.string()).optional().default([]),
  // 4. Voeding
  meals_per_day: z.number().int().min(2).max(6).optional().nullable(),
  cooking_skill: z.enum(['beginner', 'gemiddeld', 'gevorderd']).optional().nullable(),
  budget_level: z.enum(['laag', 'gemiddeld', 'hoog']).optional().nullable(),
  snacking_habit: z.boolean().optional().nullable(),
  alcohol_frequency: z.enum(['nooit', 'soms', 'regelmatig']).optional().nullable(),
  // 5. Blessures
  injury_tags: z.array(z.string()).optional().default([]),
  injury_notes: z.string().optional().nullable(),
  // 6. Supplementen
  supplements: z.array(z.string()).optional().default([]),
  // 7. Planning
  preferred_training_days: z.array(z.string()).optional().default([]),
  preferred_training_time: z.enum(['ochtend', 'middag', 'avond', 'flexibel']).optional().nullable(),
  // 8. Motivatie
  why_goal: z.string().optional().nullable(),
  biggest_barrier: z.string().optional().nullable(),
  training_preference: z.enum(['korte_intensief', 'langere_rustig', 'variatie', 'vaste_structuur']).optional().nullable(),
}).strict(false)

/** Valideer payload voor opslaan; retourneer { success, data, error } */
export function validateClientInput(payload) {
  const result = clientInputSchema.safeParse(payload)
  if (result.success) return { success: true, data: result.data }
  return { success: false, error: result.error.flatten?.() ?? result.error }
}

// ——— Default builders ———

export function createTrainingDefaults() {
  return {
    goal: 'fit_vanaf_nul',
    level: 'beginner',
    main_sport: '',
    event_date: '',
    days_per_week: 3,
    session_minutes: 60,
    wants_training: true,
    training_location: null,
    equipment_available: [],
    preferred_training_days: [],
    preferred_training_time: null,
    training_preference: null,
    workload_score: null,
    stress_score: null,
  }
}

export function createNutritionDefaults() {
  return {
    nutrition_goal: 'onderhoud',
    dietary_prefs: null,
    restrictions: null,
    wants_nutrition: true,
    uses_supplements: false,
    supplements_notes: null,
    supplements: [],
    meals_per_day: null,
    cooking_skill: null,
    budget_level: null,
    snacking_habit: null,
    alcohol_frequency: null,
  }
}

export function createLifestyleDefaults() {
  return {
    age: null,
    height_cm: null,
    weight_kg: null,
    sex: null,
    injuries_limitations: null,
    injury_tags: [],
    injury_notes: null,
    work_load: null,
    stress_level: null,
    sleep_hours: null,
    sleep_quality: null,
    daily_energy: null,
    motivation_level: null,
    recovery_score: null,
    why_goal: null,
    biggest_barrier: null,
  }
}

/** Gecombineerde default voor heel het formulier */
export function createClientInputDefaults() {
  return {
    ...createTrainingDefaults(),
    ...createNutritionDefaults(),
    ...createLifestyleDefaults(),
  }
}
