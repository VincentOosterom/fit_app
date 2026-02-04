-- Zorg dat elke auth.user een profiel heeft (voor als trigger na signup niet liep).
-- Inclusief e-mail uit auth.users.
insert into public.profiles (id, full_name, email, role)
select u.id, coalesce(u.raw_user_meta_data->>'full_name', ''), u.email, 'client'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- Functie zodat admin handmatig kan syncen (aanroep vanuit app). Alleen admins mogen aanroepen.
create or replace function public.sync_profiles_from_auth()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  if not exists (select 1 from public.admin_user_ids where user_id = auth.uid()) then
    raise exception 'Alleen admins mogen profielen syncen';
  end if;
  insert into public.profiles (id, full_name, email, role)
  select u.id, coalesce(u.raw_user_meta_data->>'full_name', ''), u.email, 'client'
  from auth.users u
  on conflict (id) do update set
    email = coalesce(excluded.email, profiles.email),
    full_name = coalesce(nullif(trim(excluded.full_name), ''), profiles.full_name),
    updated_at = now();
  get diagnostics n = row_count;
  return n;
end;
$$;
grant execute on function public.sync_profiles_from_auth() to authenticated;
