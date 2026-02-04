import { MEAL_EXAMPLES, MEAL_SLOT_LABELS } from '../../rules/nutritionEngine'
import styles from './Admin.module.css'

const ENERGY_LABELS = { laag: 'Laag', medium: 'Medium', hoog: 'Hoog' }
const SLOT_KEYS = ['ontbijt', 'lunch', 'avond', 'snack']

export default function AdminMeals() {
  return (
    <div className={styles.page}>
      <h1>Maaltijden</h1>
      <p className={styles.intro}>
        Overzicht van alle voorbeeldmaaltijden die klanten kunnen kiezen, per energieniveau en maaltijdtype. Op de weekpagina voeding kunnen zij &quot;Kies iets anders&quot; gebruiken om te wisselen tussen deze opties.
      </p>

      {Object.entries(MEAL_EXAMPLES).map(([energyKey, slots]) => (
        <section key={energyKey} className={styles.section}>
          <h2>{ENERGY_LABELS[energyKey] || energyKey}</h2>
          {SLOT_KEYS.map((slotKey) => {
            const items = slots[slotKey] || []
            const label = MEAL_SLOT_LABELS[slotKey] || slotKey
            if (!items.length) return null
            return (
              <div key={slotKey} className={styles.mealCategory}>
                <h3>{label}</h3>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Maaltijd</th>
                        <th>kcal</th>
                        <th>Eiwit</th>
                        <th>Koolh.</th>
                        <th>Vet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((m, i) => (
                        <tr key={i}>
                          <td>{m.name}</td>
                          <td>{m.kcal}</td>
                          <td>{m.protein}g</td>
                          <td>{m.carbs}g</td>
                          <td>{m.fat}g</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </section>
      ))}
    </div>
  )
}
