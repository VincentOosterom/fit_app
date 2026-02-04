import { useProfile } from '../hooks/useProfile'
import { useMaintenanceMode } from '../hooks/useMaintenanceMode'

export default function MaintenanceGate({ children }) {
  const { maintenance, loading } = useMaintenanceMode()
  const { isAdmin, loading: profileLoading } = useProfile()

  if (loading || profileLoading) return <div className="loading">Laden…</div>
  if (maintenance && !isAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        background: 'var(--bg, #1a1a1a)',
        color: 'var(--text, #fff)',
      }}>
        <h1 style={{ marginBottom: '1rem' }}>Onderhoudsmodus</h1>
        <p style={{ maxWidth: '400px', color: 'var(--text-soft, #b0b0b0)' }}>
          De app is tijdelijk niet beschikbaar. We zijn bezig met onderhoud. Probeer het later opnieuw.
        </p>
      </div>
    )
  }
  return children
}
