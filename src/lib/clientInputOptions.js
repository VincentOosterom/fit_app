/**
 * Opties voor ClientInput (adaptive coaching).
 * Gebruikt door formulier en rule-based engines.
 */

export const SCORE_1_5_OPTIONS = [
  { value: 1, label: '1 - Zeer laag' },
  { value: 2, label: '2 - Laag' },
  { value: 3, label: '3 - Middel' },
  { value: 4, label: '4 - Hoog' },
  { value: 5, label: '5 - Zeer hoog' },
]

/** Werkbelasting: duidelijke regels wanneer hoog. Gebruikt voor herstel en volume-inschatting. */
export const WORKLOAD_SCORE_OPTIONS = [
  { value: 1, label: '1 - Geen / zeer licht' },
  { value: 2, label: '2 - Licht (kantoor, weinig stress)' },
  { value: 3, label: '3 - Gemiddeld (normale baan)' },
  { value: 4, label: '4 - Zwaar (veel uren of fysiek werk)' },
  { value: 5, label: '5 - Zeer zwaar (fysiek zwaar of veel stress)' },
]

export const WORKLOAD_HELP = 'Werkbelasting = hoe zwaar is je werk (lichamelijk én mentaal)? 1–2 = licht (kantoor, weinig uren). 3 = gemiddelde baan. 4 = veel uren, drukke baan of fysiek werk. 5 = zeer zwaar werk of chronische stress. We gebruiken dit om je schema en volume aan te passen aan je herstel.'

export const TRAINING_LOCATION_OPTIONS = [
  { value: 'gym', label: 'Sportschool' },
  { value: 'thuis', label: 'Thuis' },
  { value: 'buiten', label: 'Buiten' },
  { value: 'gemengd', label: 'Gemengd' },
]

export const EQUIPMENT_OPTIONS = [
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'machines', label: 'Machines' },
  { value: 'lichaamsgewicht', label: 'Lichaamsgewicht' },
  { value: 'cardio', label: 'Cardio-apparaten' },
]

export const COOKING_SKILL_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'gemiddeld', label: 'Gemiddeld' },
  { value: 'gevorderd', label: 'Gevorderd' },
]

export const BUDGET_LEVEL_OPTIONS = [
  { value: 'laag', label: 'Laag' },
  { value: 'gemiddeld', label: 'Gemiddeld' },
  { value: 'hoog', label: 'Hoog' },
]

export const ALCOHOL_FREQUENCY_OPTIONS = [
  { value: 'nooit', label: 'Nooit' },
  { value: 'soms', label: 'Soms' },
  { value: 'regelmatig', label: 'Regelmatig' },
]

export const INJURY_TAG_OPTIONS = [
  { value: 'knie', label: 'Knie' },
  { value: 'schouder', label: 'Schouder' },
  { value: 'onderrug', label: 'Onderrug' },
  { value: 'enkel', label: 'Enkel' },
  { value: 'nek', label: 'Nek' },
  { value: 'anders', label: 'Anders' },
]

export const SUPPLEMENT_OPTIONS = [
  { value: 'eiwitpoeder', label: 'Eiwitpoeder' },
  { value: 'creatine', label: 'Creatine' },
  { value: 'cafeine_preworkout', label: 'Cafeïne / pre-workout' },
  { value: 'omega3', label: 'Omega-3' },
  { value: 'vitamine_d', label: 'Vitamine D' },
  { value: 'magnesium', label: 'Magnesium' },
  { value: 'anders', label: 'Anders' },
]

export const WEEKDAY_OPTIONS = [
  { value: 'ma', label: 'Ma' },
  { value: 'di', label: 'Di' },
  { value: 'wo', label: 'Wo' },
  { value: 'do', label: 'Do' },
  { value: 'vr', label: 'Vr' },
  { value: 'za', label: 'Za' },
  { value: 'zo', label: 'Zo' },
]

export const PREFERRED_TRAINING_TIME_OPTIONS = [
  { value: 'ochtend', label: 'Ochtend' },
  { value: 'middag', label: 'Middag' },
  { value: 'avond', label: 'Avond' },
  { value: 'flexibel', label: 'Flexibel' },
]

export const TRAINING_PREFERENCE_OPTIONS = [
  { value: 'korte_intensief', label: 'Korte intensieve trainingen' },
  { value: 'langere_rustig', label: 'Langere rustige trainingen' },
  { value: 'variatie', label: 'Variatie' },
  { value: 'vaste_structuur', label: 'Vaste structuur' },
]

export const SLEEP_QUALITY_LABELS = { 1: 'Zeer slecht', 2: 'Slecht', 3: 'Middel', 4: 'Goed', 5: 'Zeer goed' }
export const ENERGY_LABELS = { 1: 'Zeer laag', 2: 'Laag', 3: 'Middel', 4: 'Hoog', 5: 'Zeer hoog' }
export const MOTIVATION_LABELS = { 1: 'Geen zin', 2: 'Weinig', 3: 'Neutraal', 4: 'Gemotiveerd', 5: 'Zeer gemotiveerd' }
export const RECOVERY_LABELS = { 1: 'Nauwelijks', 2: 'Slecht', 3: 'Oké', 4: 'Goed', 5: 'Uitgerust' }
