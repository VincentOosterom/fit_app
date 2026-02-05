import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { FOOD_LIBRARY } from '../../lib/foodLibrary'
import styles from './Admin.module.css'

const SLOTS = [
  { value: 'ontbijt', label: 'Ontbijt' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'avond', label: 'Avondeten' },
  { value: 'snack', label: 'Snack' },
]
const ENERGY_LEVELS = [
  { value: 'laag', label: 'Laag' },
  { value: 'medium', label: 'Medium' },
  { value: 'hoog', label: 'Hoog' },
]

const emptyMeal = () => ({
  meal_slot: 'ontbijt',
  energy_level: 'medium',
  name: '',
  grams: '',
  kcal: '',
  protein: 0,
  carbs: 0,
  fat: 0,
})

/** Flatten statische FOOD_LIBRARY naar rijen voor weergave (read-only). */
function getStaticLibraryRows() {
  const rows = []
  for (const [meal_slot, list] of Object.entries(FOOD_LIBRARY)) {
    if (!Array.isArray(list)) continue
    for (const m of list) {
      rows.push({
        id: null,
        meal_slot,
        energy_level: m.energyLevel || 'medium',
        name: m.name,
        grams: null,
        kcal: m.kcal ?? 0,
        protein: m.protein ?? 0,
        carbs: m.carbs ?? 0,
        fat: m.fat ?? 0,
        _static: true,
      })
    }
  }
  return rows.sort((a, b) => (a.meal_slot + a.energy_level).localeCompare(b.meal_slot + b.energy_level))
}

