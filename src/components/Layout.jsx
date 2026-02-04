import { useEffect } from 'react'
import { Outlet, NavLink, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import styles from './Layout.module.css'

export default function Layout() {
  const { user, signOut } = useAuth()
  const { profile, loading: profileLoading, isBlocked, isAdmin } = useProfile()

  useEffect(() => {
    if (profileLoading || !profile) return
    if (isBlocked) {
      signOut()
    }
  }, [profileLoading, profile, isBlocked, signOut])

  if (profile && isBlocked) {
    return <Navigate to="/login?blocked=1" replace />
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <NavLink to="/dashboard" className={styles.logo}>TrainLogic</NavLink>
        </div>
        <nav className={styles.nav}>
          {isAdmin ? (
            <>
              <NavLink to="/dashboard/admin/accounts" end className={({ isActive }) => (isActive ? styles.active : '')}>
                Klanten
              </NavLink>
              <NavLink to="/dashboard/admin/reporting" className={({ isActive }) => (isActive ? styles.active : '')}>
                Rapportage
              </NavLink>
              <NavLink to="/dashboard/admin/medewerkers" className={({ isActive }) => (isActive ? styles.active : '')}>
                Medewerkers
              </NavLink>
              <NavLink to="/dashboard/admin/settings" className={({ isActive }) => (isActive ? styles.active : '')}>
                App-instellingen
              </NavLink>
              <NavLink to="/dashboard/admin/meals" className={({ isActive }) => (isActive ? styles.active : '')}>
                Maaltijden
              </NavLink>
              <NavLink to="/dashboard/admin/training-types" className={({ isActive }) => (isActive ? styles.active : '')}>
                Trainingen
              </NavLink>
              <NavLink to="/dashboard/admin/plan-prices" className={({ isActive }) => (isActive ? styles.active : '')}>
                Planprijzen
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/dashboard" end className={({ isActive }) => (isActive ? styles.active : '')}>
                Dashboard
              </NavLink>
              <NavLink to="input" className={({ isActive }) => (isActive ? styles.active : '')}>
                Mijn input
              </NavLink>
              <NavLink to="voeding" className={({ isActive }) => (isActive ? styles.active : '')}>
                Voeding
              </NavLink>
              <NavLink to="training" className={({ isActive }) => (isActive ? styles.active : '')}>
                Training
              </NavLink>
              <NavLink to="plan" className={({ isActive }) => (isActive ? styles.active : '')}>
                Plan & factuur
              </NavLink>
              <NavLink to="settings" className={({ isActive }) => (isActive ? styles.active : '')}>
                Instellingen
              </NavLink>
            </>
          )}
        </nav>
        <div className={styles.sidebarFooter}>
          <span className={styles.userEmail} title={user?.email}>{user?.email}</span>
          <button type="button" onClick={() => signOut()} className={styles.logout}>
            Uitloggen
          </button>
        </div>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
