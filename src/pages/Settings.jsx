import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { supabase } from '../lib/supabase'
import styles from './Settings.module.css'

export default function Settings() {
  const { user } = useAuth()
  const { planType, planName, amountFormatted } = useSubscription()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [pwMessage, setPwMessage] = useState('')
  const [pwBusy, setPwBusy] = useState(false)

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPwMessage('')
    if (password.length < 6) {
      setPwMessage('Wachtwoord moet minstens 6 tekens zijn.')
      return
    }
    if (password !== passwordConfirm) {
      setPwMessage('Wachtwoorden komen niet overeen.')
      return
    }
    setPwBusy(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setPwMessage('Wachtwoord is gewijzigd.')
      setPassword('')
      setPasswordConfirm('')
    } catch (err) {
      setPwMessage(err.message || 'Wijzigen mislukt.')
    } finally {
      setPwBusy(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1>Instellingen</h1>
      <p className={styles.intro}>Beheer je account en abonnement.</p>

      <section className={styles.section}>
        <h2>Account</h2>
        <p className={styles.muted}>E-mail: <strong>{user?.email}</strong></p>
      </section>

      <section className={styles.section}>
        <h2>Wachtwoord wijzigen</h2>
        <form onSubmit={handlePasswordSubmit} className={styles.form}>
          <label>
            Nieuw wachtwoord
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              className={styles.input}
              placeholder="Min. 6 tekens"
            />
          </label>
          <label>
            Bevestig wachtwoord
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              className={styles.input}
              placeholder="Herhaal nieuw wachtwoord"
            />
          </label>
          <button type="submit" disabled={pwBusy} className={styles.button}>
            {pwBusy ? 'Bezig…' : 'Wachtwoord wijzigen'}
          </button>
          {pwMessage && <p className={pwMessage.startsWith('Wachtwoord is') ? styles.success : styles.error}>{pwMessage}</p>}
        </form>
      </section>

      <section className={styles.section}>
        <h2>Abonnement</h2>
        <p className={styles.muted}>Huidige plan: <strong>{planName}</strong> ({amountFormatted}/maand)</p>
        <Link to="/dashboard/plan" className={styles.link}>Plan wijzigen →</Link>
      </section>
    </div>
  )
}
