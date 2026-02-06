import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useClientNotifications } from '../hooks/useClientNotifications'
import styles from './NotificationsCenter.module.css'

const STATUS_LABEL = { nieuw: 'Nieuw', gelezen: 'Gelezen', opgevolgd: 'Opgevolgd' }

/**
 * Voor klant: toont ontvangen feedback van coach en status van eigen meldingen.
 * Alleen zichtbaar als de gebruiker een coach heeft (geen standalone).
 */
export default function NotificationsCenter() {
  const { user } = useAuth()
  const { coachId } = useProfile()
  const { messages, sentNotifications, loading } = useClientNotifications(user?.id, coachId)

  if (!coachId) return null

  if (loading) {
    return (
      <section className={styles.center}>
        <h2 className={styles.title}>Meldingen</h2>
        <p className={styles.muted}>Laden…</p>
      </section>
    )
  }

  const hasAny = messages.length > 0 || sentNotifications.length > 0
  if (!hasAny) return null

  return (
    <section className={styles.center}>
      <h2 className={styles.title}>Meldingen</h2>
      {messages.length > 0 && (
        <div className={styles.block}>
          <h3 className={styles.subtitle}>Feedback van coach</h3>
          <ul className={styles.list}>
            {messages.map((m) => (
              <li key={m.id} className={styles.item}>
                <p className={styles.body}>{m.body}</p>
                <span className={styles.meta}>{new Date(m.created_at).toLocaleString('nl-NL')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {sentNotifications.length > 0 && (
        <div className={styles.block}>
          <h3 className={styles.subtitle}>Jouw meldingen naar coach</h3>
          <ul className={styles.list}>
            {sentNotifications.map((n) => (
              <li key={n.id} className={styles.item}>
                <p className={styles.body}>{n.body}</p>
                <span className={styles.meta}>
                  {new Date(n.created_at).toLocaleString('nl-NL')} · Status: {STATUS_LABEL[n.status] || n.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
