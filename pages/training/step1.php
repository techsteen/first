<article class="section-content training-step" id="trin-domæne" data-section="step1">
    <header class="step-header">
        <h2>Trin 1 · Domæne og første Domain Controller</h2>
        <p>
            Du starter med at etablere et helt nyt AD-DS domæne. Følg skridtene i den simulerede PowerShell-konsol,
            og bemærk hvordan serveren forvandles til en domain controller. Marker hvert trin når du føler dig sikker.
        </p>
    </header>

    <section class="simulation" data-sequence-id="dc-build">
        <header>
            <h3>Simuleret installationskonsol</h3>
            <p>Tryk på knapperne i rækkefølge for at køre scripts og se det forventede output.</p>
        </header>
        <ol class="sim-steps">
            <li class="sim-step" data-step-index="0">
                <div class="sim-step-head">
                    <h4>Installer AD DS rollen</h4>
                    <button type="button" class="assist-trigger" data-assist-text="Forklar hvad Install-WindowsFeature AD-Domain-Services gør.">?</button>
                </div>
                <p>Forbered serveren ved at aktivere rollen.</p>
                <button type="button" class="sim-action" data-run-step data-command="Install-WindowsFeature AD-Domain-Services -IncludeManagementTools">Kør kommando</button>
                <pre class="sim-output" aria-live="polite" hidden>
Success Restart Needed Exit Code      Feature Result
------- -------------- ---------      --------------
True    No             Success        {Active Directory Domain Services}
                </pre>
            </li>
            <li class="sim-step" data-step-index="1">
                <div class="sim-step-head">
                    <h4>Opret domæneskoven</h4>
                    <button type="button" class="assist-trigger" data-assist-text="Hvad betyder Install-ADDSForest og hvorfor skal SafeModeAdministratorPassword sættes?">?</button>
                </div>
                <p>Brug cmdleten <code>Install-ADDSForest</code> til at etablere domænet <strong>skolelab.local</strong>.</p>
                <button type="button" class="sim-action" data-run-step data-command="Install-ADDSForest -DomainName skolelab.local -DomainNetbiosName SKOLELAB -SafeModeAdministratorPassword (ConvertTo-SecureString 'Velkomst!23' -AsPlainText -Force) -Force">Kør kommando</button>
                <pre class="sim-output" aria-live="polite" hidden>
The server will be configured as the first domain controller in the forest skolelab.local.
A reboot is required to continue. After restart, sign in with SKOLELAB\\Administrator.
                </pre>
            </li>
            <li class="sim-step" data-step-index="2">
                <div class="sim-step-head">
                    <h4>Valider AD DS sundhed</h4>
                    <button type="button" class="assist-trigger" data-assist-text="Hvordan bruges dcdiag til at kontrollere den nye domænecontroller?">?</button>
                </div>
                <p>Kør <code>dcdiag</code> for at sikre at alle tests består.</p>
                <button type="button" class="sim-action" data-run-step data-command="dcdiag /c">Kør kommando</button>
                <pre class="sim-output" aria-live="polite" hidden>
Directory Server Diagnosis

Performing initial setup:
   * Identified AD Forest.   
   * Verified domain controller services.   

The command completed successfully. Alle kritiske tests bestod.
                </pre>
            </li>
        </ol>
        <p class="sim-status" data-sequence-status>0 / 3 trin gennemført</p>
    </section>

    <section class="step-checklist" data-checklist="step1">
        <h3>Progression</h3>
        <label><input type="checkbox" data-track="step1:roll"> Jeg kan forklare hvilke roller der installeres på serveren.</label>
        <label><input type="checkbox" data-track="step1:forest"> Jeg kan beskrive hvad der sker når domæneskoven oprettes.</label>
        <label><input type="checkbox" data-track="step1:validation"> Jeg kan tolke resultatet af <code>dcdiag</code>.</label>
    </section>

    <section class="reflection">
        <h3>Refleksion</h3>
        <p>Skriv kort hvad der vil ske hvis serveren ikke genstartes efter <code>Install-ADDSForest</code>. Brug svaret når du drøfter med makkeren.</p>
        <textarea name="reflection-step1" rows="4" placeholder="Noter dine observationer her..."></textarea>
    </section>
</article>
