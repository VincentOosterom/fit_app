-- restart_count: aantal keer dat gebruiker schema heeft gereset (Pro = max 1, Premium = onbeperkt)
alter table public.subscriptions
  add column if not exists restart_count int not null default 0;

comment on column public.subscriptions.restart_count is 'Aantal keer opnieuw gestart: Pro max 1, Premium onbeperkt, Starter niet toegestaan';

-- RPC: gebruiker mag eigen schema resetten volgens plan-regels
create or replace function public.user_reset_schema()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  sub record;
  bid uuid;
  nid uuid;
  tid uuid;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'Niet ingelogd');
  end if;

  select plan_type, restart_count into sub
  from subscriptions where user_id = uid;

  if sub is null then
    return jsonb_build_object('ok', false, 'error', 'Geen abonnement');
  end if;

  if sub.plan_type = 'starter' then
    return jsonb_build_object('ok', false, 'error', 'Starter kan niet opnieuw beginnen. Upgrade naar Pro of Premium.');
  end if;

  if sub.plan_type = 'pro' and coalesce(sub.restart_count, 0) >= 1 then
    return jsonb_build_object('ok', false, 'error', 'Je hebt je schema al één keer gereset. Bij Premium kun je vaker opnieuw beginnen.');
  end if;

  select id, block_id into nid, bid
  from nutrition_plans where user_id = uid order by created_at desc limit 1;

  select id into tid
  from training_plans where user_id = uid order by created_at desc limit 1;

  if bid is not null then
    delete from week_reviews where user_id = uid and block_id = bid;
  end if;
  if nid is not null then
    delete from nutrition_plans where id = nid;
  end if;
  if tid is not null then
    delete from training_plans where id = tid;
  end if;

  update subscriptions
  set restart_count = coalesce(restart_count, 0) + 1, updated_at = now()
  where user_id = uid;

  return jsonb_build_object('ok', true);
end;
$$;
