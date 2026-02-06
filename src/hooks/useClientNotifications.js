import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Voor klant: coach-berichten (feedback) en eigen meldingen naar coach.
 */
export function useClientNotifications(userId, coachId) {
  const [messages, setMessages] = useState([])
  const [sentNotifications, setSentNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (!userId) {
      setMessages([])
      setSentNotifications([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const queries = [supabase.from('coach_messages').select('*').eq('client_id', userId).order('created_at', { ascending: false }).limit(20)]
    if (coachId) {
      queries.push(supabase.from('client_notifications').select('*').eq('client_id', userId).eq('coach_id', coachId).order('created_at', { ascending: false }).limit(20))
    }
    const results = await Promise.all(queries)
    setMessages(results[0].data ?? [])
    setSentNotifications(results[1]?.data ?? [])
    if (results[0].error) setError(results[0].error.message)
    setLoading(false)
  }, [userId, coachId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { messages, sentNotifications, loading, error, refetch }
}
