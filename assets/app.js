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
    description: 'Eksperimenter med antal subnets eller hosts og se beregningerne opdatere med det samme.'
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

const state = {
  step: 0,
  calculationMode: 'subnets',
  customSubnets: 2,
  customHosts: 126
};

let broadcastGenerator = null;
let broadcastAnimator = null;
let broadcastPackets = [];
let chefTimer = null;
let subnetGenerators = [];
let subnetAnimators = [];

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

function calculateSubnetting() {
  let subnetBits;
  let numSubnets;
  let hostsPerSubnet;

  if (state.calculationMode === 'subnets') {
    numSubnets = state.customSubnets;
    subnetBits = Math.ceil(Math.log2(numSubnets));
    hostsPerSubnet = Math.pow(2, 8 - subnetBits) - 2;
  } else {
    hostsPerSubnet = state.customHosts;
    const hostBits = Math.ceil(Math.log2(hostsPerSubnet + 2));
    subnetBits = 8 - hostBits;
    if (subnetBits < 0) {
      subnetBits = 0;
    }
    numSubnets = Math.pow(2, Math.max(subnetBits, 0));
  }

  if (subnetBits < 0) {
    subnetBits = 0;
  }

  const newPrefix = 24 + subnetBits;
  const subnetMaskLastOctet = 256 - Math.pow(2, 8 - subnetBits);
  const blockSize = Math.pow(2, 8 - subnetBits);

  const subnets = [];
  for (let i = 0; i < numSubnets && i < 256; i += 1) {
    const networkAddress = i * blockSize;
    if (networkAddress > 255) {
      break;
    }

    const firstHost = networkAddress + 1;
    const lastHost = networkAddress + blockSize - 2;
    const broadcast = networkAddress + blockSize - 1;

    subnets.push({
      id: i,
      network: `192.168.1.${networkAddress}`,
      firstHost: `192.168.1.${firstHost}`,
      lastHost: `192.168.1.${lastHost}`,
      broadcast: `192.168.1.${broadcast}`,
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
    subnetMask: `255.255.255.${subnetMaskLastOctet}`,
    blockSize
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
    <div class="relative min-h-[500px]">
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
  `;

  setupBroadcastScene();
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
          <div class="absolute top-4 left-4 bg-white/90 border border-slate-200 rounded-lg px-4 py-2 shadow-sm z-30">
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
      <div class="absolute left-1/2 -translate-x-1/2 top-6 z-40 text-center">
        <div class="bg-slate-900 text-white border-4 border-slate-700 rounded-2xl px-8 py-4 shadow-2xl">
          <p class="text-sm font-bold tracking-[0.45em]">ROUTER</p>
          <div class="flex gap-1 justify-center mt-2">${routerPorts}</div>
        </div>
        <span class="mt-2 inline-block bg-white/90 text-xs font-semibold text-slate-600 px-3 py-1 rounded-full shadow-sm">Forbinder subnettene</span>
      </div>

      <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="50" y1="24" x2="25" y2="40" stroke="#475569" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="4 4"></line>
        <line x1="50" y1="24" x2="75" y2="40" stroke="#475569" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="4 4"></line>
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
            <div class="bg-purple-50 rounded p-2 text-center border border-purple-200">
              <p class="text-xs text-gray-600 uppercase">Brugbare hosts</p>
              <p class="text-xl font-bold text-purple-600">${subnet.usableHosts}</p>
            </div>
          </div>
        </div>
      `
    )
    .join('');

  visualizationEl.innerHTML = `
    <div class="space-y-5">
      <div class="bg-purple-50 border-2 border-purple-400 rounded-xl p-4">
        <h3 class="text-lg font-bold text-gray-800 mb-3">🎮 Eksperimenter med subnetting</h3>
        <div class="flex flex-col md:flex-row gap-3">
          <button data-mode="subnets" class="flex-1 py-2 px-3 rounded-lg font-bold text-sm border ${state.calculationMode === 'subnets' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300'}">Vælg antal subnets</button>
          <button data-mode="hosts" class="flex-1 py-2 px-3 rounded-lg font-bold text-sm border ${state.calculationMode === 'hosts' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300'}">Vælg antal hosts pr. subnet</button>
        </div>
        <div class="bg-white border border-purple-200 rounded-lg p-4 mt-3">
          ${state.calculationMode === 'subnets'
            ? `
              <label class="block text-sm font-semibold text-gray-800 mb-2">Hvor mange subnets vil du have?</label>
              <div class="flex items-center gap-4">
                <input type="range" id="subnet-range" min="0" max="8" step="1" value="${Math.log2(state.customSubnets)}" class="flex-1" />
                <span class="text-3xl font-bold text-purple-600 min-w-[3rem] text-center">${state.customSubnets}</span>
              </div>
              <p class="text-xs text-gray-500 mt-1">Værdien er en potens af to (2, 4, 8, ... 256).</p>
            `
            : `
              <label class="block text-sm font-semibold text-gray-800 mb-2">Hvor mange hosts skal der være plads til pr. subnet?</label>
              <div class="flex items-center gap-4">
                <input type="range" id="hosts-range" min="2" max="254" value="${state.customHosts}" class="flex-1" />
                <span class="text-3xl font-bold text-purple-600 min-w-[3rem] text-center">${state.customHosts}</span>
              </div>
            `}
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-white border-2 border-indigo-400 rounded-xl p-3 text-center">
          <p class="text-xs text-gray-500 uppercase">Antal subnets</p>
          <p class="text-2xl font-bold text-indigo-600">${calc.numSubnets}</p>
        </div>
        <div class="bg-white border-2 border-indigo-400 rounded-xl p-3 text-center">
          <p class="text-xs text-gray-500 uppercase">Hosts pr. subnet</p>
          <p class="text-2xl font-bold text-indigo-600">${calc.hostsPerSubnet}</p>
        </div>
        <div class="bg-white border-2 border-indigo-400 rounded-xl p-3 text-center">
          <p class="text-xs text-gray-500 uppercase">Subnet bits lånt</p>
          <p class="text-2xl font-bold text-indigo-600">${calc.subnetBits}</p>
        </div>
        <div class="bg-white border-2 border-indigo-400 rounded-xl p-3 text-center">
          <p class="text-xs text-gray-500 uppercase">Ny subnet mask</p>
          <p class="text-lg font-bold text-indigo-600">${calc.subnetMask}</p>
          <p class="text-xs text-gray-500">/${calc.newPrefix}</p>
        </div>
      </div>

      <div class="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 text-sm text-gray-700">
        <p class="font-bold text-gray-800 mb-2">💡 Hvorfor disse tal?</p>
        <ul class="list-disc list-inside space-y-1">
          <li>Vi startede med /24 (8 bits til hosts).</li>
          <li>Vi låner <strong>${calc.subnetBits}</strong> bit(s) til subnetting.</li>
          <li>Det giver 2<sup>${calc.subnetBits}</sup> = <strong>${calc.numSubnets}</strong> subnets.</li>
          <li>Der er ${8 - calc.subnetBits} bits tilbage til hosts.</li>
          <li>Brugbare hosts: 2<sup>${8 - calc.subnetBits}</sup> − 2 = <strong>${calc.hostsPerSubnet}</strong>.</li>
        </ul>
      </div>

      <div class="bg-gradient-to-br from-slate-100 to-slate-200 border-4 border-slate-300 rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-lg font-bold text-gray-800">🌐 Netværk: 192.168.1.0/${calc.newPrefix}</h4>
          <span class="bg-white border border-gray-300 rounded-lg px-3 py-1 text-sm font-semibold text-gray-700">${calc.numSubnets} subnets</span>
        </div>
        <div class="card-grid grid-scroll">
          ${subnetCards}
        </div>
        ${calc.subnets.length >= 256
          ? '<p class="text-xs text-gray-500 mt-2">Viser de første 256 subnets for at holde listen håndterbar.</p>'
          : ''}
      </div>
    </div>
  `;

  visualizationEl.querySelectorAll('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.getAttribute('data-mode');
      state.calculationMode = mode;
      if (mode === 'subnets' && (state.customSubnets & (state.customSubnets - 1)) !== 0) {
        // Sikrer at værdien er en potens af to
        state.customSubnets = 2;
      }
      renderStep4();
    });
  });

  const subnetRange = document.getElementById('subnet-range');
  if (subnetRange) {
    subnetRange.addEventListener('input', (event) => {
      const power = Number(event.target.value);
      state.customSubnets = Math.pow(2, power);
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
    default:
      visualizationEl.innerHTML = '';
  }
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
    line.setAttribute('stroke-width', '1.8');
    line.setAttribute('stroke-linecap', 'round');
    lineLayer.appendChild(line);
  });

  broadcastGenerator = setInterval(() => {
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

    packet.element.setAttribute('r', '2.2');
    packet.element.setAttribute('class', 'packet');
    packet.element.setAttribute('cx', startPos.x);
    packet.element.setAttribute('cy', startPos.y);
    packetLayer.appendChild(packet.element);
    broadcastPackets.push(packet);

    if (broadcastPackets.length > 12) {
      const removed = broadcastPackets.shift();
      if (removed && removed.element && removed.element.parentNode) {
        removed.element.parentNode.removeChild(removed.element);
      }
    }
  }, 450);

  broadcastAnimator = setInterval(() => {
    broadcastPackets = broadcastPackets.filter((packet) => {
      const nextProgress = packet.progress + 0.05;
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
    updateUI();
    return;
  }
  setStep(state.step + 1);
});

updateUI();
