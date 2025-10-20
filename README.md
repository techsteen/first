# Skakbræt Simulator

En selvstændig webapplikation til at træne grundlæggende programmering på et skakbræt-lignende bræt. Simulatoren genererer seks niveauer med tre opgaver i hver via OpenAI og giver eleverne en indbygget editor til at køre deres løsninger direkte i browseren.

## Teknologi
- PHP-fil som entry point (`index.php`) – kan uploades til simple webhoteller.
- HTML, CSS og JavaScript uden eksterne afhængigheder.

## Funktioner
- Visuel simulator med robot, startfelt, mål, checkpoints og forhindringer.
- Seks niveauer med tre opgaver i hver (18 i alt). Niveau 3 har synlige forhindringer, mens de højere niveauer kan afsløre skjulte blokeringer under kørslen.
- Opgaver hentes dynamisk fra OpenAI via `api/tasks.php`; et komplet sæt fallback-opgaver med samme struktur er indbygget til offline-brug.
- Eleverne kan vælge at kode i C eller PowerShell; koden oversættes automatisk til simulatoren.
- Før programmet kører, sendes koden til `api/validate.php`, der bruger OpenAI til at simulere en compiler og stopper kørslen ved syntaksfejl.
- Kommandoerne `frem()`, `venstre()`, `højre()` og `blokering(...)` er tilgængelige for eleverne og dokumenteres dynamisk ud fra det valgte sprog.
- Log over alle udførte kommandoer samt resultater fra `blokering()`.
- Shift + klik på **Nulstil** gendanner startkoden for den aktuelle opgave.

## Opsætning
1. Sørg for at din server har en delt konfiguration (fx `../Config/config.php`) med felterne `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE`, `TIMEOUT` og evt. `CA_BUNDLE`.
   - Alternativt kan du angive en fuld sti til konfigurationen via miljøvariablen `SIMULATOR_CONFIG_PATH`.
2. Upload hele mappen til din server.
3. Sørg for at certificeringsfilen matcher stien i konfigurationen.
4. Åbn `index.php` i browseren.

> **Bemærk:** Hvis API-kaldene mislykkes (f.eks. offline), anvendes fallback-opgaverne, og koden kører uden server-side validering, men brugeren informeres i loggen.
