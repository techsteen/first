<?php
$types = [
    'C#' => [
        [
            'name' => 'int',
            'description' => 'Heltal anvendt til tællinger og loops.',
            'example' => 'int antalElever = 24;'
        ],
        [
            'name' => 'double',
            'description' => 'Flydende tal til målinger og procentberegninger.',
            'example' => 'double gennemsnit = 12.7;'
        ],
        [
            'name' => 'string',
            'description' => 'Tekststrenge til navne, beskeder og input.',
            'example' => 'string navn = "Ada";'
        ],
        [
            'name' => 'bool',
            'description' => 'Sand/falsk værdier til betingelser.',
            'example' => 'bool harBestaaet = true;'
        ],
    ],
    'PowerShell' => [
        [
            'name' => '[int]',
            'description' => 'Heltalsværdier, f.eks. til antal filer.',
            'example' => '$antalFiler = [int]24'
        ],
        [
            'name' => '[double]',
            'description' => 'Decimalværdier til præcise beregninger.',
            'example' => '$temperatur = [double]21.5'
        ],
        [
            'name' => '[string]',
            'description' => 'Tekststrenge til stier, navne og status.',
            'example' => '$brugernavn = [string]"Lise"'
        ],
        [
            'name' => '[bool]',
            'description' => 'Sand/falsk til tilstandsvariabler.',
            'example' => '$erAktiv = [bool]$true'
        ],
    ],
];

$tutorialSteps = [
    [
        'title' => '1. Start med begrebet variabel',
        'content' => 'En variabel er en navngivet beholder for data. Vi bruger den til at gemme værdier, vi skal arbejde med senere.'
    ],
    [
        'title' => '2. Forstå typer',
        'content' => 'Typer beskriver hvilken slags data beholderen rummer. Det hjælper computeren med at forhindre fejl og optimere hukommelse.'
    ],
    [
        'title' => '3. Syntaks i C# og PowerShell',
        'content' => 'Hvert sprog har sin måde at definere typer på. C# bruger typer før variabelnavnet, mens PowerShell bruger type-notation foran værdien.'
    ],
    [
        'title' => '4. Kontroller dine værdier',
        'content' => 'Vælg en type, der passer til den værdi, du vil gemme. Et heltal kan ikke indeholde tekst, og en boolsk værdi kan kun være sand eller falsk.'
    ],
];

