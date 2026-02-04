import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

export const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const [isAdminFromList, setIsAdminFromList] = useState(false)

  useEffect(() => {
    if (!user?.id) {
      setProfile(null)
      setIsAdminFromList(false)
      setLoading(false)
      return
    }
    let cancelled = false
    async function fetchProfile() {
      const [profileRes, adminRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('admin_user_ids').select('user_id').eq('user_id', user.id).maybeSingle(),
      ])
      if (!cancelled) {
        const data = profileRes.data ?? null
        setProfile(data)
        setIsAdminFromList(!!adminRes.data)
        if (data && !data.email && user.email) {
          supabase.from('profiles').update({ email: user.email, updated_at: new Date().toISOString() }).eq('id', user.id).then(() => {
            if (!cancelled) setProfile((p) => (p ? { ...p, email: user.email } : p))
          })
        }
      }
      setLoading(false)
    }
    fetchProfile()
    return () => { cancelled = true }
  }, [user?.id, user?.email])

  const isAdmin = isAdminFromList || profile?.role === 'admin'
  const isBlocked = profile?.is_blocked === true

  const value = { profile, loading, isAdmin, isBlocked }
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfileContext() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfileContext must be used inside ProfileProvider')
  return ctx
}
