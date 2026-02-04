import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './LandingHeader.module.css'

export default function LandingHeader() {
  const { user } = useAuth()

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          TrainLogic
        </Link>
        <nav className={styles.nav}>
          <a href="#hoe-werkt-het">Hoe het werkt</a>
          <a href="#berekening">Berekening</a>
          <a href="#voeding">Voeding</a>
          <a href="#training">Training</a>
          <a href="#tarieven">Prijzen</a>
          {user ? (
            <Link to="/dashboard" className={styles.cta}>
              Mijn account
            </Link>
          ) : (
            <>
              <Link to="/login" className={styles.link}>Inloggen</Link>
              <Link to="/login?register=1" className={styles.cta}>Registeren</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
