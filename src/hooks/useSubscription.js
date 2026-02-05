import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { PLAN_AMOUNTS, PLAN_NAMES } from '../lib/planFeatures'

export function useSubscription() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [planPrices, setPlanPrices] = useState(PLAN_AMOUNTS)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    let cancelled = false
    async function load() {
      const [subRes, payRes, pricesRes] = await Promise.all([
        supabase.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('payments').select('*').eq('user_id', user.id).order('paid_at', { ascending: false }).limit(10),
        supabase.rpc('get_plan_prices').then(({ data }) => data).catch(() => null),
      ])
      if (!cancelled) {
        setSubscription(subRes.data ?? null)
        setPayments(payRes.data ?? [])
        if (pricesRes && typeof pricesRes === 'object') {
          setPlanPrices((p) => ({ ...p, ...pricesRes }))
        }
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [user?.id])

  const planType = subscription?.plan_type || 'starter'
  const amountCents = subscription?.amount_cents ?? planPrices[planType] ?? PLAN_AMOUNTS.starter
  const nextBillingDate = subscription?.current_period_end
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'
  const restartCount = subscription?.restart_count ?? 0

  const setPlan = async (newPlanType) => {
    if (!user?.id) return { error: 'Niet ingelogd' }
    const amount = planPrices[newPlanType] ?? PLAN_AMOUNTS[newPlanType] ?? PLAN_AMOUNTS.starter
    if (subscription?.id) {
      const { error } = await supabase
        .from('subscriptions')
        .update({ plan_type: newPlanType, amount_cents: amount, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
      if (error) return { error: error.message }
    } else {
      const periodStart = new Date()
      const periodEnd = new Date(periodStart)
      periodEnd.setMonth(periodEnd.getMonth() + 1)
      const { error } = await supabase.from('subscriptions').insert({
        user_id: user.id,
        status: 'active',
        plan_type: newPlanType,
        amount_cents: amount,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      if (error) return { error: error.message }
    }
    setSubscription((s) => (s ? { ...s, plan_type: newPlanType, amount_cents: amount } : null))
    return {}
  }

  const refetch = async () => {
    if (!user?.id) return
    const [subRes, payRes, pricesRes] = await Promise.all([
      supabase.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('payments').select('*').eq('user_id', user.id).order('paid_at', { ascending: false }).limit(10),
      supabase.rpc('get_plan_prices').then(({ data }) => data).catch(() => null),
    ])
    setSubscription(subRes.data ?? null)
    setPayments(payRes.data ?? [])
    if (pricesRes && typeof pricesRes === 'object') setPlanPrices((p) => ({ ...p, ...pricesRes }))
  }

  return {
    subscription,
    payments,
    loading,
    planType,
    planName: PLAN_NAMES[planType] || 'Starter',
    planPrices,
    amountCents,
    amountFormatted: `€ ${(amountCents / 100).toFixed(2).replace('.', ',')}`,
    nextBillingDate,
    isActive,
    restartCount,
    setPlan,
    refetch,
  }
}
