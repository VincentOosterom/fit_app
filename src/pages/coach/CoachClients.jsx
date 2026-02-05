import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useProfile } from '../../hooks/useProfile'
import styles from './Coach.module.css'

export default function CoachClients() {
  const { isCoach, clients, loading } = useProfile()
  const [search, setSearch] = useState('')

  if (!loading && !isCoach) return <Navigate to="/dashboard" replace />
  if (loading) return <p className={styles.muted}>Laden…</p>

  const filtered = (clients ?? []).filter((c) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (c.full_name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q)
  })

  return (
    <div className={styles.page}>
      <h1>Klantenlijst</h1>
      <p className={styles.intro}>
        Zoek, beheer en voeg klanten toe. Klik op een klant voor intake, schema&apos;s, notities en communicatie.
      </p>
      <div className={styles.toolbar}>
        <input
          type="search"
          placeholder="Zoeken op naam of e-mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <Link to="/dashboard/coach/klanten/toevoegen" className={styles.btnPrimary}>Klant toevoegen</Link>
      </div>
      {filtered.length === 0 ? (
        <p className={styles.muted}>
          {search.trim() ? 'Geen klanten gevonden voor deze zoekopdracht.' : 'Nog geen klanten. Koppel een bestaande gebruiker of stuur een uitnodiging.'}
        </p>
      ) : (
        <ul className={styles.clientList}>
          {filtered.map((c) => (
            <li key={c.id} className={styles.clientCard}>
              <div className={styles.clientCardInfo}>
                <p className={styles.clientCardName}>{c.full_name || 'Geen naam'}</p>
                <p className={styles.clientCardEmail}>{c.email || '—'}</p>
              </div>
              <Link to={`/dashboard/coach/klanten/${c.id}`} className={styles.clientCardLink}>Beheren →</Link>
            </li>
          ))}
        </ul>
      )}
      <p className={styles.muted}>{filtered.length} klant(en)</p>
    </div>
  )
}
