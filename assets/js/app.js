(function () {
  'use strict';

  const hasWindow = typeof window !== 'undefined';
  const hasThreeGlobal = hasWindow && typeof window.THREE !== 'undefined';

  const COLORS = {
    background: 0x1a1a2e,
    ground: 0x1a1a2e,
    pc1: 0x5aa3ff,
    pc2: 0xff5aa3,
    attacker: 0xff0000,
    monitor: 0x666677,
    led: 0x00ff00,
    cable: 0x6688dd,
    wanCable: 0xff6600,
    packet: {
      request: 0xffff00,
      reply: 0x00ffaa,
      data: 0xff6600,
      attack: 0xff0000,
      broadcast: 0xff00ff,
    },
  };

  const ANIMATION = {
    packetSpeed: 0.01,
    packetArcHeight: 2,
    stepDelayBase: 1500,
  };

  const CAMERA = {
    moveSpeed: 0.5,
    scrollSpeed: 0.5,
    mouseSensitivity: 0.002,
    maxPitch: Math.PI / 2 - 0.1,
  };

  const DEVICES = {
    pc1: { id: 'pc1', type: 'PC', name: 'PC1', ip: '192.168.1.10', mac: '00:1A:2B:3C:4D:10', position: [-14, 0, -8] },
    pc2: { id: 'pc2', type: 'PC', name: 'PC2', ip: '192.168.1.20', mac: '00:1A:2B:3C:4D:20', position: [-14, 0, 8] },
    pc3: { id: 'pc3', type: 'PC', name: 'PC3', ip: '192.168.1.30', mac: '00:1A:2B:3C:4D:30', position: [-6, 0, 8] },
    printer: { id: 'printer', type: 'Printer', name: 'Printer1', ip: '192.168.1.100', mac: '00:1A:2B:3C:4D:99', position: [-6, 0, -8] },
    switch1: { id: 'switch1', type: 'Switch', name: 'Switch1', mac: 'FF:FF:FF:FF:FF:F1', position: [-10, 0, 0] },
    router1: { id: 'router1', type: 'Router', name: 'Router1', ip: '192.168.1.1', mac: '00:1A:2B:3C:4D:01', position: [-2, 0, 0] },
    router2: { id: 'router2', type: 'Router', name: 'Router2', ip: '192.168.2.1', mac: '00:1A:2B:3C:4D:02', position: [2, 0, 0] },
    switch2: { id: 'switch2', type: 'Switch', name: 'Switch2', mac: 'FF:FF:FF:FF:FF:F2', position: [10, 0, 0] },
    printer2: { id: 'printer2', type: 'Printer', name: 'Printer2', ip: '192.168.2.50', mac: '00:1A:2B:3C:4D:88', position: [14, 0, 0] },
    attacker: { id: 'attacker', type: 'PC', name: 'Attacker', ip: '192.168.1.66', mac: '00:DE:AD:BE:EF:66', position: [-10, 0, -8] },
    server: { id: 'server', type: 'Server', name: 'Server1', ip: '192.168.1.50', mac: '00:1A:2B:3C:4D:50', position: [-2, 0, -8] },
    newpc: { id: 'newpc', type: 'PC', name: 'New PC', ip: '0.0.0.0', mac: '00:1A:2B:3C:4D:99', position: [-10, 0, 8] },
  };

  const CONNECTIONS = [
    { from: 'pc1', to: 'switch1', scenarios: ['pc-to-pc', 'pc-to-printer', 'pc-to-gateway', 'pc-to-remote', 'arp-timeout', 'gratuitous-arp', 'arp-spoof'] },
    { from: 'pc2', to: 'switch1', scenarios: ['pc-to-pc', 'pc-to-printer', 'pc-to-gateway', 'pc-to-remote', 'arp-timeout', 'gratuitous-arp', 'arp-spoof'] },
    { from: 'pc3', to: 'switch1', scenarios: ['duplicate-ip'] },
    { from: 'printer', to: 'switch1', scenarios: ['pc-to-printer', 'pc-to-gateway', 'pc-to-remote', 'arp-timeout', 'gratuitous-arp', 'duplicate-ip', 'arp-spoof'] },
    { from: 'switch1', to: 'router1', scenarios: ['pc-to-pc', 'pc-to-printer', 'pc-to-gateway', 'pc-to-remote', 'arp-timeout', 'gratuitous-arp', 'duplicate-ip', 'arp-spoof', 'dhcp-arp'] },
    { from: 'router1', to: 'router2', isWAN: true, scenarios: ['pc-to-remote'] },
    { from: 'router2', to: 'switch2', scenarios: ['pc-to-remote'] },
    { from: 'switch2', to: 'printer2', scenarios: ['pc-to-remote'] },
    { from: 'attacker', to: 'switch1', scenarios: ['arp-spoof'] },
    { from: 'server', to: 'switch1', scenarios: ['arp-spoof'] },
    { from: 'newpc', to: 'switch1', scenarios: ['dhcp-arp'] },
  ];

  const SCENARIOS = {
    'pc-to-pc': {
      name: 'PC til PC (samme LAN)',
      source: 'pc1',
      target: 'pc2',
      targetIP: '192.168.1.20',
      devices: ['pc1', 'pc2', 'printer', 'switch1', 'router1'],
    },
    'pc-to-printer': {
      name: 'PC til Printer (samme LAN)',
      source: 'pc1',
      target: 'printer',
      targetIP: '192.168.1.100',
      devices: ['pc1', 'pc2', 'printer', 'switch1', 'router1'],
    },
    'pc-to-gateway': {
      name: 'PC til Gateway (Default Route)',
      source: 'pc1',
      target: 'router1',
      targetIP: '192.168.1.1',
      devices: ['pc1', 'pc2', 'printer', 'switch1', 'router1'],
    },
    'pc-to-remote': {
      name: 'PC til Remote Printer (andet LAN)',
      source: 'pc1',
      target: 'printer2',
      targetIP: '192.168.2.50',
      needsRouting: true,
      devices: ['pc1', 'pc2', 'printer', 'switch1', 'router1', 'router2', 'switch2', 'printer2'],
    },
    'arp-timeout': {
      name: 'ARP Cache Timeout',
      source: 'pc1',
      target: 'printer',
      targetIP: '192.168.1.100',
      devices: ['pc1', 'pc2', 'printer', 'switch1', 'router1'],
    },
    'gratuitous-arp': {
      name: 'Gratuitous ARP (IP ændring)',
      source: 'printer',
      target: null,
      devices: ['pc1', 'pc2', 'printer', 'switch1', 'router1'],
    },
    'duplicate-ip': {
      name: 'Duplicate IP Detection',
      source: 'pc3',
      target: 'printer',
      targetIP: '192.168.1.100',
      devices: ['pc3', 'printer', 'switch1', 'router1'],
    },
    'arp-spoof': {
      name: 'ARP Spoofing Attack',
      source: 'pc1',
      target: 'server',
      attacker: 'attacker',
      targetIP: '192.168.1.50',
      devices: ['pc1', 'pc2', 'attacker', 'server', 'printer', 'switch1', 'router1'],
    },
    'dhcp-arp': {
      name: 'DHCP + ARP (Ny enhed)',
      source: 'newpc',
      target: 'router1',
      devices: ['newpc', 'switch1', 'router1'],
    },
  };

  class DeviceBuilder {
    static createPC(name) {
      if (!hasThreeGlobal) return null;
      const group = new THREE.Group();
      const color = name === 'Attacker' ? COLORS.attacker : name === 'PC1' ? COLORS.pc1 : COLORS.pc2;

      const monitor = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1.5, 0.2),
        new THREE.MeshStandardMaterial({ color: COLORS.monitor, metalness: 0.7, roughness: 0.3 })
      );
      monitor.position.y = 1.2;
      monitor.castShadow = true;
      group.add(monitor);

      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 1.3),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 })
      );
      screen.position.set(0, 1.2, 0.11);
      group.add(screen);

      const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 1.4, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x555577, metalness: 0.5, roughness: 0.5 })
      );
      base.position.set(1.2, 0.5, 0);
      base.castShadow = true;
      group.add(base);

      const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 16, 16),
        new THREE.MeshStandardMaterial({ color: COLORS.led, emissive: COLORS.led, emissiveIntensity: 2 })
      );
      led.position.set(1.2, 1.2, 0.76);
      group.add(led);

      return group;
    }

    static createPrinter() {
      if (!hasThreeGlobal) return null;
      const group = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 1, 2),
        new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.2, roughness: 0.6 })
      );
      body.position.y = 0.5;
      body.castShadow = true;
      group.add(body);

      const tray = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.08, 1.6),
        new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.7 })
      );
      tray.position.set(0, 1.04, 0);
      group.add(tray);

      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.4, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.6, roughness: 0.4 })
      );
      panel.position.set(0, 0.8, 1.05);
      panel.rotation.x = -0.3;
      group.add(panel);

      const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 16, 16),
        new THREE.MeshStandardMaterial({ color: COLORS.led, emissive: COLORS.led, emissiveIntensity: 2 })
      );
      led.position.set(0.5, 0.85, 1.05);
      group.add(led);

      return group;
    }

    static createRouter() {
      if (!hasThreeGlobal) return null;
      const group = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.8, 1.6),
        new THREE.MeshStandardMaterial({ color: 0x3a4a5a, metalness: 0.7, roughness: 0.3 })
      );
      body.position.y = 0.4;
      body.castShadow = true;
      group.add(body);

      const frontPanel = new THREE.Mesh(
        new THREE.BoxGeometry(2.3, 0.5, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x2a3a4a, metalness: 0.8, roughness: 0.2 })
      );
      frontPanel.position.set(0, 0.4, 0.83);
      group.add(frontPanel);

      const ledColors = [0xff0000, 0xff8800, 0x00ff00, 0x00ff00];
      for (let i = 0; i < 4; i++) {
        const led = new THREE.Mesh(
          new THREE.SphereGeometry(0.04, 16, 16),
          new THREE.MeshStandardMaterial({ color: ledColors[i], emissive: ledColors[i], emissiveIntensity: 1.5 })
        );
        led.position.set(-0.6 + i * 0.4, 0.45, 0.85);
        group.add(led);
      }

      for (let i = 0; i < 2; i++) {
        const antennaBase = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.2),
          new THREE.MeshStandardMaterial({ color: 0x555566, metalness: 0.8, roughness: 0.2 })
        );
        antennaBase.position.set(-0.8 + i * 1.6, 0.9, 0);
        group.add(antennaBase);

        const antenna = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 2),
          new THREE.MeshStandardMaterial({ color: 0x666677, metalness: 0.9, roughness: 0.1 })
        );
        antenna.position.set(-0.8 + i * 1.6, 2, 0);
        antenna.castShadow = true;
        group.add(antenna);
      }

      return group;
    }

    static createSwitch() {
      if (!hasThreeGlobal) return null;
      const group = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.6, 2),
        new THREE.MeshStandardMaterial({ color: 0x2a3a4a, metalness: 0.8, roughness: 0.2 })
      );
      body.position.y = 0.3;
      body.castShadow = true;
      group.add(body);

      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(3.8, 0.4, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x1a2a3a, metalness: 0.9, roughness: 0.1 })
      );
      panel.position.set(0, 0.3, 1.03);
      group.add(panel);

      for (let i = 0; i < 5; i++) {
        const led = new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 16, 16),
          new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 1.5 })
        );
        led.position.set(-1.5 + i * 0.75, 0.35, 1.05);
        group.add(led);
      }

      return group;
    }

    static createServer() {
      if (!hasThreeGlobal) return null;
      const group = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2.5, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x2a2a3a, metalness: 0.8, roughness: 0.2 })
      );
      body.position.y = 1.25;
      body.castShadow = true;
      group.add(body);

      for (let i = 0; i < 3; i++) {
        const drive = new THREE.Mesh(
          new THREE.BoxGeometry(1.8, 0.4, 0.05),
          new THREE.MeshStandardMaterial({ color: 0x1a1a2a, metalness: 0.9, roughness: 0.1 })
        );
        drive.position.set(0, 0.5 + i * 0.6, 0.76);
        group.add(drive);

        const led = new THREE.Mesh(
          new THREE.SphereGeometry(0.04, 16, 16),
          new THREE.MeshStandardMaterial({ color: COLORS.led, emissive: COLORS.led, emissiveIntensity: 2 })
        );
        led.position.set(-0.7, 0.5 + i * 0.6, 0.78);
        group.add(led);
      }

      return group;
    }

    static create(device) {
      if (!hasThreeGlobal) return null;
      switch (device.type) {
      case 'PC': return this.createPC(device.name);
        case 'Printer': return this.createPrinter();
        case 'Router': return this.createRouter();
        case 'Switch': return this.createSwitch();
        case 'Server': return this.createServer();
        default: return new THREE.Group();
      }
    }
  }

  class LabelBuilder {
    static create(name, ip, mac, position, deviceId) {
      if (!hasThreeGlobal) return null;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 768;
      canvas.height = 512;

      context.fillStyle = 'rgba(0, 0, 0, 0.9)';
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.strokeStyle = '#5aa3ff';
      context.lineWidth = 8;
      context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

      context.font = 'bold 80px Arial';
      context.fillStyle = '#ffffff';
      context.textAlign = 'center';
      context.fillText(name, 384, 120);

      context.font = '56px monospace';
      context.fillStyle = '#66ff88';
      context.fillText(ip || 'N/A', 384, 240);

      context.font = '48px monospace';
      context.fillStyle = '#bb88ff';
      context.fillText(mac || '??:??:??:??:??:??', 384, 340);

      context.font = '32px Arial';
      context.fillStyle = '#888888';
      context.fillText('Klik for at skjule/vise', 384, 450);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(position[0], 5, position[2]);
      sprite.scale.set(5, 3.5, 1);
      sprite.renderOrder = 999;
      sprite.userData.deviceId = deviceId;
      sprite.visible = false;
      return sprite;
    }
  }

  class ScenarioStepGenerator {
    constructor(scenario, devices, addLog, setArpTables, createPacket, animatePrinting) {
      this.scenario = scenario;
      this.scenarioData = SCENARIOS[scenario];
      this.devices = devices;
      this.addLog = addLog;
      this.setArpTables = setArpTables;
      this.createPacket = createPacket;
      this.animatePrinting = animatePrinting;
    }

    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    setSafeArpEntry(deviceId, ip, mac) {
      if (!deviceId || !ip || !mac) return;
      this.setArpTables(prev => ({
        ...prev,
        [deviceId]: { ...(prev[deviceId] || {}), [ip]: mac },
      }));
    }

    generate() {
      const generators = {
        'gratuitous-arp': () => this.generateGratuitousArp(),
        'arp-timeout': () => this.generateArpTimeout(),
        'duplicate-ip': () => this.generateDuplicateIp(),
        'arp-spoof': () => this.generateArpSpoof(),
        'dhcp-arp': () => this.generateDhcpArp(),
        'pc-to-remote': () => this.generatePcToRemote(),
        'pc-to-printer': () => this.generatePcToPrinter(),
        'pc-to-gateway': () => this.generatePcToGateway(),
      };

      return generators[this.scenario] ? generators[this.scenario]() : this.generateBasicArp();
    }

    generateGratuitousArp() {
      const src = this.devices[this.scenarioData.source];
      return [
        {
          description: `${src.name} ændrer sin IP adresse`,
          relatedDevices: [src.id],
          action: async () => {
            this.addLog(src.name, 'IP Change', 'Ny IP: 192.168.1.111');
            await this.delay(1000);
          }
        },
        {
          description: 'Sender Gratuitous ARP (annoncerer ny IP)',
          relatedDevices: [src.id, 'switch1'],
          action: async () => {
            this.addLog(src.name, 'Gratuitous ARP', 'Broadcaster ny IP til alle');
            this.createPacket(src.id, 'switch1', 'broadcast');
            await this.delay(1200);
          }
        },
        {
          description: 'Switch broadcaster til alle enheder',
          relatedDevices: ['switch1', 'pc1', 'pc2', 'router1'],
          action: async () => {
            this.addLog('Switch1', 'Broadcast', 'Fortæller alle om ændring');
            ['pc1', 'pc2', 'router1'].forEach((id, idx) => {
              setTimeout(() => this.createPacket('switch1', id, 'broadcast'), idx * 200);
            });
            await this.delay(1500);
          }
        },
        {
          description: 'PC1 opdaterer sin ARP cache',
          relatedDevices: ['pc1'],
          action: async () => {
            this.addLog('PC1', 'ARP Update', 'Opdateret printer IP');
            this.setSafeArpEntry('pc1', '192.168.1.111', src.mac);
            await this.delay(800);
          }
        },
        {
          description: 'PC2 opdaterer sin ARP cache',
          relatedDevices: ['pc2'],
          action: async () => {
            this.addLog('PC2', 'ARP Update', 'Opdateret printer IP');
            this.setSafeArpEntry('pc2', '192.168.1.111', src.mac);
            await this.delay(800);
          }
        },
        {
          description: '✓ Alle enheder ved nu om ny IP',
          relatedDevices: [src.id, 'pc1', 'pc2', 'router1'],
          action: async () => {
            this.addLog(src.name, 'Complete', '✓ IP ændring succesfuld');
            await this.delay(500);
          }
        },
      ];
    }

    generateArpTimeout() {
      const src = this.devices[this.scenarioData.source];
      const tgt = this.devices[this.scenarioData.target];
      const steps = [
        {
          description: `${src.name} har gammel ARP cache entry`,
          relatedDevices: [src.id],
          action: async () => {
            this.addLog(src.name, 'Cache Check', 'Entry er 300+ sekunder gammel');
            this.setSafeArpEntry(src.id, this.scenarioData.targetIP, `${tgt.mac} (OLD)`);
            await this.delay(1000);
          }
        },
        {
          description: 'ARP entry timeout - slettes',
          relatedDevices: [src.id],
          action: async () => {
            this.addLog(src.name, 'Cache Timeout', 'Entry udløbet og fjernet');
            this.setArpTables(prev => ({ ...prev, [src.id]: {} }));
            await this.delay(1000);
          }
        },
      ];

      steps.push(...this.generateBasicArp());
      return steps;
    }

    generateDuplicateIp() {
      const src = this.devices[this.scenarioData.source];
      const tgt = this.devices[this.scenarioData.target];
      return [
        {
          description: `${src.name} tildeles IP ${this.scenarioData.targetIP}`,
          relatedDevices: [src.id],
          action: async () => {
            this.addLog(src.name, 'IP Config', `Sætter IP til ${this.scenarioData.targetIP}`);
            await this.delay(1000);
          }
        },
        {
          description: 'Sender Gratuitous ARP for at checke IP',
          relatedDevices: [src.id, 'switch1'],
          action: async () => {
            this.addLog(src.name, 'Gratuitous ARP', 'Er nogen på denne IP?');
            this.createPacket(src.id, 'switch1', 'request');
            await this.delay(1200);
          }
        },
        {
          description: 'Switch broadcaster forespørgsel',
          relatedDevices: ['switch1', tgt.id, 'router1'],
          action: async () => {
            this.addLog('Switch1', 'Broadcast', 'Checker netværk');
            [tgt.id, 'router1'].forEach((id, idx) => {
              setTimeout(() => this.createPacket('switch1', id, 'request'), idx * 150);
            });
            await this.delay(1500);
          }
        },
        {
          description: `⚠️ ${tgt.name} svarer - IP KONFLIKT!`,
          relatedDevices: [tgt.id, 'switch1'],
          action: async () => {
            this.addLog(tgt.name, 'ARP Reply', '⚠️ JEG har denne IP!');
            this.createPacket(tgt.id, 'switch1', 'reply');
            await this.delay(1200);
          }
        },
        {
          description: `${src.name} detekterer duplicate IP`,
          relatedDevices: [src.id],
          action: async () => {
            this.addLog(src.name, 'IP Conflict', '⚠️ IP allerede i brug!');
            await this.delay(1000);
          }
        },
        {
          description: `${src.name} deaktiverer netværk`,
          relatedDevices: [src.id],
          action: async () => {
            this.addLog(src.name, 'Network Down', '❌ Interface deaktiveret');
            await this.delay(1000);
          }
        },
        {
          description: '⚠️ IP konflikt - netværk utilgængeligt',
          relatedDevices: [src.id],
          action: async () => {
            this.addLog(src.name, 'Error', '⚠️ Kræver manuel fix');
            await this.delay(500);
          }
        },
      ];
    }

    generateArpSpoof() {
      const src = this.devices[this.scenarioData.source];
      const tgt = this.devices[this.scenarioData.target];
      const attacker = this.devices.attacker;
      return [
        {
          description: `${src.name} vil kommunikere med Server`,
          relatedDevices: [src.id],
          action: async () => {
            this.addLog(src.name, 'Connect', `Forbinder til ${this.scenarioData.targetIP}`);
            await this.delay(800);
          }
        },
        {
          description: 'Sender ARP Request for Server',
          relatedDevices: [src.id, 'switch1'],
          action: async () => {
            this.addLog(src.name, 'ARP Request', `Hvem har ${this.scenarioData.targetIP}?`);
            this.createPacket(src.id, 'switch1', 'request');
            await this.delay(1200);
          }
        },
        {
          description: 'Switch broadcaster til alle enheder',
          relatedDevices: ['switch1', 'attacker', tgt.id, 'pc2', 'printer', 'router1'],
          action: async () => {
            this.addLog('Switch1', 'Broadcast', 'Sender til alle porte');
            ['attacker', tgt.id, 'pc2', 'printer', 'router1'].filter(id => id !== src.id).forEach((id, idx) => {
              setTimeout(() => this.createPacket('switch1', id, 'request'), idx * 150);
            });
            await this.delay(1500);
          }
        },
        {
          description: `⚠️ ${attacker.name} sender FALSK ARP Reply først!`,
          relatedDevices: ['attacker', 'switch1'],
          action: async () => {
            this.addLog(attacker.name, 'ARP Spoof', '⚠️ JEG er serveren (løgn)');
            this.createPacket('attacker', 'switch1', 'attack');
            await this.delay(1200);
          }
        },
        {
          description: 'Switch videresender falsk reply',
          relatedDevices: ['switch1', src.id],
          action: async () => {
            this.addLog('Switch1', 'Forward', 'Til PC1');
            this.createPacket('switch1', src.id, 'attack');
            await this.delay(1200);
          }
        },
        {
          description: `${src.name} modtager FALSK MAC adresse`,
          relatedDevices: [src.id],
          action: async () => {
            this.addLog(src.name, 'ARP Update', '⚠️ Gemt attackers MAC');
            this.setSafeArpEntry(src.id, this.scenarioData.targetIP, `${attacker.mac} (FAKE)`);
            await this.delay(1000);
          }
        },
        {
          description: `${tgt.name} sender rigtig reply (for sent)`,
          relatedDevices: [tgt.id, 'switch1'],
          action: async () => {
            this.addLog(tgt.name, 'ARP Reply', 'Min rigtige MAC (ignoreret)');
            this.createPacket(tgt.id, 'switch1', 'reply');
            await this.delay(1200);
          }
        },
        {
          description: 'Switch videresender rigtig reply',
          relatedDevices: ['switch1', src.id],
          action: async () => {
            this.addLog('Switch1', 'Forward', 'Til PC1 (for sent)');
            this.createPacket('switch1', src.id, 'reply');
            await this.delay(1200);
          }
        },
        {
          description: `${src.name} sender data - går til Attacker!`,
          relatedDevices: [src.id, 'switch1', 'attacker'],
          action: async () => {
            this.addLog(src.name, 'Send Data', '⚠️ Sender til forkert MAC');
            this.createPacket(src.id, 'switch1', 'data');
            await this.delay(1000);
            this.createPacket('switch1', 'attacker', 'data');
            await this.delay(1200);
          }
        },
        {
          description: '⚠️ Attacker aflytter trafikken',
          relatedDevices: ['attacker'],
          action: async () => {
            this.addLog(attacker.name, 'Intercept', '⚠️ Data aflyttet!');
            await this.delay(1000);
          }
        },
        {
          description: 'Attacker videresender til rigtig Server',
          relatedDevices: ['attacker', 'switch1', 'server'],
          action: async () => {
            this.addLog(attacker.name, 'Forward', 'Sender videre (offer ved intet)');
            this.createPacket('attacker', 'switch1', 'data');
            await this.delay(1000);
            this.createPacket('switch1', 'server', 'data');
            await this.delay(1200);
          }
        },
        {
          description: '⚠️ Man-in-the-Middle attack succesfuld!',
          relatedDevices: ['attacker', src.id, 'server'],
          action: async () => {
            this.addLog(attacker.name, 'Attack Success', '⚠️ Træk data uden opdagelse');
            await this.delay(500);
          }
        },
      ];
    }

    generateDhcpArp() {
      const src = this.devices[this.scenarioData.source];
      const router = this.devices.router1;
      return [
        {
          description: `${src.name} joiner netværket`,
          relatedDevices: [src.id],
          action: async () => {
            this.addLog(src.name, 'Network Join', 'Ingen IP konfiguration');
            await this.delay(800);
          }
        },
        {
          description: 'Sender DHCP Discover (broadcast)',
          relatedDevices: [src.id, 'switch1'],
          action: async () => {
            this.addLog(src.name, 'DHCP Discover', 'Søger DHCP server');
            this.createPacket(src.id, 'switch1', 'broadcast');
            await this.delay(1200);
          }
        },
        {
          description: 'Switch videresender til Router (DHCP server)',
          relatedDevices: ['switch1', 'router1'],
          action: async () => {
            this.addLog('Switch1', 'Forward', 'Til DHCP server');
            this.createPacket('switch1', 'router1', 'broadcast');
            await this.delay(1200);
          }
        },
        {
          description: 'Router tilbyder IP adresse (DHCP Offer)',
          relatedDevices: ['router1', 'switch1'],
          action: async () => {
            this.addLog(router.name, 'DHCP Offer', 'Tilbyder 192.168.1.77');
            this.createPacket('router1', 'switch1', 'reply');
            await this.delay(1200);
          }
        },
        {
          description: 'Switch videresender offer',
          relatedDevices: ['switch1', src.id],
          action: async () => {
            this.addLog('Switch1', 'Forward', 'Til New PC');
            this.createPacket('switch1', src.id, 'reply');
            await this.delay(1200);
          }
        },
        {
          description: `${src.name} accepterer IP (DHCP Request)`,
          relatedDevices: [src.id, 'switch1'],
          action: async () => {
            this.addLog(src.name, 'DHCP Request', 'Accepterer 192.168.1.77');
            this.createPacket(src.id, 'switch1', 'request');
            await this.delay(1200);
          }
        },
        {
          description: 'Switch videresender request',
          relatedDevices: ['switch1', 'router1'],
          action: async () => {
            this.addLog('Switch1', 'Forward', 'Til Router');
            this.createPacket('switch1', 'router1', 'request');
            await this.delay(1200);
          }
        },
        {
          description: 'Router bekræfter (DHCP ACK)',
          relatedDevices: ['router1', 'switch1'],
          action: async () => {
            this.addLog(router.name, 'DHCP ACK', 'IP tildelt!');
            this.createPacket('router1', 'switch1', 'reply');
            await this.delay(1200);
          }
        },
        {
          description: 'Switch videresender ACK',
          relatedDevices: ['switch1', src.id],
          action: async () => {
            this.addLog('Switch1', 'Forward', 'Til New PC');
            this.createPacket('switch1', src.id, 'reply');
            await this.delay(1200);
          }
        },
        {
          description: `${src.name} checker IP med Gratuitous ARP`,
          relatedDevices: [src.id, 'switch1'],
          action: async () => {
            this.addLog(src.name, 'Gratuitous ARP', 'Er 192.168.1.77 ledig?');
            this.createPacket(src.id, 'switch1', 'request');
            await this.delay(1200);
          }
        },
        {
          description: 'Switch broadcaster check',
          relatedDevices: ['switch1', 'router1'],
          action: async () => {
            this.addLog('Switch1', 'Broadcast', 'Checker IP konflikt');
            this.createPacket('switch1', 'router1', 'request');
            await this.delay(1200);
          }
        },
        {
          description: 'Ingen svarer - IP er ledig!',
          relatedDevices: [src.id],
          action: async () => {
            this.addLog(src.name, 'IP Verified', '✓ Ingen konflikt');
            await this.delay(800);
          }
        },
        {
          description: `${src.name} aktiverer netværk`,
          relatedDevices: [src.id],
          action: async () => {
            this.addLog(src.name, 'Network Up', '✓ IP: 192.168.1.77');
            await this.delay(800);
          }
        },
        {
          description: '✓ DHCP + ARP proces komplet',
          relatedDevices: [src.id, 'switch1', 'router1'],
          action: async () => {
            this.addLog(src.name, 'Complete', '✓ Klar til netværk');
            await this.delay(500);
          }
        },
      ];
    }

    generatePcToRemote() {
      const src = this.devices[this.scenarioData.source];
      const tgt = this.devices[this.scenarioData.target];
      const steps = [
        {
          description: `${src.name} vil sende til ${this.scenarioData.targetIP}`,
          relatedDevices: [src.id],
          action: async () => {
            this.addLog(src.name, 'Route Check', `${this.scenarioData.targetIP} er ikke på mit subnet`);
            await this.delay(800);
          }
        },
        {
          description: `${src.name} skal bruge gateway`,
          relatedDevices: [src.id],
          action: async () => {
            this.addLog(src.name, 'Routing', 'Send til gateway');
            await this.delay(800);
          }
        },
      ];

      steps.push(...this.generateBasicArp());

      steps.push({
        description: `${src.name} sender data til Router1`,
        relatedDevices: [src.id, 'switch1', 'router1'],
        action: async () => {
          this.addLog(src.name, 'Send Data', 'Via gateway');
          this.createPacket(src.id, 'switch1', 'data');
          await this.delay(1000);
          this.createPacket('switch1', 'router1', 'data');
          await this.delay(1200);
        }
      });
      steps.push({
        description: 'Router1 router til Router2',
        relatedDevices: ['router1', 'router2'],
        action: async () => {
          this.addLog('Router1', 'Routing', 'Forward til LAN2');
          this.createPacket('router1', 'router2', 'data');
          await this.delay(1500);
        }
      });
      steps.push({
        description: 'Router2 sender til destination',
        relatedDevices: ['router2', 'switch2'],
        action: async () => {
          this.addLog('Router2', 'Forward', 'Til Printer2');
          this.createPacket('router2', 'switch2', 'data');
          await this.delay(1200);
        }
      });
      steps.push({
        description: 'Switch2 videresender',
        relatedDevices: ['switch2', tgt.id],
        action: async () => {
          this.addLog('Switch2', 'Forward', 'Til destination');
          this.createPacket('switch2', tgt.id, 'data');
          await this.delay(1500);
        }
      });
      steps.push({
        description: '✓ Cross-subnet kommunikation succesfuld',
        relatedDevices: [tgt.id],
        action: async () => {
          this.addLog(tgt.name, 'Complete', '✓ Data modtaget');
          await this.delay(500);
        }
      });

      return steps;
    }

    generatePcToPrinter() {
      const src = this.devices[this.scenarioData.source];
      const tgt = this.devices[this.scenarioData.target];
      const steps = this.generateBasicArp();

      steps.push({
        description: `${src.name} sender print job`,
        relatedDevices: [src.id, 'switch1', tgt.id],
        action: async () => {
          this.addLog(src.name, 'Send Data', 'Sender dokument');
          this.createPacket(src.id, 'switch1', 'data');
          await this.delay(1000);
          this.createPacket('switch1', tgt.id, 'data');
          await this.delay(1200);
        }
      });
      steps.push({
        description: 'Printer modtager og printer',
        relatedDevices: [tgt.id],
        action: async () => {
          this.addLog(tgt.name, 'Printing', '🖨️ Printer...');
          this.animatePrinting(tgt.id);
          await this.delay(2000);
        }
      });
      steps.push({
        description: '✓ Print job fuldført',
        relatedDevices: [tgt.id],
        action: async () => {
          this.addLog(tgt.name, 'Complete', '✓ Printet');
          await this.delay(500);
        }
      });

      return steps;
    }

    generatePcToGateway() {
      const steps = this.generateBasicArp();
      steps.push({
        description: '✓ Klar til routing',
        relatedDevices: [this.scenarioData.source],
        action: async () => {
          this.addLog(this.devices[this.scenarioData.source].name, 'Success', '✓ Kan route nu');
          await this.delay(500);
        }
      });
      return steps;
    }

    generateBasicArp() {
      const src = this.devices[this.scenarioData.source];
      const tgt = this.devices[this.scenarioData.target];
      if (!tgt) return [];

      return [
        {
          description: `${src.name} mangler MAC for ${this.scenarioData.targetIP}`,
          relatedDevices: [src.id],
          action: async () => {
            this.addLog(src.name, 'Cache Miss', 'Ingen entry');
            await this.delay(500);
          }
        },
        {
          description: `${src.name} sender ARP Request`,
          relatedDevices: [src.id, 'switch1'],
          action: async () => {
            this.addLog(src.name, 'ARP Request', `Hvem har ${this.scenarioData.targetIP}?`);
            this.createPacket(src.id, 'switch1', 'request');
            await this.delay(1200);
          }
        },
        {
          description: 'Switch1 broadcaster til alle porte',
          relatedDevices: ['switch1', 'pc2', 'printer', 'router1'],
          action: async () => {
            this.addLog('Switch1', 'Broadcast', 'Sender til alle');
            ['pc2', 'printer', 'router1'].filter(id => id !== src.id && id !== tgt.id).forEach((id, idx) => {
              setTimeout(() => this.createPacket('switch1', id, 'request'), idx * 150);
            });
            this.createPacket('switch1', tgt.id, 'request');
            await this.delay(1500);
          }
        },
        {
          description: `${tgt.name} sender ARP Reply`,
          relatedDevices: [tgt.id, 'switch1'],
          action: async () => {
            this.addLog(tgt.name, 'ARP Reply', 'Min MAC');
            this.createPacket(tgt.id, 'switch1', 'reply');
            await this.delay(1200);
          }
        },
        {
          description: 'Switch1 videresender reply',
          relatedDevices: ['switch1', src.id],
          action: async () => {
            this.addLog('Switch1', 'Forward', `Til ${src.name}`);
            this.createPacket('switch1', src.id, 'reply');
            await this.delay(1200);
          }
        },
        {
          description: `${src.name} opdaterer ARP tabel`,
          relatedDevices: [src.id],
          action: async () => {
            this.addLog(src.name, 'Update', 'MAC gemt');
            this.setSafeArpEntry(src.id, this.scenarioData.targetIP, tgt.mac);
            await this.delay(800);
          }
        },
        {
          description: '✓ ARP proces fuldført',
          relatedDevices: [src.id],
          action: async () => {
            this.addLog(src.name, 'Success', 'Klar');
            await this.delay(500);
          }
        },
      ];
    }
  }

  class ARPSimulator {
    constructor() {
      this.currentScenario = 'pc-to-pc';
      this.hasThree = hasThreeGlobal;
      this.is3DMode = this.hasThree;
      this.steps = [];
      this.currentStep = 0;
      this.isPlaying = false;
      this.speed = 1;
      this.eventLog = [];
      this.arpTables = {};
      this.switchPortTables = {};
      this.activeDevices = [];
      this.manuallyToggledLabels = {};
      this.showDeviceTables = {};

      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.deviceMeshes = {};
      this.labels = {};
      this.cables = [];
      this.packets = [];
      this.packets2D = [];
      this.raycaster = this.hasThree ? new THREE.Raycaster() : null;
      this.mouseVector = this.hasThree ? new THREE.Vector2() : { x: 0, y: 0 };
      this.mouseState = { isDragging: false, hasMoved: false, lastX: 0, lastY: 0, yaw: 0, pitch: 0 };

      this.isRunning = true;
    }

    init() {
      this.cacheDOM();
      this.populateScenarioSelect();
      this.populateTutorial();
      this.bindEvents();
      if (this.hasThree) {
        this.setupThreeScene();
        this.start3DLoop();
      }
      this.start2DLoop();
      this.updateMode();
      this.updateUI();
    }

    cacheDOM() {
      this.scenarioSelect = document.getElementById('scenario-select');
      this.modeSelect = document.getElementById('mode-select');
      this.resetBtn = document.getElementById('reset-btn');
      this.prepareBtn = document.getElementById('prepare-btn');
      this.nextBtn = document.getElementById('next-btn');
      this.autoplayBtn = document.getElementById('autoplay-btn');
      this.tutorialBtn = document.getElementById('tutorial-btn');
      this.lastEventEl = document.getElementById('last-event');
      this.stepCounterEl = document.getElementById('step-counter');
      this.threeContainer = document.getElementById('three-container');
      this.canvas2D = document.getElementById('canvas-2d');
      this.stepBanner = document.getElementById('step-banner');
      this.stepBannerText = this.stepBanner.querySelector('.step-text');
      this.deviceListEl = document.getElementById('device-list');
      this.eventLogEl = document.getElementById('event-log');
      this.sidebar = document.querySelector('.sidebar');
      this.toggleSidebarBtn = document.getElementById('toggle-sidebar');
      this.tutorialModal = document.getElementById('tutorial-modal');
      this.tutorialBody = document.getElementById('tutorial-body');
      this.closeTutorialBtn = document.getElementById('close-tutorial');

      if (!this.hasThree) {
        this.is3DMode = false;
        const option3d = this.modeSelect?.querySelector?.('option[value="3d"]');
        if (option3d) {
          option3d.textContent = '🎮 3D Mode (kræver Three.js)';
          option3d.disabled = true;
        }
        this.modeSelect.value = '2d';
      }
    }

    populateScenarioSelect() {
      Object.entries(SCENARIOS).forEach(([key, scenario]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = scenario.name;
        this.scenarioSelect.appendChild(option);
      });
      this.scenarioSelect.value = this.currentScenario;
    }

    populateTutorial() {
      if (this.tutorialBody.dataset.populated === 'true') return;
      this.tutorialBody.dataset.populated = 'true';
      const sections = [
        {
          title: '🔍 Hvad er ARP?',
          content: `<p><strong>ARP (Address Resolution Protocol)</strong> er en netværksprotokol der oversætter IP-adresser til MAC-adresser. Når en enhed vil kommunikere med en anden på det lokale netværk, kender den kun IP-adressen - men for at sende data på layer 2 (datalink), skal den bruge modtagerens MAC-adresse.</p>`,
        },
        {
          title: '💡 Hvorfor er ARP nødvendigt?',
          content: `<ul>
              <li><strong>Layer 3 (Network)</strong> bruger IP-adresser til routing mellem netværk</li>
              <li><strong>Layer 2 (Datalink)</strong> bruger MAC-adresser til kommunikation på samme netværk</li>
              <li>ARP er "broen" mellem disse to lag</li>
            </ul>`,
        },
        {
          title: '⚙️ Sådan virker ARP',
          content: `<ol>
              <li><strong>ARP Request (Broadcast)</strong> - Afsender spørger alle: "Hvem har IP?"</li>
              <li><strong>ARP Reply (Unicast)</strong> - Den rigtige enhed svarer med sin MAC</li>
              <li><strong>Cache Opdatering</strong> - Afsender gemmer MAC-adressen</li>
              <li><strong>Data Transmission</strong> - Trafik kan nu sendes direkte</li>
            </ol>`,
        },
        {
          title: '🗄️ ARP Cache',
          content: `<p>For at undgå unødvendige forespørgsler gemmer enheder ARP data i en cache, der typisk udløber efter 300 sekunder.</p>`,
        },
        {
          title: '📢 Gratuitous ARP',
          content: `<p>En speciel ARP forespørgsel hvor en enhed annoncerer sin egen IP/MAC kombination for at fortælle andre om ændringer eller checke for IP konflikter.</p>`,
        },
        {
          title: '⚠️ ARP Sikkerhed',
          content: `<p>ARP kan udnyttes til spoofing angreb. Beskyttelse inkluderer Dynamic ARP Inspection, port security og overvågning.</p>`,
        },
        {
          title: '🔌 Switch Port Table',
          content: `<p>Switches lærer hvilke MAC-adresser der er på hvilke porte ved at analysere trafikkens afsender adresser.</p>`,
        },
      ];

      sections.forEach(section => {
        const container = document.createElement('article');
        container.className = 'tutorial-section';
        const heading = document.createElement('h3');
        heading.textContent = section.title;
        const body = document.createElement('div');
        body.innerHTML = section.content;
        container.appendChild(heading);
        container.appendChild(body);
        this.tutorialBody.appendChild(container);
      });
    }

    bindEvents() {
      this.scenarioSelect.addEventListener('change', () => {
        this.currentScenario = this.scenarioSelect.value;
      });

      this.modeSelect.addEventListener('change', () => {
        if (!this.hasThree && this.modeSelect.value === '3d') {
          this.modeSelect.value = '2d';
          this.showThreeUnavailableNotice();
          return;
        }
        this.is3DMode = this.modeSelect.value === '3d';
        this.updateMode();
      });

      this.resetBtn.addEventListener('click', () => this.reset());
      this.prepareBtn.addEventListener('click', () => this.prepareScenario());
      this.nextBtn.addEventListener('click', () => this.nextStep());
      this.autoplayBtn.addEventListener('click', () => this.autoPlay());
      this.tutorialBtn.addEventListener('click', () => this.showTutorial(true));
      this.closeTutorialBtn.addEventListener('click', () => this.showTutorial(false));
      this.tutorialModal.addEventListener('click', (event) => {
        if (event.target === this.tutorialModal || event.target.classList.contains('modal-backdrop')) {
          this.showTutorial(false);
        }
      });

      this.toggleSidebarBtn.addEventListener('click', () => {
        const collapsed = this.sidebar.classList.toggle('collapsed');
        this.toggleSidebarBtn.textContent = collapsed ? '←' : '→';
        this.toggleSidebarBtn.title = collapsed ? 'Vis sidebar' : 'Skjul sidebar';
      });

      if (this.hasThree) {
        const canvas = this.threeContainer;
        canvas.addEventListener('mousedown', (event) => this.onMouseDown(event));
        canvas.addEventListener('mousemove', (event) => this.onMouseMove(event));
        canvas.addEventListener('mouseup', () => this.onMouseUp());
        canvas.addEventListener('mouseleave', () => this.onMouseUp());
        canvas.addEventListener('wheel', (event) => this.onMouseWheel(event), { passive: false });
        canvas.addEventListener('click', (event) => this.onCanvasClick(event));
        window.addEventListener('keydown', (event) => this.onKeyDown(event));
        window.addEventListener('resize', () => this.onResize());
      }
    }

    setupThreeScene() {
      if (!this.hasThree) return;
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(COLORS.background);

      const width = this.threeContainer.clientWidth || window.innerWidth;
      const height = this.threeContainer.clientHeight || window.innerHeight;
      this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
      this.camera.position.set(0, 12, 20);
      const lookAtPoint = new THREE.Vector3(0, 0, 0);
      const direction = lookAtPoint.clone().sub(this.camera.position).normalize();
      this.mouseState.yaw = Math.atan2(direction.x, direction.z);
      this.mouseState.pitch = Math.asin(-direction.y);
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.mouseState.yaw;
      this.camera.rotation.x = this.mouseState.pitch;

      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(width, height);
      this.renderer.shadowMap.enabled = true;
      this.threeContainer.appendChild(this.renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      this.scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
      mainLight.position.set(15, 25, 15);
      mainLight.castShadow = true;
      this.scene.add(mainLight);

      const fillLight = new THREE.DirectionalLight(0x6699ff, 0.4);
      fillLight.position.set(-10, 15, -10);
      this.scene.add(fillLight);

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(60, 60),
        new THREE.MeshStandardMaterial({ color: COLORS.ground, roughness: 0.9, metalness: 0.1 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      this.scene.add(ground);
    }

    start3DLoop() {
      if (!this.hasThree) return;
      const animate = () => {
        if (!this.isRunning) return;
        requestAnimationFrame(animate);
        this.updatePackets3D();
        if (this.is3DMode) {
          this.renderer.render(this.scene, this.camera);
        }
      };
      animate();
    }

    start2DLoop() {
      const context = this.canvas2D.getContext('2d');
      const render2D = () => {
        if (!this.isRunning) return;
        requestAnimationFrame(render2D);
        if (!this.is3DMode) {
          this.draw2DScene(context);
        }
      };
      render2D();
    }

    draw2DScene(ctx) {
      const canvas = this.canvas2D;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scenario = SCENARIOS[this.currentScenario];
      if (!scenario) return;

      const scale = 20;
      const offsetX = canvas.width / 2;
      const offsetY = canvas.height / 2;

      CONNECTIONS.forEach(conn => {
        if (!scenario.devices.includes(conn.from) || !scenario.devices.includes(conn.to)) return;
        if (!conn.scenarios.includes(this.currentScenario)) return;
        const from = DEVICES[conn.from];
        const to = DEVICES[conn.to];
        ctx.strokeStyle = conn.isWAN ? '#ff6600' : '#6688dd';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(offsetX + from.position[0] * scale, offsetY + from.position[2] * scale);
        ctx.lineTo(offsetX + to.position[0] * scale, offsetY + to.position[2] * scale);
        ctx.stroke();
      });

      scenario.devices.forEach(deviceId => {
        const device = DEVICES[deviceId];
        const x = offsetX + device.position[0] * scale;
        const y = offsetY + device.position[2] * scale;
        const isActive = this.activeDevices.includes(deviceId);

        ctx.save();
        if (device.type === 'PC') {
          ctx.fillStyle = isActive ? '#5aa3ff' : '#444466';
          ctx.strokeStyle = isActive ? '#66ff88' : '#666688';
          ctx.lineWidth = 2;
          ctx.fillRect(x - 15, y - 15, 30, 30);
          ctx.strokeRect(x - 15, y - 15, 30, 30);
        } else if (device.type === 'Router') {
          ctx.beginPath();
          ctx.fillStyle = isActive ? '#5aa3ff' : '#444466';
          ctx.strokeStyle = isActive ? '#66ff88' : '#666688';
          ctx.lineWidth = 2;
          ctx.arc(x, y, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (device.type === 'Switch') {
          ctx.fillStyle = isActive ? '#5aa3ff' : '#444466';
          ctx.strokeStyle = isActive ? '#66ff88' : '#666688';
          ctx.lineWidth = 2;
          ctx.fillRect(x - 20, y - 10, 40, 20);
          ctx.strokeRect(x - 20, y - 10, 40, 20);
        } else {
          ctx.beginPath();
          ctx.fillStyle = isActive ? '#5aa3ff' : '#444466';
          ctx.strokeStyle = isActive ? '#66ff88' : '#666688';
          ctx.moveTo(x, y - 15);
          ctx.lineTo(x + 15, y + 15);
          ctx.lineTo(x - 15, y + 15);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(device.name, x, y + 38);
        ctx.fillStyle = isActive ? '#66ff88' : '#9ca3af';
        ctx.font = '13px monospace';
        ctx.fillText(device.ip || 'N/A', x, y + 54);
        ctx.restore();
      });

      const colorMap = {
        request: '#ffff00',
        reply: '#00ffaa',
        data: '#ff6600',
        attack: '#ff0000',
        broadcast: '#ff00ff',
      };

      this.packets2D.forEach(packet => {
        if (!packet.animating) return;
        packet.progress += ANIMATION.packetSpeed * this.speed;
        if (packet.progress >= 1) {
          packet.animating = false;
        } else {
          const t = packet.progress;
          const x = packet.startX + (packet.endX - packet.startX) * t;
          const y = packet.startY + (packet.endY - packet.startY) * t;
          ctx.fillStyle = colorMap[packet.type] || '#ffffff';
          ctx.beginPath();
          ctx.arc(offsetX + x * scale, offsetY + y * scale, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      this.packets2D = this.packets2D.filter(packet => packet.animating);
    }

    updateMode() {
      if (this.is3DMode && this.hasThree) {
        this.canvas2D.style.display = 'none';
        this.threeContainer.style.display = 'block';
        this.threeContainer.style.pointerEvents = 'auto';
        this.hideThreeUnavailableNotice();
      } else {
        this.canvas2D.style.display = 'block';
        this.threeContainer.style.display = this.hasThree ? 'none' : 'block';
        this.threeContainer.style.pointerEvents = 'none';
        if (!this.hasThree) {
          this.showThreeUnavailableNotice();
        } else {
          this.hideThreeUnavailableNotice();
        }
      }
      this.clearPackets();
    }

    updateUI() {
      this.stepCounterEl.textContent = `Step ${this.currentStep} / ${this.steps.length}`;
      this.renderEventLog();
      this.renderDeviceList();
      if (this.currentStepDescription) {
        this.stepBanner.classList.remove('hidden');
        this.stepBannerText.textContent = this.currentStepDescription;
      } else {
        this.stepBanner.classList.add('hidden');
      }
      this.nextBtn.disabled = this.currentStep >= this.steps.length;
      this.autoplayBtn.disabled = this.currentStep >= this.steps.length || this.isPlaying;
      this.prepareBtn.disabled = this.steps.length > 0 && this.currentStep < this.steps.length;
      this.modeSelect.disabled = (this.steps.length > 0 && this.currentStep < this.steps.length) || !this.hasThree;
      this.scenarioSelect.disabled = this.steps.length > 0 && this.currentStep < this.steps.length;
      if (this.eventLog.length > 0) {
        const last = this.eventLog[this.eventLog.length - 1];
        this.lastEventEl.innerHTML = `<strong>${last.device}</strong> • <span>${last.event}</span>`;
      } else {
        this.lastEventEl.textContent = '';
      }
    }

    renderEventLog() {
      this.eventLogEl.innerHTML = '';
      if (this.eventLog.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'event-entry';
        empty.innerHTML = '<p class="event-details">Ingen events endnu. Tryk "Forbered" for at starte.</p>';
        this.eventLogEl.appendChild(empty);
        return;
      }

      [...this.eventLog].reverse().forEach(entry => {
        const card = document.createElement('article');
        card.className = 'event-entry';
        card.innerHTML = `
          <div class="event-header">
            <span>${entry.timestamp}</span>
            <span class="event-device">${entry.device}</span>
          </div>
          <div class="event-title">${entry.event}</div>
          <div class="event-details">${entry.details}</div>
        `;
        this.eventLogEl.appendChild(card);
      });
    }

    renderDeviceList() {
      const scenario = SCENARIOS[this.currentScenario];
      this.deviceListEl.innerHTML = '';
      if (!scenario) return;

      scenario.devices.forEach(deviceId => {
        const device = DEVICES[deviceId];
        if (!device) return;
        const card = document.createElement('div');
        card.className = 'device-card';
        const header = document.createElement('div');
        header.className = 'device-card-header';
        const name = document.createElement('div');
        name.className = 'device-name';
        name.textContent = device.name;
        header.appendChild(name);

        const isSwitch = device.type === 'Switch';
        const tableData = isSwitch ? this.switchPortTables[device.id] : this.arpTables[device.id];
        if (tableData && Object.keys(tableData).length > 0) {
          const toggle = document.createElement('button');
          toggle.className = 'table-toggle';
          toggle.textContent = this.showDeviceTables[device.id] ? '📋' : '📄';
          toggle.title = isSwitch ? 'Toggle Port Table' : 'Toggle ARP Cache';
          toggle.addEventListener('click', () => {
            this.showDeviceTables[device.id] = !this.showDeviceTables[device.id];
            this.renderDeviceList();
          });
          header.appendChild(toggle);
        }

        card.appendChild(header);

        const meta = document.createElement('div');
        meta.className = 'device-meta';
        if (device.ip) {
          const ip = document.createElement('div');
          ip.innerHTML = `<span>IP:</span> <span>${device.ip}</span>`;
          meta.appendChild(ip);
        }
        const mac = document.createElement('div');
        mac.innerHTML = `<span>MAC:</span> <span>${device.mac}</span>`;
        meta.appendChild(mac);
        card.appendChild(meta);

        if (this.showDeviceTables[device.id] && tableData) {
          const tableContainer = document.createElement('div');
          tableContainer.className = 'table-data';
          Object.entries(tableData).forEach(([key, value]) => {
            const row = document.createElement('div');
            row.innerHTML = `<span>${key}</span> <span style="color:#9ca3af">→</span> <span>${value}</span>`;
            tableContainer.appendChild(row);
          });
          card.appendChild(tableContainer);
        }

        this.deviceListEl.appendChild(card);
      });
    }

    addLog(device, event, details) {
      const timestamp = new Date().toLocaleTimeString('da-DK');
      this.eventLog.push({ timestamp, device, event, details });
      this.updateUI();
    }

    clearScene() {
      if (!this.scene || !this.hasThree) {
        this.deviceMeshes = {};
        this.labels = {};
        this.cables = [];
        return;
      }
      Object.values(this.deviceMeshes).forEach(mesh => {
        if (!mesh) return;
        mesh.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
        this.scene.remove(mesh);
      });

      Object.values(this.labels).forEach(label => {
        if (!label) return;
        if (label.material && label.material.map) {
          label.material.map.dispose();
        }
        if (label.material) label.material.dispose();
        this.scene.remove(label);
      });

      this.cables.forEach(cable => {
        if (cable.geometry) cable.geometry.dispose();
        if (cable.material) cable.material.dispose();
        this.scene.remove(cable);
      });

      this.deviceMeshes = {};
      this.labels = {};
      this.cables = [];
    }

    createDevices(scenarioKey) {
      if (!this.hasThree) return;
      this.clearScene();
      const scenario = SCENARIOS[scenarioKey];
      if (!scenario) return;

      scenario.devices.forEach(deviceId => {
        const device = DEVICES[deviceId];
        if (!device) return;
        const mesh = DeviceBuilder.create(device);
        if (!mesh) return;
        mesh.position.set(...device.position);
        mesh.userData.deviceId = device.id;
        this.scene.add(mesh);
        this.deviceMeshes[device.id] = mesh;

        const label = LabelBuilder.create(device.name, device.ip, device.mac, device.position, device.id);
        if (label) {
          this.scene.add(label);
          this.labels[device.id] = label;
        }
      });

      CONNECTIONS.forEach(conn => {
        if (!conn.scenarios.includes(scenarioKey)) return;
        if (!scenario.devices.includes(conn.from) || !scenario.devices.includes(conn.to)) return;
        const from = DEVICES[conn.from];
        const to = DEVICES[conn.to];
        if (!from || !to) return;
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(from.position[0], 0.3, from.position[2]),
          new THREE.Vector3((from.position[0] + to.position[0]) / 2, 2, (from.position[2] + to.position[2]) / 2),
          new THREE.Vector3(to.position[0], 0.3, to.position[2])
        );
        const tubeGeometry = new THREE.TubeGeometry(curve, 50, 0.12, 8, false);
        const cableColor = conn.isWAN ? COLORS.wanCable : COLORS.cable;
        const tube = new THREE.Mesh(tubeGeometry, new THREE.MeshStandardMaterial({ color: cableColor, metalness: 0.4, roughness: 0.6 }));
        tube.castShadow = true;
        this.scene.add(tube);
        this.cables.push(tube);
      });
    }

    createPacket(fromId, toId, type) {
      const fromDevice = DEVICES[fromId];
      const toDevice = DEVICES[toId];
      if (!fromDevice || !toDevice) return;

      if (fromDevice.type === 'Switch' || toDevice.type === 'Switch') {
        const switchId = fromDevice.type === 'Switch' ? fromId : toId;
        const otherDeviceId = fromDevice.type === 'Switch' ? toId : fromId;
        const otherDevice = DEVICES[otherDeviceId];
        if (otherDevice && otherDevice.mac) {
          this.switchPortTables[switchId] = {
            ...(this.switchPortTables[switchId] || {}),
            [otherDevice.mac]: otherDeviceId,
          };
        }
      }

      if (this.is3DMode && this.hasThree) {
        const geometry = new THREE.SphereGeometry(0.4, 32, 32);
        const color = COLORS.packet[type] || 0xffffff;
        const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8, metalness: 0.4, roughness: 0.3 });
        const packet = new THREE.Mesh(geometry, material);
        const startPos = new THREE.Vector3(...fromDevice.position);
        const endPos = new THREE.Vector3(...toDevice.position);
        packet.position.copy(startPos);
        packet.userData = { animating: true, progress: 0, startPos, endPos, type };
        this.scene.add(packet);
        this.packets.push(packet);
      } else {
        this.packets2D.push({
          animating: true,
          progress: 0,
          startX: fromDevice.position[0],
          startY: fromDevice.position[2],
          endX: toDevice.position[0],
          endY: toDevice.position[2],
          type,
        });
      }
      this.updateUI();
    }

    animatePrinting(printerId) {
      const printer = DEVICES[printerId];
      if (!printer || !this.is3DMode || !this.scene || !this.hasThree) return;
      const paper = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 1.2),
        new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, metalness: 0.1, roughness: 0.9 })
      );
      paper.position.set(printer.position[0], 0.5, printer.position[2] + 1.2);
      paper.rotation.x = Math.PI / 2;
      this.scene.add(paper);

      let progress = 0;
      const animatePaper = () => {
        progress += 0.02;
        if (progress < 1) {
          paper.position.z += 0.02;
          paper.position.y = 0.5 + progress * 0.3;
          requestAnimationFrame(animatePaper);
        } else {
          setTimeout(() => {
            if (paper.geometry) paper.geometry.dispose();
            if (paper.material) paper.material.dispose();
            this.scene.remove(paper);
          }, 1000);
        }
      };
      animatePaper();
    }

    updatePackets3D() {
      this.packets.forEach(packet => {
        if (!packet.userData.animating) return;
        packet.userData.progress += ANIMATION.packetSpeed * this.speed;
        if (packet.userData.progress >= 1) {
          packet.userData.animating = false;
          setTimeout(() => {
            if (packet.geometry) packet.geometry.dispose();
            if (packet.material) packet.material.dispose();
            this.scene.remove(packet);
            this.packets = this.packets.filter(p => p !== packet);
          }, 500);
        }
        const t = Math.min(packet.userData.progress, 1);
        packet.position.lerpVectors(packet.userData.startPos, packet.userData.endPos, t);
        packet.position.y = packet.userData.startPos.y + Math.sin(t * Math.PI) * ANIMATION.packetArcHeight;
      });
    }

    clearPackets() {
      if (this.hasThree && this.scene) {
        this.packets.forEach(packet => {
          if (packet.geometry) packet.geometry.dispose();
          if (packet.material) packet.material.dispose();
          this.scene.remove(packet);
        });
      }
      this.packets = [];
      this.packets2D = [];
    }

    onMouseDown(event) {
      this.mouseState.isDragging = true;
      this.mouseState.hasMoved = false;
      this.mouseState.lastX = event.clientX;
      this.mouseState.lastY = event.clientY;
    }

    onMouseMove(event) {
      if (!this.mouseState.isDragging) return;
      const deltaX = event.clientX - this.mouseState.lastX;
      const deltaY = event.clientY - this.mouseState.lastY;
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        this.mouseState.hasMoved = true;
      }
      this.mouseState.yaw -= deltaX * CAMERA.mouseSensitivity;
      this.mouseState.pitch -= deltaY * CAMERA.mouseSensitivity;
      this.mouseState.pitch = Math.max(-CAMERA.maxPitch, Math.min(CAMERA.maxPitch, this.mouseState.pitch));
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.mouseState.yaw;
      this.camera.rotation.x = this.mouseState.pitch;
      this.mouseState.lastX = event.clientX;
      this.mouseState.lastY = event.clientY;
    }

    onMouseUp() {
      this.mouseState.isDragging = false;
    }

    onMouseWheel(event) {
      event.preventDefault();
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
      this.camera.position.addScaledVector(forward, -event.deltaY * CAMERA.scrollSpeed * 0.01);
    }

    onCanvasClick(event) {
      if (this.mouseState.hasMoved) return;
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouseVector.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseVector.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouseVector, this.camera);
      const intersects = this.raycaster.intersectObjects(Object.values(this.deviceMeshes), true);
      if (intersects.length > 0) {
        let object = intersects[0].object;
        while (object.parent && !object.userData.deviceId) {
          object = object.parent;
        }
        if (object.userData.deviceId) {
          const deviceId = object.userData.deviceId;
          const current = this.manuallyToggledLabels[deviceId];
          this.manuallyToggledLabels[deviceId] = current === false ? true : !current;
          this.updateLabelsVisibility();
        }
      }
    }

    onKeyDown(event) {
      const key = event.key.toLowerCase();
      if (!['w', 'a', 's', 'd', ' ', 'shift'].includes(key)) return;
      event.preventDefault();
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
      const up = new THREE.Vector3(0, 1, 0);
      forward.y = 0;
      forward.normalize();
      right.y = 0;
      right.normalize();
      switch (key) {
        case 'w': this.camera.position.addScaledVector(forward, CAMERA.moveSpeed); break;
        case 's': this.camera.position.addScaledVector(forward, -CAMERA.moveSpeed); break;
        case 'a': this.camera.position.addScaledVector(right, -CAMERA.moveSpeed); break;
        case 'd': this.camera.position.addScaledVector(right, CAMERA.moveSpeed); break;
        case ' ': this.camera.position.addScaledVector(up, CAMERA.moveSpeed); break;
        case 'shift': this.camera.position.addScaledVector(up, -CAMERA.moveSpeed); break;
        default: break;
      }
    }

    onResize() {
      if (!this.renderer || !this.camera) return;
      const width = this.threeContainer.clientWidth || window.innerWidth;
      const height = this.threeContainer.clientHeight || window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }

    updateLabelsVisibility() {
      Object.entries(this.labels).forEach(([deviceId, label]) => {
        if (!label) return;
        const manual = this.manuallyToggledLabels[deviceId];
        const isActive = this.activeDevices.includes(deviceId);
        if (manual === true) {
          label.visible = true;
        } else if (manual === false) {
          label.visible = false;
        } else {
          label.visible = isActive;
        }
      });
    }

    setArpTables(updater) {
      this.arpTables = typeof updater === 'function' ? updater(this.arpTables) : updater;
      this.updateUI();
    }

    prepareScenario() {
      this.reset(false);
      this.eventLog = [];
      if (this.is3DMode && this.hasThree) {
        this.createDevices(this.currentScenario);
      }
      const generator = new ScenarioStepGenerator(
        this.currentScenario,
        DEVICES,
        (device, event, details) => this.addLog(device, event, details),
        (updater) => this.setArpTables(updater),
        (from, to, type) => this.createPacket(from, to, type),
        (printerId) => this.animatePrinting(printerId)
      );
      this.steps = generator.generate();
      this.currentStep = 0;
      this.currentStepDescription = '';
      const visibleDevices = (SCENARIOS[this.currentScenario]?.devices || []).filter(id => DEVICES[id]?.type !== 'Switch');
      this.activeDevices = visibleDevices;
      this.updateLabelsVisibility();
      this.updateUI();
    }

    async nextStep() {
      if (this.currentStep >= this.steps.length) return;
      const step = this.steps[this.currentStep];
      this.currentStepDescription = step.description;
      this.activeDevices = step.relatedDevices || [];
      this.updateLabelsVisibility();
      this.updateUI();
      await step.action();
      this.currentStep += 1;
      if (this.currentStep >= this.steps.length) {
        this.currentStepDescription = '✓ Scenarie fuldført';
      }
      this.updateUI();
    }

    async autoPlay() {
      if (this.isPlaying) return;
      this.isPlaying = true;
      this.autoplayBtn.disabled = true;
      while (this.currentStep < this.steps.length && this.isPlaying) {
        await this.nextStep();
        await new Promise(resolve => setTimeout(resolve, ANIMATION.stepDelayBase / this.speed));
      }
      this.isPlaying = false;
      this.updateUI();
    }

    reset(clearEventLog = true) {
      if (this.isPlaying) {
        this.isPlaying = false;
      }
      this.steps = [];
      this.currentStep = 0;
      this.currentStepDescription = '';
      this.activeDevices = [];
      this.manuallyToggledLabels = {};
      this.showDeviceTables = {};
      this.arpTables = {};
      this.switchPortTables = {};
      if (clearEventLog) {
        this.eventLog = [];
      }
      this.clearPackets();
      this.clearScene();
      this.updateLabelsVisibility();
      if (this.hasThree && this.camera) {
        this.camera.position.set(0, 12, 20);
        this.mouseState.yaw = 0;
        this.mouseState.pitch = -Math.PI / 6;
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.mouseState.yaw;
        this.camera.rotation.x = this.mouseState.pitch;
      }
      this.updateUI();
    }

    showTutorial(show) {
      if (show) {
        this.tutorialModal.classList.remove('hidden');
      } else {
        this.tutorialModal.classList.add('hidden');
      }
    }

    showThreeUnavailableNotice() {
      if (this.hasThree) return;
      if (!this.threeUnavailableNotice) {
        const notice = document.createElement('div');
        notice.className = 'three-unavailable-notice';
        notice.innerHTML = '<strong>3D visning utilgængelig.</strong><span>Three.js kunne ikke indlæses, så simulatoren kører i 2D.</span><span>Kontrollér internetforbindelsen eller host en lokal kopi af three.min.js for at aktivere 3D.</span>';
        this.threeContainer.appendChild(notice);
        this.threeUnavailableNotice = notice;
      }
      if (this.threeUnavailableNotice) {
        this.threeUnavailableNotice.classList.remove('hidden');
      }
    }

    hideThreeUnavailableNotice() {
      if (this.threeUnavailableNotice) {
        this.threeUnavailableNotice.classList.add('hidden');
      }
    }
  }

  const bootstrap = () => {
    const simulator = new ARPSimulator();
    simulator.init();
    if (!simulator.hasThree) {
      simulator.showThreeUnavailableNotice();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
