import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.161.0/examples/jsm/controls/OrbitControls.js';

const DEVICE_TYPES = {
  pc: { label: 'PC', color: 0x66bbff, ports: 1, role: 'client' },
  router: { label: 'Router', color: 0xffb74d, ports: 4, role: 'router' },
  switch: { label: 'Switch', color: 0xa5d6a7, ports: 12, role: 'switch' },
  server: { label: 'Windows Server', color: 0x9575cd, ports: 4, role: 'server' },
  printer: { label: 'Printer', color: 0xff8a80, ports: 1, role: 'printer' },
  ap: { label: 'Access Point', color: 0x80deea, ports: 1, role: 'ap' },
  firewall: { label: 'Firewall', color: 0xffd54f, ports: 4, role: 'firewall' }
};

const PROTOCOLS = {
  DHCP: 0x3ddc97,
  DNS: 0x50a9ff,
  HTTP: 0xff9f43,
  PING: 0xe056fd,
  BLOCKED: 0xff3f5a
};

const state = {
  devices: [],
  cables: [],
  packets: [],
  selectedType: 'pc',
  selectedDevice: null,
  simSpeed: 1,
  firewallAllowHttp: true,
  missionMode: false,
  missionIndex: 0,
  packetStats: { total: 0, dropped: 0, latencySamples: [] },
  tick: 0
};

let renderer, scene, camera, controls, raycaster, pointer;
let floor, deskSlots = [], rackSlots = [];
const clock = new THREE.Clock();
const tooltip = document.getElementById('tooltip');

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06080f);
  scene.fog = new THREE.Fog(0x070b16, 30, 100);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 400);
  camera.position.set(14, 12, 18);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxDistance = 80;
  controls.minDistance = 5;
  controls.target.set(0, 2.5, 0);

  const hemi = new THREE.HemisphereLight(0x7daeff, 0x162133, 1.0);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(18, 24, 8);
  key.castShadow = true;
  scene.add(key);

  const fill = new THREE.PointLight(0x5ca8ff, 0.6, 80);
  fill.position.set(-10, 8, -6);
  scene.add(fill);

  buildEnvironment();
  setupUI();

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  window.addEventListener('resize', onResize);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      state.simSpeed = state.simSpeed === 1 ? 60 : 1;
    }
  });
}

function buildEnvironment() {
  const floorGeo = new THREE.PlaneGeometry(60, 60);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x0f1729, roughness: 0.9, metalness: 0.1 });
  floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.userData.type = 'floor';
  scene.add(floor);

  const grid = new THREE.GridHelper(60, 60, 0x1f355f, 0x11223f);
  grid.position.y = 0.01;
  scene.add(grid);

  for (let i = 0; i < 8; i++) {
    const slot = makePlacementSlot(-14 + (i % 4) * 3.2, 0.4, -10 + Math.floor(i / 4) * 4, 'desk');
    deskSlots.push(slot);
  }

  const rackFrame = new THREE.Mesh(
    new THREE.BoxGeometry(6, 9, 3),
    new THREE.MeshStandardMaterial({ color: 0x202a3b, metalness: 0.7, roughness: 0.35, transparent: true, opacity: 0.6 })
  );
  rackFrame.position.set(12, 4.5, -8);
  scene.add(rackFrame);

  for (let i = 0; i < 10; i++) {
    const slot = makePlacementSlot(12, 0.8 + i * 0.8, -8, 'rack');
    slot.scale.set(2.5, 0.15, 2.4);
    rackSlots.push(slot);
  }
}

function makePlacementSlot(x, y, z, slotType) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.2, 2),
    new THREE.MeshStandardMaterial({ color: 0x1a2f52, emissive: 0x081224, emissiveIntensity: 0.4 })
  );
  mesh.position.set(x, y, z);
  mesh.userData = { type: 'slot', slotType, occupied: false, deviceId: null };
  scene.add(mesh);
  return mesh;
}

