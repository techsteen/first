# Subnetting Tutor (GF2)

Dette projekt er en lille SPA-applikation til GF2-elever og undervisere med fokus på subnetting. Løsningen kan køre på et almindeligt PHP-webhotel uden ekstra opsætning.

## Installation (FTP)
1. Opret en mappe på webhotellet (f.eks. `/public_html/subnetting`).
2. Upload **hele** projektmappen via FTP.
3. Sørg for, at den eksisterende mappe `/Config/` på webhotellet forbliver urørt. Projektet forventer, at følgende filer findes der:
   - `config.php`
   - `cacert-YYYY-MM-DD.pem`
   - `web.config` (hvis du er på IIS)
4. Filer i `/server/*.php` inkluderer `../Config/config.php` med relative stier og antager, at `cacert-*.pem` ligger i samme mappe. Hvis du bruger et andet filnavn til certifikatet, skal det opdateres i Config-mappen (ikke i koden).

## Certifikat (CA bundle)
Hvis `cacert-*.pem` mangler, returnerer API-endpoints en elevvenlig fejl om, at CA-bundle ikke blev fundet. Upload den korrekte fil til `/Config/` og sørg for, at filnavnet følger mønsteret `cacert-YYYY-MM-DD.pem`.

## Konfiguration af opgaver
- `assets/tasks.json` rummer de faste testopgaver og kan bruges som fallback/eksempler. Struktur: hvert objekt har `id`, `type`, `difficulty`, `topic`, `question`, `hints`, `answer_schema`, `rubric` og `max_attempts_before_solution`.
- `assets/ai_prebuilt_tasks.json` indeholder de opgaver, der vises på Øv- og AI-siderne. Filen er organiseret pr. emne og sværhedsgrad; redigér eller tilføj opgaver manuelt efter samme struktur.
- `assets/templates.json` kan stadig bruges som inspirationskatalog til at skrive nye opgaver, men systemet kalder ikke længere OpenAI for at generere indhold.

## Øv-siden (forudbyggede emnespor)
- Under fanen “Øv” kan elever vælge et emne (binær, netmasker, CIDR, VLSM, subnetplanlægning) og hente den næste forudbyggede opgave i samme spor.
- Eleverne vælger blot sværhedsgrad; hvert klik viser næste opgave fra `assets/ai_prebuilt_tasks.json`, og progressionen gemmes lokalt.
- Feedback ved fejl er hjælpende og løsningen skjules automatisk i elevtilstand, uanset antal forsøg.

## Lærer-tilstand
- Aktiveres i klienten via knappen “Lærer-tilstand”. Standard-PIN er **4285** og kan ændres i `assets/app.js` (konstanten `PIN_CODE`).
- Lærer-tilstand viser filreferencer, promptpaneler og hjælpetekster til vedligeholdelse af opgavebiblioteket.
- **Servernøgler eksponeres aldrig** – PIN eksisterer kun i klienten.

## AI-opgaver
- Fanen “AI-opgaver” viser de forudbyggede opgaver fra `assets/ai_prebuilt_tasks.json`. Vælg emne og sværhedsgrad for at gennemse opgavesættet.
- Nederst på siden vises en færdig prompt, der kan kopieres og gives til en Canvas-bot for at oprette opgaven i læringsplatformen.
- Endpunktet `server/api_generate_tasks.php` er sat ud af drift og returnerer nu en vejledende besked om at vedligeholde opgaverne statisk.

## Opgaveværktøj
- Fanen “Opgaveværktøj” rummer en formular, hvor du kan beskrive en opgave og straks få et JSON-objekt i korrekt struktur.
- Formularen understøtter korte svar, multiple choice, multi-step og tabelopgaver. Brug `[input:facit]` i tabeller for at markere felter, der skal udfyldes.
- Siden genererer samtidig en Canvas-prompt, så du kan guide en ekstern bot til at oprette opgaven i Canvas på en standardiseret måde.
- Brug knapperne “Importer JSON” og “Eksporter JSON” til at hente eksisterende opgaver ind i værktøjet eller downloade nye opgaver direkte som fil.

## API-nøgler
- `Config/config.php` skal definere enten konstanten `OPENAI_API_KEY` (selve nøglen) eller `OPENAI_KEY_FILE` (sti til fil med nøglen).
- Nøglen læses kun server-side og sendes aldrig til klienten.

## Rate limiting og logging
- `api_evaluate.php`: 10 forespørgsler pr. 30 sekunder pr. IP.
- Logging sker til `/data/usage.log` som JSON-linjer med timestamp, route og anonyme resultatdata.

## Filsystem og rettigheder
- Sørg for, at `/data/` er skrivbar, hvis du vil logge elevforsøg (bruges af `api_evaluate.php`).

## Fejlhåndtering
- Alle server-endpoints returnerer JSON-fejlmeddelelser på dansk uden følsomme oplysninger.
- Typiske SSL-/CA-fejl resulterer i beskeden “CA-bundle blev ikke fundet. Upload cacert-filen til Config-mappen.”

## Udvikling
- Ingen build-trin er nødvendige. HTML, CSS og JS er statiske filer.
- Systemet bruger simple ES-moduler (`router.js` og `app.js`).
