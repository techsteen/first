const progressEl = document.getElementById('progress');
const visualizationEl = document.getElementById('visualization');
const calculatorEl = document.getElementById('calculator');
const prevBtn = document.getElementById('prev-step');
const nextBtn = document.getElementById('next-step');
const stepIndicator = document.getElementById('step-indicator');

const steps = [
  {
    title: 'Problem: For meget broadcast-trafik!',
    description: 'Alle enheder er på samme netværk (192.168.1.0/24) og modtager ALT broadcast-trafik.'
  },
  {
    title: 'Efter subnetting: To separate netværk',
    description: 'Broadcast-trafik er isoleret, fordi vi har opdelt netværket i to subnets.'
  },
  {
    title: 'Beregning af subnet mask',
    description: 'Vi ændrer masken fra /24 til /25 og låner 1 bit til subnetting.'
  },
  {
    title: 'Resultat: Detaljeret visning',
    description: 'Se gateway, broadcast og brugbare adresser for begge subnets.'
  },
  {
    title: 'Prøv selv: Tilpas subnetting',
    description: 'Eksperimenter med netværksklasser, antal subnets eller hosts og se beregningerne opdatere med det samme.'
  },
  {
    title: 'Øvelser: 50 subnetting-opgaver',
    description: 'Test din viden med opgaver, få feedback fra AI og følg din fremgang.'
  }
];

const originalDevices = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  ip: `192.168.1.${i + 2}`
}));

const subnet1Devices = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  ip: `192.168.1.${i + 1}`
}));

const subnet2Devices = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  ip: `192.168.1.${129 + i}`
}));

const networkClasses = {
  A: {
    label: 'Klasse A',
    baseIp: '10.0.0.0',
    prefix: 8
  },
  B: {
    label: 'Klasse B',
    baseIp: '172.16.0.0',
    prefix: 16
  },
  C: {
    label: 'Klasse C',
    baseIp: '192.168.1.0',
    prefix: 24
  }
};

const state = {
  step: 0,
  calculationMode: 'subnets',
  customSubnets: 2,
  customHosts: 126,
  networkClass: 'C',
  tasks: null,
  tasksLoading: false,
  tasksError: null,
  taskStatuses: {}
};

let broadcastGenerator = null;
let broadcastAnimator = null;
let broadcastPackets = [];
let chefTimer = null;
let subnetGenerators = [];
let subnetAnimators = [];
let routerTrafficGenerators = [];
let routerTrafficAnimators = [];
let routerTrafficCleanups = [];
let tasksPromise = null;
let termOverlayElement = null;
let termOverlayDialog = null;
let termOverlayTitle = null;
let termOverlayBody = null;
let termOverlayCloseButton = null;
let termOverlayBackdrop = null;
let termOverlayLastFocus = null;
let termOverlayKeyHandlerBound = false;
const termExplanationCache = new Map();

function getDevicePosition(index) {
  const row = Math.floor(index / 6);
  const col = index % 6;
  return {
    x: 8 + col * 14.5,
    y: 35 + row * 14
  };
}

function getSubnetDevicePosition(index) {
  const row = Math.floor(index / 3);
  const col = index % 3;
  return {
    x: 18 + col * 32,
    y: 56 + row * 12
  };
}

function ipToNumber(ipString) {
  const parts = ipString.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return 0;
  }

  return (
    (parts[0] << 24)
    | (parts[1] << 16)
    | (parts[2] << 8)
    | parts[3]
  ) >>> 0;
}

function numberToIp(num) {
  const a = (num >>> 24) & 255;
  const b = (num >>> 16) & 255;
  const c = (num >>> 8) & 255;
  const d = num & 255;
  return `${a}.${b}.${c}.${d}`;
}

function prefixToMask(prefix) {
  const mask = [];
  let remaining = prefix;
  for (let i = 0; i < 4; i += 1) {
    const bits = Math.max(Math.min(remaining, 8), 0);
    const value = bits === 0 ? 0 : 256 - 2 ** (8 - bits);
    mask.push(value);
    remaining -= bits;
  }
  return mask.join('.');
}

function loadSubnetTasks() {
  if (tasksPromise) {
    return tasksPromise;
  }

  tasksPromise = fetch('data/subnet_tasks.json', { cache: 'no-cache' })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Kunne ikke hente opgaverne.');
      }
      return response.json();
    })
    .then((data) => {
      if (!Array.isArray(data)) {
        throw new Error('Uventet format for opgaver.');
      }
      return data;
    })
    .catch((error) => {
      tasksPromise = null;
      throw error;
    });

  return tasksPromise;
}

function escapeHtml(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatExplanationText(value) {
  const safe = escapeHtml(typeof value === 'string' ? value : '');
  if (safe === '') {
    return '<p class="term-overlay__empty">Ingen forklaring tilgængelig.</p>';
  }

  return safe
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function handleTermOverlayKeydown(event) {
  if (event.key === 'Escape' && termOverlayElement && termOverlayElement.classList.contains('visible')) {
    event.preventDefault();
    closeTermOverlay();
  }
}

function ensureTermOverlay() {
  if (termOverlayElement) {
    return;
  }

  termOverlayElement = document.createElement('div');
  termOverlayElement.id = 'term-overlay';
  termOverlayElement.className = 'term-overlay';
  termOverlayElement.setAttribute('aria-hidden', 'true');
  termOverlayElement.innerHTML = `
    <div class="term-overlay__backdrop" data-overlay-close></div>
    <div class="term-overlay__dialog" role="dialog" aria-modal="true" aria-labelledby="term-overlay-title">
      <button type="button" class="term-overlay__close" aria-label="Luk forklaring" data-overlay-close>&times;</button>
      <h3 id="term-overlay-title" class="term-overlay__title"></h3>
      <div class="term-overlay__body"></div>
    </div>
  `;

  document.body.appendChild(termOverlayElement);

  termOverlayDialog = termOverlayElement.querySelector('.term-overlay__dialog');
  termOverlayTitle = termOverlayElement.querySelector('#term-overlay-title');
  termOverlayBody = termOverlayElement.querySelector('.term-overlay__body');
  termOverlayCloseButton = termOverlayElement.querySelector('.term-overlay__close');
  termOverlayBackdrop = termOverlayElement.querySelector('.term-overlay__backdrop');

  const closers = termOverlayElement.querySelectorAll('[data-overlay-close]');
  closers.forEach((closer) => {
    closer.addEventListener('click', () => {
      closeTermOverlay();
    });
  });

  if (!termOverlayKeyHandlerBound) {
    document.addEventListener('keydown', handleTermOverlayKeydown);
    termOverlayKeyHandlerBound = true;
  }
}

function closeTermOverlay() {
  if (!termOverlayElement) {
    return;
  }

  termOverlayElement.classList.remove('visible');
  termOverlayElement.setAttribute('aria-hidden', 'true');

  if (termOverlayDialog) {
    termOverlayDialog.setAttribute('aria-busy', 'false');
  }

  document.body.classList.remove('term-overlay-open');

  if (termOverlayLastFocus && typeof termOverlayLastFocus.focus === 'function') {
    termOverlayLastFocus.focus();
  }

  termOverlayLastFocus = null;
}

function openTermOverlay(term, context) {
  ensureTermOverlay();

  const trimmedTerm = typeof term === 'string' && term.trim() !== '' ? term.trim() : 'Forklaring';
  const trimmedContext = typeof context === 'string' ? context.trim() : '';
  const cacheKey = `${trimmedTerm}::${trimmedContext}`;

  termOverlayLastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  if (termOverlayTitle) {
    termOverlayTitle.textContent = trimmedTerm;
  }

  if (termOverlayBody) {
    termOverlayBody.innerHTML = '<p class="term-overlay__loading">Henter forklaring...</p>';
  }

  if (termOverlayDialog) {
    termOverlayDialog.setAttribute('aria-busy', 'true');
  }

  termOverlayElement.classList.add('visible');
  termOverlayElement.setAttribute('aria-hidden', 'false');
  document.body.classList.add('term-overlay-open');

  if (termOverlayCloseButton) {
    termOverlayCloseButton.focus();
  }

  if (termExplanationCache.has(cacheKey)) {
    if (termOverlayBody) {
      termOverlayBody.innerHTML = formatExplanationText(termExplanationCache.get(cacheKey));
    }
    if (termOverlayDialog) {
      termOverlayDialog.setAttribute('aria-busy', 'false');
    }
    return;
  }

  fetch('api/explain-term.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      term: trimmedTerm,
      context: trimmedContext
    })
  })
    .then((response) => response.json().catch(() => ({ error: 'Uventet svar fra serveren.' })))
    .then((data) => {
      if (!termOverlayBody) {
        return;
      }

      if (!data || data.error) {
        const message = data && data.error ? data.error : 'Der opstod en fejl under opslaget.';
        termOverlayBody.innerHTML = `<p class="term-overlay__error">${escapeHtml(message)}</p>`;
      } else {
        const explanation = typeof data.explanation === 'string' ? data.explanation : '';
        termExplanationCache.set(cacheKey, explanation);
        termOverlayBody.innerHTML = formatExplanationText(explanation);
      }

      if (termOverlayDialog) {
        termOverlayDialog.setAttribute('aria-busy', 'false');
      }
    })
    .catch((error) => {
      if (!termOverlayBody) {
        return;
      }
      const message = error instanceof Error ? error.message : 'Der opstod en ukendt fejl under opslaget.';
      termOverlayBody.innerHTML = `<p class="term-overlay__error">${escapeHtml(message)}</p>`;
      if (termOverlayDialog) {
        termOverlayDialog.setAttribute('aria-busy', 'false');
      }
    });
}

