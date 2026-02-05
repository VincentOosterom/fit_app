# Weekly reminder (Edge Function)

Stuurt een e-mail "Vergeet je niet — zo helpen wij jou" wanneer de week bijna afgelopen is en de klant nog geen weekevaluatie heeft ingevuld.

## Setup

1. **Migratie**: Voer `013_weekly_reminder_sent.sql` uit (tabel `reminder_sent`).

2. **Resend**: Maak een account op [resend.com](https://resend.com), maak een API key en een verified domain (of gebruik hun test domain).

3. **Supabase Dashboard** → Edge Functions → `weekly-reminder` → Settings:
   - `RESEND_API_KEY`: je Resend API key
   - `FROM_EMAIL`: bijv. `TrainLogic <vergeet-niet@jouwdomein.nl>`

4. **Cron**: Roep de function dagelijks aan, bijv. om 09:00:
   - Supabase: Database → Extensions → `pg_cron` (als je cron in de DB wilt), of
   - Externe cron (Vercel Cron, GitHub Actions, etc.): `POST https://<project>.supabase.co/functions/v1/weekly-reminder` met header `Authorization: Bearer <anon_key>` of gebruik een secret.

## Logica

- Voor elk actief voedingsplan (laatste per gebruiker) wordt de huidige week (1–4) bepaald.
- Als we in de laatste 2 dagen van die week zitten en er is nog geen weekevaluatie én nog geen reminder gestuurd → e-mail wordt verstuurd en er wordt een rij in `reminder_sent` gezet.
