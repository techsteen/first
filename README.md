# Opsætning af skjult OpenAI API-nøgle

Projektet benytter PHP-filen `evaluate.php` som proxy til OpenAI. Nøglen skal ligge på serveren, men aldrig sendes til browseren. Du har to muligheder:

1. **Config-katalog (nemt, hvis du kun kan uploade filer)** – Kopiér `config/config.example.php` til `config/config.php`, redigér filen og indsæt din rigtige nøgle. Filen bliver eksekveret af PHP, så nøglen kan ikke downloades. Den medfølgende `config/web.config` blokerer direkte HTTP-adgang til kataloget på IIS-baserede webhoteller.
2. **Environment-variabel** – Hvis du kan sætte miljøvariabler på serveren, kan `evaluate.php` fortsat læse `OPENAI_API_KEY` via `getenv()`.

I begge tilfælde forbliver nøglen på serveren og sendes aldrig til klienten.

> Tip: Har du problemer med cURL og TLS-certifikater på ældre Windows-servere, kan du placere en `cacert.pem` i `config/`. `evaluate.php` vælger automatisk filen, eller du kan pege eksplicit på den ved at sætte `'CA_BUNDLE' => 'cacert-2023-08-12.pem'` i `config/config.php`.

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

De fleste udbydere har et kontrolpanel til miljøvariabler. Tilføj `OPENAI_API_KEY` dér; så bliver den tilgængelig for PHP, men ikke for besøgende. Alternativt kan du uploade en `config.php` med nøglen, hvis udbyderen ikke tilbyder miljøvariabler.

> **Vigtigt:** Læg aldrig nøglen i JavaScript, HTML eller filer, der kan downloades fra webroden. Brug i stedet `config.php` (som kun kan eksekveres) eller miljøvariabler, så nøglen forbliver privat på serveren.
