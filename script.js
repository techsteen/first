function initTaskApp() {
const tasks = [
  {
    id: 1,
    title: "Summen af to tal",
    description: "Beregn summen af to indtastede heltal og udskriv resultatet.",
    pseudocode: `1. Læs tal1
2. Læs tal2
3. sum <- tal1 + tal2
4. Skriv "Summen er " + sum`
  },
  {
    id: 2,
    title: "Areal af rektangel",
    description: "Beregn arealet af et rektangel ud fra længde og bredde.",
    pseudocode: `1. Læs laengde
2. Læs bredde
3. areal <- laengde * bredde
4. Skriv "Arealet er " + areal`
  },
  {
    id: 3,
    title: "Celsius til Fahrenheit",
    description: "Konverter en temperatur fra Celsius til Fahrenheit.",
    pseudocode: `1. Læs celsius
2. fahrenheit <- (celsius * 9 / 5) + 32
3. Skriv "Fahrenheit: " + fahrenheit`
  },
  {
    id: 4,
    title: "Lige eller ulige",
    description: "Tjek om et heltal er lige eller ulige ved hjælp af et betinget udtryk.",
    pseudocode: `1. Læs tal
2. Hvis tal % 2 = 0 så
     Skriv "Tallet er lige"
   Ellers
     Skriv "Tallet er ulige"
   Slut hvis`
  },
  {
    id: 5,
    title: "Største af to tal",
    description: "Sammenlign to tal og udskriv det største ved hjælp af if-else.",
    pseudocode: `1. Læs talA
2. Læs talB
3. Hvis talA > talB så
     Skriv "Største tal er " + talA
   Ellers hvis talB > talA så
     Skriv "Største tal er " + talB
   Ellers
     Skriv "Tallene er ens"
   Slut hvis`
  },
  {
    id: 6,
    title: "Karakterbesked",
    description: "Giv en kort tekstbesked baseret på en karakter mellem 0 og 100.",
    pseudocode: `1. Læs karakter
2. Hvis karakter >= 90 så
     Skriv "Fantastisk arbejde"
   Ellers hvis karakter >= 70 så
     Skriv "God indsats"
   Ellers hvis karakter >= 50 så
     Skriv "Bestået"
   Ellers
     Skriv "Behøver forbedring"
   Slut hvis`
  },
  {
    id: 7,
    title: "Ugedag fra tal",
    description: "Brug et switch-statement til at udskrive navnet på en ugedag ud fra et tal (1-7).",
    pseudocode: `1. Læs dag
2. Switch på dag
     Case 1: Skriv "Mandag"
     Case 2: Skriv "Tirsdag"
     Case 3: Skriv "Onsdag"
     Case 4: Skriv "Torsdag"
     Case 5: Skriv "Fredag"
     Case 6: Skriv "Lørdag"
     Case 7: Skriv "Søndag"
     Default: Skriv "Ukendt dag"
   Slut switch`
  },
  {
    id: 8,
    title: "Menuvalg",
    description: "Vis en lille menu og brug switch til at reagere på et valgt nummer.",
    pseudocode: `1. Skriv "1: Vis status"
2. Skriv "2: Start proces"
3. Skriv "3: Stop proces"
4. Læs valg
5. Switch på valg
     Case 1: Skriv "Status vises"
     Case 2: Skriv "Proces startet"
     Case 3: Skriv "Proces stoppet"
     Default: Skriv "Ugyldigt valg"
   Slut switch`
  },
  {
    id: 9,
    title: "Tæller fra 1 til N",
    description: "Brug en for-løkke til at udskrive alle tal fra 1 til og med N.",
    pseudocode: `1. Læs N
2. For i fra 1 til N gør
     Skriv i
   Slut for`
  },
  {
    id: 10,
    title: "Lige tal op til N",
    description: "Udskriv alle lige tal op til et givet tal N ved hjælp af en for-løkke.",
    pseudocode: `1. Læs N
2. For i fra 1 til N gør
     Hvis i % 2 = 0 så
       Skriv i
     Slut hvis
   Slut for`
  },
  {
    id: 11,
    title: "Sum fra 1 til N",
    description: "Beregn summen af tallene fra 1 til N ved hjælp af en while-løkke.",
    pseudocode: `1. Læs N
2. sum <- 0
3. i <- 1
4. Mens i <= N gør
     sum <- sum + i
     i <- i + 1
   Slut mens
5. Skriv "Summen er " + sum`
  },
  {
    id: 12,
    title: "Gæt tallet",
    description: "Brug en do-while løkke til at blive ved med at spørge efter et tal indtil brugeren rammer det hemmelige tal.",
    pseudocode: `1. hemmeligtTal <- 7
2. Gør
     Læs gaet
     Hvis gaet < hemmeligtTal så
       Skriv "For lavt"
     Ellers hvis gaet > hemmeligtTal så
       Skriv "For højt"
     Slut hvis
   Mens gaet != hemmeligtTal
3. Skriv "Du gættede det!"`
  },
  {
    id: 13,
    title: "Navneliste",
    description: "Gennemløb et array af navne og skriv hvert navn på en ny linje ved hjælp af foreach.",
    pseudocode: `1. navne <- ["Anna", "Bo", "Carla"]
2. For hvert navn i navne gør
     Skriv navn
   Slut for hver`
  },
  {
    id: 14,
    title: "Største tal i array",
    description: "Find det største tal i et array ved hjælp af en for-løkke og en hjælpevariabel.",
    pseudocode: `1. tal <- [4, 9, 2, 11, 3]
2. stoerste <- tal[0]
3. For i fra 1 til længden af tal - 1 gør
     Hvis tal[i] > stoerste så
       stoerste <- tal[i]
     Slut hvis
   Slut for
4. Skriv "Største tal er " + stoerste`
  },
  {
    id: 15,
    title: "Mindste tal i array",
    description: "Bestem det mindste tal i et array.",
    pseudocode: `1. tal <- [10, 6, 8, 2, 5]
2. mindste <- tal[0]
3. For i fra 1 til længden af tal - 1 gør
     Hvis tal[i] < mindste så
       mindste <- tal[i]
     Slut hvis
   Slut for
4. Skriv "Mindste tal er " + mindste`
  },
  {
    id: 16,
    title: "Tæl over 10",
    description: "Tæl hvor mange tal i et array der er større end 10.",
    pseudocode: `1. tal <- [5, 12, 3, 18, 9, 20]
2. antal <- 0
3. For hver værdi i tal gør
     Hvis værdi > 10 så
       antal <- antal + 1
     Slut hvis
   Slut for hver
4. Skriv "Antal over 10: " + antal`
  },
  {
    id: 17,
    title: "Summen af array",
    description: "Beregn summen af alle tal i et array ved hjælp af en for-løkke.",
    pseudocode: `1. tal <- [3, 7, 1, 9]
2. sum <- 0
3. For i fra 0 til længden af tal - 1 gør
     sum <- sum + tal[i]
   Slut for
4. Skriv "Summen er " + sum`
  },
  {
    id: 18,
    title: "Gennemsnit af array",
    description: "Beregn gennemsnittet af et array af tal.",
    pseudocode: `1. tal <- [2, 4, 6, 8, 10]
2. sum <- 0
3. For hver værdi i tal gør
     sum <- sum + værdi
   Slut for hver
4. gennemsnit <- sum / længden af tal
5. Skriv "Gennemsnit: " + gennemsnit`
  },
  {
    id: 19,
    title: "Reverser array",
    description: "Udskriv et array i omvendt rækkefølge ved hjælp af en for-løkke.",
    pseudocode: `1. tal <- [1, 2, 3, 4, 5]
2. For i fra længden af tal - 1 ned til 0 gør
     Skriv tal[i]
   Slut for`
  },
  {
    id: 20,
    title: "Find værdi",
    description: "Tjek om et bestemt tal findes i et array og udskriv resultatet.",
    pseudocode: `1. tal <- [4, 8, 15, 16, 23, 42]
2. Læs soeg
3. fundet <- false
4. For hver værdi i tal gør
     Hvis værdi = soeg så
       fundet <- true
     Slut hvis
   Slut for hver
5. Hvis fundet = true så
     Skriv "Værdien findes"
   Ellers
     Skriv "Værdien findes ikke"
   Slut hvis`
  },
  {
    id: 21,
    title: "Multiplikationstabel",
    description: "Vis en multiplikationstabel for et tal ved hjælp af en for-løkke.",
    pseudocode: `1. Læs tal
2. For i fra 1 til 10 gør
     produkt <- tal * i
     Skriv tal + " x " + i + " = " + produkt
   Slut for`
  },
  {
    id: 22,
    title: "Optælling af bogstaver",
    description: "Tæl antal bogstaver i en tekst ved hjælp af en while-løkke.",
    pseudocode: `1. Læs tekst
2. indeks <- 0
3. antal <- 0
4. Mens indeks < længden af tekst gør
     antal <- antal + 1
     indeks <- indeks + 1
   Slut mens
5. Skriv "Antal tegn: " + antal`
  },
  {
    id: 23,
    title: "Antal cifre",
    description: "Tæl hvor mange cifre et heltal består af ved hjælp af en do-while løkke.",
    pseudocode: `1. Læs tal
2. Hvis tal < 0 så
     tal <- -tal
   Slut hvis
3. tæller <- 0
4. Gør
     tal <- tal / 10 (heltal)
     tæller <- tæller + 1
   Mens tal > 0
5. Skriv "Antal cifre: " + tæller`
  },
  {
    id: 24,
    title: "Funktion for kvadrat",
    description: "Skriv en funktion der modtager et tal og returnerer tallets kvadrat.",
    pseudocode: `1. Definer funktion Kvadrat(x)
     retur x * x
2. Læs tal
3. resultat <- Kvadrat(tal)
4. Skriv "Kvadrat: " + resultat`
  },
  {
    id: 25,
    title: "Funktion for hilsen",
    description: "Lav en funktion der modtager et navn og returnerer en hilsen.",
    pseudocode: `1. Definer funktion LavHilsen(navn)
     retur "Hej " + navn
2. Læs navn
3. besked <- LavHilsen(navn)
4. Skriv besked`
  },
  {
    id: 26,
    title: "Funktion der finder største tal",
    description: "Lav en funktion der modtager et array og returnerer det største tal.",
    pseudocode: `1. Definer funktion FindStoerste(liste)
     stoerste <- liste[0]
     For i fra 1 til længden af liste - 1 gør
       Hvis liste[i] > stoerste så
         stoerste <- liste[i]
       Slut hvis
     Slut for
     retur stoerste
2. tal <- [9, 4, 7, 12]
3. resultat <- FindStoerste(tal)
4. Skriv "Største tal: " + resultat`
  },
  {
    id: 27,
    title: "Funktion med boolsk resultat",
    description: "Lav en funktion der returnerer true hvis et ord er længere end 5 bogstaver.",
    pseudocode: `1. Definer funktion ErLangt(ord)
     Hvis længden af ord > 5 så
       retur true
     Ellers
       retur false
     Slut hvis
2. Læs ord
3. resultat <- ErLangt(ord)
4. Skriv "Ord er langt: " + resultat`
  },
  {
    id: 28,
    title: "Beregn rabat",
    description: "Beregn en rabat ved hjælp af en funktion og betinget logik.",
    pseudocode: `1. Definer funktion BeregnRabat(beløb)
     Hvis beløb >= 1000 så
       retur beløb * 0.1
     Ellers hvis beløb >= 500 så
       retur beløb * 0.05
     Ellers
       retur 0
     Slut hvis
2. Læs beløb
3. rabat <- BeregnRabat(beløb)
4. Skriv "Rabat er " + rabat`
  },
  {
    id: 29,
    title: "Gentag menu",
    description: "Vis en menu indtil brugeren vælger at afslutte (do-while).",
    pseudocode: `1. valg <- 0
2. Gør
     Skriv "1: Fortsæt"
     Skriv "2: Afslut"
     Læs valg
     Hvis valg = 1 så
       Skriv "Du valgte at fortsætte"
     Slut hvis
   Mens valg != 2
3. Skriv "Program stoppet"
`
  },
  {
    id: 30,
    title: "Filtrér array",
    description: "Udskriv alle tal i et array der er større end en grænseværdi ved hjælp af en funktion.",
    pseudocode: `1. Definer funktion VisStoerreEnd(liste, graense)
     For hver værdi i liste gør
       Hvis værdi > graense så
         Skriv værdi
       Slut hvis
     Slut for hver
2. tal <- [2, 9, 4, 12, 7]
3. Læs graense
4. Kald VisStoerreEnd(tal, graense)`
  }
];

const container = document.getElementById("taskContainer");
const template = document.getElementById("taskTemplate");

const editorInstances = new Map();
const editorContainers = new Map();
const fallbackEditors = new Map();
const taskExpansionStates = new WeakMap();
const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
const MONACO_BASE = "https://cdn.jsdelivr.net/npm/monaco-editor@0.46.0/min/";
const MONACO_LOADER_URL = `${MONACO_BASE}vs/loader.js`;

const completionSnippets = {
  csharp: [
    {
      label: "if",
      detail: "if (betingelse)",
      documentation: "Indsætter en simpel if-sætning.",
      snippet: [
        "if (${1:betingelse})",
        "{",
        "    ${2:// TODO}",
        "}"
      ].join("\n"),
    },
    {
      label: "ifelse",
      detail: "if / else",
      documentation: "If-else-struktur til beslutningstagning.",
      snippet: [
        "if (${1:betingelse})",
        "{",
        "    ${2:// TODO}",
        "}",
        "else",
        "{",
        "    ${3:// Alternativ}",
        "}"
      ].join("\n"),
    },
    {
      label: "switch",
      detail: "switch (værdi)",
      documentation: "Switch-statement med case og default.",
      snippet: [
        "switch (${1:vaerdi})",
        "{",
        "    case ${2:vaerdi1}:",
        "        ${3:// Handling}",
        "        break;",
        "    default:",
        "        ${4:// Standard}",
        "        break;",
        "}"
      ].join("\n"),
    },
    {
      label: "for",
      detail: "for-løkke",
      documentation: "Standard for-løkke over tal.",
      snippet: [
        "for (int ${1:i} = 0; ${1:i} < ${2:grænse}; ${1:i}++)",
        "{",
        "    ${3:// TODO}",
        "}"
      ].join("\n"),
    },
    {
      label: "foreach",
      detail: "foreach",
      documentation: "Foreach-løkke til arrays eller lister.",
      snippet: [
        "foreach (var ${1:element} in ${2:samling})",
        "{",
        "    ${3:// TODO}",
        "}"
      ].join("\n"),
    },
    {
      label: "while",
      detail: "while-løkke",
      documentation: "While-løkke der gentages så længe en betingelse er sand.",
      snippet: [
        "while (${1:betingelse})",
        "{",
        "    ${2:// TODO}",
        "}"
      ].join("\n"),
    },
    {
      label: "dowhile",
      detail: "do-while",
      documentation: "Do-while-løkke med minimum ét gennemløb.",
      snippet: [
        "do",
        "{",
        "    ${1:// TODO}",
        "}",
        "while (${2:betingelse});"
      ].join("\n"),
    },
    {
      label: "array",
      detail: "int[] array",
      documentation: "Opretter og initialiserer et array.",
      snippet: "int[] ${1:tal} = new int[] { ${2:1}, ${3:2}, ${4:3} };",
    },
    {
      label: "metode",
      detail: "metode med returværdi",
      documentation: "Definér en metode med parameter og returværdi.",
      snippet: [
        "static ${1:int} ${2:Beregn}(${3:int tal})",
        "{",
        "    return ${4:tal};",
        "}"
      ].join("\n"),
    },
  ],
  powershell: [
    {
      label: "if",
      detail: "if (betingelse)",
      documentation: "If-sætning med PowerShell-syntaks.",
      snippet: [
        "if (${1:betingelse})",
        "{",
        "    ${2:# TODO}",
        "}"
      ].join("\n"),
    },
    {
      label: "ifelse",
      detail: "if / else",
      documentation: "If-else-struktur i PowerShell.",
      snippet: [
        "if (${1:betingelse})",
        "{",
        "    ${2:# TODO}",
        "}",
        "else",
        "{",
        "    ${3:# Alternativ}",
        "}"
      ].join("\n"),
    },
    {
      label: "switch",
      detail: "switch (værdi)",
      documentation: "Switch-blok med case og default.",
      snippet: [
        "switch (${1:vaerdi})",
        "{",
        "    ${2:vaerdi1} {",
        "        ${3:# Handling}",
        "    }",
        "    Default {",
        "        ${4:# Standard}",
        "    }",
        "}"
      ].join("\n"),
    },
    {
      label: "for",
      detail: "for-løkke",
      documentation: "For-løkke i PowerShell.",
      snippet: [
        "for (${1:($i = 0)}; ${2:$i -lt 10}; ${3:$i++})",
        "{",
        "    ${4:# TODO}",
        "}"
      ].join("\n"),
    },
    {
      label: "foreach",
      detail: "foreach",
      documentation: "Foreach over et array.",
      snippet: [
        "foreach (${1:$element} in ${2:$samling})",
        "{",
        "    ${3:# TODO}",
        "}"
      ].join("\n"),
    },
    {
      label: "while",
      detail: "while-løkke",
      documentation: "While-løkke i PowerShell.",
      snippet: [
        "while (${1:betingelse})",
        "{",
        "    ${2:# TODO}",
        "}"
      ].join("\n"),
    },
    {
      label: "dowhile",
      detail: "do { } while ()",
      documentation: "Do-while-løkke.",
      snippet: [
        "do",
        "{",
        "    ${1:# TODO}",
        "} while (${2:betingelse})"
      ].join("\n"),
    },
    {
      label: "array",
      detail: "Array definition",
      documentation: "Opretter et array.",
      snippet: "${1:$tal} = @(${2:1}, ${3:2}, ${4:3})",
    },
    {
      label: "funktion",
      detail: "function Navn",
      documentation: "Definér en PowerShell-funktion med parametre.",
      snippet: [
        "function ${1:Navn}",
        "{",
        "    param([${2:int}]${3:$tal})",
        "    ${4:return $tal}",
        "}"
      ].join("\n"),
    },
  ],
};

let completionProvidersRegistered = false;

function setTaskExpansion(article, key, isActive) {
  if (!article) {
    return;
  }
  const currentState = taskExpansionStates.get(article) || {
    editor: false,
    pseudocode: false,
  };
  const wasExpanded = currentState.editor || currentState.pseudocode;
  currentState[key] = Boolean(isActive);
  taskExpansionStates.set(article, currentState);
  const shouldExpand = currentState.editor || currentState.pseudocode;
  article.classList.toggle("is-expanded", shouldExpand);
  const closeButton = article.querySelector(".task-close");
  if (closeButton) {
    closeButton.hidden = !shouldExpand;
  }
  if (!wasExpanded && shouldExpand) {
    window.requestAnimationFrame(() => {
      try {
        article.scrollIntoView({ block: "start", behavior: "smooth" });
      } catch (error) {
        article.scrollIntoView(true);
      }
    });
  }
}

loadMonaco()
  .then(() => {
    ensureMonacoLanguages();
    applyEditorTheme();
    registerMonacoCompletions();
    if (typeof colorSchemeQuery.addEventListener === "function") {
      colorSchemeQuery.addEventListener("change", applyEditorTheme);
    } else if (typeof colorSchemeQuery.addListener === "function") {
      colorSchemeQuery.addListener(applyEditorTheme);
    }
    renderTasks();
  })
  .catch((error) => {
    console.error("Kunne ikke indlæse Monaco-editoren:", error);
    renderTasks(true);
    showMonacoWarning(error);
  });

function ensureAmdLoader() {
  if (window.require?.config) {
    return Promise.resolve(window.require);
  }

  const existingScript = document.querySelector("script[data-monaco-loader='true']");
  if (existingScript) {
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + 5000;
      const poll = () => {
        if (window.require?.config) {
          resolve(window.require);
        } else if (Date.now() > deadline) {
          reject(new Error("Monaco-loaderen kunne ikke initialiseres."));
        } else {
          window.setTimeout(poll, 20);
        }
      };
      poll();
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = MONACO_LOADER_URL;
    script.async = true;
    script.dataset.monacoLoader = "true";
    script.onload = () => {
      if (window.require?.config) {
        resolve(window.require);
      } else {
        reject(new Error("Monaco-loaderen blev indlæst, men require blev ikke fundet."));
      }
    };
    script.onerror = () => reject(new Error("Kunne ikke hente Monaco-loaderen."));
    document.head.appendChild(script);
  });
}

