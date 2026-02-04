-- Block: één 4-weekse schema = één training + één voeding (zelfde block_id)
alter table public.training_plans add column if not exists block_id uuid;
alter table public.nutrition_plans add column if not exists block_id uuid;

-- Weekevaluaties: na elke week invullen; na week 4 kan vervolg of aanpassing
create table if not exists public.week_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  block_id uuid not null,
  week_number int not null check (week_number >= 1 and week_number <= 4),
  how_went text check (how_went in ('goed', 'redelijk', 'slecht')),
  what_better_sleep text,
  what_better_eating text,
  what_better_training text,
  cheat_day_notes text,
  wants_follow_up boolean default false,
  created_at timestamptz default now(),
  unique(user_id, block_id, week_number)
);

alter table public.week_reviews enable row level security;
create policy "Users can manage own week_reviews"
  on public.week_reviews for all using (auth.uid() = user_id);
