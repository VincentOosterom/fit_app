import { Navigate, Link } from 'react-router-dom'
import { usePlans } from '../hooks/usePlans'
import styles from './Plan.module.css'

export default function TrainingPlan() {
  const { trainingPlan, loading } = usePlans()

  if (loading) return <p className={styles.muted}>Laden…</p>
  if (trainingPlan) return <Navigate to={`/dashboard/training/${trainingPlan.id}`} replace />
  return (
    <div className={styles.page}>
      <h1>Trainingsschema</h1>
      <p className={styles.intro}>
        Genereer eerst je 4-weekse schema op het <Link to="/dashboard">dashboard</Link>. Daarna kun je hier je schema bekijken, per week inzoomen en je evaluatie invullen.
      </p>
    </div>
  )
}
