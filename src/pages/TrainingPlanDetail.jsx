import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { hasFeature, getUpgradeMessage, getWeekAccess } from '../lib/planFeatures'
import ExportPDFModal from '../components/ExportPDFModal'
import styles from './Plan.module.css'

export default function TrainingPlanDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { planType } = useSubscription()
  const [row, setRow] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [exportOpen, setExportOpen] = useState(false)

  useEffect(() => {
    if (!id || !user?.id) {
      setLoading(false)
      return
    }
    let cancelled = false
    supabase.from('training_plans').select('*').eq('id', id).eq('user_id', user.id).single()
      .then(({ data }) => {
        if (cancelled) return
        setRow(data)
        if (data?.block_id) {
          return supabase.from('week_reviews').select('week_number').eq('user_id', user.id).eq('block_id', data.block_id)
        }
      })
      .then((res) => {
        if (cancelled) return
        if (res?.data) setReviews(res.data)
        setLoading(false)
      })
      .catch(() => { setLoading(false) })
    return () => { cancelled = true }
  }, [id, user?.id])

  if (loading) return <p className={styles.muted}>Laden…</p>
  if (!row) return <p className={styles.muted}>Schema niet gevonden.</p>

  const plan = row.plan
  const weeks = plan?.weeks ?? []
  const reviewedWeekNumbers = reviews.map((r) => r.week_number).sort((a, b) => a - b)
  const { visible, clickable } = getWeekAccess(planType, reviewedWeekNumbers)
  const canExport = hasFeature(planType, 'export_pdf')

  return (
    <div className={styles.page}>
      <p className={styles.back}><Link to="/dashboard/training">← Trainingsschema</Link></p>
      <div className={styles.pageHead}>
        <h1>Trainingsschema</h1>
        {canExport && (
          <button type="button" onClick={() => setExportOpen(true)} className={styles.exportBtn}>
            Exporteer PDF
          </button>
        )}
      </div>
      <p className={styles.intro}>
        Je schema is opgebouwd in 4 weken met per week een duidelijke focus (bijv. basis, volume, intensiteit of deload). Het volume en de sessies sluiten aan op je doel, niveau en beschikbare tijd. Week 4 is vaak lichter voor herstel voordat je een vervolg blok start.
      </p>
      <p className={styles.intro}>Kies een week om de sessies en oefeningen te bekijken en je evaluatie in te vullen.</p>
      {!canExport && <p className={styles.cardLock}>{getUpgradeMessage('export_pdf')}</p>}
      <div className={styles.weekGrid}>
        {[1, 2, 3, 4].filter((w) => visible.includes(w)).map((w) => {
          const isClickable = clickable.includes(w)
          const weekData = weeks[w - 1]
          const content = (
            <>
              <h3>Week {w}</h3>
              <p>{weekData?.focus ? `Focus: ${weekData.focus}` : '—'}</p>
              {weekData?.volumeDescription && <p>{weekData.volumeDescription}</p>}
              {!isClickable && <p className={styles.weekLock}>Vul eerst week {w - 1} evaluatie in</p>}
            </>
          )
          return isClickable ? (
            <Link key={w} to={`/dashboard/training/${id}/week/${w}`} className={styles.weekCard}>
              {content}
            </Link>
          ) : (
            <div key={w} className={styles.weekCardLocked}>
              {content}
            </div>
          )
        })}
      </div>
      {exportOpen && (
        <ExportPDFModal type="training" plan={plan} title="Trainingsschema" onClose={() => setExportOpen(false)} />
      )}
    </div>
  )
}
