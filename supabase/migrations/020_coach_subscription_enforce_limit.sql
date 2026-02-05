-- Enforce coach client limit in coach_link_by_email (starter=10, pro=50, premium=unlimited)

create or replace function public.coach_link_by_email(target_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  coach_user_id uuid;
  target_id uuid;
  sub_tier text;
  client_count int;
  max_clients int;
begin
  coach_user_id := auth.uid();
  if coach_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'Niet ingelogd');
  end if;
  if not exists (select 1 from public.profiles where id = coach_user_id and role = 'coach') then
    return jsonb_build_object('ok', false, 'error', 'Alleen coaches kunnen klanten koppelen');
  end if;

  select coalesce(coach_subscription, 'starter') into sub_tier from public.profiles where id = coach_user_id;
  select count(*) into client_count from public.profiles where coach_id = coach_user_id;
  max_clients := case sub_tier
    when 'starter' then 10
    when 'pro' then 50
    when 'premium' then null
    else 10
  end;
  if max_clients is not null and client_count >= max_clients then
    return jsonb_build_object('ok', false, 'error', 'Je hebt het maximum aantal klanten (' || max_clients || ') bereikt. Upgrade je coach-abonnement voor meer.');
  end if;

  select id into target_id from public.profiles where lower(trim(email)) = lower(trim(target_email)) limit 1;
  if target_id is null then
    return jsonb_build_object('ok', false, 'error', 'Geen account gevonden met dit e-mailadres');
  end if;
  if target_id = coach_user_id then
    return jsonb_build_object('ok', false, 'error', 'Je kunt jezelf niet koppelen');
  end if;
  update public.profiles set coach_id = coach_user_id, updated_at = now() where id = target_id;
  return jsonb_build_object('ok', true);
end;
$$;
