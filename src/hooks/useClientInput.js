import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useClientInput() {
  const { user } = useAuth()
  const [input, setInput] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchInput() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: e } = await supabase
          .from('client_input')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!cancelled) {
          if (e) setError(e.message)
          else setInput(data)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchInput()
    return () => { cancelled = true }
  }, [user?.id])

  const saveInput = async (payload) => {
    if (!user?.id) throw new Error('Niet ingelogd')
    setError(null)
    const row = {
      user_id: user.id,
      ...payload,
      updated_at: new Date().toISOString(),
    }
    const { data, error: e } = await supabase
      .from('client_input')
      .upsert(row, { onConflict: 'user_id', ignoreDuplicates: false })
      .select()
      .single()

    if (e) {
      setError(e.message)
      throw e
    }
    setInput(data)
    return data
  }

  return { input, loading, error, saveInput }
}
