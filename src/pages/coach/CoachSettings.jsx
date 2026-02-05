import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useProfile } from '../../hooks/useProfile'
import styles from './Coach.module.css'

export default function CoachSettings() {
  const { isCoach, profile, loading } = useProfile()
  const [message, setMessage] = useState('')

  if (!loading && !isCoach) return <Navigate to="/dashboard" replace />
  if (loading) return <p className={styles.muted}>Laden…</p>

  return (
    <div className={styles.page}>
      <h1>Coach instellingen</h1>
      <p className={styles.intro}>
        Je profiel en voorkeuren als coach. Wijzigingen worden opgeslagen in je account.
      </p>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Profiel</h2>
        <p><strong>Naam:</strong> {profile?.full_name || '—'}</p>
        <p><strong>E-mail:</strong> {profile?.email || '—'}</p>
        <p className={styles.muted}>Naam en e-mail aanpassen kan in de algemene Instellingen (buiten het coachportaal).</p>
      </section>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Coach-voorkeuren</h2>
        <p className={styles.muted}>Hier kunnen later voorkeuren komen: standaard notificaties, herinneringen voor check-ins, etc.</p>
      </section>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  )
}
