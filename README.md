# AI Avisen prototype

Dette repo indeholder et PHP-baseret layout til en kurateret AI-nyhedsavis. Forsiden henter nu rigtige RSS-/Atom-feeds, normaliserer artiklerne og viser dem i et avisinspireret layout med tag-filtrering og roadmap. Fra og med denne version kan feeds konfigureres via en JSON-fil og et simpelt admin-interface – og redaktionen kan supplere med manuelle video-/podcast-links direkte fra admin-panelet.

## Struktur

- `index.php` – læser feed-konfigurationen, henter/normaliserer historier og genererer forsiden.
- `data/feeds.json` – JSON-fil med sektioner, feeds og valgfri manuelle links. Filen oprettes automatisk hvis den mangler.
- `includes/feed_config.php` – fælles hjælper-funktioner til at indlæse og gemme feed-konfiguration.
- `includes/ai_digest.php` – indkapsler kaldet til ChatGPT API’et og normaliserer AI-resultater til kort.
- `admin/feeds.php` – enkelt admin-interface til at tilføje, redigere og slette sektioner, feeds samt direkte links til podcasts/videoer.
- `partials/` – genanvendelige kort-komponenter til top- og standardartikler.
- `assets/styles.css` – avisinspireret styling.
- `assets/app.js` – simpel tag-filtrering på klientsiden.
- `ai_digest.php` – værktøjsside hvor du kan generere et midlertidigt AI-feed ud fra en vilkårlig URL.

## Hvor ligger dine data?

Alle sektioner, feeds og manuelle links gemmes i filen `data/feeds.json`. Når du opdaterer indhold via admin-siden, er det denne fil, der bliver ændret. Tag en backup af den fil, før du uploader nye versioner af koden, så du ikke overskriver dine egne data.

## Sådan fungerer forsiden

1. **Feed-konfiguration:** Konfigurationen ligger i `data/feeds.json`. Forsiden læser filen via `includes/feed_config.php` og falder tilbage til et standard-setup hvis filen er tom eller ugyldig.
2. **Indlæsning:** Funktionen `fetchFeedItems` henter feedet via `file_get_contents`, parser med `SimpleXML`, normaliserer felt-navne og nedtoner beskrivelser til korte resuméer.
3. **Deduplication:** Alle historier samles på tværs af sektioner; de seneste fire vises som tophistorier, resten i deres respektive sektioner.
4. **Tags & filtre:** Feed- og kategori-tags normaliseres og udstilles som knapper, der styrer klientside-filtreringen i `assets/app.js`.
5. **Fallback:** Hvis ingen feeds kan hentes (fx pga. manglende netværk), vises et kurateret eksempeldata-sæt og en tydelig advarsel.

## Tilpasning og drift

- Redigér alt indhold via `admin/feeds.php` (beskyt siden med adgangskode på dit webhotel). Her kan du oprette, redigere og slette sektioner, feeds og manuelle links til podcasts/videoer. Alternativt kan `data/feeds.json` tilpasses direkte.
- Læg en cron-job ovenpå (fx via cron-job.org) til at cache resultatet i en database, hvis du vil undgå at hente feeds ved hver sideindlæsning.
- Aktiver serverens `allow_url_fopen` eller brug cURL, hvis dit webhotel kræver det.
- Brug `feedErrors`-sektionen i UI til at se hvilke feeds der fejler – nyttigt ved debugging.

Upload filerne til din PHP-server for at se prototypen i aktion, og udbyg efter behov med lagring, AI-summeringer eller mere avanceret administration.

## AI-genereret nyhedsudtræk

- Opret en miljøvariabel `OPENAI_API_KEY` på dit webhotel (fx via kontrolpanelet eller `.htaccess` med `SetEnv`), så nøglen aldrig ligger i selve PHP-filerne.
- Besøg `ai_digest.php`, indsæt en URL til en nyhedsside og tryk **Generér** for at lade ChatGPT skabe et overblik.
- Hvis kilden angiver publiceringsdatoer, filtreres resultatet automatisk til de seneste to døgn. Ellers vises de vigtigste fem historier.
- Brug resultatet som inspiration og kopier relevante links/resuméer ind i `admin/feeds.php` efter behov – intet gemmes automatisk.

### Hvor gemmer jeg API-nøglen?

- **Kontrolpanel:** De fleste webhoteller giver mulighed for at sætte miljøvariabler via deres administrationspanel. Opret en variabel med navnet `OPENAI_API_KEY` og indsæt din nøgle her.
- **.htaccess:** Hvis du har adgang til `.htaccess`, kan du tilføje linjen `SetEnv OPENAI_API_KEY "din-super-hemmelige-nøgle"`. Apache gør variablen tilgængelig for PHP, og nøglen ligger ikke i koden.
- **php.ini / konfiguration:** Har du adgang til en brugerdefineret `php.ini`, kan du tilføje `env[OPENAI_API_KEY] = din-nøgle`.
- Når du har sat variablen, kan PHP læse den via `getenv('OPENAI_API_KEY')`. Se `includes/ai_digest.php` for et eksempel på brugen. Hvis variablen ikke findes, viser siden en fejl, så du bliver mindet om at sætte den korrekt.
