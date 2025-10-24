<article class="section-content">
    <h2>Support &amp; ChatGPT assistance</h2>
    <div class="support-grid">
        <div class="support-card">
            <h3>Sådan får eleverne hjælp</h3>
            <p>
                Elever kan markere tekst eller klikke på <strong>?</strong>-knapperne ud for aktiviteterne og vælge
                <em>"Forklar"</em>. Scriptet i <code>assets/js/chat-assist.js</code> pakker markeringen ned som kontekst og sender
                den til den fælles ChatGPT API. Eleven får et målrettet svar uden at formulere spørgsmålet selv.
            </p>
            <p>
                Assist-knappen følger med ned på siden, og når der er valgt tekst dukker der en mini-menu op, så
                eleverne tydeligt kan se at hjælp er tilgængelig.
            </p>
        </div>
        <div class="support-card">
            <h3>Teknisk integration</h3>
            <ol>
                <li>Importer den fælles API-klient via <code>require_once</code> fra den centrale placering.</li>
                <li>Eksponér klienten globalt som <code>window.gf2ChatClient</code> med metoden <code>explainSelection(data)</code>.</li>
                <li>Frontenden kalder klienten automatisk og viser svaret i sidepanelet.</li>
            </ol>
            <p class="note">Se "anden Codex kode" for den konkrete klientsignatur og autentificering.</p>
        </div>
        <div class="support-card">
            <h3>Underviserens dashboard</h3>
            <p>
                Dashboardet (planlagt) giver indsigt i hvilke emner eleverne oftest spørger om,
                så undervisningen kan tilpasses løbende.
            </p>
        </div>
    </div>
    <p>
        Supportsektionen kan udvides med en FAQ, kontaktoplysninger og korte screencasts. ChatGPT-loggen kan
        eksporteres som CSV, så underviserne kan analysere hvilke emner der efterspørges mest.
    </p>
</article>
