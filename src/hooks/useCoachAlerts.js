import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Voor coach: alerts (nieuwe klantmeldingen, optioneel missende check-ins).
 * Gebruik in CoachDashboard / AlertsPanel.
 */
export function useCoachAlerts(coachId) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (!coachId) {
      setNotifications([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: e } = await supabase
      .from('client_notifications')
      .select('id, client_id, coach_id, type, priority, body, status, created_at, read_at, replied_at')
      .eq('coach_id', coachId)
      .in('status', ['nieuw', 'gelezen'])
      .order('created_at', { ascending: false })
    if (e) {
      setError(e.message)
      setNotifications([])
    } else {
      setNotifications(data ?? [])
    }
    setLoading(false)
  }, [coachId])

  useEffect(() => {
    refetch()
  }, [refetch])

  const markRead = useCallback(async (id) => {
    const { error: e } = await supabase
      .from('client_notifications')
      .update({ status: 'gelezen', read_at: new Date().toISOString() })
      .eq('id', id)
    if (!e) refetch()
  }, [refetch])

  const markActed = useCallback(async (id) => {
    const { error: e } = await supabase
      .from('client_notifications')
      .update({ status: 'opgevolgd', replied_at: new Date().toISOString() })
      .eq('id', id)
    if (!e) refetch()
  }, [refetch])

  const newCount = (notifications ?? []).filter((n) => n.status === 'nieuw').length
  return {
    notifications,
    newCount,
    loading,
    error,
    refetch,
    markRead,
    markActed,
  }
}
