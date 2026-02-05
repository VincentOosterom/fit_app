import { useState, useEffect } from 'react'
import { useClientInput } from '../hooks/useClientInput'
import { usePlans } from '../hooks/usePlans'
import Tooltip from '../components/Tooltip'
import styles from './ClientInput.module.css'
import { getTrainingGoalsForInput } from '../lib/trainingGoals'
import { createClientInputDefaults, validateClientInput } from '../lib/clientInputSchema'
import {
  SCORE_1_5_OPTIONS,
  WORKLOAD_SCORE_OPTIONS,
  WORKLOAD_HELP,
  TRAINING_LOCATION_OPTIONS,
  EQUIPMENT_OPTIONS,
  COOKING_SKILL_OPTIONS,
  BUDGET_LEVEL_OPTIONS,
  ALCOHOL_FREQUENCY_OPTIONS,
  INJURY_TAG_OPTIONS,
  SUPPLEMENT_OPTIONS,
  WEEKDAY_OPTIONS,
  PREFERRED_TRAINING_TIME_OPTIONS,
  TRAINING_PREFERENCE_OPTIONS,
} from '../lib/clientInputOptions'
import ClientInputWelcomeModal from '../components/ClientInputWelcomeModal'
import ThankYouModal from '../components/ThankYouModal'

const WELCOME_SEEN_KEY = 'trainlogic_client_input_welcome_seen'

const TRAINING_GOALS = getTrainingGoalsForInput()

const LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const NUTRITION_GOALS = [
  { value: 'prestatie', label: 'Prestatie (veel energie)' },
  { value: 'onderhoud', label: 'Onderhoud' },
  { value: 'vetverlies', label: 'Vetverlies' },
]

const SEX_OPTIONS = [
  { value: '', label: '—' },
  { value: 'm', label: 'Man' },
  { value: 'v', label: 'Vrouw' },
  { value: 'x', label: 'Anders' },
]

const DIET_OPTIONS = [
  { value: 'vegetarisch', label: 'Vegetarisch' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'glutenvrij', label: 'Glutenvrij' },
  { value: 'lactosevrij', label: 'Lactosevrij' },
  { value: 'geen_noten', label: 'Geen noten' },
  { value: 'halal', label: 'Halal' },
  { value: 'geen_varken', label: 'Geen varken' },
  { value: 'geen_groente', label: 'Geen groente' },
  { value: 'vis_gevogelte', label: 'Alleen vis/gevogelte' },
]

const DIET_VALUES = new Set(DIET_OPTIONS.map((o) => o.value))

function parseDietaryPrefs(str) {
  if (!str || !str.trim()) return { options: [], other: '' }
  const parts = str.split(',').map((s) => s.trim()).filter(Boolean)
  const options = []
  const otherParts = []
  for (const p of parts) {
    if (DIET_VALUES.has(p)) options.push(p)
    else otherParts.push(p)
  }
  return { options, other: otherParts.join(', ') }
}

function serializeDietaryPrefs(options, other) {
  const list = [...options]
  if (other?.trim()) list.push(other.trim())
  return list.join(', ') || ''
}

/** Score 1–5 naar legacy label (backwards compat) */
function scoreToLegacyLabel(score) {
  if (score == null) return ''
  if (score <= 2) return 'laag'
  if (score <= 3) return 'middel'
  return 'hoog'
}

/** Legacy label naar score 1–5 */
function legacyLabelToScore(label) {
  if (!label) return null
  if (label === 'laag') return 1
  if (label === 'middel') return 3
  if (label === 'hoog') return 5
  return null
}

