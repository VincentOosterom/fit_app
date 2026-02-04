-- Functie om planprijzen op te halen (voor alle ingelogde gebruikers, voor tonen/plan kiezen).
-- Leest uit admin_settings; als niet gezet, dan defaults.
create or replace function public.get_plan_prices()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  starter int;
  pro int;
  premium int;
begin
  select coalesce((select (value#>>'{}')::int from admin_settings where key = 'plan_price_starter_cents'), 795) into starter;
  select coalesce((select (value#>>'{}')::int from admin_settings where key = 'plan_price_pro_cents'), 999) into pro;
  select coalesce((select (value#>>'{}')::int from admin_settings where key = 'plan_price_premium_cents'), 1495) into premium;
  return jsonb_build_object('starter', starter, 'pro', pro, 'premium', premium);
end;
$$;
grant execute on function public.get_plan_prices() to authenticated;
grant execute on function public.get_plan_prices() to anon;