import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import styles from './Admin.module.css'

export default function AdminReporting() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase.from('payments').select('*').order('paid_at', { ascending: false })
      if (!cancelled) setPayments(data ?? [])
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const totalCents = payments.reduce((sum, p) => sum + (p.amount_cents || 0), 0)
  const byMonth = payments.reduce((acc, p) => {
    const key = p.paid_at ? new Date(p.paid_at).toLocaleString('nl-NL', { year: 'numeric', month: 'long' }) : 'Onbekend'
    if (!acc[key]) acc[key] = 0
    acc[key] += p.amount_cents || 0
    return acc
  }, {})

  if (loading) return <p className={styles.muted}>Laden…</p>

  return (
    <div className={styles.page}>
      <h1>Rapportage omzet</h1>
      <p className={styles.intro}>Verkopen en omzet op basis van betalingen.</p>

      <section className={styles.section}>
        <h2>Totaal omzet</h2>
        <p className={styles.bigNumber}>€ {(totalCents / 100).toFixed(2)}</p>
        <p className={styles.muted}>{payments.length} betaling(en)</p>
      </section>

      <section className={styles.section}>
        <h2>Omzet per maand</h2>
        {Object.keys(byMonth).length === 0 ? (
          <p className={styles.muted}>Nog geen betalingen.</p>
        ) : (
          <ul className={styles.list}>
            {Object.entries(byMonth)
              .sort((a, b) => {
                const dA = payments.find((p) => new Date(p.paid_at).toLocaleString('nl-NL', { year: 'numeric', month: 'long' }) === a[0])?.paid_at
                const dB = payments.find((p) => new Date(p.paid_at).toLocaleString('nl-NL', { year: 'numeric', month: 'long' }) === b[0])?.paid_at
                return new Date(dB || 0) - new Date(dA || 0)
              })
              .map(([month, cents]) => (
                <li key={month}><strong>{month}</strong>: € {(cents / 100).toFixed(2)}</li>
              ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h2>Laatste betalingen</h2>
        {payments.length === 0 ? (
          <p className={styles.muted}>Geen betalingen.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Bedrag</th>
                  <th>Omschrijving</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 20).map((p) => (
                  <tr key={p.id}>
                    <td>{p.paid_at ? new Date(p.paid_at).toLocaleString('nl-NL') : '—'}</td>
                    <td>€ {((p.amount_cents || 0) / 100).toFixed(2)}</td>
                    <td>{p.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
