import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Voor coach: laad en bewaar client_input voor een specifieke klant (clientId).
 * RLS zorgt dat alleen coaches toegang hebben tot eigen klanten.
 */
export function useClientInputFor(clientId) {
  const [input, setInput] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    setError(null)
    const { data, error: e } = await supabase
      .from('client_input')
      .select('*')
      .eq('user_id', clientId)
      .maybeSingle()
    setInput(data ?? null)
    setError(e?.message ?? null)
    setLoading(false)
  }, [clientId])

  useEffect(() => {
    if (!clientId) {
      setInput(null)
      setLoading(false)
      return
    }
    refetch()
  }, [clientId, refetch])

  const saveInput = async (payload) => {
    if (!clientId) throw new Error('Geen klant geselecteerd')
    setError(null)
    const row = { user_id: clientId, ...payload, updated_at: new Date().toISOString() }
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

  return { input, loading, error, saveInput, refetch }
}
