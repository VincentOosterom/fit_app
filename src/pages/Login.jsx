import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'
import styles from './Login.module.css'

const REGISTER_USPS = [
  'Voeding en training op maat — één plan dat bij je past',
  'Persoonlijk 4-weekse schema op vaste, uitlegbare regels',
  'Wekelijkse evaluatie: wij sturen bij op jouw feedback',
  'Eerste maand gratis — daarna vanaf € 7,95/maand',
]

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
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [isSignUp, setIsSignUp] = useState(searchParams.get('register') === '1')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmailSent, setForgotEmailSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { signIn, signUp, recoveryMode, resetPasswordForEmail, updatePassword, clearRecoveryMode } = useAuth()
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

  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await resetPasswordForEmail(email.trim())
      setForgotEmailSent(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const handleSetNewPasswordSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (newPassword !== newPasswordConfirm) {
      setError('De twee wachtwoorden komen niet overeen.')
      return
    }
    if (newPassword.length < 6) {
      setError('Wachtwoord moet minstens 6 tekens zijn.')
      return
    }
    setBusy(true)
    try {
      await updatePassword(newPassword)
      clearRecoveryMode()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const switchMode = (toSignUp) => {
    setIsSignUp(toSignUp)
    setShowForgotPassword(false)
    setForgotEmailSent(false)
    setError('')
    setPassword('')
    navigate(toSignUp ? '/login?register=1' : '/login', { replace: true })
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

  // Na klik op link in e-mail: stel nieuw wachtwoord in
  if (recoveryMode && !isSignUp) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <h1 className={styles.title}>Nieuw wachtwoord instellen</h1>
          <p className={styles.subtitle}>Kies een nieuw wachtwoord voor je account.</p>
          <form onSubmit={handleSetNewPasswordSubmit} className={styles.form}>
            <label>
              Nieuw wachtwoord
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className={styles.input}
                placeholder="Min. 6 tekens"
              />
            </label>
            <label>
              Wachtwoord bevestigen
              <input
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className={styles.input}
                placeholder="Herhaal nieuw wachtwoord"
              />
            </label>
            {error && <div className={styles.error}>{error}</div>}
            <button type="submit" disabled={busy} className={styles.button}>
              {busy ? 'Bezig…' : 'Wachtwoord wijzigen'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Stap 1: e-mail invullen voor wachtwoord vergeten
  if (showForgotPassword) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <h1 className={styles.title}>Wachtwoord vergeten</h1>
          <p className={styles.subtitle}>
            Vul je e-mailadres in. We sturen je een e-mail met een link. Klik op de link om een nieuw wachtwoord in te stellen.
          </p>
          {forgotEmailSent ? (
            <>
              <p className={styles.success}>We hebben een e-mail gestuurd naar <strong>{email}</strong>. Klik op de link in de e-mail om je wachtwoord te wijzigen.</p>
              <button type="button" onClick={() => { setShowForgotPassword(false); setForgotEmailSent(false); setError(''); }} className={styles.backLink}>
                ← Terug naar inloggen
              </button>
            </>
          ) : (
            <form onSubmit={handleForgotSubmit} className={styles.form}>
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
              {error && <div className={styles.error}>{error}</div>}
              <button type="submit" disabled={busy} className={styles.button}>
                {busy ? 'Bezig…' : 'Verstuur link'}
              </button>
              <button type="button" onClick={() => { setShowForgotPassword(false); setError(''); }} className={styles.backLink}>
                ← Terug naar inloggen
              </button>
            </form>
          )}
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

        <div className={styles.cardInner}>
          <div key={isSignUp ? 'signup' : 'login'} className={styles.viewContent}>
            {isSignUp ? (
              <>
                <h1 className={styles.title}>Account aanmaken</h1>
                <p className={styles.subtitle}>Registreer je voor TrainLogic en maak je eerste schema.</p>
                <div className={styles.usps}>
                  <p className={styles.uspsTitle}>Waarom TrainLogic?</p>
                  <ul className={styles.uspsList}>
                    {REGISTER_USPS.map((usp, i) => (
                      <li key={i}>{usp}</li>
                    ))}
                  </ul>
                </div>
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
              {!isSignUp && (
                <p className={styles.forgotWrap}>
                  <button type="button" onClick={() => { setShowForgotPassword(true); setError(''); }} className={styles.forgotLink}>
                    Wachtwoord vergeten?
                  </button>
                </p>
              )}
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
      </div>
    </div>
  )
}
