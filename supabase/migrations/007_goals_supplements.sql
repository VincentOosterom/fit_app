-- Doelen uitbreiden (kracht+uithouding, sportevenement, fit vanaf nul, vetverlies) + sport supplementen
alter table public.client_input add column if not exists uses_supplements boolean default false;
alter table public.client_input add column if not exists supplements_notes text;

alter table public.client_input drop constraint if exists client_input_goal_check;
alter table public.client_input add constraint client_input_goal_check
  check (goal in (
    'afvallen', 'spieropbouw', 'conditie', 'onderhoud', 'prestatie', 'vetverlies',
    'kracht_endurance', 'sportevenement', 'fit_vanaf_nul'
  ));
