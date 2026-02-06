import { Link, Navigate } from 'react-router-dom'
import { useProfile } from '../../hooks/useProfile'
import { useCoachAlerts } from '../../hooks/useCoachAlerts'
import { useClientStatusList } from '../../hooks/useClientStatusList'
import AlertsPanel from './AlertsPanel'
import styles from './Coach.module.css'

export default function CoachDashboard() {
  const { profile, isCoach, clients, loading } = useProfile()
  const coachId = profile?.role === 'coach' ? profile?.id : null
  const { notifications, newCount, loading: alertsLoading, markRead } = useCoachAlerts(coachId)
  const clientIds = (clients ?? []).map((c) => c.id)
  const { statusByClient, loading: statusLoading } = useClientStatusList(clientIds)

  if (!loading && !isCoach) return <Navigate to="/dashboard" replace />
  if (loading) return <p className={styles.muted}>Laden…</p>

  const riskCount = Object.values(statusByClient).filter((s) => s?.risk === 'red').length
  const orangeCount = Object.values(statusByClient).filter((s) => s?.risk === 'orange').length
  const adherenceValues = Object.values(statusByClient).filter((s) => s?.adherence != null).map((s) => s.adherence)
  const avgAdherence = adherenceValues.length ? Math.round(adherenceValues.reduce((a, b) => a + b, 0) / adherenceValues.length) : null

  return (
    <div className={styles.page}>
      <h1>Coach Dashboard</h1>
      <p className={styles.intro}>
        Overzicht van je klanten, meldingen en snelle acties.
      </p>

      <AlertsPanel
        notifications={notifications}
        clients={clients}
        newCount={newCount}
        onMarkRead={markRead}
      />

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{clients?.length ?? 0}</div>
          <div className={styles.statLabel}>Klanten</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{newCount}</div>
          <div className={styles.statLabel}>Nieuwe meldingen</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{riskCount}</div>
          <div className={styles.statLabel}>Risico (rood)</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{avgAdherence != null ? `${avgAdherence}%` : '—'}</div>
          <div className={styles.statLabel}>Gem. adherence</div>
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Klantstatus</h2>
        <p className={styles.intro}>Laatste activiteit en risiconiveau. Klik voor detail.</p>
        {(clients?.length ?? 0) === 0 ? (
          <p className={styles.muted}>Nog geen klanten. Koppel of nodig klanten uit via Klanten.</p>
        ) : statusLoading ? (
          <p className={styles.muted}>Laden…</p>
        ) : (
          <ul className={styles.clientList}>
            {(clients ?? []).map((c) => {
              const status = statusByClient[c.id] || {}
              const riskClass = status.risk === 'red' ? styles.riskRed : status.risk === 'orange' ? styles.riskOrange : styles.riskGreen
              return (
                <li key={c.id} className={`${styles.clientCard} ${styles.clientCardStatus}`}>
                  <div className={styles.clientCardInfo}>
                    <p className={styles.clientCardName}>{c.full_name || 'Geen naam'}</p>
                    <p className={styles.clientCardEmail}>
                      Adherence: {status.adherence != null ? `${status.adherence}%` : '—'} ·
                      Laatste activiteit: {status.lastActivity ? new Date(status.lastActivity).toLocaleDateString('nl-NL') : '—'}
                    </p>
                  </div>
                  <span className={`${styles.riskDot} ${riskClass}`} title={status.risk} aria-hidden />
                  <Link to={`/dashboard/coach/klanten/${c.id}`} className={styles.clientCardLink}>Bekijken →</Link>
                </li>
              )
            })}
          </ul>
        )}
        {(clients?.length ?? 0) > 0 && (
          <p className={styles.muted} style={{ marginTop: '0.75rem' }}>
            <Link to="/dashboard/coach/klanten" className={styles.link}>Alle klanten →</Link>
          </p>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Snelle acties</h2>
        <div className={styles.quickActions}>
          <Link to="/dashboard/coach/klanten/toevoegen" className={styles.quickAction}>Klant toevoegen</Link>
          <Link to="/dashboard/coach/klanten" className={styles.quickAction}>Klantenlijst</Link>
          <Link to="/dashboard/coach/checkins" className={styles.quickAction}>Check-ins beoordelen</Link>
          <Link to="/dashboard/coach/events" className={styles.quickAction}>Events</Link>
          <Link to="/dashboard/coach/analytics" className={styles.quickAction}>Analytics</Link>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Inzichten</h2>
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{avgAdherence != null ? `${avgAdherence}%` : '—'}</div>
            <div className={styles.statLabel}>Gemiddelde adherence</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{clients?.length ?? 0}</div>
            <div className={styles.statLabel}>Actieve klanten</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{riskCount + orangeCount}</div>
            <div className={styles.statLabel}>Aandacht (oranje + rood)</div>
          </div>
        </div>
      </section>
    </div>
  )
}
