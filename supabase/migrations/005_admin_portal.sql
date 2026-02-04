-- Adminportaal: profiles uitbreiden, subscriptions, payments, instellingen, RLS voor admin
-- Na uitvoeren: eerste admin aanmaken in SQL Editor:
--   update public.profiles set role = 'admin' where email = 'jouw@email.com';

-- Profiles: email (sync van auth), blokkeren, soft delete
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists is_blocked boolean default false;
alter table public.profiles add column if not exists deleted_at timestamptz;

-- Abonnementen: actief ja/nee per account
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  status text not null default 'active' check (status in ('active', 'cancelled', 'past_due', 'trialing', 'incomplete')),
  amount_cents int default 999,
  interval text default 'month',
  current_period_start timestamptz,
  current_period_end timestamptz,
  external_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Betalingen: voor omzetrapportage
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_cents int not null,
  paid_at timestamptz default now(),
  description text,
  external_id text,
  created_at timestamptz default now()
);

-- Instellingen (key-value voor admin)
create table if not exists public.admin_settings (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

-- RLS
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.admin_settings enable row level security;

-- Gebruiker: eigen subscription en payments
create policy "Users can read own subscription"
  on public.subscriptions for select using (auth.uid() = user_id);
create policy "Admins can read all subscriptions"
  on public.subscriptions for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can update subscriptions"
  on public.subscriptions for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Users can read own payments"
  on public.payments for select using (auth.uid() = user_id);
create policy "Admins can read all payments"
  on public.payments for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can insert payments"
  on public.payments for insert with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can read admin_settings"
  on public.admin_settings for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can manage admin_settings"
  on public.admin_settings for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Admin mag alle profiles lezen en updaten (blokkeren, email zichtbaar)
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Admins can read all profiles"
  on public.profiles for select using (exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role = 'admin'));

create policy "Admins can update any profile"
  on public.profiles for update using (exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role = 'admin'));

-- Admin mag client_input, nutrition_plans, training_plans van iedereen lezen (voor accountdetail)
create policy "Admins can read all client_input"
  on public.client_input for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can read all nutrition_plans"
  on public.nutrition_plans for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can read all training_plans"
  on public.training_plans for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Admin mag week_reviews lezen voor rapportage
create policy "Admins can read all week_reviews"
  on public.week_reviews for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Trigger: bij signup email meenemen in profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$ language plpgsql security definer;
