import { useState, useEffect } from 'react'
import { Link, useParams, useSearchParams, Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import { useClientInputFor } from '../../hooks/useClientInputFor'
import { buildNutritionPlan } from '../../rules/nutritionEngine'
import { buildTrainingPlan } from '../../rules/trainingEngine'
import styles from './Coach.module.css'

const TABS = [
  { id: 'intake', label: 'Intake' },
  { id: 'training', label: 'Trainingsschema' },
  { id: 'nutrition', label: 'Voedingsschema' },
  { id: 'progress', label: 'Progress grafieken' },
  { id: 'notes', label: 'Notities' },
  { id: 'communication', label: 'Communicatie' },
]

export default function CoachClientDetail() {
  const { clientId } = useParams()
  const [searchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const { user } = useAuth()
  const { isCoach, clients } = useProfile()
  const client = (clients ?? []).find((c) => c.id === clientId)
  const { input, loading: inputLoading } = useClientInputFor(clientId)

  const [activeTab, setActiveTab] = useState(() => {
    const t = tabFromUrl || 'intake'
    return TABS.some((tab) => tab.id === t) ? t : 'intake'
  })

  useEffect(() => {
    if (tabFromUrl && TABS.some((tab) => tab.id === tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])
  const [nutritionPlans, setNutritionPlans] = useState([])
  const [trainingPlans, setTrainingPlans] = useState([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState(null)
  const [notes, setNotes] = useState([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [clientNotifications, setClientNotifications] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [weekReviews, setWeekReviews] = useState([])
  const [progressEntries, setProgressEntries] = useState([])
  const [progressLoading, setProgressLoading] = useState(false)

  useEffect(() => {
    if (!clientId) return
    let cancelled = false
    Promise.all([
      supabase.from('nutrition_plans').select('*').eq('user_id', clientId).order('created_at', { ascending: false }),
      supabase.from('training_plans').select('*').eq('user_id', clientId).order('created_at', { ascending: false }),
    ]).then(([nRes, tRes]) => {
      if (!cancelled) {
        setNutritionPlans(nRes.data ?? [])
        setTrainingPlans(tRes.data ?? [])
      }
      setPlansLoading(false)
    })
    return () => { cancelled = true }
  }, [clientId])

  useEffect(() => {
    if (activeTab !== 'notes' || !clientId || !user?.id) return
    setNotesLoading(true)
    supabase.from('coach_notes').select('*').eq('coach_id', user.id).eq('client_id', clientId).order('created_at', { ascending: false })
      .then(({ data }) => { setNotes(data ?? []); setNotesLoading(false) })
  }, [activeTab, clientId, user?.id])

  useEffect(() => {
    if (activeTab !== 'communication' || !clientId) return
    setMessagesLoading(true)
    Promise.all([
      supabase.from('coach_messages').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase.from('client_notifications').select('*').eq('client_id', clientId).eq('coach_id', user?.id).order('created_at', { ascending: false }),
    ]).then(([msgRes, notifRes]) => {
      setMessages(msgRes.data ?? [])
      setClientNotifications(notifRes.data ?? [])
      setMessagesLoading(false)
    })
  }, [activeTab, clientId, user?.id])

  useEffect(() => {
    if (activeTab !== 'progress' || !clientId) return
    setProgressLoading(true)
    Promise.all([
      supabase.from('week_reviews').select('*').eq('user_id', clientId).order('week_number'),
      supabase.from('progress_entries').select('*').eq('user_id', clientId).order('logged_at', { ascending: false }).limit(50),
    ]).then(([r1, r2]) => {
      setWeekReviews(r1.data ?? [])
      setProgressEntries(r2.data ?? [])
      setProgressLoading(false)
    })
  }, [activeTab, clientId])

  const handleGeneratePlans = async () => {
    if (!input || !clientId) {
      setGenError('Laat de klant eerst intake invullen.')
      return
    }
    setGenerating(true)
    setGenError(null)
    const newBlockId = crypto.randomUUID()
    try {
      const nutritionData = buildNutritionPlan(input)
      const trainingData = buildTrainingPlan(input)
      const [nRes, tRes] = await Promise.all([
        supabase.from('nutrition_plans').insert({ user_id: clientId, block_id: newBlockId, plan: nutritionData }).select('id').single(),
        supabase.from('training_plans').insert({ user_id: clientId, block_id: newBlockId, plan: trainingData }).select('id').single(),
      ])
      if (nRes.error) throw nRes.error
      if (tRes.error) throw tRes.error
      setNutritionPlans((prev) => [{ plan: nutritionData, created_at: new Date().toISOString() }, ...prev])
      setTrainingPlans((prev) => [{ plan: trainingData, created_at: new Date().toISOString() }, ...prev])
    } catch (err) {
      setGenError(err.message || 'Genereren mislukt.')
    } finally {
      setGenerating(false)
    }
  }

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!newNote.trim() || !user?.id || !clientId) return
    setSavingNote(true)
    try {
      const { data, error } = await supabase.from('coach_notes').insert({
        coach_id: user.id,
        client_id: clientId,
        note: newNote.trim(),
      }).select().single()
      if (error) throw error
      setNotes((prev) => [data, ...prev])
      setNewNote('')
    } finally {
      setSavingNote(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !user?.id || !clientId) return
    setSendingMessage(true)
    try {
      const { data, error } = await supabase.from('coach_messages').insert({
        coach_id: user.id,
        client_id: clientId,
        body: newMessage.trim(),
      }).select().single()
      if (error) throw error
      setMessages((prev) => [data, ...prev])
      setNewMessage('')
      const newestNew = clientNotifications.find((n) => n.status === 'nieuw')
      if (newestNew) {
        await supabase.from('client_notifications').update({ status: 'opgevolgd', replied_at: new Date().toISOString() }).eq('id', newestNew.id)
        setClientNotifications((prev) => prev.map((n) => (n.id === newestNew.id ? { ...n, status: 'opgevolgd', replied_at: new Date().toISOString() } : n)))
      }
    } finally {
      setSendingMessage(false)
    }
  }

  if (!isCoach) return <Navigate to="/dashboard" replace />
  if (clientId && !client) return <Navigate to="/dashboard/coach/klanten" replace />

  return (
    <div className={styles.page}>
      <Link to="/dashboard/coach/klanten" className={styles.backLink}>← Klantenlijst</Link>
      <h1>{client?.full_name || 'Klant'}</h1>
      <p className={styles.intro}>{client?.email || '—'}</p>

      <div className={styles.tabs}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={activeTab === id ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'intake' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Intake</h2>
          {inputLoading ? (
            <p className={styles.muted}>Laden…</p>
          ) : !input ? (
            <p className={styles.muted}>Nog geen intake. De klant vult dit in onder Mijn input.</p>
          ) : (
            <div className={styles.noteItem}>
              <p><strong>Doel:</strong> {input.goal ?? '—'} · <strong>Niveau:</strong> {input.level ?? '—'} · <strong>Dagen/week:</strong> {input.days_per_week ?? '—'}</p>
              <p><strong>Gewicht:</strong> {input.weight_kg ?? '—'} kg · <strong>Lengte:</strong> {input.height_cm ?? '—'} cm · <strong>Leeftijd:</strong> {input.age ?? '—'}</p>
              <p><strong>Sport:</strong> {input.main_sport ?? '—'} · <strong>Event:</strong> {input.event_date ?? '—'}</p>
            </div>
          )}
        </section>
      )}

      {activeTab === 'training' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Trainingsschema</h2>
          {genError && <p className={styles.error}>{genError}</p>}
          {!input && <p className={styles.muted}>Eerst intake nodig. Vraag de klant om intake in te vullen.</p>}
          <button type="button" onClick={handleGeneratePlans} disabled={generating || !input} className={styles.btnPrimary} style={{ marginBottom: '1rem' }}>
            {generating ? 'Bezig…' : 'Trainingsschema genereren'}
          </button>
          {plansLoading ? <p className={styles.muted}>Laden…</p> : <p className={styles.muted}>{trainingPlans.length} schema&apos;s</p>}
        </section>
      )}

      {activeTab === 'nutrition' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Voedingsschema</h2>
          {genError && <p className={styles.error}>{genError}</p>}
          {!input && <p className={styles.muted}>Eerst intake nodig.</p>}
          <button type="button" onClick={handleGeneratePlans} disabled={generating || !input} className={styles.btnPrimary} style={{ marginBottom: '1rem' }}>
            {generating ? 'Bezig…' : 'Voedingsschema genereren'}
          </button>
          {plansLoading ? <p className={styles.muted}>Laden…</p> : <p className={styles.muted}>{nutritionPlans.length} schema&apos;s</p>}
          {nutritionPlans.length > 0 && (() => {
            const plan = nutritionPlans[0]?.plan
            const weeks = plan?.weeks ?? []
            return (
              <div className={styles.planPreview} style={{ marginTop: '1rem' }}>
                <h3 className={styles.planPreviewTitle}>Actueel schema (maaltijden)</h3>
                {weeks.map((week) => (
                  <div key={week.weekNumber} className={styles.weekBlock}>
                    <h4>Week {week.weekNumber}</h4>
                    <p className={styles.muted}>{week.averageCaloriesPerDay ?? '—'} kcal/dag · {week.energyDirection ?? '—'}</p>
                    {week.days?.length ? (
                      week.days.map((day) => (
                        <div key={day.dayNumber} className={styles.dayBlock}>
                          <strong>Dag {day.dayNumber}</strong>
                          <ul className={styles.mealPreviewList}>
                            {(day.meals ?? []).map((m, i) => (
                              <li key={i}>{m.meal}: {m.name} · {m.kcal} kcal</li>
                            ))}
                          </ul>
                        </div>
                      ))
                    ) : (
                      <ul className={styles.mealPreviewList}>
                        {(week.exampleMeals ?? []).map((m, i) => (
                          <li key={i}>{m.meal}: {m.name} · {m.kcal} kcal</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )
          })()}
        </section>
      )}

      {activeTab === 'progress' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Progress grafieken</h2>
          {progressLoading ? (
            <p className={styles.muted}>Laden…</p>
          ) : (
            <>
              <p><strong>Weekevaluaties:</strong> {weekReviews.length}</p>
              <p><strong>Progressielog (gewicht/notities):</strong> {progressEntries.length} entries</p>
              <div className={styles.chartPlaceholder}>
                Grafieken (gewicht, adherence) kunnen hier later worden toegevoegd.
              </div>
            </>
          )}
        </section>
      )}

      {activeTab === 'notes' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Notities</h2>
          <form onSubmit={handleAddNote}>
            <div className={styles.formRow}>
              <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Notitie toevoegen…" rows={3} style={{ maxWidth: '100%' }} disabled={savingNote} />
            </div>
            <button type="submit" disabled={savingNote || !newNote.trim()} className={styles.btnPrimary}>Toevoegen</button>
          </form>
          {notesLoading ? <p className={styles.muted}>Laden…</p> : (
            <ul className={styles.notesList}>
              {notes.map((n) => (
                <li key={n.id} className={styles.noteItem}>
                  {n.note}
                  <div className={styles.noteItemMeta}>{new Date(n.created_at).toLocaleString('nl-NL')}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {activeTab === 'communication' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Communicatie</h2>
          {clientNotifications.length > 0 && (
            <>
              <h3 className={styles.sectionTitle} style={{ fontSize: '1rem', marginTop: '1rem' }}>Meldingen van klant</h3>
              <ul className={styles.notesList}>
                {clientNotifications.map((n) => (
                  <li key={n.id} className={`${styles.noteItem} ${n.status === 'nieuw' ? styles.alertItemNew : ''}`}>
                    <span className={styles.muted}>[{n.type}]</span> {n.body}
                    <div className={styles.noteItemMeta}>
                      {new Date(n.created_at).toLocaleString('nl-NL')} · Status: {n.status}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
          <h3 className={styles.sectionTitle} style={{ fontSize: '1rem', marginTop: '1rem' }}>Bericht naar klant</h3>
          <form onSubmit={handleSendMessage}>
            <div className={styles.formRow}>
              <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Bericht naar klant…" rows={3} style={{ maxWidth: '100%' }} disabled={sendingMessage} />
            </div>
            <button type="submit" disabled={sendingMessage || !newMessage.trim()} className={styles.btnPrimary}>Versturen</button>
          </form>
          {messagesLoading ? <p className={styles.muted}>Laden…</p> : (
            <ul className={styles.msgList}>
              {messages.map((m) => (
                <li key={m.id} className={styles.msgItem}>
                  <div>{m.body}</div>
                  <div className={styles.msgItemMeta}>{new Date(m.created_at).toLocaleString('nl-NL')}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
