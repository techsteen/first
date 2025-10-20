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
1. Angiv din OpenAI API-nøgle i en konfigurationsfil:
   - Standard: kopiér `config/config.example.php` til `config/config.php`.
   - Hvis din server allerede har en delt konfiguration (fx `../Config/config.php`), kan den bruges direkte eller stien angives via miljøvariablen `SIMULATOR_CONFIG_PATH`.
2. Upload hele mappen til din server.
3. Sørg for at certificeringsfilen matcher stien i konfigurationen (standard: `cacert-2025-08-12.pem`).
4. Åbn `index.php` i browseren.

> **Bemærk:** Hvis API-kaldene mislykkes (f.eks. offline), anvendes fallback-opgaverne, og koden kører uden server-side validering, men brugeren informeres i loggen.
