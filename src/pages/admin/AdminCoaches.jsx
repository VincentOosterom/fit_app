import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { COACH_TIER_NAMES } from '../../lib/coachSubscription'
import styles from './Admin.module.css'

export default function AdminCoaches() {
  const [coaches, setCoaches] = useState([])
  const [clientCounts, setClientCounts] = useState({})
  const [planCounts, setPlanCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [coachRes, profilesRes, nutRes, trRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, role, coach_subscription').eq('role', 'coach').order('full_name'),
        supabase.from('profiles').select('id, coach_id').not('coach_id', 'is', null),
        supabase.from('nutrition_plans').select('user_id'),
        supabase.from('training_plans').select('user_id'),
      ])
      if (cancelled) return
      const coachList = coachRes.data ?? []
      setCoaches(coachList)
      const byCoach = {}
      ;(profilesRes.data ?? []).forEach((p) => {
        if (!byCoach[p.coach_id]) byCoach[p.coach_id] = []
        byCoach[p.coach_id].push(p.id)
      })
      setClientCounts(byCoach)
      const nutByUser = {}
      ;(nutRes.data ?? []).forEach((r) => {
        nutByUser[r.user_id] = (nutByUser[r.user_id] || 0) + 1
      })
      const trByUser = {}
      ;(trRes.data ?? []).forEach((r) => {
        trByUser[r.user_id] = (trByUser[r.user_id] || 0) + 1
      })
      const plansByCoach = {}
      Object.keys(byCoach).forEach((coachId) => {
        const clientIds = byCoach[coachId]
        let total = 0
        clientIds.forEach((uid) => {
          total += (nutByUser[uid] || 0) + (trByUser[uid] || 0)
        })
        plansByCoach[coachId] = total
      })
      setPlanCounts(plansByCoach)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) return <p className={styles.muted}>Laden…</p>

  return (
    <div className={styles.page}>
      <h1>Coaches</h1>
      <p className={styles.intro}>
        Overzicht van alle coaches. Per coach zie je hoeveel klanten aan hen gekoppeld zijn en hoeveel voedings- en trainingsschema&apos;s in totaal voor die klanten zijn gegenereerd. Als een coach een klant aanmaakt of koppelt, kan die klant inloggen en ziet dezelfde omgeving als een gewone klant.
      </p>

      {coaches.length === 0 ? (
        <p className={styles.muted}>Er zijn nog geen coaches. Zet in Klanten of Medewerkers een account op role &quot;coach&quot;.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Naam</th>
                <th>E-mail</th>
                <th>Abonnement</th>
                <th>Aantal klanten</th>
                <th>Schema&apos;s gegenereerd</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {coaches.map((c) => (
                <tr key={c.id}>
                  <td>{c.full_name || '—'}</td>
                  <td>{c.email || '—'}</td>
                  <td>{COACH_TIER_NAMES[c.coach_subscription] || c.coach_subscription || 'Starter'}</td>
                  <td>{clientCounts[c.id]?.length ?? 0}</td>
                  <td>{planCounts[c.id] ?? 0}</td>
                  <td>
                    <Link to={`/dashboard/admin/accounts/${c.id}`} className={styles.link}>Account bekijken</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