export default function AdminVoeding() {
  const [meals, setMeals] = useState([])
  const [loadError, setLoadError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyMeal())

  const staticRows = useMemo(() => getStaticLibraryRows(), [])

  const load = async () => {
    setLoadError(null)
    const { data, error } = await supabase
      .from('food_library')
      .select('*')
      .order('meal_slot', { ascending: true })
      .order('energy_level', { ascending: true })
      .order('sort_order', { ascending: true })
    if (error) {
      setLoadError(error.message)
      setMeals([])
    } else {
      setMeals(data ?? [])
    }
  }

  useEffect(() => {
    let cancelled = false
    load().then(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const payload = {
        meal_slot: form.meal_slot,
        energy_level: form.energy_level,
        name: form.name.trim(),
        grams: form.grams === '' ? null : Number(form.grams),
        kcal: Number(form.kcal) || 0,
        protein: Number(form.protein) || 0,
        carbs: Number(form.carbs) || 0,
        fat: Number(form.fat) || 0,
        updated_at: new Date().toISOString(),
      }
      if (editing) {
        const { error } = await supabase.from('food_library').update(payload).eq('id', editing.id)
        if (error) throw error
        setMessage('Gerecht bijgewerkt.')
      } else {
        const { error } = await supabase.from('food_library').insert(payload)
        if (error) throw error
        setMessage('Gerecht toegevoegd.')
      }
      setEditing(null)
      setForm(emptyMeal())
      await load()
    } catch (err) {
      setMessage('Fout: ' + (err.message || 'Onbekend'))
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (m) => {
    setEditing(m)
    setForm({
      meal_slot: m.meal_slot,
      energy_level: m.energy_level,
      name: m.name || '',
      grams: m.grams ?? '',
      kcal: m.kcal ?? '',
      protein: m.protein ?? 0,
      carbs: m.carbs ?? 0,
      fat: m.fat ?? 0,
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Dit gerecht verwijderen?')) return
    const { error } = await supabase.from('food_library').delete().eq('id', id)
    if (error) {
      setMessage('Verwijderen mislukt: ' + error.message)
      return
    }
    setMessage('Verwijderd.')
    setEditing(null)
    setForm(emptyMeal())
    await load()
  }

  if (loading) return <p className={styles.muted}>Laden…</p>

  return (
    <div className={styles.page}>
      <h1>Voeding – gerechten</h1>
      <p className={styles.intro}>
        Beheer de gerechten die klanten zien bij hun voedingsschema. Hieronder staan eerst de gerechten in de database (die je kunt bewerken en waaraan je kunt toevoegen) en daarna de standaard gerechten die in de app zitten. Klanten zien database-gerechten vóór de standaardoptie bij &quot;Kies iets anders&quot;.
      </p>
      {loadError && <p className={styles.error}>Laden mislukt: {loadError}</p>}

      <section className={styles.section}>
        <h2>{editing ? 'Gerecht bewerken' : 'Nieuw gerecht toevoegen'}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <label>Maaltijdtype</label>
            <select
              value={form.meal_slot}
              onChange={(e) => setForm((f) => ({ ...f, meal_slot: e.target.value }))}
              className={styles.input}
            >
              {SLOTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.formRow}>
            <label>Energieniveau</label>
            <select
              value={form.energy_level}
              onChange={(e) => setForm((f) => ({ ...f, energy_level: e.target.value }))}
              className={styles.input}
            >
              {ENERGY_LEVELS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.formRow}>
            <label>Naam gerecht</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="bijv. Havermout met banaan"
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formRow}>
            <label>Grammen (optioneel)</label>
            <input
              type="number"
              min="0"
              value={form.grams}
              onChange={(e) => setForm((f) => ({ ...f, grams: e.target.value }))}
              placeholder="—"
              className={styles.input}
            />
          </div>
          <div className={styles.formRow}>
            <label>kcal</label>
            <input
              type="number"
              min="0"
              value={form.kcal}
              onChange={(e) => setForm((f) => ({ ...f, kcal: e.target.value }))}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formRow}>
            <label>Eiwit (g)</label>
            <input type="number" min="0" value={form.protein} onChange={(e) => setForm((f) => ({ ...f, protein: e.target.value }))} className={styles.input} />
          </div>
          <div className={styles.formRow}>
            <label>Koolhydraten (g)</label>
            <input type="number" min="0" value={form.carbs} onChange={(e) => setForm((f) => ({ ...f, carbs: e.target.value }))} className={styles.input} />
          </div>
          <div className={styles.formRow}>
            <label>Vet (g)</label>
            <input type="number" min="0" value={form.fat} onChange={(e) => setForm((f) => ({ ...f, fat: e.target.value }))} className={styles.input} />
          </div>
          <div className={styles.formRow}>
            <button type="submit" disabled={saving} className={styles.btnPrimary}>
              {saving ? 'Opslaan…' : editing ? 'Opslaan' : 'Toevoegen'}
            </button>
            {editing && (
              <button type="button" onClick={() => { setEditing(null); setForm(emptyMeal()); }} className={styles.btnSecondary}>
                Annuleren
              </button>
            )}
          </div>
        </form>
        {message && <p className={styles.message}>{message}</p>}
      </section>

      <section className={styles.section}>
        <h2>Gerechten in database ({meals.length})</h2>
        <p className={styles.introSub}>Deze gerechten beheer je hier. Nieuw toegevoegde gerechten komen hierbij; klanten zien ze bij &quot;Kies iets anders&quot;.</p>
        {meals.length === 0 ? (
          <p className={styles.muted}>Nog geen eigen gerechten in de database. Voeg hierboven een gerecht toe; het verschijnt dan in deze lijst en bij de klant.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Niveau</th>
                  <th>Naam</th>
                  <th>Gram</th>
                  <th>kcal</th>
                  <th>E</th>
                  <th>K</th>
                  <th>V</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {meals.map((m) => (
                  <tr key={m.id}>
                    <td>{SLOTS.find((s) => s.value === m.meal_slot)?.label ?? m.meal_slot}</td>
                    <td>{m.energy_level}</td>
                    <td>{m.name}</td>
                    <td>{m.grams ?? '—'}</td>
                    <td>{m.kcal}</td>
                    <td>{m.protein}g</td>
                    <td>{m.carbs}g</td>
                    <td>{m.fat}g</td>
                    <td>
                      <button type="button" onClick={() => startEdit(m)} className={styles.link}>Bewerken</button>
                      {' · '}
                      <button type="button" onClick={() => handleDelete(m.id)} className={styles.link}>Verwijderen</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2>Standaard gerechten in de app ({staticRows.length})</h2>
        <p className={styles.introSub}>Deze gerechten staan in de applicatie en worden getoond als er voor dat type en energieniveau geen database-gerechten zijn. Alleen-lezen.</p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Niveau</th>
                <th>Naam</th>
                <th>Gram</th>
                <th>kcal</th>
                <th>E</th>
                <th>K</th>
                <th>V</th>
              </tr>
            </thead>
            <tbody>
              {staticRows.map((m, idx) => (
                <tr key={`static-${m.meal_slot}-${m.energy_level}-${m.name}-${idx}`}>
                  <td>{SLOTS.find((s) => s.value === m.meal_slot)?.label ?? m.meal_slot}</td>
                  <td>{m.energy_level}</td>
                  <td>{m.name}</td>
                  <td>—</td>
                  <td>{m.kcal}</td>
                  <td>{m.protein}g</td>
                  <td>{m.carbs}g</td>
                  <td>{m.fat}g</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
