import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { COACH_TIERS, COACH_TIER_NAMES } from '../../lib/coachSubscription'
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
    if (!userId || !window.confirm('Account als verwijderd markeren? De gebruiker kan daarna niet meer inloggen.')) return
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

  const handleResetAccount = async () => {
    if (!userId || !window.confirm('Account resetten? Alle input, schema\'s en evaluaties worden verwijderd. Abonnement en profiel blijven behouden.')) return
    setActionBusy(true)
    setMessage('')
    try {
      const { data, error } = await supabase.rpc('admin_reset_account', { target_user_id: userId })
      if (error) throw error
      if (data?.ok === false) {
        setMessage(data.error || 'Reset mislukt.')
        return
      }
      setInput(null)
      setTrainingPlans([])
      setNutritionPlans([])
      setMessage('Account gereset.')
    } catch (e) {
      setMessage(e.message || 'Reset mislukt.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleCoachSubscriptionChange = async (tier) => {
    if (!userId || !profile || profile.role !== 'coach') return
    setActionBusy(true)
    setMessage('')
    try {
      const { error } = await supabase.from('profiles').update({ coach_subscription: tier }).eq('id', userId)
      if (error) throw error
      setProfile((p) => (p ? { ...p, coach_subscription: tier } : null))
      setMessage('Coach-abonnement bijgewerkt.')
    } catch (e) {
      setMessage(e.message || 'Opslaan mislukt.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleSetCoachRole = async (makeCoach) => {
    if (!userId) return
    if (makeCoach && !window.confirm('Deze gebruiker als coach aanstellen?')) return
    if (!makeCoach && !window.confirm('Rol coach verwijderen? Alle gekoppelde klanten worden ontkoppeld.')) return
    setActionBusy(true)
    setMessage('')
    try {
      if (makeCoach) {
        const { error } = await supabase.from('profiles').update({ role: 'coach' }).eq('id', userId)
        if (error) throw error
        setProfile((p) => (p ? { ...p, role: 'coach' } : null))
        setMessage('Gebruiker is nu coach.')
      } else {
        await supabase.from('profiles').update({ coach_id: null }).eq('coach_id', userId)
        const { error } = await supabase.from('profiles').update({ role: 'client' }).eq('id', userId)
        if (error) throw error
        setProfile((p) => (p ? { ...p, role: 'client' } : null))
        setMessage('Rol coach verwijderd.')
      }
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
          {profile.role === 'coach' ? (
            <button type="button" onClick={() => handleSetCoachRole(false)} disabled={actionBusy} className={styles.btnSecondary}>Rol coach verwijderen</button>
          ) : (
            <button type="button" onClick={() => handleSetCoachRole(true)} disabled={actionBusy} className={styles.btnPrimary}>Als coach aanstellen</button>
          )}
          {profile.is_blocked ? (
            <button type="button" onClick={() => handleBlock(false)} disabled={actionBusy} className={styles.btnSecondary}>Deblokkeren</button>
          ) : (
            <button type="button" onClick={() => handleBlock(true)} disabled={actionBusy} className={styles.btnSecondary}>Blokkeren</button>
          )}
          <button type="button" onClick={handleSoftDelete} disabled={actionBusy || !!profile.deleted_at} className={styles.btnDanger}>Account verwijderen (markeren)</button>
          <button type="button" onClick={handleResetAccount} disabled={actionBusy} className={styles.btnSecondary}>Account resetten</button>
        </div>
        {message && <p className={styles.message}>{message}</p>}
      </section>

      {profile.role === 'coach' && (
        <section className={styles.section}>
          <h2>Coach-abonnement</h2>
          <p className={styles.introSub}>Abonnementniveau van deze coach (Starter: max 10 klanten, Pro: max 50, Premium: onbeperkt).</p>
          <div className={styles.formRow}>
            <label htmlFor="coach-sub">Niveau</label>
            <select
              id="coach-sub"
              value={profile.coach_subscription ?? 'starter'}
              onChange={(e) => handleCoachSubscriptionChange(e.target.value)}
              disabled={actionBusy}
              className={styles.input}
            >
              {COACH_TIERS.map((t) => (
                <option key={t} value={t}>{COACH_TIER_NAMES[t]}</option>
              ))}
            </select>
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2>Abonnement & betalingen</h2>
        <dl className={styles.dl}>
          <dt>Status</dt><dd>{subscription ? subscription.status : 'Geen'}</dd>
          <dt>Actief</dt><dd>{subscription ? (isActive ? 'Ja' : 'Nee') : '—'}</dd>
          <dt>Bedrag</dt><dd>{subscription?.amount_cents != null ? `€ ${(subscription.amount_cents / 100).toFixed(2)}` : '—'}</dd>
        </dl>
        {payments.length > 0 && (
          <ul className={styles.list}>
            {payments.map((pay) => (
              <li key={pay.id}>{new Date(pay.paid_at).toLocaleDateString('nl-NL')} — € {(pay.amount_cents / 100).toFixed(2)}</li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h2>Input</h2>
        {input ? <dl className={styles.dl}><dt>Doel</dt><dd>{input.goal ?? '—'}</dd><dt>Niveau</dt><dd>{input.level ?? '—'}</dd></dl> : <p className={styles.muted}>Geen input.</p>}
      </section>

      <section className={styles.section}>
        <h2>Schema&apos;s</h2>
        <p>Trainingsschema&apos;s: {trainingPlans.length} · Voedingsschema&apos;s: {nutritionPlans.length}</p>
      </section>
    </div>
  )
}
