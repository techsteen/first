import { defineRoute } from './router.js';

const state = {
    tasks: [],
    templates: null,
    progress: loadProgress(),
    teacherMode: loadTeacherMode(),
    aiSets: [],
    storageMode: 'ukendt'
};

const PIN_CODE = '4285';
const STORAGE_KEYS = {
    PROGRESS: 'subnetting-progress',
    TEACHER: 'subnetting-teacher-mode',
    AI_SETS: 'subnetting-ai-sets'
};

async function init() {
    await Promise.all([loadTasks(), loadTemplates()]);
    setupTeacherControls();
    setupRouteHandlers();
    attemptLoadAiSets();
}

defineRoute('/', renderFrontpage);
defineRoute('/learn', renderLearn);
defineRoute('/practice', renderPractice);
defineRoute('/test', renderTest);
defineRoute('/ai', renderAi);

function setupRouteHandlers() {
    document.addEventListener('click', event => {
        const target = event.target;
        if (target.matches('[data-action="start-test"]')) {
            event.preventDefault();
            startTestSession();
        }
    });
}

async function loadTasks() {
    if (state.tasks.length) return;
    try {
        const res = await fetch('assets/tasks.json');
        if (!res.ok) throw new Error('Kunne ikke hente opgaver.');
        const data = await res.json();
        state.tasks = data.tasks || [];
        refreshActiveRoute();
    } catch (error) {
        console.error('Fejl ved hentning af tasks.json', error);
    }
}

async function loadTemplates() {
    if (state.templates) return;
    try {
        const res = await fetch('assets/templates.json');
        if (!res.ok) throw new Error('Kunne ikke hente templates.');
        state.templates = await res.json();
        refreshActiveRoute();
    } catch (error) {
        console.error('Fejl ved hentning af templates.json', error);
    }
}

function loadProgress() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
        return raw ? JSON.parse(raw) : {};
    } catch (error) {
        console.warn('Progress kunne ikke hentes fra LocalStorage.', error);
        return {};
    }
}

function saveProgress() {
    try {
        localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(state.progress));
    } catch (error) {
        console.warn('Progress kunne ikke gemmes.', error);
    }
}

function loadTeacherMode() {
    try {
        return localStorage.getItem(STORAGE_KEYS.TEACHER) === 'true';
    } catch (error) {
        return false;
    }
}

function saveTeacherMode() {
    try {
        localStorage.setItem(STORAGE_KEYS.TEACHER, state.teacherMode ? 'true' : 'false');
    } catch (error) {
        console.warn('Kunne ikke gemme lærerstatus.', error);
    }
}

function setupTeacherControls() {
    const toggle = document.getElementById('toggle-teacher');
    const dialog = document.getElementById('teacher-dialog');
    const input = document.getElementById('teacher-pin');
    const feedback = dialog?.querySelector('.pin-feedback');
    const form = dialog?.querySelector('form');

    if (!toggle || !dialog || !input || !form) return;

    updateTeacherButton(toggle);

    toggle.addEventListener('click', () => {
        dialog.showModal();
        feedback.textContent = '';
        input.value = '';
        input.focus();
    });

    dialog.addEventListener('close', () => {
        feedback.textContent = '';
    });

    form.addEventListener('submit', event => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const pin = formData.get('teacher-pin');
        if (pin === PIN_CODE) {
            state.teacherMode = true;
            saveTeacherMode();
            updateTeacherButton(toggle);
            dialog.close();
        } else {
            feedback.textContent = 'Forkert PIN. Prøv igen eller spørg underviseren.';
        }
    });
}

function updateTeacherButton(button) {
    button.textContent = state.teacherMode ? 'Lærer-tilstand aktiv' : 'Lærer-tilstand';
    button.setAttribute('aria-expanded', state.teacherMode ? 'true' : 'false');
}

