import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useSubscription } from '../hooks/useSubscription'
import { useEvents } from '../hooks/useEvents'
import { hasFeature } from '../lib/planFeatures'
import { useClientInput } from '../hooks/useClientInput'
import { usePlans } from '../hooks/usePlans'
import { buildTrainingPlan } from '../rules/trainingEngine'
import { buildNutritionPlan } from '../rules/nutritionEngine'
import { FITNESS_FACTS } from '../lib/fitnessFacts'
import {
  EVENT_TYPES,
  PRESTATIEDOELEN,
  getWeeksUntilEvent,
  getPeriodizationPhase,
  getTaperWeeks,
  getCarbLoadPlan,
  getRaceDayNutrition,
  getRecoveryNutrition,
  getReadinessScore,
} from '../lib/eventEngine'
import styles from './EventDashboard.module.css'

function Countdown({ eventDate }) {
  const d = new Date(eventDate)
  const now = new Date()
  d.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  const diff = d - now
  const days = Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)))
  if (days === 0) return <span className={styles.countdownBig}>Vandaag!</span>
  if (days === 1) return <span className={styles.countdownBig}>1 dag</span>
  return <span className={styles.countdownBig}>{days} dagen</span>
}

function FactsCarousel({ onClose }) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % FITNESS_FACTS.length)
    }, 5500)
    return () => clearInterval(id)
  }, [])
  return (
    <div className={styles.factsCarousel}>
      <p className={styles.factsTitle}>Feit {index + 1} van {FITNESS_FACTS.length}</p>
      <div className={styles.factsSlideWrap}>
        <p key={index} className={styles.factsText}>{FITNESS_FACTS[index]}</p>
      </div>
      <div className={styles.factsDots}>
        {FITNESS_FACTS.map((_, i) => (
          <span key={i} className={i === index ? styles.factsDotActive : styles.factsDot} aria-hidden />
        ))}
      </div>
      <button type="button" onClick={onClose} className={styles.factsClose}>Sluiten</button>
    </div>
  )
}

