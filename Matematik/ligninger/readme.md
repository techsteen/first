# Ligninger & ligningssystemer – Matematik D

Denne webapp er bygget til upload i mappen `/stha/_www2/Matematik/ligninger/`. Den kører helt statisk (HTML/CSS/JS) med én PHP-proxy til LLM-feedback.

## Struktur

```
/Matematik/ligninger/
├── index.html       # UI og indhold (single-page)
├── styles.css       # Tema, typografi og tilgængelighed
├── app.js           # Klientlogik, visualisering, opgaver, progression
├── exercises.json   # 30 opgaver (10 udfyldte, 20 pladsholdere)
├── llm_proxy.php    # Proxy til OpenAI (inkluderer config fra /Config)
└── readme.md        # Denne vejledning
```

Central konfiguration ligger i `/stha/_www2/Config/` og bruges af proxyen:

- `config.php` skal definere `$OPENAI_API_KEY`.
- `cacert-2025-08-12.pem` bruges til cURL (allerede på plads).
- `web.config` må ikke ændres.

## Udrulning

1. Opret mappen `/stha/_www2/Matematik/ligninger/` hvis den ikke findes.
2. Upload alle filer fra denne mappe uændret (bevar relative stier).
3. Sørg for at PHP er aktiveret, så `llm_proxy.php` kan kaldes fra klienten.
4. Bekræft at `config.php` i `/stha/_www2/Config/` indeholder `$OPENAI_API_KEY` og er læsbar for proxyen.

Appen kræver ingen build-processer. Åbn blot `index.html` i browseren (eller via skolens CMS) for at bruge løsningen.

## Funktioner

- **Tutorial** med I Do → We Do → You Do progression, gloser (hover), og direkte links til graf-visualisering.
- **Visualisering** (Canvas) med tastaturnavigerbare skydeknapper, snap-til-heltal, reset og automatisk forklaring af skæringspunkt, parallelle eller sammenfaldende linjer.
- **Simulationer** fra IT-arbejde: cloud-priser, netværksbåndbredde, serverkapacitet, backup-vindue og helpdesk-planlægning – alle med “Vis matematikken bag”.
- **Opgaver**: filterbar liste med 10 færdige opgaver (Rød/Gul/Grøn) og 20 pladsholdere. Feedback gives lokalt og (valgfrit) via LLM-proxy, altid i strukturen “Korrekthed → Hvorfor → Næste skridt”.
- **Fejlbank** og **Progression** (localStorage). Log kan hentes lokalt som CSV.

## Tilføj eller ændr opgaver

1. Åbn `exercises.json` og kopier en pladsholder (felterne `id`, `title`, `prompt`, `type`, `difficulty`, `skills`, `hints`, `expected_solution`, `solution_schema`, `links`).
2. Udfyld felterne:
   - `type`: `"single_equation"`, `"two_equations"` eller `"context"`.
   - `difficulty`: `"R"`, `"G"` eller `"Gr"`.
   - `skills`: liste af strenge til filtrering (fx `"isolering"`, `"grafik"`).
   - `hints`: 2-3 stigende hints.
   - `expected_solution`: tal, tekst eller `[x, y]` afhængigt af schema.
   - `solution_schema`: definér `kind` (`number`, `pair`, `text`) samt evt. `tolerance`, `allowFractions`, `order`.
   - `links`: hver kan pege på tutorial-anker (`#tutorial-...`) eller visualisering via `{ "action": "graph", "graph": { ... } }`.
3. Fjern `"placeholder": true` når opgaven er klar – ellers vises den ikke for eleverne.
4. Validér filen (fx med `python -m json.tool exercises.json`).

## LLM-proxy

`llm_proxy.php` er eneste server-side fil. Den:

- Læser input som JSON via POST.
- Inkluderer `/stha/_www2/Config/config.php` for at hente `$OPENAI_API_KEY`.
- Kalder `https://api.openai.com/v1/responses` med modellen `gpt-4o-mini`, `CURLOPT_SSL_VERIFYPEER=true` og `CURLOPT_CAINFO` pegende på `cacert-2025-08-12.pem`.
- Returnerer **kun** JSON i formatet:
  ```json
  {
    "correct": true,
    "score": 0.0,
    "reason": "kort forklaring",
    "next_step": "næste skridt",
    "detected_skills": ["…"],
    "format_ok": true,
    "hallucination": "pass"
  }
  ```

Hvis LLM ikke kan nås, gives en dansk fejlbesked og lokal evaluering kan stadig bruges.

## Test efter upload

- Åbn `index.html` og navigér gennem tutorial, visualisering og simulationer.
- Løs mindst én opgave fra hvert niveau (R/G/Gr) og verificér feedback + hints.
- Tænd og sluk for LLM-feedback for at sikre at `llm_proxy.php` svarer med JSON.
- Kontrollér at progressionen opdateres og kan nulstilles.