function loadMonaco() {
  return ensureAmdLoader().then((amdLoader) => {
    return new Promise((resolve, reject) => {
      if (window.monaco?.editor) {
        resolve();
        return;
      }

      if (!window.MonacoEnvironment) {
        window.MonacoEnvironment = {
          getWorkerUrl(moduleId, label) {
            const workerPaths = {
              json: "vs/language/json/jsonWorker.js",
              css: "vs/language/css/cssWorker.js",
              html: "vs/language/html/htmlWorker.js",
              typescript: "vs/language/typescript/tsWorker.js",
              javascript: "vs/language/typescript/tsWorker.js",
            };
            const workerPath = workerPaths[label] || "vs/base/worker/workerMain.js";
            const source = `self.MonacoEnvironment={baseUrl:'${MONACO_BASE}'};importScripts('${MONACO_BASE}${workerPath}');`;
            return `data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`;
          },
        };
      }

      amdLoader.config({
        paths: {
          vs: `${MONACO_BASE}vs`,
        },
      });

      amdLoader(
        ["vs/editor/editor.main"],
        () => resolve(),
        (err) => reject(err)
      );
    });
  });
}

function applyEditorTheme() {
  if (!window.monaco?.editor) {
    return;
  }
  monaco.editor.setTheme(colorSchemeQuery.matches ? "vs-dark" : "vs");
}

