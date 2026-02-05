import { useState, useEffect } from 'react'
import { useClientInput } from '../hooks/useClientInput'
import { usePlans } from '../hooks/usePlans'
import Tooltip from '../components/Tooltip'
import styles from './ClientInput.module.css'

import { getTrainingGoalsForInput } from '../lib/trainingGoals'

const TRAINING_GOALS = getTrainingGoalsForInput()

const LEVELS = [
  { value: 'beginner', label: 'Beginner', tip: 'Minder dan 1 jaar structureel getraind.' },
  { value: 'intermediate', label: 'Intermediate', tip: '1–3 jaar ervaring, regelmatig trainen.' },
  { value: 'advanced', label: 'Advanced', tip: 'Meerdere jaren ervaring, hoge frequentie en volume.' },
]

const NUTRITION_GOALS = [
  { value: 'prestatie', label: 'Prestatie (veel energie)', tip: 'Bij zware training (marathon, kracht + duur) heb je meer kcal en koolhydraten nodig. We zetten de inname daarop.' },
  { value: 'onderhoud', label: 'Onderhoud', tip: 'Weekgemiddelde dat past bij je activiteit zonder aan te komen of af te vallen.' },
  { value: 'vetverlies', label: 'Vetverlies', tip: 'Licht energietekort, voldoende eiwit om spiermassa te behouden.' },
]

const WORK_LOAD_OPTIONS = [
  { value: 'laag', label: 'Laag' },
  { value: 'middel', label: 'Middel' },
  { value: 'hoog', label: 'Hoog' },
]

const STRESS_OPTIONS = [
  { value: 'laag', label: 'Laag' },
  { value: 'middel', label: 'Middel' },
  { value: 'hoog', label: 'Hoog' },
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
  if (other.trim()) list.push(other.trim())
  return list.join(', ') || ''
}

const defaultForm = {
  age: '',
  height_cm: '',
  weight_kg: '',
  sex: '',
  injuries_limitations: '',
  level: 'beginner',
  main_sport: '',
  goal: 'fit_vanaf_nul',
  event_date: '',
  days_per_week: 3,
  session_minutes: 60,
  work_load: '',
  stress_level: '',
  nutrition_goal: 'onderhoud',
  dietaryOptions: [],
  dietaryOther: '',
  restrictions: '',
  uses_supplements: false,
  supplements_notes: '',
  wants_nutrition: true,
  wants_training: true,
}

function LabelWithTooltip({ label, tip, children }) {
  return (
    <label>
      <Tooltip text={tip}>
        <span>{label}</span>
      </Tooltip>
      {children}
    </label>
  )
}