function setupTutorialTerms() {
  const termButtons = visualizationEl.querySelectorAll('.term-button');
  termButtons.forEach((button) => {
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('click', () => {
      const term = button.getAttribute('data-term') || button.textContent || '';
      const context = button.getAttribute('data-context') || '';
      openTermOverlay(term, context);
    });
  });
}

function calculateSubnetting() {
  const classData = networkClasses[state.networkClass] || networkClasses.C;
  const basePrefix = classData.prefix;
  const baseIp = classData.baseIp;
  const totalHostBits = 32 - basePrefix;

  let subnetBits;
  let numSubnets;
  let hostsPerSubnet;
  let effectiveHostBits;
  let capacityWarning = '';

  if (state.calculationMode === 'subnets') {
    const requestedSubnets = Math.max(1, state.customSubnets);
    const requestedBits = Math.ceil(Math.log2(requestedSubnets));
    subnetBits = Math.min(requestedBits, totalHostBits);
    numSubnets = 2 ** subnetBits;
    effectiveHostBits = Math.max(totalHostBits - subnetBits, 0);
    hostsPerSubnet = effectiveHostBits > 0 ? 2 ** effectiveHostBits - 2 : 0;
    if (requestedBits > totalHostBits) {
      capacityWarning = 'Der er ikke nok bits til så mange subnets i denne klasse. Viser maks mulige subnets.';
    }
  } else {
    const requestedHosts = Math.max(0, state.customHosts);
    const requestedHostBits = Math.ceil(Math.log2(requestedHosts + 2));
    effectiveHostBits = Math.min(requestedHostBits, totalHostBits);
    subnetBits = Math.max(totalHostBits - effectiveHostBits, 0);
    numSubnets = 2 ** subnetBits;
    hostsPerSubnet = effectiveHostBits > 0 ? 2 ** effectiveHostBits - 2 : 0;
    if (requestedHostBits > totalHostBits) {
      capacityWarning = 'Der er ikke nok værts-bits i denne klasse til det ønskede antal hosts. Viser maks mulige hosts.';
    }
  }

  subnetBits = Math.max(subnetBits, 0);

  const newPrefix = Math.min(basePrefix + subnetBits, 32);
  const blockSize = 2 ** Math.max(32 - newPrefix, 0);
  const subnetMask = prefixToMask(newPrefix);

  const subnets = [];
  const baseNumber = ipToNumber(baseIp);
  const totalRange = 2 ** Math.max(totalHostBits, 0);
  const maxRangeEnd = baseNumber + totalRange - 1;

  for (let i = 0; i < numSubnets && i < 256; i += 1) {
    const networkNumber = baseNumber + i * blockSize;
    if (networkNumber > maxRangeEnd) {
      break;
    }

    const broadcastNumber = Math.min(networkNumber + blockSize - 1, maxRangeEnd);
    const firstHostNumber = blockSize > 2 ? networkNumber + 1 : (blockSize > 1 ? networkNumber + 1 : networkNumber);
    const lastHostNumber = blockSize > 2 ? broadcastNumber - 1 : (blockSize > 1 ? broadcastNumber - 1 : networkNumber);

    subnets.push({
      id: i,
      network: numberToIp(networkNumber),
      firstHost: hostsPerSubnet > 0 ? numberToIp(firstHostNumber) : 'Ingen brugbare hosts',
      lastHost: hostsPerSubnet > 0 ? numberToIp(lastHostNumber) : 'Ingen brugbare hosts',
      broadcast: numberToIp(broadcastNumber),
      usableHosts: hostsPerSubnet,
      prefix: newPrefix
    });
  }

  return {
    subnets,
    subnetBits,
    numSubnets,
    hostsPerSubnet,
    newPrefix,
    subnetMask,
    blockSize,
    baseIp,
    basePrefix,
    classLabel: classData.label,
    totalHostBits,
    sliderMaxPower: Math.max(Math.min(totalHostBits, 10), 0),
    hostsSliderMax: Math.max(2, Math.min(65534, 2 ** Math.min(totalHostBits, 16) - 2)),
    capacityWarning
  };
}

function cleanupStep() {
  if (broadcastGenerator) {
    clearInterval(broadcastGenerator);
    broadcastGenerator = null;
  }

  if (broadcastAnimator) {
    clearInterval(broadcastAnimator);
    broadcastAnimator = null;
  }

  if (chefTimer) {
    clearTimeout(chefTimer);
    chefTimer = null;
  }

  broadcastPackets = [];
  subnetGenerators.forEach((interval) => clearInterval(interval));
  subnetAnimators.forEach((interval) => clearInterval(interval));
  subnetGenerators = [];
  subnetAnimators = [];
  routerTrafficGenerators.forEach((interval) => clearInterval(interval));
  routerTrafficAnimators.forEach((interval) => clearInterval(interval));
  routerTrafficCleanups.forEach((cleanup) => cleanup());
  routerTrafficGenerators = [];
  routerTrafficAnimators = [];
  routerTrafficCleanups = [];
}

function setStep(newStep) {
  if (newStep < 0 || newStep >= steps.length) {
    return;
  }

  cleanupStep();
  state.step = newStep;
  updateUI();
}

function updateNavigation() {
  stepIndicator.textContent = `Trin ${state.step + 1} af ${steps.length}`;
  prevBtn.disabled = state.step === 0;

  if (state.step === steps.length - 1) {
    nextBtn.textContent = '🔄 Genstart';
  } else {
    nextBtn.textContent = 'Næste →';
  }
}

function renderProgress() {
  const items = steps
    .map((stepItem, index) => {
      const isCurrent = index === state.step;
      const isComplete = index < state.step;
      const circleClasses = isCurrent
        ? 'bg-indigo-600 text-white'
        : isComplete
          ? 'bg-green-500 text-white'
          : 'bg-gray-300 text-gray-700';
      const label = isComplete ? '✓' : index + 1;
      const connectorClass = isComplete ? 'bg-green-500' : 'bg-gray-300';

      return `
        <li class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full flex items-center justify-center font-semibold ${circleClasses}">${label}</div>
          ${index < steps.length - 1
            ? `<span class="block w-12 md:w-16 h-1 rounded ${connectorClass}"></span>`
            : ''}
        </li>
      `;
    })
    .join('');

  progressEl.innerHTML = `
    <div class="bg-white rounded-xl shadow-lg p-4 overflow-x-auto">
      <ol class="flex items-center justify-between min-w-[520px]">${items}</ol>
      <div class="text-center mt-4">
        <h2 class="text-lg font-bold text-gray-800">${steps[state.step].title}</h2>
        <p class="text-sm text-gray-600 mt-1">${steps[state.step].description}</p>
      </div>
    </div>
  `;
}

