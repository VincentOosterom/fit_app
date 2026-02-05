-- Voedingsbibliotheek (admin beheert gerechten) + coach_id op profiles + coach prijzen

-- 1. Food library: gerechten met grammen, kcal, macro's
create table if not exists public.food_library (
  id uuid primary key default gen_random_uuid(),
  meal_slot text not null check (meal_slot in ('ontbijt', 'lunch', 'avond', 'snack')),
  energy_level text not null check (energy_level in ('laag', 'medium', 'hoog')),
  name text not null,
  grams int,
  kcal int not null,
  protein int not null default 0,
  carbs int not null default 0,
  fat int not null default 0,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_food_library_slot_level on public.food_library(meal_slot, energy_level);
alter table public.food_library enable row level security;

drop policy if exists "Authenticated can read food_library" on public.food_library;
create policy "Authenticated can read food_library"
  on public.food_library for select using (auth.role() = 'authenticated');
drop policy if exists "Admins can manage food_library" on public.food_library;
create policy "Admins can manage food_library"
  on public.food_library for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or exists (select 1 from public.admin_user_ids a where a.user_id = auth.uid())
  );

-- 2. Profiles: coach_id voor koppeling klant → coach
alter table public.profiles add column if not exists coach_id uuid references auth.users(id) on delete set null;
create index if not exists idx_profiles_coach_id on public.profiles(coach_id);

-- 3. Coach invitations (voor coach-add-client flow)
create table if not exists public.coach_invitations (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz default now()
);
alter table public.coach_invitations enable row level security;
drop policy if exists "Coaches can manage own invitations" on public.coach_invitations;
create policy "Coaches can manage own invitations"
  on public.coach_invitations for all using (auth.uid() = coach_id);
drop policy if exists "Admins can read coach_invitations" on public.coach_invitations;
create policy "Admins can read coach_invitations"
  on public.coach_invitations for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or exists (select 1 from public.admin_user_ids a where a.user_id = auth.uid())
  );

-- 4. Coach plan prijzen (admin kan andere prijzen voor coaches zetten)
-- Gebruik admin_settings: coach_price_starter_cents, coach_price_pro_cents, coach_price_premium_cents
-- get_plan_prices blijft voor klanten; we voegen get_coach_plan_prices toe
create or replace function public.get_coach_plan_prices()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  starter int;
  pro int;
  premium int;
begin
  select coalesce((select (value#>>'{}')::int from admin_settings where key = 'coach_price_starter_cents'), 595) into starter;
  select coalesce((select (value#>>'{}')::int from admin_settings where key = 'coach_price_pro_cents'), 799) into pro;
  select coalesce((select (value#>>'{}')::int from admin_settings where key = 'coach_price_premium_cents'), 1195) into premium;
  return jsonb_build_object('starter', starter, 'pro', pro, 'premium', premium);
end;
$$;
grant execute on function public.get_coach_plan_prices() to authenticated;

-- 5. Coach koppelt bestaande klant aan zichzelf (op e-mail)
create or replace function public.coach_link_by_email(target_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  coach_user_id uuid;
  target_id uuid;
begin
  coach_user_id := auth.uid();
  if coach_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'Niet ingelogd');
  end if;
  if not exists (select 1 from public.profiles where id = coach_user_id and role = 'coach') then
    return jsonb_build_object('ok', false, 'error', 'Alleen coaches kunnen klanten koppelen');
  end if;
  select id into target_id from public.profiles where lower(trim(email)) = lower(trim(target_email)) limit 1;
  if target_id is null then
    return jsonb_build_object('ok', false, 'error', 'Geen account gevonden met dit e-mailadres');
  end if;
  if target_id = coach_user_id then
    return jsonb_build_object('ok', false, 'error', 'Je kunt jezelf niet koppelen');
  end if;
  update public.profiles set coach_id = coach_user_id, updated_at = now() where id = target_id;
  return jsonb_build_object('ok', true);
end;
$$;
grant execute on function public.coach_link_by_email(text) to authenticated;

comment on table public.food_library is 'Admin-beheerde gerechten; klanten zien deze bij voeding als ze doorklikken';
