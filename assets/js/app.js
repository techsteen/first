(function () {
  const DIRECTIONS = ["north", "east", "south", "west"];
  const ARROWS = {
    north: "↑",
    east: "→",
    south: "↓",
    west: "←"
  };

  const LANGUAGE_CONFIG = {
    c: {
      label: "C",
      commandReference: [
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
    selectedLanguage: "c",
    tasks: normalizeTasks(Array.isArray(window.FALLBACK_TASKS) ? window.FALLBACK_TASKS : []),
    isRunning: false,
    hintIndex: 0,
    pendingFeedback: ""
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
    dom.resetBtn = document.getElementById("reset-btn");
    dom.hintBtn = document.getElementById("hint-btn");
    dom.feedback = document.getElementById("feedback");
    dom.hint = document.getElementById("hint-output");
    dom.log = document.getElementById("log");
    dom.commandReference = document.getElementById("command-reference");
    dom.languageInputs = document.querySelectorAll('input[name="language"]');

    const initialLanguage = Array.from(dom.languageInputs || []).find(input => input.checked);
    if (initialLanguage) {
      state.selectedLanguage = initialLanguage.value;
    }

    renderCommandReference();
    bindEvents();
    initializeTasks();
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
    dom.resetBtn.addEventListener("click", handleReset);
    if (dom.hintBtn) {
      dom.hintBtn.addEventListener("click", showNextHint);
    }
    dom.editor.addEventListener("input", () => {
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
      c: "void program(void) {\n    // Skriv din kode her\n}\n\nprogram();\n",
      powershell: "function Invoke-Program {\n    # Skriv din kode her\n}\n\nInvoke-Program\n"
    };

    if (!templates || typeof templates !== "object") {
      return fallback;
    }

    return {
      c: typeof templates.c === "string" ? templates.c : fallback.c,
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

    state.selectedTask = task;
    updateTaskButtonState();
    renderTaskDetails(task);
    state.boardState = createBoardState(task);
    buildBoardGrid(state.boardState.size);
    drawBoard();
    state.pendingFeedback = "";
    dom.feedback.textContent = task.objective ? `Mål: ${task.objective}` : "";
    dom.feedback.className = "feedback";
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

    state.isRunning = true;
    state.pendingFeedback = "";
    setRunButtonBusy(true);

    try {
      const task = state.selectedTask;
      const boardState = state.boardState;
      const rawCode = dom.editor.value;

      state.logEntries = [];
      updateLog();
      dom.feedback.textContent = "Validerer kode…";
      dom.feedback.className = "feedback";

      appendLog("▶️ Validerer kode");
      const validation = await validateCode(rawCode, state.selectedLanguage, task.objective);
      state.pendingFeedback = typeof validation.feedback === "string" ? validation.feedback.trim() : "";

      if (validation.warning) {
        appendLog(`⚠️ ${validation.warning}`);
      }

      if (!validation.ok) {
        appendLog("❌ Kompileringsfejl fundet");
        (validation.errors || []).forEach(error => {
          const lineInfo = Number.isFinite(error.line) ? `Linje ${error.line}: ` : "";
          appendLog(`   ${lineInfo}${error.message}`);
        });
        const fallbackMessage = task.objective
          ? `Koden indeholder fejl. Husk: ${task.objective}`
          : "Koden indeholder fejl. Tjek loggen.";
        const compileMessage = validation.shortMessage || fallbackMessage;
        appendPendingFeedback();
        dom.feedback.textContent = withPendingFeedback(compileMessage);
        dom.feedback.className = "feedback error";
        drawBoard();
        return;
      }

      appendLog("✅ Ingen kompileringsfejl fundet");
      appendPendingFeedback();

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
        dom.feedback.textContent = withPendingFeedback(translationMessage);
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
        dom.feedback.textContent = withPendingFeedback(runtimeMessage);
        dom.feedback.className = "feedback error";
        drawBoard();
        return;
      }

      drawBoard();

      if (success) {
        const successMessage = task.objective
          ? `✅ Opgaven løst: ${task.objective}`
          : "Godt gået! Robotten nåede målet.";
        dom.feedback.textContent = withPendingFeedback(successMessage);
        dom.feedback.className = "feedback success";
      } else {
        const resultMessage = task.objective
          ? `Programmet er kørt færdigt, men målet blev ikke nået. Husk: ${task.objective}`
          : "Programmet er kørt færdigt. Robotten nåede endnu ikke målet.";
        dom.feedback.textContent = withPendingFeedback(resultMessage);
        dom.feedback.className = "feedback";
      }
    } catch (error) {
      appendLog(`⚠️ Uventet fejl: ${error instanceof Error ? error.message : error}`);
      const unexpectedMessage = task.objective
        ? `Der opstod en uventet fejl. Genbesøg målet: ${task.objective}`
        : "Der opstod en uventet fejl. Tjek loggen.";
      dom.feedback.textContent = withPendingFeedback(unexpectedMessage);
      dom.feedback.className = "feedback error";
    } finally {
      setRunButtonBusy(false);
      state.isRunning = false;
    }
  }

  function handleReset(event) {
    if (!state.boardState || !state.selectedTask) return;
    resetBoardState(state.boardState);
    drawBoard();
    state.logEntries = [];
    updateLog();
    dom.feedback.textContent = "";
    dom.feedback.className = "feedback";
    state.pendingFeedback = "";

    if (event && event.shiftKey) {
      const template = getTemplateForTask(state.selectedTask);
      dom.editor.value = template;
      storeCurrentCode();
    }
  }

  function resetBoardState(boardState) {
    boardState.agent = { ...boardState.start };
    boardState.obstacles = boardState.baseObstacles.map(ob => ({ ...ob }));
    boardState.obstaclesVisible = !boardState.revealOnRun;
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

  function createSandbox(boardState) {
    const api = {
      frem,
      venstre,
      højre,
      blokering
    };

    const argNames = Object.keys(api);
    const argValues = argNames.map(key => api[key]);

    return { argNames, argValues };

    function frem() {
      const { agent } = boardState;
      const target = nextCoordinate(agent.x, agent.y, agent.direction);
      if (isOutOfBounds(boardState, target.x, target.y) || isBlocked(boardState, target.x, target.y)) {
        throw new Error("Robotten kan ikke gå fremad – der er en blokering.");
      }
      agent.x = target.x;
      agent.y = target.y;
      appendLog("frem()");
      drawBoard();
    }

    function venstre() {
      const { agent } = boardState;
      const index = DIRECTIONS.indexOf(agent.direction);
      agent.direction = DIRECTIONS[(index + 3) % 4];
      appendLog("venstre()");
      drawBoard();
    }

    function højre() {
      const { agent } = boardState;
      const index = DIRECTIONS.indexOf(agent.direction);
      agent.direction = DIRECTIONS[(index + 1) % 4];
      appendLog("højre()");
      drawBoard();
    }

    function blokering(direction) {
      const { agent, goal } = boardState;
      const dir = (direction || "frem").toLowerCase();
      if (dir === "mål") {
        const reached = goal ? agent.x === goal.x && agent.y === goal.y : false;
        appendLog(`blokering("mål") → ${reached}`);
        return reached;
      }

      const relativeDirection = resolveDirection(agent.direction, dir);
      if (!relativeDirection) {
        throw new Error(`Ukendt retning til blokering(): ${direction}`);
      }
      const target = nextCoordinate(agent.x, agent.y, relativeDirection);
      if (isOutOfBounds(boardState, target.x, target.y)) {
        appendLog(`blokering("${dir}") → true (uden for brættet)`);
        return true;
      }
      const blocked = isBlocked(boardState, target.x, target.y);
      appendLog(`blokering("${dir}") → ${blocked}`);
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

  function appendPendingFeedback() {
    if (!state.pendingFeedback) {
      return;
    }
    appendLog(`ℹ️ AI-feedback: ${state.pendingFeedback}`);
  }

  function withPendingFeedback(message) {
    const base = typeof message === "string" ? message : String(message ?? "");
    if (!state.pendingFeedback) {
      return base;
    }
    const trimmedBase = base.trim();
    if (!trimmedBase) {
      return `AI-feedback: ${state.pendingFeedback}`;
    }
    return `${trimmedBase}\nAI-feedback: ${state.pendingFeedback}`;
  }

  function updateLog() {
    dom.log.textContent = state.logEntries.join("\n");
    dom.log.scrollTop = dom.log.scrollHeight;
  }

  async function validateCode(source, language, objective) {
    try {
      const response = await fetch("api/validate.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({ code: source, language, objective })
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
      return {
        ok: true,
        warning: error instanceof Error
          ? `Valideringen mislykkedes (${error.message}).`
          : "Valideringen mislykkedes." 
      };
    }
  }

  function setRunButtonBusy(isBusy) {
    if (!dom.runBtn) return;
    dom.runBtn.disabled = isBusy;
    dom.runBtn.dataset.label = dom.runBtn.dataset.label || dom.runBtn.textContent;
    dom.runBtn.textContent = isBusy ? "Arbejder…" : dom.runBtn.dataset.label;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function transformCode(source, language) {
    const normalised = normaliseLineEndings(source || "");
    switch (language) {
      case "c":
        return transformCCode(normalised);
      case "powershell":
        return transformPowerShellCode(normalised);
      default:
        return normalised;
    }
  }

  function transformCCode(source) {
    let js = source.replace(/\r/g, "");
    js = js.replace(/^\s*#include[^\n]*\n/gm, "");
    js = js.replace(/^\s*using\s+[^\n]*\n/gm, "");

    js = js.replace(/\bvoid\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*\{/g, (match, name, params) => {
      return `function ${name}(${cleanCFunctionParams(params)}) {`;
    });

    js = js.replace(/\bint\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*\{/g, (match, name, params) => {
      return `function ${name}(${cleanCFunctionParams(params)}) {`;
    });

    js = js.replace(/\bconst\b/g, "");

    const typeWords = [
      "unsigned",
      "long",
      "short",
      "int",
      "float",
      "double",
      "size_t",
      "char",
      "bool"
    ];

    typeWords.forEach(type => {
      const pattern = new RegExp(`\\b${type}\\b`, "g");
      js = js.replace(pattern, "let");
    });

    while (/\blet\s+let\b/.test(js)) {
      js = js.replace(/\blet\s+let\b/g, "let");
    }

    js = js.replace(/return\s+0\s*;/g, "return;");
    js = js.replace(/->/g, ".");

    return js;
  }

  function cleanCFunctionParams(params) {
    if (!params) return "";
    const trimmed = params.trim();
    if (!trimmed || trimmed === "void") {
      return "";
    }

    const typeWords = [
      "const",
      "unsigned",
      "long",
      "short",
      "int",
      "float",
      "double",
      "size_t",
      "char",
      "bool",
      "void"
    ];

    return trimmed
      .split(",")
      .map(part => {
        let cleaned = part.trim();
        typeWords.forEach(type => {
          const pattern = new RegExp(`\\b${type}\\b`, "g");
          cleaned = cleaned.replace(pattern, "");
        });
        return cleaned.replace(/\s+/g, "").trim();
      })
      .filter(Boolean)
      .join(", ");
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
