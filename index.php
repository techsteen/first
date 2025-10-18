<?php
?><!DOCTYPE html>
<html lang="da">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ARP Simulator</title>
    <link rel="stylesheet" href="assets/css/styles.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r152/three.min.js" defer></script>
    <script src="assets/js/app.js" defer></script>
</head>
<body>
    <div id="app" class="app">
        <header class="topbar">
            <div class="heading">
                <h1>ARP Simulator</h1>
                <p class="heading-sub">Visualisering af ARP processer</p>
            </div>
            <div class="topbar-controls">
                <div class="field">
                    <label for="scenario-select">Scenarie</label>
                    <select id="scenario-select"></select>
                </div>
                <div class="field">
                    <label for="mode-select">Visning</label>
                    <select id="mode-select">
                        <option value="3d">🎮 3D Mode</option>
                        <option value="2d">📐 2D Mode</option>
                    </select>
                </div>
                <div class="buttons">
                    <button id="reset-btn" class="btn danger">🔄 Reset</button>
                    <button id="prepare-btn" class="btn primary">🎬 Forbered</button>
                    <button id="next-btn" class="btn success" disabled>Next →</button>
                    <button id="autoplay-btn" class="btn accent" disabled>▶ Auto Play</button>
                    <button id="tutorial-btn" class="btn info">📚 ARP Tutorial</button>
                </div>
                <div class="status">
                    <div id="last-event" class="last-event"></div>
                    <div id="step-counter" class="step-counter">Step 0 / 0</div>
                </div>
            </div>
        </header>
        <main class="main">
            <section class="viewer">
                <div id="three-container" class="three-container"></div>
                <canvas id="canvas-2d" class="canvas-2d" width="1200" height="800"></canvas>
                <div id="step-banner" class="step-banner hidden">
                    <div class="step-banner-content">
                        <span class="step-icon">📍</span>
                        <div class="step-text"></div>
                    </div>
                </div>
            </section>
            <aside class="sidebar">
                <button id="toggle-sidebar" class="toggle-sidebar" title="Skjul sidebar">→</button>
                <div class="sidebar-content">
                    <section class="devices">
                        <h2>🖥️ Netværk Enheder</h2>
                        <div id="device-list" class="device-list"></div>
                    </section>
                    <section class="event-log">
                        <h2>📋 Event Log</h2>
                        <div id="event-log" class="event-log-entries"></div>
                    </section>
                </div>
            </aside>
        </main>
    </div>
    <div id="tutorial-modal" class="modal hidden" role="dialog" aria-modal="true">
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <header class="modal-header">
                <h2>📚 ARP Protocol Tutorial</h2>
                <button id="close-tutorial" class="modal-close" aria-label="Luk">×</button>
            </header>
            <div class="modal-body" id="tutorial-body"></div>
        </div>
    </div>
</body>
</html>
