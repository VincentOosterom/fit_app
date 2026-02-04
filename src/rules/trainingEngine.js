/**
 * TrainLogic: 4-weekse trainingsschema.
 * HARD RULES: exact 4 weken, per week focus + volume + intensieve sessies,
 * progressie max 5–10% per week, week 4 deload/stabilisatie.
 * Per week: concrete sessies met voorbeeldoefeningen (zoals voeding exampleMeals).
 */

/** Voor admin-overzicht: focus per week per doel */
export const FOCUS_BY_GOAL = {
  marathon: ['Duur basis', 'Volume lange duur', 'Intensiteit + lange duur', 'Taper'],
  hyrox: ['Duur + kracht', 'Metabolisch + duur', 'Intensiteit Hyrox-style', 'Taper / scherp'],
  prestatie: ['Techniek / basis', 'Volume-opbouw', 'Intensiteit', 'Deload'],
  onderhoud: ['Full body', 'Cardio / mobiliteit', 'Full body', 'Stabilisatie'],
  vetverlies: ['Full body', 'Metabolisch', 'Full body', 'Metabolisch'],
  afvallen: ['Full body', 'Metabolisch', 'Full body', 'Metabolisch'],
  spieropbouw: ['Volume', 'Volume', 'Intensiteit', 'Deload'],
  conditie: ['Duur', 'Interval', 'Duur', 'Stabilisatie'],
  kracht_endurance: ['Kracht + basis uithouding', 'Volume', 'Intensiteit', 'Deload'],
  sportevenement: ['Techniek / basis', 'Volume-opbouw', 'Intensiteit', 'Taper'],
  fit_vanaf_nul: ['Basis full body', 'Opbouw', 'Opbouw', 'Stabilisatie'],
}

