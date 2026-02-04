-- Plan type (starter/pro/premium), gebruiker kan eigen plan kiezen, overrides voor maaltijden/oefeningen
-- GEEN data of tabellen worden verwijderd; alleen een RLS-policy wordt vervangen.

-- Subscription: plan_type + gebruiker mag eigen subscription updaten (plan kiezen)
alter table public.subscriptions
  add column if not exists plan_type text default 'starter'
  check (plan_type in ('starter', 'pro', 'premium'));

-- Bedragen koppelen aan plan (795, 999, 1495)
comment on column public.subscriptions.plan_type is 'starter=7.95, pro=9.99, premium=14.95';

-- Vervang eventuele bestaande policy zodat gebruikers hun plan kunnen wijzigen
drop policy if exists "Users can update own subscription" on public.subscriptions;
create policy "Users can update own subscription"
  on public.subscriptions for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can insert own subscription (e.g. first plan choice after signup)
create policy "Users can insert own subscription"
  on public.subscriptions for insert with check (auth.uid() = user_id);

-- Voorkeuren maaltijden: per plan, per week, per slot welk alternatief (0, 1, 2)
create table if not exists public.meal_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nutrition_plan_id uuid not null references public.nutrition_plans(id) on delete cascade,
  week_number int not null check (week_number >= 1 and week_number <= 4),
  meal_slot text not null check (meal_slot in ('ontbijt', 'lunch', 'avond', 'snack1', 'snack2')),
  option_index int not null default 0 check (option_index >= 0 and option_index <= 2),
  created_at timestamptz default now(),
  unique(user_id, nutrition_plan_id, week_number, meal_slot)
);

alter table public.meal_overrides enable row level security;
create policy "Users can manage own meal_overrides"
  on public.meal_overrides for all using (auth.uid() = user_id);

-- Voorkeuren oefeningen: per plan, per week, per sessie, per oefening welk alternatief
create table if not exists public.exercise_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  training_plan_id uuid not null references public.training_plans(id) on delete cascade,
  week_number int not null check (week_number >= 1 and week_number <= 4),
  session_index int not null check (session_index >= 0),
  exercise_index int not null check (exercise_index >= 0),
  option_index int not null default 0 check (option_index >= 0),
  created_at timestamptz default now(),
  unique(user_id, training_plan_id, week_number, session_index, exercise_index)
);

alter table public.exercise_overrides enable row level security;
create policy "Users can manage own exercise_overrides"
  on public.exercise_overrides for all using (auth.uid() = user_id);

-- Index voor snelle lookups
create index if not exists idx_meal_overrides_plan_week on public.meal_overrides(nutrition_plan_id, week_number);
create index if not exists idx_exercise_overrides_plan_week on public.exercise_overrides(training_plan_id, week_number);
