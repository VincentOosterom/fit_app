-- Doel goal: marathon en hyrox toevoegen (staan in app maar ontbraken in check)
alter table public.client_input drop constraint if exists client_input_goal_check;
alter table public.client_input add constraint client_input_goal_check
  check (goal in (
    'afvallen', 'spieropbouw', 'conditie', 'onderhoud', 'prestatie', 'vetverlies',
    'kracht_endurance', 'sportevenement', 'fit_vanaf_nul',
    'marathon', 'hyrox'
  ));
