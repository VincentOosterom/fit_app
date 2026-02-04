import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { PLAN_AMOUNTS } from '../../lib/planFeatures'
import styles from './Admin.module.css'

const KEYS = [
  { key: 'plan_price_starter_cents', label: 'Starter (€/maand in centen)', default: 795 },
  { key: 'plan_price_pro_cents', label: 'Pro (€/maand in centen)', default: 999 },
  { key: 'plan_price_premium_cents', label: 'Premium (€/maand in centen)', default: 1495 },
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

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      for (const { key } of KEYS) {
        const raw = settings[key]
        const value = raw === '' || raw === undefined ? null : Number(raw)
        await supabase.from('admin_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      }
      setMessage('Planprijzen opgeslagen. Nieuwe aanmeldingen en planwissels gebruiken deze bedragen.')
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
        Stel de maandprijzen in voor de drie plannen (in centen, bijv. 795 = €7,95). Deze worden gebruikt bij planwijziging en bij nieuwe subscriptions.
      </p>
      <section className={styles.section}>
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
          </label>
        ))}
        <button type="button" onClick={handleSave} disabled={saving} className={styles.btnPrimary}>
          {saving ? 'Opslaan…' : 'Opslaan'}
        </button>
        {message && <p className={styles.message}>{message}</p>}
      </section>
    </div>
  )
}