// Voorbeeldoefeningen per sessietype; alternatives = optie "kies andere oefening"
const EXERCISES_BY_TYPE = {
  fullBody: [
    { name: 'Squat (of leg press)', sets: 3, reps: '10-12', note: 'Controleerde uitvoering', alternatives: [
      { name: 'Leg press', sets: 3, reps: '10-12', note: '' },
      { name: 'Goblet squat', sets: 3, reps: '10-12', note: '' },
    ]},
    { name: 'Push-up of bankdrukken', sets: 3, reps: '8-12', note: '', alternatives: [
      { name: 'Bankdrukken', sets: 3, reps: '8-12', note: '' },
      { name: 'Dumbbell chest press', sets: 3, reps: '8-12', note: '' },
    ]},
    { name: 'Rowing (kabel of dumbell)', sets: 3, reps: '10-12', note: 'Rug recht', alternatives: [
      { name: 'Kabel row', sets: 3, reps: '10-12', note: '' },
      { name: 'Dumbbell row', sets: 3, reps: '10-12', note: 'Per arm' },
    ]},
    { name: 'Plank', sets: 2, reps: '30-45 sec', note: '', alternatives: [
      { name: 'Dead bug', sets: 2, reps: '10 per zijde', note: '' },
      { name: 'Bird dog', sets: 2, reps: '10 per zijde', note: '' },
    ]},
    { name: 'Lunges', sets: 2, reps: '10 per been', note: '', alternatives: [
      { name: 'Step-up', sets: 2, reps: '10 per been', note: '' },
      { name: 'Bulgaarse split squat', sets: 2, reps: '8 per been', note: '' },
    ]},
  ],
  fullBodyDeload: [
    { name: 'Squat (licht)', sets: 2, reps: '10', note: '60-70% van normaal' },
    { name: 'Push-up', sets: 2, reps: '8', note: '' },
    { name: 'Rowing', sets: 2, reps: '10', note: '' },
    { name: 'Plank', sets: 1, reps: '20 sec', note: '' },
  ],
  krachtUithouding: [
    { name: 'Squat', sets: 3, reps: '8-10', note: '', alternatives: [
      { name: 'Leg press', sets: 3, reps: '8-10', note: '' },
    ]},
    { name: 'Hardlopen of fietsen', sets: 1, reps: '15-20 min', note: 'Rustige duur', alternatives: [
      { name: 'Roeien', sets: 1, reps: '15-20 min', note: '' },
    ]},
    { name: 'Bankdrukken', sets: 3, reps: '8', note: '' },
    { name: 'Core (dead bug of bird dog)', sets: 2, reps: '10 per zijde', note: '' },
  ],
  cardioMobiliteit: [
    { name: 'Warming-up mobiliteit', sets: 1, reps: '10 min', note: 'Hip openers, schouders' },
    { name: 'Duurtraining (loop/fiets)', sets: 1, reps: '25-35 min', note: 'Zone 2' },
    { name: 'Stretching / cooling-down', sets: 1, reps: '10 min', note: '' },
  ],
  metabolisch: [
    { name: 'Circuit: squat + push-up + row', sets: 3, reps: '45 sec per oefening', note: '30 sec rust', alternatives: [
      { name: 'Circuit: lunges + burpees + row', sets: 3, reps: '45 sec', note: '' },
    ]},
    { name: 'Burpees of mountain climbers', sets: 2, reps: '30 sec', note: '', alternatives: [
      { name: 'Mountain climbers', sets: 2, reps: '30 sec', note: '' },
      { name: 'Jumping jacks', sets: 2, reps: '45 sec', note: '' },
    ]},
    { name: 'Kettlebell swing of jumping jack', sets: 2, reps: '45 sec', note: '', alternatives: [
      { name: 'Kettlebell swing', sets: 2, reps: '15', note: '' },
    ]},
    { name: 'Plank + side plank', sets: 2, reps: '20 sec per zijde', note: '' },
  ],
  duur: [
    { name: 'Duurloop of fietssessie', sets: 1, reps: '35-50 min', note: 'Rustig tempo, zone 2' },
    { name: 'Core (optioneel)', sets: 1, reps: '5-10 min', note: '' },
  ],
  interval: [
    { name: 'Warming-up', sets: 1, reps: '10 min', note: '' },
    { name: 'Intervals: 4×4 min intensief', sets: 4, reps: '4 min', note: '3 min rust ertussen' },
    { name: 'Cooling-down', sets: 1, reps: '10 min', note: '' },
  ],
  techniekBasis: [
    { name: 'Squat techniek (licht gewicht)', sets: 3, reps: '8', note: 'Focus op houding' },
    { name: 'Hip hinge / deadlift basis', sets: 2, reps: '8', note: '' },
    { name: 'Push / pull basis', sets: 2, reps: '10', note: '' },
    { name: 'Mobiliteit en stretch', sets: 1, reps: '10 min', note: '' },
  ],
  volume: [
    { name: 'Squat', sets: 4, reps: '8-10', note: '', alternatives: [
      { name: 'Leg press', sets: 4, reps: '8-10', note: '' },
    ]},
    { name: 'Bankdrukken', sets: 4, reps: '8', note: '' },
    { name: 'Rowing', sets: 3, reps: '10', note: '' },
    { name: 'Overhead press', sets: 3, reps: '8', note: '', alternatives: [
      { name: 'Dumbbell shoulder press', sets: 3, reps: '8', note: '' },
    ]},
    { name: 'Lunges', sets: 2, reps: '10 per been', note: '' },
  ],
  volumeDeload: [
    { name: 'Squat (licht)', sets: 2, reps: '8', note: '' },
    { name: 'Bankdrukken (licht)', sets: 2, reps: '8', note: '' },
    { name: 'Rowing', sets: 2, reps: '10', note: '' },
  ],
  taper: [
    { name: 'Korte duur of lichte kracht', sets: 1, reps: '20-30 min', note: 'Geen zware belasting' },
    { name: 'Mobiliteit en mentale voorbereiding', sets: 1, reps: '10 min', note: '' },
  ],
}

function getBaseVolumeMinutes(input) {
  const days = Math.min(7, Math.max(1, Number(input.days_per_week) || 3))
  const minPerSession = Math.min(180, Math.max(15, Number(input.session_minutes) || 60))
  return days * minPerSession
}

// Progressie: max 5–10% per week. Week 4 = deload (~70–80% van week 3).
function getWeekVolumeMultipliers(goal) {
  const g = ['kracht_endurance', 'sportevenement'].includes(goal) ? 'prestatie' : goal
  const isDeloadFourth = ['prestatie', 'spieropbouw', 'onderhoud', 'conditie', 'kracht_endurance', 'sportevenement', 'fit_vanaf_nul', 'marathon', 'hyrox'].includes(g)
  if (isDeloadFourth)
    return [1.0, 1.07, 1.07, 0.75] // week 4 deload
  return [1.0, 1.05, 1.05, 1.0]    // week 4 stabilisatie
}

function getIntenseSessionsPerWeek(input) {
  const days = Math.min(7, Math.max(1, Number(input.days_per_week) || 3))
  const level = input.level || 'beginner'
  if (level === 'beginner') return Math.min(1, days)
  if (level === 'intermediate') return Math.min(2, days)
  return Math.min(3, days)
}

