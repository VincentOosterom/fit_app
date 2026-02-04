import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import styles from './WeekReviewForm.module.css'

const HOW_WENT_OPTIONS = [
  { value: 'goed', label: 'Goed' },
  { value: 'redelijk', label: 'Redelijk' },
  { value: 'slecht', label: 'Slecht' },
]

const HUNGRY_OPTIONS = [
  { value: 'geen', label: 'Nee, geen honger of futloos' },
  { value: 'honger', label: 'Ja, ik had honger na een dag het dieet te volgen' },
  { value: 'futloos', label: 'Ja, ik voelde me futloos' },
  { value: 'beide', label: 'Beide: honger en futloos' },
]

const YES_NO_OPTIONS = [
  { value: 'ja', label: 'Ja' },
  { value: 'nee', label: 'Nee' },
  { value: 'redelijk', label: 'Redelijk' },
]

export default function WeekReviewForm({ blockId, weekNumber, existingReview, onSubmitted }) {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [form, setForm] = useState({
    how_went: existingReview?.how_went ?? '',
    hungry_or_futloos: existingReview?.hungry_or_futloos ?? '',
    slept_well: existingReview?.slept_well ?? '',
    training_went_well: existingReview?.training_went_well ?? '',
    what_better_sleep: existingReview?.what_better_sleep ?? '',
    what_better_eating: existingReview?.what_better_eating ?? '',
    what_better_training: existingReview?.what_better_training ?? '',
    cheat_day_notes: existingReview?.cheat_day_notes ?? '',
    wants_follow_up: existingReview?.wants_follow_up ?? false,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!blockId || !user?.id) return
    setSaving(true)
    try {
      await supabase.from('week_reviews').upsert({
        user_id: user.id,
        block_id: blockId,
        week_number: weekNumber,
        how_went: form.how_went || null,
        hungry_or_futloos: form.hungry_or_futloos || null,
        slept_well: form.slept_well || null,
        training_went_well: form.training_went_well || null,
        what_better_sleep: form.what_better_sleep.trim() || null,
        what_better_eating: form.what_better_eating.trim() || null,
        what_better_training: form.what_better_training.trim() || null,
        cheat_day_notes: form.cheat_day_notes.trim() || null,
        wants_follow_up: weekNumber === 4 ? form.wants_follow_up : false,
      }, { onConflict: 'user_id,block_id,week_number' })
      if (weekNumber === 4) setShowFollowUp(true)
      else setDone(true)
      onSubmitted?.()
    } finally {
      setSaving(false)
    }
  }

  const handleFollowUpChoice = async (wantsFollowUp) => {
    if (!blockId || !user?.id) return
    setSaving(true)
    try {
      await supabase.from('week_reviews').update({ wants_follow_up: wantsFollowUp }).eq('user_id', user.id).eq('block_id', blockId).eq('week_number', 4)
      setDone(true)
      onSubmitted?.()
    } finally {
      setSaving(false)
    }
  }

  if (existingReview && !showFollowUp && weekNumber !== 4) {
    return (
      <div className={styles.wrap}>
        <p className={styles.done}>Evaluatie week {weekNumber} ingevuld.</p>
        <p className={styles.muted}>Hoe het ging: {existingReview.how_went}</p>
      </div>
    )
  }

  if (done && weekNumber !== 4) {
    return <p className={styles.done}>Bedankt. Evaluatie week {weekNumber} opgeslagen.</p>
  }

  if (done && weekNumber === 4 && !showFollowUp) {
    return <p className={styles.done}>Bedankt. Je kunt op het dashboard een vervolgschema genereren.</p>
  }

  if (showFollowUp) {
    return (
      <div className={styles.wrap}>
        <p className={styles.followUpTitle}>Alles goed gegaan?</p>
        <div className={styles.followUpButtons}>
          <button type="button" className={styles.button} onClick={() => handleFollowUpChoice(true)} disabled={saving}>
            Ja, geef vervolg schema
          </button>
          <button type="button" className={styles.buttonSecondary} onClick={() => handleFollowUpChoice(false)} disabled={saving}>
            Nee, pas aan op mijn feedback
          </button>
        </div>
        <p className={styles.muted}>Bij aanpassen nemen we je feedback mee voor het volgende schema.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h3>Evaluatie week {weekNumber}</h3>
      <p className={styles.muted}>Na elke week even doorgeven hoe het ging. Zo kunnen we je schema zo nodig bijsturen.</p>

      <label>
        Hoe ging deze week in het algemeen?
        <select value={form.how_went} onChange={(e) => setForm((f) => ({ ...f, how_went: e.target.value }))} className={styles.input} required>
          <option value="">—</option>
          {HOW_WENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>

      <label>
        Heb je honger gevoeld na een dag het dieet te volgen, of voelde je je futloos?
        <select value={form.hungry_or_futloos} onChange={(e) => setForm((f) => ({ ...f, hungry_or_futloos: e.target.value }))} className={styles.input}>
          <option value="">—</option>
          {HUNGRY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>

      <label>
        Heb je goed geslapen?
        <select value={form.slept_well} onChange={(e) => setForm((f) => ({ ...f, slept_well: e.target.value }))} className={styles.input}>
          <option value="">—</option>
          {YES_NO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>

      <label>
        Ging de training goed?
        <select value={form.training_went_well} onChange={(e) => setForm((f) => ({ ...f, training_went_well: e.target.value }))} className={styles.input}>
          <option value="">—</option>
          {YES_NO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>

      <label>
        Wat kan beter qua slaap? (optioneel)
        <input type="text" value={form.what_better_sleep} onChange={(e) => setForm((f) => ({ ...f, what_better_sleep: e.target.value }))} placeholder="Bijv. later naar bed" className={styles.input} />
      </label>
      <label>
        Wat kan beter qua eten? (optioneel)
        <input type="text" value={form.what_better_eating} onChange={(e) => setForm((f) => ({ ...f, what_better_eating: e.target.value }))} placeholder="Optioneel" className={styles.input} />
      </label>
      <label>
        Wat kan beter qua training? (optioneel)
        <input type="text" value={form.what_better_training} onChange={(e) => setForm((f) => ({ ...f, what_better_training: e.target.value }))} placeholder="Optioneel" className={styles.input} />
      </label>
      <label>
        Cheat day of uit eten gehad?
        <textarea value={form.cheat_day_notes} onChange={(e) => setForm((f) => ({ ...f, cheat_day_notes: e.target.value }))} placeholder="Optioneel" rows={2} className={styles.input} />
      </label>
      <button type="submit" disabled={saving} className={styles.button}>{saving ? 'Opslaan…' : 'Versturen'}</button>
    </form>
  )
}
