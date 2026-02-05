import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useEvents() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    let cancelled = false
    supabase
      .from('user_events')
      .select('*')
      .eq('user_id', user.id)
      .order('event_date', { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setEvents(data ?? [])
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [user?.id])

  const addEvent = async (payload) => {
    if (!user?.id) throw new Error('Niet ingelogd')
    const row = { user_id: user.id, ...payload, updated_at: new Date().toISOString() }
    const { data, error } = await supabase.from('user_events').insert(row).select().single()
    if (error) throw error
    setEvents((prev) => [...prev, data].sort((a, b) => new Date(a.event_date) - new Date(b.event_date)))
    return data
  }

  const updateEvent = async (id, payload) => {
    if (!user?.id) return
    const { data, error } = await supabase.from('user_events').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select().single()
    if (error) throw error
    if (data) setEvents((prev) => prev.map((e) => (e.id === id ? data : e)))
    return data
  }

  const deleteEvent = async (id) => {
    if (!user?.id) return
    await supabase.from('user_events').delete().eq('id', id).eq('user_id', user.id)
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  return { events, loading, addEvent, updateEvent, deleteEvent }
}
