import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

export const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState([])
  const [coachProfile, setCoachProfile] = useState(null)
  const [isAdminFromList, setIsAdminFromList] = useState(false)

  const refetch = useCallback(async () => {
    if (!user?.id) return
    const [profileRes, adminRes, clientsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('admin_user_ids').select('user_id').eq('user_id', user.id).maybeSingle(),
      supabase.from('profiles').select('*').eq('coach_id', user.id).order('full_name'),
    ])
    const profileData = profileRes.data ?? null
    setProfile(profileData)
    setIsAdminFromList(!!adminRes.data)
    setClients(clientsRes.data ?? [])
    if (profileData?.coach_id) {
      const { data: coach } = await supabase.from('profiles').select('*').eq('id', profileData.coach_id).maybeSingle()
      setCoachProfile(coach ?? null)
    } else {
      setCoachProfile(null)
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) {
      setProfile(null)
      setIsAdminFromList(false)
      setClients([])
      setCoachProfile(null)
      setLoading(false)
      return
    }
    let cancelled = false
    async function fetchProfile() {
      const [profileRes, adminRes, clientsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('admin_user_ids').select('user_id').eq('user_id', user.id).maybeSingle(),
        supabase.from('profiles').select('*').eq('coach_id', user.id).order('full_name'),
      ])
      if (!cancelled) {
        const data = profileRes.data ?? null
        setProfile(data)
        setIsAdminFromList(!!adminRes.data)
        setClients(clientsRes.data ?? [])
        if (data?.coach_id) {
          const { data: coach } = await supabase.from('profiles').select('*').eq('id', data.coach_id).maybeSingle()
          if (!cancelled) setCoachProfile(coach ?? null)
        } else {
          setCoachProfile(null)
        }
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
  const isCoach = profile?.role === 'coach' || (Array.isArray(clients) && clients.length > 0)
  const isBlocked = profile?.is_blocked === true
  const coachId = profile?.coach_id ?? null
  const coachSubscription = profile?.role === 'coach' ? (profile?.coach_subscription ?? 'starter') : null

  const value = { profile, loading, isAdmin, isCoach, coachId, coachProfile, clients, isBlocked, coachSubscription, refetch }
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfileContext() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfileContext must be used inside ProfileProvider')
  return ctx
}
