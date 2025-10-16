# AI Avisen prototype

Dette repo indeholder et PHP-baseret layout til en kurateret AI-nyhedsavis. Forsiden henter nu rigtige RSS-/Atom-feeds, normaliserer artiklerne og viser dem i et avisinspireret layout med tag-filtrering og roadmap. Fra og med denne version kan feeds konfigureres via en JSON-fil og et simpelt admin-interface.

## Struktur

- `index.php` – læser feed-konfigurationen, henter/normaliserer historier og genererer forsiden.
- `data/feeds.json` – JSON-fil med sektioner og feeds. Filen oprettes automatisk hvis den mangler.
- `includes/feed_config.php` – fælles hjælper-funktioner til at indlæse og gemme feed-konfiguration.
- `admin/feeds.php` – enkelt admin-interface til at tilføje, redigere og slette sektioner eller feeds.
- `partials/` – genanvendelige kort-komponenter til top- og standardartikler.
- `assets/styles.css` – avisinspireret styling.
- `assets/app.js` – simpel tag-filtrering på klientsiden.

## Sådan fungerer forsiden

1. **Feed-konfiguration:** Konfigurationen ligger i `data/feeds.json`. Forsiden læser filen via `includes/feed_config.php` og falder tilbage til et standard-setup hvis filen er tom eller ugyldig.
2. **Indlæsning:** Funktionen `fetchFeedItems` henter feedet via `file_get_contents`, parser med `SimpleXML`, normaliserer felt-navne og nedtoner beskrivelser til korte resuméer.
3. **Deduplication:** Alle historier samles på tværs af sektioner; de seneste fire vises som tophistorier, resten i deres respektive sektioner.
4. **Tags & filtre:** Feed- og kategori-tags normaliseres og udstilles som knapper, der styrer klientside-filtreringen i `assets/app.js`.
5. **Fallback:** Hvis ingen feeds kan hentes (fx pga. manglende netværk), vises et kurateret eksempeldata-sæt og en tydelig advarsel.

## Tilpasning og drift

- Redigér feeds via `admin/feeds.php` (beskyt siden med adgangskode på dit webhotel). Her kan du oprette, redigere og slette sektioner eller enkelt-feeds. Alternativt kan `data/feeds.json` tilpasses direkte.
- Læg en cron-job ovenpå (fx via cron-job.org) til at cache resultatet i en database, hvis du vil undgå at hente feeds ved hver sideindlæsning.
- Aktiver serverens `allow_url_fopen` eller brug cURL, hvis dit webhotel kræver det.
- Brug `feedErrors`-sektionen i UI til at se hvilke feeds der fejler – nyttigt ved debugging.

Upload filerne til din PHP-server for at se prototypen i aktion, og udbyg efter behov med lagring, AI-summeringer eller mere avanceret administration.
