import { Outlet, Navigate } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../context/AuthContext'

export default function AdminLayout() {
  const { user } = useAuth()
  const { loading, isAdmin } = useProfile()

  if (loading) return <div className="loading">Laden…</div>
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
