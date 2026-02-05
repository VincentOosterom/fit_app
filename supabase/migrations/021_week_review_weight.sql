-- Optioneel gewicht in weekevaluatie voor adaptieve voeding (kg minder / progressie)
alter table public.week_reviews add column if not exists weight_kg numeric;

comment on column public.week_reviews.weight_kg is 'Optioneel: gewicht na deze week (kg) voor adaptie volgende week.';
