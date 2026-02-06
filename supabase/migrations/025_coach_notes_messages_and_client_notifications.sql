-- Coach-klant communicatie: notities, berichten (coach→klant), meldingen (klant→coach)
-- + RLS zodat coaches alleen eigen klanten zien

-- 1. Coach notities (intern, alleen coach ziet)
create table if not exists public.coach_notes (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references auth.users(id) on delete cascade,
  note text not null,
  created_at timestamptz default now()
);
create index if not exists idx_coach_notes_coach_client on public.coach_notes(coach_id, client_id);
alter table public.coach_notes enable row level security;
drop policy if exists "Coaches can manage own notes" on public.coach_notes;
create policy "Coaches can manage own notes"
  on public.coach_notes for all using (auth.uid() = coach_id);

-- 2. Berichten coach → klant (feedback, reacties)
create table if not exists public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);
create index if not exists idx_coach_messages_client on public.coach_messages(client_id);
create index if not exists idx_coach_messages_coach on public.coach_messages(coach_id);
alter table public.coach_messages enable row level security;
drop policy if exists "Coach can manage own messages" on public.coach_messages;
create policy "Coach can manage own messages"
  on public.coach_messages for all using (auth.uid() = coach_id);
drop policy if exists "Client can read messages from coach" on public.coach_messages;
create policy "Client can read messages from coach"
  on public.coach_messages for select using (auth.uid() = client_id);

-- 3. Meldingen klant → coach (type, prioriteit, status)
create table if not exists public.client_notifications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  coach_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'algemeen' check (type in ('training', 'voeding', 'blessure', 'algemeen')),
  priority text not null default 'normaal' check (priority in ('laag', 'normaal', 'hoog')),
  body text not null,
  status text not null default 'nieuw' check (status in ('nieuw', 'gelezen', 'opgevolgd')),
  created_at timestamptz default now(),
  read_at timestamptz,
  replied_at timestamptz
);
create index if not exists idx_client_notifications_coach on public.client_notifications(coach_id);
create index if not exists idx_client_notifications_client on public.client_notifications(client_id);
create index if not exists idx_client_notifications_status on public.client_notifications(coach_id, status);
alter table public.client_notifications enable row level security;
drop policy if exists "Client can create and read own notifications" on public.client_notifications;
create policy "Client can create and read own notifications"
  on public.client_notifications for all using (auth.uid() = client_id);
drop policy if exists "Coach can read update client notifications" on public.client_notifications;
create policy "Coach can read update client notifications"
  on public.client_notifications for all using (
    auth.uid() = coach_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.coach_id = client_notifications.coach_id and p.id = client_id)
  );
-- Fix: coach can only see notifications where they are the coach_id
drop policy if exists "Coach can read update client notifications" on public.client_notifications;
create policy "Coach can read update client notifications"
  on public.client_notifications for all using (auth.uid() = coach_id);

-- 4. Coaches mogen week_reviews van hun klanten lezen (voor check-ins en adherence)
-- week_reviews.user_id = klant; klant heeft profiles.coach_id = coach
drop policy if exists "Coaches can read clients week_reviews" on public.week_reviews;
create policy "Coaches can read clients week_reviews"
  on public.week_reviews for select using (
    auth.uid() = week_reviews.user_id
    or exists (select 1 from public.profiles p where p.id = week_reviews.user_id and p.coach_id = auth.uid())
  );

comment on table public.coach_notes is 'Interne notities van coach over een klant; alleen coach ziet deze.';
comment on table public.coach_messages is 'Berichten van coach naar klant (feedback, reacties).';
comment on table public.client_notifications is 'Meldingen van klant naar coach (training te zwaar, blessure, etc.); status: nieuw/gelezen/opgevolgd.';

-- 5. Coach mag client_input, nutrition_plans, training_plans van eigen klanten lezen en (voor plannen) schrijven
create policy "Coaches can read clients client_input"
  on public.client_input for select using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = user_id and p.coach_id = auth.uid())
  );
create policy "Coaches can update clients client_input"
  on public.client_input for update using (
    exists (select 1 from public.profiles p where p.id = user_id and p.coach_id = auth.uid())
  );
create policy "Coaches can insert clients client_input"
  on public.client_input for insert with check (
    exists (select 1 from public.profiles p where p.id = user_id and p.coach_id = auth.uid())
  );

create policy "Coaches can read clients nutrition_plans"
  on public.nutrition_plans for select using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = user_id and p.coach_id = auth.uid())
  );
create policy "Coaches can manage clients nutrition_plans"
  on public.nutrition_plans for all using (
    exists (select 1 from public.profiles p where p.id = user_id and p.coach_id = auth.uid())
  );

create policy "Coaches can read clients training_plans"
  on public.training_plans for select using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = user_id and p.coach_id = auth.uid())
  );
create policy "Coaches can manage clients training_plans"
  on public.training_plans for all using (
    exists (select 1 from public.profiles p where p.id = user_id and p.coach_id = auth.uid())
  );
