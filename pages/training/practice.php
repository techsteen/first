<article class="section-content training-step" id="trin-praksis" data-section="practice">
    <header class="step-header">
        <h2>Praksislab · Case "Nordby Skole"</h2>
        <p>
            Du er nu tekniker på Nordby Skole. Brug erfaringen fra de tre trin til at færdiggøre opsætningen.
            Arbejd igennem runbooken, og brug knapperne til at markere hvor langt du er nået.
        </p>
    </header>

    <section class="runbook" data-runbook>
        <header>
            <h3>Runbook</h3>
            <p>Tryk på hvert trin for at se detaljer og markér det som færdigt.</p>
        </header>
        <ol>
            <li data-runbook-step="1">
                <button type="button" class="runbook-toggle">1. Opret OU'erne "Elever 2024" og "Support" under Brugere</button>
                <div class="runbook-body" hidden>
                    <p>Brug OU-værkstedet som reference. Husk at bruge højreklik &gt; <em>New &gt; Organizational Unit</em>.</p>
                    <button type="button" class="runbook-complete" data-track="practice:ou">Marker trin som færdigt</button>
                </div>
            </li>
            <li data-runbook-step="2">
                <button type="button" class="runbook-toggle">2. Flyt alle elevmaskiner til OU'en "Elev-PC'er"</button>
                <div class="runbook-body" hidden>
                    <p>Brug <em>Move...</em> i Active Directory Users and Computers. Tjek navngivningen to gange.</p>
                    <button type="button" class="runbook-complete" data-track="practice:move">Marker trin som færdigt</button>
                </div>
            </li>
            <li data-runbook-step="3">
                <button type="button" class="runbook-toggle">3. Link "Skolelab Baseline" til OU'en "Elev-Konti"</button>
                <div class="runbook-body" hidden>
                    <p>Åbn Group Policy Management, højreklik på OU'en og vælg <em>Link an Existing GPO</em>.</p>
                    <button type="button" class="runbook-complete" data-track="practice:gpo">Marker trin som færdigt</button>
                </div>
            </li>
        </ol>
        <p class="runbook-status" data-runbook-status>0 / 3 trin markeret</p>
    </section>

    <section class="practice-log">
        <h3>Log dine valg</h3>
        <p>Notér hvilke udfordringer der opstod, og hvordan du løste dem.</p>
        <textarea name="practice-log" rows="4" placeholder="F.eks. problemer med DNS, GPO-replikering osv."></textarea>
    </section>
</article>
