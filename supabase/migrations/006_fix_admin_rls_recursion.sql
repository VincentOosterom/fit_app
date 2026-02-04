-- Fix infinite recursion: admin-check mag niet op profiles lezen.
-- We gebruiken een aparte tabel admin_user_ids voor de vraag "is deze gebruiker admin?".
--
-- Eerste admin (als er nog geen is): voer in SQL Editor uit:
--   insert into public.admin_user_ids (user_id) values ('uuid-van-gebruiker');
--   update public.profiles set role = 'admin' where id = 'uuid-van-gebruiker';

-- Tabel: alleen user_id, geen RLS die profiles leest
create table if not exists public.admin_user_ids (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.admin_user_ids enable row level security;

-- Iedereen mag alleen zijn eigen rij zien (om te checken: ben ik admin?)
create policy "Users can see own admin row"
  on public.admin_user_ids for select using (auth.uid() = user_id);

-- Alleen bestaande admins mogen anderen toevoegen/verwijderen (check leest alleen admin_user_ids, geen profiles)
create policy "Admins can insert admin_user_ids"
  on public.admin_user_ids for insert with check (exists (select 1 from public.admin_user_ids where user_id = auth.uid()));
create policy "Admins can delete admin_user_ids"
  on public.admin_user_ids for delete using (exists (select 1 from public.admin_user_ids where user_id = auth.uid()));

-- Bestaande admins overzetten: wie role = 'admin' heeft in profiles, krijgt een rij in admin_user_ids
insert into public.admin_user_ids (user_id)
  select id from public.profiles where role = 'admin'
  on conflict (user_id) do nothing;

-- Verwijder alle "Admins can ..." policies die profiles lezen en vervang door admin_user_ids-check
drop policy if exists "Admins can read all subscriptions" on public.subscriptions;
drop policy if exists "Admins can update subscriptions" on public.subscriptions;
create policy "Admins can read all subscriptions"
  on public.subscriptions for select using (exists (select 1 from public.admin_user_ids where user_id = auth.uid()));
create policy "Admins can update subscriptions"
  on public.subscriptions for all using (exists (select 1 from public.admin_user_ids where user_id = auth.uid()));

drop policy if exists "Admins can read all payments" on public.payments;
drop policy if exists "Admins can insert payments" on public.payments;
create policy "Admins can read all payments"
  on public.payments for select using (exists (select 1 from public.admin_user_ids where user_id = auth.uid()));
create policy "Admins can insert payments"
  on public.payments for insert with check (exists (select 1 from public.admin_user_ids where user_id = auth.uid()));

drop policy if exists "Admins can read admin_settings" on public.admin_settings;
drop policy if exists "Admins can manage admin_settings" on public.admin_settings;
create policy "Admins can read admin_settings"
  on public.admin_settings for select using (exists (select 1 from public.admin_user_ids where user_id = auth.uid()));
create policy "Admins can manage admin_settings"
  on public.admin_settings for all using (exists (select 1 from public.admin_user_ids where user_id = auth.uid()));

drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles for select using (exists (select 1 from public.admin_user_ids where user_id = auth.uid()));
create policy "Admins can update any profile"
  on public.profiles for update using (exists (select 1 from public.admin_user_ids where user_id = auth.uid()));

drop policy if exists "Admins can read all client_input" on public.client_input;
create policy "Admins can read all client_input"
  on public.client_input for select using (exists (select 1 from public.admin_user_ids where user_id = auth.uid()));

drop policy if exists "Admins can read all nutrition_plans" on public.nutrition_plans;
create policy "Admins can read all nutrition_plans"
  on public.nutrition_plans for select using (exists (select 1 from public.admin_user_ids where user_id = auth.uid()));

drop policy if exists "Admins can read all training_plans" on public.training_plans;
create policy "Admins can read all training_plans"
  on public.training_plans for select using (exists (select 1 from public.admin_user_ids where user_id = auth.uid()));

drop policy if exists "Admins can read all week_reviews" on public.week_reviews;
create policy "Admins can read all week_reviews"
  on public.week_reviews for select using (exists (select 1 from public.admin_user_ids where user_id = auth.uid()));
