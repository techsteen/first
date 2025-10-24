<article class="section-content training-step" id="trin-evaluering" data-section="evaluation">
    <header class="step-header">
        <h2>Opsamling og selvevaluering</h2>
        <p>
            Afslut forløbet ved at tage mini-quizen. Brug resultatet til at vurdere om du er klar til at udføre
            opgaverne på en rigtig server, eller om du skal genbesøge et trin.
        </p>
    </header>

    <section class="quiz" data-quiz>
        <header>
            <h3>Mini-quiz</h3>
        </header>
        <form>
            <fieldset data-question="1" data-correct="Install-ADDSForest">
                <legend>1. Hvilken kommando bruges til at oprette en helt ny domæneskov?</legend>
                <label><input type="radio" name="q1" value="Install-ADDSForest"> Install-ADDSForest</label>
                <label><input type="radio" name="q1" value="Add-Computer"> Add-Computer</label>
                <label><input type="radio" name="q1" value="New-ADOrganizationalUnit"> New-ADOrganizationalUnit</label>
            </fieldset>
            <fieldset data-question="2" data-correct="Delegation">
                <legend>2. Hvad er hovedformålet med at oprette en dedikeret OU til servicekonti?</legend>
                <label><input type="radio" name="q2" value="Delegation"> At kunne styre rettigheder og GPO'er separat</label>
                <label><input type="radio" name="q2" value="DNS"> At DNS-opsætningen sker automatisk</label>
                <label><input type="radio" name="q2" value="Backup"> At gøre backup hurtigere</label>
            </fieldset>
            <fieldset data-question="3" data-correct="Arv">
                <legend>3. Hvad sker der hvis du linker en GPO til OU'en "Brugere"?</legend>
                <label><input type="radio" name="q3" value="Ingen"> Den påvirker ingen, fordi brugere kun arver fra domænet</label>
                <label><input type="radio" name="q3" value="Arv"> Den arves af alle underliggende bruger-OUs</label>
                <label><input type="radio" name="q3" value="KunAdmin"> Den gælder kun for administratorer</label>
            </fieldset>
            <button type="button" class="quiz-submit">Tjek svar</button>
        </form>
        <p class="quiz-result" data-quiz-result>Resultat vises her.</p>
    </section>

    <section class="next-steps">
        <h3>Næste skridt</h3>
        <ul>
            <li>Vis din runbook til underviseren og diskuter dine refleksioner.</li>
            <li>Planlæg hvilke scripts du vil automatisere til næste lektion.</li>
            <li>Notér spørgsmål til ting du vil have demonstreret på den rigtige server.</li>
        </ul>
    </section>
</article>