function setupUI() {
  const container = document.getElementById('deviceButtons');
  Object.entries(DEVICE_TYPES).forEach(([key, cfg]) => {
    const btn = document.createElement('button');
    btn.textContent = cfg.label;
    if (key === state.selectedType) btn.classList.add('active');
    btn.onclick = () => {
      state.selectedType = key;
      [...container.children].forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
    };
    container.appendChild(btn);
  });

  document.getElementById('sandboxBtn').onclick = () => {
    state.missionMode = false;
    document.getElementById('missionPanel').innerHTML = '<b>Sandbox:</b> Free build mode.';
  };

  document.getElementById('missionBtn').onclick = () => {
    state.missionMode = true;
    state.missionIndex = 0;
    updateMissionPanel();
  };

  document.getElementById('firewallBtn').onclick = () => {
    state.firewallAllowHttp = !state.firewallAllowHttp;
  };
}

function createDevice(type, slotMesh) {
  const cfg = DEVICE_TYPES[type];
  const group = new THREE.Group();

  const chassis = new THREE.Mesh(
    new THREE.BoxGeometry(type === 'switch' ? 2.2 : 1.6, 0.8, 1.2),
    new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.42, metalness: 0.5 })
  );
  group.add(chassis);

  if (type === 'router' || type === 'firewall' || type === 'server') {
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6), new THREE.MeshStandardMaterial({ color: 0xe7ecf7 }));
    antenna.position.set(0.5, 0.7, 0.2);
    group.add(antenna);
  }

  const portMarkers = [];
  for (let i = 0; i < cfg.ports; i++) {
    const p = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.05, 0.05),
      new THREE.MeshBasicMaterial({ color: 0x0c172e })
    );
    const spread = cfg.ports === 1 ? 0 : (i / (cfg.ports - 1) - 0.5) * 1.8;
    p.position.set(spread, -0.1, 0.62);
    group.add(p);
    portMarkers.push(p);
  }

  group.position.copy(slotMesh.position).add(new THREE.Vector3(0, 0.55, 0));
  group.userData.type = 'device';
  scene.add(group);

  const id = `dev-${Math.random().toString(16).slice(2, 8)}`;
  const isServer = type === 'server';
  const device = {
    id,
    type,
    label: cfg.label,
    mesh: group,
    slot: slotMesh,
    ports: Array.from({ length: cfg.ports }, (_, i) => ({ index: i, up: true, cableId: null, speed: 1000, errors: 0 })),
    online: true,
    ip: type === 'router' ? `10.0.${state.devices.length}.1` : null,
    vlan: 1,
    bandwidthMbps: 0,
    macTable: new Map(),
    dhcpPool: isServer ? { base: '10.0.1.', next: 100 } : null,
    dnsTable: isServer ? { intranet: '10.0.1.10', printer: '10.0.1.30' } : null,
    services: isServer ? { ad: true, dns: true, dhcp: true } : null
  };

  slotMesh.userData.occupied = true;
  slotMesh.userData.deviceId = id;
  state.devices.push(device);
  return device;
}

function connectDevices(a, b) {
  const freeA = a.ports.find((p) => p.up && !p.cableId);
  const freeB = b.ports.find((p) => p.up && !p.cableId);
  if (!freeA || !freeB) return;

  const curve = new THREE.CatmullRomCurve3([
    a.mesh.position.clone().add(new THREE.Vector3(0, 0.3, 0.4)),
    a.mesh.position.clone().lerp(b.mesh.position, 0.5).add(new THREE.Vector3(0, 1.2, 0)),
    b.mesh.position.clone().add(new THREE.Vector3(0, 0.3, 0.4))
  ]);
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 24, 0.04, 10, false),
    new THREE.MeshStandardMaterial({ color: 0x28435f, emissive: 0x102338, emissiveIntensity: 0.35 })
  );
  scene.add(tube);

  const id = `cbl-${Math.random().toString(16).slice(2, 8)}`;
  const cable = { id, a: a.id, b: b.id, aPort: freeA.index, bPort: freeB.index, mesh: tube, quality: Math.random() > 0.92 ? 'bad' : 'good' };
  freeA.cableId = id;
  freeB.cableId = id;
  state.cables.push(cable);
}