function showMonacoWarning(error) {
  const message = document.createElement("p");
  message.className = "monaco-error";
  const reason = error?.message ? ` (${error.message})` : "";
  message.textContent =
    "Kunne ikke indlæse kodeeditoren. Viser i stedet et simpelt tekstfelt." + reason;
  container.prepend(message);
}

function renderTasks(useFallback = false) {
  container.innerHTML = "";
  editorInstances.clear();
  editorContainers.clear();
  fallbackEditors.clear();

  const fragment = document.createDocumentFragment();
  const setups = [];

  tasks.forEach((task) => {
    const clone = template.content.cloneNode(true);
    const article = clone.querySelector(".task");
    article.dataset.taskId = String(task.id);
    article.querySelector("h3").textContent = `${task.id}. ${task.title}`;
    article.querySelector(".description").textContent = task.description;
    article.querySelector(".pseudocode").textContent = task.pseudocode;

    const languageSelect = article.querySelector(".language");
    const editorContainer = article.querySelector(".solution-editor");
    const details = article.querySelector("details");
    const closeButton = article.querySelector(".task-close");
    setTaskExpansion(article, "editor", false);
    setTaskExpansion(article, "pseudocode", false);

    if (details) {
      details.addEventListener("toggle", () => {
        setTaskExpansion(article, "pseudocode", details.open);
      });
    }

    if (closeButton) {
      closeButton.addEventListener("click", () => {
        if (details && details.open) {
          details.open = false;
        }
        const activeElement = document.activeElement;
        if (activeElement && article.contains(activeElement) && typeof activeElement.blur === "function") {
          activeElement.blur();
        }
        setTaskExpansion(article, "editor", false);
        setTaskExpansion(article, "pseudocode", false);
      });
    }
    const feedback = article.querySelector(".feedback");
    const button = article.querySelector(".evaluate");

    button.addEventListener("click", () => evaluateSolution(task, article, feedback));

    setups.push({ task, languageSelect, editorContainer, article });

    fragment.appendChild(clone);
  });

  container.appendChild(fragment);

  setups.forEach(({ task, languageSelect, editorContainer, article }) => {
    if (useFallback) {
      const textarea = document.createElement("textarea");
      textarea.className = "solution-textarea";
      textarea.placeholder = editorContainer.dataset.placeholder || "Skriv din kode her...";
      textarea.setAttribute("aria-label", "Din løsning");
      textarea.spellcheck = false;
      editorContainer.replaceWith(textarea);
      fallbackEditors.set(task.id, textarea);
      languageSelect.addEventListener("change", () => {
        textarea.dataset.language = languageSelect.value;
      });
      textarea.addEventListener("focus", () => {
        setTaskExpansion(article, "editor", true);
      });
      textarea.addEventListener("blur", () => {
        window.setTimeout(() => {
          if (document.activeElement !== textarea) {
            setTaskExpansion(article, "editor", false);
          }
        }, 0);
      });
    } else {
      createMonacoEditor(task.id, editorContainer, languageSelect, article);
    }
  });
}

