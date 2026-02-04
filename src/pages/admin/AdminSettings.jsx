import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import styles from './Admin.module.css'

const DEFAULT_KEYS = [
  { key: 'plan_price_cents', label: 'Standaard planprijs (centen)', type: 'number', placeholder: 'bijv. 999 voor €9,99' },
  { key: 'maintenance_mode', label: 'Onderhoudsmodus', type: 'boolean', options: [{ value: false, label: 'Nee' }, { value: true, label: 'Ja' }] },
  { key: 'support_email', label: 'Support e-mailadres', type: 'text', placeholder: 'support@trainlogic.nl' },
]

export default function AdminSettings() {
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
        ;(data ?? []).forEach(({ key, value }) => {
        if (key === 'maintenance_mode') obj[key] = value === true
        else obj[key] = value
      })
        setSettings(obj)
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handleChange = (key, value) => {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      for (const { key } of DEFAULT_KEYS) {
        const raw = settings[key]
        let value = raw
        if (key === 'plan_price_cents' && raw !== undefined && raw !== '') value = Number(raw)
        if (key === 'maintenance_mode') value = raw === true || raw === 'true'
        await supabase.from('admin_settings').upsert({ key, value: value ?? null, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      }
      setMessage('Instellingen opgeslagen.')
    } catch (e) {
      setMessage(e.message || 'Opslaan mislukt.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className={styles.muted}>Laden…</p>

  return (
    <div className={styles.page}>
      <h1>Admin-instellingen</h1>
      <p className={styles.intro}>Algemene instellingen voor de app (alle gebruikers). Wijzigingen gelden app-breed.</p>

      <section className={styles.section}>
        {DEFAULT_KEYS.map(({ key, label, type, placeholder, options }) => (
          <label key={key} className={styles.label}>
            {label}
            {type === 'boolean' && options ? (
              <select
                value={settings[key] === true ? 'true' : 'false'}
                onChange={(e) => handleChange(key, e.target.value === 'true')}
                className={styles.input}
              >
                {options.map((opt) => (
                  <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={type === 'number' ? 'number' : 'text'}
                value={settings[key] ?? ''}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder || key}
                className={styles.input}
              />
            )}
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