function onPointerMove(e) {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

  const hover = pickObject();
  if (!hover) {
    tooltip.style.display = 'none';
    return;
  }

  const d = hover.object.userData.deviceRef;
  if (d) {
    tooltip.innerHTML = `<b>${d.label}</b><br>
      <span class="${d.online ? 'state-online' : 'state-offline'}">${d.online ? 'Online' : 'Offline'}</span><br>
      IP: ${d.ip ?? 'Unassigned'}<br>
      VLAN: ${d.vlan}<br>
      BW: ${d.bandwidthMbps.toFixed(1)} Mbps<br>
      Ports up: ${d.ports.filter((p) => p.up).length}/${d.ports.length}`;
    tooltip.style.left = `${e.clientX}px`;
    tooltip.style.top = `${e.clientY}px`;
    tooltip.style.display = 'block';
  }
}

function onPointerDown(e) {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  const hit = pickObject();
  if (!hit) return;

  if (e.button === 2) {
    const d = hit.object.userData.deviceRef;
    if (d) {
      d.online = !d.online;
      d.mesh.children[0].material.emissive = new THREE.Color(d.online ? 0x092044 : 0x330000);
    }
    return;
  }

  const slot = hit.object.userData.type === 'slot' ? hit.object : null;
  if (slot && !slot.userData.occupied) {
    createDevice(state.selectedType, slot);
    return;
  }

  const device = hit.object.userData.deviceRef;
  if (device) {
    if (!state.selectedDevice) {
      state.selectedDevice = device;
      highlightDevice(device, true);
    } else if (state.selectedDevice.id !== device.id) {
      connectDevices(state.selectedDevice, device);
      highlightDevice(state.selectedDevice, false);
      state.selectedDevice = null;
    }
  }
}

function highlightDevice(device, on) {
  device.mesh.children[0].material.emissive = new THREE.Color(on ? 0x2c6ac9 : 0x000000);
}

function pickObject() {
  raycaster.setFromCamera(pointer, camera);
  const deviceMeshes = state.devices.flatMap((d) => {
    d.mesh.traverse((c) => (c.userData.deviceRef = d));
    return [d.mesh, ...d.mesh.children];
  });
  const picks = raycaster.intersectObjects([...deskSlots, ...rackSlots, ...deviceMeshes], true);
  return picks[0];
}

function graphNeighbors(deviceId) {
  return state.cables.flatMap((c) => {
    if (c.a === deviceId) return [{ device: getDevice(c.b), cable: c }];
    if (c.b === deviceId) return [{ device: getDevice(c.a), cable: c }];
    return [];
  });
}

function getDevice(id) {
  return state.devices.find((d) => d.id === id);
}

function updateSimulation(dt) {
  const simDt = dt * state.simSpeed;
  state.tick += simDt;

  if (state.tick % 0.45 < simDt) {
    generateTrafficBurst();
  }

  state.devices.forEach((d) => {
    d.bandwidthMbps = Math.max(0, d.bandwidthMbps * 0.9 - 0.2);
    if (d.type === 'switch') {
      if (d.macTable.size > 70) d.macTable.clear();
    }
  });

  state.packets.forEach((p) => {
    p.progress += (simDt * p.speed) / p.path.length;
    if (p.progress >= p.path.length) {
      p.done = true;
      onPacketArrive(p);
    } else {
      const point = p.curve.getPoint(p.progress / p.path.length);
      p.mesh.position.copy(point);
    }
  });

  state.packets = state.packets.filter((p) => {
    if (!p.done) return true;
    scene.remove(p.mesh);
    return false;
  });

  if (state.missionMode) checkMissions();
}

