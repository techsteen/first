# Opsætning af skjult OpenAI API-nøgle

Projektet benytter PHP-filen `evaluate.php` som proxy til OpenAI. Nøglen skal ligge på serveren, men aldrig sendes til browseren. Sådan gør du:

1. **Placér din nøgle i et server-side config-katalog**  
   Upload en fil med navnet `config.php` eller `config.phg` til dit skjulte konfigurationskatalog (fx et delt `/Config/` to niveauer over denne mappe). Filen skal returnere enten et array eller en ren streng:
   ```php
   <?php
   return [
     'OPENAI_API_KEY' => 'din-hemmelige-nøgle',
     // valgfrit: 'CA_BUNDLE' => __DIR__ . '/cacert.pem',
   ];
   ```
   eller
   ```php
   <?php
   return 'din-hemmelige-nøgle';
   ```
   `evaluate.php` finder automatisk kataloget ved at tjekke `CONFIG_DIR`-miljøvariablen og derefter standardstier som `/Config/` to niveauer oppe. Filerne eksekveres af PHP og kan ikke downloades direkte.

2. **Brug miljøvariabler hvis din host understøtter det**  
   Sæt `OPENAI_API_KEY` (og evt. `CONFIG_DIR`) i dit kontrolpanel eller serveropsætning. `evaluate.php` falder tilbage til miljøvariablen, hvis der ikke findes en config-fil.

> **Vigtigt:** Læg aldrig nøglen i JavaScript, HTML eller andre filer der kan hentes offentligt. Ved at placere nøglen i et server-side config-katalog eller miljøvariabel forbliver den skjult for eleverne.

## Hurtig test (PHPs indbyggede server)

1. Eksporter nøglen i terminalen før du starter serveren:
   ```bash
   export OPENAI_API_KEY="din-hemmelige-nøgle"
   php -S 0.0.0.0:8000
   ```
2. Åbn siden i browseren (fx `http://localhost:8000`). PHP-processen har nu adgang til nøglen, men klienten kan ikke se den.

## Apache

Tilføj nøglen i Apache-konfigurationen (eller en `.htaccess`, hvis `SetEnv` er tilladt):
```apache
SetEnv OPENAI_API_KEY "din-hemmelige-nøgle"
```
Genstart derefter Apache. PHP arver variablen automatisk.

## Nginx + PHP-FPM

Definér nøglen i den `fastcgi_param`, der sendes til PHP-FPM:
```nginx
location / {
    fastcgi_param OPENAI_API_KEY "din-hemmelige-nøgle";
    # øvrige fastcgi-indstillinger
}
```
Efter en reload får PHP adgang til variablen uden at eksponere den offentligt.

## Shared hosting / cPanel

De fleste udbydere har et kontrolpanel til miljøvariabler. Tilføj `OPENAI_API_KEY` dér; så bliver den tilgængelig for PHP, men ikke for besøgende. Alternativt kan du uploade en `config.php` eller `config.phg` med nøglen til dit skjulte konfigurationskatalog.

> **Tip:** Har du problemer med cURL og TLS-certifikater på ældre Windows-servere, kan du gemme en `cacert.pem` i samme konfigurationskatalog. Sæt `'CA_BUNDLE' => __DIR__ . '/cacert.pem'` i config-filen, så bruger `evaluate.php` det certifikat.
