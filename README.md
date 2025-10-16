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
- `config/` – konfigurationsmappe til API-nøgler og certifikater. `config.php` returnerer et array med OpenAI-indstillingerne og blokeres fra webadgang via `.htaccess`/`web.config`.

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

- Udfyld `config/config.php` med din OpenAI API-nøgle, ønsket model, base-URL og tidsgrænse. Filen returnerer et array og er beskyttet mod direkte adgang via de medfølgende `.htaccess`/`web.config`-regler.
- Hvis dit webhotel kræver eget certifikat, upload et `cacert-YYYY-MM-DD.pem` i `config/` og opdater `CA_BUNDLE`-stien. Filen er på forhånd ignoreret i Git, så den bliver ikke committet.
- Besøg `ai_digest.php`, indsæt en URL til en nyhedsside og tryk **Generér** for at lade ChatGPT skabe et overblik.
- Hvis kilden angiver publiceringsdatoer, filtreres resultatet automatisk til de seneste to døgn. Ellers vises de vigtigste fem historier.
- Brug resultatet som inspiration og kopier relevante links/resuméer ind i `admin/feeds.php` efter behov – intet gemmes automatisk.
