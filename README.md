# Procentregningstræning

Denne miniwebapp indeholder 30 procentopgaver med AI-baserede hints, tutorials og feedback.

## Kom i gang

1. Upload hele projektmappen til din PHP-server.
2. Første gang en side indlæses, hentes `config.php`, `web.config`, `cacert-2025-08-12.pem` og `.gitignore` automatisk fra Tech Colleges delte konfigurationsmappe på `http://stha2.web.techcollege.dk/Config/` (med en ekstra fallback til den gamle `.../config/`-sti). Du kan supplere eller overstyre adresserne i `config/central_source.txt`.
   - Hvis din server blokerer bestemte filnavne (fx `web.config` eller `.gitignore`), kan du lægge en kopi i samme mappe med et tilgængeligt navn som `web.config.txt` eller `gitignore`. Synkroniseringen vil automatisk hente og omdøbe filen.
3. Læg din OpenAI API-nøgle i den centrale konfiguration (`config.php`), så alle dine projekter deler den samme nøgle.
4. (Valgfrit) Hvis du tester lokalt, kan du stadig kopiere `config/openai.key.example` til `config/openai.key` – den bruges kun som fallback.
5. Sørg for at serveren har cURL aktiveret, så forespørgsler til OpenAI kan sendes.
6. Besøg `index.php` i din browser.

Hvis du ikke angiver en API-nøgle, vil hints, tutorials og AI-feedback til fritekstsvar vise en fejlbesked.

## Filer

- `index.php` – frontend med øvelser, modaler og JavaScript-logik.
- `ai_helper.php` – endpoint der henter AI-hints og tutorials.
- `feedback.php` – håndterer AI-feedback på elevsvar.
- `config/openai.php` – læser API-nøglen fra den centrale config og kalder OpenAI.
- `config/ai_feedback.php` – indeholder feedback-logik og kalder OpenAI ved behov.
- `config/central_sync.php` – downloader fælles støttefiler fra Tech College-serveren én gang i døgnet.
- `assets/styles.css` – styling af siden.

## Licens

Projektet er udarbejdet til undervisningsbrug. Tilpas frit efter behov.
