import { useContext } from 'react'
import { ProfileContext } from '../context/ProfileContext'

/** Gebruik het gedeelde profiel uit ProfileProvider (dashboard). Zo zien Layout en AdminLayout dezelfde isAdmin. */
export function useProfile() {
  const context = useContext(ProfileContext)
  if (context) return context
  return { profile: null, loading: false, isAdmin: false, isCoach: false, clients: [], isBlocked: false }
}
