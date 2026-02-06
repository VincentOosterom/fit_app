import { useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import { useClientNotifications } from '../hooks/useClientNotifications'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import styles from './CoachBlock.module.css'

const PRESET_OPTIONS = [
  { type: 'training', label: 'Training was te zwaar', body: 'Training was te zwaar' },
  { type: 'algemeen', label: 'Ik voel me moe', body: 'Ik voel me moe' },
  { type: 'blessure', label: 'Blessureklacht', body: 'Blessureklacht' },
  { type: 'voeding', label: 'Vraag over voeding', body: 'Vraag over voeding' },
  { type: 'algemeen', label: 'Vrij bericht', body: '' },
]

export function CoachBlock({ onMessageSent }) {
  const { profile, coachProfile } = useProfile()
  const { user } = useAuth()
  const coachId = profile?.coach_id
  const { messages, loading, refetch } = useClientNotifications(user?.id, coachId)
  const [showForm, setShowForm] = useState(false)
  const [preset, setPreset] = useState('')
  const [customBody, setCustomBody] = useState('')
  const [priority, setPriority] = useState('normaal')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)

  if (!coachId || !coachProfile) return null

  const coachName = coachProfile.full_name?.trim() || coachProfile.email || 'Je coach'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user?.id || !coachId) return
    const body = preset === 'Vrij bericht' ? customBody.trim() : (PRESET_OPTIONS.find((p) => p.label === preset)?.body || customBody.trim())
    if (!body) {
      setSendError('Schrijf een korte melding.')
      return
    }
    setSending(true)
    setSendError(null)
    const type = PRESET_OPTIONS.find((p) => p.label === preset)?.type || 'algemeen'
    const { error } = await supabase.from('client_notifications').insert({
      client_id: user.id,
      coach_id: coachId,
      type,
      priority,
      body,
    })
    setSending(false)
    if (error) {
      setSendError(error.message)
      return
    }
    setShowForm(false)
    setPreset('')
    setCustomBody('')
    onMessageSent?.()
    refetch()
  }

  return (
    <section className={styles.coachBlock}>
      <h2 className={styles.coachBlockTitle}>Je coach</h2>
      <div className={styles.coachBlockHeader}>
        <div className={styles.coachAvatar} aria-hidden>
          {(coachProfile.full_name || 'C').charAt(0).toUpperCase()}
        </div>
        <div className={styles.coachInfo}>
          <p className={styles.coachName}>{coachName}</p>
          <p className={styles.coachSub}>Stel vragen of geef door hoe het gaat.</p>
        </div>
      </div>
      <button type="button" className={styles.coachCta} onClick={() => setShowForm(true)}>
        Stuur bericht naar coach
      </button>

      {showForm && (
        <div className={styles.formOverlay}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <h3 className={styles.formTitle}>Melding naar coach</h3>
            <div className={styles.formRow}>
              <label className={styles.label}>Type</label>
              <select
                className={styles.select}
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
              >
                <option value="">Kies een optie…</option>
                {PRESET_OPTIONS.map((p) => (
                  <option key={p.label} value={p.label}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Prioriteit</label>
              <select className={styles.select} value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="laag">Laag</option>
                <option value="normaal">Normaal</option>
                <option value="hoog">Hoog</option>
              </select>
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Bericht</label>
              <textarea
                className={styles.textarea}
                value={preset === 'Vrij bericht' ? customBody : (PRESET_OPTIONS.find((p) => p.label === preset)?.body || customBody)}
                onChange={(e) => setCustomBody(e.target.value)}
                placeholder="Korte toelichting…"
                rows={3}
                disabled={preset && preset !== 'Vrij bericht'}
              />
            </div>
            {sendError && <p className={styles.error}>{sendError}</p>}
            <div className={styles.formActions}>
              <button type="button" className={styles.btnSecondary} onClick={() => setShowForm(false)}>
                Annuleren
              </button>
              <button type="submit" className={styles.btnPrimary} disabled={sending}>
                {sending ? 'Versturen…' : 'Versturen'}
              </button>
            </div>
          </form>
        </div>
      )}

      {messages.length > 0 && (
        <div className={styles.feedbackSection}>
          <h3 className={styles.feedbackTitle}>Laatste feedback van coach</h3>
          <div className={styles.feedbackList}>
            {messages.slice(0, 3).map((m) => (
              <div key={m.id} className={styles.feedbackItem}>
                <p className={styles.feedbackBody}>{m.body}</p>
                <span className={styles.feedbackMeta}>{new Date(m.created_at).toLocaleString('nl-NL')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {loading && messages.length === 0 && <p className={styles.muted}>Laden…</p>}
    </section>
  )
}