function refreshActiveRoute() {
    const hash = window.location.hash.replace('#', '') || '/';
    const path = hash.startsWith('/') ? hash : `/${hash}`;
    const app = document.getElementById('app');
    if (!app) return;
    switch (path) {
        case '/practice':
            renderPractice(app);
            break;
        case '/test':
            renderTest(app);
            break;
        case '/ai':
            renderAi(app);
            break;
        default:
            break;
    }
}

function renderFrontpage(container) {
    const template = document.getElementById('frontpage-template');
    container.innerHTML = template?.innerHTML ?? '';
}

function renderLearn(container) {
    container.innerHTML = `
        <section class="learning-section" aria-labelledby="learn-heading">
            <h2 id="learn-heading">Teori om subnetting</h2>
            ${getLearningContent()}
        </section>
    `;
}

function getLearningContent() {
    return `
    <article class="learning-card">
        <h3>CIDR og prefixlængder</h3>
        <p>CIDR (Classless Inter-Domain Routing) bruger prefixlængden til at angive hvor mange bits i adressen der beskriver netværket. Et /24 betyder 24 bits til netdelen.</p>
        <ul>
            <li>Netmasker kan skrives som /x eller i decimal, f.eks. 255.255.255.0.</li>
            <li>Jo højere prefix, desto mindre subnet og færre hosts.</li>
        </ul>
    </article>
    <article class="learning-card">
        <h3>Netmasker og bitmønstre</h3>
        <p>En netmaske består af sammenhængende 1'ere efterfulgt af 0'ere. 1'erne låser netdelen, mens 0'erne bruges til værtsadresser.</p>
        <ul>
            <li>/25 = 11111111.11111111.11111111.10000000</li>
            <li>/26 = 11111111.11111111.11111111.11000000</li>
            <li>/27 = 11111111.11111111.11111111.11100000</li>
        </ul>
    </article>
    <article class="learning-card">
        <h3>Net- og broadcastadresse</h3>
        <p>Netadressen har alle hostbits sat til 0, mens broadcastadressen har alle hostbits sat til 1. Et subnet med blokstørrelsen 16 vil starte ved 0, 16, 32, 48 osv.</p>
    </article>
    <article class="learning-card">
        <h3>Antal værter</h3>
        <p>Antallet af brugbare værtsadresser beregnes som 2<sup>hostbits</sup> - 2. Vi trækker net- og broadcastadresse fra.</p>
    </article>
    <article class="learning-card">
        <h3>Binær ↔ decimal</h3>
        <p>For at omregne binært til decimal lægges værdierne for de bits, der er 1, sammen. Tabellen 128-64-32-16-8-4-2-1 bruges til hurtig beregning.</p>
    </article>
    <article class="learning-card">
        <h3>Klassefulde net (overblik)</h3>
        <p>Klasse A, B og C giver en hurtig tommelfingerregel om standardmasker (f.eks. /8, /16, /24), men med CIDR er det mere fleksibelt.</p>
    </article>
    <article class="learning-card">
        <h3>Intro til VLSM</h3>
        <p>Variable Length Subnet Masking gør det muligt at opdele et netværk i subnet af forskellig størrelse. Start altid med det største behov.</p>
    </article>`;
}

function renderPractice(container) {
    const cards = state.tasks.map(task => renderTaskCard(task, 'practice'));
    container.innerHTML = `
        <section aria-labelledby="practice-heading">
            <h2 id="practice-heading">Øvelsesopgaver</h2>
            <p>Besvar opgaverne herunder. Du får feedback efter hver indsendelse. Progressionen gemmes lokalt.</p>
            <div class="task-list">${cards.join('')}</div>
        </section>
    `;
    bindTaskEvents(container);
}

function renderTest(container) {
    const existing = state.progress.testSession;
    if (!existing) {
        container.innerHTML = `
            <section class="learning-card" aria-labelledby="test-heading">
                <h2 id="test-heading">Test dig selv</h2>
                <p>Testen består af 10 spørgsmål i stigende sværhedsgrad. Du kan tage testen så mange gange du vil.</p>
                <a href="#/test" class="button" data-action="start-test">Start test</a>
            </section>
        `;
    } else {
        container.innerHTML = buildTestView(existing);
        bindTaskEvents(container);
    }
}