$assignments = [
    [
        'title' => 'Elev-opgave: Budgetplan',
        'description' => 'Lav variabler til budgetposter i C#: heltal for antal elever, double for pris per elev, string for projektnavn og bool for om budgettet er godkendt.'
    ],
    [
        'title' => 'Elev-opgave: Backup-script',
        'description' => 'Skriv PowerShell-variabler der beskriver: antal filer (int), destinationsmappe (string), sidste kørselstidspunkt (string) og om sidste kørsel lykkedes (bool).'
    ],
    [
        'title' => 'Elev-opgave: Energimåling',
        'description' => 'Vælg passende typer i begge sprog for at registrere kWh, målernavn og en status for om målingen er indenfor normalområdet.'
    ],
];
?>
<!DOCTYPE html>
<html lang="da">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TypeMaster - Simuleringslaboratorium</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <header class="hero">
        <div class="hero__content">
            <h1>TypeMaster</h1>
            <p>Lær at tænke som en udvikler: forstå variabler, datatyper og hvorfor de er fundamentet i C# og PowerShell.</p>
            <a class="cta" href="#simulator">Start simuleringen</a>
        </div>
        <div class="hero__visual" aria-hidden="true">
            <div class="matrix">
                <span>0100</span><span>0110</span><span>1010</span><span>1100</span>
                <span>TYPE</span><span>BOOL</span><span>INT</span><span>STRING</span>
            </div>
        </div>
    </header>

    <main>
        <section class="why">
            <h2>Hvorfor er typer vigtige?</h2>
            <div class="why__grid">
                <article>
                    <h3>Forhindrer fejl</h3>
                    <p>Typer sikrer, at du ikke forsøger at lægge tekst sammen med tal. De fungerer som sikkerhedsnet.</p>
                </article>
                <article>
                    <h3>Gør kode læsbar</h3>
                    <p>Når du vælger den rigtige type, fortæller du andre (og dig selv) hvad værdien repræsenterer.</p>
                </article>
                <article>
                    <h3>Optimerer programmer</h3>
                    <p>Typer hjælper computeren med at bruge ressourcerne effektivt og gøre dit program hurtigere.</p>
                </article>
            </div>
        </section>

        <section class="type-explorer">
            <div class="section-header">
                <h2>Udforsk typer</h2>
                <div class="language-switch">
                    <button class="language-switch__btn" data-language="C#">C#</button>
                    <button class="language-switch__btn" data-language="PowerShell">PowerShell</button>
                </div>
            </div>
            <p>Vælg et sprog for at se de mest brugte typer og hvordan du skriver dem.</p>
            <div class="type-cards" id="typeCards">
                <?php foreach ($types as $language => $entries): ?>
                    <?php foreach ($entries as $entry): ?>
                        <article class="type-card" data-language="<?= $language ?>">
                            <h3><?= $entry['name'] ?></h3>
                            <p><?= $entry['description'] ?></p>
                            <code><?= $entry['example'] ?></code>
                        </article>
                    <?php endforeach; ?>
                <?php endforeach; ?>
            </div>
        </section>

        <section class="tutorial">
            <h2>Guidet tutorial</h2>
            <p>Følg disse skridt og brug notesektionen til at skrive dine egne eksempler.</p>
            <div class="timeline">
                <?php foreach ($tutorialSteps as $step): ?>
                    <article class="timeline__item">
                        <h3><?= $step['title'] ?></h3>
                        <p><?= $step['content'] ?></p>
                    </article>
                <?php endforeach; ?>
            </div>
            <textarea id="notes" placeholder="Skriv dine noter og eksempler her..."></textarea>
        </section>

        <section class="simulator" id="simulator">
            <h2>Simuleringsværksted</h2>
            <p>Konstruer din variabel og få direkte feedback.</p>
            <form id="simulatorForm" class="simulator__form">
                <label>
                    Sprog
                    <select name="language" id="simLanguage">
                        <?php foreach (array_keys($types) as $language): ?>
                            <option value="<?= $language ?>"><?= $language ?></option>
                        <?php endforeach; ?>
                    </select>
                </label>
                <label>
                    Type
                    <select name="type" id="simType"></select>
                </label>
                <label>
                    Variabelnavn
                    <input type="text" id="simName" placeholder="fx antalElever" required>
                </label>
                <label>
                    Værdi
                    <input type="text" id="simValue" placeholder="fx 24" required>
                </label>
                <button type="submit">Tjek min variabel</button>
            </form>
            <div id="simulatorOutput" class="simulator__output" aria-live="polite"></div>
        </section>

        <section class="assignments">
            <h2>Øvelser og opgaver</h2>
            <div class="assignments__grid">
                <?php foreach ($assignments as $assignment): ?>
                    <article class="assignment">
                        <h3><?= $assignment['title'] ?></h3>
                        <p><?= $assignment['description'] ?></p>
                    </article>
                <?php endforeach; ?>
            </div>
        </section>

        <section class="quiz">
            <h2>Quiz: Kan du vælge den rette type?</h2>
            <p>Svar på spørgsmålene for at teste din forståelse. Din score vises nederst.</p>
            <div id="quizContainer" class="quiz__container"></div>
            <button id="submitQuiz">Aflever svar</button>
            <p id="quizResult" class="quiz__result" aria-live="polite"></p>
        </section>
    </main>

    <footer class="footer">
        <p>Skabt til undervisning i datatyper &mdash; TypeMaster laboratoriet.</p>
    </footer>

    <script>
        window.typeData = <?php echo json_encode($types, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?>;
    </script>
    <script src="assets/js/main.js"></script>
</body>
</html>
