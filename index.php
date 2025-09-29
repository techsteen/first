<?php

$exercises = [
    [
        'id' => 1,
        'title' => 'Find 25% af 160',
        'question' => 'Hvad er 25% af 160?',
        'solution' => 40,
        'explanation' => 'Omsæt procenten til et decimaltal (0,25) og gang med grundtallet.',
        'hint' => 'Del 160 i fire lige store felter: [ ][ ][ ][ ]. 25% betyder én ud af fire felter. Hvordan finder du tallet til ét felt?',
        'response_type' => 'numeric',
    ],
    [
        'id' => 2,
        'title' => 'Beregn pris efter rabat',
        'question' => 'En trøje koster 300 kr., og der er 15% rabat. Hvad bliver prisen efter rabat?',
        'solution' => 255,
        'explanation' => 'Når du får rabat, betaler du resten af 100%, altså 85% af prisen.',
        'hint' => 'Tegn en 100%-bjælke og markér 15% som rabat. Hvilket tal svarer til den del af bjælken, du stadig skal betale?',
        'response_type' => 'numeric',
    ],
    [
        'id' => 3,
        'title' => 'Procentdel af klasse',
        'question' => 'Der er 24 elever i en klasse, og 6 af dem har fødselsdag i marts. Hvor mange procent er det?',
        'solution' => 25,
        'explanation' => 'Find brøken 6/24 og omregn den til procent ved at gange med 100.',
        'hint' => 'Byg et søjlediagram med 24 felter og farv seks. Hvordan kan du udtrykke den farvede del som procent?',
        'response_type' => 'numeric',
    ],
    [
        'id' => 4,
        'title' => 'Forøgelse med procent',
        'question' => 'En cykel koster 2.800 kr. og stiger med 12%. Hvad er den nye pris?',
        'solution' => 3136,
        'explanation' => 'Ved stigning ganger du grundtallet med (1 + procenten i decimalform).',
        'hint' => 'Skitser en pil fra 100% til 112%. Den ekstra pil repræsenterer 12% af 2.800 kr. Hvordan lægger du den ovenpå det oprindelige beløb?',
        'response_type' => 'numeric',
    ],
    [
        'id' => 5,
        'title' => 'Procentvis ændring',
        'question' => 'En plante voksede fra 40 cm til 46 cm. Hvor mange procent voksede den?',
        'solution' => 15,
        'explanation' => 'Find forskellen og sammenlign med udgangspunktet før du ganger med 100.',
        'hint' => 'Tegn en søjle på 40 cm og tilføj en top, så den når 46 cm. Hvilken brøkdel udgør toppen af den oprindelige søjle?',
        'response_type' => 'numeric',
    ],
    [
        'id' => 6,
        'title' => 'Skat af løn',
        'question' => 'Din løn er 12.500 kr., og du betaler 37% i skat. Hvor meget betaler du i skat?',
        'solution' => 4625,
        'explanation' => 'Skatten findes ved at gange lønnen med 0,37.',
        'hint' => 'Forestil dig 100% af lønnen som en stak sedler. Hvis du farver 37% af sedlerne, hvor stor er den farvede stak?',
        'response_type' => 'numeric',
    ],
    [
        'id' => 7,
        'title' => 'Procentdel som brøk',
        'question' => 'Hvilken brøk svarer til 40%? Skriv svaret som forkortet brøk.',
        'solution' => '2/5',
        'explanation' => 'Skriv procenten som hundrede-del og forkort brøken.',
        'hint' => 'Tegn et 10x10 gitter med 100 felter og farv 40. Hvordan kan du skrive den farvede del som en brøk, der er så enkel som muligt?',
        'response_type' => 'numeric',
    ],
    [
        'id' => 8,
        'title' => 'Find hele tallet',
        'question' => '15% svarer til 18 kr. Hvad er det hele beløb?',
        'solution' => 120,
        'explanation' => 'Brug forholdet del/helhed og divider med procentdelen for at finde grundtallet.',
        'hint' => 'Forestil dig en cirkel hvor 15% er markeret. Hvis den markerede del er 18 kr., hvordan kan du skalere til hele cirklen?',
        'response_type' => 'numeric',
    ],
    [
        'id' => 9,
        'title' => 'Rabatslagteren',
        'question' => 'Et kilo oksekød koster 110 kr., men der er 20% rabat. Hvor meget sparer du?',
        'solution' => 22,
        'explanation' => 'Rabatten er procentdelen gange grundbeløbet.',
        'hint' => 'Del 110 kr. i fem lige store bunker, da 20% er en femtedel. Hvor meget ligger der i én bunke?',
        'response_type' => 'numeric',
    ],
    [
        'id' => 10,
        'title' => 'Momsregning',
        'question' => 'En vare uden moms koster 450 kr. Momsen er 25%. Hvad er prisen inkl. moms?',
        'solution' => 562.5,
        'explanation' => 'Ved moms lægger du 25% oven i ved at gange grundtallet med 1,25.',
        'hint' => 'Tegn en stak på 100% og læg et ekstra lag på 25%. Hvordan ser den samlede højde ud i forhold til den oprindelige?',
        'response_type' => 'numeric',
    ],
    [
        'id' => 11,
        'title' => 'Tilbagegang',
        'question' => 'En by havde 18.000 indbyggere, men tallet falder med 4%. Hvor mange er der nu?',
        'solution' => 17280,
        'explanation' => 'Et fald på 4% betyder, at du finder 96% af udgangspunktet.',
        'hint' => 'Placér 100 prikker for indbyggere og kryds fire ud. Hvordan omsætter du de resterende prikker til antal personer?',
        'response_type' => 'numeric',
    ],
    [
        'id' => 12,
        'title' => 'Opsparing',
        'question' => 'Du sætter 5.000 kr. ind på en konto med 3% årlig rente. Hvor mange penge er der efter ét år?',
        'solution' => 5150,
        'explanation' => 'Værdien efter et år er grundtallet ganget med 1,03.',
        'hint' => 'Tænk på en sparegris der vokser med 3%. Hvilke to tal ganger du for at lægge renten oveni?',
        'response_type' => 'numeric',
    ],
    [
        'id' => 13,
        'title' => 'Delvist salg',
        'question' => 'En butik sælger 65% af sit lager på udsalg. Hvis der var 200 varer, hvor mange solgte de?',
        'solution' => 130,
        'explanation' => 'Gang 200 med 0,65 for at finde mængden der forsvinder fra hylden.',
        'hint' => 'Vis lageret som 100%. Farv 65% og tænk over, hvad den del repræsenterer ud af 200 varer.',
        'response_type' => 'numeric',
    ],
    [
        'id' => 14,
        'title' => 'Find procentdelen',
        'question' => 'En elev fik 18 ud af 24 rigtige. Hvor mange procent er det?',
        'solution' => 75,
        'explanation' => 'Divider del med helhed og gang med 100 for at få procent.',
        'hint' => 'Lav en brøk med 18 som tæller og 24 som nævner. Hvordan ændrer du den brøk til procent?',
        'response_type' => 'numeric',
    ],
    [
        'id' => 15,
        'title' => 'Prisforhøjelse',
        'question' => 'En bog stiger fra 250 kr. til 280 kr. Hvor stor er prisstigningen i procent?',
        'solution' => 12,
        'explanation' => 'Beregn forskellen og sammenlign med den oprindelige pris før du omregner til procent.',
        'hint' => 'Sammenlign de to søjler 250 og 280. Hvor stor en del er “toppen”, når du sætter den i forhold til udgangspunktet?',
        'response_type' => 'numeric',
    ],
    [
        'id' => 16,
        'title' => 'Del af en tid',
        'question' => 'Du har 90 minutter til en prøve og bruger 54 minutter. Hvor mange procent af tiden brugte du?',
        'solution' => 60,
        'explanation' => 'Brug forholdet brugt tid / total tid og gang med 100.',
        'hint' => 'Tegn et ur opdelt i 90 dele og markér 54. Hvilken brøk får du, og hvad bliver den som procent?',
        'response_type' => 'numeric',
    ],
    [
        'id' => 17,
        'title' => 'Blandingsforhold',
        'question' => 'En saftblanding består af 35% sirup. Hvis du har 2 liter blanding, hvor meget er sirup?',
        'solution' => 0.7,
        'explanation' => 'Multiplicer totalmængden med procenten i decimalform.',
        'hint' => 'Forestil dig en kande med 2 liter. Markér omtrent en tredjedel som sirup. Hvilket regnestykke giver præcis mængde?',
        'response_type' => 'numeric',
    ],
    [
        'id' => 18,
        'title' => 'Procentpoint',
        'question' => 'Et hold forbedrer deres korrektprocent fra 68% til 80%. Hvor mange procentpoint er forbedringen?',
        'solution' => 12,
        'explanation' => 'Procentpoint er forskellen mellem to procenttal.',
        'hint' => 'Placer to markører på en procenttallinje ved 68 og 80. Hvor mange trin skal markøren flyttes for at gå fra den første til den anden?',
        'response_type' => 'numeric',
    ],
    [
        'id' => 19,
        'title' => 'Merværdi',
        'question' => 'Et produkt stiger fra 400 kr. til 500 kr. Hvor stor er stigningen i procent?',
        'solution' => 25,
        'explanation' => 'Find forskellen mellem priserne og sæt den i forhold til startprisen.',
        'hint' => 'Tegn to prisbjælker og fremhæv den ekstra del. Hvilket regnestykke viser forholdet mellem tillægget og den oprindelige pris?',
        'response_type' => 'numeric',
    ],
    [
        'id' => 20,
        'title' => 'Restlager',
        'question' => 'En butik har 450 varer. De sælger 72%. Hvor mange varer har de tilbage?',
        'solution' => 126,
        'explanation' => 'Find først hvor mange der sælges, og træk derefter fra den oprindelige mængde.',
        'hint' => 'Del lageret op i 100%. Farv 72% som solgt og se på de hvide felter. Hvad repræsenterer de resterende procent i faktiske varer?',
        'response_type' => 'numeric',
    ],
    [
        'id' => 21,
        'title' => 'Forklar pris efter rabat',
        'question' => 'Forklar med egne ord, hvordan du finder prisen efter 18% rabat på en vare til 450 kr.',
        'solution' => 'En god forklaring viser, at du arbejder ud fra 100%, trækker 18% fra så der er 82% tilbage, og ganger 450 med 0,82 (eller 82/100) for at finde den nye pris.',
        'explanation' => 'Fremhæv begreberne grundtal, procentdel og sammenhængen mellem rabat og betaling.',
        'hint' => 'Tegn en bjælke fra 0 til 100% og fjern et stykke på 18%. Hvilke trin skal du beskrive for at gå fra hele bjælken til den del kunden betaler?',
        'response_type' => 'explanation',
    ],
    [
        'id' => 22,
        'title' => 'Beskriv procentvis vækst',
        'question' => 'Skriv en tekst til en klassekammerat, der forklarer hvordan man beregner procentvis vækst fra 48 til 60.',
        'solution' => 'Forklaringen skal nævne forskellen på 12, sætte den i forhold til startværdien 48 og derefter gange med 100 for at få procentvis vækst.',
        'explanation' => 'Vis sammenhængen mellem ændring, grundtal og procentregning.',
        'hint' => 'Lav to søjler på 48 og 60 og markér forskellen. Hvilke ord og regnetrin skal du beskrive for at vise væksten i procent?',
        'response_type' => 'explanation',
    ],
    [
        'id' => 23,
        'title' => 'Fra brøk til procent',
        'question' => 'Hvordan vil du forklare, at brøken 3/20 svarer til en bestemt procent?',
        'solution' => 'Beskriv at man dividerer 3 med 20 for at få et decimaltal og derefter ganger med 100 for at få procent. Alternativt kan man udvide til 15/100.',
        'explanation' => 'Giv plads til både decimaltal og udvidelse af brøker.',
        'hint' => 'Tegn en kage delt i 20 stykker og farv tre. Hvordan kan du få kagen omdannet til 100 dele i din forklaring?',
        'response_type' => 'explanation',
    ],
    [
        'id' => 24,
        'title' => 'Forklar hvad 120% betyder',
        'question' => 'Skriv en kort forklaring til en elev om, hvad det vil sige at noget er 120% af et tal.',
        'solution' => 'Forklar at 100% er hele tallet, og 20% er et ekstra lag. Fremhæv at man derfor har hele tallet plus 0,20 gange tallet (eller 20% oveni).',
        'explanation' => 'Vis at procent over 100 handler om at lægge ekstra ovenpå grundtallet.',
        'hint' => 'Tegn en rektangel for 100% og læg et lille ekstra rektangel på 20%. Hvilke ord skal du bruge for at få det til at give mening?',
        'response_type' => 'explanation',
    ],
    [
        'id' => 25,
        'title' => 'Find grundtal ud fra procentdel',
        'question' => 'Beskriv trinnene til at finde grundtallet, når 12% svarer til 30.',
        'solution' => 'En korrekt forklaring nævner, at man ser 12% som 0,12 og dividerer 30 med 0,12 for at få hele mængden, eller bruger forholdet 30/12 = x/100.',
        'explanation' => 'Fokusér på at gå fra del til helhed via procentforhold.',
        'hint' => 'Skitsér en cirkel hvor et lille stykke på 12% er kendt til 30. Hvordan beskriver du vejen fra det stykke til hele cirklen?',
        'response_type' => 'explanation',
    ],
    [
        'id' => 26,
        'title' => 'Procent vs. procentpoint',
        'question' => 'Forklar forskellen på at sige “stiger med 6%” og “stiger med 6 procentpoint”.',
        'solution' => 'Forklaringen skal vise, at procent handler om forhold til den aktuelle værdi, mens procentpoint er forskellen mellem to procenttal på en skala fra 0 til 100.',
        'explanation' => 'Brug eksempler med fx karakterprocenter for at tydeliggøre forskellen.',
        'hint' => 'Tegn en tallinje fra 0 til 100 og markér to procenter. Hvilke ord kan du bruge til at forklare forskellen mellem afstand og relativ ændring?',
        'response_type' => 'explanation',
    ],
    [
        'id' => 27,
        'title' => 'Momsens logik',
        'question' => 'Skriv en forklaring på, hvorfor man kan gange med 1,25 for at lægge 25% moms til.',
        'solution' => 'En præcis forklaring viser, at 1 repræsenterer hele prisen og 0,25 er de ekstra 25%, så 1 + 0,25 = 1,25 multipliceres med grundbeløbet.',
        'explanation' => 'Fremhæv sammenhængen mellem 100% som 1 og tillæg i decimaler.',
        'hint' => 'Vis prisen som en søjle på 1 enhed og tegn et tillæg på 0,25. Hvordan beskriver du, at begge dele findes i samme multiplikation?',
        'response_type' => 'explanation',
    ],
    [
        'id' => 28,
        'title' => 'Kontrollér et procentresultat',
        'question' => 'Forklar en strategi til at tjekke, om et procentregnestykke giver mening.',
        'solution' => 'Eleven bør beskrive at sammenligne resultatet med grundtallet, overveje om svaret bør være større eller mindre, og måske lave et overslag eller tegning for at kontrollere.',
        'explanation' => 'Læg vægt på fejlkontrol og overslag.',
        'hint' => 'Lav en huskeliste med spørgsmål som “er svaret rimeligt?”. Hvilke kontroltrin vil du nævne?',
        'response_type' => 'explanation',
    ],
    [
        'id' => 29,
        'title' => 'Cirkeldiagram med procent',
        'question' => 'Fortæl hvordan du vil forklare at 40% svarer til en bestemt vinkel i et cirkeldiagram.',
        'solution' => 'Forklaringen skal forbinde de 360° i en cirkel med procent, fx ved at tage 40% af 360° eller dele cirklen i ti lige store dele.',
        'explanation' => 'Inddrag sammenhængen mellem procent, brøker og grader.',
        'hint' => 'Tegn en pizza med 10 lige store slices. Hvilke ord bruger du for at få koblingen mellem slices, procent og grader til at give mening?',
        'response_type' => 'explanation',
    ],
    [
        'id' => 30,
        'title' => 'Forklar sammensat rente',
        'question' => 'Skriv en forklaring til en yngre elev om, hvordan sammensat rente på 5% virker over tre år.',
        'solution' => 'Forklar at hvert år lægges 5% til den nye saldo, så man ganger med 1,05 flere gange: første år giver 1,05, næste år ganges igen med 1,05 osv., fordi renten også beregnes af den tidligere rente.',
        'explanation' => 'Vis tydeligt at renten lægges til år for år og påvirker næste beregning.',
        'hint' => 'Tegn tre kasser på række med en pil der siger “+5%” mellem dem. Hvilke trin skal du beskrive for at vise at beløbet vokser på baggrund af det forrige år?',
        'response_type' => 'explanation',
    ],
];
?>
<!DOCTYPE html>
<html lang="da">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Procentregningstræning</title>
    <link rel="stylesheet" href="assets/styles.css">
