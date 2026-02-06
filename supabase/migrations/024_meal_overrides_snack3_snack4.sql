-- Sta snack3 en snack4 toe in meal_overrides (extra maaltijden om dagtotaal op weekgemiddelde te brengen)
alter table public.meal_overrides drop constraint if exists meal_overrides_meal_slot_check;
alter table public.meal_overrides add constraint meal_overrides_meal_slot_check
  check (meal_slot in ('ontbijt', 'lunch', 'avond', 'snack1', 'snack2', 'snack3', 'snack4'));
