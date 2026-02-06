import { Link } from 'react-router-dom'
import styles from './Coach.module.css'

const TYPE_LABEL = { training: 'Training', voeding: 'Voeding', blessure: 'Blessure', algemeen: 'Algemeen' }
const PRIORITY_CLASS = { laag: '', normaal: styles.alertItem, hoog: styles.alertItemWarning }

export default function AlertsPanel({ notifications, clients, newCount, onMarkRead, onMarkActed }) {
  const clientMap = (clients ?? []).reduce((acc, c) => { acc[c.id] = c; return acc }, {})

  if (!notifications?.length) {
    return (
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Alerts & meldingen</h2>
        <p className={styles.muted}>Geen openstaande meldingen.</p>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        Alerts & meldingen
        {newCount > 0 && (
          <span className={styles.alertBadge} aria-label={`${newCount} nieuw`}>{newCount}</span>
        )}
      </h2>
      <ul className={styles.alertList}>
        {notifications.map((n) => {
          const client = clientMap[n.client_id]
          const name = client?.full_name || client?.email || 'Klant'
          const isNew = n.status === 'nieuw'
          const priorityClass = PRIORITY_CLASS[n.priority] || styles.alertItem
          return (
            <li
              key={n.id}
              className={`${styles.alertItem} ${isNew ? styles.alertItemNew : ''} ${priorityClass}`}
            >
              <Link
                to={`/dashboard/coach/klanten/${n.client_id}?tab=communication`}
                className={styles.alertLink}
              >
                <span className={styles.alertMeta}>
                  {name} · {TYPE_LABEL[n.type] || n.type} {n.priority === 'hoog' && '· Hoog'}
                </span>
                <span className={styles.alertBody}>{n.body}</span>
                <span className={styles.alertTime}>
                  {n.created_at ? new Date(n.created_at).toLocaleString('nl-NL') : ''}
                </span>
              </Link>
              <div className={styles.alertActions}>
                {isNew && (
                  <button
                    type="button"
                    className={styles.alertBtn}
                    onClick={(e) => { e.preventDefault(); onMarkRead?.(n.id) }}
                  >
                    Gelezen
                  </button>
                )}
                <Link
                  to={`/dashboard/coach/klanten/${n.client_id}?tab=communication`}
                  className={styles.alertBtnPrimary}
                >
                  Reageren
                </Link>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
