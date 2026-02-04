# Sport webapp – Supabase + React

De app bouwt op basis van **regels** en **klantinput** automatisch een **voedingsschema** en/of **trainingsschema** voor de klant.

---

## Stack

| Onderdeel | Technologie |
|-----------|-------------|
| Frontend | React + Vite |
| Backend / DB / Auth | Supabase (PostgreSQL, Auth, Realtime, optioneel Edge Functions) |

---

## Mapstructuur

```
mijnapp/
├── src/
│   ├── assets/
│   ├── components/       # UI: forms, cards, layout
│   ├── pages/            # Schermen: input, schema’s, dashboard
│   ├── hooks/            # useAuth, usePlan, useClientInput
│   ├── lib/              # Supabase client + helpers
│   ├── context/          # AuthContext, eventueel PlanContext
│   ├── rules/            # Logica: regels → voeding/training (engines)
│   ├── utils/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
├── index.html
├── package.json
├── vite.config.js
├── .env.example          # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── supabase/
│   └── migrations/       # (optioneel) SQL voor tabellen
└── STRUCTUUR.md
```

---

## Gegevensmodel (Supabase / PostgreSQL)

### Kern

| Tabel | Doel |
|-------|------|
| **profiles** | Uitbreiding op `auth.users`: rol (klant/coach/admin), naam, voorkeuren. |
| **client_input** | Input van de klant: doel (afvallen/spieropbouw/conditie), niveau, dagen per week, dieetwensen, beperkingen, startdatum. |
| **rules** | Regels die bepalen hoe schema’s worden opgebouwd (bijv. “bij doel X en niveau Y → schema Z”). Bewaar condities + template of verwijzing. |
| **nutrition_plans** | Gegenereerde voedingsschema’s per klant (bijv. JSON: dagen → maaltijden). |
| **training_plans** | Gegenereerde trainingsschema’s per klant (bijv. JSON: weken → sessies/oefeningen). |

### Relaties

- `profiles.id` = `auth.users.id`.
- `client_input.user_id` → `profiles.id` (of `auth.users.id`).
- `nutrition_plans` / `training_plans`: `user_id` + optioneel `client_input_id` of `rule_set_id` om te weten op welke input en regels het plan gebaseerd is.

---

## Flow: regels + input → schema

1. **Klantinput**  
   Klant vult in: doel, niveau, dagen beschikbaar, dieet (bijv. vegetarisch), allergieën, voorkeur voor voeding en/of training.

2. **Regels**  
   Regels bepalen o.a.:
   - Welk type plan (voeding, training, beide).
   - Hoeveel calorieën/macro’s (bijv. uit doel + gewicht).
   - Welke trainingsdagen en -type (kracht/conditie) bij welk niveau.
   - Welke maaltijd-/trainingssjablonen gebruikt worden.

3. **Engine**  
   - **Optie A:** Logica in de frontend (`src/rules/`): leest `client_input` + laadt regels (uit Supabase of config), bouwt plan in JavaScript.  
   - **Optie B:** Supabase Edge Function: ontvangt input + regels, berekent plan, slaat op in `nutrition_plans` / `training_plans`.  
   - **Optie C:** Databasefunctie (PL/pgSQL) die vanuit de app wordt aangeroepen.

4. **Opslaan en tonen**  
   Gegenereerde plannen in `nutrition_plans` en `training_plans`; UI toont overzicht en detail (per dag/week).

---

## Pagina’s (voorstel)

| Pagina | Doel |
|--------|------|
| **Login / Registratie** | Supabase Auth (email/wachtwoord of magic link). |
| **Dashboard** | Overzicht: laatste input, laatste voeding- en trainingsschema’s, knoppen “Nieuw schema” / “Input aanpassen”. |
| **Klantinput** | Formulier voor doel, niveau, dagen, dieet, beperkingen, etc. → opslaan in `client_input`. |
| **Regels (admin/coach)** | (Optioneel) Beheer van regels: condities en templates voor voeding/training. |
| **Mijn voedingsschema** | Tonen van actueel voedingsschema (uit `nutrition_plans`). |
| **Mijn trainingsschema** | Tonen van actueel trainingsschema (uit `training_plans`). |
| **Schema genereren** | Actie: op basis van laatste `client_input` + regels nieuw plan genereren en opslaan. |

---

## Volgende stappen

1. React + Vite project met Supabase client opzetten.  
2. `.env.example` en Supabase-project koppelen.  
3. Auth (inloggen/registreren) en `profiles`-aanmaak.  
4. Tabellen en RLS (Row Level Security) in Supabase definiëren.  
5. Pagina Klantinput + opslaan in `client_input`.  
6. Eenvoudige regel-engine in `src/rules/` die uit input een basis voeding- en/of trainingsschema bouwt en in `nutrition_plans` / `training_plans` zet.  
7. Dashboard en pagina’s voor “Mijn voedingsschema” en “Mijn trainingsschema” bouwen.

Daarna kunnen regels uitgebreider worden (meer doeltypen, betere macro’s, periodisering) en eventueel verplaatst naar Edge Functions of databasefuncties.
