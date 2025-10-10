import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';

const ARPSimulation = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef(null);
  const deviceMeshesRef = useRef({});
  const labelsRef = useRef({});
  const cablesRef = useRef([]);
  const packetsRef = useRef([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mousePositionRef = useRef(new THREE.Vector2());

  const mouseRef = useRef({
    isDragging: false,
    hasMoved: false,
    lastX: 0,
    lastY: 0,
    yaw: 0,
    pitch: 0,
  });

  const [allDevices] = useState({
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
  });

  const [allConnections] = useState([
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
  ]);

  const [arpTables, setArpTables] = useState({});
  const [scenario, setScenario] = useState('pc-to-pc');
  const [eventLog, setEventLog] = useState([]);
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [manuallyToggledLabels, setManuallyToggledLabels] = useState({});
  const [currentStepDescription, setCurrentStepDescription] = useState('');
  const [activeDevices, setActiveDevices] = useState([]);
  const scenarios = useMemo(
    () => ({
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
    }),
    []
  );

  const deviceMap = useMemo(
    () =>
      Object.values(allDevices).reduce((map, device) => {
        map[device.id] = device;
        return map;
      }, {}),
    [allDevices]
  );
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 20, 20);

    const lookAtPoint = new THREE.Vector3(0, 0, 0);
    const direction = lookAtPoint.clone().sub(camera.position).normalize();
    mouseRef.current.yaw = Math.atan2(direction.x, direction.z);
    mouseRef.current.pitch = Math.asin(-direction.y);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = mouseRef.current.yaw;
    camera.rotation.x = mouseRef.current.pitch;

    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(15, 25, 15);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x6699ff, 0.4);
    fillLight.position.set(-10, 15, -10);
    scene.add(fillLight);

    const groundGeometry = new THREE.PlaneGeometry(60, 60);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.9, metalness: 0.1 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    const canvas = renderer.domElement;

    const onClick = (e) => {
      if (mouseRef.current.hasMoved) return;

      const rect = canvas.getBoundingClientRect();
      mousePositionRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mousePositionRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mousePositionRef.current, camera);
      const clickableObjects = Object.values(deviceMeshesRef.current);
      const intersects = raycasterRef.current.intersectObjects(clickableObjects, true);

      if (intersects.length > 0) {
        let object = intersects[0].object;
        while (object.parent && !object.userData.deviceId) {
          object = object.parent;
        }
        if (object.userData.deviceId) {
          const deviceId = object.userData.deviceId;
          setManuallyToggledLabels((prev) => ({
            ...prev,
            [deviceId]: prev[deviceId] === false ? true : false,
          }));
        }
      }
    };

    const onMouseDown = (e) => {
      mouseRef.current.isDragging = true;
      mouseRef.current.hasMoved = false;
      mouseRef.current.lastX = e.clientX;
      mouseRef.current.lastY = e.clientY;
    };

    const onMouseMove = (e) => {
      if (!mouseRef.current.isDragging) return;

      const deltaX = e.clientX - mouseRef.current.lastX;
      const deltaY = e.clientY - mouseRef.current.lastY;

      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        mouseRef.current.hasMoved = true;
      }

      const sensitivity = 0.002;

      mouseRef.current.yaw -= deltaX * sensitivity;
      mouseRef.current.pitch -= deltaY * sensitivity;

      const maxPitch = Math.PI / 2 - 0.1;
      mouseRef.current.pitch = Math.max(-maxPitch, Math.min(maxPitch, mouseRef.current.pitch));

      camera.rotation.order = 'YXZ';
      camera.rotation.y = mouseRef.current.yaw;
      camera.rotation.x = mouseRef.current.pitch;

      mouseRef.current.lastX = e.clientX;
      mouseRef.current.lastY = e.clientY;
    };

    const onMouseUp = () => {
      mouseRef.current.isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const scrollSpeed = 0.5;
      camera.position.addScaledVector(forward, -e.deltaY * scrollSpeed * 0.01);
    };

    canvas.addEventListener('click', onClick);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    const onKeyDown = (e) => {
      const moveSpeed = 0.5;
      const camera = cameraRef.current;
      if (!camera) return;

      const key = e.key.toLowerCase();
      if (!['w', 'a', 's', 'd', ' ', 'shift'].includes(key)) return;

      e.preventDefault();

      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      const up = new THREE.Vector3(0, 1, 0);

      forward.y = 0;
      forward.normalize();
      right.y = 0;
      right.normalize();

      switch (key) {
        case 'w':
          camera.position.addScaledVector(forward, moveSpeed);
          break;
        case 's':
          camera.position.addScaledVector(forward, -moveSpeed);
          break;
        case 'a':
          camera.position.addScaledVector(right, -moveSpeed);
          break;
        case 'd':
          camera.position.addScaledVector(right, moveSpeed);
          break;
        case ' ':
          camera.position.addScaledVector(up, moveSpeed);
          break;
        case 'shift':
          camera.position.addScaledVector(up, -moveSpeed);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      packetsRef.current.forEach((packet) => {
        if (packet.userData.animating) {
          packet.userData.progress += 0.01 * speed;
          if (packet.userData.progress >= 1) {
            packet.userData.animating = false;
            setTimeout(() => {
              scene.remove(packet);
              packetsRef.current = packetsRef.current.filter((p) => p !== packet);
            }, 500);
          }
          const t = packet.userData.progress;
          packet.position.lerpVectors(packet.userData.startPos, packet.userData.endPos, t);
          packet.position.y += Math.sin(t * Math.PI) * 2;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [speed]);
  useEffect(() => {
    Object.entries(labelsRef.current).forEach(([deviceId, label]) => {
      if (!label) return;

      const isManuallyToggled = manuallyToggledLabels[deviceId];
      const isActive = activeDevices.includes(deviceId);

      if (isManuallyToggled === false) {
        label.visible = false;
      } else if (isManuallyToggled === true) {
        label.visible = true;
      } else {
        label.visible = isActive;
      }
    });
  }, [activeDevices, manuallyToggledLabels]);

  const clearScene = () => {
    Object.values(deviceMeshesRef.current).forEach((mesh) => {
      sceneRef.current.remove(mesh);
    });
    Object.values(labelsRef.current).forEach((label) => {
      sceneRef.current.remove(label);
    });
    cablesRef.current.forEach((cable) => {
      sceneRef.current.remove(cable);
    });
    deviceMeshesRef.current = {};
    labelsRef.current = {};
    cablesRef.current = [];
  };

  const createLabel = (name, ip, mac, position, deviceId) => {
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
    sceneRef.current.add(sprite);
    labelsRef.current[deviceId] = sprite;
  };

  const createDevices = (scenarioKey) => {
    clearScene();

    const scenarioDevices = scenarios[scenarioKey].devices;

    scenarioDevices.forEach((deviceId) => {
      const device = deviceMap[deviceId];
      if (!device) return;

      let mesh;

      if (device.type === 'PC') {
        const group = new THREE.Group();
        const color = device.name === 'Attacker' ? 0xff0000 : device.name === 'PC1' ? 0x5aa3ff : 0xff5aa3;

        const monitor = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 0.2), new THREE.MeshStandardMaterial({ color: 0x666677, metalness: 0.7, roughness: 0.3 }));
        monitor.position.y = 1.2;
        monitor.castShadow = true;
        group.add(monitor);

        const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.3), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 }));
        screen.position.set(0, 1.2, 0.11);
        group.add(screen);

        const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 1.5), new THREE.MeshStandardMaterial({ color: 0x555577, metalness: 0.5, roughness: 0.5 }));
        base.position.set(1.2, 0.5, 0);
        base.castShadow = true;
        group.add(base);

        const led = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 2 }));
        led.position.set(1.2, 1.2, 0.76);
        group.add(led);

        mesh = group;
      } else if (device.type === 'Printer') {
        const group = new THREE.Group();

        const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1, 2), new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.2, roughness: 0.6 }));
        body.position.y = 0.5;
        body.castShadow = true;
        group.add(body);

        const tray = new THREE.Mesh(new THREE.BoxGeometry(2, 0.08, 1.6), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.7 }));
        tray.position.set(0, 1.04, 0);
        group.add(tray);

        const panel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.1), new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.6, roughness: 0.4 }));
        panel.position.set(0, 0.8, 1.05);
        panel.rotation.x = -0.3;
        group.add(panel);

        const screenPanel = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.25), new THREE.MeshStandardMaterial({ color: 0x4466ff, emissive: 0x4466ff, emissiveIntensity: 0.8 }));
        screenPanel.position.set(0, 0.82, 1.1);
        screenPanel.rotation.x = -0.3;
        group.add(screenPanel);

        const led = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 2 }));
        led.position.set(0.5, 0.85, 1.05);
        group.add(led);

        mesh = group;
      } else if (device.type === 'Server') {
        const group = new THREE.Group();

        const body = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 1.5), new THREE.MeshStandardMaterial({ color: 0x2a2a3a, metalness: 0.8, roughness: 0.2 }));
        body.position.y = 1.25;
        body.castShadow = true;
        group.add(body);

        for (let i = 0; i < 3; i += 1) {
          const drive = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.05), new THREE.MeshStandardMaterial({ color: 0x1a1a2a, metalness: 0.9, roughness: 0.1 }));
          drive.position.set(0, 0.5 + i * 0.6, 0.76);
          group.add(drive);

          const led = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 2 }));
          led.position.set(-0.7, 0.5 + i * 0.6, 0.78);
          group.add(led);
        }

        mesh = group;
      } else if (device.type === 'Switch') {
        const group = new THREE.Group();

        const body = new THREE.Mesh(new THREE.BoxGeometry(4, 0.6, 2), new THREE.MeshStandardMaterial({ color: 0x2a3a4a, metalness: 0.8, roughness: 0.2 }));
        body.position.y = 0.3;
        body.castShadow = true;
        group.add(body);

        const panel = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.4, 0.05), new THREE.MeshStandardMaterial({ color: 0x1a2a3a, metalness: 0.9, roughness: 0.1 }));
        panel.position.set(0, 0.3, 1.03);
        group.add(panel);

        for (let i = 0; i < 5; i += 1) {
          const portLed = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 1.5 }));
          portLed.position.set(-1.5 + i * 0.75, 0.35, 1.05);
          group.add(portLed);
        }

        mesh = group;
      } else if (device.type === 'Router') {
        const group = new THREE.Group();

        const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 1.6), new THREE.MeshStandardMaterial({ color: 0x3a4a5a, metalness: 0.7, roughness: 0.3 }));
        body.position.y = 0.4;
        body.castShadow = true;
        group.add(body);

        const frontPanel = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.5, 0.05), new THREE.MeshStandardMaterial({ color: 0x2a3a4a, metalness: 0.8, roughness: 0.2 }));
        frontPanel.position.set(0, 0.4, 0.83);
        group.add(frontPanel);

        const ledColors = [0xff0000, 0xff8800, 0x00ff00, 0x00ff00];
        for (let i = 0; i < 4; i += 1) {
          const led = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), new THREE.MeshStandardMaterial({ color: ledColors[i], emissive: ledColors[i], emissiveIntensity: 1.5 }));
          led.position.set(-0.6 + i * 0.4, 0.45, 0.85);
          group.add(led);
        }

        for (let i = 0; i < 2; i += 1) {
          const antennaBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2), new THREE.MeshStandardMaterial({ color: 0x555566, metalness: 0.8, roughness: 0.2 }));
          antennaBase.position.set(-0.8 + i * 1.6, 0.9, 0);
          group.add(antennaBase);

          const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2), new THREE.MeshStandardMaterial({ color: 0x666677, metalness: 0.9, roughness: 0.1 }));
          antenna.position.set(-0.8 + i * 1.6, 2, 0);
          antenna.castShadow = true;
          group.add(antenna);
        }

        mesh = group;
      }

      if (mesh) {
        mesh.position.set(...device.position);
        mesh.userData.deviceId = device.id;
        sceneRef.current.add(mesh);
        deviceMeshesRef.current[device.id] = mesh;

        createLabel(device.name, device.ip, device.mac, device.position, device.id);
      }
    });

    allConnections.forEach((conn) => {
      if (!conn.scenarios.includes(scenarioKey)) return;
      if (!scenarioDevices.includes(conn.from) || !scenarioDevices.includes(conn.to)) return;

      const from = deviceMap[conn.from];
      const to = deviceMap[conn.to];
      if (!from || !to) return;

      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(from.position[0], 0.3, from.position[2]),
        new THREE.Vector3((from.position[0] + to.position[0]) / 2, 2, (from.position[2] + to.position[2]) / 2),
        new THREE.Vector3(to.position[0], 0.3, to.position[2])
      );
      const tubeGeometry = new THREE.TubeGeometry(curve, 50, 0.12, 8, false);

      const cableColor = conn.isWAN ? 0xff6600 : 0x6688dd;
      const tubeMaterial = new THREE.MeshStandardMaterial({ color: cableColor, metalness: 0.4, roughness: 0.6 });
      const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      tube.castShadow = true;
      sceneRef.current.add(tube);
      cablesRef.current.push(tube);
    });
  };
  const createPacket = (fromId, toId, type) => {
    const fromDevice = deviceMap[fromId];
    const toDevice = deviceMap[toId];
    if (!fromDevice || !toDevice) {
      console.warn('Kan ikke animere pakke mellem ukendte enheder', fromId, toId);
      return;
    }

    const geometry = new THREE.SphereGeometry(0.4, 32, 32);
    let color = 0xffffff;
    if (type === 'request') color = 0xffff00;
    else if (type === 'reply') color = 0x00ffaa;
    else if (type === 'data') color = 0xff6600;
    else if (type === 'attack') color = 0xff0000;
    else if (type === 'broadcast') color = 0xff00ff;

    const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8, metalness: 0.4, roughness: 0.3 });
    const packet = new THREE.Mesh(geometry, material);

    const startPos = new THREE.Vector3(...fromDevice.position);
    const endPos = new THREE.Vector3(...toDevice.position);

    packet.position.copy(startPos);
    packet.userData = { animating: true, progress: 0, startPos, endPos };

    sceneRef.current.add(packet);
    packetsRef.current.push(packet);
  };

  const animatePrinting = (printerId) => {
    const printer = deviceMap[printerId];
    if (!printer) return;

    const paperGeometry = new THREE.PlaneGeometry(0.8, 1.2);
    const paperMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, metalness: 0.1, roughness: 0.9 });
    const paper = new THREE.Mesh(paperGeometry, paperMaterial);

    paper.position.set(printer.position[0], 0.5, printer.position[2] + 1.2);
    paper.rotation.x = Math.PI / 2;

    sceneRef.current.add(paper);

    let progress = 0;
    const animatePaper = () => {
      progress += 0.02;
      if (progress < 1) {
        paper.position.z += 0.02;
        paper.position.y = 0.5 + progress * 0.3;
        requestAnimationFrame(animatePaper);
      } else {
        setTimeout(() => {
          sceneRef.current.remove(paper);
        }, 1000);
      }
    };
    animatePaper();
  };

  const addLog = (device, event, details) => {
    const timestamp = new Date().toLocaleTimeString('da-DK');
    setEventLog((prev) => [...prev, { timestamp, device, event, details }]);
  };

  const getDevicesOnSwitch = (switchId, excludeDevice = null) => {
    const s = scenarios[scenario];
    const devices = s.devices;
    const connected = [];

    allConnections.forEach((conn) => {
      if (!conn.scenarios.includes(scenario)) return;

      if (conn.to === switchId && devices.includes(conn.from) && conn.from !== excludeDevice) {
        connected.push(conn.from);
      }
      if (conn.from === switchId && devices.includes(conn.to) && conn.to !== excludeDevice) {
        connected.push(conn.to);
      }
    });

    return connected;
  };

  const setSafeArpEntry = (deviceId, ip, mac) => {
    if (!deviceId || !ip || !mac) return;
    setArpTables((prev) => ({
      ...prev,
      [deviceId]: {
        ...(prev[deviceId] || {}),
        [ip]: mac,
      },
    }));
  };
  const generateSteps = () => {
    const s = scenarios[scenario];
    const stepsList = [];

    if (!s) return stepsList;

    const sourceDevice = deviceMap[s.source];
    const targetDevice = s.target ? deviceMap[s.target] : null;

    const ensurePacket = (from, to, type) => {
      if (deviceMap[from] && deviceMap[to]) {
        createPacket(from, to, type);
      }
    };

    if (scenario === 'gratuitous-arp') {
      stepsList.push({
        description: `${sourceDevice.name} ændrer sin IP adresse`,
        relatedDevices: [s.source],
        action: async () => {
          addLog(sourceDevice.name, 'IP Change', 'Ny IP: 192.168.1.111');
          await new Promise((resolve) => setTimeout(resolve, 1000));
        },
      });
      stepsList.push({
        description: 'Sender Gratuitous ARP (annoncerer ny IP)',
        relatedDevices: [s.source, 'switch1'],
        action: async () => {
          addLog(sourceDevice.name, 'Gratuitous ARP', 'Broadcaster ny IP til alle');
          ensurePacket(s.source, 'switch1', 'broadcast');
          await new Promise((resolve) => setTimeout(resolve, 1200));
        },
      });
      stepsList.push({
        description: 'Switch broadcaster til alle enheder',
        relatedDevices: ['switch1', 'pc1', 'pc2', 'router1'],
        action: async () => {
          addLog('Switch1', 'Broadcast', 'Fortæller alle om ændring');
          ['pc1', 'pc2', 'router1'].forEach((id, idx) => {
            setTimeout(() => ensurePacket('switch1', id, 'broadcast'), idx * 200);
          });
          await new Promise((resolve) => setTimeout(resolve, 1500));
        },
      });
      stepsList.push({
        description: 'PC1 opdaterer sin ARP cache',
        relatedDevices: ['pc1'],
        action: async () => {
          addLog('PC1', 'ARP Update', 'Opdateret printer IP');
          setSafeArpEntry('pc1', '192.168.1.111', sourceDevice.mac);
          await new Promise((resolve) => setTimeout(resolve, 800));
        },
      });
      stepsList.push({
        description: 'PC2 opdaterer sin ARP cache',
        relatedDevices: ['pc2'],
        action: async () => {
          addLog('PC2', 'ARP Update', 'Opdateret printer IP');
          setSafeArpEntry('pc2', '192.168.1.111', sourceDevice.mac);
          await new Promise((resolve) => setTimeout(resolve, 800));
        },
      });
      stepsList.push({
        description: '✓ Alle enheder ved nu om ny IP',
        relatedDevices: [s.source, 'pc1', 'pc2', 'router1'],
        action: async () => {
          addLog(sourceDevice.name, 'Complete', '✓ IP ændring succesfuld');
          await new Promise((resolve) => setTimeout(resolve, 500));
        },
      });
      return stepsList;
    }

    if (scenario === 'arp-timeout') {
      stepsList.push({
        description: `${sourceDevice.name} har gammel ARP cache entry`,
        relatedDevices: [s.source],
        action: async () => {
          addLog(sourceDevice.name, 'Cache Check', 'Entry er 300+ sekunder gammel');
          setSafeArpEntry(s.source, s.targetIP, `${targetDevice?.mac || '??'} (OLD)`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        },
      });
      stepsList.push({
        description: 'ARP entry timeout - slettes',
        relatedDevices: [s.source],
        action: async () => {
          addLog(sourceDevice.name, 'Cache Timeout', 'Entry udløbet og fjernet');
          setArpTables((prev) => ({ ...prev, [s.source]: {} }));
          await new Promise((resolve) => setTimeout(resolve, 1000));
        },
      });
    }

    if (scenario === 'duplicate-ip') {
      stepsList.push({
        description: `${sourceDevice.name} tildeles IP ${s.targetIP}`,
        relatedDevices: [s.source],
        action: async () => {
          addLog(sourceDevice.name, 'IP Config', `Sætter IP til ${s.targetIP}`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        },
      });
      stepsList.push({
        description: 'Sender Gratuitous ARP for at checke IP',
        relatedDevices: [s.source, 'switch1'],
        action: async () => {
          addLog(sourceDevice.name, 'Gratuitous ARP', 'Er nogen på denne IP?');
          ensurePacket(s.source, 'switch1', 'request');
          await new Promise((resolve) => setTimeout(resolve, 1200));
        },
      });
      stepsList.push({
        description: 'Switch broadcaster forespørgsel',
        relatedDevices: ['switch1', 'printer', 'router1'],
        action: async () => {
          addLog('Switch1', 'Broadcast', 'Checker netværk');
          const targets = getDevicesOnSwitch('switch1', s.source);
          targets.forEach((id, idx) => {
            setTimeout(() => ensurePacket('switch1', id, 'request'), idx * 150);
          });
          await new Promise((resolve) => setTimeout(resolve, 1200 + targets.length * 150));
        },
      });
      if (targetDevice) {
        stepsList.push({
          description: `⚠️ ${targetDevice.name} svarer - IP KONFLIKT!`,
          relatedDevices: [s.target, 'switch1'],
          action: async () => {
            addLog(targetDevice.name, 'ARP Reply', '⚠️ JEG har denne IP!');
            ensurePacket(s.target, 'switch1', 'reply');
            await new Promise((resolve) => setTimeout(resolve, 1200));
          },
        });
      }
    }

    if (scenario === 'arp-spoof') {
      stepsList.push({
        description: `${sourceDevice.name} vil kommunikere med Server`,
        relatedDevices: [s.source],
        action: async () => {
          addLog(sourceDevice.name, 'Connect', `Forbinder til ${s.targetIP}`);
          await new Promise((resolve) => setTimeout(resolve, 800));
        },
      });
      stepsList.push({
        description: 'Sender ARP Request for Server',
        relatedDevices: [s.source, 'switch1'],
        action: async () => {
          addLog(sourceDevice.name, 'ARP Request', `Hvem har ${s.targetIP}?`);
          ensurePacket(s.source, 'switch1', 'request');
          await new Promise((resolve) => setTimeout(resolve, 1200));
        },
      });
    }

    if (scenario === 'dhcp-arp') {
      stepsList.push({
        description: `${sourceDevice.name} joiner netværket`,
        relatedDevices: [s.source],
        action: async () => {
          addLog(sourceDevice.name, 'Network Join', 'Ingen IP konfiguration');
          await new Promise((resolve) => setTimeout(resolve, 800));
        },
      });
      stepsList.push({
        description: 'Sender DHCP Discover (broadcast)',
        relatedDevices: [s.source, 'switch1'],
        action: async () => {
          addLog(sourceDevice.name, 'DHCP Discover', 'Søger DHCP server');
          ensurePacket(s.source, 'switch1', 'broadcast');
          await new Promise((resolve) => setTimeout(resolve, 1200));
        },
      });
    }

    if (scenario === 'pc-to-remote') {
      stepsList.push({
        description: `${sourceDevice.name} vil sende til ${s.targetIP}`,
        relatedDevices: [s.source],
        action: async () => {
          addLog(sourceDevice.name, 'Route Check', `${s.targetIP} er ikke på mit subnet`);
          await new Promise((resolve) => setTimeout(resolve, 800));
        },
      });
      stepsList.push({
        description: `${sourceDevice.name} skal bruge gateway`,
        relatedDevices: [s.source],
        action: async () => {
          addLog(sourceDevice.name, 'Routing', 'Send til gateway');
          await new Promise((resolve) => setTimeout(resolve, 800));
        },
      });
    }

    if (targetDevice) {
      stepsList.push({
        description: `${sourceDevice.name} mangler MAC for ${s.targetIP}`,
        relatedDevices: [s.source],
        action: async () => {
          addLog(sourceDevice.name, 'Cache Miss', 'Ingen entry');
          await new Promise((resolve) => setTimeout(resolve, 500));
        },
      });
      stepsList.push({
        description: `${sourceDevice.name} sender ARP Request`,
        relatedDevices: [s.source, 'switch1'],
        action: async () => {
          addLog(sourceDevice.name, 'ARP Request', `Hvem har ${s.targetIP}?`);
          ensurePacket(s.source, 'switch1', 'request');
          await new Promise((resolve) => setTimeout(resolve, 1200));
        },
      });
      stepsList.push({
        description: 'Switch1 broadcaster til alle porte',
        relatedDevices: ['switch1', 'pc2', 'printer', 'router1'],
        action: async () => {
          addLog('Switch1', 'Broadcast', 'Sender til alle');
          const targets = getDevicesOnSwitch('switch1', s.source);
          targets.forEach((id, idx) => {
            setTimeout(() => ensurePacket('switch1', id, 'request'), idx * 150);
          });
          await new Promise((resolve) => setTimeout(resolve, 1200 + targets.length * 150));
        },
      });
      stepsList.push({
        description: `${targetDevice.name} sender ARP Reply`,
        relatedDevices: [s.target, 'switch1'],
        action: async () => {
          addLog(targetDevice.name, 'ARP Reply', 'Min MAC');
          ensurePacket(s.target, 'switch1', 'reply');
          await new Promise((resolve) => setTimeout(resolve, 1200));
        },
      });
      stepsList.push({
        description: 'Switch1 videresender reply',
        relatedDevices: ['switch1', s.source],
        action: async () => {
          addLog('Switch1', 'Forward', `Til ${sourceDevice.name}`);
          ensurePacket('switch1', s.source, 'reply');
          await new Promise((resolve) => setTimeout(resolve, 1200));
        },
      });
      stepsList.push({
        description: `${sourceDevice.name} opdaterer ARP tabel`,
        relatedDevices: [s.source],
        action: async () => {
          addLog(sourceDevice.name, 'Update', 'MAC gemt');
          setSafeArpEntry(s.source, s.targetIP, targetDevice.mac);
          await new Promise((resolve) => setTimeout(resolve, 800));
        },
      });
      stepsList.push({
        description: '✓ ARP proces fuldført',
        relatedDevices: [s.source],
        action: async () => {
          addLog(sourceDevice.name, 'Success', 'Klar');
          await new Promise((resolve) => setTimeout(resolve, 500));
        },
      });
    }

    if (scenario === 'pc-to-printer' && targetDevice) {
      stepsList.push({
        description: `${sourceDevice.name} sender print job`,
        relatedDevices: [s.source, 'switch1', s.target],
        action: async () => {
          addLog(sourceDevice.name, 'Send Data', 'Sender dokument');
          ensurePacket(s.source, 'switch1', 'data');
          await new Promise((resolve) => setTimeout(resolve, 1000));
          ensurePacket('switch1', s.target, 'data');
          await new Promise((resolve) => setTimeout(resolve, 1200));
        },
      });
      stepsList.push({
        description: 'Printer modtager og printer',
        relatedDevices: [s.target],
        action: async () => {
          addLog(targetDevice.name, 'Printing', '🖨️ Printer...');
          animatePrinting(s.target);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        },
      });
      stepsList.push({
        description: '✓ Print job fuldført',
        relatedDevices: [s.target],
        action: async () => {
          addLog(targetDevice.name, 'Complete', '✓ Printet');
          await new Promise((resolve) => setTimeout(resolve, 500));
        },
      });
    }

    if (scenario === 'arp-timeout') {
      stepsList.push({
        description: `${sourceDevice.name} sender ny ARP Request`,
        relatedDevices: [s.source, 'switch1'],
        action: async () => {
          addLog(sourceDevice.name, 'ARP Request', `Hvem har ${s.targetIP}?`);
          ensurePacket(s.source, 'switch1', 'request');
          await new Promise((resolve) => setTimeout(resolve, 1200));
        },
      });
    }

    if (scenario === 'duplicate-ip') {
      stepsList.push({
        description: `${sourceDevice.name} detekterer duplicate IP`,
        relatedDevices: [s.source],
        action: async () => {
          addLog(sourceDevice.name, 'IP Conflict', '⚠️ IP allerede i brug!');
          await new Promise((resolve) => setTimeout(resolve, 1000));
        },
      });
      stepsList.push({
        description: `${sourceDevice.name} deaktiverer netværk`,
        relatedDevices: [s.source],
        action: async () => {
          addLog(sourceDevice.name, 'Network Down', '❌ Interface deaktiveret');
          await new Promise((resolve) => setTimeout(resolve, 1000));
        },
      });
      stepsList.push({
        description: '⚠️ IP konflikt - netværk utilgængeligt',
        relatedDevices: [s.source],
        action: async () => {
          addLog(sourceDevice.name, 'Error', '⚠️ Kræver manuel fix');
          await new Promise((resolve) => setTimeout(resolve, 500));
        },
      });
    }

    if (scenario === 'arp-spoof') {
      const attacker = deviceMap.attacker;
      stepsList.push({
        description: `⚠️ ${attacker.name} sender FALSK ARP Reply først!`,
        relatedDevices: ['attacker', 'switch1'],
        action: async () => {
          addLog(attacker.name, 'ARP Spoof', '⚠️ JEG er serveren (løgn)');
          ensurePacket('attacker', 'switch1', 'attack');
          await new Promise((resolve) => setTimeout(resolve, 1200));
        },
      });
      stepsList.push({
        description: 'Switch videresender falsk reply',
        relatedDevices: ['switch1', s.source],
        action: async () => {
          addLog('Switch1', 'Forward', 'Til PC1');
          ensurePacket('switch1', s.source, 'attack');
          await new Promise((resolve) => setTimeout(resolve, 1200));
        },
      });
      stepsList.push({
        description: `${sourceDevice.name} modtager FALSK MAC adresse`,
        relatedDevices: [s.source],
        action: async () => {
          addLog(sourceDevice.name, 'ARP Update', '⚠️ Gemt attackers MAC');
          setSafeArpEntry(s.source, s.targetIP, `${attacker.mac} (FAKE)`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        },
      });
      if (targetDevice) {
        stepsList.push({
          description: `${targetDevice.name} sender rigtig reply (for sent)`,
          relatedDevices: [s.target, 'switch1'],
          action: async () => {
            addLog(targetDevice.name, 'ARP Reply', 'Min rigtige MAC (ignoreret)');
            ensurePacket(s.target, 'switch1', 'reply');
            await new Promise((resolve) => setTimeout(resolve, 1200));
          },
        });
      }
      stepsList.push({
        description: `${sourceDevice.name} sender data - går til Attacker!`,
        relatedDevices: [s.source, 'switch1', 'attacker'],
        action: async () => {
          addLog(sourceDevice.name, 'Send Data', '⚠️ Sender til forkert MAC');
          ensurePacket(s.source, 'switch1', 'data');
          await new Promise((resolve) => setTimeout(resolve, 1000));
          ensurePacket('switch1', 'attacker', 'data');
          await new Promise((resolve) => setTimeout(resolve, 1200));
        },
      });
      stepsList.push({
        description: '⚠️ Attacker aflytter trafikken',
        relatedDevices: ['attacker'],
        action: async () => {
          addLog(attacker.name, 'Intercept', '⚠️ Data aflyttet!');
          await new Promise((resolve) => setTimeout(resolve, 1000));
        },
      });
      stepsList.push({
        description: 'Attacker videresender til rigtig Server',
        relatedDevices: ['attacker', 'switch1', 'server'],
        action: async () => {
          addLog(attacker.name, 'Forward', 'Sender videre (offer ved intet)');
          ensurePacket('attacker', 'switch1', 'data');
          await new Promise((resolve) => setTimeout(resolve, 1000));
          ensurePacket('switch1', 'server', 'data');
          await new Promise((resolve) => setTimeout(resolve, 1200));
        },
      });
      stepsList.push({
        description: '⚠️ Man-in-the-Middle attack succesfuld!',
        relatedDevices: ['attacker', s.source, 'server'],
        action: async () => {
          addLog(attacker.name, 'Attack Success', '⚠️ Træk data uden opdagelse');
          await new Promise((resolve) => setTimeout(resolve, 500));
        },
      });
    }

    if (scenario === 'dhcp-arp') {
      const router = deviceMap.router1;
      stepsList.push({
        description: 'Switch videresender til Router (DHCP server)',
        relatedDevices: ['switch1', 'router1'],
        action: async () => {
          addLog('Switch1', 'Forward', 'Til DHCP server');
          ensurePacket('switch1', 'router1', 'broadcast');
          await new Promise((resolve) => setTimeout(resolve, 1200));
        },
      });
      stepsList.push({
        description: 'Router tilbyder IP adresse (DHCP Offer)',
        relatedDevices: ['router1', 'switch1'],
        action: async () => {
          addLog(router.name, 'DHCP Offer', 'Tilbyder 192.168.1.77');
          ensurePacket('router1', 'switch1', 'reply');
          await new Promise((resolve) => setTimeout(resolve, 1200));
        },
      });
      stepsList.push({
        description: 'Switch videresender offer',
        relatedDevices: ['switch1', s.source],
        action: async () => {
          addLog('Switch1', 'Forward', 'Til New PC');
          ensurePacket('switch1', s.source, 'reply');
          await new Promise((resolve) => setTimeout(resolve, 1200));
        },
      });
      stepsList.push({
        description: `${sourceDevice.name} accepterer IP (DHCP Request)`,
        relatedDevices: [s.source, 'switch1'],
        action: async () => {
          addLog(sourceDevice.name, 'DHCP Request', 'Accepterer 192.168.1.77');
          ensurePacket(s.source, 'switch1', 'request');
          await new Promise((resolve) => setTimeout(resolve, 1200));
        },
      });
      stepsList.push({
        description: 'Switch videresender request',
        relatedDevices: ['switch1', 'router1'],
        action: async () => {
          addLog('Switch1', 'Forward', 'Til Router');
          ensurePacket('switch1', 'router1', 'request');
          await new Promise((resolve) => setTimeout(resolve, 1200));
        },
      });
      stepsList.push({
        description: 'Router bekræfter (DHCP ACK)',
        relatedDevices: ['router1', 'switch1'],
        action: async () => {
          addLog(router.name, 'DHCP ACK', 'IP tildelt!');
          ensurePacket('router1', 'switch1', 'reply');
          await new Promise((resolve) => setTimeout(resolve, 1200));
        },
      });
      stepsList.push({
        description: 'Switch videresender ACK',
        relatedDevices: ['switch1', s.source],
        action: async () => {
          addLog('Switch1', 'Forward', 'Til New PC');
          ensurePacket('switch1', s.source, 'reply');
          await new Promise((resolve) => setTimeout(resolve, 1200));
        },
      });
      stepsList.push({
        description: `${sourceDevice.name} checker IP med Gratuitous ARP`,
        relatedDevices: [s.source, 'switch1'],
        action: async () => {
          addLog(sourceDevice.name, 'Gratuitous ARP', 'Er 192.168.1.77 ledig?');
          ensurePacket(s.source, 'switch1', 'request');
          await new Promise((resolve) => setTimeout(resolve, 1200));
        },
      });
      stepsList.push({
        description: 'Switch broadcaster check',
        relatedDevices: ['switch1', 'router1'],
        action: async () => {
          addLog('Switch1', 'Broadcast', 'Checker IP konflikt');
          ensurePacket('switch1', 'router1', 'request');
          await new Promise((resolve) => setTimeout(resolve, 1200));
        },
      });
      stepsList.push({
        description: 'Ingen svarer - IP er ledig!',
        relatedDevices: [s.source],
        action: async () => {
          addLog(sourceDevice.name, 'IP Verified', '✓ Ingen konflikt');
          await new Promise((resolve) => setTimeout(resolve, 800));
        },
      });
      stepsList.push({
        description: `${sourceDevice.name} aktiverer netværk`,
        relatedDevices: [s.source],
        action: async () => {
          addLog(sourceDevice.name, 'Network Up', '✓ IP: 192.168.1.77');
          await new Promise((resolve) => setTimeout(resolve, 800));
        },
      });
      stepsList.push({
        description: '✓ DHCP + ARP proces komplet',
        relatedDevices: [s.source, 'switch1', 'router1'],
        action: async () => {
          addLog(sourceDevice.name, 'Complete', '✓ Klar til netværk');
          await new Promise((resolve) => setTimeout(resolve, 500));
        },
      });
    }

    if (scenario === 'pc-to-remote' && targetDevice) {
      stepsList.push({
        description: `${sourceDevice.name} sender data til Router1`,
        relatedDevices: [s.source, 'switch1', 'router1'],
        action: async () => {
          addLog(sourceDevice.name, 'Send Data', 'Via gateway');
          ensurePacket(s.source, 'switch1', 'data');
          await new Promise((resolve) => setTimeout(resolve, 1000));
          ensurePacket('switch1', 'router1', 'data');
          await new Promise((resolve) => setTimeout(resolve, 1200));
        },
      });
      stepsList.push({
        description: 'Router1 router til Router2',
        relatedDevices: ['router1', 'router2'],
        action: async () => {
          addLog('Router1', 'Routing', 'Forward til LAN2');
          ensurePacket('router1', 'router2', 'data');
          await new Promise((resolve) => setTimeout(resolve, 1500));
        },
      });
      stepsList.push({
        description: 'Router2 sender til destination',
        relatedDevices: ['router2', 'switch2'],
        action: async () => {
          addLog('Router2', 'Forward', 'Til Printer2');
          ensurePacket('router2', 'switch2', 'data');
          await new Promise((resolve) => setTimeout(resolve, 1200));
        },
      });
      stepsList.push({
        description: 'Switch2 videresender',
        relatedDevices: ['switch2', s.target],
        action: async () => {
          addLog('Switch2', 'Forward', 'Til destination');
          ensurePacket('switch2', s.target, 'data');
          await new Promise((resolve) => setTimeout(resolve, 1500));
        },
      });
      stepsList.push({
        description: '✓ Cross-subnet kommunikation succesfuld',
        relatedDevices: [s.target],
        action: async () => {
          addLog(targetDevice.name, 'Complete', '✓ Data modtaget');
          await new Promise((resolve) => setTimeout(resolve, 500));
        },
      });
    }

    if (scenario === 'pc-to-gateway') {
      stepsList.push({
        description: '✓ Klar til routing',
        relatedDevices: [s.source],
        action: async () => {
          addLog(sourceDevice.name, 'Success', '✓ Kan route nu');
          await new Promise((resolve) => setTimeout(resolve, 500));
        },
      });
    }

    return stepsList;
  };
  const zoomToDevices = (deviceIds) => {
    if (!deviceIds || deviceIds.length === 0) return;

    const positions = deviceIds
      .map((id) => deviceMap[id]?.position)
      .filter(Boolean);
    if (positions.length === 0) return;

    const center = positions.reduce(
      (acc, pos) => ({
        x: acc.x + pos[0],
        y: acc.y + pos[1],
        z: acc.z + pos[2],
      }),
      { x: 0, y: 0, z: 0 }
    );

    center.x /= positions.length;
    center.y /= positions.length;
    center.z /= positions.length;

    let maxDist = 0;
    positions.forEach((pos) => {
      const dist = Math.sqrt((pos[0] - center.x) ** 2 + (pos[2] - center.z) ** 2);
      if (dist > maxDist) maxDist = dist;
    });

    const targetDistance = Math.max(maxDist * 2.5, 15);

    const camera = cameraRef.current;
    if (camera) {
      camera.position.set(center.x, center.y + targetDistance * 0.6, center.z + targetDistance * 0.8);

      const targetPos = new THREE.Vector3(center.x, center.y, center.z);
      const direction = new THREE.Vector3();
      direction.subVectors(targetPos, camera.position).normalize();

      mouseRef.current.yaw = Math.atan2(direction.x, direction.z);
      mouseRef.current.pitch = Math.asin(-direction.y);

      camera.rotation.order = 'YXZ';
      camera.rotation.y = mouseRef.current.yaw;
      camera.rotation.x = mouseRef.current.pitch;
    }
  };

  const startScenario = () => {
    setEventLog([]);
    setArpTables({});
    setCurrentStep(0);
    setCurrentStepDescription('');
    setManuallyToggledLabels({});

    createDevices(scenario);

    const newSteps = generateSteps();
    setSteps(newSteps);

    const s = scenarios[scenario];
    const visibleDevices = s.devices.filter((id) => deviceMap[id]?.type !== 'Switch');
    setActiveDevices(visibleDevices);

    setTimeout(() => {
      zoomToDevices(s.devices);
    }, 100);
  };

  const nextStep = async () => {
    if (currentStep < steps.length) {
      const step = steps[currentStep];

      setCurrentStepDescription(step.description);
      setActiveDevices(step.relatedDevices || []);

      await steps[currentStep].action();
      setCurrentStep((prev) => prev + 1);
    }
  };

  const autoPlay = async () => {
    setIsPlaying(true);
    let stepIndex = currentStep;
    while (stepIndex < steps.length) {
      const currentStepData = steps[stepIndex];

      setCurrentStepDescription(currentStepData.description);
      setActiveDevices(currentStepData.relatedDevices || []);

      if (currentStepData.relatedDevices) {
        zoomToDevices([...new Set(currentStepData.relatedDevices)]);
      }

      await steps[stepIndex].action();
      await new Promise((resolve) => setTimeout(resolve, 1500 / speed));
      stepIndex += 1;
      setCurrentStep(stepIndex);
    }
    setIsPlaying(false);
  };

  const reset = () => {
    setCurrentStep(0);
    setSteps([]);
    setEventLog([]);
    setArpTables({});
    setIsPlaying(false);
    setCurrentStepDescription('');
    setActiveDevices([]);
    setManuallyToggledLabels({});
    packetsRef.current.forEach((p) => sceneRef.current.remove(p));
    packetsRef.current = [];

    clearScene();

    const camera = cameraRef.current;
    if (camera) {
      camera.position.set(0, 20, 20);
      mouseRef.current.yaw = 0;
      mouseRef.current.pitch = -Math.PI / 6;
      camera.rotation.order = 'YXZ';
      camera.rotation.y = mouseRef.current.yaw;
      camera.rotation.x = mouseRef.current.pitch;
    }
  };

  return (
    <div className="w-full h-screen bg-gray-950 flex flex-col text-gray-100">
      <div className="bg-gray-900 border-b border-gray-800 p-4 shadow-xl">
        <h1 className="text-3xl font-bold text-blue-400 mb-4">ARP Simulator</h1>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm mb-2 text-gray-400">Scenarie</label>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              disabled={currentStep > 0}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm"
            >
              {Object.entries(scenarios).map(([key, s]) => (
                <option key={key} value={key}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2 text-gray-400">Hastighed: {speed}x</label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.5"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-gray-400">Kamera kontrol (FPS-stil)</label>
            <div className="text-xs text-gray-500 space-y-1">
              <div>🖱️ Træk: Roter kamera</div>
              <div>🎡 Hjul: Bevæg frem/tilbage</div>
              <div>⌨️ WASD: Bevæg vandret</div>
              <div>⌨️ Space/Shift: Op/Ned</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <button
            onClick={startScenario}
            disabled={steps.length > 0}
            className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed font-medium"
          >
            🎬 Forbered
          </button>
          <button
            onClick={nextStep}
            disabled={currentStep >= steps.length}
            className="px-6 py-2 bg-green-600 rounded hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed font-medium"
          >
            Næste →
          </button>
          <button
            onClick={autoPlay}
            disabled={currentStep >= steps.length || isPlaying}
            className="px-6 py-2 bg-purple-600 rounded hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed font-medium"
          >
            ▶ Auto Play
          </button>
          <button onClick={reset} className="px-6 py-2 bg-red-600 rounded hover:bg-red-700 font-medium">
            🔄 Reset
          </button>
          <div className="ml-auto text-sm text-gray-400 font-mono bg-gray-800 px-4 py-2 rounded">
            Step {currentStep} / {steps.length}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div ref={mountRef} className="flex-1 bg-gray-900" />

        {currentStepDescription && (
          <div className="absolute bottom-4 left-4 right-[25rem] z-50">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-2xl border-2 border-blue-400 p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">📍</span>
                <h3 className="text-xs font-bold text-yellow-300 uppercase tracking-wide">NUVÆRENDE STEP</h3>
              </div>
              <p className="text-xl font-bold text-white leading-relaxed">{currentStepDescription}</p>
            </div>
          </div>
        )}

        <div className="w-96 bg-gray-900 border-l border-gray-800 overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-xs font-bold text-gray-300 mb-3 uppercase tracking-wide">🖥️ Netværk Enheder</h3>
            <div className="space-y-3">
              {scenarios[scenario] &&
                scenarios[scenario].devices
                  .filter((id) => deviceMap[id]?.type !== 'Switch')
                  .map((deviceId) => {
                    const device = deviceMap[deviceId];
                    if (!device) return null;
                    return (
                      <div key={device.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                        <div className="font-bold text-blue-400 mb-2">{device.name}</div>
                        <div className="text-xs space-y-1">
                          <div className="text-gray-400">
                            <span className="text-gray-500">IP:</span>{' '}
                            <span className="text-green-400 font-mono">{device.ip}</span>
                          </div>
                          <div className="text-gray-400">
                            <span className="text-gray-500">MAC:</span>{' '}
                            <span className="text-purple-400 font-mono">{device.mac}</span>
                          </div>
                        </div>
                        {arpTables[device.id] && Object.keys(arpTables[device.id]).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <div className="text-xs text-gray-500 mb-2 font-semibold">ARP Table:</div>
                            {Object.entries(arpTables[device.id]).map(([ip, mac]) => (
                              <div key={ip} className="text-xs">
                                <span className="text-green-400 font-mono">{ip}</span>
                                <span className="text-gray-500 mx-2">→</span>
                                <span className="text-purple-400 font-mono">{mac}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
            </div>
          </div>

          <div className="flex-1 p-4">
            <h3 className="text-xs font-bold text-gray-300 mb-3 uppercase tracking-wide">📋 Event Log</h3>
            <div className="space-y-2">
              {eventLog.length === 0 ? (
                <div className="text-center text-gray-600 text-sm py-8">
                  Ingen events endnu.
                  <br />
                  Tryk "Forbered" for at starte.
                </div>
              ) : (
                eventLog
                  .slice()
                  .reverse()
                  .map((entry, idx) => (
                    <div key={idx} className="bg-gray-800 border border-gray-700 rounded p-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1 font-mono">
                        <span>{entry.timestamp}</span>
                        <span className="font-bold text-blue-400">{entry.device}</span>
                      </div>
                      <div className="text-sm font-bold text-yellow-400 mb-1">{entry.event}</div>
                      <div className="text-xs text-gray-300">{entry.details}</div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARPSimulation;
