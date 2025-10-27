# Skakbræt Simulator

En selvstændig webapplikation til at træne grundlæggende programmering på et skakbræt-lignende bræt. Simulatoren tilbyder seks niveauer med ti kuraterede opgaver i hver og giver eleverne en indbygget editor til at køre deres løsninger direkte i browseren.

## Teknologi
- PHP-fil som entry point (`index.php`) – kan uploades til simple webhoteller.
- HTML, CSS og JavaScript uden eksterne afhængigheder.

## Funktioner
- Visuel simulator med robot, startfelt, mål, checkpoints og forhindringer.
- Seks niveauer med ti faste opgaver i hver (60 i alt). Niveau 3 har synlige forhindringer, mens højere niveauer kombinerer synlige blokke, checkpoints og avanceret styring.
- Alle opgaver leveres statisk fra `assets/js/tasks.js`, så simulatoren kan køre uden netværksadgang.
- Eleverne kan vælge at kode i C# eller PowerShell; koden oversættes automatisk til simulatoren.
  - C#-valget understøtter `class Program` med `static void Main(string[] args)` og kender til `Console.WriteLine(...)`.
- Før programmet kører, sendes koden til `api/validate.php`, der bruger OpenAI til at simulere en compiler. Syntaksfejl blokerer kørslen, mens runtime-advarsler logges, så eleverne stadig kan observere deres program.
- Kommandoerne `frem()`, `venstre()`, `højre()` og `blokering(...)` er tilgængelige for eleverne og dokumenteres dynamisk ud fra det valgte sprog.
- En **Kør ét skridt**-knap lader eleverne afvikle programmet trin for trin og se brættet opdateres mellem hver kommando.
- En **Vis hint**-knap viser gradvise hints til den valgte opgave.
- En **AI feedback**-knap giver valgfri, kontekstuel feedback fra modellen baseret på den nuværende log og position på brættet – uden at afbryde kørslen.
- Log over alle udførte kommandoer samt resultater fra `blokering()`.
- Shift + klik på **Nulstil** gendanner startkoden for den aktuelle opgave.
- C#-skabelonerne viser `static void Main(string[] args)` som entrypoint og kaldes automatisk, så eleverne slipper for at håndtere `int Main()`.

## Opsætning
1. Sørg for at din server har en delt konfiguration (fx `../Config/config.php`) med felterne `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE`, `TIMEOUT` og evt. `CA_BUNDLE`.
   - Alternativt kan du angive en fuld sti til konfigurationen via miljøvariablen `SIMULATOR_CONFIG_PATH`.
2. Upload hele mappen til din server.
3. Sørg for at certificeringsfilen matcher stien i konfigurationen.
4. Åbn `index.php` i browseren.

> **Bemærk:** Hvis OpenAI-valideringen ikke er tilgængelig, kan koden stadig køre i simulatoren, men der vises en fejl i feedback-panelet. AI-feedbackknappen vil i så fald også melde fejl.