function startTestSession() {
    const shuffled = [...state.tasks].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));
    const testSession = {
        id: `test-${Date.now()}`,
        startedAt: new Date().toISOString(),
        tasks: selected,
        results: {}
    };
    state.progress.testSession = testSession;
    saveProgress();
    renderTest(document.getElementById('app'));
}

function buildTestView(session) {
    const answered = Object.values(session.results);
    const totalScore = answered.reduce((sum, item) => sum + (item.score || 0), 0);
    const completed = answered.length;
    const summary = completed === session.tasks.length ? `Du har afsluttet testen med ${totalScore} ud af ${session.tasks.length} mulige point.` : `Du har besvaret ${completed} af ${session.tasks.length} spørgsmål.`;

    return `
        <section aria-labelledby="test-running">
            <h2 id="test-running">Aktiv test</h2>
            <p>${summary}</p>
            <div class="task-list">
                ${session.tasks.map(task => renderTaskCard(task, 'test')).join('')}
            </div>
        </section>
    `;
}

function renderAi(container) {
    const teacherNotice = state.teacherMode ? '' : '<p class="storage-notice">Du er i elevtilstand. Kun visning af opgaver er mulig.</p>';
    const topicOptions = state.templates ? Object.keys(state.templates.topics || {}).map(topic => `<option value="${topic}">${topic.toUpperCase()}</option>`).join('') : '';

    container.innerHTML = `
        <section class="ai-panel" aria-labelledby="ai-heading">
            <h2 id="ai-heading">AI-genererede opgavesæt</h2>
            ${teacherNotice}
            ${state.teacherMode ? `
            <section class="ai-settings">
                <h3>Generér opgaver</h3>
                <form id="ai-generator" novalidate>
                    <fieldset ${state.teacherMode ? '' : 'disabled'}>
                        <label>Emne
                            <select name="topic" required>
                                <option value="" disabled selected>Vælg emne</option>
                                ${topicOptions}
                            </select>
                        </label>
                        <label>Sværhedsgrad (1-5)
                            <input name="difficulty" type="number" min="1" max="5" step="1" required>
                        </label>
                        <label>Antal opgaver (1-10)
                            <input name="count" type="number" min="1" max="10" step="1" required>
                        </label>
                        <div class="task-controls">
                            <button type="submit" class="button">Generér</button>
                            <button type="button" id="ai-save" class="button secondary">Gem sæt</button>
                            <button type="button" id="ai-load" class="button secondary">Indlæs gemte sæt</button>
                        </div>
                    </fieldset>
                </form>
                <p id="ai-storage-status" class="pin-feedback"></p>
            </section>` : ''}
            <section>
                <h3>Aktuelt opgavesæt</h3>
                <div id="ai-task-container" class="ai-tasks" role="region" aria-live="polite"></div>
            </section>
        </section>
    `;

    const form = container.querySelector('#ai-generator');
    const saveBtn = container.querySelector('#ai-save');
    const loadBtn = container.querySelector('#ai-load');
    const statusEl = container.querySelector('#ai-storage-status');

    if (form) {
        form.addEventListener('submit', handleGenerateTasks);
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', () => handleSaveAiSet(statusEl));
    }

    if (loadBtn) {
        loadBtn.addEventListener('click', () => handleLoadSavedSets(statusEl));
    }

    renderAiTasks(container.querySelector('#ai-task-container'));
}

function renderAiTasks(container) {
    if (!container) return;

    if (!state.aiSets.length) {
        container.innerHTML = '<p>Ingen AI-opgaver endnu. Generér eller indlæs et sæt.</p>';
        return;
    }

    container.innerHTML = state.aiSets.map((task, index) => renderTaskCard(task, 'ai', index)).join('');
    bindTaskEvents(container);
}