async function evaluateSolution(task, article, feedbackElement) {
  const language = article.querySelector(".language").value;
  const editor = editorInstances.get(task.id);
  const fallbackEditor = fallbackEditors.get(task.id);
  const solution = editor
    ? editor.getValue().trim()
    : (fallbackEditor?.value || "").trim();
  const feedback = feedbackElement || article.querySelector(".feedback");

  if (!solution) {
    feedback.textContent = "Skriv din løsning først.";
    feedback.classList.remove("loading");
    return;
  }

  feedback.textContent = "Vurderer...";
  feedback.classList.add("loading");

  try {
    const response = await fetch("evaluate.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        taskTitle: task.title,
        taskDescription: task.description,
        pseudocode: task.pseudocode,
        language,
        solution,
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      const message = errorPayload?.error || `API-fejl: ${response.status}`;
      throw new Error(message);
    }

    const data = await response.json();
    const message = data.feedback?.trim();

    feedback.textContent = message || "Fik ikke noget svar. Prøv igen.";
  } catch (error) {
    feedback.textContent = `Noget gik galt: ${error.message}`;
  } finally {
    feedback.classList.remove("loading");
  }
}

function createMonacoEditor(taskId, containerEl, languageSelect, article) {
  containerEl.dataset.taskId = String(taskId);
  containerEl.classList.add("is-empty");
  editorContainers.set(taskId, containerEl);
  setTaskExpansion(article, "editor", false);

  const editor = monaco.editor.create(containerEl, {
    value: "",
    language: mapLanguage(languageSelect.value),
    minimap: { enabled: false },
    automaticLayout: true,
    fontSize: 14,
    fontFamily: 'Fira Code, "Courier New", monospace',
    wordWrap: "on",
    scrollBeyondLastLine: false,
    ariaLabel: `Editor til opgave ${taskId}`,
    snippetSuggestions: "inline",
    suggestOnTriggerCharacters: true,
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false,
    },
    tabCompletion: "on",
    autoClosingBrackets: "always",
    autoClosingQuotes: "always",
    formatOnPaste: true,
    formatOnType: false,
  });

  editorInstances.set(taskId, editor);
  updateEditorEmptyState(taskId);

  editor.onDidChangeModelContent(() => updateEditorEmptyState(taskId));

  const activateExpansion = () => setTaskExpansion(article, "editor", true);
  const deactivateExpansion = () => {
    window.setTimeout(() => {
      const stillFocused = editor.hasTextFocus?.() || containerEl.contains(document.activeElement);
      setTaskExpansion(article, "editor", Boolean(stillFocused));
    }, 0);
  };

  editor.onDidFocusEditorWidget(activateExpansion);
  editor.onDidBlurEditorWidget(deactivateExpansion);
  containerEl.addEventListener("focusin", activateExpansion);
  containerEl.addEventListener("focusout", deactivateExpansion);

  languageSelect.addEventListener("change", () => {
    updateEditorLanguage(taskId, languageSelect.value);
  });
}

