import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import { canAddCoachClient, getCoachClientLimit, COACH_TIER_NAMES } from '../../lib/coachSubscription'
import styles from './Coach.module.css'

export default function CoachAddClient() {
  const { user } = useAuth()
  const { isCoach, loading: profileLoading, refetch, coachSubscription, clients = [] } = useProfile()
  const tier = coachSubscription ?? 'starter'
  const { allowed: canAdd, limit, remaining } = canAddCoachClient(tier, clients.length)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [inviteError, setInviteError] = useState(null)
  const [linkEmail, setLinkEmail] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError, setLinkError] = useState(null)
  const [linkSuccess, setLinkSuccess] = useState(false)

  if (!profileLoading && !isCoach) return <Navigate to="/dashboard" replace />

  const handleInvite = async (e) => {
    if (!canAdd) return
    e.preventDefault()
    const email = inviteEmail.trim()
    if (!email || !user?.id) return
    setInviteSending(true)
    setInviteError(null)
    setInviteSent(false)
    try {
      const { error } = await supabase.from('coach_invitations').insert({ coach_id: user.id, email })
      if (error) throw error
      setInviteSent(true)
      setInviteEmail('')
    } catch (err) {
      setInviteError(err.message || 'Uitnodiging versturen mislukt.')
    } finally {
      setInviteSending(false)
    }
  }

  const handleLink = async (e) => {
    e.preventDefault()
    if (!canAdd) return
    const email = linkEmail.trim()
    if (!email) return
    setLinkLoading(true)
    setLinkError(null)
    setLinkSuccess(false)
    try {
      const { data, error } = await supabase.rpc('coach_link_by_email', { target_email: email })
      const result = data || (error ? { ok: false, error: error.message } : null)
      if (!result?.ok) {
        setLinkError(result?.error || 'Koppelen mislukt.')
        return
      }
      setLinkSuccess(true)
      setLinkEmail('')
      await refetch()
    } catch (err) {
      setLinkError(err.message || 'Koppelen mislukt.')
    } finally {
      setLinkLoading(false)
    }
  }

  if (profileLoading) return <p className={styles.muted}>Laden…</p>

  return (
    <div className={styles.page}>
      <Link to="/dashboard/coach/klanten" className={styles.backLink}>← Klantenlijst</Link>
      <h1>Klant toevoegen</h1>
      <p className={styles.intro}>
        Stuur een uitnodiging per e-mail of koppel een bestaand account.
        {limit != null && (
          <span className={styles.limitInfo}> Je hebt {remaining} van de {limit} plekken over ({COACH_TIER_NAMES[tier]}).</span>
        )}
      </p>

      {!canAdd && (
        <p className={styles.limitReached}>
          Je hebt het maximum aantal klanten ({limit}) bereikt. Upgrade naar een hoger coach-abonnement om meer klanten toe te voegen.
        </p>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Uitnodiging sturen</h2>
        <form onSubmit={handleInvite}>
          <div className={styles.formRow}>
            <label htmlFor="invite-email">E-mailadres</label>
            <input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="naam@voorbeeld.nl"
              className={styles.searchInput}
              disabled={inviteSending || !canAdd}
            />
          </div>
          <button type="submit" disabled={inviteSending || !canAdd} className={styles.btnPrimary}>
            {inviteSending ? 'Bezig…' : 'Uitnodiging versturen'}
          </button>
        </form>
        {inviteSent && <p className={styles.message}>Uitnodiging opgeslagen.</p>}
        {inviteError && <p className={styles.error}>{inviteError}</p>}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Bestaande gebruiker koppelen</h2>
        <form onSubmit={handleLink}>
          <div className={styles.formRow}>
            <label htmlFor="link-email">E-mailadres</label>
            <input
              id="link-email"
              type="email"
              value={linkEmail}
              onChange={(e) => setLinkEmail(e.target.value)}
              placeholder="naam@voorbeeld.nl"
              className={styles.searchInput}
              disabled={linkLoading}
            />
          </div>
          <button type="submit" disabled={linkLoading || !canAdd} className={styles.btnSecondary}>
            {linkLoading ? 'Bezig…' : 'Koppelen'}
          </button>
        </form>
        {linkSuccess && <p className={styles.message}>Klant is gekoppeld.</p>}
        {linkError && <p className={styles.error}>{linkError}</p>}
      </section>
    </div>
  )
}
