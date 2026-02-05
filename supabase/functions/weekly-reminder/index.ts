// Edge Function: stuur "Vergeet je niet" e-mail als de week bijna afgelopen is
// en de klant nog geen weekevaluatie heeft ingevuld.
// Zet in cron (bijv. dagelijks): supabase functions invoke weekly-reminder
// Vereist: RESEND_API_KEY, FROM_EMAIL (env in Supabase Dashboard), tabel reminder_sent (migratie 013)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const MS_PER_DAY = 24 * 60 * 60 * 1000
const DAYS_PER_WEEK = 7

function getCurrentWeek(planCreatedAt: string): number {
  const start = new Date(planCreatedAt).getTime()
  const now = Date.now()
  const daysSinceStart = (now - start) / MS_PER_DAY
  if (daysSinceStart < 0) return 1
  const week = Math.floor(daysSinceStart / DAYS_PER_WEEK) + 1
  return Math.min(4, Math.max(1, week))
}

function isInLastTwoDaysOfWeek(planCreatedAt: string, weekNumber: number): boolean {
  const start = new Date(planCreatedAt).getTime()
  const weekEnd = start + weekNumber * DAYS_PER_WEEK * MS_PER_DAY
  const twoDaysBeforeEnd = weekEnd - 2 * MS_PER_DAY
  const now = Date.now()
  return now >= twoDaysBeforeEnd && now <= weekEnd + MS_PER_DAY
}

Deno.serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )
    const resendKey = Deno.env.get("RESEND_API_KEY")
    const fromEmail = Deno.env.get("FROM_EMAIL") ?? "TrainLogic <onboarding@resend.dev>"
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), { status: 500 })
    }

    const { data: plans } = await supabase
      .from("nutrition_plans")
      .select("id, user_id, block_id, created_at")
      .order("created_at", { ascending: false })

    if (!plans?.length) {
      return new Response(JSON.stringify({ sent: 0, message: "No plans" }), { status: 200, headers: { "Content-Type": "application/json" } })
    }

    const latestByUser = new Map<string, (typeof plans)[0]>()
    for (const p of plans) {
      if (!latestByUser.has(p.user_id)) latestByUser.set(p.user_id, p)
    }

    let sent = 0
    for (const plan of latestByUser.values()) {
      const weekNum = getCurrentWeek(plan.created_at)
      if (!isInLastTwoDaysOfWeek(plan.created_at, weekNum)) continue

      const [{ data: profile }, { data: reviews }, { data: alreadySent }] = await Promise.all([
        supabase.from("profiles").select("email").eq("id", plan.user_id).single(),
        supabase.from("week_reviews").select("week_number").eq("block_id", plan.block_id).eq("user_id", plan.user_id),
        supabase.from("reminder_sent").select("id").eq("user_id", plan.user_id).eq("block_id", plan.block_id).eq("week_number", weekNum).maybeSingle(),
      ])
      const email = profile?.email ?? null
      const hasReview = (reviews ?? []).some((r: { week_number: number }) => r.week_number === weekNum)
      if (!email || hasReview || alreadySent) continue

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: "Vergeet je niet — zo helpen wij jou",
          text: `Hoi,\n\nDeze week van je schema loopt bijna af. Vul je weekevaluatie in zodat we je goed kunnen blijven helpen en je schema laten aansluiten.\n\nLog in op je account en ga naar Voeding of Training → week ${weekNum} om je evaluatie in te vullen.\n\nGroet,\nTrainLogic`,
        }),
      })
      if (res.ok) {
        await supabase.from("reminder_sent").insert({
          user_id: plan.user_id,
          block_id: plan.block_id,
          week_number: weekNum,
        })
        sent++
      }
    }

    return new Response(JSON.stringify({ sent }), { status: 200, headers: { "Content-Type": "application/json" } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "Content-Type": "application/json" } })
  }
})
