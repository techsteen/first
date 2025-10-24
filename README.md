# Windows Server AD-DS Træningslab (GF2 EUD Data)

Dette repository indeholder et praksisorienteret undervisningssite til GF2 EUD Data-elever. Platformen
fører eleverne trin for trin gennem etablering af et AD-DS domæne, design af OU-strukturer og opsætning af
GPO-politikker. Alt materiale lever på én side med guidede simuleringer, runbooks og refleksionsfelter.

## Struktur

```
index.php                        # Samler alle sektioner: intro, trin 1-3, praksislab og evaluering
partials/                        # Header, navigation og footer
pages/training/                  # Indholdssider for hvert trin og praksiselementer
assets/css/styles.css            # Global styling til laboratoriet og assist-komponenter
assets/js/main.js                # Frontend-logik til simuleringer, runbooks og fremskridt
assets/js/chat-assist.js         # Knytter markeret tekst og ?-triggers til den fælles ChatGPT-klient
resources/                       # Ekstra materiale (kan udvides efter behov)
```

## Funktioner i undervisningsforløbet

- **Simuleret PowerShell**: Eleverne kan køre nøglekommandoer og se forventet output direkte i trin 1.
- **OU-værksted**: Byg organisationstræet, se strukturen opdateres og træn placering af objekter.
- **GPO-lab**: Sammensæt politikker, vælg målgrupper og se hvordan linkning påvirker anvendelsen.
- **Praksis-runbook**: Case-baseret runbook hvor eleverne markerer progression og noterer udfordringer.
- **Mini-quiz**: Opsummerer centrale begreber fra domæne, OU-design og GPO'er.
- **ChatGPT-assistance**: Marker tekst eller brug spørgsmålstegn for at sende kontekstuelle forespørgsler til
  den fælles API-klient.

## ChatGPT-integration

Den fælles klient lever uden for dette projekt. Importér klienten og eksponer den som
`window.gf2ChatClient.explainSelection(data)` for at aktivere hjælpen.

```html
<script src="/path/to/shared-chat-client.js"></script>
<script>
    window.gf2ChatClient = new SharedChatClient({ token: '...' });
</script>
```

## Dataopbevaring i browseren

- Progressionschecklister og runbook-markeringer gemmes i `localStorage` med prefixet `adds-training:`.
- OU-valg og GPO-indstillinger gemmes lokalt, så eleverne kan vende tilbage uden at starte forfra.

## Udvikling

1. Kør `php -S localhost:8000` i projektroden for at se løsningen lokalt.
2. Opdater PHP/HTML-siderne i `pages/training/` for at ændre læringsflowet eller tilføje nye trin.
3. Udvid simuleringerne ved at justere logikken i `assets/js/main.js`.
