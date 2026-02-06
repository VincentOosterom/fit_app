import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const HOW_WENT_SCORE = { goed: 1, redelijk: 0.5, slecht: 0 }

/**
 * Voor coach: per klant adherence (uit week_reviews), laatste activiteit, risico (groen/oranje/rood).
 */
export function useClientStatusList(clientIds) {
  const [statusByClient, setStatusByClient] = useState({})
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!Array.isArray(clientIds) || clientIds.length === 0) {
      setStatusByClient({})
      setLoading(false)
      return
    }
    setLoading(true)
    const { data: reviews } = await supabase
      .from('week_reviews')
      .select('user_id, week_number, how_went, created_at')
      .in('user_id', clientIds)
      .order('created_at', { ascending: false })

    const byClient = {}
    clientIds.forEach((id) => {
      byClient[id] = {
        adherence: null,
        lastActivity: null,
        risk: 'green',
        reviewCount: 0,
      }
    })
    const now = Date.now()
    const oneWeek = 7 * 24 * 60 * 60 * 1000
    const twoWeeks = 2 * oneWeek

    ;(reviews ?? []).forEach((r) => {
      const cur = byClient[r.user_id]
      if (!cur) return
      if (!cur.lastActivity || new Date(r.created_at) > new Date(cur.lastActivity)) {
        cur.lastActivity = r.created_at
      }
      cur.reviewCount = (cur.reviewCount || 0) + 1
    })

    // Adherence: gemiddelde van how_went over laatste reviews (max 4 weken)
    const recentByUser = {}
    ;(reviews ?? []).forEach((r) => {
      if (!recentByUser[r.user_id]) recentByUser[r.user_id] = []
      if (recentByUser[r.user_id].length < 4) recentByUser[r.user_id].push(r.how_went)
    })
    Object.keys(byClient).forEach((id) => {
      const rec = recentByUser[id]
      if (rec?.length) {
        const sum = rec.reduce((s, h) => s + (HOW_WENT_SCORE[h] ?? 0), 0)
        byClient[id].adherence = Math.round((sum / rec.length) * 100)
      }
      const last = byClient[id].lastActivity
      if (last) {
        const ago = now - new Date(last).getTime()
        if (ago > twoWeeks || (byClient[id].adherence !== null && byClient[id].adherence < 40)) {
          byClient[id].risk = 'red'
        } else if (ago > oneWeek || (byClient[id].adherence !== null && byClient[id].adherence < 70)) {
          byClient[id].risk = 'orange'
        }
      } else {
        byClient[id].risk = 'orange'
      }
    })

    setStatusByClient(byClient)
    setLoading(false)
  }, [clientIds?.join(',')])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { statusByClient, loading, refetch }
}
