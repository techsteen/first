<!DOCTYPE html>
<html lang="da">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Skakbræt Simulator</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <header class="app-header">
        <h1>Skakbræt Simulator</h1>
        <p>Udforsk robot-programmering gennem seks niveauer og faste opgaver med AI-baseret feedback.</p>
    </header>
    <main class="app-layout">
        <aside class="sidebar">
            <section class="language-section">
                <h2>Vælg sprog</h2>
                <div class="language-options" id="language-options">
                    <label><input type="radio" name="language" value="csharp" checked> C#</label>
                    <label><input type="radio" name="language" value="powershell"> PowerShell</label>
                </div>
                <p class="language-help">Vælg hvilket sprog eleverne skal kode i. C#-valget bruger en klassisk Main-metode, og simulatoren oversætter koden, så funktioner som frem(), venstre(), højre() og blokering() virker direkte. PowerShell kører som et script.</p>
            </section>
            <section>
                <h2>Niveauer og opgaver</h2>
                <div id="level-selector" class="level-selector"></div>
                <div id="task-list" class="task-list"></div>
            </section>
            <section class="command-reference">
                <h2>Kommandoer</h2>
                <ul id="command-reference"></ul>
            </section>
        </aside>
        <section class="workspace">
            <div class="task-details" id="task-details"></div>
            <div class="board-and-editor">
                <div class="board-container">
                    <div id="board" class="board"></div>
                    <div class="board-legend">
                        <span class="legend-item start">Start</span>
                        <span class="legend-item goal">Mål</span>
                        <span class="legend-item obstacle">Forhindring</span>
                        <span class="legend-item checkpoint">Checkpoint</span>
                    </div>
                </div>
                <div class="editor-container">
                    <label for="code-editor">Din kode</label>
                    <textarea id="code-editor" spellcheck="false"></textarea>
                    <div class="editor-actions">
                        <button id="step-btn" class="secondary">Kør ét skridt</button>
                        <button id="run-btn">Kør program</button>
                        <button id="reset-btn" class="secondary">Nulstil</button>
                        <button id="ai-feedback-btn" class="secondary">AI feedback</button>
                        <button id="hint-btn" class="secondary">Vis hint</button>
                    </div>
                    <div id="hint-output" class="hint-output"></div>
                    <div class="feedback" id="feedback"></div>
                    <div id="ai-feedback-output" class="ai-feedback-output"></div>
                    <div class="log" id="log"></div>
                </div>
            </div>
        </section>
    </main>
    <section class="prompt-debug-section" id="prompt-debug-section">
        <h2>AI prompt (debug)</h2>
        <p class="prompt-debug-help">Her kan du se den seneste prompt, der blev sendt til AI’et for validering eller feedback.</p>
        <pre id="prompt-debug" aria-live="polite">Ingen prompt sendt endnu.</pre>
    </section>
    <footer class="app-footer">
        <p>Simulatoren er designet til at blive uploadet som statiske PHP/HTML/JS/CSS-filer.</p>
    </footer>
    <script src="assets/js/tasks.js"></script>
    <script src="assets/js/app.js"></script>
</body>
</html>
