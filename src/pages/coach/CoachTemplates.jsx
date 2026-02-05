import { Navigate } from 'react-router-dom'
import { useProfile } from '../../hooks/useProfile'
import styles from './Coach.module.css'

export default function CoachTemplates() {
  const { isCoach, loading } = useProfile()

  if (!loading && !isCoach) return <Navigate to="/dashboard" replace />
  if (loading) return <p className={styles.muted}>Laden…</p>

  return (
    <div className={styles.page}>
      <h1>Schema templates</h1>
      <p className={styles.intro}>
        Beheer herbruikbare templates voor voedings- en trainingsschema&apos;s. (Functie komt later; schema&apos;s worden nu per klant gegenereerd op basis van intake.)
      </p>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Templates</h2>
        <p className={styles.muted}>Nog geen templates. Hier kun je later standaardschema&apos;s aanmaken en aan klanten koppelen.</p>
      </section>
    </div>
  )
}
