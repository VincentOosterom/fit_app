-- Event & Wedstrijd module: intake en koppeling aan gebruiker
create table if not exists public.user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('marathon', 'halve_marathon', '10km', '5km', 'triathlon', 'hyrox', 'wedstrijd', 'sportdag', 'anders')),
  event_date date not null,
  event_name text,
  distance_km numeric,
  duration_minutes int,
  prestatiedoel text check (prestatiedoel is null or prestatiedoel in ('finishen', 'pr', 'tijd', 'plezier')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_user_events_user_date on public.user_events(user_id, event_date);
alter table public.user_events enable row level security;
create policy "Users can manage own user_events"
  on public.user_events for all using (auth.uid() = user_id);

comment on table public.user_events is 'Event/wedstrijd intake voor periodisering en taper';
