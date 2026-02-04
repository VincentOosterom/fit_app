import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function usePlans() {
  const { user } = useAuth()
  const [trainingPlan, setTrainingPlan] = useState(null)
  const [nutritionPlan, setNutritionPlan] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    let cancelled = false
    async function load() {
      const [tRes, nRes, rRes] = await Promise.all([
        supabase.from('training_plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('nutrition_plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('week_reviews').select('*').eq('user_id', user.id).order('week_number'),
      ])
      if (!cancelled) {
        setTrainingPlan(tRes.data ?? null)
        setNutritionPlan(nRes.data ?? null)
        setReviews(rRes.data ?? [])
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [user?.id])

  const hasAnyPlan = !!(trainingPlan || nutritionPlan)
  const blockId = trainingPlan?.block_id || nutritionPlan?.block_id
  const blockReviews = blockId ? reviews.filter((r) => r.block_id === blockId) : []
  const week4Review = blockReviews.find((r) => r.week_number === 4)
  const canGenerateAgain = week4Review?.wants_follow_up === true
  const showGenerate = !hasAnyPlan || canGenerateAgain

  const refetch = async () => {
    if (!user?.id) return
    const [tRes, nRes, rRes] = await Promise.all([
      supabase.from('training_plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('nutrition_plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('week_reviews').select('*').eq('user_id', user.id).order('week_number'),
    ])
    setTrainingPlan(tRes.data ?? null)
    setNutritionPlan(nRes.data ?? null)
    setReviews(rRes.data ?? [])
  }

  return {
    trainingPlan,
    nutritionPlan,
    reviews,
    loading,
    hasAnyPlan,
    blockId,
    week4Review,
    showGenerate,
    refetch,
  }
}