function buildDefaultForm() {
  const defaults = createClientInputDefaults()
  return {
    ...defaults,
    age: '',
    height_cm: '',
    weight_kg: '',
    sex: '',
    main_sport: '',
    event_date: '',
    dietaryOptions: [],
    dietaryOther: '',
    injury_tags: [],
    injury_notes: '',
    injuries_limitations: '',
    supplements: [],
    supplements_notes: '',
    preferred_training_days: [],
    why_goal: '',
    biggest_barrier: '',
    stress_score: '',
    workload_score: '',
    sleep_hours: '',
    sleep_quality: '',
    daily_energy: '',
    motivation_level: '',
    recovery_score: '',
    meals_per_day: '',
    snacking_habit: null,
  }
}

const defaultForm = buildDefaultForm()

function LabelWithTooltip({ label, tip, children }) {
  return (
    <label className={styles.label}>
      <Tooltip text={tip}>
        <span className={styles.labelText}>{label}</span>
      </Tooltip>
      {children}
    </label>
  )
}

/** Toggle-knoppen in plaats van dropdown; options = [{ value, label }], optioneel emptyLabel voor "—". */
function ToggleSelect({ options, value, onChange, disabled, emptyLabel }) {
  const list = emptyLabel ? [{ value: '', label: emptyLabel }, ...options] : options
  return (
    <div className={styles.toggleGroup} role="group">
      {list.map((o) => {
        const isActive = value === o.value || (value == null && o.value === '')
        return (
          <button
            key={o.value === '' ? '_empty' : o.value}
            type="button"
            className={`${styles.toggleBtn} ${isActive ? styles.toggleBtnActive : ''}`}
            onClick={() => onChange(o.value)}
            disabled={disabled}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function SelectScore({ value, onChange, options, disabled }) {
  const v = value === '' || value == null ? '' : Number(value)
  return (
    <ToggleSelect
      options={options}
      value={v}
      onChange={(val) => onChange(val === '' ? '' : Number(val))}
      disabled={disabled}
      emptyLabel="—"
    />
  )
}

export default function ClientInput() {
  const { input, loading, error, saveInput } = useClientInput()
  const { hasAnyPlan, loading: plansLoading } = usePlans()
  const [showThankYouModal, setShowThankYouModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState(defaultForm)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const readOnly = hasAnyPlan

  useEffect(() => {
    if (loading || plansLoading) return
    if (input != null) return
    if (typeof localStorage !== 'undefined' && localStorage.getItem(WELCOME_SEEN_KEY)) return
    setShowWelcomeModal(true)
  }, [loading, plansLoading, input])

  const closeWelcomeModal = () => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(WELCOME_SEEN_KEY, '1')
    setShowWelcomeModal(false)
  }

  useEffect(() => {
    if (!input) return
    const { options: dietaryOptions, other: dietaryOther } = parseDietaryPrefs(input.dietary_prefs ?? '')
    setForm({
      ...buildDefaultForm(),
      age: input.age ?? '',
      height_cm: input.height_cm ?? '',
      weight_kg: input.weight_kg ?? '',
      sex: input.sex ?? '',
      injuries_limitations: input.injuries_limitations ?? '',
      injury_tags: Array.isArray(input.injury_tags) ? input.injury_tags : [],
      injury_notes: input.injury_notes ?? '',
      level: input.level ?? 'beginner',
      main_sport: input.main_sport ?? '',
      goal: input.goal ?? 'fit_vanaf_nul',
      event_date: input.event_date ? input.event_date.slice(0, 10) : '',
      days_per_week: input.days_per_week ?? 3,
      session_minutes: input.session_minutes ?? 60,
      work_load: input.work_load ?? '',
      stress_level: input.stress_level ?? '',
      stress_score: input.stress_score ?? legacyLabelToScore(input.stress_level) ?? '',
      workload_score: input.workload_score ?? legacyLabelToScore(input.work_load) ?? '',
      nutrition_goal: input.nutrition_goal ?? 'onderhoud',
      dietaryOptions,
      dietaryOther,
      restrictions: input.restrictions ?? '',
      uses_supplements: input.uses_supplements ?? false,
      supplements: Array.isArray(input.supplements) ? input.supplements : [],
      supplements_notes: input.supplements_notes ?? '',
      wants_nutrition: input.wants_nutrition ?? true,
      wants_training: input.wants_training ?? true,
      sleep_hours: input.sleep_hours ?? '',
      sleep_quality: input.sleep_quality ?? '',
      daily_energy: input.daily_energy ?? '',
      motivation_level: input.motivation_level ?? '',
      recovery_score: input.recovery_score ?? '',
      training_location: input.training_location ?? '',
      equipment_available: Array.isArray(input.equipment_available) ? input.equipment_available : [],
      meals_per_day: input.meals_per_day ?? '',
      cooking_skill: input.cooking_skill ?? '',
      budget_level: input.budget_level ?? '',
      snacking_habit: input.snacking_habit ?? null,
      alcohol_frequency: input.alcohol_frequency ?? '',
      preferred_training_days: Array.isArray(input.preferred_training_days) ? input.preferred_training_days : [],
      preferred_training_time: input.preferred_training_time ?? '',
      why_goal: input.why_goal ?? '',
      biggest_barrier: input.biggest_barrier ?? '',
      training_preference: input.training_preference ?? '',
    })
  }, [input])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    const stressScore = form.stress_score === '' ? null : (form.stress_score != null ? Number(form.stress_score) : null)
    const workloadScore = form.workload_score === '' ? null : (form.workload_score != null ? Number(form.workload_score) : null)
    const payload = {
      age: form.age ? Number(form.age) : null,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      sex: form.sex || null,
      injuries_limitations: [form.injury_notes?.trim(), (form.injury_tags || []).join(', ')].filter(Boolean).join(' — ') || null,
      injury_tags: form.injury_tags?.length ? form.injury_tags : [],
      injury_notes: form.injury_notes?.trim() || null,
      level: form.level,
      main_sport: form.main_sport?.trim() || null,
      goal: form.goal,
      event_date: form.event_date || null,
      days_per_week: Math.min(7, Math.max(1, Number(form.days_per_week) || 3)),
      session_minutes: Math.min(180, Math.max(15, Number(form.session_minutes) || 60)),
      stress_score: stressScore,
      workload_score: workloadScore,
      work_load: scoreToLegacyLabel(workloadScore),
      stress_level: scoreToLegacyLabel(stressScore),
      nutrition_goal: form.nutrition_goal,
      dietary_prefs: serializeDietaryPrefs(form.dietaryOptions, form.dietaryOther) || null,
      restrictions: form.restrictions?.trim() || null,
      uses_supplements: (form.supplements?.length ?? 0) > 0 || !!form.supplements_notes?.trim(),
      supplements: form.supplements?.length ? form.supplements : [],
      supplements_notes: form.supplements_notes?.trim() || null,
      wants_nutrition: form.wants_nutrition,
      wants_training: form.wants_training,
      sleep_hours: form.sleep_hours !== '' ? Number(form.sleep_hours) : null,
      sleep_quality: form.sleep_quality !== '' && form.sleep_quality != null ? Number(form.sleep_quality) : null,
      daily_energy: form.daily_energy !== '' && form.daily_energy != null ? Number(form.daily_energy) : null,
      motivation_level: form.motivation_level !== '' && form.motivation_level != null ? Number(form.motivation_level) : null,
      recovery_score: form.recovery_score !== '' && form.recovery_score != null ? Number(form.recovery_score) : null,
      training_location: form.training_location || null,
      equipment_available: form.equipment_available?.length ? form.equipment_available : [],
      meals_per_day: form.meals_per_day !== '' && form.meals_per_day != null ? Number(form.meals_per_day) : null,
      cooking_skill: form.cooking_skill || null,
      budget_level: form.budget_level || null,
      snacking_habit: form.snacking_habit === null ? null : !!form.snacking_habit,
      alcohol_frequency: form.alcohol_frequency || null,
      preferred_training_days: form.preferred_training_days?.length ? form.preferred_training_days : [],
      preferred_training_time: form.preferred_training_time || null,
      why_goal: form.why_goal?.trim() || null,
      biggest_barrier: form.biggest_barrier?.trim() || null,
      training_preference: form.training_preference || null,
    }
    const validation = validateClientInput(payload)
    if (!validation.success) {
      setMessage('Controleer de ingevulde velden.')
      return
    }
    setSaving(true)
    try {
      await saveInput(validation.data)
      setMessage('Opgeslagen. Ga naar het dashboard om je 4-weekse schema te genereren.')
      if (!hasAnyPlan) setShowThankYouModal(true)
    } catch {
      // error in hook
    } finally {
      setSaving(false)
    }
  }

  const toggleArray = (key, value) => {
    if (readOnly) return
    setForm((f) => {
      const arr = f[key] ?? []
      const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]
      return { ...f, [key]: next }
    })
  }

  if (loading || plansLoading) return <p className={styles.muted}>Laden…</p>

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Mijn input</h1>
      <p className={styles.intro}>
        {readOnly
          ? 'Je hebt al een schema gegenereerd. De onderstaande gegevens zijn vastgelegd en kunnen niet meer gewijzigd worden.'
          : 'Vul onderstaande gegevens in voor een persoonlijk 4-weekse trainings- en voedingsrichtlijn. Hoe completer je antwoorden, hoe beter we kunnen aanpassen.'}
      </p>

      {readOnly && <p className={styles.readOnlyBanner}>Schema actief — alleen bekijken</p>}
      {error && <p className={styles.error}>{error}</p>}
      {message && <p className={styles.success}>{message}</p>}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* ——— 1. Basisgegevens ——— */}
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>1. Basisgegevens</h2>
          <p className={styles.sectionDesc}>Leeftijd, lengte, gewicht en eventuele beperkingen bepalen belasting en herstel.</p>
          <div className={styles.fieldGrid}>
            <LabelWithTooltip label="Leeftijd (jaar)" tip="Gebruikt voor inschatting herstel en belastbaarheid.">
              <input type="number" min={14} max={120} value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} placeholder="bijv. 32" className={styles.input} readOnly={readOnly} disabled={readOnly} />
            </LabelWithTooltip>
            <label className={styles.label}><span className={styles.labelText}>Lengte (cm)</span><input type="number" min={100} max={250} value={form.height_cm} onChange={(e) => setForm((f) => ({ ...f, height_cm: e.target.value }))} placeholder="bijv. 175" className={styles.input} readOnly={readOnly} disabled={readOnly} /></label>
            <label className={styles.label}><span className={styles.labelText}>Gewicht (kg)</span><input type="number" min={30} step={0.1} value={form.weight_kg} onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))} placeholder="bijv. 72" className={styles.input} readOnly={readOnly} disabled={readOnly} /></label>
            <label className={styles.label}><span className={styles.labelText}>Geslacht (optioneel)</span><ToggleSelect options={SEX_OPTIONS} value={form.sex} onChange={(v) => setForm((f) => ({ ...f, sex: v }))} disabled={readOnly} /></label>
          </div>
        </section>

        {/* ——— 2. Doel & ervaring ——— */}
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>2. Trainingsdoel & ervaring</h2>
          <p className={styles.sectionDesc}>Dit is je <strong>trainingsdoel</strong>: waar je training op gericht is (bijv. vetverlies, spieropbouw, conditie). Het bepaalt de focus en intensiteit van je schema. Als je wilt afvallen, kies hier &quot;Vetverlies&quot; en bij sectie 6 (Voeding) ook &quot;Vetverlies&quot; voor een passende energie-inname.</p>
          <div className={styles.fieldGrid}>
            <LabelWithTooltip label="Wat is je trainingsdoel?" tip="Vetverlies = training gericht op afvallen. Spieropbouw = kracht en volume. Onderhoud = fit blijven. Dit gaat over je training; je voedingsrichtlijn kies je in sectie 6.">
              <ToggleSelect options={TRAINING_GOALS} value={form.goal} onChange={(v) => setForm((f) => ({ ...f, goal: v }))} disabled={readOnly} />
            </LabelWithTooltip>
            <LabelWithTooltip label="Trainingsniveau" tip="Beginner = rustig opbouwen. Advanced = hogere belasting.">
              <ToggleSelect options={LEVELS} value={form.level} onChange={(v) => setForm((f) => ({ ...f, level: v }))} disabled={readOnly} />
            </LabelWithTooltip>
            <label className={styles.label}><span className={styles.labelText}>Hoofdsport / activiteit</span><input type="text" value={form.main_sport} onChange={(e) => setForm((f) => ({ ...f, main_sport: e.target.value }))} placeholder="bijv. hardlopen, kracht" className={styles.input} readOnly={readOnly} disabled={readOnly} /></label>
            <label className={styles.label}><span className={styles.labelText}>Eventdatum (optioneel)</span><input type="date" value={form.event_date} onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))} className={styles.input} readOnly={readOnly} disabled={readOnly} /></label>
          </div>
        </section>

        {/* ——— 3. Herstel & readiness ——— */}
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>3. Herstel & readiness</h2>
          <p className={styles.sectionDesc}>Slaap en energie helpen het schema aan te passen aan je belastbaarheid.</p>
          <div className={styles.fieldGrid}>
            <label className={styles.label}><span className={styles.labelText}>Slaap (uren per nacht)</span><input type="number" min={0} max={24} step={0.5} value={form.sleep_hours} onChange={(e) => setForm((f) => ({ ...f, sleep_hours: e.target.value }))} placeholder="bijv. 7" className={styles.input} readOnly={readOnly} disabled={readOnly} /></label>
            <label className={styles.label}><span className={styles.labelText}>Slaapkwaliteit (1–5)</span><SelectScore value={form.sleep_quality} onChange={(v) => setForm((f) => ({ ...f, sleep_quality: v }))} options={SCORE_1_5_OPTIONS} disabled={readOnly} /></label>
            <label className={styles.label}><span className={styles.labelText}>Dagelijkse energie (1–5)</span><SelectScore value={form.daily_energy} onChange={(v) => setForm((f) => ({ ...f, daily_energy: v }))} options={SCORE_1_5_OPTIONS} disabled={readOnly} /></label>
            <label className={styles.label}><span className={styles.labelText}>Motivatie (1–5)</span><SelectScore value={form.motivation_level} onChange={(v) => setForm((f) => ({ ...f, motivation_level: v }))} options={SCORE_1_5_OPTIONS} disabled={readOnly} /></label>
            <label className={styles.label}><span className={styles.labelText}>Herstel (1–5)</span><SelectScore value={form.recovery_score} onChange={(v) => setForm((f) => ({ ...f, recovery_score: v }))} options={SCORE_1_5_OPTIONS} disabled={readOnly} /></label>
          </div>
        </section>

        {/* ——— 4. Beschikbaarheid & stress/workload ——— */}
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>4. Beschikbaarheid & levensstijl</h2>
          <p className={styles.sectionDesc}>Aantal dagen en tijd per training. Werkbelasting en stress gebruiken we om je schema aan te passen aan je herstel.</p>
          <p className={styles.sectionRule}>{WORKLOAD_HELP}</p>
          <div className={styles.fieldGrid}>
            <LabelWithTooltip label="Trainingsdagen per week" tip="Hoeveel dagen kun je realistisch trainen?"><input type="number" min={1} max={7} value={form.days_per_week} onChange={(e) => setForm((f) => ({ ...f, days_per_week: e.target.value }))} className={styles.input} readOnly={readOnly} disabled={readOnly} /></LabelWithTooltip>
            <label className={styles.label}><span className={styles.labelText}>Tijd per training (min)</span><input type="number" min={15} max={180} value={form.session_minutes} onChange={(e) => setForm((f) => ({ ...f, session_minutes: e.target.value }))} placeholder="60" className={styles.input} readOnly={readOnly} disabled={readOnly} /></label>
            <LabelWithTooltip label="Werkbelasting (1–5)" tip={WORKLOAD_HELP}>
              <SelectScore value={form.workload_score} onChange={(v) => setForm((f) => ({ ...f, workload_score: v }))} options={WORKLOAD_SCORE_OPTIONS} disabled={readOnly} />
            </LabelWithTooltip>
            <label className={styles.label}><span className={styles.labelText}>Stressniveau (1–5)</span><SelectScore value={form.stress_score} onChange={(v) => setForm((f) => ({ ...f, stress_score: v }))} options={SCORE_1_5_OPTIONS} disabled={readOnly} /></label>
          </div>
        </section>

        {/* ——— 5. Trainingsomgeving ——— */}
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>5. Trainingsomgeving</h2>
          <p className={styles.sectionDesc}>Waar train je en welke materialen heb je? Multi-select voor materiaal.</p>
          <div className={styles.fieldGrid}>
            <label className={styles.label}><span className={styles.labelText}>Locatie</span><ToggleSelect options={TRAINING_LOCATION_OPTIONS} value={form.training_location} onChange={(v) => setForm((f) => ({ ...f, training_location: v }))} disabled={readOnly} emptyLabel="—" /></label>
            <div className={styles.labelFull}>
              <span className={styles.labelText}>Beschikbaar materiaal (meerdere mogelijk)</span>
              <div className={styles.dietOptions}>
                {EQUIPMENT_OPTIONS.map((opt) => (
                  <label key={opt.value} className={styles.check}>
                    <input type="checkbox" checked={(form.equipment_available ?? []).includes(opt.value)} onChange={() => toggleArray('equipment_available', opt.value)} disabled={readOnly} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ——— 6. Voeding ——— */}
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>6. Voeding</h2>
          <p className={styles.sectionDesc}>Je <strong>voedingsdoel</strong> gaat over energie en macro&apos;s: hoeveel je eet en waaruit. Dit is iets anders dan je trainingsdoel (sectie 2). <strong>Vetverlies</strong> = licht calorietekort (afvallen), past bij trainingsdoel Vetverlies. <strong>Prestatie</strong> = meer energie bij zware sport. <strong>Onderhoud</strong> = gewicht en energie gelijk houden.</p>
          <div className={styles.fieldGrid}>
            <LabelWithTooltip label="Voedingsdoel" tip="Vetverlies = licht tekort voor afvallen (past bij trainingsdoel Vetverlies). Prestatie = meer eten bij zware sport. Onderhoud = gelijk blijven."><ToggleSelect options={NUTRITION_GOALS} value={form.nutrition_goal} onChange={(v) => setForm((f) => ({ ...f, nutrition_goal: v }))} disabled={readOnly} /></LabelWithTooltip>
            <label className={styles.label}><span className={styles.labelText}>Maaltijden per dag (2–6)</span><input type="number" min={2} max={6} value={form.meals_per_day} onChange={(e) => setForm((f) => ({ ...f, meals_per_day: e.target.value }))} placeholder="—" className={styles.input} readOnly={readOnly} disabled={readOnly} /></label>
            <label className={styles.label}><span className={styles.labelText}>Kookniveau</span><ToggleSelect options={COOKING_SKILL_OPTIONS} value={form.cooking_skill} onChange={(v) => setForm((f) => ({ ...f, cooking_skill: v }))} disabled={readOnly} emptyLabel="—" /></label>
            <label className={styles.label}><span className={styles.labelText}>Budget (voeding)</span><ToggleSelect options={BUDGET_LEVEL_OPTIONS} value={form.budget_level} onChange={(v) => setForm((f) => ({ ...f, budget_level: v }))} disabled={readOnly} emptyLabel="—" /></label>
            <label className={styles.label}><span className={styles.labelText}>Snacken tussendoor?</span><ToggleSelect options={[{ value: 'ja', label: 'Ja' }, { value: 'nee', label: 'Nee' }]} value={form.snacking_habit === null ? '' : form.snacking_habit ? 'ja' : 'nee'} onChange={(v) => setForm((f) => ({ ...f, snacking_habit: v === '' ? null : v === 'ja' }))} disabled={readOnly} emptyLabel="—" /></label>
            <label className={styles.label}><span className={styles.labelText}>Alcohol</span><ToggleSelect options={ALCOHOL_FREQUENCY_OPTIONS} value={form.alcohol_frequency} onChange={(v) => setForm((f) => ({ ...f, alcohol_frequency: v }))} disabled={readOnly} emptyLabel="—" /></label>
            <div className={styles.labelFull}><span className={styles.labelText}>Dieetvoorkeur of beperkingen</span><div className={styles.dietOptions}>{DIET_OPTIONS.map((opt) => (<label key={opt.value} className={styles.check}><input type="checkbox" checked={(form.dietaryOptions ?? []).includes(opt.value)} onChange={(e) => { if (readOnly) return; setForm((f) => ({ ...f, dietaryOptions: e.target.checked ? [...(f.dietaryOptions || []), opt.value] : (f.dietaryOptions || []).filter((v) => v !== opt.value) })) }} disabled={readOnly} />{opt.label}</label>))}</div><input type="text" value={form.dietaryOther} onChange={(e) => setForm((f) => ({ ...f, dietaryOther: e.target.value }))} placeholder="Overige voorkeuren" className={styles.input} readOnly={readOnly} disabled={readOnly} /></div>
            <label className={styles.labelFull}><span className={styles.labelText}>Allergieën of restricties</span><textarea value={form.restrictions} onChange={(e) => setForm((f) => ({ ...f, restrictions: e.target.value }))} placeholder="Optioneel" rows={2} className={styles.input} readOnly={readOnly} disabled={readOnly} /></label>
            <div className={styles.labelFull}><label className={styles.check}><input type="checkbox" checked={form.wants_nutrition} onChange={(e) => setForm((f) => ({ ...f, wants_nutrition: e.target.checked }))} disabled={readOnly} />Voedingsrichtlijn meenemen in schema</label><label className={styles.check}><input type="checkbox" checked={form.wants_training} onChange={(e) => setForm((f) => ({ ...f, wants_training: e.target.checked }))} disabled={readOnly} />Trainingsschema genereren</label></div>
          </div>
        </section>

        {/* ——— 7. Blessures (gestructureerd) ——— */}
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>7. Blessures & beperkingen</h2>
          <p className={styles.sectionDesc}>Selecteer gebieden en vul eventueel extra toe. Vrije tekst blijft naast tags.</p>
          <div className={styles.fieldGrid}>
            <div className={styles.labelFull}><span className={styles.labelText}>Gebied (meerdere mogelijk)</span><div className={styles.dietOptions}>{INJURY_TAG_OPTIONS.map((opt) => (<label key={opt.value} className={styles.check}><input type="checkbox" checked={(form.injury_tags ?? []).includes(opt.value)} onChange={() => toggleArray('injury_tags', opt.value)} disabled={readOnly} />{opt.label}</label>))}</div></div>
            <label className={styles.labelFull}><span className={styles.labelText}>Toelichting (optioneel)</span><textarea value={form.injury_notes} onChange={(e) => setForm((f) => ({ ...f, injury_notes: e.target.value }))} placeholder="Extra toelichting bij blessures of beperkingen" rows={2} className={styles.input} readOnly={readOnly} disabled={readOnly} /></label>
          </div>
        </section>

        {/* ——— 8. Supplementen (gestructureerd) ——— */}
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>8. Supplementen</h2>
          <p className={styles.sectionDesc}>Meerdere mogelijk. Optioneel vrije notitie.</p>
          <div className={styles.fieldGrid}>
            <div className={styles.labelFull}><span className={styles.labelText}>Wat gebruik je?</span><div className={styles.dietOptions}>{SUPPLEMENT_OPTIONS.map((opt) => (<label key={opt.value} className={styles.check}><input type="checkbox" checked={(form.supplements ?? []).includes(opt.value)} onChange={() => toggleArray('supplements', opt.value)} disabled={readOnly} />{opt.label}</label>))}</div><input type="text" value={form.supplements_notes} onChange={(e) => setForm((f) => ({ ...f, supplements_notes: e.target.value }))} placeholder="Overige of toelichting (optioneel)" className={styles.input} readOnly={readOnly} disabled={readOnly} /></div>
          </div>
        </section>

        {/* ——— 9. Trainingsplanning ——— */}
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>9. Trainingsplanning voorkeuren</h2>
          <p className={styles.sectionDesc}>Voorkeursdagen en moment van de dag.</p>
          <div className={styles.fieldGrid}>
            <label className={styles.label}><span className={styles.labelText}>Voorkeur moment</span><ToggleSelect options={PREFERRED_TRAINING_TIME_OPTIONS} value={form.preferred_training_time} onChange={(v) => setForm((f) => ({ ...f, preferred_training_time: v }))} disabled={readOnly} emptyLabel="—" /></label>
            <div className={styles.labelFull}><span className={styles.labelText}>Voorkeursdagen (meerdere mogelijk)</span><div className={styles.dietOptions}>{WEEKDAY_OPTIONS.map((opt) => (<label key={opt.value} className={styles.check}><input type="checkbox" checked={(form.preferred_training_days ?? []).includes(opt.value)} onChange={() => toggleArray('preferred_training_days', opt.value)} disabled={readOnly} />{opt.label}</label>))}</div></div>
          </div>
        </section>

        {/* ——— 10. Motivatie & gedrag ——— */}
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>10. Motivatie & gedrag</h2>
          <p className={styles.sectionDesc}>Voor coaching: waarom dit doel en wat maakt trainen lastig?</p>
          <div className={styles.fieldGrid}>
            <label className={styles.labelFull}><span className={styles.labelText}>Waarom wil je dit doel bereiken?</span><textarea value={form.why_goal} onChange={(e) => setForm((f) => ({ ...f, why_goal: e.target.value }))} placeholder="Optioneel" rows={2} className={styles.input} readOnly={readOnly} disabled={readOnly} /></label>
            <label className={styles.labelFull}><span className={styles.labelText}>Wat maakt trainen lastig?</span><textarea value={form.biggest_barrier} onChange={(e) => setForm((f) => ({ ...f, biggest_barrier: e.target.value }))} placeholder="Optioneel" rows={2} className={styles.input} readOnly={readOnly} disabled={readOnly} /></label>
            <label className={styles.label}><span className={styles.labelText}>Trainingsvoorkeur</span><ToggleSelect options={TRAINING_PREFERENCE_OPTIONS} value={form.training_preference} onChange={(v) => setForm((f) => ({ ...f, training_preference: v }))} disabled={readOnly} emptyLabel="—" /></label>
          </div>
        </section>

        {!readOnly && (<button type="submit" disabled={saving} className={styles.button}>{saving ? 'Opslaan…' : 'Opslaan'}</button>)}
      </form>

      {showWelcomeModal && (
        <ClientInputWelcomeModal onClose={closeWelcomeModal} />
      )}
      {showThankYouModal && (
        <ThankYouModal onClose={() => setShowThankYouModal(false)} />
      )}
    </div>
  )
}
