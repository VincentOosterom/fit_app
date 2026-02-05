import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useClientInput } from '../hooks/useClientInput'
import { usePlans } from '../hooks/usePlans'
import { useSubscription } from '../hooks/useSubscription'
import { useEvents } from '../hooks/useEvents'
import { hasFeature, getUpgradeMessage, canResetSchema } from '../lib/planFeatures'
import { buildTrainingPlan } from '../rules/trainingEngine'
import { buildNutritionPlan } from '../rules/nutritionEngine'
import { getWelcomeByTime } from '../lib/welcomeTexts'
import { MOTIVATION_QUOTES } from '../lib/motivationQuotes'
import { getCurrentWeek } from '../utils/weekEvaluation'
import ThankYouModal from '../components/ThankYouModal'
import styles from './Dashboard.module.css'

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function weeksUntil(dateStr) {
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = d - today
  if (diff < 0) return 0
  return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000))
}

const EVENT_TYPE_LABELS = {
  marathon: 'Marathon',
  halve_marathon: 'Halve marathon',
  '10km': '10 km',
  '5km': '5 km',
  triathlon: 'Triathlon',
  hyrox: 'Hyrox',
  wedstrijd: 'Wedstrijd',
  sportdag: 'Sportdag',
  anders: 'Event',
}

function EventBanner({ event, blockReviews }) {
  const name = event.event_name?.trim() || EVENT_TYPE_LABELS[event.event_type] || 'Event'
  const dateFormatted = formatDate(event.event_date)
  const weeks = weeksUntil(event.event_date)
  const reviewCount = (blockReviews || []).length
  const readiness = Math.min(100, 50 + reviewCount * 12)

  return (
    <Link to="event" className={styles.eventBanner}>
      <span className={styles.eventBannerTitle}>🏁 {name}</span>
      <span className={styles.eventBannerDate}>📅 {dateFormatted}</span>
      <span className={styles.eventBannerWeeks}>⏳ {weeks} {weeks === 1 ? 'week' : 'weken'} te gaan</span>
      <span className={styles.eventBannerReadiness}>📊 Gereedheid score: {readiness}%</span>
    </Link>
  )
}

function QuoteCarousel() {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % MOTIVATION_QUOTES.length)
    }, 6000)
    return () => clearInterval(id)
  }, [])
  return (
    <section className={styles.quoteCarousel} aria-label="Inspiratie">
      <div className={styles.quoteSlideWrap}>
        <p key={index} className={styles.quoteText}>{MOTIVATION_QUOTES[index]}</p>
      </div>
    </section>
  )
}

