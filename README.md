# Skakbræt Simulator

En selvstændig webapplikation til at træne grundlæggende programmering på et skakbræt-lignende bræt. Simulatoren tilbyder seks niveauer med ti kuraterede opgaver i hver og giver eleverne en indbygget editor til at køre deres løsninger direkte i browseren.

## Teknologi
- PHP-fil som entry point (`index.php`) – kan uploades til simple webhoteller.
- HTML, CSS og JavaScript uden eksterne afhængigheder.

## Funktioner
- Visuel simulator med robot, startfelt, mål, checkpoints og forhindringer.
- Seks niveauer med ti faste opgaver i hver (60 i alt). Niveau 3 har synlige forhindringer, mens højere niveauer kombinerer synlige blokke, checkpoints og avanceret styring.
- Alle opgaver leveres statisk fra `assets/js/tasks.js`, så simulatoren kan køre uden netværksadgang.
- Eleverne kan vælge at kode i C eller PowerShell; koden oversættes automatisk til simulatoren.
- Før programmet kører, sendes koden til `api/validate.php`, der bruger OpenAI til at simulere en compiler og stopper kørslen ved syntaksfejl samt leverer feedback.
- Kommandoerne `frem()`, `venstre()`, `højre()` og `blokering(...)` er tilgængelige for eleverne og dokumenteres dynamisk ud fra det valgte sprog.
- En **Vis hint**-knap viser gradvise hints til den valgte opgave.
- Log over alle udførte kommandoer samt resultater fra `blokering()`.
- Shift + klik på **Nulstil** gendanner startkoden for den aktuelle opgave.

## Opsætning
1. Sørg for at din server har en delt konfiguration (fx `../Config/config.php`) med felterne `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE`, `TIMEOUT` og evt. `CA_BUNDLE`.
   - Alternativt kan du angive en fuld sti til konfigurationen via miljøvariablen `SIMULATOR_CONFIG_PATH`.
2. Upload hele mappen til din server.
3. Sørg for at certificeringsfilen matcher stien i konfigurationen.
4. Åbn `index.php` i browseren.

> **Bemærk:** Hvis OpenAI-valideringen ikke er tilgængelig, kan koden stadig køre i simulatoren, men der vises en fejl i feedback-panelet.
