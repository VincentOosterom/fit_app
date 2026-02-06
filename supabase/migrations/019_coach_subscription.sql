  -- Coach abonnementsstructuur: starter, pro, premium met limits en role-based features

  -- Subscription tier voor coaches (alleen relevant als role = 'coach')
  alter table public.profiles
    add column if not exists coach_subscription text
    default 'starter'
    check (coach_subscription is null or coach_subscription in ('starter', 'pro', 'premium'));

  comment on column public.profiles.coach_subscription is 'Coach abonnement: starter (10 klanten), pro (50), premium (onbeperkt). Alleen van toepassing bij role=coach.';