function generateTrafficBurst() {
  const clients = state.devices.filter((d) => d.type === 'pc' && d.online);
  if (!clients.length) return;

  clients.forEach((client) => {
    if (!client.ip) {
      const dhcp = state.devices.find((d) => d.type === 'server' && d.services?.dhcp && d.online);
      if (dhcp) {
        spawnLogicalPacket(client, dhcp, 'DHCP', 1.5);
      }
      return;
    }

    const dnsServer = state.devices.find((d) => d.type === 'server' && d.services?.dns && d.online);
    if (dnsServer) spawnLogicalPacket(client, dnsServer, 'DNS', 1.6);

    const target = state.devices.find((d) => d.type === 'server' && d.online);
    if (target) spawnLogicalPacket(client, target, 'HTTP', 1.2);

    const router = state.devices.find((d) => d.type === 'router' && d.online);
    if (router) spawnLogicalPacket(client, router, 'PING', 2.0);
  });
}

function spawnLogicalPacket(src, dst, proto, speed) {
  const route = bfsRoute(src.id, dst.id);
  if (!route) {
    state.packetStats.dropped += 1;
    return;
  }

  for (let i = 0; i < route.length - 1; i++) {
    const a = getDevice(route[i]);
    const b = getDevice(route[i + 1]);
    const blocked = shouldBlockTraffic(a, b, proto);
    spawnPacketVisual(a, b, blocked ? 'BLOCKED' : proto, speed, { src, dst, proto, blocked });
    if (blocked) {
      state.packetStats.dropped += 1;
      break;
    }
  }
}

function shouldBlockTraffic(a, b, proto) {
  if (proto !== 'HTTP') return false;
  if (state.firewallAllowHttp) return false;
  return [a.type, b.type].includes('firewall');
}

function bfsRoute(srcId, dstId) {
  const queue = [[srcId]];
  const seen = new Set([srcId]);

  while (queue.length) {
    const path = queue.shift();
    const tail = path[path.length - 1];
    if (tail === dstId) return path;

    graphNeighbors(tail).forEach(({ device, cable }) => {
      if (!device || seen.has(device.id) || cable.quality === 'bad' || !device.online) return;
      seen.add(device.id);
      queue.push([...path, device.id]);
    });
  }

  return null;
}

function spawnPacketVisual(a, b, proto, speed, meta) {
  const points = [
    a.mesh.position.clone().add(new THREE.Vector3(0, 0.6, 0)),
    a.mesh.position.clone().lerp(b.mesh.position, 0.5).add(new THREE.Vector3(0, 0.9, 0)),
    b.mesh.position.clone().add(new THREE.Vector3(0, 0.6, 0))
  ];
  const curve = new THREE.CatmullRomCurve3(points);
  const pathLen = points[0].distanceTo(points[1]) + points[1].distanceTo(points[2]);

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 10, 10),
    new THREE.MeshBasicMaterial({ color: PROTOCOLS[proto], transparent: true, opacity: 0.95 })
  );

  scene.add(mesh);
  state.packets.push({ mesh, curve, progress: 0, path: pathLen, speed, ...meta, proto, done: false, startedAt: performance.now() });

  a.bandwidthMbps += 2;
  b.bandwidthMbps += 2;
  state.packetStats.total += 1;

  if (a.type === 'switch' && meta?.src?.id) a.macTable.set(meta.src.id, b.id);
}

function onPacketArrive(packet) {
  const latency = (performance.now() - packet.startedAt) / state.simSpeed;
  state.packetStats.latencySamples.push(latency);
  if (state.packetStats.latencySamples.length > 80) state.packetStats.latencySamples.shift();

  if (packet.proto === 'DHCP' && !packet.src.ip) {
    const server = packet.dst.type === 'server' ? packet.dst : null;
    if (server?.dhcpPool) {
      packet.src.ip = `${server.dhcpPool.base}${server.dhcpPool.next++}`;
    }
  }

  if (packet.proto === 'DNS' && packet.dst.dnsTable) {
    packet.src.lastResolved = packet.dst.dnsTable.intranet;
  }
}

