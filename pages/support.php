<article class="section-content">
    <h2>Support &amp; ChatGPT assistance</h2>
    <div class="support-grid">
        <div class="support-card">
            <h3>Sådan får eleverne hjælp</h3>
            <p>
                Elever kan markere tekst, knapper eller områder i simuleringerne og klikke på
                <em>"Forklar"</em>. Scriptet i <code>assets/js/chat-assist.js</code> sender konteksten til den fælles ChatGPT API,
                som returnerer en elevvenlig forklaring. Eleven skal ikke skrive spørgsmålet selv.
            </p>
        </div>
        <div class="support-card">
            <h3>Teknisk integration</h3>
            <ol>
                <li>Importer den fælles API-klient via <code>require_once</code> fra den centrale placering.</li>
                <li>Brug funktionen <code>requestAssistance(selectionData)</code> til at kalde API'et.</li>
                <li>Vis svaret i det dedikerede sidepanel eller modal.</li>
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
        Supportsektionen udvides med FAQ, kontaktoplysninger og hurtige videoer når indholdet er klar.
    </p>
</article>
