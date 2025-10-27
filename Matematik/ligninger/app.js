(() => {
  const state = {
    detail: false,
    llmEnabled: false,
    hintsUsed: 0,
    currentTask: null,
    progress: loadJson('matd-progress', {}),
    log: loadJson('matd-log', []),
    exercises: [],
    skills: new Set(),
    graph: {
      line1: { slope: 1, intercept: 0 },
      line2: { slope: -1, intercept: 4 }
    },
    snapIntegers: false,
    demo: {
      key: 'isolation',
      step: 0,
      playing: false,
      timer: null
    }
  };

  const tutorialDemos = {
    isolation: {
      label: 'Isolering af x',
      steps: [
        {
          text: '<strong>1. Opskriv funktionerne:</strong> Vi ser ligningen <code>2x + 3 = 11</code> som to funktioner. Den blå linje viser venstresiden <code>y = 2x + 3</code>, og den gule linje er højresiden <code>y = 11</code>.',
          note: 'Skæringspunktet viser hvor begge sider er lige store – løsningen til ligningen.',
          preset: { type: 'single', data: { a: 2, b: 3, c: 11 } },
          graph: {
            lines: [
              { slope: 2, intercept: 3, color: '#38bdf8' },
              { slope: 0, intercept: 11, color: '#facc15' }
            ],
            point: { x: 4, y: 11, label: 'Skæring (x = 4)' }
          }
        },
        {
          text: '<strong>2. Flyt +3:</strong> Vi trækker 3 fra på begge sider, så venstresiden bliver <code>2x</code> og højresiden <code>8</code>. Grafen viser, at den gule linje flyttes ned til <code>y = 8</code>.',
          note: 'Afstanden mellem linjerne svarer til det +3, vi fjernede.',
          preset: { type: 'single', data: { a: 2, b: 0, c: 8 } },
          graph: {
            lines: [
              { slope: 2, intercept: 0, color: '#38bdf8' },
              { slope: 0, intercept: 8, color: '#facc15' }
            ],
            point: { x: 4, y: 8, label: 'x = 4 giver y = 8' }
          }
        },
        {
          text: '<strong>3. Divider med 2:</strong> Når vi deler begge sider med 2, får vi <code>x = 4</code>. På grafen markerer den stiplede linje værdien <code>x = 4</code>, hvor funktionerne krydser.',
          note: 'Aflæs x-koordinaten (4) – det er løsningen på ligningen.',
          preset: { type: 'single', data: { a: 2, b: 0, c: 8 } },
          graph: {
            lines: [
              { slope: 2, intercept: 0, color: '#38bdf8' },
              { slope: 0, intercept: 8, color: '#facc15' },
              { vertical: 4, color: '#f97316', dashed: true }
            ],
            point: { x: 4, y: 8, label: 'Løsning (4, 8)' }
          }
        }
      ]
    },
    substitution: {
      label: 'Substitution',
      steps: [
        {
          text: '<strong>1. Isolér en variabel:</strong> Vi omskriver første ligning til <code>y = x + 2</code>. Den blå linje viser udtrykket, mens den stiplede linje viser den anden ligning, som vi snart erstatter i.',
          note: 'Grafen gør det tydeligt, hvilken hældning og skæring første ligning har.',
          preset: { type: 'system', data: { a1: -1, b1: 1, c1: 2, a2: 1, b2: 1, c2: 6 } },
          graph: {
            lines: [
              { slope: 1, intercept: 2, color: '#38bdf8' },
              { slope: -1, intercept: 6, color: '#f97316', dashed: true }
            ]
          }
        },
        {
          text: '<strong>2. Erstat i den anden ligning:</strong> Vi indsætter <code>y = x + 2</code> i <code>x + y = 6</code> og får <code>x + 2 = -x + 6</code>. På grafen ses nu begge linjer tydeligt.',
          note: 'Deres skæring svarer til punktet, hvor de to ligninger er ens.',
          preset: { type: 'system', data: { a1: -1, b1: 1, c1: 2, a2: 1, b2: 1, c2: 6 } },
          graph: {
            lines: [
              { slope: 1, intercept: 2, color: '#38bdf8' },
              { slope: -1, intercept: 6, color: '#f97316' }
            ]
          }
        },
        {
          text: '<strong>3. Aflæs løsningen:</strong> Når vi løser ligningen, finder vi <code>x = 2</code> og <code>y = 4</code>. Det er præcis skæringspunktet mellem de to linjer.',
          note: 'Punktet (2, 4) fortæller både x- og y-værdien for løsningen.',
          preset: { type: 'system', data: { a1: -1, b1: 1, c1: 2, a2: 1, b2: 1, c2: 6 } },
          graph: {
            lines: [
              { slope: 1, intercept: 2, color: '#38bdf8' },
              { slope: -1, intercept: 6, color: '#f97316' }
            ],
            point: { x: 2, y: 4, label: 'Skæring (2, 4)' }
          }
        }
      ]
    },
    elimination: {
      label: 'Elimination',
      steps: [
        {
          text: '<strong>1. Tegn begge ligninger:</strong> Vi arbejder med <code>x + 2y = 10</code> og <code>3x - 2y = 2</code>. Omskrevet til funktioner bliver de til <code>y = -0,5x + 5</code> og <code>y = 1,5x - 1</code>.',
          note: 'Grafen viser to linjer med forskellig hældning – derfor findes der én løsning.',
          preset: { type: 'system', data: { a1: 1, b1: 2, c1: 10, a2: 3, b2: -2, c2: 2 } },
          graph: {
            lines: [
              { slope: -0.5, intercept: 5, color: '#38bdf8' },
              { slope: 1.5, intercept: -1, color: '#f97316' }
            ]
          }
        },
        {
          text: '<strong>2. Læg ligningerne sammen:</strong> Når vi summerer dem, får vi <code>4x = 12</code>. Den stiplede linje markerer <code>x = 3</code>, hvor begge ligninger giver samme resultat.',
          note: 'Elimination svarer til at finde den x-værdi, hvor graferne krydser hinanden.',
          graph: {
            lines: [
              { slope: -0.5, intercept: 5, color: '#38bdf8', dashed: true },
              { slope: 1.5, intercept: -1, color: '#f97316', dashed: true },
              { vertical: 3, color: '#facc15', dashed: true }
            ],
            point: { x: 3, y: 3.5, label: 'x = 3' }
          }
        },
        {
          text: '<strong>3. Find y-værdien:</strong> Med <code>x = 3</code> indsætter vi i en af ligningerne og får <code>y = 3,5</code>. Punktet (3, 3,5) er løsningen på systemet.',
          note: 'Skæringspunktet (3, 3,5) opfylder begge ligninger samtidigt.',
          preset: { type: 'system', data: { a1: 1, b1: 2, c1: 10, a2: 3, b2: -2, c2: 2 } },
          graph: {
            lines: [
              { slope: -0.5, intercept: 5, color: '#38bdf8' },
              { slope: 1.5, intercept: -1, color: '#f97316' }
            ],
            point: { x: 3, y: 3.5, label: 'Løsning (3, 3,5)' }
          }
        }
      ]
    }
  };

  const dom = {};

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    mapDom();
    setupToggles();
    setupGlossary();
    setupGraph();
    setupTutorialDemo();
    setupSimulation();
    setupTasks();
    bindGlobalActions();
    refreshProgress();
  }

  function mapDom() {
    dom.body = document.body;
    dom.toggleText = document.getElementById('toggle-text');
    dom.toggleDetail = document.getElementById('toggle-detail');
    dom.toggleLlm = document.getElementById('toggle-llm');
    dom.graph = document.getElementById('graph');
    dom.ctx = dom.graph.getContext('2d');
    dom.line1Slope = document.getElementById('line1-slope');
    dom.line1Intercept = document.getElementById('line1-intercept');
    dom.line2Slope = document.getElementById('line2-slope');
    dom.line2Intercept = document.getElementById('line2-intercept');
    dom.intersection = document.getElementById('intersection');
    dom.diagnostic = document.getElementById('diagnostic');
    dom.resetGraph = document.getElementById('reset-graph');
    dom.snapIntegers = document.getElementById('snap-integers');

    dom.demoSelect = document.getElementById('demo-select');
    dom.demoPrev = document.getElementById('demo-prev');
    dom.demoNext = document.getElementById('demo-next');
    dom.demoPlay = document.getElementById('demo-play');
    dom.demoStepIndicator = document.getElementById('demo-step-indicator');
    dom.demoStepText = document.getElementById('demo-step-text');
    dom.demoStepNote = document.getElementById('demo-step-note');
    dom.demoGraph = document.getElementById('demo-graph');
    dom.demoCtx = dom.demoGraph?.getContext('2d');

    dom.scenarioSelect = document.getElementById('scenario-select');
    dom.paramA = document.getElementById('param-a');
    dom.paramB = document.getElementById('param-b');
    dom.paramC = document.getElementById('param-c');
    dom.paramALabel = document.getElementById('param-a-label');
    dom.paramBLabel = document.getElementById('param-b-label');
    dom.paramCLabel = document.getElementById('param-c-label');
    dom.scenarioTitle = document.getElementById('scenario-title');
    dom.scenarioDescription = document.getElementById('scenario-description');
    dom.scenarioMath = document.getElementById('scenario-math');
    dom.showMath = document.getElementById('show-math');

    dom.taskGrid = document.getElementById('task-grid');
    dom.taskPlayer = document.getElementById('task-player');
    dom.taskTitle = document.getElementById('task-title');
    dom.taskMeta = document.getElementById('task-meta');
    dom.taskPrompt = document.getElementById('task-prompt');
    dom.taskLinks = document.getElementById('task-links');
    dom.taskForm = document.getElementById('task-form');
    dom.taskAnswer = document.getElementById('task-answer');
    dom.taskFormat = document.getElementById('task-format');
    dom.taskFeedback = document.getElementById('task-feedback');
    dom.taskHints = document.getElementById('task-hints');
    dom.hintButton = document.getElementById('hint-button');
    dom.solutionButton = document.getElementById('solution-button');
    dom.filterDifficulty = document.getElementById('filter-difficulty');
    dom.filterSkill = document.getElementById('filter-skill');
    dom.taskCount = document.getElementById('task-count');

    dom.progressBar = document.getElementById('progress-bar');
    dom.resetProgress = document.getElementById('reset-progress');
    dom.downloadLog = document.getElementById('download-log');
  }

  function setupToggles() {
    dom.toggleText.addEventListener('click', () => {
      const active = dom.body.classList.toggle('large-text');
      dom.toggleText.setAttribute('aria-pressed', String(active));
    });

    dom.toggleDetail.addEventListener('click', () => {
      state.detail = !state.detail;
      dom.toggleDetail.setAttribute('aria-pressed', String(state.detail));
      dom.toggleDetail.textContent = state.detail ? 'Kort forklaring' : 'Detaljeret forklaring';
      toggleDetailText(state.detail);
    });

    dom.toggleLlm.addEventListener('click', () => {
      state.llmEnabled = !state.llmEnabled;
      dom.toggleLlm.setAttribute('aria-pressed', String(state.llmEnabled));
      dom.toggleLlm.textContent = state.llmEnabled ? 'LLM-feedback: til' : 'LLM-feedback: fra';
    });
  }

  function toggleDetailText(show) {
    document.querySelectorAll('[data-detail]').forEach((el) => {
      if (!el.dataset.original) {
        el.dataset.original = el.textContent.trim();
      }
      el.textContent = show ? `${el.dataset.original} – ${el.dataset.detail || ''}` : el.dataset.original;
    });
  }

  function setupGlossary() {
    const glossary = {};
    document.querySelectorAll('#glossary dt').forEach((dt) => {
      const key = dt.id?.replace('gloss-', '') || dt.textContent.trim().toLowerCase();
      const definition = dt.nextElementSibling?.textContent.trim();
      if (key && definition) glossary[key] = definition;
    });

    document.querySelectorAll('.gloss').forEach((span) => {
      const key = span.dataset.term || span.textContent.trim().toLowerCase();
      if (glossary[key]) {
        span.setAttribute('title', glossary[key]);
        span.dataset.detail = glossary[key];
      }
    });
  }

  function setupGraph() {
    const controls = [dom.line1Slope, dom.line1Intercept, dom.line2Slope, dom.line2Intercept];
    controls.forEach((control) => {
      control.addEventListener('input', () => {
        if (state.snapIntegers && Number(control.step) === 1) {
          control.value = String(Math.round(Number(control.value)));
        }
        syncGraphFromInputs();
      });
    });

    dom.resetGraph.addEventListener('click', () => {
      state.snapIntegers = false;
      dom.snapIntegers.setAttribute('aria-pressed', 'false');
      dom.snapIntegers.textContent = 'Snap til heltal';
      dom.line1Slope.value = '1';
      dom.line1Intercept.value = '0';
      dom.line2Slope.value = '-1';
      dom.line2Intercept.value = '4';
      syncGraphFromInputs();
    });

    dom.snapIntegers.addEventListener('click', () => {
      state.snapIntegers = !state.snapIntegers;
      dom.snapIntegers.setAttribute('aria-pressed', String(state.snapIntegers));
      dom.snapIntegers.textContent = state.snapIntegers ? 'Snap aktiv' : 'Snap til heltal';
      if (state.snapIntegers) {
        [dom.line1Intercept, dom.line2Intercept].forEach((input) => {
          input.value = String(Math.round(Number(input.value)));
        });
      }
      syncGraphFromInputs();
    });

    document.querySelectorAll('.graph-link').forEach((button) => {
      button.addEventListener('click', () => {
        const type = button.dataset.graph;
        const preset = JSON.parse(button.dataset.preset || '{}');
        applyGraphPreset(type, preset);
        dom.graph.scrollIntoView({ behavior: 'smooth', block: 'center' });
        dom.graph.focus({ preventScroll: true });
      });
    });

    syncGraphFromInputs();
  }

  function setupTutorialDemo() {
    if (!dom.demoGraph || !dom.demoSelect) return;

    dom.demoSelect.value = state.demo.key;
    dom.demoPlay?.setAttribute('aria-pressed', 'false');

    dom.demoPrev?.addEventListener('click', () => changeDemoStep(-1));
    dom.demoNext?.addEventListener('click', () => changeDemoStep(1));
    dom.demoSelect.addEventListener('change', () => {
      const value = dom.demoSelect.value;
      if (!tutorialDemos[value]) return;
      stopDemoPlayback();
      state.demo.key = value;
      state.demo.step = 0;
      renderDemoStep();
    });

    dom.demoPlay?.addEventListener('click', () => {
      if (state.demo.playing) {
        stopDemoPlayback();
      } else {
        startDemoPlayback();
      }
    });

    renderDemoStep();

    window.addEventListener('resize', () => {
      const step = getCurrentDemoStep();
      if (step) {
        drawDemoGraph(step.graph);
      }
    });
  }

  function changeDemoStep(offset, options = {}) {
    const { auto = false } = options;
    const demo = tutorialDemos[state.demo.key];
    if (!demo) return;

    if (!auto) {
      stopDemoPlayback();
    }

    const next = Math.min(Math.max(state.demo.step + offset, 0), demo.steps.length - 1);
    if (next === state.demo.step) {
      if (!auto) {
        renderDemoStep();
      }
      return;
    }
    state.demo.step = next;
    renderDemoStep();
  }

  function startDemoPlayback() {
    const demo = tutorialDemos[state.demo.key];
    if (!demo) return;
    stopDemoPlayback();
    state.demo.playing = true;
    if (dom.demoPlay) {
      dom.demoPlay.textContent = 'Stop afspilning';
      dom.demoPlay.setAttribute('aria-pressed', 'true');
    }
    state.demo.timer = setInterval(() => {
      const currentDemo = tutorialDemos[state.demo.key];
      if (!currentDemo) {
        stopDemoPlayback();
        return;
      }
      if (state.demo.step >= currentDemo.steps.length - 1) {
        stopDemoPlayback();
        return;
      }
      changeDemoStep(1, { auto: true });
    }, 4500);
  }

  function stopDemoPlayback() {
    if (state.demo.timer) {
      clearInterval(state.demo.timer);
      state.demo.timer = null;
    }
    const wasPlaying = state.demo.playing;
    state.demo.playing = false;
    if (dom.demoPlay) {
      dom.demoPlay.textContent = 'Afspil trin';
      dom.demoPlay.setAttribute('aria-pressed', 'false');
    }
    if (!wasPlaying) {
      return;
    }
  }

  function renderDemoStep(options = {}) {
    if (!dom.demoStepText) return;
    const { syncGraph = true } = options;
    const demo = tutorialDemos[state.demo.key];
    if (!demo) return;
    const step = demo.steps[state.demo.step];
    if (!step) return;

    dom.demoSelect.value = state.demo.key;
    if (dom.demoStepIndicator) {
      dom.demoStepIndicator.textContent = `Trin ${state.demo.step + 1} af ${demo.steps.length}`;
    }
    if (dom.demoPrev) {
      dom.demoPrev.disabled = state.demo.step === 0;
    }
    if (dom.demoNext) {
      dom.demoNext.disabled = state.demo.step === demo.steps.length - 1;
    }

    dom.demoStepText.innerHTML = `<p>${step.text}</p>`;
    if (dom.demoStepNote) {
      dom.demoStepNote.textContent = step.note || '';
    }

    if (syncGraph && step.preset) {
      applyGraphPreset(step.preset.type, step.preset.data || {});
    }

    drawDemoGraph(step.graph);
  }

  function getCurrentDemoStep() {
    const demo = tutorialDemos[state.demo.key];
    if (!demo) return null;
    return demo.steps[state.demo.step] || null;
  }

  function drawDemoGraph(config = {}) {
    if (!dom.demoCtx || !dom.demoGraph) return;
    const ctx = dom.demoCtx;
    const width = dom.demoGraph.width;
    const height = dom.demoGraph.height;
    ctx.clearRect(0, 0, width, height);

    const padding = 40;
    const min = -10;
    const max = 10;

    ctx.fillStyle = '#0b1221';
    ctx.fillRect(0, 0, width, height);

    const xToCanvas = (x) => ((x - min) / (max - min)) * (width - padding * 2) + padding;
    const yToCanvas = (y) => height - ((y - min) / (max - min)) * (height - padding * 2) - padding;

    ctx.strokeStyle = 'rgba(148,163,236,0.12)';
    ctx.lineWidth = 1;
    for (let value = min; value <= max; value++) {
      const x = xToCanvas(value);
      const y = yToCanvas(value);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(148,163,236,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, yToCanvas(0));
    ctx.lineTo(width - padding, yToCanvas(0));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(xToCanvas(0), padding);
    ctx.lineTo(xToCanvas(0), height - padding);
    ctx.stroke();

    ctx.fillStyle = 'rgba(226,232,240,0.85)';
    ctx.font = '12px "Inter", sans-serif';
    for (let value = min; value <= max; value++) {
      ctx.fillText(String(value), xToCanvas(value) - 4, yToCanvas(0) + 14);
      if (value !== 0) {
        ctx.fillText(String(value), xToCanvas(0) + 6, yToCanvas(value) + 4);
      }
    }

    (config.lines || []).forEach((line) => {
      ctx.save();
      ctx.strokeStyle = line.color || '#38bdf8';
      ctx.lineWidth = line.emphasis ? 3 : 2;
      if (line.dashed) {
        ctx.setLineDash([8, 8]);
      }
      if (typeof line.vertical === 'number') {
        const x = xToCanvas(line.vertical);
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
      } else if (typeof line.slope === 'number') {
        const slope = Number(line.slope);
        const intercept = Number(line.intercept || 0);
        ctx.beginPath();
        ctx.moveTo(xToCanvas(min), yToCanvas(slope * min + intercept));
        ctx.lineTo(xToCanvas(max), yToCanvas(slope * max + intercept));
        ctx.stroke();
      }
      ctx.restore();
    });

    if (config.point && Number.isFinite(config.point.x) && Number.isFinite(config.point.y)) {
      const { x, y } = config.point;
      const cx = xToCanvas(x);
      const cy = yToCanvas(y);
      ctx.fillStyle = config.point.color || '#22d3ee';
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#020617';
      ctx.stroke();
      if (config.point.label) {
        ctx.fillStyle = '#f8fafc';
        ctx.font = '14px "Inter", sans-serif';
        ctx.fillText(config.point.label, cx + 10, cy - 10);
      }
    }
  }

  function syncGraphFromInputs() {
    state.graph.line1 = {
      slope: Number(dom.line1Slope.value),
      intercept: Number(dom.line1Intercept.value)
    };
    state.graph.line2 = {
      slope: Number(dom.line2Slope.value),
      intercept: Number(dom.line2Intercept.value)
    };
    drawGraph();
  }

  function drawGraph() {
    const ctx = dom.ctx;
    const width = dom.graph.width;
    const height = dom.graph.height;
    ctx.clearRect(0, 0, width, height);

    const padding = 50;
    const min = -10;
    const max = 10;

    ctx.fillStyle = '#0b1221';
    ctx.fillRect(0, 0, width, height);

    const xToCanvas = (x) => ((x - min) / (max - min)) * (width - padding * 2) + padding;
    const yToCanvas = (y) => height - ((y - min) / (max - min)) * (height - padding * 2) - padding;

    ctx.strokeStyle = 'rgba(148,163,236,0.15)';
    ctx.lineWidth = 1;
    for (let value = min; value <= max; value++) {
      const x = xToCanvas(value);
      const y = yToCanvas(value);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(148,163,236,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, yToCanvas(0));
    ctx.lineTo(width - padding, yToCanvas(0));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(xToCanvas(0), padding);
    ctx.lineTo(xToCanvas(0), height - padding);
    ctx.stroke();

    ctx.fillStyle = 'rgba(203,213,225,0.9)';
    ctx.font = '12px "Inter", sans-serif';
    for (let value = min; value <= max; value++) {
      ctx.fillText(String(value), xToCanvas(value) - 4, yToCanvas(0) + 14);
      if (value !== 0) {
        ctx.fillText(String(value), xToCanvas(0) + 6, yToCanvas(value) + 4);
      }
    }

    plotLine(ctx, state.graph.line1, '#38bdf8', xToCanvas, yToCanvas);
    plotLine(ctx, state.graph.line2, '#f87171', xToCanvas, yToCanvas);
    describeIntersection();
  }

  function plotLine(ctx, line, color, xMap, yMap) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    let first = true;
    for (let x = -10; x <= 10; x += 0.1) {
      const y = line.slope * x + line.intercept;
      if (!Number.isFinite(y)) continue;
      const cx = xMap(x);
      const cy = yMap(y);
      if (first) {
        ctx.moveTo(cx, cy);
        first = false;
      } else {
        ctx.lineTo(cx, cy);
      }
    }
    ctx.stroke();
  }

  function describeIntersection() {
    const { line1, line2 } = state.graph;
    const slopeDiff = line1.slope - line2.slope;
    const interceptDiff = line2.intercept - line1.intercept;

    if (Math.abs(slopeDiff) < 1e-6) {
      if (Math.abs(interceptDiff) < 1e-6) {
        dom.intersection.textContent = 'Linjerne overlapper: uendeligt mange løsninger.';
        dom.diagnostic.textContent = 'Hældning og skæring er identiske – hele linjen er løsningen.';
      } else {
        dom.intersection.textContent = 'Linjerne er parallelle: ingen løsning.';
        dom.diagnostic.textContent = 'Samme hældning men forskellig skæring ⇒ ingen skæringspunkt.';
      }
      return;
    }

    const x = interceptDiff / slopeDiff;
    const y = line1.slope * x + line1.intercept;
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      dom.intersection.textContent = 'Skæringspunkt uden for visningen.';
      dom.diagnostic.textContent = 'Juster koefficienterne for at se løsningen i koordinatsystemet.';
      return;
    }

    dom.intersection.textContent = `Skæringspunkt: (${round(x)}, ${round(y)})`;
    dom.diagnostic.textContent = 'Dette punkt løser begge ligninger samtidigt.';
  }

  function round(value) {
    return Math.round(value * 100) / 100;
  }

  function applyGraphPreset(type, preset) {
    if (type === 'single') {
      dom.line1Slope.value = String(preset.a ?? 1);
      dom.line1Intercept.value = String(preset.b ?? 0);
      dom.line2Slope.value = '0';
      dom.line2Intercept.value = String(preset.c ?? 0);
    } else if (type === 'system') {
      const m1 = deriveSlope(preset.a1, preset.b1);
      const b1 = deriveIntercept(preset.b1, preset.c1);
      const m2 = deriveSlope(preset.a2, preset.b2);
      const b2 = deriveIntercept(preset.b2, preset.c2);
      dom.line1Slope.value = limit(m1, -5, 5);
      dom.line1Intercept.value = limit(b1, -10, 10);
      dom.line2Slope.value = limit(m2, -5, 5);
      dom.line2Intercept.value = limit(b2, -10, 10);
    } else if (type === 'model') {
      dom.line1Slope.value = String(preset.a ?? 1);
      dom.line1Intercept.value = String(preset.b ?? 0);
      dom.line2Slope.value = String(preset.a2 ?? 1);
      dom.line2Intercept.value = String(preset.b2 ?? 0);
    }
    syncGraphFromInputs();
  }

  function deriveSlope(a = 1, b = 1) {
    const denom = b === 0 ? 1 : b;
    return -Number(a ?? 0) / Number(denom);
  }

  function deriveIntercept(b = 1, c = 0) {
    const denom = b === 0 ? 1 : b;
    return Number(c ?? 0) / Number(denom);
  }

  function limit(value, min, max) {
    const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
    return String(Math.min(Math.max(safe, min), max));
  }

  const scenarios = {
    cloud: {
      title: 'Cloud-priser',
      description: 'Sammenlign to udbydere: fast gebyr + pris pr. time. Find break-even for driftstimer.',
      params: ['Fast gebyr (kr.)', 'Pris pr. time (kr.)', 'Forbrug (timer)'],
      math: (a, b, c) => {
        const providerA = `${a} + ${b}x`;
        const providerBBase = Math.round(a * 0.6);
        const providerBVar = Math.round(b * 1.35 * 10) / 10;
        const denominator = b - providerBVar;
        if (Math.abs(denominator) < 1e-6) {
          return `Udbyder A: y = ${providerA}\nUdbyder B: y = ${providerBBase} + ${providerBVar}x\nIngen break-even: modellerne er parallelle.`;
        }
        const breakEven = (providerBBase - a) / denominator;
        return `Udbyder A: y = ${providerA}\nUdbyder B: y = ${providerBBase} + ${providerBVar}x\nBreak-even ved x ≈ ${round(breakEven)} timer.`;
      }
    },
    bandwidth: {
      title: 'Netværksbåndbredde',
      description: 'Restkapacitet falder lineært med antal brugere. Sammenlign to uplinks.',
      params: ['Startkapacitet A (Mbit)', 'Startkapacitet B (Mbit)', 'Aktive brugere'],
      math: (a, b, c) => {
        const lineA = `${a} - 5x`;
        const lineB = `${b} - 3x`;
        const restA = Math.max(a - 5 * c, 0);
        const restB = Math.max(b - 3 * c, 0);
        return `Uplink A: y = ${lineA}\nUplink B: y = ${lineB}\nVed ${c} brugere: ${restA} Mbit tilbage i A og ${restB} Mbit i B.`;
      }
    },
    server: {
      title: 'Serverkapacitet',
      description: 'RAM og CPU giver lineære begrænsninger på antal services.',
      params: ['Tilgængelig RAM (GB)', 'RAM pr. service (GB)', 'CPU pr. service (%)'],
      math: (a, b, c) => {
        const ramLimit = Math.floor(a / Math.max(b, 1));
        const cpuLimit = Math.floor(100 / Math.max(c, 1));
        return `RAM-begrænsning: ${b}x ≤ ${a}\nCPU-begrænsning: ${c}x ≤ 100\nMaks services: min(${ramLimit}, ${cpuLimit}) = ${Math.min(ramLimit, cpuLimit)}.`;
      }
    },
    backup: {
      title: 'Backup-vindue',
      description: 'Tid = datamængde / throughput. Sammenlign med tilladt vindue.',
      params: ['Datamængde (GB)', 'Throughput (GB/time)', 'Tilgængeligt vindue (timer)'],
      math: (a, b, c) => {
        const timeNeeded = a / Math.max(b, 1);
        const ok = timeNeeded <= c ? 'Kan nås i vinduet.' : 'Kræver hurtigere forbindelse eller længere vindue.';
        return `Tid = ${a} / ${b} = ${timeNeeded.toFixed(1)} timer\nVindue: ${c} timer\nVurdering: ${ok}`;
      }
    },
    helpdesk: {
      title: 'Helpdesk-plan',
      description: 'To skift skal dække dagens henvendelser. Opsæt system af ligninger.',
      params: ['Kapacitet skift A (sager/time)', 'Kapacitet skift B (sager/time)', 'Samlet behov (sager)'],
      math: (a, b, c) => {
        const denominator = Math.max(a + b, 1);
        const shiftHours = Math.round(c / denominator);
        return `System:\n${a}a + ${b}b = ${c}\na + b = ${shiftHours}\nLøs for a og b for at fordele timerne.`;
      }
    }
  };

  function setupSimulation() {
    dom.scenarioSelect.addEventListener('change', updateScenarioUI);
    [dom.paramA, dom.paramB, dom.paramC].forEach((input) => input.addEventListener('input', renderScenarioMath));
    dom.showMath.addEventListener('click', renderScenarioMath);
    document.querySelector('[data-sim-math]').addEventListener('click', renderScenarioMath);
    updateScenarioUI();
  }

  function updateScenarioUI() {
    const scenario = scenarios[dom.scenarioSelect.value];
    if (!scenario) return;
    dom.paramALabel.textContent = scenario.params[0];
    dom.paramBLabel.textContent = scenario.params[1];
    dom.paramCLabel.textContent = scenario.params[2];
    dom.scenarioTitle.textContent = scenario.title;
    dom.scenarioDescription.textContent = scenario.description;
    renderScenarioMath();
  }

  function renderScenarioMath() {
    const scenario = scenarios[dom.scenarioSelect.value];
    if (!scenario) return;
    const a = Number(dom.paramA.value);
    const b = Number(dom.paramB.value);
    const c = Number(dom.paramC.value);
    dom.scenarioMath.textContent = scenario.math(a, b, c);
  }

  async function setupTasks() {
    try {
      const response = await fetch('exercises.json');
      const data = await response.json();
      state.exercises = data;
      data.filter((task) => !task.placeholder).forEach((task) => {
        task.skills.forEach((skill) => state.skills.add(skill));
      });
      populateSkillFilter();
      renderTaskCards();
    } catch (error) {
      dom.taskGrid.textContent = 'Kunne ikke indlæse opgaver. Kontroller filen exercises.json.';
    }

    dom.filterDifficulty.addEventListener('change', renderTaskCards);
    dom.filterSkill.addEventListener('change', renderTaskCards);
    dom.taskForm.addEventListener('submit', handleSubmitAnswer);
    dom.hintButton.addEventListener('click', showHint);
    dom.solutionButton.addEventListener('click', showSolution);
  }

  function populateSkillFilter() {
    const sorted = Array.from(state.skills).sort((a, b) => a.localeCompare(b, 'da'));
    sorted.forEach((skill) => {
      const option = document.createElement('option');
      option.value = skill;
      option.textContent = skill.charAt(0).toUpperCase() + skill.slice(1);
      dom.filterSkill.appendChild(option);
    });
  }

  function renderTaskCards() {
    dom.taskGrid.innerHTML = '';
    const diff = dom.filterDifficulty.value;
    const skill = dom.filterSkill.value;
    const tasks = state.exercises.filter((task) => !task.placeholder)
      .filter((task) => diff === 'alle' || task.difficulty === diff)
      .filter((task) => skill === 'alle' || task.skills.includes(skill));

    tasks.forEach((task) => {
      const card = document.createElement('button');
      card.className = 'task-card';
      card.type = 'button';
      card.setAttribute('role', 'listitem');
      card.innerHTML = `
        <span class="difficulty">${difficultyLabel(task.difficulty)}</span>
        <h3>${task.title}</h3>
        <p>${task.prompt}</p>
      `;
      card.addEventListener('click', () => loadTask(task));
      dom.taskGrid.appendChild(card);
    });

    dom.taskCount.textContent = `${tasks.length} opgave${tasks.length === 1 ? '' : 'r'} vist.`;
  }

  function difficultyLabel(code) {
    const map = { R: 'Rød', G: 'Gul', Gr: 'Grøn' };
    return map[code] || code;
  }

  function loadTask(task) {
    state.currentTask = clone(task);
    state.hintsUsed = 0;
    dom.taskTitle.textContent = task.title;
    dom.taskMeta.textContent = `Type: ${task.type} · Niveau: ${difficultyLabel(task.difficulty)} · Færdigheder: ${task.skills.join(', ')}`;
    dom.taskPrompt.textContent = task.prompt;
    dom.taskFormat.textContent = describeSchema(task.solution_schema);
    dom.taskFeedback.textContent = '';
    dom.taskHints.innerHTML = '';
    dom.taskAnswer.value = '';
    dom.taskAnswer.setAttribute('aria-invalid', 'false');
    renderTaskLinks(task.links || []);
    dom.taskPlayer.hidden = false;
    dom.taskAnswer.focus();
  }

  function renderTaskLinks(links) {
    dom.taskLinks.innerHTML = '';
    if (!links.length) {
      dom.taskLinks.hidden = true;
      return;
    }
    dom.taskLinks.hidden = false;
    links.forEach((link) => {
      const anchor = document.createElement('a');
      anchor.href = link.target || '#';
      anchor.textContent = link.label || 'Åbn link';
      anchor.addEventListener('click', (event) => {
        if (link.action === 'graph') {
          event.preventDefault();
          applyGraphPreset(link.graph?.type || 'system', link.graph?.preset || {});
          document.getElementById('visualisering').scrollIntoView({ behavior: 'smooth' });
          dom.graph.focus({ preventScroll: true });
        }
      });
      dom.taskLinks.appendChild(anchor);
    });
  }

  function describeSchema(schema = {}) {
    if (schema.kind === 'number') {
      const tol = schema.tolerance ?? 0;
      return `Format: tal ±${tol}. Brøker er ${schema.allowFractions ? 'tilladt' : 'ikke tilladt'}.`;
    }
    if (schema.kind === 'pair') {
      return 'Format: (x; y) eller (x, y). Brug punktum eller komma for decimaler.';
    }
    if (schema.kind === 'text') {
      return 'Format: kort tekst eller konklusion.';
    }
    return 'Format: følg opgaveteksten.';
  }

  async function handleSubmitAnswer(event) {
    event.preventDefault();
    if (!state.currentTask) return;
    const answer = dom.taskAnswer.value.trim();
    if (!answer) {
      dom.taskAnswer.setAttribute('aria-invalid', 'true');
      renderFeedback(false, 'Skriv et svar før du tjekker.', 'Systemet mangler noget at sammenligne med.', 'Notér et bud og prøv igen.');
      return;
    }
    dom.taskAnswer.setAttribute('aria-invalid', 'false');

    const { evaluation, formatOk } = evaluateLocally(state.currentTask, answer);
    if (!formatOk) {
      renderFeedback(false, 'Formatet kunne ikke genkendes.', 'Svaret matcher ikke det forventede format.', 'Læs formatbeskrivelsen og prøv igen.');
      return;
    }

    let finalEvaluation = evaluation;
    if (state.llmEnabled) {
      try {
        const response = await fetch('llm_proxy.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: state.currentTask.prompt,
            studentAnswer: answer,
            expected: state.currentTask.expected_solution,
            schema: state.currentTask.solution_schema,
            skills: state.currentTask.skills,
            difficulty: state.currentTask.difficulty,
            hintsUsed: state.hintsUsed
          })
        });
        const llm = await response.json();
        if (typeof llm.correct === 'boolean') {
          finalEvaluation.correct = llm.correct;
          finalEvaluation.message = llm.correct ? 'LLM bekræfter løsningen.' : 'LLM mener svaret kræver rettelser.';
          finalEvaluation.reason = llm.reason || finalEvaluation.reason;
          finalEvaluation.next = llm.next_step || finalEvaluation.next;
        }
      } catch (error) {
        finalEvaluation.next += ' (LLM ikke tilgængelig).';
      }
    }

    renderFeedback(finalEvaluation.correct, finalEvaluation.message, finalEvaluation.reason, finalEvaluation.next);
    updateProgress(finalEvaluation.correct);
    logAttempt(answer, finalEvaluation.correct);
  }

  function evaluateLocally(task, answer) {
    const schema = task.solution_schema || {};
    const parsed = parseAnswer(answer, schema);
    if (!parsed.formatOk) {
      return {
        evaluation: {
          correct: false,
          message: 'Svaret kan ikke tolkes.',
          reason: 'Formatet afviger fra kravene.',
          next: 'Skriv i korrekt format og forsøg igen.'
        },
        formatOk: false
      };
    }

    const expected = task.expected_solution;
    const tolerance = schema.tolerance ?? 0.001;
    let correct = false;

    if (schema.kind === 'number') {
      const expectedNumber = parseNumber(expected);
      correct = Math.abs(parsed.value - expectedNumber) <= tolerance;
    } else if (schema.kind === 'pair') {
      const expectedPair = Array.isArray(expected) ? expected : parsePair(String(expected));
      if (expectedPair && parsed.value) {
        correct = Math.abs(parsed.value[0] - expectedPair[0]) <= tolerance && Math.abs(parsed.value[1] - expectedPair[1]) <= tolerance;
      }
    } else if (schema.kind === 'text') {
      correct = normaliseText(answer) === normaliseText(String(expected));
    } else {
      correct = normaliseText(answer) === normaliseText(String(expected));
    }

    const message = correct ? 'Korrekt! Din løsning passer.' : 'Ikke helt endnu.';
    const reason = correct ? 'Kontrollen viser at din beregning stemmer.' : 'Der er forskel mellem dit svar og facit.';
    const next = correct ? 'Vælg en ny opgave eller udforsk visualiseringerne.' : 'Gennemgå dine trin eller brug et hint.';

    return {
      evaluation: { correct, message, reason, next },
      formatOk: true
    };
  }

  function parseAnswer(answer, schema) {
    const cleaned = answer.replace(',', '.');
    if (schema.kind === 'pair') {
      const pair = parsePair(cleaned);
      return { formatOk: Array.isArray(pair), value: pair };
    }
    if (schema.kind === 'number') {
      const value = parseFraction(cleaned);
      return { formatOk: Number.isFinite(value), value };
    }
    if (schema.kind === 'text') {
      return { formatOk: cleaned.length > 0, value: cleaned };
    }
    return { formatOk: cleaned.length > 0, value: cleaned };
  }

  function parseNumber(value) {
    if (typeof value === 'number') return value;
    return parseFraction(String(value));
  }

  function parseFraction(str) {
    const trimmed = str.trim();
    if (/^[-+]?\d+\s*\/\s*\d+$/.test(trimmed)) {
      const [num, den] = trimmed.split('/').map(Number);
      if (den === 0) return NaN;
      return num / den;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function parsePair(str) {
    const matches = str.match(/[-+]?\d+(?:\.\d+)?|[-+]?\d+\s*\/\s*\d+/g);
    if (!matches || matches.length < 2) return null;
    const first = parseFraction(matches[0]);
    const second = parseFraction(matches[1]);
    if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
    return [first, second];
  }

  function normaliseText(text) {
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function renderFeedback(correct, message, reason, next) {
    const status = correct ? '✅ Korrekt' : '❌ Ikke korrekt endnu';
    dom.taskFeedback.innerHTML = `
      <p><strong>${status}</strong> – ${message}</p>
      <p><strong>Hvorfor:</strong> ${reason}</p>
      <p><strong>Næste skridt:</strong> ${next}</p>
    `;
  }

  function showHint() {
    if (!state.currentTask) return;
    const hints = state.currentTask.hints || [];
    if (state.hintsUsed >= hints.length) {
      dom.taskHints.innerHTML += '<p>Alle hints er brugt. Vis løsningen hvis du er gået i stå.</p>';
      return;
    }
    const hint = document.createElement('p');
    hint.textContent = `Hint ${state.hintsUsed + 1}: ${hints[state.hintsUsed]}`;
    dom.taskHints.appendChild(hint);
    state.hintsUsed += 1;
  }

  function showSolution() {
    if (!state.currentTask) return;
    const hints = state.currentTask.hints || [];
    if (state.hintsUsed < hints.length) {
      dom.taskHints.innerHTML += '<p>Brug alle hints først – derefter låses løsningen op.</p>';
      return;
    }
    const solution = Array.isArray(state.currentTask.expected_solution)
      ? `(${state.currentTask.expected_solution.join('; ')})`
      : state.currentTask.expected_solution;
    dom.taskHints.innerHTML += `<p><strong>Løsning:</strong> ${solution}</p>`;
  }

  function updateProgress(correct) {
    if (!state.currentTask) return;
    const id = state.currentTask.id;
    if (correct) {
      state.progress[id] = 1;
      saveJson('matd-progress', state.progress);
      refreshProgress();
    }
  }

  function refreshProgress() {
    const completed = Object.keys(state.progress).length;
    const total = state.exercises.filter((task) => !task.placeholder).length || 1;
    const percent = Math.round((completed / total) * 100);
    dom.progressBar.style.width = `${percent}%`;
    dom.progressBar.setAttribute('aria-valuenow', String(percent));
  }

  function bindGlobalActions() {
    dom.resetProgress.addEventListener('click', () => {
      if (confirm('Vil du nulstille din progression?')) {
        state.progress = {};
        saveJson('matd-progress', state.progress);
        refreshProgress();
      }
    });

    dom.downloadLog.addEventListener('click', () => {
      if (!state.log.length) {
        alert('Ingen logdata endnu. Løs opgaver først.');
        return;
      }
      const csv = ['timestamp,task_id,correct,hints_used'];
      state.log.forEach((entry) => csv.push(`${entry.timestamp},${entry.task},${entry.correct},${entry.hints}`));
      const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ligninger-log.csv';
      link.click();
      URL.revokeObjectURL(url);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopDemoPlayback();
      }
    });
  }

  function logAttempt(answer, correct) {
    if (!state.currentTask) return;
    state.log.push({
      timestamp: new Date().toISOString(),
      task: state.currentTask.id,
      correct: correct ? 1 : 0,
      hints: state.hintsUsed,
      answer
    });
    saveJson('matd-log', state.log);
  }

  function clone(value) {
    return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
  }

  function loadJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch (error) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
})();
