# Windows Server AD-DS Tutorial (GF2 EUD Data)

Dette repository indeholder et praksisnært undervisningssite til GF2 EUD Data-elever med fokus på
Windows Server AD-DS, OU-design og GPO'er. Platformen er bygget i PHP/HTML/CSS/JS og kombinerer teori,
simuleringer, reallife-labs og en ChatGPT-assistent der kan give eleverne hjælp uden at de selv skal
formulere spørgsmål.

## Struktur

```
index.php                        # Entry point med sektioner for framework, wireframe, moduler m.m.
partials/                        # Header, navigation og footer komponenter
pages/                           # Indholdssider opdelt efter tema og moduler
  └── modules/                   # Moduldata og dynamisk overview for alle læringsforløb
assets/css/styles.css            # Global styling og modul-/assist-komponenter
assets/js/main.js                # Navigation, modulprogression og lokale data
assets/js/chat-assist.js         # Integration til fælles ChatGPT API (selection + triggers)
resources/                       # Elev- og lærermaterialer samt scripts
```

## Opsætning af ChatGPT assistance

Den fælles API-klient skal importeres ét centralt sted i jeres miljø. Eksponer klienten globalt som
`window.gf2ChatClient` med metoden `explainSelection(data)`, der returnerer en tekstbaseret forklaring.
Frontenden sender automatisk markeringer og `?`-triggers til denne metode og viser resultatet i
assistance-panelet.

```html
<script src="/path/to/shared-chat-client.js"></script>
<script>
    window.gf2ChatClient = new SharedChatClient({ token: '...' });
</script>
```

## Tilpasning

- Redigér moduldata i `pages/modules/modules_data.php` for at tilføje eller opdatere aktiviteter.
- Elev- og lærermaterialer kan opdateres i `resources/` mappen og linkes automatisk i modulet.
- Progressionschecklister gemmes i `localStorage` pr. browser via nøglerne `ws-adds-progress:*`.
