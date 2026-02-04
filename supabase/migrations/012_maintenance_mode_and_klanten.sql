-- Onderhoudsmodus: alle ingelogde gebruikers mogen deze waarde lezen (zodat we de "app uit" melding kunnen tonen).
create or replace function public.get_maintenance_mode()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select (value = to_jsonb(true)) from public.admin_settings where key = 'maintenance_mode'),
    false
  );
$$;
grant execute on function public.get_maintenance_mode() to authenticated;
grant execute on function public.get_maintenance_mode() to anon;
