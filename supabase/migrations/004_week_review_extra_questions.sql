-- Extra vragen weekevaluatie: honger/futloos, slaap, training
alter table public.week_reviews add column if not exists hungry_or_futloos text;
alter table public.week_reviews add column if not exists slept_well text;
alter table public.week_reviews add column if not exists training_went_well text;
