<article class="section-content training-step" id="trin-gpo" data-section="step3">
    <header class="step-header">
        <h2>Trin 3 · Byg og test GPO-politikker</h2>
        <p>
            Nu kobler du politikker til de OUs du netop designede. Brug GPO-laboratoriet til at vælge de indstillinger,
            der skal gælde for elever og undervisere, og se hvordan linkningen påvirker de forskellige OUs.
        </p>
    </header>

    <section class="gpo-lab" data-gpo-lab>
        <header>
            <h3>Politikbygger</h3>
            <p>Vælg de indstillinger der skal indgå i politikken <strong>Skolelab Baseline</strong>.</p>
        </header>
        <div class="gpo-options">
            <label><input type="checkbox" data-gpo-option="ScreenLock" data-target="Elev-Konti"> Lås skærmen efter 10 min inaktivitet (Elev-Konti)</label>
            <label><input type="checkbox" data-gpo-option="USBBlock" data-target="Elev-PC'er"> Deaktiver USB-lager på elevmaskiner</label>
            <label><input type="checkbox" data-gpo-option="Wallpaper" data-target="Lærer-PC'er"> Fast baggrund med skoleinformation</label>
            <label><input type="checkbox" data-gpo-option="PrinterDeploy" data-target="Printere"> Del netværksprinter automatisk</label>
        </div>
        <div class="gpo-summary">
            <h4>Politikkens indhold</h4>
            <ul data-gpo-summary>
                <li class="placeholder">Ingen indstillinger valgt endnu.</li>
            </ul>
        </div>
    </section>

    <section class="link-sim" data-link-sim>
        <header>
            <h3>Link politikken til OU'er</h3>
            <p>Vælg hvor <em>Skolelab Baseline</em> skal linkes. Simuleringen fortæller hvordan resultaterne bliver.</p>
        </header>
        <div class="link-grid">
            <label class="link-option"><input type="radio" name="gpo-link" value="Elev-Konti"> Link kun til <strong>Elev-Konti</strong></label>
            <label class="link-option"><input type="radio" name="gpo-link" value="Brugere"> Link til <strong>Brugere</strong> (arv til alle underliggende)</label>
            <label class="link-option"><input type="radio" name="gpo-link" value="Enheder"> Link til <strong>Enheder</strong></label>
        </div>
        <div class="link-result" data-link-result>
            <p class="placeholder">Vælg et link for at se effekten.</p>
        </div>
    </section>

    <section class="step-checklist" data-checklist="step3">
        <h3>Progression</h3>
        <label><input type="checkbox" data-track="step3:scope"> Jeg kan forklare forskellen på bruger- og computerpolitikker.</label>
        <label><input type="checkbox" data-track="step3:linking"> Jeg kan beslutte hvor en GPO skal linkes for at ramme de rette OUs.</label>
        <label><input type="checkbox" data-track="step3:troubleshoot"> Jeg kan beskrive hvordan en konflikt mellem GPO'er løses.</label>
    </section>

    <section class="reflection">
        <h3>Refleksion</h3>
        <p>Hvordan kan du teste at USB-blokeringen virker, uden at have fysisk adgang til alle maskiner?</p>
        <textarea name="reflection-step3" rows="4" placeholder="Noter din strategi her..."></textarea>
    </section>
</article>
