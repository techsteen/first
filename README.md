# Skakbræt Simulator

En selvstændig webapplikation til at træne grundlæggende programmering på et skakbræt-lignende bræt. Projektet består af fem niveauer med tre opgaver i hver, hvor eleverne kan kode direkte i en indbygget editor og køre deres løsning i browseren.

## Teknologi
- PHP-fil som entry point (`index.php`) – kan uploades til simple webhoteller.
- HTML, CSS og JavaScript uden eksterne afhængigheder.

## Funktioner
- Visuel simulator med robot, startfelt, mål, checkpoints og forhindringer.
- Eleverne kan vælge at kode i C eller PowerShell; koden oversættes automatisk til simulatoren.
- Kommandoerne `frem()`, `venstre()`, `højre()` og `blokering(...)` er tilgængelige for eleverne.
- Kode skabeloner og tips til alle 15 opgaver.
- Skjulte forhindringer, der først vises når programmet køres (fra niveau 3 og opefter).
- Log over alle udførte kommandoer samt resultater fra `blokering()`.
- Shift + klik på **Nulstil** gendanner startkoden for den aktuelle opgave.

## Kom i gang
1. Upload hele mappen til din server.
2. Åbn `index.php` i browseren.
3. Vælg først sprog og derefter et niveau og en opgave, skriv kode og klik på **Kør program**.

Ingen server-side konfiguration er nødvendig.
