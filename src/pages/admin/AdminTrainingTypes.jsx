import { TRAINING_GOALS, TRAINING_GOAL_CATEGORIES } from '../../lib/trainingGoals'
import { FOCUS_BY_GOAL, SESSION_TYPE_LABELS } from '../../rules/trainingEngine'
import styles from './Admin.module.css'

export default function AdminTrainingTypes() {
  const byCategory = {}
  TRAINING_GOALS.forEach((g) => {
    const cat = g.category || 'algemeen'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(g)
  })

  return (
    <div className={styles.page}>
      <h1>Trainingen</h1>
      <p className={styles.intro}>
        Overzicht van de trainingsdoelen die klanten kunnen kiezen bij &quot;Mijn input&quot;, en van de sessietypen die in schema&apos;s worden gebruikt. Het schema (focus per week, sessies, oefeningen) past zich automatisch aan het gekozen doel aan.
      </p>

      <section className={styles.section}>
        <h2>Doelen per categorie</h2>
        {Object.entries(TRAINING_GOAL_CATEGORIES).map(([key, label]) => {
          const goals = byCategory[key] || []
          if (!goals.length) return null
          return (
            <div key={key} className={styles.mealCategory}>
              <h3>{label}</h3>
              <ul className={styles.list}>
                {goals.map((g) => (
                  <li key={g.value}>
                    <strong>{g.label}</strong>
                    {g.tip && <span className={styles.muted}> — {g.tip}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </section>

      <section className={styles.section}>
        <h2>Focus per week (per doel)</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Doel</th>
                <th>Week 1</th>
                <th>Week 2</th>
                <th>Week 3</th>
                <th>Week 4</th>
              </tr>
            </thead>
            <tbody>
              {TRAINING_GOALS.map((g) => {
                const focuses = FOCUS_BY_GOAL[g.value] || []
                return (
                  <tr key={g.value}>
                    <td>{g.label}</td>
                    {[0, 1, 2, 3].map((i) => (
                      <td key={i}>{focuses[i] || '—'}</td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Sessietypen in schema&apos;s</h2>
        <p className={styles.muted}>Deze types komen voor in de gegenereerde weken, afhankelijk van doel en focus.</p>
        <ul className={styles.list}>
          {Object.entries(SESSION_TYPE_LABELS).map(([key, label]) => (
            <li key={key}>{label}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
