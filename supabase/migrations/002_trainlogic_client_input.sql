-- TrainLogic: uitbreiding client_input met alle vereiste velden
-- Voer uit in Supabase SQL Editor na 001_initial.sql

-- Basisgegevens
alter table public.client_input add column if not exists age int;
alter table public.client_input add column if not exists sex text check (sex is null or sex in ('m', 'v', 'x'));
alter table public.client_input add column if not exists injuries_limitations text;

-- Ervaring & sportcontext (goal/level bestaan al; level = beginner/intermediate/advanced)
alter table public.client_input add column if not exists main_sport text;
alter table public.client_input add column if not exists event_date date;

-- Beschikbaarheid & levensstijl
alter table public.client_input add column if not exists session_minutes int default 60;
alter table public.client_input add column if not exists work_load text check (work_load is null or work_load in ('laag', 'middel', 'hoog'));
alter table public.client_input add column if not exists stress_level text check (stress_level is null or stress_level in ('laag', 'middel', 'hoog'));

-- Voeding: primair doel (prestatie, onderhoud, vetverlies)
alter table public.client_input add column if not exists nutrition_goal text check (nutrition_goal is null or nutrition_goal in ('prestatie', 'onderhoud', 'vetverlies'));

-- Doel training: uitbreiden met prestatie en vetverlies (TrainLogic)
alter table public.client_input drop constraint if exists client_input_goal_check;
alter table public.client_input add constraint client_input_goal_check 
  check (goal in ('afvallen', 'spieropbouw', 'conditie', 'onderhoud', 'prestatie', 'vetverlies'));

-- Level: TrainLogic gebruikt beginner / intermediate / advanced
alter table public.client_input drop constraint if exists client_input_level_check;
alter table public.client_input add constraint client_input_level_check 
  check (level in ('beginner', 'intermediate', 'advanced', 'gevorderd', 'expert'));
