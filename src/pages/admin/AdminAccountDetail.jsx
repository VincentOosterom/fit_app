import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import styles from './Admin.module.css'

export default function AdminAccountDetail() {
  const { userId } = useParams()
  const [profile, setProfile] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [payments, setPayments] = useState([])
  const [input, setInput] = useState(null)
  const [trainingPlans, setTrainingPlans] = useState([])
  const [nutritionPlans, setNutritionPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionBusy, setActionBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    async function load() {
      const [pRes, sRes, payRes, iRes, tRes, nRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('subscriptions').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('payments').select('*').eq('user_id', userId).order('paid_at', { ascending: false }).limit(50),
        supabase.from('client_input').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('training_plans').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('nutrition_plans').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      ])
      if (!cancelled) {
        setProfile(pRes.data ?? null)
        setSubscription(sRes.data ?? null)
        setPayments(payRes.data ?? [])
        setInput(iRes.data ?? null)
        setTrainingPlans(tRes.data ?? [])
        setNutritionPlans(nRes.data ?? [])
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  const handleBlock = async (block) => {
    if (!userId) return
    setActionBusy(true)
    setMessage('')
    try {
      const { error } = await supabase.from('profiles').update({ is_blocked: block }).eq('id', userId)
      if (error) throw error
      setProfile((p) => (p ? { ...p, is_blocked: block } : null))
      setMessage(block ? 'Account geblokkeerd.' : 'Account gedeblokkeerd.')
    } catch (e) {
      setMessage(e.message || 'Actie mislukt.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleSoftDelete = async () => {
    if (!userId || !confirm('Account als verwijderd markeren? De gebruiker kan daarna niet meer inloggen (blokkeren heeft hetzelfde effect).')) return
    setActionBusy(true)
    setMessage('')
    try {
      const { error } = await supabase.from('profiles').update({ deleted_at: new Date().toISOString(), is_blocked: true }).eq('id', userId)
      if (error) throw error
      setProfile((p) => (p ? { ...p, deleted_at: new Date().toISOString(), is_blocked: true } : null))
      setMessage('Account gemarkeerd als verwijderd en geblokkeerd.')
    } catch (e) {
      setMessage(e.message || 'Actie mislukt.')
    } finally {
      setActionBusy(false)
    }
  }

  if (loading) return <p className={styles.muted}>Laden…</p>
  if (!profile) return <p className={styles.muted}>Account niet gevonden.</p>

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'

  return (
    <div className={styles.page}>
      <p className={styles.back}><Link to="/dashboard/admin/accounts">← Terug naar accounts</Link></p>
      <h1>Account</h1>

      <section className={styles.section}>
        <h2>Gegevens</h2>
        <dl className={styles.dl}>
          <dt>E-mail</dt><dd>{profile.email || '—'}</dd>
          <dt>Naam</dt><dd>{profile.full_name || '—'}</dd>
          <dt>Rol</dt><dd>{profile.role || 'client'}</dd>
          <dt>Account actief</dt><dd>{profile.deleted_at ? 'Nee (verwijderd)' : profile.is_blocked ? 'Nee (geblokkeerd)' : 'Ja'}</dd>
          <dt>Geregistreerd</dt><dd>{profile.created_at ? new Date(profile.created_at).toLocaleString('nl-NL') : '—'}</dd>
        </dl>
        <div className={styles.actions}>
          {profile.is_blocked ? (
            <button type="button" onClick={() => handleBlock(false)} disabled={actionBusy} className={styles.btnSecondary}>Deblokkeren</button>
          ) : (
            <button type="button" onClick={() => handleBlock(true)} disabled={actionBusy} className={styles.btnDanger}>Blokkeren</button>
          )}
          <button type="button" onClick={handleSoftDelete} disabled={actionBusy || !!profile.deleted_at} className={styles.btnDanger}>Account verwijderen (markeren)</button>
        </div>
        {message && <p className={styles.message}>{message}</p>}
      </section>

      <section className={styles.section}>
        <h2>Abonnement & betalingen</h2>
        <dl className={styles.dl}>
          <dt>Status abonnement</dt><dd>{subscription ? subscription.status : 'Geen'}</dd>
          <dt>Actief (ja/nee)</dt><dd>{subscription ? (isActive ? 'Ja' : 'Nee') : '—'}</dd>
          <dt>Bedrag</dt><dd>{subscription?.amount_cents != null ? `€ ${(subscription.amount_cents / 100).toFixed(2)}` : '—'}</dd>
        </dl>
        <h3>Betalingen</h3>
        {payments.length === 0 ? (
          <p className={styles.muted}>Geen betalingen.</p>
        ) : (
          <ul className={styles.list}>
            {payments.map((pay) => (
              <li key={pay.id}>{new Date(pay.paid_at).toLocaleDateString('nl-NL')} — € {(pay.amount_cents / 100).toFixed(2)} {pay.description ? `— ${pay.description}` : ''}</li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h2>Input (client_input)</h2>
        {input ? (
          <dl className={styles.dl}>
            <dt>Doel</dt><dd>{input.goal ?? '—'}</dd>
            <dt>Niveau</dt><dd>{input.level ?? '—'}</dd>
            <dt>Dagen/week</dt><dd>{input.days_per_week ?? '—'}</dd>
          </dl>
        ) : (
          <p className={styles.muted}>Geen input.</p>
        )}
      </section>

      <section className={styles.section}>
        <h2>Schema’s</h2>
        <h3>Trainingsschema’s ({trainingPlans.length})</h3>
        {trainingPlans.length === 0 ? (
          <p className={styles.muted}>Geen.</p>
        ) : (
          <ul className={styles.list}>
            {trainingPlans.map((t) => (
              <li key={t.id}>
                {new Date(t.created_at).toLocaleDateString('nl-NL')} — block_id: {t.block_id ? String(t.block_id).slice(0, 8) + '…' : '—'}
              </li>
            ))}
          </ul>
        )}
        <h3>Voedingsschema’s ({nutritionPlans.length})</h3>
        {nutritionPlans.length === 0 ? (
          <p className={styles.muted}>Geen.</p>
        ) : (
          <ul className={styles.list}>
            {nutritionPlans.map((n) => (
              <li key={n.id}>
                {new Date(n.created_at).toLocaleDateString('nl-NL')} — block_id: {n.block_id ? String(n.block_id).slice(0, 8) + '…' : '—'}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