export default function ClientInput() {
  const { input, loading, error, saveInput } = useClientInput()
  const { hasAnyPlan, loading: plansLoading } = usePlans()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState(defaultForm)
  const readOnly = hasAnyPlan

  useEffect(() => {
    if (input) {
      const { options: dietaryOptions, other: dietaryOther } = parseDietaryPrefs(input.dietary_prefs ?? '')
      setForm({
        age: input.age ?? '',
        height_cm: input.height_cm ?? '',
        weight_kg: input.weight_kg ?? '',
        sex: input.sex ?? '',
        injuries_limitations: input.injuries_limitations ?? '',
        level: input.level ?? 'beginner',
        main_sport: input.main_sport ?? '',
        goal: input.goal ?? 'fit_vanaf_nul',
        event_date: input.event_date ? input.event_date.slice(0, 10) : '',
        days_per_week: input.days_per_week ?? 3,
        session_minutes: input.session_minutes ?? 60,
        work_load: input.work_load ?? '',
        stress_level: input.stress_level ?? '',
        nutrition_goal: input.nutrition_goal ?? 'onderhoud',
        dietaryOptions,
        dietaryOther,
        restrictions: input.restrictions ?? '',
        uses_supplements: input.uses_supplements ?? false,
        supplements_notes: input.supplements_notes ?? '',
        wants_nutrition: input.wants_nutrition ?? true,
        wants_training: input.wants_training ?? true,
      })
    }
  }, [input])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setSaving(true)
    try {
      await saveInput({
        age: form.age ? Number(form.age) : null,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        sex: form.sex || null,
        injuries_limitations: form.injuries_limitations.trim() || null,
        level: form.level,
        main_sport: form.main_sport.trim() || null,
        goal: form.goal,
        event_date: form.event_date || null,
        days_per_week: Math.min(7, Math.max(1, Number(form.days_per_week) || 3)),
        session_minutes: Math.min(180, Math.max(15, Number(form.session_minutes) || 60)),
        work_load: form.work_load || null,
        stress_level: form.stress_level || null,
        nutrition_goal: form.nutrition_goal,
        dietary_prefs: serializeDietaryPrefs(form.dietaryOptions, form.dietaryOther) || null,
        restrictions: form.restrictions.trim() || null,
        uses_supplements: form.uses_supplements,
        supplements_notes: form.supplements_notes.trim() || null,
        wants_nutrition: form.wants_nutrition,
        wants_training: form.wants_training,
      })
      setMessage('Opgeslagen. Genereer op het dashboard je 4-weekse schema.')
    } catch {
      // error in hook
    } finally {
      setSaving(false)
    }
  }

  if (loading || plansLoading) return <p className={styles.muted}>Laden…</p>

  return (
    <div className={styles.page}>
      <h1>Mijn input</h1>
      <p className={styles.intro}>
        {readOnly
          ? 'Je hebt al een schema gegenereerd. De onderstaande gegevens zijn vastgelegd en kunnen niet meer gewijzigd worden — het schema is hierop gebaseerd.'
          : 'Vul onderstaande gegevens duidelijk in. Op basis hiervan maken we een 4-weekse trainings- en voedingsrichtlijn. Bij zware sport (bijv. marathon + kracht) hoort een hogere energie-inname — we houden daar rekening mee.'}
      </p>

      {readOnly && <p className={styles.readOnlyBanner}>Schema actief — alleen bekijken</p>}
      {error && <p className={styles.error}>{error}</p>}
      {message && <p className={styles.success}>{message}</p>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
        <section className={styles.section}>
          <h2>1. Basisgegevens</h2>
          <LabelWithTooltip label="Leeftijd" tip="Gebruikt voor inschatting herstel en belastbaarheid.">
            <input
              type="number"
              min={14}
              max={120}
              value={form.age}
              onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
              placeholder="Jaren"
              className={styles.input}
              readOnly={readOnly}
              disabled={readOnly}
            />
          </LabelWithTooltip>
          <label>
            Lengte (cm)
            <input
              type="number"
              min={100}
              max={250}
              value={form.height_cm}
              onChange={(e) => setForm((f) => ({ ...f, height_cm: e.target.value }))}
              className={styles.input}
              readOnly={readOnly}
              disabled={readOnly}
            />
          </label>
          <label>
            Gewicht (kg)
            <input
              type="number"
              min={30}
              step={0.1}
              value={form.weight_kg}
              onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))}
              className={styles.input}
              readOnly={readOnly}
              disabled={readOnly}
            />
          </label>
          <label>
            Geslacht (optioneel)
            <select
              value={form.sex}
              onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value }))}
              className={styles.input}
              disabled={readOnly}
            >
              {SEX_OPTIONS.map((o) => (
                <option key={o.value || 'empty'} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label>
            Blessures of beperkingen
            <textarea
              value={form.injuries_limitations}
              onChange={(e) => setForm((f) => ({ ...f, injuries_limitations: e.target.value }))}
              placeholder="Optioneel"
              rows={2}
              className={styles.input}
              readOnly={readOnly}
              disabled={readOnly}
            />
          </label>
        </section>

        <section className={styles.section}>
          <h2>2. Doel & ervaring</h2>
          <LabelWithTooltip label="Wat is je doel?" tip="Kies het dat het beste past. Dit bepaalt de focus van je schema (volume, intensiteit, herstel).">
            <select
              value={form.goal}
              onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
              className={styles.input}
              disabled={readOnly}
            >
              {TRAINING_GOALS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </LabelWithTooltip>
          <LabelWithTooltip label="Trainingsniveau" tip="Beginner = rustig opbouwen. Intermediate = meer volume. Advanced = hogere belasting en intensiteit.">
            <select
              value={form.level}
              onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
              className={styles.input}
              disabled={readOnly}
            >
              {LEVELS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </LabelWithTooltip>
          <LabelWithTooltip label="Hoofdsport / activiteit" tip="Bijv. hardlopen, kracht, wielrennen, zwemmen. Bij marathon + kracht rekenen we op hogere energiebehoefte.">
            <input
              type="text"
              value={form.main_sport}
              onChange={(e) => setForm((f) => ({ ...f, main_sport: e.target.value }))}
              placeholder="bijv. hardlopen, kracht, wielrennen"
              className={styles.input}
              readOnly={readOnly}
              disabled={readOnly}
            />
          </LabelWithTooltip>
          <label>
            Eventdatum (optioneel)
            <input
              type="date"
              value={form.event_date}
              onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
              className={styles.input}
              readOnly={readOnly}
              disabled={readOnly}
            />
          </label>
        </section>

        <section className={styles.section}>
          <h2>3. Beschikbaarheid & levensstijl</h2>
          <LabelWithTooltip label="Trainingsdagen per week" tip="Hoeveel dagen kun je realistisch trainen? Het schema past zich hierop aan.">
            <input
              type="number"
              min={1}
              max={7}
              value={form.days_per_week}
              onChange={(e) => setForm((f) => ({ ...f, days_per_week: e.target.value }))}
              className={styles.input}
              readOnly={readOnly}
              disabled={readOnly}
            />
          </LabelWithTooltip>
          <label>
            Gemiddelde tijd per training (minuten)
            <input
              type="number"
              min={15}
              max={180}
              value={form.session_minutes}
              onChange={(e) => setForm((f) => ({ ...f, session_minutes: e.target.value }))}
              className={styles.input}
              readOnly={readOnly}
              disabled={readOnly}
            />
          </label>
          <label>
            Werkbelasting
            <select
              value={form.work_load}
              onChange={(e) => setForm((f) => ({ ...f, work_load: e.target.value }))}
              className={styles.input}
              disabled={readOnly}
            >
              <option value="">—</option>
              {WORK_LOAD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label>
            Stressniveau (globaal)
            <select
              value={form.stress_level}
              onChange={(e) => setForm((f) => ({ ...f, stress_level: e.target.value }))}
              className={styles.input}
              disabled={readOnly}
            >
              <option value="">—</option>
              {STRESS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        </section>

        <section className={styles.section}>
          <h2>4. Voeding</h2>
          <LabelWithTooltip label="Voedingsdoel" tip="Prestatie = meer eten bij zware sport. Vetverlies = licht tekort. Onderhoud = in balans.">
            <select
              value={form.nutrition_goal}
              onChange={(e) => setForm((f) => ({ ...f, nutrition_goal: e.target.value }))}
              className={styles.input}
              disabled={readOnly}
            >
              {NUTRITION_GOALS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </LabelWithTooltip>
          <div className={styles.dietSection}>
            <span className={styles.dietLabel}>Dieetvoorkeur of beperkingen</span>
            <div className={styles.dietOptions}>
              {DIET_OPTIONS.map((opt) => (
                <label key={opt.value} className={styles.check}>
                  <input
                    type="checkbox"
                    checked={form.dietaryOptions.includes(opt.value)}
                    onChange={(e) => {
                      if (readOnly) return
                      setForm((f) => ({
                        ...f,
                        dietaryOptions: e.target.checked
                          ? [...f.dietaryOptions, opt.value]
                          : f.dietaryOptions.filter((v) => v !== opt.value),
                      }))
                    }}
                    disabled={readOnly}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <input
              type="text"
              value={form.dietaryOther}
              onChange={(e) => setForm((f) => ({ ...f, dietaryOther: e.target.value }))}
              placeholder="Overige voorkeuren (optioneel)"
              className={styles.input}
              readOnly={readOnly}
              disabled={readOnly}
            />
          </div>
          <label>
            Allergieën of overige restricties
            <textarea
              value={form.restrictions}
              onChange={(e) => setForm((f) => ({ ...f, restrictions: e.target.value }))}
              placeholder="Optioneel"
              rows={2}
              className={styles.input}
              readOnly={readOnly}
              disabled={readOnly}
            />
          </label>
          <LabelWithTooltip label="Gebruik je al sportsupplementen?" tip="Bijv. eiwitpoeder, creatine, pre-workout. We houden er rekening mee in de richtlijnen.">
            <div className={styles.checkRow}>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={form.uses_supplements}
                  onChange={(e) => setForm((f) => ({ ...f, uses_supplements: e.target.checked }))}
                  disabled={readOnly}
                />
                Ja, ik gebruik sportsupplementen
              </label>
            </div>
          </LabelWithTooltip>
          {form.uses_supplements && (
            <label>
              Welke supplementen? (optioneel)
              <input
                type="text"
                value={form.supplements_notes}
                onChange={(e) => setForm((f) => ({ ...f, supplements_notes: e.target.value }))}
                placeholder="bijv. eiwitpoeder, creatine"
                className={styles.input}
                readOnly={readOnly}
                disabled={readOnly}
              />
            </label>
          )}
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={form.wants_nutrition}
              onChange={(e) => setForm((f) => ({ ...f, wants_nutrition: e.target.checked }))}
              disabled={readOnly}
            />
            Voedingsrichtlijn meenemen in schema
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={form.wants_training}
              onChange={(e) => setForm((f) => ({ ...f, wants_training: e.target.checked }))}
              disabled={readOnly}
            />
            Trainingsschema genereren
          </label>
        </section>
        </div>

        {!readOnly && (
          <button type="submit" disabled={saving} className={styles.button}>
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        )}
      </form>
    </div>
  )
}
