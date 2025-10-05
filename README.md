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
- `assets/templates.json` beskriver de skabeloner, som AI-generatoren må bruge. Tilføj nye skabeloner ved at følge det eksisterende format (grupperet pr. emne og sværhedsgrad).

## Øv-siden (AI-genererede emnespor)
- Under fanen “Øv” kan elever vælge et emne (binær, netmasker, CIDR, VLSM, subnetplanlægning) og generere én AI-opgave ad gangen inden for samme spor.
- Eleverne vælger blot sværhedsgrad; hver forespørgsel henter én opgave via `api_generate_tasks.php`, og progressionen gemmes lokalt.
- Feedback ved fejl er hjælpende og løsningen skjules automatisk i elevtilstand, uanset antal forsøg.

## Lærer-tilstand
- Aktiveres i klienten via knappen “Lærer-tilstand”. Standard-PIN er **4285** og kan ændres i `assets/app.js` (konstanten `PIN_CODE`).
- Lærer-tilstand låser knapper op til at generere og gemme AI-opgaver.
- **Servernøgler eksponeres aldrig** – PIN eksisterer kun i klienten.

## AI-opgaver
- `server/api_generate_tasks.php` bruger `templates.json` til at instruere OpenAI. Resultatet valideres og tildeles ID’er med præfikset `AI-`.
- “Gem sæt” forsøger først at skrive til `/data/ai_tasks.json`. Hvis webhotellet ikke tillader skrivning, sendes en fallback-besked, og klienten gemmer automatisk i LocalStorage.
- “Indlæs gemte sæt” forsøger at læse fra `/data/ai_tasks.json`. Hvis filen ikke findes eller ikke kan læses, falder den tilbage til LocalStorage.

## API-nøgler
- `Config/config.php` skal definere enten konstanten `OPENAI_API_KEY` (selve nøglen) eller `OPENAI_KEY_FILE` (sti til fil med nøglen).
- Nøglen læses kun server-side og sendes aldrig til klienten.

## Rate limiting og logging
- `api_evaluate.php`: 10 forespørgsler pr. 30 sekunder pr. IP.
- `api_generate_tasks.php`: 6 forespørgsler pr. 30 sekunder pr. IP.
- Logging sker til `/data/usage.log` som JSON-linjer med timestamp, route og anonyme resultatdata.

## Filsystem og rettigheder
- Sørg for, at `/data/` er skrivbar, hvis du vil gemme AI-opgaver og logfiler server-side.
- Hvis serveren ikke tillader skrivning, fungerer platformen stadig, men AI-sæt gemmes i browserens LocalStorage, og brugeren får tydelig besked herom.

## Fejlhåndtering
- Alle server-endpoints returnerer JSON-fejlmeddelelser på dansk uden følsomme oplysninger.
- Typiske SSL-/CA-fejl resulterer i beskeden “CA-bundle blev ikke fundet. Upload cacert-filen til Config-mappen.”

## Udvikling
- Ingen build-trin er nødvendige. HTML, CSS og JS er statiske filer.
- Systemet bruger simple ES-moduler (`router.js` og `app.js`).
