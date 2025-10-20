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
        <p>Udforsk robot-programmering gennem fem niveauer og femten udfordringer.</p>
    </header>
    <main class="app-layout">
        <aside class="sidebar">
            <section class="language-section">
                <h2>Vælg sprog</h2>
                <div class="language-options" id="language-options">
                    <label><input type="radio" name="language" value="c" checked> C</label>
                    <label><input type="radio" name="language" value="powershell"> PowerShell</label>
                </div>
                <p class="language-help">Vælg hvilket sprog eleverne skal kode i. Koden bliver oversat, så den kan afvikles i simulatoren.</p>
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
                        <button id="run-btn">Kør program</button>
                        <button id="reset-btn" class="secondary">Nulstil</button>
                    </div>
                    <div class="feedback" id="feedback"></div>
                    <div class="log" id="log"></div>
                </div>
            </div>
        </section>
    </main>
    <footer class="app-footer">
        <p>Simulatoren er designet til at blive uploadet som statiske PHP/HTML/JS/CSS-filer.</p>
    </footer>
    <script src="assets/js/tasks.js"></script>
    <script src="assets/js/app.js"></script>
</body>
</html>
