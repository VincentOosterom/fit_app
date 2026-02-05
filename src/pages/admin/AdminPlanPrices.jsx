import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { PLAN_AMOUNTS } from '../../lib/planFeatures'
import styles from './Admin.module.css'

const KEYS = [
  { key: 'plan_price_starter_cents', label: 'Starter (centen)', default: 795 },
  { key: 'plan_price_pro_cents', label: 'Pro (centen)', default: 999 },
  { key: 'plan_price_premium_cents', label: 'Premium (centen)', default: 1495 },
]
const COACH_KEYS = [
  { key: 'coach_price_starter_cents', label: 'Starter (centen)', default: 595 },
  { key: 'coach_price_pro_cents', label: 'Pro (centen)', default: 799 },
  { key: 'coach_price_premium_cents', label: 'Premium (centen)', default: 1195 },
]

export default function AdminPlanPrices() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase.from('admin_settings').select('key, value')
      if (!cancelled) {
        const obj = {}
        ;(data ?? []).forEach(({ key, value }) => { obj[key] = value })
        setSettings(obj)
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handleChange = (key, value) => setSettings((s) => ({ ...s, [key]: value }))

  const allKeys = [...KEYS, ...COACH_KEYS]
  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      for (const { key } of allKeys) {
        const raw = settings[key]
        const value = raw === '' || raw === undefined ? null : Number(raw)
        await supabase.from('admin_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      }
      setMessage('Planprijzen opgeslagen.')
    } catch (e) {
      setMessage('Opslaan mislukt: ' + (e.message || ''))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className={styles.muted}>Laden…</p>

  return (
    <div className={styles.page}>
      <h1>Planprijzen</h1>
      <p className={styles.intro}>
        Stel de maandprijzen in (in centen: 795 = €7,95). Klantprijzen gelden voor directe klanten; coachprijzen zijn wat coaches kunnen hanteren voor hun klanten.
      </p>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Klantprijzen</h2>
        {KEYS.map(({ key, label, default: def }) => (
          <label key={key} className={styles.label}>
            {label}
            <input
              type="number"
              min={0}
              step={1}
              value={settings[key] ?? def ?? ''}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={String(def)}
              className={styles.input}
            />
            <span className={styles.hint}>€{((settings[key] ?? def ?? 0) / 100).toFixed(2)}/maand</span>
          </label>
        ))}
      </section>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Coachprijzen</h2>
        <p className={styles.introSub}>Prijzen die coaches zien voor hun plannen (kan lager zijn dan klantprijzen).</p>
        {COACH_KEYS.map(({ key, label, default: def }) => (
          <label key={key} className={styles.label}>
            {label}
            <input
              type="number"
              min={0}
              step={1}
              value={settings[key] ?? def ?? ''}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={String(def)}
              className={styles.input}
            />
            <span className={styles.hint}>€{((settings[key] ?? def ?? 0) / 100).toFixed(2)}/maand</span>
          </label>
        ))}
        <button type="button" onClick={handleSave} disabled={saving} className={styles.btnPrimary}>
          {saving ? 'Opslaan…' : 'Alle prijzen opslaan'}
        </button>
        {message && <p className={styles.message}>{message}</p>}
      </section>
    </div>
  )
}
