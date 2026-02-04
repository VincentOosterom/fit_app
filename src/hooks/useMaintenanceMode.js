import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useMaintenanceMode() {
  const [maintenance, setMaintenance] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    supabase.rpc('get_maintenance_mode').then(({ data }) => {
      if (!cancelled) {
        setMaintenance(data === true)
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  return { maintenance, loading }
}
