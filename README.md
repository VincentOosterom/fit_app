# Sport webapp – Voeding & Training

React-frontend + Supabase. Op basis van **klantinput** en **regels** worden automatisch een voedings- en/of trainingsschema gegenereerd.

## Opzetten

1. **Node en npm**
   ```bash
   npm install
   npm run dev
   ```
   App: http://localhost:5173

2. **Supabase**
   - Maak een project op [supabase.com](https://supabase.com/dashboard).
   - Voer het script `supabase/migrations/001_initial.sql` uit in de SQL Editor (of via CLI).
   - Onder **Settings → API** kopieer je **Project URL** en **anon public** key.

3. **Environment**
   - Kopieer `.env.example` naar `.env`.
   - Vul in:
     ```
     VITE_SUPABASE_URL=https://jouw-project.supabase.co
     VITE_SUPABASE_ANON_KEY=jouw-anon-key
     ```

4. **Auth**
   - In Supabase: Authentication → Providers: Email aan (evt. “Confirm email” uitzetten voor development).
   - Registreer een gebruiker via de app (Login-pagina → “Geen account? Registreren”).

## Gebruik

1. **Registreren / inloggen** op de loginpagina.
2. **Mijn input**: doel (afvallen, spieropbouw, conditie, onderhoud), niveau, dagen per week, dieetwensen, beperkingen.
3. **Voeding** of **Training**: klik op “Schema genereren”. Het schema wordt op basis van de regels in `src/rules/` opgebouwd en opgeslagen in Supabase.
4. **Dashboard**: overzicht en snel naar input, voeding of training.

## Regels aanpassen

- **Voeding:** `src/rules/nutritionEngine.js` – calorieën per doel, verdeling over maaltijden, aantal dagen.
- **Training:** `src/rules/trainingEngine.js` – sessies per doel, focus (full body / upper/lower / cardio), oefeningen per type.

Deze engines kun je later uitbreiden met regels uit de Supabase-tabel `rules` of met Edge Functions.

## Structuur

Zie **STRUCTUUR.md** voor de mapstructuur en het gegevensmodel.
