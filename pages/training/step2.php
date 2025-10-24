<article class="section-content training-step" id="trin-ou" data-section="step2">
    <header class="step-header">
        <h2>Trin 2 · Design organisationens OU-struktur</h2>
        <p>
            Når domænet er klar, organiserer du brugere og enheder i en logisk struktur. Brug OU-værkstedet til at
            bygge træet og test derefter din forståelse ved at placere objekter i de rigtige OUs.
        </p>
    </header>

    <section class="ou-lab" data-ou-builder>
        <header>
            <h3>OU-værksted</h3>
            <p>Slå de elementer til, som din skole har brug for. Forhåndsvisningen opdateres automatisk.</p>
        </header>
        <div class="ou-builder-grid">
            <div class="ou-options">
                <h4>Tilgængelige OUs</h4>
                <label><input type="checkbox" data-ou="Elev-PC'er" data-parent="Enheder"> Elev-PC'er</label>
                <label><input type="checkbox" data-ou="Lærer-PC'er" data-parent="Enheder"> Lærer-PC'er</label>
                <label><input type="checkbox" data-ou="Admin-Konti" data-parent="Brugere"> Admin-konti</label>
                <label><input type="checkbox" data-ou="Elev-Konti" data-parent="Brugere"> Elev-konti</label>
                <label><input type="checkbox" data-ou="Printere" data-parent="Enheder"> Printere</label>
                <label><input type="checkbox" data-ou="Klasse-Lokaler" data-parent="Brugere"> Klasse-lokaler (grupper)</label>
                <p class="hint">Tip: Du kan markere flere OUs – træet sorteres automatisk.</p>
            </div>
            <div class="ou-preview">
                <h4>Strukturoverblik</h4>
                <pre data-ou-preview>
Skolelab.local
└── Standard grupper (Security Groups)
└── Brugere
    └── <span class="placeholder">(vælg OUs)</span>
└── Enheder
    └── <span class="placeholder">(vælg OUs)</span>
                </pre>
            </div>
        </div>
    </section>

    <section class="placement-sim" data-placement-sim>
        <header>
            <h3>Placer objekterne</h3>
            <p>Vælg den OU der passer til hvert objekt. Du får direkte feedback.</p>
        </header>
        <div class="placement-grid">
            <div class="placement-row" data-object="Elev-PC-01" data-correct="Elev-PC'er">
                <span class="placement-label">Elev-PC-01</span>
                <select>
                    <option value="">Vælg OU</option>
                    <option>Elev-PC'er</option>
                    <option>Lærer-PC'er</option>
                    <option>Printere</option>
                    <option>Admin-Konti</option>
                </select>
                <span class="placement-feedback" aria-live="polite"></span>
            </div>
            <div class="placement-row" data-object="Lærer-Jesper" data-correct="Lærer-PC'er">
                <span class="placement-label">Lærer-Laptop-Jesper</span>
                <select>
                    <option value="">Vælg OU</option>
                    <option>Elev-PC'er</option>
                    <option>Lærer-PC'er</option>
                    <option>Printere</option>
                    <option>Admin-Konti</option>
                </select>
                <span class="placement-feedback" aria-live="polite"></span>
            </div>
            <div class="placement-row" data-object="Service-Konto" data-correct="Admin-Konti">
                <span class="placement-label">Servicekonto-sqlsvc</span>
                <select>
                    <option value="">Vælg OU</option>
                    <option>Elev-Konti</option>
                    <option>Admin-Konti</option>
                    <option>Klasse-Lokaler</option>
                </select>
                <span class="placement-feedback" aria-live="polite"></span>
            </div>
            <div class="placement-row" data-object="Printer-Lokale3" data-correct="Printere">
                <span class="placement-label">Printer-Lokale3</span>
                <select>
                    <option value="">Vælg OU</option>
                    <option>Printere</option>
                    <option>Elev-PC'er</option>
                    <option>Elev-Konti</option>
                </select>
                <span class="placement-feedback" aria-live="polite"></span>
            </div>
        </div>
        <p class="placement-score" data-placement-score>0 / 4 korrekte</p>
    </section>

    <section class="step-checklist" data-checklist="step2">
        <h3>Progression</h3>
        <label><input type="checkbox" data-track="step2:principles"> Jeg kan forklare forskellen på bruger- og enheds-OUs.</label>
        <label><input type="checkbox" data-track="step2:design"> Jeg kan designe en OU-struktur der matcher skolens setup.</label>
        <label><input type="checkbox" data-track="step2:delegation"> Jeg kan beskrive hvor delegation af rettigheder skal placeres.</label>
    </section>

    <section class="reflection">
        <h3>Refleksion</h3>
        <p>Hvorfor kan det være en fordel at have en separat OU til servicekonti? Skriv et kort svar.</p>
        <textarea name="reflection-step2" rows="4" placeholder="Noter dine argumenter her..."></textarea>
    </section>
</article>
