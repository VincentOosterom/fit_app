    -- Optionele tags op gerechten voor filtering op dieet/allergieën (geen varken, geen groente, noten, etc.)
    alter table public.food_library add column if not exists tags text[] default '{}';

    comment on column public.food_library.tags is 'Tags voor filter: varken, vis, groente, noten, gluten, lactose, zuivel, ei, etc.';