function computeHealth() {
  const online = state.devices.filter((d) => d.online).length;
  const avgLatency = avg(state.packetStats.latencySamples);
  const loss = state.packetStats.total ? (state.packetStats.dropped / state.packetStats.total) * 100 : 0;
  const security = state.firewallAllowHttp ? 65 : 85;
  const health = Math.max(0, 100 - loss * 1.2 - avgLatency * 0.03 + online * 2);

  return {
    clients: state.devices.filter((d) => d.type === 'pc' && d.ip).length,
    throughput: state.devices.reduce((acc, d) => acc + d.bandwidthMbps, 0),
    latency: avgLatency,
    loss,
    security,
    health
  };
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

const MISSIONS = [
  { title: 'Small Office LAN', check: () => hasType('pc', 2) && hasType('switch', 1) && connectedTypes('pc', 'switch'), hint: 'Deploy 2 PCs and 1 switch, then cable them.' },
  { title: 'Multi-Subnet Routing', check: () => hasType('router', 1) && hasType('switch', 2), hint: 'Add a router and two switches for subnet interconnect.' },
  { title: 'Domain Services', check: () => hasType('server', 1) && state.devices.some((d) => d.type === 'pc' && d.ip), hint: 'Place a Windows Server to assign DHCP and DNS.' },
  { title: 'Shared Printing', check: () => hasType('printer', 1) && connectedTypes('printer', 'switch'), hint: 'Attach a printer to the LAN.' },
  { title: 'Troubleshooting', check: () => state.cables.some((c) => c.quality === 'bad') && computeHealth().loss > 5, hint: 'Observe failures from bad cables / blocked routes.' }
];

function hasType(type, count) {
  return state.devices.filter((d) => d.type === type).length >= count;
}

function connectedTypes(a, b) {
  return state.cables.some((c) => {
    const da = getDevice(c.a);
    const db = getDevice(c.b);
    return (da?.type === a && db?.type === b) || (da?.type === b && db?.type === a);
  });
}

function checkMissions() {
  const m = MISSIONS[state.missionIndex];
  if (!m) return;
  if (m.check()) state.missionIndex += 1;
  updateMissionPanel();
}

function updateMissionPanel() {
  const panel = document.getElementById('missionPanel');
  if (!state.missionMode) return;

  const lines = MISSIONS.map((m, i) => {
    if (i < state.missionIndex) return `<div class="mission-complete">✔ ${m.title}</div>`;
    if (i === state.missionIndex) return `<div><b>▶ ${m.title}</b><br><span>${m.hint}</span></div>`;
    return `<div>○ ${m.title}</div>`;
  });

  panel.innerHTML = `<b>Missions:</b><br>${lines.join('')}`;
}

function updateHud() {
  const m = computeHealth();
  const metrics = document.getElementById('hudMetrics');
  metrics.innerHTML = `
    <div>Connected Clients</div><div>${m.clients}</div>
    <div>Throughput</div><div>${m.throughput.toFixed(1)} Mbps</div>
    <div>Latency</div><div>${m.latency.toFixed(1)} ms</div>
    <div>Packet Loss</div><div>${m.loss.toFixed(1)}%</div>
    <div>Security Score</div><div>${m.security}</div>
    <div>Network Health</div><div>${m.health.toFixed(0)}</div>
    <div>Sim Speed</div><div>${state.simSpeed}x</div>
    <div>Firewall HTTP</div><div>${state.firewallAllowHttp ? 'ALLOW' : 'BLOCK'}</div>
  `;
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.033);
  updateSimulation(dt);
  updateHud();
  controls.update();

  const t = performance.now() * 0.001;
  state.cables.forEach((c, i) => {
    c.mesh.material.emissiveIntensity = 0.25 + Math.sin(t * 3 + i) * 0.2;
    c.mesh.material.color.setHex(c.quality === 'bad' ? 0x6b1f2d : 0x28435f);
  });

  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