// Bepaal welk oefenblok bij een week-focus hoort
function getExerciseKeyForFocus(focus, weekIndex, isDeload) {
  const f = (focus || '').toLowerCase()
  if (isDeload) {
    if (f.includes('full body') || f.includes('stabilisatie')) return 'fullBodyDeload'
    if (f.includes('volume') || f.includes('intensiteit')) return 'volumeDeload'
    return 'fullBodyDeload'
  }
  if (f.includes('full body') || f.includes('opbouw') || f.includes('basis')) return 'fullBody'
  if (f.includes('kracht') && f.includes('uithouding')) return 'krachtUithouding'
  if (f.includes('cardio') || f.includes('mobiliteit')) return 'cardioMobiliteit'
  if (f.includes('metabolisch')) return 'metabolisch'
  if (f.includes('duur')) return 'duur'
  if (f.includes('interval')) return 'interval'
  if (f.includes('techniek') || f.includes('basis')) return 'techniekBasis'
  if (f.includes('volume') || f.includes('intensiteit')) return 'volume'
  if (f.includes('taper')) return 'taper'
  return 'fullBody'
}

/** Voor admin-overzicht: sessietypen die in schema's kunnen voorkomen */
export const SESSION_TYPE_LABELS = {
  fullBody: 'Full body kracht',
  fullBodyDeload: 'Full body (licht)',
  krachtUithouding: 'Kracht + duur',
  cardioMobiliteit: 'Cardio & mobiliteit',
  metabolisch: 'Metabolische training',
  duur: 'Duurtraining',
  interval: 'Intervaltraining',
  techniekBasis: 'Techniek & basis',
  volume: 'Volume kracht',
  volumeDeload: 'Volume (licht)',
  taper: 'Taper / rust',
}

function buildSessionsForWeek(input, focus, volumeMin, weekIndex) {
  const days = Math.min(7, Math.max(1, Number(input.days_per_week) || 3))
  const sessionMin = Math.min(180, Math.max(15, Number(input.session_minutes) || 60))
  const isDeload = weekIndex === 3 && (focus || '').toLowerCase().includes('deload')
  const exerciseKey = getExerciseKeyForFocus(focus, weekIndex, isDeload)
  const exercises = EXERCISES_BY_TYPE[exerciseKey] || EXERCISES_BY_TYPE.fullBody

  const sessionTypeLabels = SESSION_TYPE_LABELS
    const typeLabel = sessionTypeLabels[exerciseKey] || focus

  const sessions = []
  const minPerSession = Math.round(volumeMin / days)
  for (let d = 0; d < days; d++) {
    sessions.push({
      dayLabel: `Dag ${d + 1}`,
      type: typeLabel,
      durationMin: Math.min(180, minPerSession),
      exercises: exercises.map((e) => ({
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        note: e.note || '',
        alternatives: e.alternatives || [],
      })),
    })
  }
  return sessions
}

export function buildTrainingPlan(input) {
  const rawGoal = input.goal || 'onderhoud'
  const goal = ['kracht_endurance', 'sportevenement'].includes(rawGoal) ? 'prestatie' : rawGoal
  const focuses = FOCUS_BY_GOAL[input.goal] || FOCUS_BY_GOAL[goal] || FOCUS_BY_GOAL.onderhoud
  const baseVolumeMin = getBaseVolumeMinutes(input)
  const multipliers = getWeekVolumeMultipliers(input.goal || goal)
  const intenseSessions = getIntenseSessionsPerWeek(input)
  const daysPerWeek = Math.min(7, Math.max(1, Number(input.days_per_week) || 3))
  const sessionMinutes = Math.min(180, Math.max(15, Number(input.session_minutes) || 60))

  const weeks = []
  for (let w = 0; w < 4; w++) {
    const volumeMin = Math.round(baseVolumeMin * multipliers[w])
    const focus = focuses[w] || focuses[0]
    weeks.push({
      weekNumber: w + 1,
      weekName: `Week ${w + 1}`,
      focus,
      volumeMinutes: volumeMin,
      volumeDescription: `${Math.floor(volumeMin / 60)}u ${volumeMin % 60}min totaal`,
      intenseSessions: w === 3 && multipliers[w] < 1 ? Math.max(0, intenseSessions - 1) : intenseSessions,
      note: w === 3 && multipliers[w] < 1 ? 'Deload: lagere volume en intensiteit voor herstel.' : null,
      sessions: buildSessionsForWeek(input, focus, volumeMin, w),
    })
  }

  return {
    generatedAt: new Date().toISOString(),
    goal: input.goal || goal,
    level: input.level || 'beginner',
    mainSport: input.main_sport || null,
    daysPerWeek,
    sessionMinutes,
    weeks,
  }
}