function createDeviceCards(devices, extraClasses = '') {
  return devices
    .map(
      (device) => `
        <div class="device-card ${extraClasses}">
          <div class="text-xl">💻</div>
          <span>${device.ip}</span>
        </div>
      `
    )
    .join('');
}

function renderStep0() {
  const deviceGrid = createDeviceCards(originalDevices);

  visualizationEl.innerHTML = `
    <div class="tutorial-grid">
      <article class="tutorial-panel">
        <header class="tutorial-panel__header">
          <p class="tutorial-panel__kicker">Hej hold!</p>
          <h2 class="tutorial-panel__title">Hvorfor skal vi lære subnetting?</h2>
        </header>
        <p>
          Når vi samler alle maskiner i ét <button type="button" class="term-button" data-term="LAN" data-context="Definér begrebet Local Area Network for elever på et grundforløb og giv et letforståeligt eksempel.">lokalt netværk</button>,
          råber hver enhed ud i rummet, når den sender en <button type="button" class="term-button" data-term="Broadcast" data-context="Forklar hvad broadcast betyder i et LAN, hvorfor det kan skabe støj, og hvordan det opleves af nye elever.">broadcast</button>.
          På et Grundforløb betyder det langsomme filer, nervøse printere og elever der mister fokus. Som underviser er mit mål, at I kan se problemet og selv foreslå en løsning.
        </p>
        <section class="tutorial-section">
          <h3>Udfordringen i værkstedet</h3>
          <p>
            Forestil jer vores Techcollege Makerspace: 24 pc'er, en 3D-printer og nogle tablets. Alt er sat i ét netværk <span class="tutorial-highlight">192.168.1.0/24</span>.
            Når en elev spejler sin skærm, ender signalet hos alle andre – uanset om de har brug for det eller ej. Det slider på både udstyr og tålmodighed.
          </p>
          <ul class="tutorial-list">
            <li>Mere unødvendig trafik = langsommere svar fra servere.</li>
            <li>Fejl ét sted kan smitte hele netværket.</li>
            <li>Det er svært at finde ud af, hvem der skaber støjen.</li>
          </ul>
        </section>
        <section class="tutorial-section">
          <h3>Løsningen vi arbejder hen imod</h3>
          <p>
            Vi deler netværket i mindre <button type="button" class="term-button" data-term="Subnet" data-context="Forklar hvad et subnet er, og hvordan det hjælper med at reducere broadcast-trafik. Brug et pædagogisk hverdagseksempel.">subnets</button>. Hvert subnet er som sin egen klasse – roligere og lettere at styre.
            I dag undersøger vi, hvordan <button type="button" class="term-button" data-term="CIDR" data-context="Forklar Classless Inter-Domain Routing kort og i et sprog som en Grundforløbselev kan forstå. Giv et nemt eksempel.">CIDR-notation</button>
            og en ny <button type="button" class="term-button" data-term="Subnetmaske" data-context="Forklar hvad en subnetmaske er, hvordan man læser den, og hvorfor den er vigtig når man opdeler netværk.">subnetmaske</button> hjælper os med at låne bits fra host-delen.
          </p>
          <p>
            Når vi har delt os i to grupper, sørger en <button type="button" class="term-button" data-term="Gateway" data-context="Forklar gateway-begrebet for en ny elev og hvorfor den er nødvendig når vi forbinder flere subnets.">gateway</button> eller router for at sende trafikken de rigtige steder hen.
          </p>
        </section>
        <section class="tutorial-section">
          <h3>Sådan gør vi i fællesskab</h3>
          <ol class="tutorial-steps">
            <li>Observer den massive broadcast-trafik i animationen til højre.</li>
            <li>Diskutér i grupper hvorfor det er et problem for vores elever og udstyr.</li>
            <li>Lav en hurtig skitse af, hvordan to subnets kunne fordeles i jeres praksis.</li>
            <li>Brug beregneren i trin 5 til at teste jeres idéer.</li>
          </ol>
        </section>
        <footer class="tutorial-panel__footer">
          <p>
            Husk: subnetting handler ikke kun om tal – det handler om at give vores læringsmiljø ro. Stil spørgsmål, klik på fagordene for ekstra forklaringer, og vær nysgerrige!
          </p>
        </footer>
      </article>

      <div class="relative min-h-[500px] tutorial-visual">
        <div class="border-4 border-red-400 rounded-xl p-4 md:p-6 bg-red-50 relative overflow-hidden min-h-[500px]">
          <div class="callout-box absolute top-4 left-4 z-10">
            <p class="font-bold text-gray-800">Netværk: 192.168.1.0/24</p>
            <p class="text-gray-600">Subnet mask: 255.255.255.0</p>
            <p class="text-gray-500">× 24 enheder</p>
          </div>

          <div class="absolute left-1/2 -translate-x-1/2 top-12 bg-gray-800 text-white rounded-lg border-4 border-gray-900 shadow-2xl px-10 py-3 z-20">
            <div class="font-bold text-sm text-center mb-2 tracking-widest">LAN SWITCH</div>
            <div class="flex gap-1 justify-center">
              ${Array.from({ length: 12 })
                .map(() => '<span class="block w-2 h-6 bg-green-400 rounded"></span>')
                .join('')}
            </div>
          </div>

          <svg id="broadcast-svg" class="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <g id="line-layer"></g>
            <g id="packet-layer"></g>
          </svg>

          <div class="absolute w-full" style="top: 160px;" id="device-wrapper">
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 px-4">
              ${deviceGrid}
            </div>
          </div>

          <div class="absolute bottom-6 right-6 text-6xl">⚠️</div>
        </div>

        <div id="chef-popup" class="hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-4 border-indigo-600 rounded-xl p-6 shadow-2xl max-w-sm z-30">
          <div class="text-4xl mb-3 text-center">👨‍💼</div>
          <p class="text-lg font-bold text-gray-800 mb-2">Netværksadministrator:</p>
          <p class="text-sm text-gray-700">"Vi har et problem! Alt for meget broadcast-trafik gennem switchen. Vi skal opdele netværket i mindre subnets!"</p>
        </div>
      </div>
    </div>
  `;

  setupBroadcastScene();
  setupTutorialTerms();
}

