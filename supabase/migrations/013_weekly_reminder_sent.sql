-- Tabel om bij te houden of we een "vergeet je niet" reminder hebben gestuurd
-- (voorkomt dubbele mails; Edge Function weekly-reminder leest/schrijft deze tabel)

create table if not exists public.reminder_sent (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  block_id uuid not null,
  week_number int not null check (week_number >= 1 and week_number <= 4),
  sent_at timestamptz default now(),
  unique(user_id, block_id, week_number)
);

-- Alleen service role / Edge Function mag dit vullen; geen RLS voor klanten
alter table public.reminder_sent enable row level security;

-- Geen policy: klanten hebben geen toegang; Edge Function gebruikt service_role key
create policy "Service role only: no direct client access"
  on public.reminder_sent for all using (false);

comment on table public.reminder_sent is 'Log van verstuurde week-reminder e-mails (Edge Function weekly-reminder).';
