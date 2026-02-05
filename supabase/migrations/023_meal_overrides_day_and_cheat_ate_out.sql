-- 1. meal_overrides: per dag (Dag 1-7) voor Pro/Premium
alter table public.meal_overrides add column if not exists day_number int default 1 check (day_number >= 1 and day_number <= 7);

-- Verwijder oude unique en maak nieuwe met day_number (bestaande rijen blijven day_number=1)
alter table public.meal_overrides drop constraint if exists meal_overrides_user_id_nutrition_plan_id_week_number_meal_slot_key;
create unique index if not exists meal_overrides_user_plan_week_day_slot_key
  on public.meal_overrides(user_id, nutrition_plan_id, week_number, day_number, meal_slot);

-- 2. week_reviews: expliciet cheat day en uit eten
alter table public.week_reviews add column if not exists cheat_day boolean default false;
alter table public.week_reviews add column if not exists ate_out boolean default false;

comment on column public.meal_overrides.day_number is 'Dag 1-7 binnen de week; bij Pro/Premium per dag eigen maaltijden.';
comment on column public.week_reviews.cheat_day is 'Klant geeft aan: heb deze week een cheat day gehad.';
comment on column public.week_reviews.ate_out is 'Klant geeft aan: ben uit eten geweest.';