function ProgressBlock({ planCreatedAt, blockReviews }) {
  const currentWeek = getCurrentWeek(planCreatedAt)
  const reviewedWeeks = (blockReviews || []).map((r) => r.week_number)
  const count = reviewedWeeks.length
  const pct = Math.round((count / 4) * 100)
  return (
    <section className={styles.progressBlock}>
      <h2 className={styles.progressTitle}>Je voortgang</h2>
      <p className={styles.progressSubtitle}>
        Week {currentWeek ?? 1} van 4 · {count} van 4 weekevaluaties ingevuld
      </p>
      <div className={styles.progressBarWrap}>
        <div className={styles.progressBar} style={{ width: `${pct}%` }} />
      </div>
      <p className={styles.progressPct}>{pct}% voltooid</p>
      <div className={styles.progressWeekGrid}>
        {[1, 2, 3, 4].map((w) => (
          <div key={w} className={reviewedWeeks.includes(w) ? styles.progressWeekCardDone : styles.progressWeekCard}>
            <span className={styles.progressWeekNum}>Week {w}</span>
            {reviewedWeeks.includes(w) ? <span className={styles.progressWeekCheck}>✓ Ingevuld</span> : <span className={styles.progressWeekOpen}>Nog te doen</span>}
          </div>
        ))}
      </div>
    </section>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { isAdmin, profile } = useProfile()
  const { input, loading: inputLoading, error } = useClientInput()
  const { trainingPlan, nutritionPlan, hasAnyPlan, loading: plansLoading, showGenerate, canGenerateAgain, refetch, blockReviews, blockId, onlyNutrition, onlyTraining } = usePlans()
  const { planType, planName, amountFormatted, nextBillingDate, loading: subLoading, restartCount, refetch: refetchSub } = useSubscription()
  const { events } = useEvents()
  const today = new Date().toISOString().slice(0, 10)
  const nextEvent = (events || []).find((e) => e.event_date >= today)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState(null)
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState(null)
  const [showThankYouModal, setShowThankYouModal] = useState(false)
  const [generationComplete, setGenerationComplete] = useState(false)
  const resetInfo = canResetSchema(planType, restartCount)

  if (isAdmin) return <Navigate to="/dashboard/admin/accounts" replace />

  const handleGenerate = async () => {
    if (!input || !user?.id) return
    setGenError(null)
    setShowThankYouModal(true)
    setGenerationComplete(false)
    setGenerating(true)
    const newBlockId = blockId || crypto.randomUUID()
    try {
      if (onlyNutrition) {
        const trainingData = buildTrainingPlan(input)
        const tRes = await supabase.from('training_plans').insert({ user_id: user.id, block_id: nutritionPlan.block_id || newBlockId, plan: trainingData }).select('id').single()
        if (tRes.error) throw tRes.error
      } else if (onlyTraining) {
        const nutritionData = buildNutritionPlan(input)
        const nRes = await supabase.from('nutrition_plans').insert({ user_id: user.id, block_id: trainingPlan.block_id || newBlockId, plan: nutritionData }).select('id').single()
        if (nRes.error) throw nRes.error
      } else {
        const trainingData = buildTrainingPlan(input)
        const nutritionData = buildNutritionPlan(input)
        const [tRes, nRes] = await Promise.all([
          supabase.from('training_plans').insert({ user_id: user.id, block_id: newBlockId, plan: trainingData }).select('id').single(),
          supabase.from('nutrition_plans').insert({ user_id: user.id, block_id: newBlockId, plan: nutritionData }).select('id').single(),
        ])
        if (tRes.error) throw tRes.error
        if (nRes.error) throw nRes.error
      }
      await refetch()
      setGenerationComplete(true)
    } catch (err) {
      setGenError(err.message || 'Genereren mislukt.')
      setShowThankYouModal(false)
    } finally {
      setGenerating(false)
    }
  }

  const handleReset = async () => {
    if (!resetInfo.canReset || !window.confirm('Schema opnieuw beginnen? Je huidige schema en weekevaluaties worden verwijderd. Daarna kun je een nieuw schema genereren.')) return
    setResetting(true)
    setResetError(null)
    try {
      const { data } = await supabase.rpc('user_reset_schema')
      if (data?.ok) {
        await refetch()
        await refetchSub?.()
      } else {
        setResetError(data?.error || 'Reset mislukt.')
      }
    } catch (err) {
      setResetError(err.message || 'Reset mislukt.')
    } finally {
      setResetting(false)
    }
  }

  const loading = inputLoading || plansLoading || subLoading
  const canExportPdf = hasFeature(planType, 'export_pdf')
  const canUseEvents = hasFeature(planType, 'event_programs')
  const { greeting, followUp } = getWelcomeByTime()
  const displayName = profile?.full_name?.trim() || null

  return (
    <div className={styles.dashboard}>
      <section className={styles.welcomeBlock}>
        <h1 className={styles.welcomeTitle}>
          {displayName ? `${greeting.replace(/\.$/, '')}, ${displayName}.` : greeting}
        </h1>
        <p className={styles.welcomeFollowUp}>{followUp}</p>
      </section>

      {nextEvent && canUseEvents && (
        <EventBanner event={nextEvent} blockReviews={blockReviews} />
      )}

      <QuoteCarousel />

      {blockId && (nutritionPlan || trainingPlan) && (
        <ProgressBlock
          planCreatedAt={nutritionPlan?.created_at || trainingPlan?.created_at}
          blockReviews={blockReviews}
        />
      )}

      <h2 className={styles.sectionTitle}>Overzicht</h2>
      <p className={styles.intro}>
        Stel je doelen in, genereer één keer je 4-weekse schema. Na elke week vul je een korte evaluatie in; na week 4 kun je een vervolg schema krijgen of laten aanpassen.
      </p>

      {/* Plan & volgende factuur */}
      <div className={styles.planBlock}>
        <div className={styles.planCard}>
          <div className={styles.planMain}>
            <span className={styles.planLabel}>Jouw plan</span>
            <strong className={styles.planName}>{planName}</strong>
            <span className={styles.planAmount}>{amountFormatted}/maand</span>
          </div>
          <div className={styles.planInvoice}>
            <span className={styles.planInvoiceLabel}>Volgende factuur</span>
            <span className={styles.planInvoiceValue}>{amountFormatted} op {formatDate(nextBillingDate)}</span>
          </div>
          <Link to="plan" className={styles.planLink}>Plan wijzigen →</Link>
        </div>
      </div>

      {loading && <p className={styles.muted}>Gegevens laden…</p>}
      {error && <p className={styles.error}>{error}</p>}
      {genError && <p className={styles.error}>{genError}</p>}
      {resetError && <p className={styles.error}>{resetError}</p>}

      {showGenerate && input && (
        <div className={styles.generateBlock}>
          <button type="button" onClick={handleGenerate} disabled={generating} className={styles.generateButton}>
            {generating ? 'Bezig…' : onlyNutrition ? 'Trainingsschema genereren' : onlyTraining ? 'Voedingsschema genereren' : canGenerateAgain ? 'Vervolg schema genereren' : 'Schema genereren (voeding + training)'}
          </button>
          <p className={styles.muted}>
            {onlyNutrition && 'Je hebt al een voedingsschema. Genereer hier je trainingsschema op basis van je huidige plan en input.'}
            {onlyTraining && 'Je hebt al een trainingsschema. Genereer hier je voedingsschema op basis van je huidige plan en input.'}
            {!onlyNutrition && !onlyTraining && canGenerateAgain && 'Je hebt week 4 geëvalueerd. Genereer hier je volgende 4-weekse schema.'}
            {!onlyNutrition && !onlyTraining && !canGenerateAgain && 'Op basis van je input genereren we een 4-weekse voeding- en trainingsrichtlijn. Na week 4 kun je een vervolg schema aanvragen.'}
          </p>
        </div>
      )}

      {hasAnyPlan && resetInfo.canReset && input && (
        <div className={styles.resetBlock}>
          <button type="button" onClick={handleReset} disabled={resetting} className={styles.resetButton}>
            {resetting ? 'Bezig…' : 'Schema resetten en opnieuw beginnen'}
          </button>
          <p className={styles.muted}>
            {planType === 'pro' ? 'Je kunt één keer je schema resetten. Bij Premium onbeperkt.' : 'Bij Premium kun je altijd opnieuw beginnen.'}
          </p>
        </div>
      )}

      <div className={styles.cards}>
        <Link to="input" className={styles.card}>
          <h2>Mijn input</h2>
          <p>
            {input
              ? `Doel: ${input.goal || '—'} · ${input.days_per_week ?? '—'} dagen/week`
              : 'Nog geen input. Klik om in te vullen.'}
          </p>
          <span className={styles.cta}>Bewerken →</span>
        </Link>
        {nutritionPlan ? (
          <Link to={`voeding/${nutritionPlan.id}`} className={styles.card}>
            <h2>Voedingsschema</h2>
            <p>Bekijk je 4-weekse voedingsschema en vul per week je evaluatie in.</p>
            {!canExportPdf && <p className={styles.cardLock}>{getUpgradeMessage('export_pdf')}</p>}
            <span className={styles.cta}>Bekijken →</span>
          </Link>
        ) : (
          <div className={styles.cardDisabled}>
            <h2>Voedingsschema</h2>
            <p>Genereer eerst je schema hierboven.</p>
          </div>
        )}
        {trainingPlan ? (
          <Link to={`training/${trainingPlan.id}`} className={styles.card}>
            <h2>Trainingsschema</h2>
            <p>Bekijk je 4-weekse trainingsschema en vul per week je evaluatie in.</p>
            {!canExportPdf && <p className={styles.cardLock}>{getUpgradeMessage('export_pdf')}</p>}
            <span className={styles.cta}>Bekijken →</span>
          </Link>
        ) : (
          <div className={styles.cardDisabled}>
            <h2>Trainingsschema</h2>
            <p>Genereer eerst je schema hierboven.</p>
          </div>
        )}
      </div>

      {showThankYouModal && (
        <ThankYouModal onClose={() => setShowThankYouModal(false)} isReady={generationComplete} />
      )}
    </div>
  )
}
