import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { hasFeature } from '../lib/planFeatures'
import ExportPDFModal from '../components/ExportPDFModal'
import styles from './Plan.module.css'

export default function NutritionPlanDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { planType } = useSubscription()
  const [row, setRow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exportOpen, setExportOpen] = useState(false)

  useEffect(() => {
    if (!id || !user?.id) {
      setLoading(false)
      return
    }
    let cancelled = false
    supabase.from('nutrition_plans').select('*').eq('id', id).eq('user_id', user.id).single().then(({ data }) => {
      if (!cancelled) setRow(data)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [id, user?.id])

  const plan = row?.plan
  const canExport = hasFeature(planType, 'export_pdf')

  if (loading) return <p className={styles.muted}>Laden…</p>
  if (!row || !plan) return <p className={styles.muted}>Schema niet gevonden.</p>

  return (
    <div className={styles.page}>
      <p className={styles.back}><Link to="/dashboard/voeding">← Terug naar overzicht</Link></p>
      <div className={styles.pageHead}>
        <h1>Voedingsschema</h1>
        <button type="button" className={styles.exportBtn} disabled={!canExport} title={!canExport ? 'Upgrade en sla je plan op' : ''} onClick={() => canExport && setExportOpen(true)}>
          Export PDF
        </button>
      </div>
      {exportOpen && <ExportPDFModal type="nutrition" plan={plan} title="Voedingsschema" onClose={() => setExportOpen(false)} />}
      <p className={styles.disclaimer}>Raadpleeg altijd een arts of diëtist voor vragen of bij twijfel over voeding of gezondheid.</p>
      <p className={styles.intro}>Klik op een week om die week te bekijken en je evaluatie in te vullen.</p>
      <div className={styles.weekGrid}>
        {(plan.weeks ?? []).map((week, i) => (
          <Link key={i} to={`/dashboard/voeding/${id}/week/${week.weekNumber ?? i + 1}`} className={styles.weekCard}>
            <h3>{week.weekName ?? `Week ${i + 1}`}</h3>
            <p>{week.energyDirection === 'hoog' ? 'Hoog' : week.energyDirection === 'laag' ? 'Laag' : 'Medium'} · ca. {week.averageCaloriesPerDay ?? '—'} kcal/dag</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