function mapLanguage(selection) {
  return selection === "C#" ? "csharp" : "powershell";
}

function updateEditorLanguage(taskId, selection) {
  const editor = editorInstances.get(taskId);
  if (!editor) {
    return;
  }
  const model = editor.getModel();
  if (!model) {
    return;
  }
  monaco.editor.setModelLanguage(model, mapLanguage(selection));
}

function updateEditorEmptyState(taskId) {
  const editor = editorInstances.get(taskId);
  const containerEl = editorContainers.get(taskId);
  if (!editor || !containerEl) {
    return;
  }
  const isEmpty = editor.getValue().trim().length === 0;
  containerEl.classList.toggle("is-empty", isEmpty);
}

function registerMonacoCompletions() {
  if (completionProvidersRegistered || !window.monaco?.languages) {
    return;
  }

  const triggerCharacters = [" ", ".", "(", "{"];
  const { CompletionItemKind, CompletionItemInsertTextRule } = monaco.languages;

  Object.entries(completionSnippets).forEach(([language, snippets]) => {
    monaco.languages.registerCompletionItemProvider(language, {
      triggerCharacters,
      provideCompletionItems(model, position) {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = snippets.map((snippet, index) => ({
          label: snippet.label,
          detail: snippet.detail,
          documentation: snippet.documentation,
          insertText: snippet.snippet,
          insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
          kind: CompletionItemKind.Snippet,
          range,
          sortText: `000${index}`,
        }));

        return { suggestions };
      },
    });
  });

  completionProvidersRegistered = true;
}

function ensureMonacoLanguages() {
  if (!window.monaco?.languages) {
    return;
  }

  const registered = new Set(
    monaco.languages.getLanguages?.().map((lang) => lang.id) || []
  );

  if (!registered.has("csharp")) {
    monaco.languages.register({
      id: "csharp",
      aliases: ["C#", "csharp"],
      extensions: [".cs"],
    });
  }

  if (!registered.has("powershell")) {
    monaco.languages.register({
      id: "powershell",
      aliases: ["PowerShell", "powershell", "ps", "ps1"],
      extensions: [".ps1", ".psm1"],
    });
  }
}
}

if (typeof window !== "undefined") {
  if (window.__TASK_APP_INITIALIZED) {
    console.warn("Opgavesiden er allerede initialiseret.");
  } else {
    window.__TASK_APP_INITIALIZED = true;
    initTaskApp();
  }
}
