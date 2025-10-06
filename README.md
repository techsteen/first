# Procentregningstræning

Denne miniwebapp indeholder 30 procentopgaver med AI-baserede hints, tutorials og feedback.

## Kom i gang

1. Upload hele projektmappen til din PHP-server.
2. Læg en fælles `Config`-mappe ét niveau eller to over dine projekter (fx `../../Config/`). Mappen skal som minimum indeholde `config.php`, `web.config`, `cacert-2025-08-12.pem` og `.gitignore`.
3. I `Config/config.php` skal du returnere et array med nøgler som `OPENAI_API_KEY`, `OPENAI_BASE`, `OPENAI_MODEL`, `TIMEOUT` m.fl. Eksempel:
   ```php
   <?php
   return [
       'OPENAI_API_KEY' => 'sk-xxxx',
       'OPENAI_BASE' => 'https://api.openai.com/v1',
       'OPENAI_MODEL' => 'gpt-4o-mini',
       'TIMEOUT' => 30,
   ];
   ```
4. Sørg for at serveren har cURL aktiveret, så forespørgsler til OpenAI kan sendes.
5. Besøg `index.php` i din browser.

Hvis du ikke angiver en API-nøgle, vil hints, tutorials og AI-feedback til fritekstsvar vise en fejlbesked.

## Filer

- `index.php` – frontend med øvelser, modaler og JavaScript-logik.
- `ai_helper.php` – endpoint der henter AI-hints og tutorials.
- `feedback.php` – håndterer AI-feedback på elevsvar.
- `config/openai.php` – læser API-nøglen fra den centrale config og kalder OpenAI.
- `config/ai_feedback.php` – indeholder feedback-logik og kalder OpenAI ved behov.
- `assets/styles.css` – styling af siden.

## Licens

Projektet er udarbejdet til undervisningsbrug. Tilpas frit efter behov.
