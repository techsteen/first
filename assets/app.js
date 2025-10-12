(function(){
  const defaultCode = `public static void Setup() {
    SetSpeed(15);
  }
  public static void Tick(int dt) {
    // Opgave 1 eksempel: roter til 90°
    if (GetAngle() < 90) { RotateTo(90); }
  }`;

  let tasks = [];
  let currentTask = null;
  let lastTimeline = [];
  let historyEntries = [];
  let lastTestResults = [];

  window.addEventListener('DOMContentLoaded', init);

  function init(){
    bindUI();
    loadTasks();
    setEditor(defaultCode);
    setStatus('Klar. Vælg opgave og tryk KØR.');
  }

  function bindUI(){
    document.getElementById('runButton').addEventListener('click', onRun);
    document.getElementById('stopButton').addEventListener('click', stopAnimation);
    document.getElementById('resetButton').addEventListener('click', () => setEditor(defaultCode));
    document.getElementById('taskSelect').addEventListener('change', onTaskChange);
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
    currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask) return;
    const desc = document.getElementById('taskDescription');
    desc.textContent = currentTask.description;
    renderCriteria(currentTask.criteria);
    renderConcepts(currentTask.concepts);
    renderResults([]);
    renderChecklist([]);
    document.getElementById('aiFeedback').textContent = '';
    updatePseudocode(currentTask.pseudocode);
    setStatus('Opgave valgt: ' + currentTask.title);
  }

  function renderCriteria(criteria){
    const list = document.getElementById('taskCriteria');
    list.innerHTML = '';
    criteria.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });
  }

  function renderConcepts(concepts){
    const list = document.getElementById('conceptList');
    list.innerHTML = '';
    const defaults = [
      'RotateTo(vinkel) sætter et mål. Simulatoren drejer stille og roligt mod målet med den hastighed, du sidst satte med SetSpeed.',
      'Overshoot er hvor mange grader vi glider forbi målet efter vi første gang rammer det. Mindre overshoot betyder roligere stop.'
    ];
    const items = Array.isArray(concepts) && concepts.length ? concepts : defaults;
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
      const result = results.find(r => r.name === test.name);
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
    if (!lastTimeline || lastTimeline.length === 0){
      setStatus('Simulation gav ingen data.');
      return;
    }
    window.Animator.start(lastTimeline, updateHUD, handleAnimationStop);
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

  function renderResults(results){
    const container = document.getElementById('results');
    container.innerHTML = '';
    if (!results || results.length === 0){
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
    if (!sample) return;
    document.getElementById('hudAngle').textContent = `${sample.angle.toFixed(1)}°`;
    document.getElementById('hudHeight').textContent = `${sample.height.toFixed(2)} m`;
    document.getElementById('hudSafety').textContent = sample.safe;
    const hud = document.getElementById('hud');
    hud.style.border = `2px solid ${sample.safe === 'green' ? '#5bff8a' : sample.safe === 'yellow' ? '#ffe66d' : '#ff6b6b'}`;
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
      const payload = {
        execution_mode: executionMode,
        task: currentTask,
        student_code_excerpt: getEditor().slice(0, 2000),
        failed_tests: lastTestResults.filter(r => !r.pass).map(r => ({name: r.name, detail: r.detail})),
        sim_state: lastTimeline[lastTimeline.length - 1] || {angle:0, height:0, safe:'green', t:0},
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
        window.Animator.start(data.timeline, updateHUD, handleAnimationStop);
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

})();
