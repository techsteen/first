# Windows Server AD-DS Tutorial (GF2 EUD Data)

Dette repository indeholder en PHP-baseret prototype for et undervisningssite, der kombinerer teori,
praksis, simuleringer og support til GF2 EUD Data-elever. Første iteration fokuserer på
framework- og wireframe-beskrivelser samt en teknisk struktur, der gør det let at udvide med
modulindhold, reallife-opgaver og integration til den fælles ChatGPT API.

## Struktur

```
index.php                # Entry point med sektioner for framework, wireframe mv.
partials/                # Header, navigation og footer komponenter
pages/                   # Indholdssider opdelt efter tema
assets/css/styles.css    # Global styling
assets/js/               # Basisfunktioner + chat-assist stub til API-integration
```

## Næste skridt

- Tilføj modul-filer i `pages/modules/` med konkrete aktiviteter og simuleringer.
- Forbind `assets/js/chat-assist.js` til den fælles ChatGPT API-klient.
- Udfyld ressourcebiblioteket med lærervejledninger, elevmaterialer og scripts.
