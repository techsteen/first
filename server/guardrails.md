# Guardrails for AI-integration

## Overblik
Dette dokument beskriver de beskyttelsesmekanismer, som `api_evaluate.php` og `api_generate_tasks.php` implementerer for at beskytte elever, nøgler og serveren.

## Principper
- **JSON-only**: Begge endpoints beder eksplicit om JSON-output via `response_format` og validerer svarene.
- **Ingen prompt-læk**: Interne prompts sendes aldrig videre til klienten, og fejlmeddelelser er bevidst generiske.
- **Feedback før løsning**: LLM får direkte instruktioner om først at give feedback. Serveren håndhæver desuden max-forsøg, før løsningen må vises.
- **Domænescope**: Prompterne begrænser output til subnetting/netværksrelateret indhold og forbyder kodegenerering.
- **Rate limit**: Simpelt filbaseret rate-limit pr. IP (evaluate: 10/30 sek., generate: 6/30 sek.).
- **Felthåndtering**: Ukendte felter i input afvises (white-listing).
- **Sikker logging**: Kun anonymiseret metadata (timestamp, route, taskId/resultat) logges til `/data/usage.log`.
- **CA og TLS**: Begge endpoints kræver Config-mappens `cacert-*.pem` og tvinger TLS 1.2.
- **Fallbacks**: Hvis AI-svar ikke kan tolkes, returneres sikre, elevvenlige fejlbeskeder.