function renderStep1() {
  const subnets = [
    {
      id: 1,
      title: 'Subnet 1: 192.168.1.0/25',
      mask: 'Mask: 255.255.255.128',
      hostsLabel: '× 12 enheder',
      svgId: 'subnet1-svg',
      panelClasses: 'border-green-400 from-green-50 to-green-100',
      portColor: 'bg-green-400',
      badgeClasses: 'bg-green-200 text-green-700',
      devices: subnet1Devices,
      deviceBorderClass: 'border-green-400',
      lineColor: '#34d399',
      packetColor: '#22c55e'
    },
    {
      id: 2,
      title: 'Subnet 2: 192.168.1.128/25',
      mask: 'Mask: 255.255.255.128',
      hostsLabel: '× 12 enheder',
      svgId: 'subnet2-svg',
      panelClasses: 'border-blue-400 from-blue-50 to-blue-100',
      portColor: 'bg-blue-400',
      badgeClasses: 'bg-blue-200 text-blue-700',
      devices: subnet2Devices,
      deviceBorderClass: 'border-blue-400',
      lineColor: '#60a5fa',
      packetColor: '#2563eb'
    }
  ];

  const routerPorts = Array.from({ length: 8 })
    .map(() => '<span class="block w-2 h-6 rounded bg-emerald-400"></span>')
    .join('');

  const panels = subnets
    .map((subnet) => {
      const deviceGrid = createDeviceCards(subnet.devices, subnet.deviceBorderClass);
      const switchPorts = Array.from({ length: 6 })
        .map(() => `<span class="block w-2 h-5 ${subnet.portColor} rounded"></span>`)
        .join('');

      return `
        <div class="relative border-4 ${subnet.panelClasses} rounded-2xl bg-gradient-to-b overflow-hidden min-h-[420px]">
          <div class="absolute top-4 left-4 bg-white/95 border border-slate-200 rounded-lg px-4 py-2 shadow-sm z-30">
            <p class="font-bold text-gray-800 text-sm">${subnet.title}</p>
            <p class="text-xs text-gray-600">${subnet.mask}</p>
            <p class="text-xs text-gray-500">${subnet.hostsLabel}</p>
          </div>

          <div class="absolute left-1/2 -translate-x-1/2 top-20 bg-slate-900 text-white border-4 border-slate-800 rounded-2xl px-6 py-3 shadow-2xl z-40">
            <p class="text-xs font-bold text-center tracking-[0.35em]">SWITCH ${subnet.id}</p>
            <div class="flex gap-1 justify-center mt-2">${switchPorts}</div>
          </div>

          <svg id="${subnet.svgId}" class="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <g data-layer="lines"></g>
            <g data-layer="packets"></g>
          </svg>

          <div class="absolute w-full" style="top: 182px;">
            <div class="grid grid-cols-3 gap-4 px-6">
              ${deviceGrid}
            </div>
          </div>

          <div class="absolute left-0 right-0 bottom-6 text-center z-30">
            <span class="inline-flex items-center gap-1 ${subnet.badgeClasses} px-3 py-1 rounded-full text-xs font-semibold">📶 Lokalt broadcast</span>
          </div>
        </div>
      `;
    })
    .join('');

  visualizationEl.innerHTML = `
    <div class="relative min-h-[560px]">
      <div class="absolute left-1/2 -translate-x-1/2 top-4 z-40 text-center router-stack">
        <div class="bg-slate-900 text-white border-4 border-slate-700 rounded-2xl px-8 py-4 shadow-2xl">
          <p class="text-sm font-bold tracking-[0.45em]">ROUTER</p>
          <div class="flex gap-1 justify-center mt-2">${routerPorts}</div>
        </div>
        <div class="router-bridge-badge">Forbinder subnettene</div>
        <div id="router-stop-indicator" class="router-stop-label">
          <span class="router-stop-dot" aria-hidden="true"></span>
          <span>Router stopper broadcast til andre LAN</span>
        </div>
      </div>

      <svg class="absolute inset-0 w-full h-full pointer-events-none router-link-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path id="router-path-left" d="M50 24 C44 31 38 36 33 43" stroke="#14b8a6" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.78" fill="none"></path>
        <path id="router-path-right" d="M50 24 C56 31 62 36 67 43" stroke="#38bdf8" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.78" fill="none"></path>
      </svg>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-40">
        ${panels}
      </div>
    </div>
  `;

  subnets.forEach((subnet) => {
    setupSubnetScene({
      svgId: subnet.svgId,
      devices: subnet.devices,
      switchX: 50,
      switchY: 30,
      lineColor: subnet.lineColor,
      packetColor: subnet.packetColor
    });
  });

  setupRouterTraffic({
    pathId: 'router-path-left',
    color: '#0f766e',
    burstColor: '#14b8a6',
    indicatorId: 'router-stop-indicator'
  });

  setupRouterTraffic({
    pathId: 'router-path-right',
    color: '#0369a1',
    burstColor: '#38bdf8',
    indicatorId: 'router-stop-indicator'
  });
}