</head>
<body>
    <header class="hero">
        <div class="hero-content">
            <h1>Bliv stærk i procentregning</h1>
            <p>Start med en rolig gennemgang, og prøv derefter kræfter med 30 øvelser. Du kan altid få hints, AI-tutorial og feedback på dine svar.</p>
            <a class="cta" href="#exercise-list">Hop til øvelserne</a>
        </div>
    </header>

    <main class="layout">
        <section class="tutorial">
            <h2>1. Hvad er procent?</h2>
            <p>Procent betyder <em>per hundrede</em>. Når du ser 25%, betyder det 25 ud af 100. Vi bruger procenter til at beskrive andele, rabatter, stigninger og fald.</p>
            <h3>2. Tre nøgler til procentregning</h3>
            <ol>
                <li><strong>Grundtal</strong> – det tal du tager procenten af.</li>
                <li><strong>Procentdel</strong> – hvor stor en del i procent.</li>
                <li><strong>Resultat</strong> – svaret du finder ved at kombinere de to første.</li>
            </ol>
            <h3>3. Sådan regner du procent</h3>
            <ul>
                <li>Omregn procent til decimaltal: divider med 100.</li>
                <li>Gang grundtallet med decimaltallet for at finde procentdelen.</li>
                <li>For at finde procentdelen ud fra to tal: divider del med helhed og gang med 100.</li>
                <li>Ved stigninger/fald: gang med (1 ± procenten i decimalform).</li>
            </ul>
            <h3>4. Huskeregler</h3>
            <p>Brug altid enheder: kroner, elever, grader. Tjek om svaret giver mening. Hvis du får en højere værdi end grundtallet ved rabat, er noget galt.</p>
        </section>

        <section class="exercises" id="exercise-list">
            <h2>Øvelser</h2>
            <p>Vælg en opgave for at åbne den i et stort vindue. Du kan altid lukke igen på <strong>X</strong>.</p>
            <div class="exercise-grid">
                <?php foreach ($exercises as $exercise): ?>
                    <button class="exercise-card" data-exercise='<?php echo json_encode($exercise, JSON_HEX_APOS | JSON_HEX_TAG); ?>'>
                        <span class="exercise-number">Opgave <?php echo $exercise['id']; ?></span>
                        <span class="exercise-title"><?php echo htmlspecialchars($exercise['title'], ENT_QUOTES, 'UTF-8'); ?></span>
                    </button>
                <?php endforeach; ?>
            </div>
        </section>
    </main>

    <div id="exercise-modal" class="modal hidden">
        <div class="modal-content">
            <button class="close-modal" aria-label="Luk opgave">×</button>
            <div class="modal-body">
                <h2 id="modal-title"></h2>
                <p id="modal-question"></p>
                <form id="answer-form">
                    <label for="answer-input" id="answer-label">Dit svar:</label>
                    <input type="text" id="answer-input" name="answer" autocomplete="off" required>
                    <textarea id="answer-text" name="answer-text" class="hidden" rows="5" placeholder="Skriv din forklaring her..."></textarea>
                    <div class="form-actions">
                        <button type="submit" class="primary">Send svar</button>
                        <button type="button" id="hint-button" class="secondary">Få AI-hint</button>
                        <button type="button" id="tutorial-button" class="secondary ghost">AI-tutorial</button>
                    </div>
                </form>
                <div id="hint-box" class="hint hidden" aria-live="polite"></div>
                <div id="tutorial-box" class="tutorial-box hidden" aria-live="polite"></div>
                <div id="feedback-box" class="feedback" aria-live="polite"></div>
            </div>
        </div>
    </div>

    <script>
        const exercises = <?php echo json_encode($exercises, JSON_UNESCAPED_UNICODE); ?>;
        const modal = document.getElementById('exercise-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalQuestion = document.getElementById('modal-question');
        const answerInput = document.getElementById('answer-input');
        const answerText = document.getElementById('answer-text');
        const answerLabel = document.getElementById('answer-label');
        const answerForm = document.getElementById('answer-form');
        const feedbackBox = document.getElementById('feedback-box');
        const hintButton = document.getElementById('hint-button');
        const hintBox = document.getElementById('hint-box');
        const tutorialButton = document.getElementById('tutorial-button');
        const tutorialBox = document.getElementById('tutorial-box');
        let activeExercise = null;

        function toggleResponseField(type) {
            if (type === 'explanation') {
                answerInput.classList.add('hidden');
                answerInput.removeAttribute('required');
                answerText.classList.remove('hidden');
                answerText.setAttribute('required', 'required');
                answerLabel.textContent = 'Din forklaring:';
                answerText.value = '';
                answerText.focus();
            } else {
                answerText.classList.add('hidden');
                answerText.removeAttribute('required');
                answerInput.classList.remove('hidden');
                answerInput.setAttribute('required', 'required');
                answerLabel.textContent = 'Dit svar:';
                answerInput.value = '';
                answerInput.focus();
            }
        }

        function openModal(exercise) {
            activeExercise = exercise;
            modalTitle.textContent = `${exercise.id}. ${exercise.title}`;
            modalQuestion.textContent = exercise.question;
            feedbackBox.innerHTML = '';
            feedbackBox.className = 'feedback';
            hintBox.innerHTML = '';
            tutorialBox.innerHTML = '';
            hintBox.classList.add('hidden');
            tutorialBox.classList.add('hidden');
            modal.classList.remove('hidden');
            document.body.classList.add('no-scroll');
            toggleResponseField(exercise.response_type || 'numeric');
        }

        function closeModal() {
            modal.classList.add('hidden');
            document.body.classList.remove('no-scroll');
            activeExercise = null;
        }

        document.querySelectorAll('.exercise-card').forEach(card => {
            card.addEventListener('click', () => {
                const exerciseData = JSON.parse(card.dataset.exercise);
                openModal(exerciseData);
            });
        });

        document.querySelector('.close-modal').addEventListener('click', closeModal);
        modal.addEventListener('click', event => {
            if (event.target === modal) {
                closeModal();
            }
        });

        function getAnswerValue() {
            if (!activeExercise) return '';
            return (activeExercise.response_type === 'explanation') ? answerText.value : answerInput.value;
        }

        answerForm.addEventListener('submit', async event => {
            event.preventDefault();
            if (!activeExercise) return;

            const payload = {
                answer: getAnswerValue(),
                solution: activeExercise.solution,
                explanation: activeExercise.explanation,
                responseType: activeExercise.response_type,
                question: activeExercise.question,
            };

            feedbackBox.textContent = 'AI vurderer dit svar...';
            feedbackBox.className = 'feedback pending';

            try {
                const response = await fetch('feedback.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error('Noget gik galt. Prøv igen.');
                }

                const data = await response.json();
                feedbackBox.innerHTML = '';
                (data.messages || []).forEach(msg => {
                    const p = document.createElement('p');
                    p.textContent = msg;
                    feedbackBox.appendChild(p);
                });

                feedbackBox.className = `feedback ${data.status}`;
            } catch (error) {
                feedbackBox.className = 'feedback error';
                feedbackBox.textContent = error.message;
            }
        });

        async function requestAiSupport(mode) {
            if (!activeExercise) return;

            const targetBox = mode === 'hint' ? hintBox : tutorialBox;
            targetBox.classList.remove('hidden');
            targetBox.innerHTML = '<p>AI tænker...</p>';

            try {
                const response = await fetch('ai_helper.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        mode,
                        exercise: activeExercise
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Ukendt fejl' }));
                    throw new Error(errorData.error || 'Noget gik galt.');
                }

                const data = await response.json();
                targetBox.innerHTML = data.content;
            } catch (error) {
                targetBox.innerHTML = `<p class="error-text">${error.message}</p>`;
            }
        }

        hintButton.addEventListener('click', () => requestAiSupport('hint'));
        tutorialButton.addEventListener('click', () => requestAiSupport('tutorial'));

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeModal();
            }
        });
    </script>
</body>
</html>