export default function EventDashboard() {
  const { user } = useAuth()
  const { planType } = useSubscription()
  const { input } = useClientInput()
  const { events, loading, addEvent, deleteEvent } = useEvents()
  const canUseEvents = hasFeature(planType, 'event_programs')
  const { blockReviews, refetch, blockId, trainingPlan, nutritionPlan } = usePlans()
  const [showForm, setShowForm] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [form, setForm] = useState({
    event_type: 'wedstrijd',
    event_date: '',
    event_name: '',
    distance_km: '',
    duration_minutes: '',
    prestatiedoel: 'finishen',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPostEventModal, setShowPostEventModal] = useState(false)
  const [postEventPhase, setPostEventPhase] = useState('loading') // 'loading' | 'facts'
  const [postEventError, setPostEventError] = useState(null)

  const event = selectedEvent ? events.find((e) => e.id === selectedEvent) : events[0]
  const weeksUntil = event ? getWeeksUntilEvent(event.event_date) : null
  const phase = weeksUntil != null ? getPeriodizationPhase(weeksUntil) : null
  const taperWeeks = event ? getTaperWeeks(event.event_type, weeksUntil ?? 0) : 0
  const carbLoad = event ? getCarbLoadPlan(event.event_type) : null
  const raceDay = event ? getRaceDayNutrition(event.event_type, event.duration_minutes) : null
  const recovery = event ? getRecoveryNutrition(event.event_type) : null
  const readiness = getReadinessScore(weeksUntil, phase, blockReviews?.length ?? 0)

  const runPlanGeneration = async () => {
    if (!user?.id) return
    setPostEventError(null)
    if (input) {
      const newBlockId = blockId || crypto.randomUUID()
      try {
        const trainingData = buildTrainingPlan(input)
        const nutritionData = buildNutritionPlan(input)
        const [tRes, nRes] = await Promise.all([
          supabase.from('training_plans').insert({ user_id: user.id, block_id: newBlockId, plan: trainingData }).select('id').single(),
          supabase.from('nutrition_plans').insert({ user_id: user.id, block_id: newBlockId, plan: nutritionData }).select('id').single(),
        ])
        if (tRes.error) throw tRes.error
        if (nRes.error) throw nRes.error
        await refetch()
      } catch (err) {
        setPostEventError(err.message || 'Schema genereren mislukt.')
      }
    }
    setPostEventPhase('facts')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.event_date) {
      setError('Vul een datum in.')
      return
    }
    setSaving(true)
    try {
      await addEvent({
        event_type: form.event_type,
        event_date: form.event_date,
        event_name: form.event_name || null,
        distance_km: form.distance_km ? Number(form.distance_km) : null,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
        prestatiedoel: form.prestatiedoel || null,
      })
      setShowForm(false)
      setForm({ event_type: 'wedstrijd', event_date: '', event_name: '', distance_km: '', duration_minutes: '', prestatiedoel: 'finishen' })
      setShowPostEventModal(true)
      setPostEventPhase('loading')
      setPostEventError(null)
      runPlanGeneration() // runs in background; switches modal to facts when done
    } catch (err) {
      setError(err.message || 'Opslaan mislukt.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className={styles.muted}>Laden…</p>

  if (!canUseEvents) {
    return (
      <div className={styles.page}>
        <h1>Event &amp; wedstrijd</h1>
        <div className={styles.upgradeGate}>
          <p className={styles.upgradeGateText}>
            Events toevoegen (wedstrijden, marathons, etc.) is beschikbaar in <strong>Pro</strong> en <strong>Premium</strong>.
          </p>
          <p className={styles.upgradeGateSub}>Upgrade naar Pro of Premium om events toe te voegen.</p>
          <Link to="/dashboard/plan" className={styles.upgradeGateBtn}>Bekijk plannen →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {showPostEventModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="post-event-title">
          <div className={styles.modalCard}>
            <h2 id="post-event-title" className={styles.modalTitle}>
              {postEventPhase === 'loading' ? 'We zetten alles voor jou klaar' : '20 feiten over fitness'}
            </h2>
            {postEventPhase === 'loading' && (
              <div className={styles.modalLoading}>
                <div className={styles.spinner} aria-hidden />
                <p>Schema wordt gegenereerd…</p>
              </div>
            )}
            {postEventPhase === 'facts' && (
              <>
                {postEventError && <p className={styles.error}>{postEventError}</p>}
                {!input && !postEventError && (
                  <p className={styles.modalHint}>Vul op Mijn input je gegevens in om een persoonlijk schema te genereren.</p>
                )}
                <FactsCarousel onClose={() => setShowPostEventModal(false)} />
              </>
            )}
          </div>
        </div>
      )}

      <h1>Event &amp; wedstrijd</h1>
      <p className={styles.intro}>
        Je event staat los van je algemene doel in Mijn input: hier plan je een wedstrijd of evenement. Je ziet een countdown, je trainingsfase (periodisering en taper) en richtlijnen voor wedstrijdvoeding.
      </p>

      {showForm && (
        <section className={styles.card}>
          <h2>Event toevoegen</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <label>
              Type
              <select value={form.event_type} onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value }))}>
                {EVENT_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <label>
              Datum *
              <input type="date" value={form.event_date} onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))} required />
            </label>
            <label>
              Naam (optioneel)
              <input type="text" value={form.event_name} onChange={(e) => setForm((f) => ({ ...f, event_name: e.target.value }))} placeholder="bijv. Marathon Amsterdam" />
            </label>
            <label>
              Afstand (km)
              <input type="number" min="0" step="0.1" value={form.distance_km} onChange={(e) => setForm((f) => ({ ...f, distance_km: e.target.value }))} placeholder="42.2" />
            </label>
            <label>
              Verwachte duur (min)
              <input type="number" min="0" value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))} placeholder="240" />
            </label>
            <label>
              Prestatiedoel
              <select value={form.prestatiedoel} onChange={(e) => setForm((f) => ({ ...f, prestatiedoel: e.target.value }))}>
                {PRESTATIEDOELEN.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.formActions}>
              <button type="button" onClick={() => setShowForm(false)} className={styles.btnSecondary}>Annuleren</button>
              <button type="submit" disabled={saving} className={styles.btnPrimary}>{saving ? 'Opslaan…' : 'Toevoegen'}</button>
            </div>
          </form>
        </section>
      )}

      {!showForm && (
        <button type="button" onClick={() => setShowForm(true)} className={styles.addBtn}>+ Event toevoegen</button>
      )}

      {events.length > 0 && (
        <>
          {events.length > 1 && (
            <div className={styles.tabs}>
              {events.map((ev) => (
                <button key={ev.id} type="button" onClick={() => setSelectedEvent(ev.id)} className={selectedEvent === ev.id || (!selectedEvent && ev.id === events[0].id) ? styles.tabActive : styles.tab}>
                  {ev.event_name || ev.event_type} · {new Date(ev.event_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                </button>
              ))}
            </div>
          )}

          {event && (
            <div className={styles.dashboard}>
              <section className={styles.card}>
                <h2>Countdown</h2>
                <p className={styles.countdownLabel}>Nog</p>
                <Countdown eventDate={event.event_date} />
                <p className={styles.countdownSub}>tot {event.event_name || event.event_type} · {new Date(event.event_date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </section>

              <section className={styles.card}>
                <h2>Voortgang &amp; fase</h2>
                <p><strong>Weken tot event:</strong> {weeksUntil ?? '—'}</p>
                {phase && (
                  <div className={styles.phaseBlock}>
                    <span className={styles.phaseLabel}>{phase.label}</span>
                    <p className={styles.phaseFocus}>{phase.focus}</p>
                  </div>
                )}
                {weeksUntil != null && weeksUntil <= 3 && <p>Taper: {taperWeeks} week(en) volume omlaag voor de wedstrijd.</p>}
              </section>

              <section className={styles.card}>
                <h2>Readiness score</h2>
                <div className={styles.readinessWrap}>
                  <div className={styles.readinessCircle} style={{ '--pct': readiness }}>
                    <span>{readiness}</span>
                  </div>
                  <p className={styles.readinessHint}>Gebaseerd op je fase en evaluaties. Hoe hoger, hoe dichter je plan op de wedstrijd is afgestemd.</p>
                </div>
              </section>

              {carbLoad && (
                <section className={styles.card}>
                  <h2>Wedstrijdvoeding: carb loading</h2>
                  <p>{carbLoad.richtlijn}</p>
                  <p className={styles.tip}>{carbLoad.voorbeeld}</p>
                </section>
              )}

              {raceDay && (
                <section className={styles.card}>
                  <h2>Racedag voeding</h2>
                  <p><strong>Ontbijt:</strong> {raceDay.ontbijt}</p>
                  <p><strong>Onderweg:</strong> {raceDay.onderweg}</p>
                  <p><strong>Na finish:</strong> {raceDay.naFinish}</p>
                </section>
              )}

              {recovery && (
                <section className={styles.card}>
                  <h2>Herstel na wedstrijd</h2>
                  <p><strong>Dag 1:</strong> {recovery.dag1}</p>
                  <p><strong>Dag 2–3:</strong> {recovery.dag2_3}</p>
                  <p><strong>Week 1:</strong> {recovery.week1}</p>
                </section>
              )}

              <button type="button" onClick={() => deleteEvent(event.id)} className={styles.deleteBtn}>Event verwijderen</button>
            </div>
          )}
        </>
      )}

      {events.length === 0 && !showForm && (
        <p className={styles.muted}>Voeg een event toe om countdown, fase en wedstrijdvoeding te zien.</p>
      )}
    </div>
  )
}
