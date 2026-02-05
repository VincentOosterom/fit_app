import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useSubscription } from '../hooks/useSubscription'
import { supabase } from '../lib/supabase'
import styles from './Settings.module.css'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Settings() {
  const { user, signOut } = useAuth()
  const { profile, refetch } = useProfile()
  const { planName, amountFormatted, nextBillingDate, isActive, payments } = useSubscription()
  const [name, setName] = useState(profile?.full_name ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setName(profile?.full_name ?? '')
  }, [profile?.full_name])

  const handleSaveName = async (e) => {
    e.preventDefault()
    if (!user?.id) return
    setSaving(true)
    setMessage('')
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    setSaving(false)
    if (error) {
      setMessage(error.message || 'Opslaan mislukt.')
      return
    }
    setMessage('Naam opgeslagen.')
    refetch?.()
  }

  const email = user?.email ?? profile?.email ?? '—'

  return (
    <div className={styles.page}>
      <h1>Instellingen</h1>
      <p className={styles.intro}>
        Beheer je account, abonnement en voorkeuren. Wijzigingen aan je plan of facturatie doe je onder Plan & factuur.
      </p>

      <div className={styles.grid}>
        <section className={styles.section}>
          <h2>Account</h2>
          <dl className={styles.dl}>
            <dt>E-mail</dt>
            <dd className={styles.email}>{email}</dd>
            <dt>Weergavenaam</dt>
            <dd>
              <form onSubmit={handleSaveName} className={styles.nameForm}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Je naam"
                  className={styles.input}
                />
                <button type="submit" disabled={saving} className={styles.button}>
                  {saving ? 'Opslaan…' : 'Opslaan'}
                </button>
              </form>
            </dd>
          </dl>
          {message && <p className={styles.message}>{message}</p>}
          <p className={styles.hint}>
            Wachtwoord wijzigen? Gebruik de link &quot;Wachtwoord vergeten&quot; op de inlogpagina; je ontvangt dan een e-mail om een nieuw wachtwoord in te stellen.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Abonnement</h2>
          <p className={styles.planBadge}>
            <strong>{planName}</strong> — {amountFormatted}/maand
          </p>
          <dl className={styles.dl}>
            <dt>Status</dt>
            <dd>{isActive ? 'Actief' : 'Niet actief'}</dd>
            <dt>Volgende factuur</dt>
            <dd>{formatDate(nextBillingDate)}</dd>
          </dl>
          <Link to="/dashboard/plan" className={styles.link}>Plan wijzigen of bekijken →</Link>
        </section>

        <section className={styles.section}>
          <h2>Facturatie</h2>
          {payments?.length > 0 ? (
            <>
              <p className={styles.muted}>Laatste betalingen</p>
              <ul className={styles.paymentList}>
                {payments.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    <span>{formatDate(p.paid_at)}</span>
                    <span>€ {((p.amount_cents ?? 0) / 100).toFixed(2).replace('.', ',')}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className={styles.muted}>Nog geen betalingen zichtbaar.</p>
          )}
        </section>

        <section className={styles.section}>
          <h2>Snelkoppelingen</h2>
          <ul className={styles.linkList}>
            <li><Link to="/dashboard/input" className={styles.link}>Mijn input</Link> — Gegevens en doelen aanpassen</li>
            <li><Link to="/dashboard/voeding" className={styles.link}>Voedingsschema</Link> — Schema en weken bekijken</li>
            <li><Link to="/dashboard/training" className={styles.link}>Trainingsschema</Link> — Schema en weken bekijken</li>
            <li><Link to="/dashboard/plan" className={styles.link}>Plan & factuur</Link> — Abonnement wijzigen</li>
          </ul>
        </section>
      </div>

      <section className={styles.sectionFooter}>
        <h2>Uitloggen</h2>
        <p className={styles.muted}>Log uit van je account op dit apparaat.</p>
        <button type="button" onClick={() => signOut()} className={styles.logoutBtn}>
          Uitloggen
        </button>
      </section>
    </div>
  )
}
