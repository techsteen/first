(function(){
  const fallbackCode = `public static void Setup() {
    SetSpeed(15);
  }
  public static void Tick(int dt) {
    ControlExample(dt);
  }
  public static void ControlExample(int dt) {
    // TODO: Udfyld styringen for den valgte opgave
  }`;

  let defaultCode = fallbackCode;
  let tasks = [];
  let currentTask = null;
  let currentMode = 'crane';
  let lastTimeline = [];
  let historyEntries = [];
  let lastTestResults = [];
  let demoButton = null;

  window.addEventListener('DOMContentLoaded', init);

  function init(){
    bindUI();
    renderHUDStructure(currentMode);
    setEditor(defaultCode);
    setStatus('Klar. Vælg opgave og tryk KØR.');
    loadTasks();
  }

  function bindUI(){
    document.getElementById('runButton').addEventListener('click', onRun);
    document.getElementById('stopButton').addEventListener('click', stopAnimation);
    document.getElementById('resetButton').addEventListener('click', () => setEditor(getCurrentStarter()));
    document.getElementById('taskSelect').addEventListener('change', onTaskChange);
    demoButton = document.getElementById('demoButton');
    if (demoButton){
      demoButton.addEventListener('click', runDemo);
      demoButton.disabled = true;
    }
    document.getElementById('hintButton').addEventListener('click', requestHint);
    document.getElementById('pseudoButton').addEventListener('click', showPseudocode);
    document.getElementById('pseudoClose').addEventListener('click', hidePseudocode);
    document.getElementById('pseudoModal').addEventListener('click', evt => {
      if (evt.target.id === 'pseudoModal') hidePseudocode();
    });
  }

  function setEditor(text){
    document.getElementById('codeEditor').value = text;
  }

  function getEditor(){
    return document.getElementById('codeEditor').value;
  }

  async function loadTasks(){
    try {
      const res = await fetch('assets/tasks.json');
      tasks = await res.json();
      const select = document.getElementById('taskSelect');
      select.innerHTML = '';
      tasks.forEach((task, index) => {
        const option = document.createElement('option');
        option.value = task.id;
        option.textContent = `${index + 1}. ${task.title}`;
        select.appendChild(option);
      });
      if (tasks.length > 0){
        select.value = tasks[0].id;
        defaultCode = tasks[0].starterCode || fallbackCode;
        setTask(tasks[0].id);
      }
    } catch (err){
      console.error(err);
      setStatus('Kunne ikke indlæse opgaver.');
    }
  }

  function onTaskChange(evt){
    setTask(evt.target.value);
  }

  function setTask(taskId){
    const nextTask = tasks.find(t => t.id === taskId);
    if (!nextTask) return;
    currentTask = nextTask;
    currentMode = currentTask.mode || 'crane';

    const desc = document.getElementById('taskDescription');
    desc.textContent = currentTask.description;
    renderCriteria(currentTask.criteria);
    renderConcepts(currentTask.concepts);
    renderResults([]);
    renderChecklist([]);
    document.getElementById('aiFeedback').textContent = '';
    updatePseudocode(currentTask.pseudocode);
    if (demoButton){
      demoButton.disabled = !currentTask.demoCode;
    }

    renderHUDStructure(currentMode);
    updateHUD(null);

    const starter = currentTask.starterCode || defaultCode;
    setEditor(starter);
    lastTimeline = [];
    lastTestResults = [];
    setStatus(`Opgave valgt: ${currentTask.title}`);
  }

  function renderCriteria(criteria){
    const list = document.getElementById('taskCriteria');
    list.innerHTML = '';
    (criteria || []).forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });
  }

  function renderConcepts(concepts){
    const list = document.getElementById('conceptList');
    list.innerHTML = '';
    const items = Array.isArray(concepts) && concepts.length ? concepts : getDefaultConcepts(currentMode);
    items.forEach(text => {
      const li = document.createElement('li');
      li.textContent = text;
      list.appendChild(li);
    });
  }

  function renderChecklist(results){
    const list = document.getElementById('checklist');
    list.innerHTML = '';
    (currentTask?.tests || []).forEach(test => {
      const result = (results || []).find(r => r.name === test.name);
      const li = document.createElement('li');
      li.textContent = test.label;
      if (!result){
        li.classList.add('check-pending');
      } else if (result.pass){
        li.classList.add('check-pass');
      } else {
        li.classList.add('check-fail');
      }
      list.appendChild(li);
    });
  }

  function onRun(){
    if (!currentTask){
      setStatus('Vælg en opgave først.');
      return;
    }
    stopAnimation();
    const code = getEditor();
    setStatus('Parser kode...');
    let parsed;
    try {
      parsed = window.Sim.parseStudentCode(code);
    } catch (err){
      console.error(err);
      const aiEnabled = document.getElementById('aiToggle').checked;
      setStatus(err.message || 'Parsefejl.');
      if (aiEnabled){
        requestHint(true, err.message || 'Parsefejl');
      }
      return;
    }

    setStatus('Simulerer...');
    let simResult;
    try {
      simResult = window.Sim.simulate(parsed, currentTask);
    } catch (err){
      console.error(err);
      setStatus(err.message || 'Simulationsfejl.');
      const aiEnabled = document.getElementById('aiToggle').checked;
      if (aiEnabled){
        requestHint(true, err.message || 'Simulationsfejl');
      }
      return;
    }

    lastTimeline = simResult.timeline;
    if (!lastTimeline || !lastTimeline.length){
      setStatus('Simulation gav ingen data.');
      return;
    }

    window.Animator.start(lastTimeline, updateHUD, handleAnimationStop, {mode: simResult.mode || currentMode, task: currentTask});
    const tests = window.TestRunner.runTests(lastTimeline, currentTask);
    lastTestResults = tests;
    renderResults(tests);
    renderChecklist(tests);
    appendHistory({
      time: new Date(),
      task: currentTask.title,
      success: tests.every(t => t.pass),
      message: simResult.message || 'Simulation fuldført.'
    });
    setStatus('Simulation færdig.');
  }

  function runDemo(){
    if (!currentTask){
      setStatus('Vælg en opgave for at se en demo.');
      return;
    }
    if (!currentTask.demoCode){
      setStatus('Der findes ingen demo for denne opgave endnu.');
      return;
    }
    stopAnimation();
    setStatus('Forbereder demo...');
    let parsed;
    try {
      parsed = window.Sim.parseStudentCode(currentTask.demoCode);
    } catch (err){
      console.error('Demo parse fejl', err);
      setStatus('Demo-koden kunne ikke fortolkes. Kontakt underviseren.');
      return;
    }
    let simResult;
    try {
      simResult = window.Sim.simulate(parsed, currentTask);
    } catch (err){
      console.error('Demo simulation fejl', err);
      setStatus('Demoen kunne ikke afspilles. Kontakt underviseren.');
      return;
    }
    lastTimeline = simResult.timeline;
    if (!lastTimeline || !lastTimeline.length){
      setStatus('Demoen gav ingen bevægelse.');
      return;
    }
    window.Animator.start(lastTimeline, updateHUD, handleAnimationStop, {mode: simResult.mode || currentMode, task: currentTask});
    const tests = window.TestRunner.runTests(lastTimeline, currentTask);
    lastTestResults = tests;
    renderResults(tests);
    renderChecklist(tests);
    appendHistory({
      time: new Date(),
      task: `Demo – ${currentTask.title}`,
      success: tests.every(t => t.pass),
      message: 'Demo afspillet.'
    });
    setStatus('Demo afspilles. Resultaterne viser en mulig løsning.');
  }

  function renderResults(results){
    const container = document.getElementById('results');
    container.innerHTML = '';
    if (!results || !results.length){
      const empty = document.createElement('div');
      empty.textContent = 'Ingen testresultater tilgængelige.';
      container.appendChild(empty);
      return;
    }
    results.forEach(result => {
      const div = document.createElement('div');
      div.className = result.pass ? 'result-pass' : 'result-fail';
      const status = result.pass ? '✔ Bestået' : '✖ Fejl';
      div.innerHTML = `<strong>${status}:</strong> ${result.name}`;
      if (result.detail){
        const p = document.createElement('div');
        p.textContent = result.detail;
        div.appendChild(p);
      }
      container.appendChild(div);
    });
  }

  function appendHistory(entry){
    historyEntries.unshift(entry);
    historyEntries = historyEntries.slice(0, 20);
    const container = document.getElementById('runHistory');
    container.innerHTML = '';
    historyEntries.forEach(item => {
      const div = document.createElement('div');
      div.className = item.success ? 'history-success' : 'history-fail';
      const time = item.time.toLocaleTimeString();
      div.innerHTML = `<strong>${time}</strong> – ${item.task} – ${item.success ? '✔' : '✖'} ${item.message}`;
      container.appendChild(div);
    });
  }

  function stopAnimation(){
    window.Animator.stop('user');
  }

  function handleAnimationStop(reason){
    switch(reason){
      case 'completed':
        setStatus('Afspilning fuldført.');
        break;
      case 'user':
        setStatus('Afspilning stoppet.');
        break;
      case 'error':
        setStatus('Animationen blev afbrudt.');
        break;
      default:
        break;
    }
  }

  function updateHUD(sample){
    if (!sample){
      resetHudValues();
      return;
    }
    if (currentMode === 'car'){
      const posText = `${sample.x !== undefined ? sample.x.toFixed(2) : '0.00'} / ${sample.y !== undefined ? sample.y.toFixed(2) : '0.00'}`;
      setHudValue('hud-pos', posText);
      const heading = sample.heading !== undefined ? normalizeHeading(sample.heading).toFixed(0) + '°' : '0°';
      setHudValue('hud-heading', heading);
      const checkpointsTotal = Array.isArray(currentTask?.checkpoints) ? currentTask.checkpoints.length : 0;
      const checkpointCount = sample.checkpoints !== undefined ? sample.checkpoints : 0;
      const checkpointText = checkpointsTotal ? `${checkpointCount}/${checkpointsTotal}` : `${checkpointCount}`;
      setHudValue('hud-checkpoint', checkpointText);
      const status = sample.collided ? 'Kollision' : sample.goal ? 'Mål nået' : (sample.safe || 'green');
      setHudValue('hud-status', status);
      const hud = document.getElementById('hud');
      hud.style.border = `2px solid ${sample.collided ? '#ff6b6b' : '#5bff8a'}`;
    } else {
      const angle = sample.angle !== undefined ? sample.angle.toFixed(1) : '0.0';
      const height = sample.height !== undefined ? sample.height.toFixed(2) : '0.00';
      const safe = sample.safe || 'green';
      setHudValue('hud-angle', `${angle}°`);
      setHudValue('hud-height', `${height} m`);
      setHudValue('hud-safety', safe);
      const hud = document.getElementById('hud');
      hud.style.border = `2px solid ${safe === 'green' ? '#5bff8a' : safe === 'yellow' ? '#ffe66d' : '#ff6b6b'}`;
    }
  }

  async function requestHint(force, parseError){
    if (!currentTask) return;
    const aiEnabled = document.getElementById('aiToggle').checked;
    if (!aiEnabled && !force && !parseError){
      setStatus('AI-Emulation er slået fra.');
      return;
    }
    const button = document.getElementById('hintButton');
    button.disabled = true;
    setStatus('Kontakter AI...');
    try {
      const schemaRes = await fetch('assets/ai_schemas.json');
      const schemaData = await schemaRes.json();
      const executionMode = (aiEnabled || parseError) ? 'ai_emulation' : 'deterministic';
      const lastSample = lastTimeline[lastTimeline.length - 1] || (currentMode === 'car'
        ? {t:0, x:0, y:0, heading:0, safe:'green'}
        : {t:0, angle:0, height:0, safe:'green'});
      const payload = {
        execution_mode: executionMode,
        task: currentTask,
        student_code_excerpt: getEditor().slice(0, 2000),
        failed_tests: (lastTestResults || []).filter(r => !r.pass).map(r => ({name: r.name, detail: r.detail})),
        sim_state: lastSample,
        parse_error: parseError || null,
        output_schema: schemaData.ai_output
      };
      const res = await fetch('api/ai.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.error){
        setStatus('AI-fejl: ' + data.error);
        button.disabled = false;
        return;
      }
      const aiActive = executionMode === 'ai_emulation';
      displayAIResponse(data, aiActive);
      if (aiActive && Array.isArray(data.timeline) && data.timeline.length){
        window.Animator.start(data.timeline, updateHUD, handleAnimationStop, {mode: currentMode, task: currentTask});
      }
      setStatus('AI-svar modtaget.');
    } catch (err){
      console.error(err);
      setStatus('Kunne ikke hente AI-hint.');
    } finally {
      button.disabled = false;
    }
  }

  function displayAIResponse(data, aiMode){
    const container = document.getElementById('aiFeedback');
    container.innerHTML = '';
    const exTitle = document.createElement('strong');
    exTitle.textContent = 'Forklaringer:';
    container.appendChild(exTitle);
    const exList = document.createElement('ul');
    (data.explanations || []).forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      exList.appendChild(li);
    });
    container.appendChild(exList);

    const hintTitle = document.createElement('strong');
    hintTitle.textContent = 'Mikro-hints:';
    container.appendChild(hintTitle);
    const hintList = document.createElement('ul');
    (data.micro_hints || []).forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      hintList.appendChild(li);
    });
    container.appendChild(hintList);

    if (aiMode && Array.isArray(data.timeline) && data.timeline.length){
      const note = document.createElement('div');
      note.textContent = 'Timeline fra AI-emulation afspilles.';
      container.appendChild(note);
    }
  }

  function setStatus(text){
    document.getElementById('status').textContent = text;
  }

  function showPseudocode(){
    const modal = document.getElementById('pseudoModal');
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
  }

  function hidePseudocode(){
    const modal = document.getElementById('pseudoModal');
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }

  function updatePseudocode(text){
    const body = document.getElementById('pseudoBody');
    if (!text){
      body.textContent = 'Ingen pseudokode tilgængelig for denne opgave endnu.';
    } else {
      body.textContent = text;
    }
  }

  function getCurrentStarter(){
    return currentTask?.starterCode || defaultCode;
  }

  function getDefaultConcepts(mode){
    if (mode === 'car'){
      return [
        'Heading 0° peger mod højre. Drejninger sker i trin på 90°.',
        'IsWallAhead(distance) kan bruges til at tjekke næste felt i labyrinten.',
        'Hold styr på dine trin med fx en stage-variabel og opdater den efter hver bevægelse.'
      ];
    }
    return [
      'RotateTo(vinkel) sætter et mål. Simulatoren drejer mod målet med den hastighed du sidst angav.',
      'Overshoot er hvor mange grader vi glider forbi målet efter første træf. Lav hastighed giver mindre overshoot.'
    ];
  }

  function renderHUDStructure(mode){
    const hud = document.getElementById('hud');
    if (!hud) return;
    hud.innerHTML = '';
    hud.dataset.mode = mode;
    if (mode === 'car'){
      createHudLine(hud, 'Position (x/y)', 'hud-pos');
      createHudLine(hud, 'Heading', 'hud-heading');
      createHudLine(hud, 'Checkpoints', 'hud-checkpoint');
      createHudLine(hud, 'Status', 'hud-status');
    } else {
      createHudLine(hud, 'Vinkel', 'hud-angle');
      createHudLine(hud, 'Højde', 'hud-height');
      createHudLine(hud, 'Sikkerhed', 'hud-safety');
    }
    resetHudValues();
  }

  function createHudLine(container, label, key){
    const span = document.createElement('span');
    span.className = 'hud-line';
    const labelSpan = document.createElement('span');
    labelSpan.className = 'hud-label';
    labelSpan.textContent = label + ':';
    const value = document.createElement('strong');
    value.className = 'hud-value';
    value.dataset.key = key;
    value.textContent = '—';
    span.appendChild(labelSpan);
    span.appendChild(value);
    container.appendChild(span);
  }

  function setHudValue(key, text){
    const hud = document.getElementById('hud');
    if (!hud) return;
    const target = hud.querySelector(`[data-key="${key}"]`);
    if (target){
      target.textContent = text;
    }
  }

  function resetHudValues(){
    const hud = document.getElementById('hud');
    if (!hud) return;
    hud.querySelectorAll('[data-key]').forEach(el => {
      el.textContent = '—';
    });
    hud.style.border = '2px solid rgba(255,255,255,0.2)';
  }

  function normalizeHeading(value){
    let heading = value || 0;
    heading %= 360;
    if (heading < 0) heading += 360;
    return heading;
  }

})();
