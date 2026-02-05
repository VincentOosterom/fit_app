import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useClientInput } from '../hooks/useClientInput'
import { usePlans } from '../hooks/usePlans'
import { useSubscription } from '../hooks/useSubscription'
import { hasFeature, getUpgradeMessage } from '../lib/planFeatures'
import { buildTrainingPlan } from '../rules/trainingEngine'
import { buildNutritionPlan } from '../rules/nutritionEngine'
import { getWelcomeByTime } from '../lib/welcomeTexts'
import { MOTIVATION_QUOTES } from '../lib/motivationQuotes'
import { getCurrentWeek } from '../utils/weekEvaluation'
import styles from './Dashboard.module.css'

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
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
    <div className={styles.quoteCarousel}>
      <p className={styles.quoteText}>{MOTIVATION_QUOTES[index]}</p>
      <div className={styles.quoteDots}>
        {MOTIVATION_QUOTES.map((_, i) => (
          <span key={i} className={i === index ? styles.quoteDotActive : styles.quoteDot} aria-hidden />
        ))}
      </div>
    </div>
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
      <div className={styles.progressRow}>
        <span className={styles.progressWeek}>
          Week {currentWeek ?? 1} van 4
        </span>
        <span className={styles.progressReviews}>
          Evaluaties ingevuld: {count}/4
        </span>
      </div>
      <div className={styles.progressBarWrap}>
        <div className={styles.progressBar} style={{ width: `${pct}%` }} />
      </div>
      <ul className={styles.progressWeeks}>
        {[1, 2, 3, 4].map((w) => (
          <li key={w} className={reviewedWeeks.includes(w) ? styles.progressWeekDone : styles.progressWeekOpen}>
            Week {w} {reviewedWeeks.includes(w) ? '✓' : '—'}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { isAdmin, profile } = useProfile()
  const { input, loading: inputLoading, error } = useClientInput()
  const { trainingPlan, nutritionPlan, loading: plansLoading, showGenerate, canGenerateAgain, refetch, blockReviews, blockId } = usePlans()
  const { planType, planName, amountFormatted, nextBillingDate, loading: subLoading } = useSubscription()
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState(null)

  if (isAdmin) return <Navigate to="/dashboard/admin/accounts" replace />

  const handleGenerate = async () => {
    if (!input || !user?.id) return
    setGenerating(true)
    setGenError(null)
    const blockId = crypto.randomUUID()
    try {
      const trainingData = buildTrainingPlan(input)
      const nutritionData = buildNutritionPlan(input)
      const [tRes, nRes] = await Promise.all([
        supabase.from('training_plans').insert({ user_id: user.id, block_id: blockId, plan: trainingData }).select('id').single(),
        supabase.from('nutrition_plans').insert({ user_id: user.id, block_id: blockId, plan: nutritionData }).select('id').single(),
      ])
      if (tRes.error) throw tRes.error
      if (nRes.error) throw nRes.error
      await refetch()
    } catch (err) {
      setGenError(err.message || 'Genereren mislukt.')
    } finally {
      setGenerating(false)
    }
  }

  const loading = inputLoading || plansLoading || subLoading
  const canExportPdf = hasFeature(planType, 'export_pdf')
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

      {showGenerate && input && (
        <div className={styles.generateBlock}>
          <button type="button" onClick={handleGenerate} disabled={generating} className={styles.generateButton}>
            {generating ? 'Bezig…' : canGenerateAgain ? 'Vervolg schema genereren' : 'Schema genereren (voeding + training)'}
          </button>
          <p className={styles.muted}>
            {canGenerateAgain ? 'Je hebt week 4 geëvalueerd. Genereer hier je volgende 4-weekse schema.' : 'Je kunt maar één keer een schema genereren. Na week 4 evaluatie kun je een vervolg schema aanvragen.'}
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
    </div>
  )
}