function renderStep2() {
  visualizationEl.innerHTML = `
    <div class="space-y-6">
      <div class="bg-indigo-50 border-2 border-indigo-400 rounded-xl p-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4">Sådan beregner vi den nye mask:</h3>
        <div class="space-y-4">
          <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p class="font-bold text-gray-800 mb-2">Originalt netværk:</p>
            <p class="text-gray-700">192.168.1.0/24</p>
            <p class="text-gray-600 text-sm">Subnet mask: 255.255.255.0</p>
            <p class="text-gray-600 text-sm">Binært: 11111111.11111111.11111111.<span class="text-red-500 font-semibold">00000000</span></p>
          </div>
          <div class="text-center text-2xl">↓</div>
          <div class="bg-white p-4 rounded-lg border border-green-300 shadow-sm">
            <p class="font-bold text-gray-800 mb-2">Ny subnet mask (vi låner 1 bit):</p>
            <p class="text-gray-700">255.255.255.128 → /25</p>
            <p class="text-gray-600 text-sm">Binært: 11111111.11111111.11111111.<span class="text-green-600 font-semibold">10000000</span></p>
            <p class="text-indigo-600 font-bold text-sm mt-2">Dette giver os 2<sup>1</sup> = 2 subnets!</p>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-green-100 border-2 border-green-500 rounded-xl p-4">
          <h4 class="font-bold text-gray-800 mb-2">Subnet 1:</h4>
          <ul class="text-sm text-gray-700 space-y-1">
            <li><strong>Netværk:</strong> 192.168.1.0</li>
            <li><strong>Første IP:</strong> 192.168.1.1</li>
            <li><strong>Sidste IP:</strong> 192.168.1.126</li>
            <li><strong>Broadcast:</strong> 192.168.1.127</li>
            <li class="text-indigo-600 font-semibold">Range: 0 - 127</li>
          </ul>
        </div>
        <div class="bg-blue-100 border-2 border-blue-500 rounded-xl p-4">
          <h4 class="font-bold text-gray-800 mb-2">Subnet 2:</h4>
          <ul class="text-sm text-gray-700 space-y-1">
            <li><strong>Netværk:</strong> 192.168.1.128</li>
            <li><strong>Første IP:</strong> 192.168.1.129</li>
            <li><strong>Sidste IP:</strong> 192.168.1.254</li>
            <li><strong>Broadcast:</strong> 192.168.1.255</li>
            <li class="text-indigo-600 font-semibold">Range: 128 - 255</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

function renderStep3() {
  visualizationEl.innerHTML = `
    <div class="space-y-4">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="border-4 border-green-500 rounded-xl p-4 bg-green-50">
          <div class="bg-white p-3 rounded-lg border border-green-400 shadow-sm mb-3">
            <p class="font-bold text-sm text-gray-800">Subnet 1: 192.168.1.0/25</p>
            <p class="text-xs text-gray-600">Mask: 255.255.255.128</p>
            <p class="text-xs text-gray-500">Netværk: 192.168.1.0</p>
            <p class="text-xs text-gray-500">Gateway: 192.168.1.1</p>
            <p class="text-xs text-gray-500">Broadcast: 192.168.1.127</p>
          </div>
          <div class="grid grid-cols-3 gap-2">
            ${createDeviceCards(subnet1Devices, 'border-green-400')}
          </div>
          <div class="mt-3 text-center">
            <span class="badge">📶 Lokalt broadcast</span>
          </div>
        </div>
        <div class="border-4 border-blue-500 rounded-xl p-4 bg-blue-50">
          <div class="bg-white p-3 rounded-lg border border-blue-400 shadow-sm mb-3">
            <p class="font-bold text-sm text-gray-800">Subnet 2: 192.168.1.128/25</p>
            <p class="text-xs text-gray-600">Mask: 255.255.255.128</p>
            <p class="text-xs text-gray-500">Netværk: 192.168.1.128</p>
            <p class="text-xs text-gray-500">Gateway: 192.168.1.129</p>
            <p class="text-xs text-gray-500">Broadcast: 192.168.1.255</p>
          </div>
          <div class="grid grid-cols-3 gap-2">
            ${createDeviceCards(subnet2Devices, 'border-blue-400')}
          </div>
          <div class="mt-3 text-center">
            <span class="badge" style="background-color:#bfdbfe;color:#1d4ed8;">📶 Lokalt broadcast</span>
          </div>
        </div>
      </div>
      <div class="bg-green-100 border-2 border-green-500 rounded-xl p-4">
        <h3 class="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">✅ Resultatet:</h3>
        <ul class="text-sm text-gray-700 space-y-1">
          <li>• Broadcast-trafik er isoleret i hvert subnet.</li>
          <li>• Hver enhed modtager kun relevante broadcasts.</li>
          <li>• Reduceret netværksbelastning og bedre ydeevne.</li>
          <li>• Nemmer fejlfinding og administration.</li>
        </ul>
      </div>
    </div>
  `;
}

function renderStep4() {
  const calc = calculateSubnetting();
  const subnetModeActive = state.calculationMode === 'subnets';
  const desiredPower = Math.round(Math.log2(Math.max(state.customSubnets, 1)));
  const sliderPower = Math.min(desiredPower, calc.sliderMaxPower);
  if (subnetModeActive && desiredPower !== sliderPower) {
    state.customSubnets = 2 ** sliderPower;
  }

  if (!subnetModeActive) {
    const clampedHosts = Math.min(Math.max(state.customHosts, 2), calc.hostsSliderMax);
    if (clampedHosts !== state.customHosts) {
      state.customHosts = clampedHosts;
    }
  }

  const hostBitsLeft = Math.max(calc.totalHostBits - calc.subnetBits, 0);
  const hostExplanation = hostBitsLeft > 0
    ? `• Det giver 2<sup>${hostBitsLeft}</sup> - 2 = <strong>${calc.hostsPerSubnet} brugbare hosts</strong> pr. subnet`
    : '• Ingen værtsbits tilbage - kun netværks- og broadcast-adresser uden brugbare værter.';

  const subnetCards = calc.subnets
    .map(
      (subnet) => `
        <div class="bg-white border-2 border-indigo-400 rounded-xl p-4 shadow-sm">
          <div class="bg-indigo-600 text-white font-semibold text-center py-1 rounded-lg mb-3">Subnet ${subnet.id + 1}</div>
          <div class="space-y-2 text-sm">
            <div class="bg-blue-50 rounded p-2">
              <p class="text-xs text-gray-600 font-semibold uppercase">Netværksadresse</p>
              <p class="font-mono text-gray-800 font-bold">${subnet.network}/${calc.newPrefix}</p>
            </div>
            <div class="bg-green-50 rounded p-2">
              <p class="text-xs text-gray-600 font-semibold uppercase">Første IP</p>
              <p class="font-mono text-gray-800 font-bold">${subnet.firstHost}</p>
            </div>
            <div class="bg-green-50 rounded p-2">
              <p class="text-xs text-gray-600 font-semibold uppercase">Sidste IP</p>
              <p class="font-mono text-gray-800 font-bold">${subnet.lastHost}</p>
            </div>
            <div class="bg-red-50 rounded p-2">
              <p class="text-xs text-gray-600 font-semibold uppercase">Broadcast</p>
              <p class="font-mono text-gray-800 font-bold">${subnet.broadcast}</p>
            </div>
            <div class="bg-purple-100 rounded p-2 text-center border border-purple-300">
              <p class="text-xs text-gray-600 font-semibold uppercase">Brugbare hosts</p>
              <p class="text-xl font-bold text-purple-600">${subnet.usableHosts}</p>
            </div>
            <div class="bg-yellow-50 rounded p-2 text-xs text-slate-600">
              <p><strong>Subnet mask:</strong> ${calc.subnetMask}</p>
            </div>
          </div>
        </div>
      `
    )
    .join('');

  visualizationEl.innerHTML = `
    <div class="space-y-4">
      <div class="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-3 justify-between">
        <div>
          <p class="text-sm font-semibold text-slate-600">Vælg netværksklasse:</p>
          <div class="flex flex-wrap gap-2 mt-2">
            ${Object.entries(networkClasses)
              .map(([key, classInfo]) => {
                const isActive = state.networkClass === key;
                return `
                  <button type="button" class="network-class-btn ${isActive ? 'active' : ''}" data-network-class="${key}">
                    ${classInfo.label}
                    <span>${classInfo.baseIp}/${classInfo.prefix}</span>
                  </button>
                `;
              })
              .join('')}
          </div>
        </div>
        <div class="text-sm text-slate-600 leading-5">
          <p><strong>Aktiv klasse:</strong> ${calc.classLabel}</p>
          <p><strong>Base:</strong> ${calc.baseIp}/${calc.basePrefix}</p>
          <p><strong>Tilgængelige værtsbits:</strong> ${calc.totalHostBits}</p>
        </div>
      </div>

      <div class="bg-purple-50 border-2 border-purple-400 rounded-lg p-3">
        <h3 class="text-base md:text-lg font-bold text-gray-800 mb-3">🎮 Eksperimenter med subnetting:</h3>
        <div class="flex gap-2 md:gap-3 mb-3">
          <button data-mode="subnets" class="flex-1 py-2 px-3 rounded-lg font-bold text-xs md:text-sm transition-colors ${subnetModeActive ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-300'}">Vælg antal subnets</button>
          <button data-mode="hosts" class="flex-1 py-2 px-3 rounded-lg font-bold text-xs md:text-sm transition-colors ${!subnetModeActive ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-300'}">Vælg antal hosts pr. subnet</button>
        </div>
        <div class="bg-white p-3 rounded-lg border-2 border-purple-300">
          ${subnetModeActive
            ? `
                <label class="block text-gray-800 font-bold mb-2 text-sm">Hvor mange subnets vil du have?</label>
                <div class="flex items-center gap-3">
                  <input type="range" min="0" max="${calc.sliderMaxPower}" value="${sliderPower}" id="subnet-range" class="flex-1" />
                  <span class="text-xl md:text-2xl font-bold text-purple-600 w-16 text-center">${state.customSubnets}</span>
                </div>
                <p class="text-xs text-gray-600 mt-1">Potenser af 2 op til klassens kapacitet.</p>
              `
            : `
                <label class="block text-gray-800 font-bold mb-2 text-sm">Hvor mange hosts skal der være plads til pr. subnet?</label>
                <div class="flex items-center gap-3">
                  <input type="range" min="2" max="${calc.hostsSliderMax}" value="${state.customHosts}" id="hosts-range" class="flex-1" />
                  <span class="text-xl md:text-2xl font-bold text-purple-600 w-16 text-center">${state.customHosts}</span>
                </div>
              `}
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div class="bg-white p-2 md:p-3 rounded-lg border-2 border-indigo-400 text-center">
          <p class="text-xs text-gray-600 mb-0.5">Antal subnets</p>
          <p class="text-2xl md:text-3xl font-bold text-indigo-600">${calc.numSubnets}</p>
        </div>
        <div class="bg-white p-2 md:p-3 rounded-lg border-2 border-indigo-400 text-center">
          <p class="text-xs text-gray-600 mb-0.5">Hosts pr. subnet</p>
          <p class="text-2xl md:text-3xl font-bold text-indigo-600">${calc.hostsPerSubnet}</p>
        </div>
        <div class="bg-white p-2 md:p-3 rounded-lg border-2 border-indigo-400 text-center">
          <p class="text-xs text-gray-600 mb-0.5">Subnet bits lånt</p>
          <p class="text-2xl md:text-3xl font-bold text-indigo-600">${calc.subnetBits}</p>
        </div>
        <div class="bg-white p-2 md:p-3 rounded-lg border-2 border-indigo-400 text-center">
          <p class="text-xs text-gray-600 mb-0.5">Ny subnet mask</p>
          <p class="text-base md:text-xl font-bold text-indigo-600">${calc.subnetMask}</p>
          <p class="text-xs text-gray-500">/${calc.newPrefix}</p>
        </div>
      </div>

      <div class="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3">
        <p class="font-bold text-gray-800 mb-1 text-sm">💡 Hvorfor disse tal?</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs text-gray-700">
          <p>• Vi startede med /${calc.basePrefix} (${calc.totalHostBits} bits til hosts)</p>
          <p>• Vi låner <strong>${calc.subnetBits} bit(s)</strong> til subnetting</p>
          <p>• Dette giver os 2<sup>${calc.subnetBits}</sup> = <strong>${calc.numSubnets} subnets</strong></p>
          <p>• Der er nu ${hostBitsLeft} bits tilbage til hosts</p>
          <p class="md:col-span-2">${hostExplanation}</p>
        </div>
        ${calc.capacityWarning ? `<p class="text-xs text-amber-600 font-semibold mt-2">⚠️ ${calc.capacityWarning}</p>` : ''}
      </div>

      <div class="bg-gradient-to-br from-gray-100 to-gray-200 border-4 border-gray-400 rounded-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg md:text-xl font-bold text-gray-800">
            🌐 Netværk: ${calc.baseIp}/${calc.newPrefix}
          </h3>
          <div class="bg-white px-3 py-1 rounded-lg border-2 border-gray-400">
            <span class="font-bold text-sm text-gray-800">${calc.numSubnets} Subnets</span>
          </div>
        </div>
        <div class="card-grid grid-scroll">
          ${subnetCards}
        </div>
        ${calc.subnets.length >= 256 ? '<p class="text-xs text-gray-500 mt-2">Viser de første 256 subnets for at holde listen håndterbar.</p>' : ''}
      </div>

      <div class="bg-green-100 border-2 border-green-500 rounded-lg p-3">
        <p class="text-xs md:text-sm text-gray-700">
          <strong>💡 Vigtigt at huske:</strong> Bemærk hvordan flere subnets betyder færre hosts pr. subnet,
          og omvendt. Dette er en fundamental del af subnetting - du skal balancere mellem
          antal netværk og antal enheder pr. netværk baseret på dine behov!
        </p>
      </div>
    </div>
  `;

  visualizationEl.querySelectorAll('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.getAttribute('data-mode');
      if (!mode) {
        return;
      }
      state.calculationMode = mode;
      if (mode === 'subnets' && (state.customSubnets & (state.customSubnets - 1)) !== 0) {
        state.customSubnets = 2;
      }
      renderStep4();
    });
  });

  visualizationEl.querySelectorAll('[data-network-class]').forEach((button) => {
    button.addEventListener('click', () => {
      const selected = button.getAttribute('data-network-class');
      if (!selected || !networkClasses[selected]) {
        return;
      }
      if (selected === state.networkClass) {
        return;
      }

      state.networkClass = selected;

      const classInfo = networkClasses[selected];
      const hostBits = 32 - classInfo.prefix;
      const maxPower = Math.max(Math.min(hostBits, 10), 0);
      const currentPower = Math.round(Math.log2(Math.max(state.customSubnets, 1)));
      if (currentPower > maxPower) {
        state.customSubnets = 2 ** maxPower || 1;
      }
      const maxHosts = Math.max(2, Math.min(65534, 2 ** Math.min(hostBits, 16) - 2));
      if (state.customHosts > maxHosts) {
        state.customHosts = maxHosts;
      }

      renderStep4();
    });
  });

  const subnetRange = document.getElementById('subnet-range');
  if (subnetRange) {
    subnetRange.addEventListener('input', (event) => {
      const power = Number(event.target.value);
      state.customSubnets = 2 ** power;
      renderStep4();
    });
  }

  const hostsRange = document.getElementById('hosts-range');
  if (hostsRange) {
    hostsRange.addEventListener('input', (event) => {
      state.customHosts = Number(event.target.value);
      renderStep4();
    });
  }
}

function setTaskStatus(taskId, status, details = {}) {
  const current = state.taskStatuses[taskId] || {};
  state.taskStatuses[taskId] = {
    ...current,
    ...details,
    status
  };
}

function submitTaskAnswer(taskId) {
  if (!state.tasks) {
    return;
  }

  const input = visualizationEl.querySelector(`[data-task-input="${taskId}"]`);
  if (!input) {
    return;
  }

  const answer = input.value.trim();

  if (answer === '') {
    setTaskStatus(taskId, 'incomplete', {
      feedback: 'Skriv dit svar, før du sender det til evaluering.',
      answer: ''
    });
    renderStep5();
    return;
  }

  setTaskStatus(taskId, 'checking', {
    feedback: 'Tjekker svar hos AI...',
    answer
  });
  renderStep5();

  fetch('api/check-subnet-task.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      taskId,
      answer
    })
  })
    .then((response) => response.json().catch(() => ({ error: 'Uventet svar fra serveren.' })))
    .then((data) => {
      if (!data || data.error) {
        setTaskStatus(taskId, 'error', {
          feedback: data && data.error ? data.error : 'Ukendt fejl under evalueringen.',
          answer
        });
      } else {
        const normalizedStatus = data.status === 'correct' ? 'correct' : data.status === 'incorrect' ? 'incorrect' : 'error';
        setTaskStatus(taskId, normalizedStatus, {
          feedback: data.feedback || '',
          answer
        });
      }
      renderStep5();
    })
    .catch((error) => {
      setTaskStatus(taskId, 'error', {
        feedback: error instanceof Error ? error.message : 'Der opstod en ukendt fejl.',
        answer
      });
      renderStep5();
    });
}

function revealTaskSolution(taskId) {
  if (!state.tasks) {
    return;
  }

  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) {
    return;
  }

  const current = state.taskStatuses[taskId] || {};
  state.taskStatuses[taskId] = {
    ...current,
    revealed: true
  };

  renderStep5();
}

function getTaskStatusLabel(status) {
  switch (status) {
    case 'correct':
      return '✅ Korrekt besvarelse';
    case 'incorrect':
      return '❌ Ikke korrekt endnu';
    case 'checking':
      return '⏳ Evaluerer...';
    case 'error':
      return '⚠️ Fejl under evaluering';
    case 'incomplete':
      return '✍️ Svar mangler';
    default:
      return '📄 Klar til besvarelse';
  }
}

function renderStep5() {
  if (state.tasksError) {
    visualizationEl.innerHTML = `
      <div class="min-h-[400px] flex flex-col items-center justify-center text-center gap-3">
        <div class="text-4xl">😕</div>
        <p class="text-sm md:text-base text-gray-700 max-w-lg">${escapeHtml(state.tasksError)}</p>
        <button type="button" class="btn-primary" id="retry-load-tasks">Prøv at indlæse opgaverne igen</button>
      </div>
    `;

    const retryButton = document.getElementById('retry-load-tasks');
    if (retryButton) {
      retryButton.addEventListener('click', () => {
        state.tasksError = null;
        state.tasks = null;
        renderStep5();
      });
    }
    return;
  }

  if (!state.tasks) {
    visualizationEl.innerHTML = `
      <div class="min-h-[400px] flex flex-col items-center justify-center text-center gap-2">
        <div class="loading-spinner"></div>
        <p class="text-sm text-gray-600">Indlæser 50 opgaver i subnetting...</p>
      </div>
    `;

    if (!state.tasksLoading) {
      state.tasksLoading = true;
      loadSubnetTasks()
        .then((tasks) => {
          state.tasks = tasks;
          state.tasksLoading = false;
          renderStep5();
        })
        .catch((error) => {
          state.tasksLoading = false;
          state.tasksError = error instanceof Error ? error.message : 'Kunne ikke hente opgaverne.';
          renderStep5();
        });
    }
    return;
  }

  const totalTasks = state.tasks.length;
  const solvedCount = state.tasks.reduce((count, task) => {
    const status = state.taskStatuses[task.id]?.status;
    return status === 'correct' ? count + 1 : count;
  }, 0);
  const percent = totalTasks > 0 ? Math.round((solvedCount / totalTasks) * 100) : 0;

  const cards = state.tasks
    .map((task, index) => {
      const statusInfo = state.taskStatuses[task.id] || {};
      const statusClass = statusInfo.status ? ` ${statusInfo.status}` : '';
      const label = getTaskStatusLabel(statusInfo.status);
      const storedAnswer = statusInfo.answer || '';
      const feedback = statusInfo.feedback ? `<div class="task-feedback ${statusInfo.status || 'idle'}">${escapeHtml(statusInfo.feedback)}</div>` : '';
      const promptHtml = escapeHtml(task.prompt || '').replace(/\n/g, '<br>');
      const category = task.category ? `<span class="task-tag">${escapeHtml(task.category)}</span>` : '';
      const disabledAttr = statusInfo.status === 'checking' ? 'disabled' : '';
      const buttonLabel = statusInfo.status === 'checking' ? 'Evaluerer...' : 'Send svar';
      const isRevealed = Boolean(statusInfo.revealed);
      const revealDisabledAttr = isRevealed ? 'disabled' : '';
      const revealLabel = isRevealed ? 'Forklaring vist' : 'Vis forklaring';
      const explanationBlock = isRevealed
        ? `<div class="task-explanation"><p class="task-explanation-answer"><strong>Korrekt svar:</strong> ${escapeHtml(task.expectedAnswer || '')}</p><p>${escapeHtml(task.explanation || '').replace(/\n/g, '<br>')}</p></div>`
        : '';

      return `
        <article class="task-card${statusClass}" data-task-id="${task.id}">
          <header class="task-card-header">
            <div>
              <p class="task-title">Opgave ${index + 1}</p>
              ${category}
            </div>
            <p class="task-status">${label}</p>
          </header>
          <div class="task-body">
            <p class="task-prompt">${promptHtml}</p>
            <textarea data-task-input="${task.id}" rows="3" class="task-answer" placeholder="Skriv dit svar her..." ${disabledAttr}>${escapeHtml(storedAnswer)}</textarea>
          </div>
          <footer class="task-footer">
            <div class="task-actions">
              <button type="button" class="btn-primary task-submit" data-task-submit="${task.id}" ${disabledAttr}>${buttonLabel}</button>
              <button type="button" class="btn-secondary task-reveal" data-task-reveal="${task.id}" ${revealDisabledAttr}>${revealLabel}</button>
            </div>
            ${feedback}
            ${explanationBlock}
          </footer>
        </article>
      `;
    })
    .join('');

  visualizationEl.innerHTML = `
    <div class="space-y-4">
      <div class="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="text-lg font-bold text-slate-800">🧠 Subnetting-øvelser</h3>
          <p class="text-sm text-slate-600">Skriv dine svar og få feedback fra AI for hver opgave.</p>
        </div>
        <div class="task-progress">
          <span class="task-progress-count">${solvedCount}/${totalTasks} løst</span>
          <div class="task-progress-bar">
            <div style="width: ${percent}%"></div>
          </div>
        </div>
      </div>

      <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-sm text-slate-700">
        <p>Tip: Skriv dine beregninger tydeligt. Hvis svaret ikke stemmer, får du feedback om, hvad du bør dobbelttjekke.</p>
      </div>

      <div class="task-grid">
        ${cards}
      </div>
    </div>
  `;

  visualizationEl.querySelectorAll('[data-task-submit]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const id = Number(event.currentTarget.getAttribute('data-task-submit'));
      if (Number.isNaN(id)) {
        return;
      }
      submitTaskAnswer(id);
    });
  });

  visualizationEl.querySelectorAll('[data-task-reveal]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const id = Number(event.currentTarget.getAttribute('data-task-reveal'));
      if (Number.isNaN(id)) {
        return;
      }
      revealTaskSolution(id);
    });
  });
}

function renderVisualization() {
  visualizationEl.classList.remove('fade-in');
  void visualizationEl.offsetWidth; // trigger reflow
  visualizationEl.classList.add('fade-in');

  calculatorEl.innerHTML = '';

  switch (state.step) {
    case 0:
      renderStep0();
      break;
    case 1:
      renderStep1();
      break;
    case 2:
      renderStep2();
      break;
    case 3:
      renderStep3();
      break;
    case 4:
      renderStep4();
      break;
    case 5:
      renderStep5();
      break;
    default:
      visualizationEl.innerHTML = '';
  }
}

function setupRouterTraffic({ pathId, color, burstColor, indicatorId }) {
  const path = document.getElementById(pathId);
  if (!path) {
    return;
  }

  const svg = path.ownerSVGElement;
  if (!svg || typeof path.getTotalLength !== 'function') {
    return;
  }

  const pathLength = path.getTotalLength();
  const activePackets = [];
  const indicator = indicatorId ? document.getElementById(indicatorId) : null;
  let activeIndicatorBursts = 0;

  const spawnPacket = () => {
    const packet = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const startPoint = path.getPointAtLength(pathLength);
    packet.setAttribute('r', '1.9');
    packet.setAttribute('fill', color);
    packet.setAttribute('cx', startPoint.x);
    packet.setAttribute('cy', startPoint.y);
    packet.setAttribute('class', 'router-packet');
    svg.appendChild(packet);

    activePackets.push({
      element: packet,
      progress: 0
    });

    if (activePackets.length > 10) {
      const stale = activePackets.shift();
      if (stale && stale.element && stale.element.parentNode) {
        stale.element.parentNode.removeChild(stale.element);
      }
    }
  };

  const generator = setInterval(() => {
    if (Math.random() < 0.85) {
      spawnPacket();
    }
  }, 600);

  const animator = setInterval(() => {
    for (let i = activePackets.length - 1; i >= 0; i -= 1) {
      const packet = activePackets[i];
      const nextProgress = packet.progress + 0.05;
      packet.progress = nextProgress;

      const distance = Math.max(pathLength * (1 - nextProgress), 0);
      const point = path.getPointAtLength(distance);
      packet.element.setAttribute('cx', point.x);
      packet.element.setAttribute('cy', point.y);
      packet.element.classList.add('active');

      if (nextProgress >= 1) {
        if (packet.element.parentNode) {
          packet.element.parentNode.removeChild(packet.element);
        }
        activePackets.splice(i, 1);

        const routerPoint = path.getPointAtLength(0);
        const burst = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        burst.setAttribute('cx', routerPoint.x);
        burst.setAttribute('cy', routerPoint.y);
        burst.setAttribute('r', '0.5');
        burst.setAttribute('class', 'router-burst');
        burst.setAttribute('stroke', burstColor || color);
        burst.setAttribute('stroke-width', '1.4');
        svg.appendChild(burst);

        if (indicator) {
          activeIndicatorBursts += 1;
          indicator.classList.add('router-stop-label--active');
          indicator.classList.add('router-stop-label--pulse');
          setTimeout(() => {
            activeIndicatorBursts = Math.max(activeIndicatorBursts - 1, 0);
            indicator.classList.remove('router-stop-label--pulse');
            if (activeIndicatorBursts === 0) {
              indicator.classList.remove('router-stop-label--active');
            }
          }, 700);
        }

        setTimeout(() => {
          if (burst.parentNode) {
            burst.parentNode.removeChild(burst);
          }
        }, 650);
      }
    }
  }, 60);

  const cleanup = () => {
    for (let i = activePackets.length - 1; i >= 0; i -= 1) {
      const packet = activePackets[i];
      if (packet.element && packet.element.parentNode) {
        packet.element.parentNode.removeChild(packet.element);
      }
    }
    activePackets.length = 0;
    svg.querySelectorAll('.router-burst').forEach((burst) => {
      if (burst.parentNode) {
        burst.parentNode.removeChild(burst);
      }
    });
    if (indicator) {
      activeIndicatorBursts = 0;
      indicator.classList.remove('router-stop-label--pulse');
      indicator.classList.remove('router-stop-label--active');
    }
  };

  routerTrafficGenerators.push(generator);
  routerTrafficAnimators.push(animator);
  routerTrafficCleanups.push(cleanup);
}

function setupSubnetScene({ svgId, devices, switchX, switchY, lineColor, packetColor }) {
  const svg = document.getElementById(svgId);
  if (!svg) {
    return;
  }

  const lineLayer = svg.querySelector('[data-layer="lines"]');
  const packetLayer = svg.querySelector('[data-layer="packets"]');

  if (!lineLayer || !packetLayer) {
    return;
  }

  lineLayer.innerHTML = '';
  packetLayer.innerHTML = '';

  devices.forEach((_, index) => {
    const { x, y } = getSubnetDevicePosition(index);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x);
    line.setAttribute('y1', y);
    line.setAttribute('x2', switchX);
    line.setAttribute('y2', switchY);
    line.setAttribute('stroke', lineColor);
    line.setAttribute('stroke-width', '1.6');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('opacity', '0.65');
    lineLayer.appendChild(line);
  });

  const toSwitchPackets = [];
  const fromSwitchPackets = [];

  const generator = setInterval(() => {
    const fromIndex = Math.floor(Math.random() * devices.length);
    const startPos = getSubnetDevicePosition(fromIndex);

    const packetElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    packetElement.setAttribute('r', '2.4');
    packetElement.setAttribute('class', 'packet');
    packetElement.setAttribute('fill', packetColor);
    packetElement.setAttribute('cx', startPos.x);
    packetElement.setAttribute('cy', startPos.y);
    packetLayer.appendChild(packetElement);

    const availableTargets = devices
      .map((_, idx) => idx)
      .filter((idx) => idx !== fromIndex);
    for (let i = availableTargets.length - 1; i > 0; i -= 1) {
      const swapIndex = Math.floor(Math.random() * (i + 1));
      const temp = availableTargets[i];
      availableTargets[i] = availableTargets[swapIndex];
      availableTargets[swapIndex] = temp;
    }

    const fanOut = Math.min(4, availableTargets.length);
    const targets = availableTargets.slice(0, fanOut);

    toSwitchPackets.push({
      element: packetElement,
      progress: 0,
      startPos,
      targets
    });

    if (toSwitchPackets.length > 5) {
      const removed = toSwitchPackets.shift();
      if (removed && removed.element && removed.element.parentNode) {
        removed.element.parentNode.removeChild(removed.element);
      }
    }
  }, 1200);

  const animator = setInterval(() => {
    for (let i = toSwitchPackets.length - 1; i >= 0; i -= 1) {
      const packet = toSwitchPackets[i];
      const nextProgress = packet.progress + 0.05;
      packet.progress = nextProgress;

      if (nextProgress >= 1) {
        if (packet.element.parentNode) {
          packet.element.parentNode.removeChild(packet.element);
        }
        toSwitchPackets.splice(i, 1);

        packet.targets.forEach((targetIndex) => {
          const targetPos = getSubnetDevicePosition(targetIndex);
          const clone = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          clone.setAttribute('r', '2');
          clone.setAttribute('class', 'packet active');
          clone.setAttribute('fill', packetColor);
          clone.setAttribute('cx', switchX);
          clone.setAttribute('cy', switchY);
          packetLayer.appendChild(clone);

          fromSwitchPackets.push({
            element: clone,
            progress: 0,
            targetPos
          });
        });

        continue;
      }

      const x = packet.startPos.x + (switchX - packet.startPos.x) * nextProgress;
      const y = packet.startPos.y + (switchY - packet.startPos.y) * nextProgress;
      packet.element.setAttribute('cx', x);
      packet.element.setAttribute('cy', y);
      packet.element.classList.add('active');
    }

    for (let i = fromSwitchPackets.length - 1; i >= 0; i -= 1) {
      const packet = fromSwitchPackets[i];
      const nextProgress = packet.progress + 0.06;
      packet.progress = nextProgress;

      if (nextProgress >= 1) {
        if (packet.element.parentNode) {
          packet.element.parentNode.removeChild(packet.element);
        }
        fromSwitchPackets.splice(i, 1);
        continue;
      }

      const x = switchX + (packet.targetPos.x - switchX) * nextProgress;
      const y = switchY + (packet.targetPos.y - switchY) * nextProgress;
      packet.element.setAttribute('cx', x);
      packet.element.setAttribute('cy', y);
    }
  }, 60);

  subnetGenerators.push(generator);
  subnetAnimators.push(animator);
}

function setupBroadcastScene() {
  const svg = document.getElementById('broadcast-svg');
  if (!svg) {
    return;
  }

  const lineLayer = svg.querySelector('#line-layer');
  const packetLayer = svg.querySelector('#packet-layer');

  lineLayer.innerHTML = '';
  packetLayer.innerHTML = '';
  broadcastPackets = [];

  originalDevices.forEach((device, index) => {
    const { x, y } = getDevicePosition(index);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x);
    line.setAttribute('y1', y);
    line.setAttribute('x2', '50');
    line.setAttribute('y2', '12');
    line.setAttribute('stroke', '#9ca3af');
    line.setAttribute('stroke-width', '5');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('vector-effect', 'non-scaling-stroke');
    lineLayer.appendChild(line);
  });

  const spawnPacket = () => {
    const fromIndex = Math.floor(Math.random() * originalDevices.length);
    const startPos = getDevicePosition(fromIndex);

    let targetIndex = Math.floor(Math.random() * originalDevices.length);
    while (targetIndex === fromIndex) {
      targetIndex = Math.floor(Math.random() * originalDevices.length);
    }
    const targetPos = getDevicePosition(targetIndex);

    const packet = {
      id: Date.now() + Math.random(),
      from: fromIndex,
      target: targetIndex,
      progress: 0,
      element: document.createElementNS('http://www.w3.org/2000/svg', 'circle'),
      startPos,
      targetPos
    };

    packet.element.setAttribute('r', '2.6');
    packet.element.setAttribute('class', 'packet');
    packet.element.setAttribute('cx', startPos.x);
    packet.element.setAttribute('cy', startPos.y);
    packetLayer.appendChild(packet.element);
    broadcastPackets.push(packet);

    if (broadcastPackets.length > 20) {
      const removed = broadcastPackets.shift();
      if (removed && removed.element && removed.element.parentNode) {
        removed.element.parentNode.removeChild(removed.element);
      }
    }
  };

  broadcastGenerator = setInterval(() => {
    spawnPacket();
    if (Math.random() < 0.45) {
      spawnPacket();
    }
  }, 220);

  broadcastAnimator = setInterval(() => {
    broadcastPackets = broadcastPackets.filter((packet) => {
      const nextProgress = packet.progress + 0.065;
      packet.progress = nextProgress;

      if (nextProgress > 2) {
        if (packet.element.parentNode) {
          packet.element.parentNode.removeChild(packet.element);
        }
        return false;
      }

      let x;
      let y;

      if (nextProgress <= 1) {
        x = packet.startPos.x + (50 - packet.startPos.x) * nextProgress;
        y = packet.startPos.y + (12 - packet.startPos.y) * nextProgress;
      } else {
        const t = nextProgress - 1;
        x = 50 + (packet.targetPos.x - 50) * t;
        y = 12 + (packet.targetPos.y - 12) * t;
      }

      packet.element.setAttribute('cx', x);
      packet.element.setAttribute('cy', y);
      packet.element.classList.add('active');
      return true;
    });
  }, 50);

  chefTimer = setTimeout(() => {
    const popup = document.getElementById('chef-popup');
    if (popup) {
      popup.classList.remove('hidden');
    }
  }, 4000);
}

function updateUI() {
  renderProgress();
  renderVisualization();
  updateNavigation();
}

prevBtn.addEventListener('click', () => {
  setStep(state.step - 1);
});

nextBtn.addEventListener('click', () => {
  if (state.step === steps.length - 1) {
    state.step = 0;
    state.calculationMode = 'subnets';
    state.customSubnets = 2;
    state.customHosts = 126;
    state.networkClass = 'C';
    state.taskStatuses = {};
    updateUI();
    return;
  }
  setStep(state.step + 1);
});

updateUI();
