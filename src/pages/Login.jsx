import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'
import styles from './Login.module.css'

const NETWORK_ERROR_TIP = (
  <>
    <strong>Geen verbinding met Supabase.</strong> Probeer dit:
    <ol style={{ margin: '0.5rem 0 0 1rem', paddingLeft: '1rem' }}>
      <li><strong>Project gepauzeerd?</strong> Ga naar <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">supabase.com/dashboard</a> → jouw project → klik op <strong>Restore</strong>.</li>
      <li><strong>.env</strong> in de projectroot met <code>VITE_SUPABASE_URL</code> en <code>VITE_SUPABASE_ANON_KEY</code>. Daarna <code>npm run dev</code> opnieuw starten.</li>
      <li>Controleer je internetverbinding.</li>
    </ol>
  </>
)

function getErrorMessage(err) {
  const msg = err?.message || ''
  if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network'))
    return NETWORK_ERROR_TIP
  return msg || 'Er ging iets mis.'
}

export default function Login() {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(searchParams.get('register') === '1')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    setIsSignUp(searchParams.get('register') === '1')
    setError('')
  }, [searchParams])

  const isBlocked = searchParams.get('blocked') === '1'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (isSignUp) {
        await signUp(email, password)
        setError('Controleer je e-mail voor de bevestigingslink.')
      } else {
        await signIn(email, password)
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const switchMode = (toSignUp) => {
    setIsSignUp(toSignUp)
    setError('')
    setPassword('')
  }

  if (!isSupabaseConfigured) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <h1 className={styles.title}>TrainLogic</h1>
          <p className={styles.error}>
            Supabase is nog niet geconfigureerd. Zet in de projectroot een bestand <code>.env</code> met <code>VITE_SUPABASE_URL</code> en <code>VITE_SUPABASE_ANON_KEY</code>. Start daarna <code>npm run dev</code> opnieuw.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        {isBlocked && (
          <p className={styles.error}>Dit account is geblokkeerd. Neem contact op met support.</p>
        )}

        {isSignUp ? (
          <>
            <h1 className={styles.title}>Account aanmaken</h1>
            <p className={styles.subtitle}>Registreer je voor TrainLogic en maak je eerste schema.</p>
          </>
        ) : (
          <>
            <h1 className={styles.title}>Welkom terug</h1>
            <p className={styles.subtitle}>Log in om je schema&apos;s te beheren.</p>
          </>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={styles.input}
              placeholder="jouw@email.nl"
            />
          </label>
          <label>
            Wachtwoord
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              className={styles.input}
              placeholder={isSignUp ? 'Min. 6 tekens' : '••••••••'}
            />
          </label>
          {error && <div className={styles.error}>{error}</div>}
          <button type="submit" disabled={busy} className={styles.button}>
            {busy ? 'Even geduld…' : isSignUp ? 'Account aanmaken' : 'Inloggen'}
          </button>
        </form>

        <div className={styles.switch}>
          {isSignUp ? (
            <>
              <span>Al een account?</span>
              <button type="button" onClick={() => switchMode(false)} className={styles.switchLink}>
                Log in
              </button>
            </>
          ) : (
            <>
              <span>Nog geen account?</span>
              <button type="button" onClick={() => switchMode(true)} className={styles.switchLink}>
                Registreren
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