function renderTaskCard(task, mode, index = 0) {
    const progress = getTaskProgress(task.id, mode);
    const hints = Array.isArray(task.hints) ? task.hints : [];
    const hintHtml = progress?.hintsShown ? hints.slice(0, progress.hintsShown).map((hint, i) => `<div class="hint-text">Hint ${i + 1}: ${hint}</div>`).join('') : '';
    const answered = progress?.lastResult;
    const statusClass = answered ? (answered.is_correct ? 'correct' : 'incorrect') : '';
    const statusLabel = answered ? (answered.is_correct ? '✅ Korrekt' : '❌ Ikke korrekt endnu') : 'Ingen forsøg endnu';
    const attemptCount = progress?.attempts ?? 0;
    const disableInput = answered?.is_correct;

    let inputHtml = `<textarea name="answer" rows="4" ${disableInput ? 'disabled' : ''} aria-label="Dit svar"></textarea>`;

    if (task.type === 'multiple_choice' && Array.isArray(task.options)) {
        inputHtml = `
            <fieldset class="mc-fieldset" ${disableInput ? 'disabled' : ''}>
                <legend class="sr-only">Vælg svar</legend>
                ${task.options.map((option, optionIndex) => {
                    const optionId = `${task.id}-${optionIndex}`;
                    return `
                        <label class="mc-option">
                            <input type="checkbox" name="option" value="${option}" data-option-index="${optionIndex}" ${disableInput ? 'disabled' : ''}>
                            <span>${option}</span>
                        </label>`;
                }).join('')}
            </fieldset>`;
    }

    if (task.type === 'fill_in_table' && task.table) {
        inputHtml = `
            <table role="grid">
                <thead>
                    <tr>${task.table.headers.map(header => `<th scope="col">${header}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${task.table.rows.map((row, rowIndex) => `
                        <tr>
                            <td>${row.binary}</td>
                            <td><input type="text" name="table-${rowIndex}" ${disableInput ? 'disabled' : ''} aria-label="Decimalværdi for række ${rowIndex + 1}"></td>
                        </tr>`).join('')}
                </tbody>
            </table>`;
    }

    const showHintButton = hints.length > (progress?.hintsShown || 0);

    const solutionBlock = answered?.show_solution && answered.solution ? `<details><summary>Se løsning</summary><p>${answered.solution}</p></details>` : '';

    return `
        <article class="task-card" data-task-id="${task.id}" data-mode="${mode}" ${mode === 'ai' ? `data-index="${index}"` : ''}>
            <header>
                <h3>${task.title || 'Opgave'}</h3>
                <span class="status-chip ${statusClass}">${statusLabel}</span>
            </header>
            <p>${task.question}</p>
            ${Array.isArray(task.steps) ? `<ol>${task.steps.map(step => `<li>${step}</li>`).join('')}</ol>` : ''}
            <form class="task-form">
                ${inputHtml}
                <div class="task-controls">
                    <button type="submit" class="button" ${disableInput ? 'disabled' : ''}>Aflevér</button>
                    ${showHintButton ? '<button type="button" class="hint-button" data-action="hint">Hint</button>' : ''}
                    <button type="button" class="hint-button" data-action="reset">Nulstil</button>
                </div>
            </form>
            ${hintHtml}
            ${answered ? renderFeedback(answered) : ''}
            ${solutionBlock}
        </article>`;
}

function renderFeedback(result) {
    const classes = ['feedback'];
    classes.push(result.is_correct ? 'correct' : 'incorrect');
    return `
        <section class="${classes.join(' ')}" aria-live="polite">
            <h4>${result.is_correct ? 'Godt arbejde!' : 'Næsten i mål'}</h4>
            <p>${result.feedback_brief}</p>
            <p><strong>Næste skridt:</strong> ${result.feedback_next_step}</p>
        </section>`;
}

function bindTaskEvents(container) {
    container.querySelectorAll('.task-card').forEach(card => {
        const form = card.querySelector('.task-form');
        const hintBtn = card.querySelector('[data-action="hint"]');
        const resetBtn = card.querySelector('[data-action="reset"]');
        if (form) {
            form.addEventListener('submit', async event => {
                event.preventDefault();
                await handleSubmit(card, form);
            });
        }
        if (hintBtn) {
            hintBtn.addEventListener('click', () => handleHint(card));
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', () => resetTask(card));
        }
    });
}

function handleHint(card) {
    const taskId = card.dataset.taskId;
    const mode = card.dataset.mode;
    const task = findTask(taskId, mode);
    const progress = getTaskProgress(taskId, mode);
    if (!task) return;
    const hints = Array.isArray(task.hints) ? task.hints : [];
    const shown = progress?.hintsShown || 0;
    if (shown >= Math.min(2, hints.length)) return;

    updateTaskProgress(taskId, mode, {
        hintsShown: shown + 1
    });
    rerenderTask(card, task, mode);
}

function resetTask(card) {
    const taskId = card.dataset.taskId;
    const mode = card.dataset.mode;
    updateTaskProgress(taskId, mode, {
        attempts: 0,
        hintsShown: 0,
        lastResult: null
    });
    rerenderTask(card, findTask(taskId, mode), mode);
}

function getTaskProgress(taskId, mode) {
    const key = `${mode}-${taskId}`;
    return state.progress[key] || null;
}

function updateTaskProgress(taskId, mode, data) {
    const key = `${mode}-${taskId}`;
    const current = state.progress[key] || {};
    state.progress[key] = { ...current, ...data };
    saveProgress();
}

function findTask(taskId, mode) {
    if (mode === 'ai') {
        return state.aiSets.find(task => task.id === taskId);
    }
    return state.tasks.find(task => task.id === taskId);
}

async function handleSubmit(card, form) {
    const taskId = card.dataset.taskId;
    const mode = card.dataset.mode;
    const task = findTask(taskId, mode);
    if (!task) return;

    const answer = extractAnswer(form, task);
    const progress = getTaskProgress(taskId, mode) || {};
    const attempts = (progress.attempts || 0) + 1;

    try {
        const response = await fetch('server/api_evaluate.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task, userAnswer: answer, attempts })
        });

        if (!response.ok) {
            throw new Error('Serverfejl');
        }

        const result = await response.json();
        if (state.teacherMode) {
            result.show_solution = true;
        }
        if (mode === 'test' && state.progress.testSession) {
            state.progress.testSession.results = state.progress.testSession.results || {};
            state.progress.testSession.results[taskId] = {
                score: result.score ?? 0,
                is_correct: result.is_correct ?? false
            };
        }
        updateTaskProgress(taskId, mode, {
            attempts,
            lastResult: result
        });
        rerenderTask(card, task, mode);
        logAttempt(taskId, mode, result);
    } catch (error) {
        console.error('Evalueringsfejl', error);
        showError(card, 'Der opstod en fejl under evalueringen. Prøv igen senere.');
    }
}

function extractAnswer(form, task) {
    if (task.type === 'multiple_choice') {
        return Array.from(form.querySelectorAll('input[name="option"]:checked')).map(input => input.value);
    }
    if (task.type === 'fill_in_table') {
        return Array.from(form.querySelectorAll('input[type="text"]')).map(input => input.value.trim());
    }
    const textarea = form.querySelector('textarea');
    return textarea ? textarea.value.trim() : '';
}

function rerenderTask(card, task, mode) {
    const container = card.parentElement;
    if (!container) return;
    card.outerHTML = renderTaskCard(task, mode, parseInt(card.dataset.index ?? '0', 10));
    bindTaskEvents(container);
}

function showError(card, message) {
    const existing = card.querySelector('.feedback');
    if (existing) {
        existing.outerHTML = `<section class="feedback incorrect" aria-live="polite"><h4>Fejl</h4><p>${message}</p></section>`;
    } else {
        card.insertAdjacentHTML('beforeend', `<section class="feedback incorrect" aria-live="polite"><h4>Fejl</h4><p>${message}</p></section>`);
    }
}

function logAttempt(taskId, mode, result) {
    try {
        const logEntry = {
            taskId,
            mode,
            is_correct: result?.is_correct ?? false,
            timestamp: new Date().toISOString()
        };
        const existing = JSON.parse(localStorage.getItem('subnetting-attempt-log') || '[]');
        existing.push(logEntry);
        localStorage.setItem('subnetting-attempt-log', JSON.stringify(existing.slice(-200)));
    } catch (error) {
        console.warn('Kunne ikke logge forsøg lokalt.', error);
    }
}

async function handleGenerateTasks(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const payload = {
        topic: formData.get('topic'),
        difficulty: Number(formData.get('difficulty')),
        count: Number(formData.get('count'))
    };

    try {
        const response = await fetch('server/api_generate_tasks.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Serverfejl');
        const data = await response.json();
        state.aiSets = data.tasks || [];
        renderAiTasks(document.getElementById('ai-task-container'));
    } catch (error) {
        console.error('Fejl ved generering', error);
        const container = document.getElementById('ai-task-container');
        if (container) {
            container.innerHTML = '<p>Kunne ikke generere opgaver. Prøv igen senere.</p>';
        }
    }
}

async function handleSaveAiSet(statusEl) {
    if (!state.aiSets.length) {
        statusEl.textContent = 'Ingen opgaver at gemme endnu.';
        return;
    }
    try {
        const response = await fetch('server/api_generate_tasks.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save', tasks: state.aiSets })
        });
        if (!response.ok) throw new Error('Serverfejl');
        const data = await response.json();
        if (data.status === 'saved') {
            state.storageMode = data.storage_mode;
            statusEl.textContent = data.message;
        } else if (data.status === 'fallback') {
            state.storageMode = 'localStorage';
            statusEl.textContent = data.message;
            saveAiSetsLocally();
        }
    } catch (error) {
        console.warn('Gemning mislykkedes, bruger LocalStorage.', error);
        state.storageMode = 'localStorage';
        saveAiSetsLocally();
        statusEl.textContent = 'Kunne ikke gemme på serveren. Sættet er gemt lokalt på denne enhed.';
    }
}

async function handleLoadSavedSets(statusEl) {
    try {
        const response = await fetch('server/api_generate_tasks.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'load' })
        });
        if (!response.ok) throw new Error('Serverfejl');
        const data = await response.json();
        if (Array.isArray(data.tasks) && data.tasks.length) {
            state.aiSets = data.tasks;
            state.storageMode = data.storage_mode || 'fil';
            renderAiTasks(document.getElementById('ai-task-container'));
            statusEl.textContent = data.message || 'Gemte sæt er hentet.';
        } else if (data.status === 'fallback') {
            loadAiSetsLocally(statusEl);
        } else {
            statusEl.textContent = 'Ingen gemte sæt fundet.';
        }
    } catch (error) {
        console.warn('Kunne ikke hente fra server, forsøger LocalStorage.', error);
        loadAiSetsLocally(statusEl);
    }
}

function saveAiSetsLocally() {
    try {
        localStorage.setItem(STORAGE_KEYS.AI_SETS, JSON.stringify(state.aiSets));
    } catch (error) {
        console.warn('Kunne ikke gemme AI-sæt i LocalStorage.', error);
    }
}

function loadAiSetsLocally(statusEl) {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.AI_SETS);
        if (!raw) {
            statusEl.textContent = 'Ingen lokale sæt fundet.';
            return;
        }
        state.aiSets = JSON.parse(raw);
        state.storageMode = 'localStorage';
        renderAiTasks(document.getElementById('ai-task-container'));
        statusEl.textContent = 'Indlæst fra LocalStorage (kun på denne enhed).';
    } catch (error) {
        statusEl.textContent = 'Kunne ikke indlæse lokale sæt.';
    }
}

function attemptLoadAiSets() {
    const raw = localStorage.getItem(STORAGE_KEYS.AI_SETS);
    if (raw) {
        try {
            state.aiSets = JSON.parse(raw);
        } catch (error) {
            state.aiSets = [];
        }
    }
}

init();
