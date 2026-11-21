(() => {
  "use strict";

  // 12 INTERACTIVE 3D BIOMES CONFIGURATION
  const BIOMES = [
    { id: "royal", name: "Royal Sanctum", skyDay: 0xdbeafe, skyNight: 0x131124, floor: 0x312e48, wall: 0xd4af37, accent: 0xf43f5e },
    { id: "cyberdrift", name: "Cyberpunk Drift", skyDay: 0x3b0764, skyNight: 0x090418, floor: 0x120b29, wall: 0x00f5d4, accent: 0xff2a85 },
    { id: "angelic", name: "Angelic Cloud", skyDay: 0xe0f2fe, skyNight: 0x1e293b, floor: 0xf8fafc, wall: 0xfacc15, accent: 0x93c5fd },
    { id: "lagoon", name: "Pastel Lagoon", skyDay: 0xa5f3fc, skyNight: 0x083344, floor: 0xfde68a, wall: 0x2dd4bf, accent: 0xfb7185 },
    { id: "lofi", name: "Lo-Fi Cafe", skyDay: 0xfed7aa, skyNight: 0x271712, floor: 0x5c3a21, wall: 0xd97706, accent: 0xfef08a },
    { id: "gothicbalcony", name: "Gothic Balcony", skyDay: 0x64748b, skyNight: 0x0f172a, floor: 0x1e293b, wall: 0x94a3b8, accent: 0xc084fc },
    { id: "gothiccastle", name: "Gothic Castle", skyDay: 0x475569, skyNight: 0x090d16, floor: 0x27272a, wall: 0x71717a, accent: 0xf97316 },
    { id: "forest", name: "Enchanted Forest", skyDay: 0xa7f3d0, skyNight: 0x062419, floor: 0x143326, wall: 0x34d399, accent: 0xfef08a },
    { id: "cyberterrace", name: "Cyberpunk Terrace", skyDay: 0x1e1b4b, skyNight: 0x050511, floor: 0x181826, wall: 0x38bdf8, accent: 0xe879f9 },
    { id: "desert", name: "Sandstone Desert", skyDay: 0xffedd5, skyNight: 0x2a1810, floor: 0xd97706, wall: 0xb45309, accent: 0x22d3ee },
    { id: "reef", name: "Abyssal Reef", skyDay: 0x0284c7, skyNight: 0x021324, floor: 0x0c4a6e, wall: 0x38bdf8, accent: 0xf472b6 },
    { id: "alpine", name: "Alpine Meadows", skyDay: 0xbae6fd, skyNight: 0x0f1e2e, floor: 0x15803d, wall: 0xe2e8f0, accent: 0x60a5fa }
  ];

  const SWATCH_COLORS = [
    "#f472b6", "#c084fc", "#60a5fa", "#34d399", "#facc15", "#fb7185",
    "#a78bfa", "#38bdf8", "#4ade80", "#fb923c", "#e879f9", "#f8fafc"
  ];

  const STORAGE_KEY = "AETERNUS_CHRONICLE_V1";

  // APPLICATION STATE
  const state = {
    controlMode: "keyboard", // 'touch' | 'keyboard'
    theme: "dark",
    renderStyle: "modern", // 'modern' | 'retro'
    isNight: true,
    skyPhaseValue: 0, // 0 = night, 1 = day
    skyCycleSpeed: 1.0,
    ballSpeedMultiplier: 1.0,
    showProjection: true,
    biomeIndex: 0,
    archetype: "ball", // 'ball' | 'runner' | 'bird' | 'car'
    playerColor: "#c084fc",
    entityColor: "#fb7185",
    playerAutoRotate: true,
    entityAutoRotate: true,

    // Gameplay metrics
    running: false,
    paused: false,
    inCountdown: false,
    score: 0,
    highScore: 0,
    elapsedSeconds: 0,
    highTime: 0,
    level: 1,
    health: 100,
    shields: 1,
    diamonds: 1,
    powerTimer: 0,
    comboCount: 0,
    pelletsRemaining: 0,
    exitUnlocked: false
  };

  // PERSISTENCE LOAD
  function loadRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      state.highScore = data.highScore || 0;
      state.highTime = data.highTime || 0;
      if (data.savedSession) {
        document.getElementById("saved-session-banner").classList.remove("hidden");
      }
      updateRecordLabels();
    } catch (e) {
      console.warn("Storage unavailable", e);
    }
  }

  function saveProgress(includeActiveSession = true) {
    try {
      const payload = {
        highScore: Math.max(state.highScore, state.score),
        highTime: Math.max(state.highTime, Math.floor(state.elapsedSeconds)),
        savedSession: includeActiveSession
          ? {
              score: state.score,
              elapsedSeconds: state.elapsedSeconds,
              level: state.level,
              health: state.health,
              shields: state.shields,
              diamonds: state.diamonds,
              biomeIndex: state.biomeIndex,
              archetype: state.archetype,
              playerColor: state.playerColor,
              entityColor: state.entityColor,
              controlMode: state.controlMode
            }
          : null
      };
      state.highScore = payload.highScore;
      state.highTime = payload.highTime;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      updateRecordLabels();
    } catch (e) {
      console.warn("Could not save chronicle", e);
    }
  }

  function formatTime(sec) {
    const s = Math.floor(sec);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }

  function updateRecordLabels() {
    document.getElementById("init-high-score").textContent = state.highScore;
    document.getElementById("init-high-time").textContent = formatTime(state.highTime);
    document.getElementById("hud-high-score").textContent = state.highScore;
    document.getElementById("hud-high-time").textContent = formatTime(state.highTime);
  }

  // PLAGUE-STYLE TOP-LEFT BLURRED SPREAD THEME TRANSITION FOR EACH UI CARD INDIVIDUALLY
  function toggleThemeWithPlagueSpread() {
    state.theme = state.theme === "dark" ? "light" : "dark";
    const cards = document.querySelectorAll("[data-plague-card]");
    cards.forEach((card, idx) => {
      card.style.setProperty(
        "--plague-tint",
        state.theme === "light" ? "rgba(255, 240, 255, 0.92)" : "rgba(18, 21, 42, 0.92)"
      );
      card.classList.remove("plague-spreading");
      void card.offsetWidth;
      setTimeout(() => {
        card.classList.add("plague-spreading");
      }, idx * 55);
    });

    setTimeout(() => {
      document.documentElement.setAttribute("data-theme", state.theme);
      document.getElementById("theme-toggle-init").textContent =
        `Theme: ${state.theme === "dark" ? "Dark" : "Light"}`;
    }, 180);
  }

  // 360° INTERACTIVE PREVIEW SCREENS (AVATAR & ENTITY)
  class PreviewStudio {
    constructor(canvasId, isPlayer) {
      this.canvas = document.getElementById(canvasId);
      this.isPlayer = isPlayer;
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
      this.camera.position.set(0, 1.4, 4.2);
      this.camera.lookAt(0, 0.2, 0);

      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const amb = new THREE.AmbientLight(0xffffff, 0.75);
      const dir = new THREE.DirectionalLight(0xffffff, 0.95);
      dir.position.set(3, 6, 4);
      this.scene.add(amb, dir);

      this.pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(1.15, 1.3, 0.18, 32),
        new THREE.MeshStandardMaterial({ color: 0x8b5cf6, metalness: 0.4, roughness: 0.3 })
      );
      this.pedestal.position.y = -0.75;
      this.scene.add(this.pedestal);

      this.pivot = new THREE.Group();
      this.scene.add(this.pivot);
      this.rebuildMesh();
      this.bindDrag360();
    }

    rebuildMesh() {
      while (this.pivot.children.length) {
        this.pivot.remove(this.pivot.children[0]);
      }
      const colorHex = this.isPlayer ? state.playerColor : state.entityColor;
      const mesh = createArchetypeMesh(state.archetype, this.isPlayer, colorHex);
      mesh.scale.setScalar(1.35);
      this.pivot.add(mesh);
    }

    bindDrag360() {
      let dragging = false;
      let prevX = 0;
      let prevY = 0;
      const onDown = (x, y) => {
        dragging = true;
        prevX = x;
        prevY = y;
      };
      const onMove = (x, y) => {
        if (!dragging) return;
        const dx = x - prevX;
        const dy = y - prevY;
        this.pivot.rotation.y += dx * 0.012;
        this.pivot.rotation.x = Math.max(-0.7, Math.min(0.7, this.pivot.rotation.x + dy * 0.008));
        prevX = x;
        prevY = y;
      };
      const onUp = () => {
        dragging = false;
      };

      this.canvas.addEventListener("mousedown", (e) => onDown(e.clientX, e.clientY));
      window.addEventListener("mousemove", (e) => onMove(e.clientX, e.clientY));
      window.addEventListener("mouseup", onUp);

      this.canvas.addEventListener("touchstart", (e) => {
        if (e.touches[0]) onDown(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });
      this.canvas.addEventListener("touchmove", (e) => {
        if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });
      this.canvas.addEventListener("touchend", onUp);
    }

    render() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        if (this.canvas.width !== Math.floor(rect.width) || this.canvas.height !== Math.floor(rect.height)) {
          this.renderer.setSize(rect.width, rect.height, false);
          this.camera.aspect = rect.width / rect.height;
          this.camera.updateProjectionMatrix();
        }
      }
      const auto = this.isPlayer ? state.playerAutoRotate : state.entityAutoRotate;
      if (auto) {
        this.pivot.rotation.y += 0.015;
      }
      this.renderer.render(this.scene, this.camera);
    }
  }

  // ARCHETYPE 3D MODEL FACTORY (Cute Ball, Runner Person, Bird/Vulture, Car/Police)
  function createArchetypeMesh(archetype, isPlayer, hexColor) {
    const group = new THREE.Group();
    const primaryMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hexColor),
      roughness: 0.25,
      metalness: 0.3
    });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.3 });
    const glowMat = new THREE.MeshBasicMaterial({ color: isPlayer ? 0x6ee7b7 : 0xf43f5e });

    if (archetype === "ball") {
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.45, 28, 28), primaryMat);
      group.add(sphere);
      // Cute eyes or sentinel spikes
      if (isPlayer) {
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), darkMat);
        const eyeR = eyeL.clone();
        eyeL.position.set(-0.15, 0.12, 0.4);
        eyeR.position.set(0.15, 0.12, 0.4);
        group.add(eyeL, eyeR);
      } else {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.04, 12, 24), glowMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
      }
    } else if (archetype === "runner") {
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.65, 16), primaryMat);
      torso.position.y = 0.05;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 20), primaryMat);
      head.position.y = 0.55;
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.09, 0.14), glowMat);
      visor.position.set(0, 0.55, 0.16);
      group.add(torso, head, visor);
    } else if (archetype === "bird") {
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.85, 16), primaryMat);
      body.rotation.x = Math.PI / 2;
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.05, 0.28), primaryMat);
      wingL.position.set(-0.35, 0.05, 0);
      const wingR = wingL.clone();
      wingR.position.x = 0.35;
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.25, 12), glowMat);
      beak.rotation.x = Math.PI / 2;
      beak.position.z = 0.5;
      group.add(body, wingL, wingR, beak);
    } else if (archetype === "car") {
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.24, 0.98), primaryMat);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.22, 0.48), darkMat);
      cabin.position.set(0, 0.2, -0.05);
      group.add(chassis, cabin);
      if (!isPlayer) {
        // Police siren bar
        const sirenL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.1), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
        const sirenR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.1), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        sirenL.position.set(-0.12, 0.34, -0.05);
        sirenR.position.set(0.12, 0.34, -0.05);
        group.add(sirenL, sirenR);
      }
    }
    return group;
  }

  // MAIN 3D & 2D LABYRINTH ENGINE
  const GRID_SIZE = 15; // Odd number for maze generation
  let mazeGrid = []; // 1 = wall, 0 = path
  let pellets = [];
  let obstacles = [];
  let drops = []; // shield, diamond, food, power
  let centerRelic = null;
  let exitGate = { x: GRID_SIZE - 2, z: GRID_SIZE - 2 };

  const player = {
    x: 1,
    z: 1,
    dirX: 0,
    dirZ: 0,
    nextDirX: 0,
    nextDirZ: 0,
    y: 0,
    vy: 0,
    jumping: false,
    mesh: null
  };

  let enemies = [];

  // THREE.JS MAIN SCENE
  const gameCanvas = document.getElementById("game-canvas");
  const retroCanvas = document.getElementById("retro-2d-canvas");
  const retroCtx = retroCanvas.getContext("2d");

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 220);
  const renderer = new THREE.WebGLRenderer({ canvas: gameCanvas, antialias: true });

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
  const sunLight = new THREE.DirectionalLight(0xfffbeb, 0.95);
  sunLight.position.set(16, 28, 18);
  scene.add(ambientLight, sunLight);

  const worldGroup = new THREE.Group();
  const biomeGroup = new THREE.Group();
  const mazeGroup = new THREE.Group();
  const itemsGroup = new THREE.Group();
  const projectionGroup = new THREE.Group();
  worldGroup.add(biomeGroup, mazeGroup, itemsGroup, projectionGroup);
  scene.add(worldGroup);

  // BUILD THE 12 INTERACTIVE 3D BIOMES SURROUNDING THE LABYRINTH
  function build3DBiomeEnvironment(biomeIdx) {
    while (biomeGroup.children.length) {
      biomeGroup.remove(biomeGroup.children[0]);
    }
    const b = BIOMES[biomeIdx];
    document.getElementById("hud-biome-name").textContent = b.name;

    // Base floor beneath maze
    const floorMat = new THREE.MeshStandardMaterial({ color: b.floor, roughness: 0.6, metalness: 0.2 });
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(24, 26, 0.8, 48), floorMat);
    floor.position.y = -0.9;
    biomeGroup.add(floor);

    const accentMat = new THREE.MeshStandardMaterial({ color: b.accent, emissive: b.accent, emissiveIntensity: 0.35 });
    const wallMat = new THREE.MeshStandardMaterial({ color: b.wall, roughness: 0.35, metalness: 0.45 });

    // Biome-specific architectural landmarks around the perimeter
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 15.5;
      const px = Math.cos(angle) * radius;
      const pz = Math.sin(angle) * radius;

      if (b.id === "royal" || b.id === "gothicbalcony") {
        // Fluted pillars & golden rings / lancet arches
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 6.5, 16), wallMat);
        pillar.position.set(px, 2.5, pz);
        const crown = new THREE.Mesh(new THREE.OctahedronGeometry(0.65), accentMat);
        crown.position.set(px, 6.4, pz);
        biomeGroup.add(pillar, crown);
      } else if (b.id === "cyberdrift" || b.id === "cyberterrace") {
        // Tilted neon drift rings & metropolis skyscrapers
        const tower = new THREE.Mesh(new THREE.BoxGeometry(2.2, 5 + (i % 3) * 3, 2.2), wallMat);
        tower.position.set(px, 2.5, pz);
        biomeGroup.add(tower);
        if (i < 2) {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(18, 0.22, 16, 64), accentMat);
          ring.rotation.x = Math.PI / 3 + i * 0.4;
          biomeGroup.add(ring);
        }
      } else if (b.id === "angelic") {
        // Cloud pillows, golden halos & pearl spires
        const cloud = new THREE.Mesh(new THREE.SphereGeometry(1.9, 16, 16), wallMat);
        cloud.position.set(px, 1.2, pz);
        const spire = new THREE.Mesh(new THREE.ConeGeometry(0.7, 5, 16), accentMat);
        spire.position.set(px, 4.2, pz);
        biomeGroup.add(cloud, spire);
      } else if (b.id === "lagoon" || b.id === "forest") {
        // Tropical palms / multi-tiered pine trees
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 3.5, 10), floorMat);
        trunk.position.set(px, 1.2, pz);
        const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.8, 3.6, 12), wallMat);
        canopy.position.set(px, 3.8, pz);
        biomeGroup.add(trunk, canopy);
      } else if (b.id === "lofi") {
        // Oversized steaming coffee mug & vinyl record turntable
        const mug = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.2, 2.8, 24), wallMat);
        mug.position.set(px, 1.2, pz);
        biomeGroup.add(mug);
      } else if (b.id === "gothiccastle") {
        // Crenelated corner turrets & glowing torch braziers
        const turret = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.4, 6, 12), wallMat);
        turret.position.set(px, 2.4, pz);
        const flame = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 12), accentMat);
        flame.position.set(px, 5.8, pz);
        biomeGroup.add(turret, flame);
      } else if (b.id === "desert") {
        // Ancient pyramids & sandstone mesas
        const pyramid = new THREE.Mesh(new THREE.ConeGeometry(2.6, 4.5, 4), wallMat);
        pyramid.position.set(px, 1.8, pz);
        biomeGroup.add(pyramid);
      } else if (b.id === "reef") {
        // Coral clusters & rising bubbles
        const coral = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5), accentMat);
        coral.position.set(px, 1.0, pz);
        biomeGroup.add(coral);
      } else if (b.id === "alpine") {
        // Snow-capped mountain range
        const mtn = new THREE.Mesh(new THREE.ConeGeometry(3.2, 6.8, 7), wallMat);
        mtn.position.set(px, 2.8, pz);
        biomeGroup.add(mtn);
      }
    }
  }

  // RANDOM SOLVABLE MAZE GENERATOR WITH HIGHLIGHTED EXIT GATES & OBSTACLES
  function generateRandomMaze() {
    mazeGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(1));

    function carve(cx, cz) {
      mazeGrid[cz][cx] = 0;
      const dirs = [
        [0, -2],
        [2, 0],
        [0, 2],
        [-2, 0]
      ].sort(() => Math.random() - 0.5);

      for (const [dx, dz] of dirs) {
        const nx = cx + dx;
        const nz = cz + dz;
        if (nx > 0 && nx < GRID_SIZE - 1 && nz > 0 && nz < GRID_SIZE - 1 && mazeGrid[nz][nx] === 1) {
          mazeGrid[cz + dz / 2][cx + dx / 2] = 0;
          carve(nx, nz);
        }
      }
    }

    carve(1, 1);

    // Add extra loops so the player has tactical routes around enemies
    for (let z = 2; z < GRID_SIZE - 2; z++) {
      for (let x = 2; x < GRID_SIZE - 2; x++) {
        if (mazeGrid[z][x] === 1 && Math.random() < 0.24) {
          mazeGrid[z][x] = 0;
        }
      }
    }

    // Clear center chamber for bonus item
    const mid = Math.floor(GRID_SIZE / 2);
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        mazeGrid[mid + dz][mid + dx] = 0;
      }
    }

    // Ensure exit gate cell is open
    exitGate = { x: GRID_SIZE - 2, z: GRID_SIZE - 2 };
    mazeGrid[exitGate.z][exitGate.x] = 0;
    mazeGrid[exitGate.z - 1][exitGate.x] = 0;
    mazeGrid[exitGate.z][exitGate.x - 1] = 0;
  }

  function gridToWorld(gx, gz) {
    const half = (GRID_SIZE - 1) / 2;
    return { wx: gx - half, wz: gz - half };
  }

  function rebuildMazeScene() {
    generateRandomMaze();
    build3DBiomeEnvironment(state.biomeIndex);

    while (mazeGroup.children.length) mazeGroup.remove(mazeGroup.children[0]);
    while (itemsGroup.children.length) itemsGroup.remove(itemsGroup.children[0]);

    pellets = [];
    obstacles = [];
    drops = [];
    state.exitUnlocked = false;
    document.getElementById("hud-gate-status").textContent = "LOCKED";
    document.getElementById("hud-gate-status").className = "gate-locked";

    const b = BIOMES[state.biomeIndex];
    const wallMat = new THREE.MeshStandardMaterial({
      color: b.wall,
      roughness: 0.3,
      metalness: 0.4
    });

    const pelletGeo = new THREE.SphereGeometry(0.13, 10, 10);
    const pelletMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 0.5 });

    for (let z = 0; z < GRID_SIZE; z++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const { wx, wz } = gridToWorld(x, z);
        if (mazeGrid[z][x] === 1) {
          const wall = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.85, 0.95), wallMat);
          wall.position.set(wx, 0.1, wz);
          mazeGroup.add(wall);
        } else if (!(x === 1 && z === 1) && !(x === exitGate.x && z === exitGate.z)) {
          // Place pellets, special drops, or jumpable hurdles
          const rand = Math.random();
          if (rand < 0.06 && (x > 2 || z > 2)) {
            // Jumpable Obstacle Hurdle (Spacebar to jump)
            const hurdle = new THREE.Mesh(
              new THREE.BoxGeometry(0.75, 0.32, 0.25),
              new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 0.4 })
            );
            hurdle.position.set(wx, -0.15, wz);
            itemsGroup.add(hurdle);
            obstacles.push({ x, z, mesh: hurdle });
          } else if (rand < 0.12) {
            // Special Drops: Shield, Diamond, Food, or Power-Up
            const types = ["shield", "diamond", "food", "power"];
            const type = types[Math.floor(Math.random() * types.length)];
            const colors = { shield: 0x38bdf8, diamond: 0xe879f9, food: 0x4ade80, power: 0xfacc15 };
            const dropMesh = new THREE.Mesh(
              new THREE.OctahedronGeometry(0.24),
              new THREE.MeshStandardMaterial({ color: colors[type], emissive: colors[type], emissiveIntensity: 0.65 })
            );
            dropMesh.position.set(wx, 0.1, wz);
            itemsGroup.add(dropMesh);
            drops.push({ x, z, type, mesh: dropMesh, active: true });
          } else {
            const pMesh = new THREE.Mesh(pelletGeo, pelletMat);
            pMesh.position.set(wx, 0.02, wz);
            itemsGroup.add(pMesh);
            pellets.push({ x, z, mesh: pMesh, active: true });
          }
        }
      }
    }

    // Center Bonus Relic
    const mid = Math.floor(GRID_SIZE / 2);
    const centerPos = gridToWorld(mid, mid);
    const relicMesh = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.22, 0.07, 48, 12),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xf43f5e, emissiveIntensity: 0.8 })
    );
    relicMesh.position.set(centerPos.wx, 0.2, centerPos.wz);
    itemsGroup.add(relicMesh);
    centerRelic = { x: mid, z: mid, mesh: relicMesh, active: true };

    // HIGHLIGHTED EXIT GATE PORTAL
    const gatePos = gridToWorld(exitGate.x, exitGate.z);
    const gateGroup = new THREE.Group();
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(0.52, 0.08, 16, 32),
      new THREE.MeshBasicMaterial({ color: 0x6ee7b7 })
    );
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 3.2, 18, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x6ee7b7, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    beacon.position.y = 1.4;
    gateGroup.add(arch, beacon);
    gateGroup.position.set(gatePos.wx, 0.2, gatePos.wz);
    itemsGroup.add(gateGroup);
    exitGate.mesh = gateGroup;

    // Player Reset
    player.x = 1;
    player.z = 1;
    player.dirX = 0;
    player.dirZ = 0;
    player.nextDirX = 0;
    player.nextDirZ = 0;
    player.y = 0;
    player.vy = 0;
    player.jumping = false;

    if (player.mesh) worldGroup.remove(player.mesh);
    player.mesh = createArchetypeMesh(state.archetype, true, state.playerColor);
    const pStart = gridToWorld(player.x, player.z);
    player.mesh.position.set(pStart.wx, 0, pStart.wz);
    worldGroup.add(player.mesh);

    // Spawn Pursuing Entities
    enemies.forEach((e) => worldGroup.remove(e.mesh));
    enemies = [];
    const spawnCoords = [
      [GRID_SIZE - 2, 1],
      [1, GRID_SIZE - 2],
      [mid, 1]
    ];
    spawnCoords.forEach(([ex, ez]) => {
      const eMesh = createArchetypeMesh(state.archetype, false, state.entityColor);
      const ePos = gridToWorld(ex, ez);
      eMesh.position.set(ePos.wx, 0, ePos.wz);
      worldGroup.add(eMesh);
      enemies.push({
        x: ex,
        z: ez,
        dirX: 0,
        dirZ: 1,
        mesh: eMesh,
        stunned: 0
      });
    });

    state.pelletsRemaining = pellets.length;
    updateHUD();
  }

  // PATH PROJECTION AHEAD OF AVATAR
  function updatePathProjection() {
    while (projectionGroup.children.length) {
      projectionGroup.remove(projectionGroup.children[0]);
    }
    if (!state.showProjection) return;

    const dx = player.nextDirX || player.dirX;
    const dz = player.nextDirZ || player.dirZ;
    if (dx === 0 && dz === 0) return;

    let cx = Math.round(player.x);
    let cz = Math.round(player.z);
    const dotGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 });

    for (let step = 1; step <= 6; step++) {
      const nx = cx + dx;
      const nz = cz + dz;
      if (nz <= 0 || nz >= GRID_SIZE - 1 || nx <= 0 || nx >= GRID_SIZE - 1 || mazeGrid[nz][nx] === 1) break;
      const { wx, wz } = gridToWorld(nx, nz);
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(wx, 0.08, wz);
      projectionGroup.add(dot);
      cx = nx;
      cz = nz;
    }
  }

  // DELAY (2s ON INITIATION) + 3-SECOND COUNTDOWN BEFORE START OR AFTER PAUSE
  let countdownInterval = null;
  function runCountdownSequence(isInitialLaunch, onComplete) {
    clearInterval(countdownInterval);
    state.inCountdown = true;
    const overlay = document.getElementById("countdown-overlay");
    const label = document.getElementById("countdown-label");
    const numEl = document.getElementById("countdown-number");
    overlay.classList.remove("hidden");

    const startThreeSecTimer = () => {
      let count = 3;
      label.textContent = "LABYRINTH ENGAGING IN";
      numEl.textContent = count;
      countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
          numEl.textContent = count;
        } else {
          clearInterval(countdownInterval);
          overlay.classList.add("hidden");
          state.inCountdown = false;
          if (onComplete) onComplete();
        }
      }, 1000);
    };

    if (isInitialLaunch) {
      // 2-second initiation delay before the 3-second countdown
      label.textContent = "SYNCHRONIZING SANCTUARY (2s)";
      numEl.textContent = "•••";
      setTimeout(startThreeSecTimer, 2000);
    } else {
      startThreeSecTimer();
    }
  }

  // HUD SYNCHRONIZATION
  function updateHUD() {
    document.getElementById("hud-score").textContent = state.score;
    document.getElementById("hud-time").textContent = formatTime(state.elapsedSeconds);
    document.getElementById("hud-level").textContent = state.level;
    document.getElementById("hud-health-text").textContent = `${Math.max(0, Math.round(state.health))}%`;
    document.getElementById("hud-health-fill").style.width = `${Math.max(0, state.health)}%`;
    document.getElementById("hud-shields").textContent = state.shields;
    document.getElementById("hud-diamonds").textContent = state.diamonds;
    document.getElementById("hud-power-timer").textContent =
      state.powerTimer > 0 ? `Empowered (${Math.ceil(state.powerTimer)}s)` : "Normal";
    document.getElementById("hud-ball-speed").textContent = `${state.ballSpeedMultiplier.toFixed(1)}x`;
    document.getElementById("hud-cycle-speed").textContent = `${state.skyCycleSpeed.toFixed(1)}x`;
    document.getElementById("hud-pellets-left").textContent = state.pelletsRemaining;
  }

  // PLAYER JUMP & MOVEMENT
  function triggerJump() {
    if (!player.jumping && state.running && !state.paused && !state.inCountdown) {
      player.jumping = true;
      player.vy = 6.2;
    }
  }

  function setDirection(dx, dz) {
    player.nextDirX = dx;
    player.nextDirZ = dz;
  }

  function canMoveTo(gx, gz) {
    if (gz < 0 || gz >= GRID_SIZE || gx < 0 || gx >= GRID_SIZE) return false;
    return mazeGrid[gz][gx] === 0;
  }

  // RETRO 2D PIXELATED RENDERER (When user switches to Retro 2D mode)
  function renderRetro2D() {
    const rect = retroCanvas.parentElement.getBoundingClientRect();
    if (retroCanvas.width !== Math.floor(rect.width) || retroCanvas.height !== Math.floor(rect.height)) {
      retroCanvas.width = Math.floor(rect.width);
      retroCanvas.height = Math.floor(rect.height);
    }
    const ctx = retroCtx;
    const b = BIOMES[state.biomeIndex];
    ctx.fillStyle = state.isNight ? "#090b16" : "#dbeafe";
    ctx.fillRect(0, 0, retroCanvas.width, retroCanvas.height);

    const tile = Math.min(retroCanvas.width, retroCanvas.height) / (GRID_SIZE + 2);
    const offsetX = (retroCanvas.width - tile * GRID_SIZE) / 2;
    const offsetY = (retroCanvas.height - tile * GRID_SIZE) / 2;

    for (let z = 0; z < GRID_SIZE; z++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const px = offsetX + x * tile;
        const py = offsetY + z * tile;
        if (mazeGrid[z][x] === 1) {
          ctx.fillStyle = "#" + b.wall.toString(16).padStart(6, "0");
          ctx.fillRect(px + 1, py + 1, tile - 2, tile - 2);
        }
      }
    }

    // Highlighted Exit Gate
    ctx.strokeStyle = "#6ee7b7";
    ctx.lineWidth = 3;
    ctx.strokeRect(offsetX + exitGate.x * tile + 3, offsetY + exitGate.z * tile + 3, tile - 6, tile - 6);

    // Pellets
    ctx.fillStyle = "#fde047";
    pellets.forEach((p) => {
      if (!p.active) return;
      ctx.beginPath();
      ctx.arc(offsetX + (p.x + 0.5) * tile, offsetY + (p.z + 0.5) * tile, tile * 0.14, 0, Math.PI * 2);
      ctx.fill();
    });

    // Drops
    drops.forEach((d) => {
      if (!d.active) return;
      const cmap = { shield: "#38bdf8", diamond: "#e879f9", food: "#4ade80", power: "#facc15" };
      ctx.fillStyle = cmap[d.type];
      ctx.fillRect(offsetX + (d.x + 0.25) * tile, offsetY + (d.z + 0.25) * tile, tile * 0.5, tile * 0.5);
    });

    // Obstacles
    ctx.fillStyle = "#f43f5e";
    obstacles.forEach((o) => {
      ctx.fillRect(offsetX + (o.x + 0.15) * tile, offsetY + (o.z + 0.35) * tile, tile * 0.7, tile * 0.3);
    });

    // Path Projection
    if (state.showProjection) {
      const dx = player.nextDirX || player.dirX;
      const dz = player.nextDirZ || player.dirZ;
      let cx = Math.round(player.x);
      let cz = Math.round(player.z);
      ctx.fillStyle = "rgba(56, 189, 248, 0.65)";
      for (let s = 1; s <= 5; s++) {
        if (!canMoveTo(cx + dx, cz + dz)) break;
        cx += dx;
        cz += dz;
        ctx.beginPath();
        ctx.arc(offsetX + (cx + 0.5) * tile, offsetY + (cz + 0.5) * tile, tile * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Player
    ctx.fillStyle = state.playerColor;
    ctx.beginPath();
    const jumpScale = player.jumping ? 0.48 : 0.36;
    ctx.arc(offsetX + (player.x + 0.5) * tile, offsetY + (player.z + 0.5) * tile, tile * jumpScale, 0, Math.PI * 2);
    ctx.fill();

    // Enemies
    enemies.forEach((e) => {
      ctx.fillStyle = state.powerTimer > 0 ? "#60a5fa" : state.entityColor;
      ctx.fillRect(offsetX + (e.x + 0.18) * tile, offsetY + (e.z + 0.18) * tile, tile * 0.64, tile * 0.64);
    });
  }

  // GAMEPLAY UPDATE TICK
  let lastTime = performance.now();
  const previewPlayerStudio = new PreviewStudio("player-preview-canvas", true);
  const previewEntityStudio = new PreviewStudio("entity-preview-canvas", false);

  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // Render 360° Preview Studios when Screen 2 is open
    if (document.getElementById("init-screen-2").classList.contains("active")) {
      previewPlayerStudio.render();
      previewEntityStudio.render();
    }

    // Update Celestial Day/Night Cycle
    const b = BIOMES[state.biomeIndex];
    if (state.running && !state.paused && !state.inCountdown) {
      state.skyPhaseValue += dt * 0.08 * state.skyCycleSpeed;
      const wave = (Math.sin(state.skyPhaseValue) + 1) / 2;
      state.isNight = wave < 0.5;
      document.getElementById("hud-sky-phase").textContent = state.isNight ? "Night" : "Day";
      const nightCol = new THREE.Color(b.skyNight);
      const dayCol = new THREE.Color(b.skyDay);
      scene.background = nightCol.lerp(dayCol, wave);
      sunLight.intensity = 0.35 + wave * 0.85;
    } else if (!scene.background) {
      scene.background = new THREE.Color(state.isNight ? b.skyNight : b.skyDay);
    }

    if (state.running && !state.paused && !state.inCountdown) {
      state.elapsedSeconds += dt;
      if (state.powerTimer > 0) {
        state.powerTimer = Math.max(0, state.powerTimer - dt);
        if (state.powerTimer === 0) state.comboCount = 0;
      }

      // Jump Physics
      if (player.jumping) {
        player.y += player.vy * dt;
        player.vy -= 16 * dt;
        if (player.y <= 0) {
          player.y = 0;
          player.vy = 0;
          player.jumping = false;
        }
      }

      // Smooth Grid Movement
      const speed = 4.2 * state.ballSpeedMultiplier;
      const snapX = Math.round(player.x);
      const snapZ = Math.round(player.z);
      const nearCenter = Math.hypot(player.x - snapX, player.z - snapZ) < 0.16;

      if (nearCenter) {
        if (
          (player.nextDirX !== 0 || player.nextDirZ !== 0) &&
          canMoveTo(snapX + player.nextDirX, snapZ + player.nextDirZ)
        ) {
          player.x = snapX;
          player.z = snapZ;
          player.dirX = player.nextDirX;
          player.dirZ = player.nextDirZ;
        } else if (!canMoveTo(snapX + player.dirX, snapZ + player.dirZ)) {
          player.x = snapX;
          player.z = snapZ;
          player.dirX = 0;
          player.dirZ = 0;
        }
      }

      player.x += player.dirX * speed * dt;
      player.z += player.dirZ * speed * dt;

      const pWorld = gridToWorld(player.x, player.z);
      player.mesh.position.set(pWorld.wx, player.y, pWorld.wz);
      if (player.dirX !== 0 || player.dirZ !== 0) {
        player.mesh.rotation.y = Math.atan2(player.dirX, player.dirZ);
      }

      updatePathProjection();

      // Collect Pellets
      pellets.forEach((p) => {
        if (p.active && Math.hypot(player.x - p.x, player.z - p.z) < 0.45) {
          p.active = false;
          p.mesh.visible = false;
          state.score += 10;
          state.pelletsRemaining--;
          if (state.pelletsRemaining <= 0 && !state.exitUnlocked) {
            state.exitUnlocked = true;
            document.getElementById("hud-gate-status").textContent = "OPEN — ENTER GATE";
            document.getElementById("hud-gate-status").className = "gate-open";
          }
        }
      });

      // Collect Drops (Shield, Diamond, Food, Power)
      drops.forEach((d) => {
        if (d.active) {
          d.mesh.rotation.y += dt * 2.5;
          if (Math.hypot(player.x - d.x, player.z - d.z) < 0.5) {
            d.active = false;
            d.mesh.visible = false;
            if (d.type === "shield") state.shields++;
            if (d.type === "diamond") state.diamonds++;
            if (d.type === "food") state.health = Math.min(100, state.health + 30);
            if (d.type === "power") {
              state.powerTimer = 8;
              state.comboCount = 0;
            }
            state.score += 50;
          }
        }
      });

      // Collect Center Bonus Relic
      if (centerRelic && centerRelic.active) {
        centerRelic.mesh.rotation.y += dt * 3;
        if (Math.hypot(player.x - centerRelic.x, player.z - centerRelic.z) < 0.55) {
          centerRelic.active = false;
          centerRelic.mesh.visible = false;
          state.score += 500;
        }
      }

      // Check Obstacles (Must Jump with Spacebar)
      obstacles.forEach((o) => {
        if (Math.hypot(player.x - o.x, player.z - o.z) < 0.38 && player.y < 0.25) {
          applyDamage(18 * dt * 3);
        }
      });

      // Check Highlighted Exit Gate for Next Level
      if (
        (state.exitUnlocked || state.pelletsRemaining <= Math.floor(pellets.length * 0.25)) &&
        Math.hypot(player.x - exitGate.x, player.z - exitGate.z) < 0.55
      ) {
        state.level++;
        state.score += 1000;
        saveProgress(true);
        rebuildMazeScene();
      }

      // Move Pursuing Entities
      enemies.forEach((e) => {
        if (e.stunned > 0) {
          e.stunned -= dt;
          return;
        }
        const eSpeed = (state.powerTimer > 0 ? 1.9 : 2.8) + state.level * 0.15;
        const exSnap = Math.round(e.x);
        const ezSnap = Math.round(e.z);

        if (Math.hypot(e.x - exSnap, e.z - ezSnap) < 0.12) {
          const possible = [
            [0, -1],
            [1, 0],
            [0, 1],
            [-1, 0]
          ].filter(([dx, dz]) => canMoveTo(exSnap + dx, ezSnap + dz));

          if (possible.length > 0) {
            const nonReverse = possible.filter(([dx, dz]) => !(dx === -e.dirX && dz === -e.dirZ));
            const choices = nonReverse.length > 0 ? nonReverse : possible;
            // Steer toward player (or away if player is empowered)
            choices.sort((a, b) => {
              const distA = Math.hypot(exSnap + a[0] - player.x, ezSnap + a[1] - player.z);
              const distB = Math.hypot(exSnap + b[0] - player.x, ezSnap + b[1] - player.z);
              return state.powerTimer > 0 ? distB - distA : distA - distB;
            });
            const pick = Math.random() < 0.72 ? choices[0] : choices[Math.floor(Math.random() * choices.length)];
            e.x = exSnap;
            e.z = ezSnap;
            e.dirX = pick[0];
            e.dirZ = pick[1];
          }
        }

        e.x += e.dirX * eSpeed * dt;
        e.z += e.dirZ * eSpeed * dt;
        const ew = gridToWorld(e.x, e.z);
        e.mesh.position.set(ew.wx, 0, ew.wz);

        // Collision with Player
        if (Math.hypot(player.x - e.x, player.z - e.z) < 0.52 && player.y < 0.45) {
          if (state.powerTimer > 0) {
            // Escalating points for defeating multiple enemies in a row
            state.comboCount++;
            const pts = 200 * Math.pow(2, state.comboCount - 1);
            state.score += pts;
            e.x = GRID_SIZE - 2;
            e.z = 1;
            e.stunned = 3;
          } else {
            applyDamage(34);
            e.stunned = 1.5;
          }
        }
      });

      updateHUD();
    }

    // Camera Follow & Render
    const rect = gameCanvas.parentElement.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      if (gameCanvas.width !== Math.floor(rect.width) || gameCanvas.height !== Math.floor(rect.height)) {
        const scale = state.renderStyle === "retro" ? 0.35 : 1;
        renderer.setSize(rect.width * scale, rect.height * scale, false);
        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();
      }
    }

    if (player.mesh) {
      camera.position.lerp(
        new THREE.Vector3(player.mesh.position.x * 0.55, 13.5, player.mesh.position.z * 0.55 + 10.5),
        0.08
      );
      camera.lookAt(player.mesh.position.x * 0.3, 0, player.mesh.position.z * 0.3);
    }

    if (state.renderStyle === "retro") {
      renderRetro2D();
    } else {
      renderer.render(scene, camera);
    }
  }

  function applyDamage(amount) {
    if (state.shields > 0 && amount >= 15) {
      state.shields--;
      updateHUD();
      return;
    }
    state.health -= amount;
    if (state.health <= 0) {
      state.health = 0;
      state.paused = true;
      saveProgress(false);
      const reviveBtn = document.getElementById("revive-diamond-btn");
      if (state.diamonds > 0) {
        reviveBtn.classList.remove("hidden");
        reviveBtn.textContent = `Use 1 Diamond to Revive (${state.diamonds} Left)`;
      } else {
        reviveBtn.classList.add("hidden");
      }
      document.getElementById("gameover-modal").classList.add("active");
    }
    updateHUD();
  }

  // UI POPULATION & EVENT WIRING
  function populateBiomesAndSwatches() {
    const biomeGrid = document.getElementById("biome-grid");
    const pauseBiomeGrid = document.getElementById("pause-biome-grid");
    biomeGrid.innerHTML = "";
    pauseBiomeGrid.innerHTML = "";

    BIOMES.forEach((b, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `biome-btn ${idx === state.biomeIndex ? "active" : ""}`;
      btn.textContent = `${idx + 1}. ${b.name}`;
      btn.addEventListener("click", () => selectBiome(idx));
      biomeGrid.appendChild(btn);

      const pBtn = btn.cloneNode(true);
      pBtn.addEventListener("click", () => selectBiome(idx));
      pauseBiomeGrid.appendChild(pBtn);
    });

    const pSwatches = document.getElementById("player-color-swatches");
    const eSwatches = document.getElementById("entity-color-swatches");
    pSwatches.innerHTML = "";
    eSwatches.innerHTML = "";

    SWATCH_COLORS.forEach((hex) => {
      const s1 = document.createElement("button");
      s1.type = "button";
      s1.className = `color-swatch ${hex === state.playerColor ? "active" : ""}`;
      s1.style.background = hex;
      s1.addEventListener("click", () => {
        state.playerColor = hex;
        Array.from(pSwatches.children).forEach((c) => c.classList.remove("active"));
        s1.classList.add("active");
        previewPlayerStudio.rebuildMesh();
      });
      pSwatches.appendChild(s1);

      const s2 = document.createElement("button");
      s2.type = "button";
      s2.className = `color-swatch ${hex === state.entityColor ? "active" : ""}`;
      s2.style.background = hex;
      s2.addEventListener("click", () => {
        state.entityColor = hex;
        Array.from(eSwatches.children).forEach((c) => c.classList.remove("active"));
        s2.classList.add("active");
        previewEntityStudio.rebuildMesh();
      });
      eSwatches.appendChild(s2);
    });
  }

  function selectBiome(idx) {
    state.biomeIndex = idx;
    document.querySelectorAll("#biome-grid .biome-btn").forEach((b, i) => b.classList.toggle("active", i === idx));
    document.querySelectorAll("#pause-biome-grid .biome-btn").forEach((b, i) => b.classList.toggle("active", i === idx));
    build3DBiomeEnvironment(idx);
  }

  function toggleGraphicsStyle() {
    state.renderStyle = state.renderStyle === "modern" ? "retro" : "modern";
    const label = state.renderStyle === "modern" ? "Modern 3D" : "Retro Pixel 2D";
    document.getElementById("render-style-toggle-init").textContent = `Graphics: ${label}`;
    document.getElementById("hud-graphics-btn").textContent = `Mode: ${label}`;
    if (state.renderStyle === "retro") {
      gameCanvas.classList.add("hidden");
      retroCanvas.classList.remove("hidden");
    } else {
      retroCanvas.classList.add("hidden");
      gameCanvas.classList.remove("hidden");
    }
  }

  // Screen 1 -> Screen 2 Navigation
  function chooseControlMode(mode) {
    state.controlMode = mode;
    document.getElementById("selected-device-badge").textContent =
      mode === "touch" ? "Touch Mode" : "Keyboard Mode";
    document.getElementById("hud-touch-card").classList.toggle("ui-hidden", mode === "keyboard");
    document.getElementById("init-screen-1").classList.remove("active");
    document.getElementById("init-screen-2").classList.add("active");
  }

  document.getElementById("select-touch-btn").addEventListener("click", () => chooseControlMode("touch"));
  document.getElementById("select-keyboard-btn").addEventListener("click", () => chooseControlMode("keyboard"));
  document.getElementById("back-to-screen1-btn").addEventListener("click", () => {
    document.getElementById("init-screen-2").classList.remove("active");
    document.getElementById("init-screen-1").classList.add("active");
  });

  // Archetype Buttons
  document.querySelectorAll("#archetype-grid .chip-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#archetype-grid .chip-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.archetype = btn.dataset.archetype;
      previewPlayerStudio.rebuildMesh();
      previewEntityStudio.rebuildMesh();
    });
  });

  // Auto-Rotate Toggles
  document.getElementById("player-autorotate-btn").addEventListener("click", (e) => {
    state.playerAutoRotate = !state.playerAutoRotate;
    e.currentTarget.textContent = `Auto-Rotate: ${state.playerAutoRotate ? "ON" : "OFF"}`;
  });
  document.getElementById("entity-autorotate-btn").addEventListener("click", (e) => {
    state.entityAutoRotate = !state.entityAutoRotate;
    e.currentTarget.textContent = `Auto-Rotate: ${state.entityAutoRotate ? "ON" : "OFF"}`;
  });

  // Theme, Graphics & Sky Toggles
  document.getElementById("theme-toggle-init").addEventListener("click", toggleThemeWithPlagueSpread);
  document.getElementById("hud-theme-btn").addEventListener("click", toggleThemeWithPlagueSpread);
  document.getElementById("pause-theme-btn").addEventListener("click", toggleThemeWithPlagueSpread);

  document.getElementById("render-style-toggle-init").addEventListener("click", toggleGraphicsStyle);
  document.getElementById("hud-graphics-btn").addEventListener("click", toggleGraphicsStyle);
  document.getElementById("pause-graphics-btn").addEventListener("click", toggleGraphicsStyle);

  const toggleDayNightPreset = () => {
    state.isNight = !state.isNight;
    state.skyPhaseValue = state.isNight ? -Math.PI / 2 : Math.PI / 2;
    document.getElementById("daynight-toggle-init").textContent = `Sky: ${state.isNight ? "Night" : "Day"}`;
    document.getElementById("hud-sky-phase").textContent = state.isNight ? "Night" : "Day";
  };
  document.getElementById("daynight-toggle-init").addEventListener("click", toggleDayNightPreset);
  document.getElementById("pause-daynight-btn").addEventListener("click", toggleDayNightPreset);

  document.getElementById("hud-projection-btn").addEventListener("click", (e) => {
    state.showProjection = !state.showProjection;
    e.currentTarget.textContent = `Path Projection: ${state.showProjection ? "ON" : "OFF"}`;
  });

  // Launch Game from Screen 2
  document.getElementById("launch-aeternus-btn").addEventListener("click", () => {
    document.getElementById("init-screen-2").classList.remove("active");
    state.score = 0;
    state.elapsedSeconds = 0;
    state.level = 1;
    state.health = 100;
    state.shields = 1;
    state.diamonds = 1;
    rebuildMazeScene();
    state.running = true;
    state.paused = false;
    runCountdownSequence(true);
  });

  // Resume Saved Game from Screen 1
  document.getElementById("resume-saved-btn").addEventListener("click", () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.savedSession) {
      Object.assign(state, data.savedSession);
      document.getElementById("init-screen-1").classList.remove("active");
      rebuildMazeScene();
      state.running = true;
      state.paused = false;
      runCountdownSequence(false);
    }
  });

  // Individual UI Hide & Simultaneous Unhide All (With Smooth Vertical Reflow)
  const unhideAllBtn = document.getElementById("unhide-all-ui-btn");
  document.querySelectorAll(".hide-module-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.target);
      if (target) {
        target.classList.add("ui-hidden");
        unhideAllBtn.classList.remove("hidden");
      }
    });
  });

  unhideAllBtn.addEventListener("click", () => {
    document.querySelectorAll(".hud-module.ui-hidden").forEach((mod) => {
      mod.classList.remove("ui-hidden");
    });
    unhideAllBtn.classList.add("hidden");
  });

  // Pause, Save, Customize & Resume Flow
  document.getElementById("hud-pause-btn").addEventListener("click", () => {
    if (!state.running || state.inCountdown) return;
    state.paused = true;
    saveProgress(true);
    document.getElementById("pause-modal").classList.add("active");
  });

  document.getElementById("resume-game-btn").addEventListener("click", () => {
    document.getElementById("pause-modal").classList.remove("active");
    runCountdownSequence(false, () => {
      state.paused = false;
    });
  });

  document.getElementById("open-customizer-btn").addEventListener("click", () => {
    saveProgress(true);
    document.getElementById("pause-modal").classList.remove("active");
    document.getElementById("init-screen-2").classList.add("active");
  });

  document.getElementById("save-exit-home-btn").addEventListener("click", () => {
    saveProgress(true);
    state.running = false;
    document.getElementById("pause-modal").classList.remove("active");
    document.getElementById("saved-session-banner").classList.remove("hidden");
    document.getElementById("init-screen-1").classList.add("active");
  });

  // Revive with Diamond or Restart
  document.getElementById("revive-diamond-btn").addEventListener("click", () => {
    if (state.diamonds > 0) {
      state.diamonds--;
      state.health = 100;
      document.getElementById("gameover-modal").classList.remove("active");
      runCountdownSequence(false, () => {
        state.paused = false;
      });
    }
  });

  document.getElementById("restart-stage-btn").addEventListener("click", () => {
    document.getElementById("gameover-modal").classList.remove("active");
    state.score = 0;
    state.elapsedSeconds = 0;
    state.health = 100;
    state.shields = 1;
    rebuildMazeScene();
    runCountdownSequence(false, () => {
      state.paused = false;
    });
  });

  document.getElementById("gameover-home-btn").addEventListener("click", () => {
    document.getElementById("gameover-modal").classList.remove("active");
    state.running = false;
    document.getElementById("init-screen-1").classList.add("active");
  });

  // Speed & Cycle Acceleration Controls (W/S for Sky Cycle, A/D for Ball Speed)
  function adjustBallSpeed(delta) {
    state.ballSpeedMultiplier = Math.max(0.5, Math.min(2.5, state.ballSpeedMultiplier + delta));
    updateHUD();
  }
  function adjustSkyCycle(delta) {
    state.skyCycleSpeed = Math.max(0.2, Math.min(4.0, state.skyCycleSpeed + delta));
    updateHUD();
  }

  document.getElementById("btn-speed-up").addEventListener("click", () => adjustBallSpeed(0.2));
  document.getElementById("btn-speed-down").addEventListener("click", () => adjustBallSpeed(-0.2));
  document.getElementById("btn-cycle-up").addEventListener("click", () => adjustSkyCycle(0.3));
  document.getElementById("btn-cycle-down").addEventListener("click", () => adjustSkyCycle(-0.3));

  // Keyboard Listeners
  window.addEventListener("keydown", (e) => {
    if (e.code === "ArrowUp") { e.preventDefault(); setDirection(0, -1); }
    else if (e.code === "ArrowDown") { e.preventDefault(); setDirection(0, 1); }
    else if (e.code === "ArrowLeft") { e.preventDefault(); setDirection(-1, 0); }
    else if (e.code === "ArrowRight") { e.preventDefault(); setDirection(1, 0); }
    else if (e.code === "Space") { e.preventDefault(); triggerJump(); }
    else if (e.key === "a" || e.key === "A") adjustBallSpeed(0.2);
    else if (e.key === "d" || e.key === "D") adjustBallSpeed(-0.2);
    else if (e.key === "w" || e.key === "W") adjustSkyCycle(0.3);
    else if (e.key === "s" || e.key === "S") adjustSkyCycle(-0.3);
    else if (e.code === "Escape" && state.running) {
      document.getElementById("hud-pause-btn").click();
    }
  });

  // Touch Controller Pad Listeners
  document.getElementById("touch-up").addEventListener("click", () => setDirection(0, -1));
  document.getElementById("touch-down").addEventListener("click", () => setDirection(0, 1));
  document.getElementById("touch-left").addEventListener("click", () => setDirection(-1, 0));
  document.getElementById("touch-right").addEventListener("click", () => setDirection(1, 0));
  document.getElementById("touch-jump").addEventListener("click", triggerJump);

  // Initialize App
  populateBiomesAndSwatches();
  loadRecords();
  requestAnimationFrame(animate);
})();
