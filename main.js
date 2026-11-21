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
    difficulty: "hard", // 'easy' (1) | 'medium' (2) | 'hard' (3) | 'impossible' (4)
    enemyCount: 3,
    topCameraMode: false,
    camYawOffset: 0,
    camPitchOffset: 0,
    camZoomOffset: 0,

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
    storedDiamonds: 1,
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
      if (typeof data.storedDiamonds === "number") {
        state.storedDiamonds = Math.max(0, data.storedDiamonds);
        state.diamonds = state.storedDiamonds;
      }
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
      state.storedDiamonds = Math.max(0, state.diamonds);
      const payload = {
        highScore: Math.max(state.highScore, state.score),
        highTime: Math.max(state.highTime, Math.floor(state.elapsedSeconds)),
        storedDiamonds: state.storedDiamonds,
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
              controlMode: state.controlMode,
              difficulty: state.difficulty,
              enemyCount: state.enemyCount
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
    const initDia = document.getElementById("init-diamonds");
    if (initDia) initDia.textContent = state.diamonds;
    const hudStoredDia = document.getElementById("hud-stored-diamonds");
    if (hudStoredDia) hudStoredDia.textContent = state.diamonds;
  }

  // Helper to trigger the upper-left blurred plague spread on any selected button
  function triggerButtonPlagueSpread(btn) {
    if (!btn) return;
    const isLight = state.theme === "light";
    btn.style.setProperty("--btn-plague-color", isLight ? "rgba(13, 16, 27, 0.92)" : "rgba(255, 255, 255, 0.95)");
    btn.classList.remove("plague-select");
    void btn.offsetWidth;
    btn.classList.add("plague-select");
  }

  // PLAGUE-STYLE TOP-LEFT BLURRED SPREAD THEME TRANSITION FOR EACH UI CARD INDIVIDUALLY
  function toggleThemeWithPlagueSpread() {
    state.theme = state.theme === "dark" ? "light" : "dark";
    const globalWave = document.getElementById("global-plague-wave");
    if (globalWave) {
      globalWave.style.setProperty(
        "--wave-core",
        state.theme === "light" ? "rgba(255, 255, 255, 0.95)" : "rgba(13, 16, 27, 0.95)"
      );
      globalWave.style.setProperty(
        "--wave-mid",
        state.theme === "light" ? "rgba(224, 231, 255, 0.78)" : "rgba(30, 27, 75, 0.78)"
      );
      globalWave.classList.remove("active-wave");
      void globalWave.offsetWidth;
      globalWave.classList.add("active-wave");
    }
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

    document.querySelectorAll(".biome-btn.active, .chip-btn.active, .mini-pill.active").forEach((btn) => {
      triggerButtonPlagueSpread(btn);
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

      // Decorative rim ring on pedestal so the full base looks grounded and framed
      this.pedestalRim = new THREE.Mesh(
        new THREE.TorusGeometry(1.22, 0.035, 12, 48),
        new THREE.MeshStandardMaterial({ color: 0x6ee7b7, emissive: 0x6ee7b7, emissiveIntensity: 0.35 })
      );
      this.pedestalRim.rotation.x = Math.PI / 2;
      this.pedestalRim.position.y = -0.58;
      this.pedestal.position.y = -0.58;
      this.scene.add(this.pedestalRim);

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
      mesh.scale.setScalar(1.12);
      mesh.position.y = 0.05;
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
          // Frame both the top of the model and 100% of the pedestal base on any aspect ratio
          const aspectFactor = Math.max(1, 1.15 / Math.max(0.45, this.camera.aspect));
          this.camera.position.set(0, 1.05, 4.9 * aspectFactor);
          this.camera.lookAt(0, -0.1, 0);
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

  // REALISTIC & AESTHETIC ARCHETYPE 3D MODEL FACTORY
  function buildRealisticArchetypeMesh(archetype, isPlayer, hexColor) {
    const group = new THREE.Group();
    const primaryColor = new THREE.Color(hexColor);
    const primaryMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      roughness: 0.22,
      metalness: 0.35
    });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.85 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.35, metalness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      roughness: 0.08,
      metalness: 0.9,
      transparent: true,
      opacity: 0.72
    });
    const glowMat = new THREE.MeshBasicMaterial({ color: isPlayer ? 0x6ee7b7 : 0xf43f5e });

    if (archetype === "ball") {
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 32), primaryMat);
      group.add(core);
      if (isPlayer) {
        // Expressive glossy eyes with white highlights, blush cheeks & floating crown halo
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), darkMat);
        const eyeR = eyeL.clone();
        eyeL.position.set(-0.14, 0.1, 0.37);
        eyeR.position.set(0.14, 0.1, 0.37);
        const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        const pupilR = pupilL.clone();
        pupilL.position.set(-0.12, 0.13, 0.43);
        pupilR.position.set(0.16, 0.13, 0.43);
        const blushMat = new THREE.MeshBasicMaterial({ color: 0xfda4af });
        const blushL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), blushMat);
        const blushR = blushL.clone();
        blushL.scale.set(1.3, 0.7, 0.5);
        blushR.scale.set(1.3, 0.7, 0.5);
        blushL.position.set(-0.23, 0.0, 0.34);
        blushR.position.set(0.23, 0.0, 0.34);
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.03, 12, 32), glowMat);
        halo.rotation.x = Math.PI / 2;
        halo.position.y = 0.52;
        group.add(eyeL, eyeR, pupilL, pupilR, blushL, blushR, halo);
      } else {
        // Multi-ring gyroscopic Sentinel with forward-facing scanner eye
        const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.035, 14, 36), chromeMat);
        ring1.rotation.x = Math.PI / 2;
        const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.025, 12, 32), glowMat);
        ring2.rotation.y = Math.PI / 2;
        const scanner = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.18, 20), glowMat);
        scanner.rotation.x = Math.PI / 2;
        scanner.position.set(0, 0.06, 0.38);
        group.add(ring1, ring2, scanner);
      }
    } else if (archetype === "runner") {
      // Articulated Humanoid Runner / Shadow Entity facing +Z
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.44, 18), primaryMat);
      torso.position.y = 0.06;
      const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.22), chromeMat);
      chestPlate.position.set(0, 0.12, 0.02);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 24), primaryMat);
      head.position.y = 0.45;
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.14), isPlayer ? glassMat : glowMat);
      visor.position.set(0, 0.46, 0.13);

      const limbGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.34, 12);
      const armL = new THREE.Mesh(limbGeo, primaryMat);
      const armR = new THREE.Mesh(limbGeo, primaryMat);
      armL.position.set(-0.24, 0.08, 0.05);
      armR.position.set(0.24, 0.08, -0.05);
      armL.rotation.x = -0.35;
      armR.rotation.x = 0.35;

      const legL = new THREE.Mesh(limbGeo, darkMat);
      const legR = new THREE.Mesh(limbGeo, darkMat);
      legL.position.set(-0.1, -0.26, -0.05);
      legR.position.set(0.1, -0.26, 0.06);
      legL.rotation.x = 0.32;
      legR.rotation.x = -0.32;

      group.userData.limbs = { armL, armR, legL, legR };
      group.add(torso, chestPlate, head, visor, armL, armR, legL, legR);

      if (!isPlayer) {
        // Shadow entity horns & shoulder spikes
        const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 10), glowMat);
        const hornR = hornL.clone();
        hornL.position.set(-0.12, 0.65, 0);
        hornR.position.set(0.12, 0.65, 0);
        hornL.rotation.z = 0.3;
        hornR.rotation.z = -0.3;
        group.add(hornL, hornR);
      }
    } else if (archetype === "bird") {
      // Sculpted Avian Songbird / Vulture Raptor facing +Z
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 24), primaryMat);
      body.scale.set(0.95, 0.85, 1.45);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 20), isPlayer ? primaryMat : chromeMat);
      head.position.set(0, 0.18, 0.32);

      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), darkMat);
      const eyeR = eyeL.clone();
      eyeL.position.set(-0.12, 0.22, 0.42);
      eyeR.position.set(0.12, 0.22, 0.42);

      // Curved/sculpted beak facing forward (+Z)
      const beakMat = new THREE.MeshStandardMaterial({ color: isPlayer ? 0xfacc15 : 0xf43f5e, roughness: 0.3 });
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.26, 14), beakMat);
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 0.16, 0.54);

      // Layered multi-feather wings
      const wingL = new THREE.Group();
      const wingR = new THREE.Group();
      const innerWingGeo = new THREE.BoxGeometry(0.45, 0.04, 0.26);
      const outerWingGeo = new THREE.BoxGeometry(0.36, 0.03, 0.2);
      const wInL = new THREE.Mesh(innerWingGeo, primaryMat);
      wInL.position.set(-0.22, 0, 0);
      const wOutL = new THREE.Mesh(outerWingGeo, isPlayer ? chromeMat : darkMat);
      wOutL.position.set(-0.52, 0.02, -0.04);
      wOutL.rotation.y = 0.22;
      wingL.add(wInL, wOutL);
      wingL.position.set(-0.12, 0.08, 0.02);

      const wInR = new THREE.Mesh(innerWingGeo, primaryMat);
      wInR.position.set(0.22, 0, 0);
      const wOutR = new THREE.Mesh(outerWingGeo, isPlayer ? chromeMat : darkMat);
      wOutR.position.set(0.52, 0.02, -0.04);
      wOutR.rotation.y = -0.22;
      wingR.add(wInR, wOutR);
      wingR.position.set(0.12, 0.08, 0.02);

      // Fanned tail feathers at -Z
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.035, 0.28), isPlayer ? chromeMat : darkMat);
      tail.position.set(0, 0.04, -0.44);
      tail.rotation.x = 0.22;

      group.userData.wings = { wingL, wingR };
      group.add(body, head, eyeL, eyeR, beak, wingL, wingR, tail);
    } else if (archetype === "car") {
      // Realistic Aerodynamic Sports Racer / Police Interceptor facing +Z
      const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.18, 1.08), primaryMat);
      lowerBody.position.y = -0.04;

      // Sculpted hood & cabin with windshield
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.2, 0.52), isPlayer ? darkMat : chromeMat);
      cabin.position.set(0, 0.14, -0.04);
      const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 0.18), glassMat);
      windshield.position.set(0, 0.15, 0.2);
      windshield.rotation.x = -0.35;

      // Rear aerodynamic wing spoiler at -Z
      const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.14), darkMat);
      spoilerWing.position.set(0, 0.22, -0.48);

      // Glowing Headlights at +Z & Taillight strip at -Z
      const headLightMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
      const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.04), headLightMat);
      const hlR = hlL.clone();
      hlL.position.set(-0.21, -0.01, 0.54);
      hlR.position.set(0.21, -0.01, 0.54);

      const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const tailBar = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.05, 0.04), tailLightMat);
      tailBar.position.set(0, 0.0, -0.54);

      // 4 Detailed Alloy Wheels with Rims
      const wheelGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.09, 20);
      wheelGeo.rotateZ(Math.PI / 2);
      const rimGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.096, 12);
      rimGeo.rotateZ(Math.PI / 2);
      const wheelPositions = [
        [-0.33, -0.13, 0.33],
        [0.33, -0.13, 0.33],
        [-0.33, -0.13, -0.33],
        [0.33, -0.13, -0.33]
      ];
      wheelPositions.forEach(([wx, wy, wz]) => {
        const tire = new THREE.Mesh(wheelGeo, darkMat);
        const rim = new THREE.Mesh(rimGeo, chromeMat);
        tire.position.set(wx, wy, wz);
        rim.position.set(wx, wy, wz);
        group.add(tire, rim);
      });

      group.add(lowerBody, cabin, windshield, spoilerWing, hlL, hlR, tailBar);

      if (!isPlayer) {
        // Police Cruiser lightbar & front bullbar at +Z
        const bullbar = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.14, 0.06), darkMat);
        bullbar.position.set(0, -0.05, 0.57);
        const sirenBase = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.04, 0.12), chromeMat);
        sirenBase.position.set(0, 0.26, -0.02);
        const sirenBlue = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.1), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
        const sirenRed = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.1), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        sirenBlue.position.set(-0.12, 0.29, -0.02);
        sirenRed.position.set(0.12, 0.29, -0.02);
        group.userData.sirens = { sirenBlue, sirenRed };
        group.add(bullbar, sirenBase, sirenBlue, sirenRed);
      }
    }
    return group;
  }

  // ARCHETYPE 3D MODEL FACTORY (Cute Ball, Runner Person, Bird/Vulture, Car/Police)
  function createArchetypeMesh(archetype, isPlayer, hexColor) {
    if (typeof buildRealisticArchetypeMesh === "function") {
      return buildRealisticArchetypeMesh(archetype, isPlayer, hexColor);
    }
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
    mesh: null,
    targetX: 1,
    targetZ: 1,
    visualAngle: 0
  };

  let enemies = [];
  let biomeAnimatedProps = [];

  // THREE.JS MAIN SCENE
  const gameCanvas = document.getElementById("game-canvas");
  const retroCanvas = document.getElementById("retro-2d-canvas");
  const retroCtx = retroCanvas.getContext("2d");

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 220);
  const renderer = new THREE.WebGLRenderer({ canvas: gameCanvas, antialias: true });
  renderer.shadowMap.enabled = true;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
  const sunLight = new THREE.DirectionalLight(0xfffbeb, 0.95);
  sunLight.position.set(16, 28, 18);
  const rimLight = new THREE.PointLight(0xd8b4fe, 0.85, 65);
  rimLight.position.set(-14, 15, -14);
  scene.add(ambientLight, sunLight, rimLight);

  const worldGroup = new THREE.Group();
  const biomeGroup = new THREE.Group();
  const mazeGroup = new THREE.Group();
  const itemsGroup = new THREE.Group();
  const projectionGroup = new THREE.Group();
  worldGroup.add(biomeGroup, mazeGroup, itemsGroup, projectionGroup);
  scene.add(worldGroup);

  // REALISTIC ARCHITECTURAL & NATURAL 3D BIOME ENHANCER FOR ALL 12 BIOMES
  function addRealisticBiomeDetails(b) {
    biomeAnimatedProps = [];
    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.15 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.18, metalness: 0.88 });
    const velvetMat = new THREE.MeshStandardMaterial({ color: 0x9f1239, roughness: 0.85, metalness: 0.05 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.75, metalness: 0.15 });
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.08,
      metalness: 0.65,
      transparent: true,
      opacity: 0.82
    });

    // Sanctuary Inner Plaza Platform directly under the labyrinth
    const plaza = new THREE.Mesh(
      new THREE.BoxGeometry(GRID_SIZE + 1.4, 0.35, GRID_SIZE + 1.4),
      new THREE.MeshStandardMaterial({ color: b.floor, roughness: 0.4, metalness: 0.3 })
    );
    plaza.position.y = -0.55;
    biomeGroup.add(plaza);

    // Ambient Starfield / Floating Atmospheric Motes
    const moteMat = new THREE.MeshBasicMaterial({ color: b.accent, transparent: true, opacity: 0.75 });
    for (let m = 0; m < 28; m++) {
      const ang = (m / 28) * Math.PI * 2;
      const rad = 10 + (m % 5) * 2.8;
      const mote = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), moteMat);
      mote.position.set(Math.cos(ang) * rad, 1.2 + (m % 4) * 1.4, Math.sin(ang) * rad);
      biomeGroup.add(mote);
      biomeAnimatedProps.push({ mesh: mote, type: "float", baseY: mote.position.y, phase: m });
    }

    if (b.id === "royal") {
      // Velvet carpet inlay & concentric golden rings + floating crown jewels
      const carpet = new THREE.Mesh(new THREE.CylinderGeometry(11.5, 11.5, 0.08, 48), velvetMat);
      carpet.position.y = -0.36;
      const goldRing1 = new THREE.Mesh(new THREE.TorusGeometry(12.2, 0.18, 16, 64), goldMat);
      goldRing1.rotation.x = Math.PI / 2;
      goldRing1.position.y = -0.32;
      const goldRing2 = new THREE.Mesh(new THREE.TorusGeometry(16.2, 0.24, 16, 64), goldMat);
      goldRing2.rotation.x = Math.PI / 2;
      goldRing2.position.y = -0.32;
      biomeGroup.add(carpet, goldRing1, goldRing2);
    } else if (b.id === "cyberdrift") {
      // Synthwave horizon sun disc & holographic drift portals
      const sunDisc = new THREE.Mesh(
        new THREE.CircleGeometry(9.5, 36),
        new THREE.MeshBasicMaterial({ color: 0xff2a85, side: THREE.DoubleSide })
      );
      sunDisc.position.set(0, 8, -24);
      biomeGroup.add(sunDisc);
      for (let p = 0; p < 4; p++) {
        const portal = new THREE.Mesh(
          new THREE.TorusGeometry(2.2, 0.12, 16, 36),
          new THREE.MeshBasicMaterial({ color: 0x00f5d4 })
        );
        const a = (p / 4) * Math.PI * 2;
        portal.position.set(Math.cos(a) * 13.5, 2.4, Math.sin(a) * 13.5);
        portal.lookAt(0, 2.4, 0);
        biomeGroup.add(portal);
        biomeAnimatedProps.push({ mesh: portal, type: "spin", speed: 1.5 });
      }
    } else if (b.id === "angelic") {
      // Concentric golden halos & fluffy multi-sphere cloud pillows
      for (let h = 1; h <= 3; h++) {
        const halo = new THREE.Mesh(new THREE.TorusGeometry(10 + h * 3.2, 0.16, 16, 64), goldMat);
        halo.rotation.x = Math.PI / 2;
        halo.position.y = 3.5 + h * 1.1;
        biomeGroup.add(halo);
        biomeAnimatedProps.push({ mesh: halo, type: "spinZ", speed: 0.3 * h });
      }
    } else if (b.id === "lagoon") {
      // Turquoise translucent ocean lagoon, sandy island atoll & pastel beach parasols
      const ocean = new THREE.Mesh(new THREE.CylinderGeometry(28, 28, 0.45, 48), waterMat);
      ocean.position.y = -0.72;
      const atoll = new THREE.Mesh(
        new THREE.CylinderGeometry(13.2, 14.8, 0.55, 40),
        new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.8 })
      );
      atoll.position.y = -0.62;
      biomeGroup.add(ocean, atoll);
      for (let u = 0; u < 6; u++) {
        const a = (u / 6) * Math.PI * 2 + 0.3;
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 10), marbleMat);
        const umbrella = new THREE.Mesh(
          new THREE.ConeGeometry(1.5, 0.7, 12),
          new THREE.MeshStandardMaterial({ color: u % 2 === 0 ? 0xf472b6 : 0x38bdf8 })
        );
        pole.position.set(Math.cos(a) * 12.6, 0.8, Math.sin(a) * 12.6);
        umbrella.position.set(Math.cos(a) * 12.6, 2.0, Math.sin(a) * 12.6);
        biomeGroup.add(pole, umbrella);
      }
    } else if (b.id === "lofi") {
      // Oversized steaming coffee mug with saucer, spinning vinyl turntable & overhead string lamps
      const saucer = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 2.6, 0.25, 32), marbleMat);
      saucer.position.set(-14, -0.3, -10);
      const bigMug = new THREE.Mesh(
        new THREE.CylinderGeometry(2.1, 1.9, 3.6, 32),
        new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.25 })
      );
      bigMug.position.set(-14, 1.5, -10);
      const platter = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.14, 36), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.2 }));
      platter.position.set(14, -0.25, -10);
      const label = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.16, 24), new THREE.MeshBasicMaterial({ color: 0xf43f5e }));
      label.position.set(14, -0.24, -10);
      biomeGroup.add(saucer, bigMug, platter, label);
    } else if (b.id === "gothicbalcony" || b.id === "gothiccastle") {
      // Stained-glass rose window, curtain walls & battlements
      const roseFrame = new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.35, 16, 48), stoneMat);
      roseFrame.position.set(0, 7.5, -18.5);
      const roseGlass = new THREE.Mesh(
        new THREE.CircleGeometry(5.3, 32),
        new THREE.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
      );
      roseGlass.position.set(0, 7.5, -18.5);
      biomeGroup.add(roseFrame, roseGlass);
    } else if (b.id === "forest") {
      // Winding stream & mossy boulders
      const stream = new THREE.Mesh(new THREE.BoxGeometry(36, 0.1, 3.2), waterMat);
      stream.position.set(0, -0.45, -13.5);
      biomeGroup.add(stream);
    } else if (b.id === "cyberterrace") {
      // Surrounding metropolis skyscrapers with glowing neon window strips
      for (let s = 0; s < 14; s++) {
        const a = (s / 14) * Math.PI * 2;
        const h = 8 + (s % 4) * 4.5;
        const bldg = new THREE.Mesh(
          new THREE.BoxGeometry(3.2, h, 3.2),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.6 })
        );
        bldg.position.set(Math.cos(a) * 21, h / 2 - 2, Math.sin(a) * 21);
        const neonTrim = new THREE.Mesh(
          new THREE.BoxGeometry(3.3, 0.25, 3.3),
          new THREE.MeshBasicMaterial({ color: s % 2 === 0 ? 0x38bdf8 : 0xe879f9 })
        );
        neonTrim.position.set(bldg.position.x, h - 2.2, bldg.position.z);
        biomeGroup.add(bldg, neonTrim);
      }
    } else if (b.id === "desert") {
      // Oasis pool, sandstone arch & saguaro cacti
      const oasis = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.2, 0.15, 32), waterMat);
      oasis.position.set(-14, -0.42, 11);
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(4.8, 0.95, 14, 32, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.85 })
      );
      arch.position.set(0, -0.4, -17.5);
      biomeGroup.add(oasis, arch);
    } else if (b.id === "reef") {
      // Underwater seabed dome & rising translucent bubble rings
      const waterDome = new THREE.Mesh(new THREE.CylinderGeometry(27, 27, 0.3, 40), waterMat);
      waterDome.position.y = -0.5;
      biomeGroup.add(waterDome);
    } else if (b.id === "alpine") {
      // Snow caps on distant mountain range peaks
      const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const px = Math.cos(angle) * 15.5;
        const pz = Math.sin(angle) * 15.5;
        const cap = new THREE.Mesh(new THREE.ConeGeometry(1.55, 2.8, 7), snowMat);
        cap.position.set(px, 4.9, pz);
        biomeGroup.add(cap);
      }
    }
  }

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
    addRealisticBiomeDetails(b);
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
    player.targetX = 1;
    player.targetZ = 1;
    player.visualAngle = 0;

    if (player.mesh) worldGroup.remove(player.mesh);
    player.mesh = createArchetypeMesh(state.archetype, true, state.playerColor);
    const pStart = gridToWorld(player.x, player.z);
    player.mesh.position.set(pStart.wx, 0, pStart.wz);
    worldGroup.add(player.mesh);

    // Spawn Pursuing Entities (1 for Easy, 2 for Medium, 3 for Hard, 4 for Impossible)
    enemies.forEach((e) => worldGroup.remove(e.mesh));
    enemies = [];
    const spawnCoords = [
      [GRID_SIZE - 2, 1],
      [1, GRID_SIZE - 2],
      [mid, 1],
      [GRID_SIZE - 2, mid]
    ];
    spawnCoords.slice(0, state.enemyCount).forEach(([ex, ez]) => {
      mazeGrid[ez][ex] = 0;
      const eMesh = createArchetypeMesh(state.archetype, false, state.entityColor);
      const ePos = gridToWorld(ex, ez);
      eMesh.position.set(ePos.wx, 0, ePos.wz);
      worldGroup.add(eMesh);
      enemies.push({
        x: ex,
        z: ez,
        fromX: ex,
        fromZ: ez,
        toX: ex,
        toZ: ez,
        moveProgress: 1,
        dirX: 0,
        dirZ: 1,
        visualAngle: 0,
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
    const hudStored = document.getElementById("hud-stored-diamonds");
    if (hudStored) hudStored.textContent = state.diamonds;
    const initDia = document.getElementById("init-diamonds");
    if (initDia) initDia.textContent = state.diamonds;
    const hudDiff = document.getElementById("hud-difficulty");
    if (hudDiff) {
      const cap = state.difficulty.charAt(0).toUpperCase() + state.difficulty.slice(1);
      hudDiff.textContent = `${cap} (${state.enemyCount})`;
    }
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

  // Shortest-angle interpolation so avatars and pursuers smoothly face the exact path of travel
  function lerpAngle(current, target, factor) {
    let diff = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return current + diff * factor;
  }

  // Animate archetype sub-parts (flapping bird wings, swinging runner limbs, flashing police sirens)
  function animateArchetypeSubparts(mesh, timeSec, isMoving) {
    if (!mesh || !mesh.userData) return;
    if (mesh.userData.wings) {
      const flap = Math.sin(timeSec * 14) * 0.45;
      mesh.userData.wings.wingL.rotation.z = flap;
      mesh.userData.wings.wingR.rotation.z = -flap;
    }
    if (mesh.userData.limbs) {
      const swing = isMoving ? Math.sin(timeSec * 12) * 0.65 : 0;
      mesh.userData.limbs.armL.rotation.x = swing;
      mesh.userData.limbs.armR.rotation.x = -swing;
      mesh.userData.limbs.legL.rotation.x = -swing;
      mesh.userData.limbs.legR.rotation.x = swing;
    }
    if (mesh.userData.sirens) {
      const flash = Math.floor(timeSec * 8) % 2 === 0;
      mesh.userData.sirens.sirenBlue.visible = flash;
      mesh.userData.sirens.sirenRed.visible = !flash;
    }
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

    // Enemies with directional heading indicator
    enemies.forEach((e) => {
      const ecx = offsetX + (e.x + 0.5) * tile;
      const ecy = offsetY + (e.z + 0.5) * tile;
      ctx.fillStyle = state.powerTimer > 0 ? "#60a5fa" : state.entityColor;
      ctx.fillRect(offsetX + (e.x + 0.18) * tile, offsetY + (e.z + 0.18) * tile, tile * 0.64, tile * 0.64);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ecx + e.dirX * tile * 0.18, ecy + e.dirZ * tile * 0.18, tile * 0.09, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // SMOOTH TARGET-TILE MOVEMENT STEPPER FOR PLAYER & ENEMIES (NO SNAP-BACK GLITCHES)
  function updateSmoothEntities(dt, nowSec) {
    const speed = 4.4 * state.ballSpeedMultiplier;

    // 1. Player Smooth Tile-to-Tile Navigation
    // Allow instant 180-degree reversal along current corridor
    if (
      (player.dirX !== 0 || player.dirZ !== 0) &&
      player.nextDirX === -player.dirX &&
      player.nextDirZ === -player.dirZ
    ) {
      const prevTargetX = player.targetX;
      const prevTargetZ = player.targetZ;
      player.targetX = prevTargetX - player.dirX;
      player.targetZ = prevTargetZ - player.dirZ;
      player.dirX = player.nextDirX;
      player.dirZ = player.nextDirZ;
    }

    let remDist = speed * dt;
    while (remDist > 0) {
      const toTargetX = player.targetX - player.x;
      const toTargetZ = player.targetZ - player.z;
      const distToTarget = Math.hypot(toTargetX, toTargetZ);

      if (distToTarget <= remDist) {
        // Reached target tile center cleanly
        player.x = player.targetX;
        player.z = player.targetZ;
        remDist -= distToTarget;

        // Check queued turn first, then continue straight
        if (
          (player.nextDirX !== 0 || player.nextDirZ !== 0) &&
          canMoveTo(player.x + player.nextDirX, player.z + player.nextDirZ)
        ) {
          player.dirX = player.nextDirX;
          player.dirZ = player.nextDirZ;
          player.targetX = player.x + player.dirX;
          player.targetZ = player.z + player.dirZ;
        } else if (
          (player.dirX !== 0 || player.dirZ !== 0) &&
          canMoveTo(player.x + player.dirX, player.z + player.dirZ)
        ) {
          player.targetX = player.x + player.dirX;
          player.targetZ = player.z + player.dirZ;
        } else {
          player.dirX = 0;
          player.dirZ = 0;
          break;
        }
      } else {
        player.x += (toTargetX / distToTarget) * remDist;
        player.z += (toTargetZ / distToTarget) * remDist;
        remDist = 0;
      }
    }

    const pWorld = gridToWorld(player.x, player.z);
    player.mesh.position.set(pWorld.wx, player.y, pWorld.wz);
    if (player.dirX !== 0 || player.dirZ !== 0) {
      const targetAngle = Math.atan2(player.dirX, player.dirZ);
      player.visualAngle = lerpAngle(player.visualAngle || 0, targetAngle, Math.min(1, dt * 18));
      player.mesh.rotation.y = player.visualAngle;
    }
    animateArchetypeSubparts(player.mesh, nowSec, player.dirX !== 0 || player.dirZ !== 0);

    // 2. Pursuer Entities Smooth Tile-to-Tile Navigation & Forward Facing Alignment
    enemies.forEach((e) => {
      if (e.stunned > 0) {
        e.stunned -= dt;
        return;
      }
      const eSpeed = (state.powerTimer > 0 ? 1.95 : 2.85) + (state.level - 1) * 0.14;
      let eStep = eSpeed * dt;

      while (eStep > 0) {
        const dx = e.toX - e.x;
        const dz = e.toZ - e.z;
        const dist = Math.hypot(dx, dz);

        if (dist <= eStep) {
          e.x = e.toX;
          e.z = e.toZ;
          eStep -= dist;

          const possible = [
            [0, -1],
            [1, 0],
            [0, 1],
            [-1, 0]
          ].filter(([nx, nz]) => canMoveTo(e.x + nx, e.z + nz));

          if (possible.length > 0) {
            const nonReverse = possible.filter(([nx, nz]) => !(nx === -e.dirX && nz === -e.dirZ));
            const choices = nonReverse.length > 0 ? nonReverse : possible;
            choices.sort((a, b) => {
              const distA = Math.hypot(e.x + a[0] - player.x, e.z + a[1] - player.z);
              const distB = Math.hypot(e.x + b[0] - player.x, e.z + b[1] - player.z);
              return state.powerTimer > 0 ? distB - distA : distA - distB;
            });
            const pick = Math.random() < 0.74 ? choices[0] : choices[Math.floor(Math.random() * choices.length)];
            e.dirX = pick[0];
            e.dirZ = pick[1];
            e.fromX = e.x;
            e.fromZ = e.z;
            e.toX = e.x + e.dirX;
            e.toZ = e.z + e.dirZ;
          } else {
            break;
          }
        } else {
          e.x += (dx / dist) * eStep;
          e.z += (dz / dist) * eStep;
          eStep = 0;
        }
      }

      const ew = gridToWorld(e.x, e.z);
      e.mesh.position.set(ew.wx, 0, ew.wz);

      // Smoothly rotate pursuer so it faces directly down the road of travel
      if (e.dirX !== 0 || e.dirZ !== 0) {
        const targetHeading = Math.atan2(e.dirX, e.dirZ);
        e.visualAngle = lerpAngle(
          typeof e.visualAngle === "number" ? e.visualAngle : targetHeading,
          targetHeading,
          Math.min(1, dt * 16)
        );
        e.mesh.rotation.y = e.visualAngle;
      }
      animateArchetypeSubparts(e.mesh, nowSec, true);

      // Collision with Player
      if (Math.hypot(player.x - e.x, player.z - e.z) < 0.52 && player.y < 0.45) {
        if (state.powerTimer > 0) {
          state.comboCount++;
          const pts = 200 * Math.pow(2, state.comboCount - 1);
          state.score += pts;
          e.x = GRID_SIZE - 2;
          e.z = 1;
          e.fromX = e.x;
          e.fromZ = e.z;
          e.toX = e.x;
          e.toZ = e.z;
          e.stunned = 3;
        } else {
          applyDamage(34);
          e.stunned = 1.5;
        }
      }
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
    const nowSec = now * 0.001;

    // Render 360° Preview Studios when Screen 2 is open
    if (document.getElementById("init-screen-2").classList.contains("active")) {
      previewPlayerStudio.render();
      previewEntityStudio.render();
    }

    // Animate Biome Props (floating motes, portals, halos)
    biomeAnimatedProps.forEach((prop) => {
      if (prop.type === "float") {
        prop.mesh.position.y = prop.baseY + Math.sin(nowSec * 2 + prop.phase) * 0.35;
      } else if (prop.type === "spin") {
        prop.mesh.rotation.z += dt * prop.speed;
      } else if (prop.type === "spinZ") {
        prop.mesh.rotation.z += dt * prop.speed;
      }
    });

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

      // Smooth Grid Movement (delegated to glitch-free tile interpolator)
      const useSmoothStepper = true;
      if (!useSmoothStepper) {
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
      } else {
        updateSmoothEntities(dt, nowSec);
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
            if (d.type === "diamond") {
              state.diamonds++;
              state.storedDiamonds = state.diamonds;
              saveProgress(true);
            }
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

      // Move Pursuing Entities (Legacy block bypassed when smooth stepper is active)
      if (!useSmoothStepper) {
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
      }

      updateHUD();
    }

    // Camera Follow & Interactive Orbit / Tilt / Top-Position Adjustment
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
      if (state.topCameraMode) {
        // Direct overhead Top Position camera viewing the entire labyrinth
        const topDist = Math.max(18.5, 20.5 + state.camZoomOffset);
        const targetCamPos = new THREE.Vector3(
          Math.sin(state.camYawOffset) * 0.5,
          topDist,
          Math.cos(state.camYawOffset) * 0.5
        );
        camera.position.lerp(targetCamPos, 0.12);
        camera.lookAt(0, 0, 0);
      } else {
        const radius = Math.max(6, Math.min(22, 10.5 + state.camZoomOffset));
        const height = Math.max(5.5, Math.min(24, 13.5 + state.camPitchOffset));
        const focusX = player.mesh.position.x * 0.35;
        const focusZ = player.mesh.position.z * 0.35;
        const camX = player.mesh.position.x * 0.55 + Math.sin(state.camYawOffset) * radius;
        const camZ = player.mesh.position.z * 0.55 + Math.cos(state.camYawOffset) * radius;
        camera.position.lerp(new THREE.Vector3(camX, height, camZ), 0.1);
        camera.lookAt(focusX, 0, focusZ);
      }
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

  // Synchronize Swatch Locks so Player & Pursuer Entity Never Share the Same Color
  function syncDistinctColorSwatches() {
    const pSwatches = document.getElementById("player-color-swatches");
    const eSwatches = document.getElementById("entity-color-swatches");
    if (!pSwatches || !eSwatches) return;

    Array.from(pSwatches.children).forEach((btn, idx) => {
      const hex = SWATCH_COLORS[idx];
      btn.classList.toggle("active", hex === state.playerColor);
      btn.classList.toggle("locked-swatch", hex === state.entityColor);
    });

    Array.from(eSwatches.children).forEach((btn, idx) => {
      const hex = SWATCH_COLORS[idx];
      btn.classList.toggle("active", hex === state.entityColor);
      btn.classList.toggle("locked-swatch", hex === state.playerColor);
    });
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
        if (hex === state.entityColor) return; // Prevent identical color as enemies
        state.playerColor = hex;
        Array.from(pSwatches.children).forEach((c) => c.classList.remove("active"));
        s1.classList.add("active");
        syncDistinctColorSwatches();
        previewPlayerStudio.rebuildMesh();
      });
      pSwatches.appendChild(s1);

      const s2 = document.createElement("button");
      s2.type = "button";
      s2.className = `color-swatch ${hex === state.entityColor ? "active" : ""}`;
      s2.style.background = hex;
      s2.addEventListener("click", () => {
        if (hex === state.playerColor) return; // Prevent identical color as player
        state.entityColor = hex;
        Array.from(eSwatches.children).forEach((c) => c.classList.remove("active"));
        s2.classList.add("active");
        syncDistinctColorSwatches();
        previewEntityStudio.rebuildMesh();
      });
      eSwatches.appendChild(s2);
    });

    syncDistinctColorSwatches();
  }

  function selectBiome(idx) {
    state.biomeIndex = idx;
    document.querySelectorAll("#biome-grid .biome-btn").forEach((b, i) => {
      b.classList.toggle("active", i === idx);
      if (i === idx) triggerButtonPlagueSpread(b);
    });
    document.querySelectorAll("#pause-biome-grid .biome-btn").forEach((b, i) => {
      b.classList.toggle("active", i === idx);
      if (i === idx) triggerButtonPlagueSpread(b);
    });
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
      triggerButtonPlagueSpread(btn);
      state.archetype = btn.dataset.archetype;
      previewPlayerStudio.rebuildMesh();
      previewEntityStudio.rebuildMesh();
    });
  });

  // Difficulty Buttons (Easy = 1, Medium = 2, Hard = 3, Impossible = 4)
  function selectDifficulty(diff, count) {
    state.difficulty = diff;
    state.enemyCount = Number(count) || 3;
    document.querySelectorAll(".difficulty-btn").forEach((b) => {
      const isMatch = b.dataset.difficulty === diff;
      b.classList.toggle("active", isMatch);
      if (isMatch) triggerButtonPlagueSpread(b);
    });
    if (state.running) {
      rebuildMazeScene();
    }
    updateHUD();
  }

  document.querySelectorAll(".difficulty-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectDifficulty(btn.dataset.difficulty, btn.dataset.enemies);
    });
  });

  // Auto-Rotate Toggles
  document.getElementById("player-autorotate-btn").addEventListener("click", (e) => {
    state.playerAutoRotate = !state.playerAutoRotate;
    e.currentTarget.classList.toggle("active", state.playerAutoRotate);
    triggerButtonPlagueSpread(e.currentTarget);
    e.currentTarget.textContent = `Auto-Rotate: ${state.playerAutoRotate ? "ON" : "OFF"}`;
  });
  document.getElementById("entity-autorotate-btn").addEventListener("click", (e) => {
    state.entityAutoRotate = !state.entityAutoRotate;
    e.currentTarget.classList.toggle("active", state.entityAutoRotate);
    triggerButtonPlagueSpread(e.currentTarget);
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

  // Interactive Gameplay Camera Controls & Top Position Button
  const camTopBtn = document.getElementById("hud-cam-top-btn");
  if (camTopBtn) {
    camTopBtn.addEventListener("click", () => {
      state.topCameraMode = !state.topCameraMode;
      camTopBtn.classList.toggle("cam-active", state.topCameraMode);
      triggerButtonPlagueSpread(camTopBtn);
      camTopBtn.textContent = state.topCameraMode ? "Cam: Top View (Active)" : "Cam: Top Position";
    });
  }

  document.getElementById("btn-cam-orbit-left")?.addEventListener("click", () => {
    state.camYawOffset -= 0.35;
  });
  document.getElementById("btn-cam-orbit-right")?.addEventListener("click", () => {
    state.camYawOffset += 0.35;
  });
  document.getElementById("btn-cam-tilt-up")?.addEventListener("click", () => {
    state.camPitchOffset = Math.min(9, state.camPitchOffset + 1.5);
  });
  document.getElementById("btn-cam-tilt-down")?.addEventListener("click", () => {
    state.camPitchOffset = Math.max(-6, state.camPitchOffset - 1.5);
  });
  document.getElementById("btn-cam-zoom-in")?.addEventListener("click", () => {
    state.camZoomOffset = Math.max(-5, state.camZoomOffset - 1.5);
  });
  document.getElementById("btn-cam-zoom-out")?.addEventListener("click", () => {
    state.camZoomOffset = Math.min(8, state.camZoomOffset + 1.5);
  });

  // Drag / Orbit & Wheel Zoom directly on the Gameplay Maze Viewport
  (() => {
    const vp = document.getElementById("maze-viewport");
    if (!vp) return;
    let draggingCam = false;
    let lastX = 0;
    let lastY = 0;

    vp.addEventListener("mousedown", (e) => {
      draggingCam = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    window.addEventListener("mousemove", (e) => {
      if (!draggingCam) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      state.camYawOffset -= dx * 0.008;
      state.camPitchOffset = Math.max(-6, Math.min(10, state.camPitchOffset + dy * 0.04));
      lastX = e.clientX;
      lastY = e.clientY;
    });
    window.addEventListener("mouseup", () => {
      draggingCam = false;
    });

    vp.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        draggingCam = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      }
    }, { passive: true });
    vp.addEventListener("touchmove", (e) => {
      if (!draggingCam || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastX;
      const dy = e.touches[0].clientY - lastY;
      state.camYawOffset -= dx * 0.008;
      state.camPitchOffset = Math.max(-6, Math.min(10, state.camPitchOffset + dy * 0.04));
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    }, { passive: true });
    vp.addEventListener("touchend", () => {
      draggingCam = false;
    });

    vp.addEventListener("wheel", (e) => {
      e.preventDefault();
      state.camZoomOffset = Math.max(-5, Math.min(9, state.camZoomOffset + (e.deltaY > 0 ? 0.9 : -0.9)));
    }, { passive: false });
  })();

  // Launch Game from Screen 2
  document.getElementById("launch-aeternus-btn").addEventListener("click", () => {
    document.getElementById("init-screen-2").classList.remove("active");
    state.score = 0;
    state.elapsedSeconds = 0;
    state.level = 1;
    state.health = 100;
    state.shields = 1;
    state.diamonds = Math.max(1, state.storedDiamonds);
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
      if (typeof data.storedDiamonds === "number") {
        state.diamonds = Math.max(state.diamonds, data.storedDiamonds);
        state.storedDiamonds = state.diamonds;
      }
      if (state.playerColor === state.entityColor) {
        state.entityColor = SWATCH_COLORS.find((c) => c !== state.playerColor) || "#fb7185";
      }
      syncDistinctColorSwatches();
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
      state.storedDiamonds = state.diamonds;
      state.health = 100;
      saveProgress(true);
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
