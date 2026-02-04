-- Sport webapp: basis tabellen voor klantinput, voedings- en trainingsschema's.
-- Voer uit in Supabase SQL Editor of via Supabase CLI.

-- Profiel (uitbreiding auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text default 'client' check (role in ('client', 'coach', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Klantinput: één rij per gebruiker (laatste overschrijft)
create table if not exists public.client_input (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  goal text check (goal in ('afvallen', 'spieropbouw', 'conditie', 'onderhoud')),
  level text check (level in ('beginner', 'gevorderd', 'expert')),
  days_per_week int default 3,
  wants_nutrition boolean default true,
  wants_training boolean default true,
  dietary_prefs text,
  restrictions text,
  weight_kg numeric,
  height_cm numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Gegenereerde voedingsschema's (JSON plan)
create table if not exists public.nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan jsonb not null default '{}',
  created_at timestamptz default now()
);

-- Gegenereerde trainingsschema's (JSON plan)
create table if not exists public.training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan jsonb not null default '{}',
  created_at timestamptz default now()
);

-- RLS: gebruikers zien alleen eigen data
alter table public.profiles enable row level security;
alter table public.client_input enable row level security;
alter table public.nutrition_plans enable row level security;
alter table public.training_plans enable row level security;

create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can manage own client_input"
  on public.client_input for all using (auth.uid() = user_id);

create policy "Users can manage own nutrition_plans"
  on public.nutrition_plans for all using (auth.uid() = user_id);

create policy "Users can manage own training_plans"
  on public.training_plans for all using (auth.uid() = user_id);

-- Trigger: bij signup een profiel aanmaken
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
