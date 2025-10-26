(function () {
  const DIRECTIONS = ["north", "east", "south", "west"];
  const ARROWS = {
    north: "↑",
    east: "→",
    south: "↓",
    west: "←"
  };
  const MAX_ACTIONS = 500;

  const LANGUAGE_CONFIG = {
    csharp: {
      label: "C#",
      commandReference: [
        {
          code: "class Program {\n    static void Main(string[] args) { … }\n}",
          description: "Simulatoren starter i Main-metoden. Placer dine kommandoer her eller i egne hjælpefunktioner."
        },
        {
          code: "frem();",
          description: "Flytter robotten et felt frem i den retning, den vender."
        },
        {
          code: "venstre();",
          description: "Drejer robotten 90° mod venstre."
        },
        {
          code: "højre();",
          description: "Drejer robotten 90° mod højre."
        },
        {
          code: "blokering(\"retning\");",
          description: "Returnerer true hvis der er en blokering i retningen. Brug f.eks. \"frem\", \"venstre\", \"højre\" eller \"mål\"."
        },
        {
          code: "Console.WriteLine(\"tekst\");",
          description: "Skriver en besked i loggen, så du kan følge programmets flow."
        }
      ]
    },
    powershell: {
      label: "PowerShell",
      commandReference: [
        {
          code: "frem",
          description: "Flytter robotten et felt frem i den retning, den vender. Skriv kommandoen på en linje for sig."
        },
        {
          code: "venstre",
          description: "Drejer robotten 90° mod venstre."
        },
        {
          code: "højre",
          description: "Drejer robotten 90° mod højre."
        },
        {
          code: "blokering \"retning\"",
          description: "Returnerer $true hvis der er en blokering i retningen. Brug f.eks. \"frem\", \"venstre\", \"højre\" eller \"mål\"."
        }
      ]
    }
  };

  const state = {
    selectedLevel: null,
    selectedTask: null,
    boardState: null,
    codeByTaskLanguage: {},
    logEntries: [],
    selectedLanguage: "csharp",
    tasks: normalizeTasks(Array.isArray(window.FALLBACK_TASKS) ? window.FALLBACK_TASKS : []),
    isRunning: false,
    hintIndex: 0,
    stepSession: null,
    lastExecution: null,
    lastPrompt: null,
    lastModelResponse: null
  };

  const dom = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    dom.levelSelector = document.getElementById("level-selector");
    dom.taskList = document.getElementById("task-list");
    dom.taskDetails = document.getElementById("task-details");
    dom.board = document.getElementById("board");
    dom.editor = document.getElementById("code-editor");
    dom.runBtn = document.getElementById("run-btn");
    dom.stepBtn = document.getElementById("step-btn");
    dom.resetBtn = document.getElementById("reset-btn");
    dom.aiFeedbackBtn = document.getElementById("ai-feedback-btn");
    dom.hintBtn = document.getElementById("hint-btn");
    dom.feedback = document.getElementById("feedback");
    dom.aiFeedback = document.getElementById("ai-feedback-output");
    dom.hint = document.getElementById("hint-output");
    dom.log = document.getElementById("log");
    dom.commandReference = document.getElementById("command-reference");
    dom.languageInputs = document.querySelectorAll('input[name="language"]');
    dom.promptSection = document.getElementById("prompt-debug-section");
    dom.promptDebug = document.getElementById("prompt-debug");
    dom.responseDebug = document.getElementById("response-debug");

    if (dom.aiFeedback) {
      dom.aiFeedback.textContent = "";
      dom.aiFeedback.classList.add("hidden");
    }

    const initialLanguage = Array.from(dom.languageInputs || []).find(input => input.checked);
    if (initialLanguage) {
      state.selectedLanguage = initialLanguage.value;
    }

    renderCommandReference();
    bindEvents();
    initializeTasks();
    updatePromptDebug(state.lastPrompt);
    updateResponseDebug(state.lastModelResponse);
  }

  function initializeTasks() {
    state.tasks = normalizeTasks(Array.isArray(window.FALLBACK_TASKS) ? window.FALLBACK_TASKS : []);
    renderLevelButtons();
    const defaultLevel = getFirstLevel();
    if (defaultLevel !== null) {
      selectLevel(defaultLevel);
    } else {
      renderTaskButtons();
    }
  }

  function bindEvents() {
    dom.runBtn.addEventListener("click", handleRun);
    if (dom.stepBtn) {
      dom.stepBtn.dataset.defaultLabel = dom.stepBtn.textContent;
      dom.stepBtn.addEventListener("click", handleStepRun);
    }
    dom.resetBtn.addEventListener("click", handleReset);
    if (dom.aiFeedbackBtn) {
      dom.aiFeedbackBtn.addEventListener("click", handleAiFeedback);
    }
    if (dom.hintBtn) {
      dom.hintBtn.addEventListener("click", showNextHint);
    }
    dom.editor.addEventListener("input", () => {
      clearStepSession();
      if (state.selectedTask) {
        storeCurrentCode();
      }
    });
    Array.from(dom.languageInputs || []).forEach(input => {
      input.addEventListener("change", event => {
        if (event.target.checked) {
          setLanguage(event.target.value);
        }
      });
    });
  }

  function normalizeTasks(tasks) {
    if (!Array.isArray(tasks)) return [];
    return tasks
      .map((task, index) => normalizeTask(task, index))
      .filter(Boolean)
      .sort((a, b) => {
        if (a.level !== b.level) {
          return a.level - b.level;
        }
        return a.id.localeCompare(b.id, "da", { numeric: true });
      });
  }

  function normalizeTask(task, index) {
    if (!task || typeof task !== "object") return null;
    const board = task.board || {};
    const normalized = {
      id: typeof task.id === "string" ? task.id : `task-${index + 1}`,
      level: Number.isFinite(task.level) ? Number(task.level) : 1,
      title: task.title || "Opgave",
      objective: task.objective || "", 
      learningFocus: task.learningFocus || "",
      templates: normalizeTemplates(task.templates),
      tips: Array.isArray(task.tips) ? task.tips : [],
      board: {
        size: Number.isFinite(board.size) ? clamp(board.size, 4, 12) : 8,
        start: normalizeCoordinate(board.start, { x: 0, y: 7, direction: "east" }),
        goal: normalizeGoal(board.goal),
        obstacles: normalizePoints(board.obstacles),
        checkpoints: normalizePoints(board.checkpoints),
        revealOnRun: Boolean(board.revealOnRun),
        randomizeObstacles: Boolean(board.randomizeObstacles)
      }
    };

    if (normalized.level === 3) {
      normalized.board.revealOnRun = false;
      normalized.board.obstacles = ensureLevelThreeObstacles(normalized.board);
    }

    return normalized;
  }

  function normalizeTemplates(templates) {
    const fallback = {
      csharp: "class Program {\n    static void Main(string[] args) {\n        // Skriv din kode her\n    }\n}\n",
      powershell: "function Invoke-Program {\n    # Skriv din kode her\n}\n\nInvoke-Program\n"
    };

    if (!templates || typeof templates !== "object") {
      return fallback;
    }

    return {
      csharp: typeof templates.csharp === "string" ? templates.csharp : fallback.csharp,
      powershell: typeof templates.powershell === "string" ? templates.powershell : fallback.powershell
    };
  }

  function normalizeCoordinate(coordinate, fallback) {
    if (!coordinate || typeof coordinate !== "object") {
      return { ...fallback };
    }
    const parsedX = Number(coordinate.x);
    const parsedY = Number(coordinate.y);
    return {
      x: clamp(Number.isFinite(parsedX) ? parsedX : fallback.x, 0, 7),
      y: clamp(Number.isFinite(parsedY) ? parsedY : fallback.y, 0, 7),
      direction: typeof coordinate.direction === "string" && DIRECTIONS.includes(coordinate.direction)
        ? coordinate.direction
        : fallback.direction
    };
  }

  function normalizeGoal(goal) {
    if (!goal || typeof goal !== "object") return null;
    const parsedX = Number(goal.x);
    const parsedY = Number(goal.y);
    if (!Number.isFinite(parsedX) || !Number.isFinite(parsedY)) {
      return null;
    }
    return {
      x: clamp(parsedX, 0, 7),
      y: clamp(parsedY, 0, 7)
    };
  }

  function normalizePoints(points) {
    if (!Array.isArray(points)) return [];
    return points
      .map(point => {
        const parsedX = Number(point.x);
        const parsedY = Number(point.y);
        if (!Number.isFinite(parsedX) || !Number.isFinite(parsedY)) {
          return null;
        }
        return {
          x: clamp(parsedX, 0, 7),
          y: clamp(parsedY, 0, 7)
        };
      })
      .filter(Boolean);
  }

  function ensureLevelThreeObstacles(board) {
    const result = Array.isArray(board.obstacles) ? board.obstacles.map(ob => ({ ...ob })) : [];
    const occupied = new Set(result.map(ob => `${ob.x},${ob.y}`));
    const startKey = `${board.start.x},${board.start.y}`;
    const goalKey = board.goal ? `${board.goal.x},${board.goal.y}` : null;

    const candidateRow = clamp(board.start.y, 1, board.size - 2);
    const baseX = clamp(board.start.x + 2, 1, board.size - 2);
    const candidates = [
      { x: baseX, y: candidateRow },
      { x: Math.min(board.size - 1, baseX + 1), y: candidateRow }
    ];

    candidates.forEach(point => {
      const key = `${point.x},${point.y}`;
      if (key !== startKey && key !== goalKey && !occupied.has(key)) {
        result.push(point);
        occupied.add(key);
      }
    });

    let fallbackX = 0;
    while (result.length < 2 && fallbackX < board.size) {
      const fallbackPoint = { x: fallbackX, y: candidateRow };
      const key = `${fallbackPoint.x},${fallbackPoint.y}`;
      if (key !== startKey && key !== goalKey && !occupied.has(key)) {
        result.push(fallbackPoint);
        occupied.add(key);
      }
      fallbackX++;
    }

    return result.slice(0, Math.max(result.length, 2));
  }

  function getCodeKey(taskId, language = state.selectedLanguage) {
    return `${taskId}::${language}`;
  }

  function getStoredCode(taskId) {
    return state.codeByTaskLanguage[getCodeKey(taskId)];
  }

  function storeCurrentCode() {
    if (!state.selectedTask) return;
    state.codeByTaskLanguage[getCodeKey(state.selectedTask.id)] = dom.editor.value;
  }

  function getTemplateForTask(task) {
    if (!task) return "";
    if (task.templates && task.templates[state.selectedLanguage]) {
      return task.templates[state.selectedLanguage];
    }
    if (task.template) {
      return task.template;
    }
    return "";
  }

  function renderCommandReference() {
    if (!dom.commandReference) return;
    const config = LANGUAGE_CONFIG[state.selectedLanguage];
    if (!config) {
      dom.commandReference.innerHTML = "";
      return;
    }
    dom.commandReference.innerHTML = config.commandReference
      .map(item => `<li><code>${item.code}</code><span>${item.description}</span></li>`)
      .join("");
  }

  function setLanguage(language) {
    if (!language || language === state.selectedLanguage) {
      return;
    }

    if (state.selectedTask) {
      storeCurrentCode();
    }

    state.selectedLanguage = language;
    renderCommandReference();

    if (state.selectedTask) {
      clearStepSession();
      const stored = getStoredCode(state.selectedTask.id);
      dom.editor.value = stored !== undefined ? stored : getTemplateForTask(state.selectedTask);
    }
  }

  function renderLevelButtons() {
    if (!dom.levelSelector) return;
    const levels = getLevels();
    dom.levelSelector.innerHTML = "";

    if (!levels.length) {
      const message = document.createElement("div");
      message.className = "loading";
      message.textContent = "Ingen opgaver fundet.";
      dom.levelSelector.appendChild(message);
      return;
    }

    levels.forEach(level => {
      const btn = document.createElement("button");
      btn.textContent = `Niveau ${level}`;
      btn.addEventListener("click", () => selectLevel(level));
      btn.dataset.level = level;
      dom.levelSelector.appendChild(btn);
    });
  }

  function getLevels() {
    const levels = [...new Set(state.tasks.map(task => task.level))];
    return levels.sort((a, b) => a - b);
  }

  function getFirstLevel() {
    const levels = getLevels();
    return levels.length ? levels[0] : null;
  }

  function updateLevelButtonState() {
    Array.from(dom.levelSelector.children).forEach(btn => {
      btn.classList.toggle("active", Number(btn.dataset.level) === state.selectedLevel);
    });
  }

  function selectLevel(level) {
    state.selectedLevel = level;
    updateLevelButtonState();
    renderTaskButtons();

    const tasksForLevel = state.tasks.filter(t => t.level === level);
    if (tasksForLevel.length) {
      selectTask(tasksForLevel[0].id);
    } else {
      state.selectedTask = null;
      state.boardState = null;
      renderTaskDetails(null);
      dom.editor.value = "";
      if (dom.board) {
        dom.board.innerHTML = "";
      }
    }
  }

  function renderTaskButtons() {
    const tasks = state.tasks.filter(t => t.level === state.selectedLevel);
    dom.taskList.innerHTML = "";

    if (!tasks.length) {
      const empty = document.createElement("div");
      empty.className = "loading";
      empty.textContent = "Ingen opgaver fundet for dette niveau.";
      dom.taskList.appendChild(empty);
      return;
    }

    tasks.forEach(task => {
      const btn = document.createElement("button");
      btn.textContent = `${task.id} • ${task.title}`;
      btn.dataset.taskId = task.id;
      btn.addEventListener("click", () => selectTask(task.id));
      dom.taskList.appendChild(btn);
    });
    updateTaskButtonState();
  }

  function updateTaskButtonState() {
    Array.from(dom.taskList.children).forEach(btn => {
      btn.classList.toggle("active", state.selectedTask && btn.dataset.taskId === state.selectedTask.id);
    });
  }

  function selectTask(taskId) {
    if (state.selectedTask && dom.editor.value !== undefined) {
      storeCurrentCode();
    }

    const task = state.tasks.find(t => t.id === taskId);
    if (!task) {
      return;
    }

    clearStepSession();
    state.selectedTask = task;
    updateTaskButtonState();
    renderTaskDetails(task);
    state.boardState = createBoardState(task);
    buildBoardGrid(state.boardState.size);
    drawBoard();
    dom.feedback.textContent = task.objective ? `Mål: ${task.objective}` : "";
    dom.feedback.className = "feedback";
    clearAiFeedback();
    state.lastExecution = null;
    state.hintIndex = 0;
    if (dom.hint) {
      dom.hint.innerHTML = "";
      dom.hint.className = "hint-output";
    }
    state.logEntries = [];
    updateLog();

    const stored = getStoredCode(task.id);
    const template = getTemplateForTask(task);
    dom.editor.value = stored !== undefined ? stored : template;
  }

  function renderTaskDetails(task) {
    if (!task) {
      dom.taskDetails.innerHTML = "<p>Vælg en opgave for at se detaljer.</p>";
      return;
    }
    dom.taskDetails.innerHTML = `
      <h2>Niveau ${task.level}: ${task.title}</h2>
      <p><strong>Mål:</strong> ${task.objective}</p>
      <p><strong>Læringsfokus:</strong> ${task.learningFocus}</p>
      <p class="task-meta">Brug "Vis hint"-knappen for gradvise hints til denne opgave.</p>
      <p class="task-meta">Hold <kbd>Shift</kbd> nede når du klikker på "Nulstil" for at gendanne startkoden.</p>
    `;
  }

  function showNextHint() {
    if (!state.selectedTask || !dom.hint) {
      return;
    }

    const tips = Array.isArray(state.selectedTask.tips) ? state.selectedTask.tips : [];
    if (!tips.length) {
      dom.hint.textContent = "Der er ingen hints til denne opgave.";
      dom.hint.className = "hint-output visible";
      return;
    }

    if (state.hintIndex >= tips.length) {
      dom.hint.textContent = "Du har set alle hints for denne opgave.";
      dom.hint.className = "hint-output visible";
      return;
    }

    state.hintIndex += 1;

    const list = document.createElement("ol");
    list.className = "hint-list";

    tips.slice(0, state.hintIndex).forEach((tipText, index) => {
      const item = document.createElement("li");
      item.textContent = tipText;
      item.dataset.index = index;
      list.appendChild(item);
    });

    dom.hint.innerHTML = "";
    dom.hint.appendChild(list);
    dom.hint.className = "hint-output visible";
  }

  function createBoardState(task) {
    const board = task.board || {};
    const cloneObstacles = (board.obstacles || []).map(ob => ({ ...ob }));
    const cloneCheckpoints = (board.checkpoints || []).map(cp => ({ ...cp }));

    return {
      size: board.size || 8,
      start: { ...board.start },
      goal: board.goal ? { ...board.goal } : null,
      agent: { ...board.start },
      baseObstacles: cloneObstacles,
      obstacles: cloneObstacles.map(ob => ({ ...ob })),
      checkpoints: cloneCheckpoints,
      revealOnRun: Boolean(board.revealOnRun),
      randomizeObstacles: Boolean(board.randomizeObstacles),
      obstaclesVisible: !board.revealOnRun
    };
  }

  function buildBoardGrid(size) {
    dom.board.innerHTML = "";
    const cellSize = 100 / size;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cell = document.createElement("div");
        cell.className = `cell ${(x + y) % 2 === 0 ? "light" : "dark"}`;
        cell.style.left = `${x * cellSize}%`;
        cell.style.top = `${y * cellSize}%`;
        cell.style.width = `${cellSize}%`;
        cell.style.height = `${cellSize}%`;
        cell.dataset.x = x;
        cell.dataset.y = y;

        const content = document.createElement("div");
        content.className = "content";
        cell.appendChild(content);
        dom.board.appendChild(cell);
      }
    }

    if (!dom.agent) {
      dom.agent = document.createElement("div");
      dom.agent.className = "agent";
      const avatar = document.createElement("div");
      avatar.className = "avatar";
      dom.agent.appendChild(avatar);
    }
    dom.board.appendChild(dom.agent);
  }

  function drawBoard() {
    if (!state.boardState) return;
    const { size, start, goal, obstacles, obstaclesVisible, checkpoints, agent } = state.boardState;

    const cells = dom.board.querySelectorAll(".cell");
    cells.forEach(cell => {
      cell.classList.remove("start", "goal", "obstacle", "checkpoint");
      const content = cell.querySelector(".content");
      if (content) {
        content.textContent = "";
      }
    });

    const startCell = getCell(start.x, start.y);
    if (startCell) {
      startCell.classList.add("start");
      const content = startCell.querySelector(".content");
      if (content) content.textContent = "S";
    }

    if (goal) {
      const goalCell = getCell(goal.x, goal.y);
      if (goalCell) {
        goalCell.classList.add("goal");
        const content = goalCell.querySelector(".content");
        if (content) content.textContent = "M";
      }
    }

    checkpoints.forEach(cp => {
      const cell = getCell(cp.x, cp.y);
      if (cell) {
        cell.classList.add("checkpoint");
        const content = cell.querySelector(".content");
        if (content) content.textContent = "C";
      }
    });

    if (obstaclesVisible) {
      obstacles.forEach(ob => {
        const cell = getCell(ob.x, ob.y);
        if (cell) {
          cell.classList.add("obstacle");
          const content = cell.querySelector(".content");
          if (content) content.textContent = "X";
        }
      });
    }

    positionAgent(agent, size);
  }

  function getCell(x, y) {
    return dom.board.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
  }

  function positionAgent(agent, size) {
    if (!dom.agent) return;
    const cellSize = 100 / size;
    dom.agent.style.left = `${agent.x * cellSize}%`;
    dom.agent.style.top = `${agent.y * cellSize}%`;
    dom.agent.style.width = `${cellSize}%`;
    dom.agent.style.height = `${cellSize}%`;

    const avatar = dom.agent.querySelector(".avatar");
    if (avatar) {
      avatar.textContent = ARROWS[agent.direction];
    }
  }

  async function handleRun() {
    if (!state.selectedTask || !state.boardState || state.isRunning) return;

    clearStepSession();
    clearAiFeedback();
    state.isRunning = true;
    setRunButtonBusy(true);
    state.lastExecution = null;

    try {
      const task = state.selectedTask;
      const boardState = state.boardState;
      const rawCode = dom.editor.value;

      state.logEntries = [];
      updateLog();

      const mismatch = detectLanguageMismatch(rawCode, state.selectedLanguage);
      if (mismatch) {
        appendLog("❌ Kodesproget matcher ikke valget");
        (mismatch.logLines || []).forEach(line => appendLog(`   ${line}`));
        dom.feedback.textContent = mismatch.message;
        dom.feedback.className = "feedback error";
        state.isRunning = false;
        setRunButtonBusy(false);
        drawBoard();
        return;
      }

      dom.feedback.textContent = "Validerer kode…";
      dom.feedback.className = "feedback";

      appendLog("▶️ Validerer kode");
      const validation = await validateCode(rawCode, state.selectedLanguage, task.objective);
      applyPromptFromResponse(validation, "preflight");
      applyModelResponseFromPayload(validation, "preflight");

      if (validation.warning) {
        appendLog(`⚠️ ${validation.warning}`);
      }

      const stopReason = typeof validation.stopReason === "string" ? validation.stopReason : "";
      const hasCompileError = !validation.ok && stopReason === "compile";
      const hasRuntimeBlock = !validation.ok && stopReason === "runtime";

      if (hasCompileError) {
        appendLog("❌ Kompileringsfejl fundet");
        (validation.errors || []).forEach(error => {
          const lineInfo = Number.isFinite(error.line) ? `Linje ${error.line}: ` : "";
          appendLog(`   ${lineInfo}${error.message}`);
        });
        const fallbackMessage = task.objective
          ? `Koden indeholder fejl. Husk: ${task.objective}`
          : "Koden indeholder fejl. Tjek loggen.";
        const stopMessage = validation.shortMessage || fallbackMessage;
        dom.feedback.textContent = stopMessage;
        dom.feedback.className = "feedback error";
        drawBoard();
        return;
      }

      if (hasRuntimeBlock) {
        appendLog("⚠️ Mulig runtime-fejl opdaget (fortsætter efter ønske)");
        (validation.errors || []).forEach(error => {
          const lineInfo = Number.isFinite(error.line) ? `Linje ${error.line}: ` : "";
          appendLog(`   ${lineInfo}${error.message}`);
        });
        if (validation.shortMessage) {
          appendLog(`   ${validation.shortMessage}`);
        }
      } else if (!validation.ok) {
        appendLog("⚠️ Valideringen kunne ikke bekræfte koden, men der blev ikke fundet kompileringsfejl");
      }

      appendLog("✅ Ingen kompileringsfejl fundet");

      resetBoardState(boardState);
      dom.feedback.textContent = task.objective
        ? `Programmet kører… Fokus: ${task.objective}`
        : "Programmet kører…";
      dom.feedback.className = "feedback";

      appendLog("▶️ Ny kørsel startet");

      if (boardState.randomizeObstacles) {
        boardState.obstacles = randomizeObstacles(boardState);
        appendLog("Forhindringerne er blevet flyttet tilfældigt");
      }

      if (boardState.revealOnRun) {
        boardState.obstaclesVisible = true;
        appendLog("Skjulte forhindringer er nu synlige");
      }

      drawBoard();

      const sandbox = createSandbox(boardState);

      let userCode;
      try {
        userCode = transformCode(rawCode, state.selectedLanguage);
      } catch (translationError) {
        appendLog(`⚠️ Oversættelsesfejl: ${translationError.message}`);
        const translationMessage = task.objective
          ? `Koden kunne ikke oversættes til simulatoren. Prøv igen med fokus på: ${task.objective}`
          : "Koden kunne ikke oversættes til simulatoren. Tjek syntaksen for det valgte sprog.";
        dom.feedback.textContent = translationMessage;
        dom.feedback.className = "feedback error";
        drawBoard();
        return;
      }

      let success = false;
      try {
        const fn = new Function(...sandbox.argNames, `"use strict";\n${userCode}`);
        fn(...sandbox.argValues);
        success = isAtGoal(boardState);
      } catch (error) {
        appendLog(`⚠️ Fejl: ${error.message}`);
        const runtimeMessage = task.objective
          ? `Der opstod en fejl i programmet. Sammenhold med målet: ${task.objective}`
          : "Der opstod en fejl i programmet. Tjek loggen.";
        dom.feedback.textContent = runtimeMessage;
        dom.feedback.className = "feedback error";
        drawBoard();
        state.lastExecution = buildExecutionSnapshot({
          language: state.selectedLanguage,
          code: rawCode,
          objective: task.objective,
          success: false,
          lastLog: state.logEntries.slice()
        });
        return;
      }

      drawBoard();

      if (success) {
        const successMessage = task.objective
          ? `✅ Opgaven løst: ${task.objective}`
          : "Godt gået! Robotten nåede målet.";
        dom.feedback.textContent = successMessage;
        dom.feedback.className = "feedback success";
      } else {
        const resultMessage = task.objective
          ? `Programmet er kørt færdigt, men målet blev ikke nået. Husk: ${task.objective}`
          : "Programmet er kørt færdigt. Robotten nåede endnu ikke målet.";
        dom.feedback.textContent = resultMessage;
        dom.feedback.className = "feedback";
      }

      state.lastExecution = buildExecutionSnapshot({
        language: state.selectedLanguage,
        code: rawCode,
        objective: task.objective,
        success,
        lastLog: state.logEntries.slice()
      });
    } catch (error) {
      appendLog(`⚠️ Uventet fejl: ${error instanceof Error ? error.message : error}`);
      const unexpectedMessage = task.objective
        ? `Der opstod en uventet fejl. Genbesøg målet: ${task.objective}`
        : "Der opstod en uventet fejl. Tjek loggen.";
      dom.feedback.textContent = unexpectedMessage;
      dom.feedback.className = "feedback error";
      state.lastExecution = null;
    } finally {
      setRunButtonBusy(false);
      state.isRunning = false;
    }
  }

  async function handleStepRun() {
    if (!state.selectedTask || !state.boardState || state.isRunning) return;

    if (state.stepSession && state.stepSession.events && state.stepSession.index < state.stepSession.events.length) {
      advanceStepSession();
      return;
    }

    if (state.stepSession && (!state.stepSession.events || state.stepSession.index >= state.stepSession.events.length)) {
      clearStepSession();
    }

    clearAiFeedback();
    state.isRunning = true;
    setStepButtonBusy(true);
    state.lastExecution = null;

    let prepared = false;

    try {
      const task = state.selectedTask;
      const rawCode = dom.editor.value;

      state.logEntries = [];
      updateLog();
      const mismatch = detectLanguageMismatch(rawCode, state.selectedLanguage);
      if (mismatch) {
        appendLog("❌ Kodesproget matcher ikke valget");
        (mismatch.logLines || []).forEach(line => appendLog(`   ${line}`));
        dom.feedback.textContent = mismatch.message;
        dom.feedback.className = "feedback error";
        state.isRunning = false;
        setStepButtonBusy(false);
        drawBoard();
        clearStepSession();
        return;
      }

      dom.feedback.textContent = "Forbereder trinvis kørsel…";
      dom.feedback.className = "feedback";

      appendLog("▶️ Validerer kode");
      const validation = await validateCode(rawCode, state.selectedLanguage, task.objective);
      applyPromptFromResponse(validation, "preflight");
      applyModelResponseFromPayload(validation, "preflight");

      if (validation.warning) {
        appendLog(`⚠️ ${validation.warning}`);
      }

      const stopReason = typeof validation.stopReason === "string" ? validation.stopReason : "";
      const hasCompileError = !validation.ok && stopReason === "compile";
      const hasRuntimeBlock = !validation.ok && stopReason === "runtime";

      if (hasCompileError) {
        appendLog("❌ Kompileringsfejl fundet");
        (validation.errors || []).forEach(error => {
          const lineInfo = Number.isFinite(error.line) ? `Linje ${error.line}: ` : "";
          appendLog(`   ${lineInfo}${error.message}`);
        });
        const fallbackMessage = task.objective
          ? `Koden indeholder fejl. Husk: ${task.objective}`
          : "Koden indeholder fejl. Tjek loggen.";
        const stopMessage = validation.shortMessage || fallbackMessage;
        dom.feedback.textContent = stopMessage;
        dom.feedback.className = "feedback error";
        drawBoard();
        clearStepSession();
        return;
      }

      if (hasRuntimeBlock) {
        appendLog("⚠️ Mulig runtime-fejl opdaget (fortsætter efter ønske)");
        (validation.errors || []).forEach(error => {
          const lineInfo = Number.isFinite(error.line) ? `Linje ${error.line}: ` : "";
          appendLog(`   ${lineInfo}${error.message}`);
        });
        if (validation.shortMessage) {
          appendLog(`   ${validation.shortMessage}`);
        }
      } else if (!validation.ok) {
        appendLog("⚠️ Valideringen kunne ikke bekræfte koden, men der blev ikke fundet kompileringsfejl");
      }

      appendLog("✅ Ingen kompileringsfejl fundet");

      resetBoardState(state.boardState);
      if (state.boardState.randomizeObstacles) {
        state.boardState.obstacles = randomizeObstacles(state.boardState);
        appendLog("Forhindringerne er blevet flyttet tilfældigt");
      }

      if (state.boardState.revealOnRun) {
        state.boardState.obstaclesVisible = true;
        appendLog("Skjulte forhindringer er nu synlige");
      }

      drawBoard();

      let userCode;
      try {
        userCode = transformCode(rawCode, state.selectedLanguage);
      } catch (translationError) {
        appendLog(`⚠️ Oversættelsesfejl: ${translationError.message}`);
        const translationMessage = task.objective
          ? `Koden kunne ikke oversættes til simulatoren. Prøv igen med fokus på: ${task.objective}`
          : "Koden kunne ikke oversættes til simulatoren. Tjek syntaksen for det valgte sprog.";
        dom.feedback.textContent = translationMessage;
        dom.feedback.className = "feedback error";
        drawBoard();
        clearStepSession();
        state.lastExecution = null;
        return;
      }

      const playbackState = cloneBoardState(state.boardState);
      const events = [];

      const sandbox = createSandbox(playbackState, {
        draw: false,
        log: (message, currentState, kind) => {
          events.push({
            type: kind === "action" ? "action" : "log",
            message,
            snapshot: snapshotBoard(currentState),
            log: true
          });
        }
      });

      let runtimeErrorMessage = null;
      let success = false;

      try {
        const fn = new Function(...sandbox.argNames, `"use strict";\n${userCode}`);
        fn(...sandbox.argValues);
        success = isAtGoal(playbackState);
      } catch (error) {
        runtimeErrorMessage = error instanceof Error ? error.message : String(error);
        const runtimeLog = `⚠️ Fejl: ${runtimeErrorMessage}`;
        events.push({
          type: "log",
          message: runtimeLog,
          snapshot: snapshotBoard(playbackState),
          log: true
        });
      }

      const finalSnapshot = snapshotBoard(playbackState);
      const completionMessage = runtimeErrorMessage
        ? (task.objective
          ? `Der opstod en fejl i programmet. Sammenhold med målet: ${task.objective}`
          : "Der opstod en fejl i programmet. Tjek loggen.")
        : success
          ? (task.objective
            ? `✅ Opgaven løst: ${task.objective}`
            : "Godt gået! Robotten nåede målet.")
          : (task.objective
            ? `Programmet er kørt færdigt, men målet blev ikke nået. Husk: ${task.objective}`
            : "Programmet er kørt færdigt. Robotten nåede endnu ikke målet.");

      events.push({
        type: runtimeErrorMessage ? "status-error" : success ? "status-success" : "status",
        message: completionMessage,
        snapshot: finalSnapshot,
        final: true,
        log: false,
        level: runtimeErrorMessage ? "error" : success ? "success" : "info"
      });

      state.stepSession = {
        taskId: task.id,
        language: state.selectedLanguage,
        source: rawCode,
        objective: task.objective,
        success,
        events,
        index: 0
      };

      prepared = true;
      if (dom.stepBtn) {
        updateStepButtonLabel(events.length > 1 ? "Næste skridt" : (dom.stepBtn.dataset.defaultLabel || "Kør ét skridt"));
      }
    } finally {
      setStepButtonBusy(false);
      state.isRunning = false;
    }

    if (prepared) {
      advanceStepSession();
    }
  }

  function advanceStepSession() {
    const session = state.stepSession;
    if (!session || !Array.isArray(session.events) || !session.events.length) {
      dom.feedback.textContent = "Programmet udførte ingen handlinger.";
      dom.feedback.className = "feedback";
      clearStepSession();
      state.lastExecution = null;
      return;
    }

    if (session.index >= session.events.length) {
      clearStepSession();
      state.lastExecution = null;
      return;
    }

    const event = session.events[session.index];
    session.index += 1;

    if (event.snapshot) {
      applyBoardSnapshot(state.boardState, event.snapshot);
      drawBoard();
    }

    if (event.log !== false) {
      appendLog(event.message);
    }

    if (event.final) {
      dom.feedback.textContent = event.message;
      if (event.level === "success") {
        dom.feedback.className = "feedback success";
      } else if (event.level === "error") {
        dom.feedback.className = "feedback error";
      } else {
        dom.feedback.className = "feedback";
      }
      if (dom.stepBtn) {
        updateStepButtonLabel(dom.stepBtn.dataset.defaultLabel || "Kør ét skridt");
      }
    } else {
      dom.feedback.textContent = `Trin ${session.index} af ${session.events.length}`;
      dom.feedback.className = "feedback";
      if (dom.stepBtn) {
        updateStepButtonLabel(session.index < session.events.length
          ? "Næste skridt"
          : (dom.stepBtn.dataset.defaultLabel || "Kør ét skridt"));
      }
    }

    state.lastExecution = buildExecutionSnapshot({
      language: session.language,
      code: session.source,
      objective: session.objective,
      success: isAtGoal(state.boardState),
      lastLog: state.logEntries.slice(),
      stepIndex: session.index,
      totalSteps: session.events.length,
      boardSnapshot: snapshotBoard(state.boardState)
    });
  }

  function handleReset(event) {
    if (!state.boardState || !state.selectedTask) return;
    clearStepSession();
    resetBoardState(state.boardState);
    drawBoard();
    state.logEntries = [];
    updateLog();
    dom.feedback.textContent = "";
    dom.feedback.className = "feedback";
    clearAiFeedback();
    state.lastExecution = null;

    if (event && event.shiftKey) {
      const template = getTemplateForTask(state.selectedTask);
      dom.editor.value = template;
      storeCurrentCode();
    }
  }

  async function handleAiFeedback() {
    if (!state.selectedTask || !state.boardState) {
      return;
    }

    const language = state.selectedLanguage;
    const rawCode = dom.editor.value;
    const objective = state.selectedTask.objective || "";
    const progress = buildFeedbackProgress();

    if (dom.aiFeedbackBtn) {
      dom.aiFeedbackBtn.disabled = true;
    }
    showAiFeedback("Henter AI-feedback…");

    try {
      const response = await requestAiFeedback(rawCode, language, objective, progress);
      applyPromptFromResponse(response, "feedback");
      applyModelResponseFromPayload(response, "feedback");
      const feedback = response && typeof response.feedback === "string" ? response.feedback.trim() : "";
      if (feedback) {
        showAiFeedback(feedback);
        appendLog(`💡 AI-feedback: ${feedback}`);
      } else if (response && typeof response.message === "string" && response.message.trim()) {
        showAiFeedback(response.message.trim());
      } else {
        showAiFeedback("AI-feedback er ikke tilgængelig lige nu. Prøv igen senere.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error ?? "Ukendt fejl");
      showAiFeedback(`Kunne ikke hente AI-feedback: ${message}`);
    } finally {
      if (dom.aiFeedbackBtn) {
        dom.aiFeedbackBtn.disabled = false;
      }
    }
  }

  function resetBoardState(boardState) {
    boardState.agent = { ...boardState.start };
    boardState.obstacles = boardState.baseObstacles.map(ob => ({ ...ob }));
    boardState.obstaclesVisible = !boardState.revealOnRun;
  }

  function cloneBoardState(boardState) {
    if (!boardState) return null;
    return {
      size: boardState.size,
      start: { ...boardState.start },
      goal: boardState.goal ? { ...boardState.goal } : null,
      agent: { ...boardState.agent },
      baseObstacles: boardState.baseObstacles.map(ob => ({ ...ob })),
      obstacles: boardState.obstacles.map(ob => ({ ...ob })),
      checkpoints: boardState.checkpoints.map(cp => ({ ...cp })),
      revealOnRun: boardState.revealOnRun,
      randomizeObstacles: boardState.randomizeObstacles,
      obstaclesVisible: boardState.obstaclesVisible
    };
  }

  function snapshotBoard(boardState) {
    if (!boardState) return null;
    return {
      agent: { ...boardState.agent },
      obstacles: boardState.obstacles.map(ob => ({ ...ob })),
      obstaclesVisible: boardState.obstaclesVisible
    };
  }

  function applyBoardSnapshot(target, snapshot) {
    if (!target || !snapshot) return;
    if (snapshot.agent) {
      target.agent = { ...snapshot.agent };
    }
    if (Array.isArray(snapshot.obstacles)) {
      target.obstacles = snapshot.obstacles.map(ob => ({ ...ob }));
    }
    if (typeof snapshot.obstaclesVisible === "boolean") {
      target.obstaclesVisible = snapshot.obstaclesVisible;
    }
  }

  function randomizeObstacles(boardState) {
    const { baseObstacles, size, start, goal } = boardState;
    const taken = new Set([`${start.x},${start.y}`, goal ? `${goal.x},${goal.y}` : ""]);
    const result = [];

    baseObstacles.forEach(ob => {
      let attempts = 0;
      let newX = ob.x;
      let newY = ob.y;
      do {
        attempts++;
        const dx = Math.floor(Math.random() * 3) - 1;
        const dy = Math.floor(Math.random() * 3) - 1;
        newX = clamp(ob.x + dx, 0, size - 1);
        newY = clamp(ob.y + dy, 0, size - 1);
      } while (attempts < 5 && taken.has(`${newX},${newY}`));

      const key = `${newX},${newY}`;
      if (!taken.has(key)) {
        taken.add(key);
        result.push({ x: newX, y: newY });
      } else {
        result.push({ x: ob.x, y: ob.y });
      }
    });

    return result;
  }

  function createSandbox(boardState, options = {}) {
    const { log = appendLog, draw = true } = options;
    let actionCount = 0;
    const api = {
      frem,
      venstre,
      højre,
      blokering,
      skrivLog
    };

    const argNames = Object.keys(api);
    const argValues = argNames.map(key => api[key]);

    return { argNames, argValues };

    function recordAction(message) {
      actionCount += 1;
      if (actionCount > MAX_ACTIONS) {
        throw new Error(`Programmet udførte mere end ${MAX_ACTIONS} handlinger. Stopper for at undgå uendelig løkke.`);
      }
      if (typeof log === "function") {
        log(message, boardState, "action");
      }
      if (draw) {
        drawBoard();
      }
    }

    function recordLog(message) {
      if (typeof log === "function") {
        log(message, boardState, "log");
      }
    }

    function skrivLog(...values) {
      const text = values.length ? values.map(formatLogValue).join(" ") : "";
      recordLog(text ? `Console.WriteLine → ${text}` : "Console.WriteLine");
    }

    function formatLogValue(value) {
      if (typeof value === "string") {
        return value;
      }
      if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
      }
      if (value === null || value === undefined) {
        return String(value);
      }
      try {
        return JSON.stringify(value);
      } catch (error) {
        return String(value);
      }
    }

    function frem() {
      const { agent } = boardState;
      const target = nextCoordinate(agent.x, agent.y, agent.direction);
      if (isOutOfBounds(boardState, target.x, target.y) || isBlocked(boardState, target.x, target.y)) {
        throw new Error("Robotten kan ikke gå fremad – der er en blokering.");
      }
      agent.x = target.x;
      agent.y = target.y;
      recordAction("frem()");
    }

    function venstre() {
      const { agent } = boardState;
      const index = DIRECTIONS.indexOf(agent.direction);
      agent.direction = DIRECTIONS[(index + 3) % 4];
      recordAction("venstre()");
    }

    function højre() {
      const { agent } = boardState;
      const index = DIRECTIONS.indexOf(agent.direction);
      agent.direction = DIRECTIONS[(index + 1) % 4];
      recordAction("højre()");
    }

    function blokering(direction) {
      const { agent, goal } = boardState;
      const dir = (direction || "frem").toLowerCase();
      if (dir === "mål") {
        const reached = goal ? agent.x === goal.x && agent.y === goal.y : false;
        recordLog(`blokering("mål") → ${reached}`);
        return reached;
      }

      const relativeDirection = resolveDirection(agent.direction, dir);
      if (!relativeDirection) {
        throw new Error(`Ukendt retning til blokering(): ${direction}`);
      }
      const target = nextCoordinate(agent.x, agent.y, relativeDirection);
      if (isOutOfBounds(boardState, target.x, target.y)) {
        recordLog(`blokering("${dir}") → true (uden for brættet)`);
        return true;
      }
      const blocked = isBlocked(boardState, target.x, target.y);
      recordLog(`blokering("${dir}") → ${blocked}`);
      return blocked;
    }
  }

  function resolveDirection(currentDirection, relative) {
    const index = DIRECTIONS.indexOf(currentDirection);
    switch (relative) {
      case "frem":
        return currentDirection;
      case "højre":
        return DIRECTIONS[(index + 1) % 4];
      case "venstre":
        return DIRECTIONS[(index + 3) % 4];
      case "bag":
      case "tilbage":
        return DIRECTIONS[(index + 2) % 4];
      default:
        return null;
    }
  }

  function nextCoordinate(x, y, direction) {
    switch (direction) {
      case "north":
        return { x, y: y - 1 };
      case "south":
        return { x, y: y + 1 };
      case "east":
        return { x: x + 1, y };
      case "west":
        return { x: x - 1, y };
      default:
        return { x, y };
    }
  }

  function isOutOfBounds(boardState, x, y) {
    return x < 0 || y < 0 || x >= boardState.size || y >= boardState.size;
  }

  function isBlocked(boardState, x, y) {
    const obstacleMatch = boardState.obstacles.some(ob => ob.x === x && ob.y === y);
    if (obstacleMatch) {
      return true;
    }
    if (boardState.checkpoints && boardState.checkpoints.some(cp => cp.x === x && cp.y === y)) {
      return false;
    }
    return false;
  }

  function isAtGoal(boardState) {
    const { goal, agent } = boardState;
    if (!goal) return false;
    return agent.x === goal.x && agent.y === goal.y;
  }

  function appendLog(message) {
    state.logEntries.push(`${state.logEntries.length + 1}. ${message}`);
    updateLog();
  }

  function clearAiFeedback() {
    if (!dom.aiFeedback) return;
    dom.aiFeedback.textContent = "";
    dom.aiFeedback.classList.add("hidden");
  }

  function showAiFeedback(message) {
    if (!dom.aiFeedback) return;
    dom.aiFeedback.textContent = typeof message === "string" ? message : String(message ?? "");
    dom.aiFeedback.classList.remove("hidden");
  }

  function buildExecutionSnapshot(options = {}) {
    const {
      language = state.selectedLanguage,
      code = dom.editor ? dom.editor.value : "",
      objective = state.selectedTask ? state.selectedTask.objective : "",
      success = false,
      lastLog = [],
      stepIndex = null,
      totalSteps = null,
      boardSnapshot = snapshotBoard(state.boardState)
    } = options;

    return {
      language,
      code,
      objective,
      success: Boolean(success),
      log: Array.isArray(lastLog) ? [...lastLog] : [],
      stepIndex: Number.isFinite(stepIndex) ? stepIndex : null,
      totalSteps: Number.isFinite(totalSteps) ? totalSteps : null,
      board: boardSnapshot
    };
  }

  function buildFeedbackProgress() {
    const execution = state.lastExecution;
    const board = snapshotBoard(state.boardState);
    return {
      log: state.logEntries.slice(),
      board,
      stepIndex: execution && Number.isFinite(execution.stepIndex) ? execution.stepIndex : null,
      totalSteps: execution && Number.isFinite(execution.totalSteps) ? execution.totalSteps : null,
      success: execution ? execution.success : isAtGoal(state.boardState)
    };
  }

  function updateLog() {
    dom.log.textContent = state.logEntries.join("\n");
    dom.log.scrollTop = dom.log.scrollHeight;
  }

  function detectLanguageMismatch(source, language) {
    if (!language) return null;
    const code = typeof source === "string" ? source.trim() : "";
    if (!code) {
      return null;
    }

    if (language === "csharp") {
      const cIndicators = [
        /#include\s+[<"][A-Za-z0-9_.]+[>"]/i,
        /\bstatic\s+void\s+main\s*\(\s*void?\s*\)/i,
        /\bprintf\s*\(/i,
        /\bscanf\s*\(/i
      ];

      if (cIndicators.some(pattern => pattern.test(code))) {
        return {
          message: "Koden ligner C-syntaks. Vælg PowerShell eller skriv din løsning i C# med static void Main(string[] args).",
          logLines: [
            "Koden matcher ikke sproget C#.",
            "Brug C#-syntaks med static void Main(string[] args)."
          ]
        };
      }
    }

    return null;
  }

  async function validateCode(source, language, objective) {
    try {
      const response = await fetch("api/validate.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({ mode: "preflight", code: source, language, objective })
      });

      const text = await response.text();
      const payload = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(payload.error || `Server-fejl ${response.status}`);
      }

      if (typeof payload.ok !== "boolean") {
        throw new Error("Valideringssvaret mangler ok-flag.");
      }

      payload.errors = Array.isArray(payload.errors) ? payload.errors : [];
      return payload;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error || "ukendt fejl");
      return {
        ok: false,
        stopReason: "runtime",
        shortMessage: "Valideringen mislykkedes, så programmet blev ikke kørt.",
        feedback: "",
        errors: [
          { line: null, message: `Valideringen mislykkedes (${message}).` }
        ]
      };
    }
  }

  async function requestAiFeedback(source, language, objective, progress) {
    const payload = {
      mode: "feedback",
      code: source,
      language,
      objective,
      progress
    };

    const response = await fetch("api/validate.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(data.error || `Server-fejl ${response.status}`);
    }

    return data;
  }

  function applyPromptFromResponse(response, fallbackMode) {
    if (!response || typeof response !== "object") {
      return;
    }

    const prompt = response.prompt;
    if (!prompt) {
      return;
    }

    const info = { ...prompt };
    if ((!info.mode || typeof info.mode !== "string" || !info.mode.trim()) && typeof fallbackMode === "string") {
      info.mode = fallbackMode;
    }

    updatePromptDebug(info);
  }

  function applyModelResponseFromPayload(response, fallbackMode) {
    if (!response || typeof response !== "object") {
      return;
    }

    const modelResponse = response.modelResponse;
    if (!modelResponse || typeof modelResponse !== "object") {
      return;
    }

    const info = { ...modelResponse };
    if ((!info.mode || typeof info.mode !== "string" || !info.mode.trim()) && typeof fallbackMode === "string") {
      info.mode = fallbackMode;
    }

    updateResponseDebug(info);
  }

  function updatePromptDebug(promptInfo) {
    state.lastPrompt = promptInfo && typeof promptInfo === "object" ? promptInfo : null;

    if (!dom.promptDebug) {
      return;
    }

    if (!state.lastPrompt) {
      dom.promptDebug.textContent = "Ingen prompt sendt endnu.";
      return;
    }

    const { mode, system, user, payload, messages } = state.lastPrompt;
    const sections = [];
    const timestamp = new Date();
    sections.push(`Seneste opdatering: ${timestamp.toLocaleTimeString("da-DK", { hour12: false })}`);

    if (typeof mode === "string" && mode.trim()) {
      sections.push(`Mode: ${mode.trim()}`);
    }

    if (typeof system === "string" && system.trim()) {
      sections.push(`System:\n${system.trim()}`);
    }

    let userContent = null;
    if (user !== undefined) {
      try {
        userContent = JSON.stringify(user, null, 2);
      } catch (error) {
        userContent = String(user);
      }
    } else if (typeof payload === "string" && payload.trim()) {
      userContent = payload.trim();
    }

    if (!userContent && Array.isArray(messages)) {
      const messageStrings = messages
        .map(entry => {
          if (!entry || typeof entry !== "object") {
            return null;
          }
          const role = typeof entry.role === "string" ? entry.role : "";
          let contentString = "";
          if (typeof entry.content === "string") {
            contentString = entry.content;
          } else if (entry.content) {
            try {
              contentString = JSON.stringify(entry.content, null, 2);
            } catch (error) {
              contentString = String(entry.content);
            }
          }
          if (!role && !contentString) {
            return null;
          }
          return role ? `${role.toUpperCase()}:\n${contentString}` : contentString;
        })
        .filter(Boolean);

      if (messageStrings.length) {
        userContent = messageStrings.join("\n\n");
      }
    }

    if (userContent) {
      sections.push(`User:\n${userContent}`);
    }

    dom.promptDebug.textContent = sections.join("\n\n");
  }

  function updateResponseDebug(modelInfo) {
    state.lastModelResponse = modelInfo && typeof modelInfo === "object" ? modelInfo : null;

    if (!dom.responseDebug) {
      return;
    }

    if (!state.lastModelResponse) {
      dom.responseDebug.textContent = "Ingen AI-svar modtaget endnu.";
      return;
    }

    const { mode, id, usage, content, raw } = state.lastModelResponse;
    const sections = [];
    const timestamp = new Date();
    sections.push(`Seneste opdatering: ${timestamp.toLocaleTimeString("da-DK", { hour12: false })}`);

    if (typeof mode === "string" && mode.trim()) {
      sections.push(`Mode: ${mode.trim()}`);
    }

    if (typeof id === "string" && id.trim()) {
      sections.push(`Svar-ID: ${id.trim()}`);
    }

    if (usage && typeof usage === "object") {
      try {
        sections.push(`Forbrug:\n${JSON.stringify(usage, null, 2)}`);
      } catch (error) {
        sections.push(`Forbrug: ${String(usage)}`);
      }
    }

    if (typeof content === "string" && content.trim()) {
      sections.push(`Rå svar:\n${content.trim()}`);
    }

    if (raw) {
      try {
        sections.push(`Fuldt svar:\n${JSON.stringify(raw, null, 2)}`);
      } catch (error) {
        sections.push(`Fuldt svar: ${String(raw)}`);
      }
    }

    dom.responseDebug.textContent = sections.join("\n\n");
  }

  function setRunButtonBusy(isBusy) {
    if (!dom.runBtn) return;
    dom.runBtn.disabled = isBusy;
    dom.runBtn.dataset.label = dom.runBtn.dataset.label || dom.runBtn.textContent;
    dom.runBtn.textContent = isBusy ? "Arbejder…" : dom.runBtn.dataset.label;
  }

  function setStepButtonBusy(isBusy) {
    if (!dom.stepBtn) return;
    dom.stepBtn.disabled = isBusy;
    dom.stepBtn.dataset.label = dom.stepBtn.dataset.label || dom.stepBtn.textContent;
    dom.stepBtn.textContent = isBusy ? "Arbejder…" : dom.stepBtn.dataset.label;
  }

  function updateStepButtonLabel(label) {
    if (!dom.stepBtn) return;
    const resolved = label || dom.stepBtn.dataset.defaultLabel || "Kør ét skridt";
    dom.stepBtn.dataset.label = resolved;
    if (!dom.stepBtn.disabled) {
      dom.stepBtn.textContent = resolved;
    }
  }

  function clearStepSession() {
    state.stepSession = null;
    updateStepButtonLabel(dom.stepBtn ? dom.stepBtn.dataset.defaultLabel : "Kør ét skridt");
    if (dom.stepBtn) {
      dom.stepBtn.disabled = false;
    }
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function transformCode(source, language) {
    const normalised = normaliseLineEndings(source || "");
    switch (language) {
      case "csharp":
        return transformCSharpCode(normalised);
      case "powershell":
        return transformPowerShellCode(normalised);
      default:
        return normalised;
    }
  }

  function transformCSharpCode(source) {
    let js = source.replace(/\r/g, "");

    js = js.replace(/^\s*#(region|endregion).*$/gim, "");
    js = js.replace(/^\s*using\s+[A-Za-z0-9_.]+\s*;\s*$/gm, "");
    js = js.replace(/^\s*\[[^\]]+\]\s*$/gm, "");

    js = js.replace(/(public|private|protected|internal)?\s*static\s+void\s+Main\s*\(([^)]*)\)\s*\{/gi, (_match, _access, params) => {
      return `function main(${cleanCSharpParams(params)}) {`;
    });

    js = js.replace(/(public|private|protected|internal)?\s*(static\s+)?void\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*\{/gi, (match, _access, _staticKeyword, name, params) => {
      if (name === "Main") {
        return match;
      }
      return `function ${name}(${cleanCSharpParams(params)}) {`;
    });

    js = js.replace(/(public|private|protected|internal)?\s*(static\s+)?(int|double|float|bool|string)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*\{/gi, (_match, _access, _staticKeyword, _type, name, params) => {
      return `function ${name}(${cleanCSharpParams(params)}) {`;
    });

    const typeAlternatives = csharpTypes().join("|");

    const constPattern = new RegExp(`\\bconst\\s+(?:${typeAlternatives})\\s+([A-Za-z_]\\w*)`, "g");
    js = js.replace(constPattern, (_match, name) => `const ${name}`);

    const arrayPattern = new RegExp(`\\b(?:${typeAlternatives})\\s*\\[\\s*\\]\\s+([A-Za-z_]\\w*)`, "gi");
    js = js.replace(arrayPattern, (_match, name) => `let ${name}`);

    const typePattern = new RegExp(`\\b(?:${typeAlternatives})\\s+([A-Za-z_]\\w*)`, "g");
    js = js.replace(typePattern, (_match, name) => `let ${name}`);

    js = js.replace(/\bMain\s*\(/g, "main(");

    js = js.replace(/System\s*\.\s*Console\s*\.\s*Write(Line)?\s*\(/g, (_match, line) => line ? "skrivLog(" : "skrivLog(");
    js = js.replace(/Console\s*\.\s*Write(Line)?\s*\(/g, (_match, line) => line ? "skrivLog(" : "skrivLog(");

    js = unwrapCSharpContainers(js);

    if (shouldAutoInvokeMain(js)) {
      js += '\nif (typeof main === "function") { main([]); }\n';
    }

    return js;
  }

  function csharpTypes() {
    return [
      "bool",
      "byte",
      "sbyte",
      "char",
      "decimal",
      "double",
      "float",
      "int",
      "uint",
      "long",
      "ulong",
      "short",
      "ushort",
      "string",
      "var"
    ];
  }

  function cleanCSharpParams(params) {
    if (!params) return "";
    const trimmed = params.trim();
    if (!trimmed) {
      return "";
    }

    const modifiers = ["params", "ref", "out", "in"];
    const types = csharpTypes().concat(["void"]);

    return trimmed
      .split(",")
      .map(part => {
        let cleaned = part.trim();
        modifiers.forEach(mod => {
          const modPattern = new RegExp(`\\b${mod}\\b`, "gi");
          cleaned = cleaned.replace(modPattern, "");
        });
        cleaned = cleaned.replace(/\bstring\s*\[\s*\]\s*/gi, "");
        cleaned = cleaned.replace(/\[.*?\]/g, "");
        types.forEach(type => {
          const typePattern = new RegExp(`\\b${type}\\b`, "gi");
          cleaned = cleaned.replace(typePattern, "");
        });
        const segments = cleaned.trim().split(/\s+/).filter(Boolean);
        return segments.length ? segments[segments.length - 1] : "";
      })
      .filter(Boolean)
      .join(", ");
  }

  function unwrapCSharpContainers(source) {
    const patterns = [
      /\bnamespace\s+[A-Za-z_][\w.]*\s*\{/g,
      /\b(?:public|private|protected|internal)?\s*(?:sealed\s+|static\s+)?class\s+Program\s*\{/g
    ];

    return patterns.reduce((current, pattern) => unwrapPattern(current, pattern), source);
  }

  function unwrapPattern(source, pattern) {
    if (!source) return source;
    let result = source;
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(result)) !== null) {
      const openIndex = result.indexOf("{", match.index);
      if (openIndex === -1) {
        break;
      }
      const closeIndex = findMatchingBrace(result, openIndex);
      if (closeIndex === -1) {
        break;
      }
      const inner = result.slice(openIndex + 1, closeIndex);
      result = result.slice(0, match.index) + inner + result.slice(closeIndex + 1);
      pattern.lastIndex = Math.max(match.index - 1, 0);
    }
    return result;
  }

  function findMatchingBrace(source, openIndex) {
    let depth = 0;
    let inString = null;
    for (let i = openIndex; i < source.length; i++) {
      const char = source[i];
      if (inString) {
        if (char === "\\" && i + 1 < source.length) {
          i += 1;
          continue;
        }
        if (char === inString) {
          inString = null;
        }
        continue;
      }

      if (char === '"' || char === "'") {
        inString = char;
        continue;
      }

      if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          return i;
        }
      }
    }
    return -1;
  }

  function shouldAutoInvokeMain(js) {
    if (!/\bfunction\s+main\s*\(/.test(js)) {
      return false;
    }
    const withoutMain = stripFunctionDefinition(js, "main");
    return !/\bmain\s*\(/.test(withoutMain);
  }

  function stripFunctionDefinition(source, functionName) {
    const pattern = new RegExp(`function\\s+${functionName}\\s*\\(`);
    const match = pattern.exec(source);
    if (!match) {
      return source;
    }
    let braceIndex = source.indexOf("{", match.index);
    if (braceIndex === -1) {
      return source;
    }
    let depth = 1;
    let i = braceIndex + 1;
    while (i < source.length && depth > 0) {
      const char = source[i];
      if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
      }
      i += 1;
    }
    if (depth !== 0) {
      return source;
    }
    return source.slice(0, match.index) + source.slice(i);
  }

  function transformPowerShellCode(source) {
    let js = source.replace(/\r/g, "");

    js = js.replace(/^\s*#(.*)$/gm, (_match, comment) => `//${comment}`);

    const comparatorMap = {
      "-eq": "===",
      "-ne": "!==",
      "-lt": "<",
      "-le": "<=",
      "-gt": ">",
      "-ge": ">="
    };

    Object.entries(comparatorMap).forEach(([powershell, jsOp]) => {
      const pattern = new RegExp(powershell, "gi");
      js = js.replace(pattern, jsOp);
    });

    js = js.replace(/-not\s+/gi, "!");
    js = js.replace(/\$true\b/gi, "true");
    js = js.replace(/\$false\b/gi, "false");

    js = js.replace(/function\s+([A-Za-z_][\w-]*)\s*\{/gi, (match, name) => {
      return `function ${toCamelCase(name)}() {`;
    });

    js = js.replace(/for\s*\(\s*\$([A-Za-z_]\w*)\s*=\s*([^;]+);\s*\$?\1\s*([!<>=]{1,2})\s*([^;]+);\s*\$?\1\+\+\s*\)/gi, (match, variable, init, op, limit) => {
      return `for (let ${variable} = ${init.trim()}; ${variable} ${op} ${limit.trim()}; ${variable}++)`;
    });

    js = js.replace(/for\s*\(\s*\$([A-Za-z_]\w*)\s*=\s*([^;]+);\s*\$?\1\s*-(eq|ne|lt|le|gt|ge)\s*([^;]+);\s*\$?\1\+\+\s*\)/gi, (match, variable, init, op, limit) => {
      const opMap = {
        eq: "===",
        ne: "!==",
        lt: "<",
        le: "<=",
        gt: ">",
        ge: ">="
      };
      const comparator = opMap[op.toLowerCase()] || "<";
      return `for (let ${variable} = ${init.trim()}; ${variable} ${comparator} ${limit.trim()}; ${variable}++)`;
    });

    js = js.replace(/while\s*\(\s*\$([A-Za-z_]\w*)\s*\)/gi, (match, variable) => {
      return `while (${variable})`;
    });

    js = js.replace(/\$([A-Za-z_]\w*)/g, "$1");

    js = js.replace(/\b([A-Za-z_][\w-]*)\s+("[^"]*"|'[^']*')/g, (match, name, argument) => {
      return `${toCamelCase(name)}(${argument})`;
    });

    js = js.replace(/\b([A-Za-z_][\w-]*)\s*\(/g, (match, name) => {
      return `${toCamelCase(name)}(`;
    });

    js = applyPowerShellAssignments(js);

    const reservedWords = new Set([
      "if",
      "else",
      "for",
      "while",
      "switch",
      "case",
      "default",
      "break",
      "continue",
      "return",
      "do",
      "function",
      "true",
      "false"
    ]);

    js = js.replace(/(^|\n)(\s*)([A-Za-z_][\w-]*)\s*$/gm, (match, start, spaces, name) => {
      const camel = toCamelCase(name);
      if (!camel || reservedWords.has(camel)) {
        return `${start}${spaces}${camel}`;
      }
      return `${start}${spaces}${camel}();`;
    });

    return js;
  }

  function toCamelCase(name) {
    if (!name) return "";
    return name.replace(/-([a-zA-Z])/g, (_match, letter) => letter.toUpperCase());
  }

  function applyPowerShellAssignments(source) {
    const loopVarRegex = /for\s*\(\s*let\s+([A-Za-z_]\w*)/g;
    const declared = new Set();
    let match;
    while ((match = loopVarRegex.exec(source)) !== null) {
      declared.add(match[1]);
    }

    const lines = source.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const assignMatch = line.match(/^(\s*)([A-Za-z_]\w*)\s*=\s*/);
      if (!assignMatch) {
        continue;
      }
      const [, indent, variable] = assignMatch;
      const remainder = line.slice(indent.length);
      if (!declared.has(variable)) {
        lines[i] = `${indent}let ${remainder}`;
        declared.add(variable);
      } else {
        lines[i] = `${indent}${remainder}`;
      }
    }

    return lines.join("\n");
  }

  function normaliseLineEndings(text) {
    return (text || "").replace(/\r\n?/g, "\n");
  }
})();
