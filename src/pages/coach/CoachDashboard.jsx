import { Link, Navigate } from 'react-router-dom'
import { useProfile } from '../../hooks/useProfile'
import styles from './Coach.module.css'

export default function CoachDashboard() {
  const { isCoach, clients, loading } = useProfile()

  if (!loading && !isCoach) return <Navigate to="/dashboard" replace />
  if (loading) return <p className={styles.muted}>Laden…</p>

  const alertCount = 0 // Placeholder: later uit week_reviews / adherence
  const recentCheckins = 0

  return (
    <div className={styles.page}>
      <h1>Coach Dashboard</h1>
      <p className={styles.intro}>
        Overzicht van je klanten, meldingen en snelle acties.
      </p>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{clients?.length ?? 0}</div>
          <div className={styles.statLabel}>Klanten</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{alertCount}</div>
          <div className={styles.statLabel}>Meldingen</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{recentCheckins}</div>
          <div className={styles.statLabel}>Check-ins deze week</div>
        </div>
      </div>

      {alertCount > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Meldingen</h2>
          <ul className={styles.alertList}>
            <li className={styles.alertItem}>
              Geen openstaande meldingen. (Hier verschijnen later waarschuwingen bij lage adherence of gemiste evaluaties.)
            </li>
          </ul>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Snelle acties</h2>
        <div className={styles.quickActions}>
          <Link to="/dashboard/coach/klanten/toevoegen" className={styles.quickAction}>Klant toevoegen</Link>
          <Link to="/dashboard/coach/klanten" className={styles.quickAction}>Klantenlijst</Link>
          <Link to="/dashboard/coach/events" className={styles.quickAction}>Events</Link>
          <Link to="/dashboard/coach/checkins" className={styles.quickAction}>Check-ins</Link>
          <Link to="/dashboard/coach/analytics" className={styles.quickAction}>Analytics</Link>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Recente klanten</h2>
        {(clients?.length ?? 0) === 0 ? (
          <p className={styles.muted}>Nog geen klanten. Koppel of nodig klanten uit via Klanten.</p>
        ) : (
          <ul className={styles.clientList}>
            {(clients ?? []).slice(0, 5).map((c) => (
              <li key={c.id} className={styles.clientCard}>
                <div className={styles.clientCardInfo}>
                  <p className={styles.clientCardName}>{c.full_name || 'Geen naam'}</p>
                  <p className={styles.clientCardEmail}>{c.email || '—'}</p>
                </div>
                <Link to={`/dashboard/coach/klanten/${c.id}`} className={styles.clientCardLink}>Bekijken →</Link>
              </li>
            ))}
          </ul>
        )}
        {(clients?.length ?? 0) > 5 && (
          <p className={styles.muted}><Link to="/dashboard/coach/klanten" className={styles.link}>Alle klanten →</Link></p>
        )}
      </section>
    </div>
  )
}
