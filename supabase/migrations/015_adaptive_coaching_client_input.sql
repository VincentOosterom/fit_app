-- Adaptive coaching: extra velden voor rule-based training & nutrition engine
-- Behoud bestaande kolommen; voeg numerieke scores en gestructureerde velden toe.

-- 1. Herstel & readiness (numeriek)
alter table public.client_input add column if not exists sleep_hours numeric;
alter table public.client_input add column if not exists sleep_quality int check (sleep_quality is null or (sleep_quality >= 1 and sleep_quality <= 5));
alter table public.client_input add column if not exists daily_energy int check (daily_energy is null or (daily_energy >= 1 and daily_energy <= 5));
alter table public.client_input add column if not exists motivation_level int check (motivation_level is null or (motivation_level >= 1 and motivation_level <= 5));
alter table public.client_input add column if not exists recovery_score int check (recovery_score is null or (recovery_score >= 1 and recovery_score <= 5));

-- 2. Stress en werkbelasting als scores 1-5 (naast bestaande text voor backwards compat)
alter table public.client_input add column if not exists stress_score int check (stress_score is null or (stress_score >= 1 and stress_score <= 5));
alter table public.client_input add column if not exists workload_score int check (workload_score is null or (workload_score >= 1 and workload_score <= 5));

-- 3. Trainingsomgeving
alter table public.client_input add column if not exists training_location text check (training_location is null or training_location in ('gym', 'thuis', 'buiten', 'gemengd'));
alter table public.client_input add column if not exists equipment_available text[] default '{}';

-- 4. Voedingscontext
alter table public.client_input add column if not exists meals_per_day int check (meals_per_day is null or (meals_per_day >= 2 and meals_per_day <= 6));
alter table public.client_input add column if not exists cooking_skill text check (cooking_skill is null or cooking_skill in ('beginner', 'gemiddeld', 'gevorderd'));
alter table public.client_input add column if not exists budget_level text check (budget_level is null or budget_level in ('laag', 'gemiddeld', 'hoog'));
alter table public.client_input add column if not exists snacking_habit boolean;
alter table public.client_input add column if not exists alcohol_frequency text check (alcohol_frequency is null or alcohol_frequency in ('nooit', 'soms', 'regelmatig'));

-- 5. Blessures gestructureerd (naast injuries_limitations)
alter table public.client_input add column if not exists injury_tags text[] default '{}';
alter table public.client_input add column if not exists injury_notes text;

-- 6. Supplementen multi-select (supplements_notes blijft bestaan)
alter table public.client_input add column if not exists supplements text[] default '{}';

-- 7. Trainingsplanning voorkeuren
alter table public.client_input add column if not exists preferred_training_days text[] default '{}';
alter table public.client_input add column if not exists preferred_training_time text check (preferred_training_time is null or preferred_training_time in ('ochtend', 'middag', 'avond', 'flexibel'));

-- 8. Motivatie en gedrag
alter table public.client_input add column if not exists why_goal text;
alter table public.client_input add column if not exists biggest_barrier text;
alter table public.client_input add column if not exists training_preference text check (training_preference is null or training_preference in ('korte_intensief', 'langere_rustig', 'variatie', 'vaste_structuur'));
