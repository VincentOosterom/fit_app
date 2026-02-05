import { useState } from 'react'
import { Outlet, NavLink, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useSubscription } from '../hooks/useSubscription'
import { hasFeature } from '../lib/planFeatures'
import { hasCoachFeature } from '../lib/coachSubscription'
import {
  IconDashboard,
  IconInput,
  IconVoeding,
  IconTraining,
  IconPlan,
  IconSettings,
  IconUsers,
  IconRapportage,
  IconTemplates,
  IconCalendar,
  IconCheckins,
  IconAnalytics,
} from './SidebarIcons'
import styles from './Layout.module.css'

function NavItem({ to, end, icon: Icon, children, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
    >
      <span className={styles.navIcon} aria-hidden><Icon /></span>
      <span>{children}</span>
    </NavLink>
  )
}

function HamburgerIcon({ open }) {
  return (
    <span className={styles.hamburger} aria-hidden>
      <span className={open ? styles.hamLineOpen1 : styles.hamLine} />
      <span className={open ? styles.hamLineOpen2 : styles.hamLine} />
      <span className={open ? styles.hamLineOpen3 : styles.hamLine} />
    </span>
  )
}

export default function Layout() {
  const { user, signOut } = useAuth()
  const { profile, loading, isBlocked, isAdmin, isCoach, coachSubscription } = useProfile()
  const { planType } = useSubscription()
  const coachTier = isCoach ? (coachSubscription ?? 'starter') : null
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const canUseEvents = hasFeature(planType, 'event_programs')

  const closeSidebar = () => setSidebarOpen(false)

  if (loading) return <div className="loading">Laden…</div>
  if (!user) return <Navigate to="/login" replace />
  if (profile && isBlocked) return <Navigate to="/login?blocked=1" replace />

  const showCoachNav = isCoach && !isAdmin

  const navContent = (
    <>
      {isAdmin ? (
        <>
          <NavItem to="/dashboard/admin/accounts" end icon={IconUsers} onNavigate={closeSidebar}>Klanten</NavItem>
          <NavItem to="/dashboard/admin/coaches" icon={IconUsers} onNavigate={closeSidebar}>Coaches</NavItem>
          <NavItem to="/dashboard/admin/reporting" icon={IconRapportage} onNavigate={closeSidebar}>Rapportage</NavItem>
          <NavItem to="/dashboard/admin/voeding" icon={IconVoeding} onNavigate={closeSidebar}>Voeding</NavItem>
          <NavItem to="/dashboard/admin/plan-prices" icon={IconPlan} onNavigate={closeSidebar}>Planprijzen</NavItem>
          <NavItem to="/dashboard/admin/medewerkers" icon={IconUsers} onNavigate={closeSidebar}>Medewerkers</NavItem>
          <NavItem to="/dashboard/admin/settings" icon={IconSettings} onNavigate={closeSidebar}>Instellingen</NavItem>
        </>
      ) : showCoachNav ? (
        <>
          <NavItem to="/dashboard/coach" end icon={IconDashboard} onNavigate={closeSidebar}>Dashboard</NavItem>
          <NavItem to="/dashboard/coach/klanten" icon={IconUsers} onNavigate={closeSidebar}>Klanten</NavItem>
          <NavItem to="/dashboard/coach/templates" icon={IconTemplates} onNavigate={closeSidebar}>Schema templates</NavItem>
          {hasCoachFeature(coachTier, 'event_trainingsprogrammas') && <NavItem to="/dashboard/coach/events" icon={IconCalendar} onNavigate={closeSidebar}>Event planning</NavItem>}
          <NavItem to="/dashboard/coach/checkins" icon={IconCheckins} onNavigate={closeSidebar}>Check-ins</NavItem>
          {hasCoachFeature(coachTier, 'analytics') && <NavItem to="/dashboard/coach/analytics" icon={IconAnalytics} onNavigate={closeSidebar}>Analytics</NavItem>}
          <NavItem to="/dashboard/coach/plannen" icon={IconPlan} onNavigate={closeSidebar}>Plannen</NavItem>
          <NavItem to="/dashboard/coach/instellingen" icon={IconSettings} onNavigate={closeSidebar}>Instellingen</NavItem>
        </>
      ) : (
        <>
          <NavItem to="/dashboard" end icon={IconDashboard} onNavigate={closeSidebar}>Dashboard</NavItem>
          <NavItem to="input" icon={IconInput} onNavigate={closeSidebar}>Mijn input</NavItem>
          <NavItem to="voeding" icon={IconVoeding} onNavigate={closeSidebar}>Voeding</NavItem>
          <NavItem to="training" icon={IconTraining} onNavigate={closeSidebar}>Training</NavItem>
          <NavItem to="plan" icon={IconPlan} onNavigate={closeSidebar}>Plan</NavItem>
          {canUseEvents && <NavItem to="event" icon={IconCalendar} onNavigate={closeSidebar}>Event</NavItem>}
          <NavItem to="settings" icon={IconSettings} onNavigate={closeSidebar}>Instellingen</NavItem>
        </>
      )}
    </>
  )

  return (
    <div className={styles.layout}>
      <header className={styles.mobileHeader} aria-label="Menu">
        <NavLink to="/dashboard" className={styles.mobileLogo} onClick={closeSidebar}>TrainLogic</NavLink>
        <button
          type="button"
          onClick={() => setSidebarOpen((o) => !o)}
          className={styles.menuToggle}
          aria-expanded={sidebarOpen}
          aria-controls="sidebar-nav"
          aria-label={sidebarOpen ? 'Menu sluiten' : 'Menu openen'}
        >
          <HamburgerIcon open={sidebarOpen} />
        </button>
      </header>

      <div className={styles.sidebarBackdrop} aria-hidden="true" data-open={sidebarOpen} onClick={closeSidebar} />

      <aside className={styles.sidebar} id="sidebar-nav" data-open={sidebarOpen}>
        <div className={styles.sidebarHeader}>
          <NavLink to="/dashboard" className={styles.logo} onClick={closeSidebar}>TrainLogic</NavLink>
        </div>
        <nav className={styles.nav}>
          {navContent}
        </nav>
        <div className={styles.sidebarFooter}>
          <div title={user?.email} className={styles.sidebarEmail}>{user?.email}</div>
          <button type="button" onClick={() => { closeSidebar(); signOut(); }} className={styles.logout}>Uitloggen</button>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
