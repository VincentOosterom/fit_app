-- Zorg dat gewone gebruikers weer hun eigen profiel kunnen lezen (na 005/006 had alleen admin leesrechten).
-- Admins kunnen alle profiles lezen; gebruikers alleen hun eigen.
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);
