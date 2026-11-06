const WHATSAPP_NUMBER = "573235276719";
const MENSAJE_BASE = "Hola Ayura 👋 Quiero más información sobre Omnilife y Seytú.";

/* ---------- Tema ---------- */
const root = document.documentElement;
const THEME_KEY = "ayura-theme";
(function () {
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) { }
  root.dataset.theme = saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
})();

document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const wa = (msg) => "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg || MENSAJE_BASE);

  /* Enlaces de WhatsApp y año del pie */
  $$("a.wa").forEach((a) => { a.href = wa(a.dataset.msg); });
  $("#anio").textContent = new Date().getFullYear();

  let threeController = null;

  /* ---------- Botón de tema ---------- */
  const themeBtn = $("#theme");
  const themeMeta = $('meta[name="theme-color"]');
  const paintTheme = () => {
    const dark = root.dataset.theme === "dark";
    themeBtn.setAttribute("aria-label", dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
    if (themeMeta) themeMeta.content = dark ? "#0e0b1a" : "#f6f1e7";
    if (threeController) threeController.syncTheme(dark);
  };
  paintTheme();
  themeBtn.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem(THEME_KEY, root.dataset.theme); } catch (e) { }
    paintTheme();
  });


  /* ---------- Menú móvil ---------- */
  const burger = $("#burger"), menu = $("#menu");
  const setMenu = (open) => {
    menu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  };
  burger.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });

  /* ---------- Sincronización de pestañas de Ritual + Botones 3D ---------- */
  const ritualTabs = $$(".ritual-tab");
  const archChips = $$(".arch-chip");

  const activatePath = (pathKey) => {
    ritualTabs.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.path === pathKey)));
    archChips.forEach((c) => c.classList.toggle("active", c.dataset["3d"] === pathKey));
    $$("[data-for]").forEach((el) => { el.hidden = el.dataset.for !== pathKey; });
    if (threeController) threeController.setMode(pathKey);
  };

  ritualTabs.forEach((btn) => btn.addEventListener("click", () => activatePath(btn.dataset.path)));
  archChips.forEach((chip) => chip.addEventListener("click", (e) => {
    e.stopPropagation();
    activatePath(chip.dataset["3d"]);
  }));

  /* ---------- Filtros de Necesidades ---------- */
  const filterBtns = $$(".filters button");
  filterBtns.forEach((btn) => btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    $$(".product").forEach((p) => {
      p.hidden = btn.dataset.f !== "todos" && p.dataset.brand !== btn.dataset.f;
    });
    if (threeController && btn.dataset.f !== "todos") {
      threeController.setMode(btn.dataset.f === "seytu" ? "spa" : "comprar");
    }
  }));

  /* ---------- Selección de intereses ("Me interesa" + Spa Facial) a WhatsApp ---------- */
  const picked = new Set();
  const tray = $("#tray");
  const getItemName = (btn) => btn.dataset.name || btn.closest(".product")?.dataset.name || "";

  const renderTray = () => {
    const names = [...picked];
    tray.hidden = names.length === 0;
    document.body.classList.toggle("has-tray", names.length > 0);
    $("#tray-text").textContent = names.length + (names.length === 1 ? " interés elegido: " : " intereses elegidos: ") + names.join(", ");
    $("#tray-cta").href = wa("Hola Ayura 👋 Vi la página web y quiero asesoría sobre: " + names.join(", ") + ".");
  };

  const setPick = (btn, on) => {
    btn.setAttribute("aria-pressed", String(on));
    const card = btn.closest(".product");
    if (card) card.classList.toggle("picked", on);
    const label = $(".pick-label", btn);
    if (btn.classList.contains("spa-pick")) {
      label.textContent = on ? "Spa Facial ($15.000) sumado ✓" : "+ Sumar Spa Facial ($15.000) a mi consulta";
    } else {
      label.textContent = on ? "Seleccionado ✓" : "+ Me interesa";
    }
  };

  $$(".pick").forEach((btn) => btn.addEventListener("click", () => {
    const name = getItemName(btn);
    if (!name) return;
    const on = !picked.has(name);
    on ? picked.add(name) : picked.delete(name);
    setPick(btn, on);
    renderTray();
    if (threeController && on) threeController.triggerPulse();
  }));

  $("#tray-clear").addEventListener("click", () => {
    picked.clear();
    $$(".pick").forEach((btn) => setPick(btn, false));
    renderTray();
  });

  /* ---------- Video del Spa: reproducir y ocultar overlay ---------- */
const spaVideo = $("#spa-video");
const spaStage = $("#spa-video-stage");

if (spaVideo && spaStage) {
  const startVideo = () => {
    spaVideo.muted = false;          // el clic del usuario permite audio
    spaVideo.controls = true;        // controles nativos solo al reproducir
    spaStage.hidden = true;          // oculta loto, play y textos
    spaVideo.play().catch(() => {
      // Si el navegador bloquea el audio, reintenta en silencio
      spaVideo.muted = true;
      spaVideo.play().catch(() => { spaStage.hidden = false; });
    });
  };

  spaStage.addEventListener("click", startVideo);
  spaStage.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      startVideo();
    }
  });

  // Al terminar, vuelve a mostrar el overlay
  spaVideo.addEventListener("ended", () => {
    spaVideo.controls = false;
    spaVideo.currentTime = 0;
    spaStage.hidden = false;
  });
}



  /* ---------- Formulario de contacto a WhatsApp ---------- */
  const form = $("#form"), err = $("#err");
  form.nombre.addEventListener("input", () => {
    err.hidden = true;
    form.nombre.removeAttribute("aria-invalid");
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = form.nombre.value.trim();
    if (!nombre) {
      err.hidden = false;
      form.nombre.setAttribute("aria-invalid", "true");
      form.nombre.focus();
      return;
    }
    const pais = form.pais.value.trim();
    const mensaje = form.mensaje.value.trim();
    const texto = "Hola Ayura 👋 Soy " + nombre + (pais ? " (" + pais + ")" : "") +
      ". Me interesa: " + form.interes.value + "." + (mensaje ? " " + mensaje : "");
    window.open(wa(texto), "_blank", "noopener");
  });

  /* ==========================================================================
     FLOR DE LOTO 3D REALISTA EN VISTA SUPERIOR + NENÚFARES EN EL FONDO PRINCIPAL
     ========================================================================== */
  const initTopDownLotusThree = () => {
    if (!window.THREE) return null;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return null;

    const THREE = window.THREE;
    const bgCanvas = $("#hero-bg-canvas");
    const heroSection = $("#inicio");
    const orbStage = $("#orb-stage");
    const orbModeLabel = $("#orb-mode");
    if (!bgCanvas || !heroSection) return null;

    const isDarkInit = root.dataset.theme === "dark";

    /* Paletas botánicas realistas según la sección (Nutrición, Spa Facial o Emprender) */
    const MODES = {
      comprar: {
        label: "Flor de Loto - Nutrición",
        tipHex: "#d95d39",
        midHex: "#f4976c",
        baseHex: "#fff9ed",
        veinHex: "rgba(185, 65, 35, 0.22)",
        sporeHex: 0x52b788,
        accentHex: 0xf6ad55,
        bloomOpen: 1.0
      },
      spa: {
        label: "Flor de Loto - Spa Facial Seytú",
        tipHex: "#c92a6d",
        midHex: "#f283b6",
        baseHex: "#fff7fb",
        veinHex: "rgba(168, 28, 87, 0.24)",
        sporeHex: 0xf472b6,
        accentHex: 0xfbcfe8,
        bloomOpen: 1.12
      },
      emprender: {
        label: "Flor de Loto - Emprender",
        tipHex: "#d97706",
        midHex: "#fbbf24",
        baseHex: "#fffef2",
        veinHex: "rgba(161, 82, 7, 0.22)",
        sporeHex: 0xfbbf24,
        accentHex: 0x38bdf8,
        bloomOpen: 1.05
      }
    };

    let currentModeKey = "spa"; /* Iniciamos con el tono rosa loto realista y cambiamos al tocar pestañas */
    let currentMode = MODES.comprar;
    let pulseEnergy = 0;
    let bloomTarget = currentMode.bloomOpen;
    let bloomCurrent = currentMode.bloomOpen;

    /* 1. Mapa de reflexión de estudio para acabado sedoso y gotas de rocío reales */
    const createStudioEnvMap = () => {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 128;
      const ctx = c.getContext("2d");
      const g = ctx.createLinearGradient(0, 0, 0, 128);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.3, "#fff0e6");
      g.addColorStop(0.65, "#74c69d");
      g.addColorStop(1, "#1b4332");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 128);

      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.arc(80, 28, 22, 0, Math.PI * 2);
      ctx.arc(185, 36, 16, 0, Math.PI * 2);
      ctx.fill();

      const tex = new THREE.CanvasTexture(c);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      return tex;
    };

    /* 2. Textura orgánica realista de Pétalo de Loto (gradiente de base cremosa a punta pigmentada + nervaduras) */
    const createRealisticPetalTexture = (modeCfg) => {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext("2d");

      /* Fondo longitudinal: base marfil cálido (abajo) -> centro luminoso -> punta saturada (arriba) */
      const lg = ctx.createLinearGradient(0, 512, 0, 0);
      lg.addColorStop(0.0, "#fde68a");
      lg.addColorStop(0.16, modeCfg.baseHex);
      lg.addColorStop(0.52, modeCfg.baseHex);
      lg.addColorStop(0.8, modeCfg.midHex);
      lg.addColorStop(1.0, modeCfg.tipHex);
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, 512, 512);

      /* Rubor en los bordes laterales del pétalo para dar volumen realista */
      const rgLeft = ctx.createLinearGradient(0, 0, 180, 0);
      rgLeft.addColorStop(0, modeCfg.tipHex);
      rgLeft.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = rgLeft;
      ctx.fillRect(0, 0, 180, 512);

      const rgRight = ctx.createLinearGradient(512, 0, 332, 0);
      rgRight.addColorStop(0, modeCfg.tipHex);
      rgRight.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = rgRight;
      ctx.fillRect(332, 0, 180, 512);

      /* Brillo central nacarado en la panza del pétalo */
      const centerGlow = ctx.createRadialGradient(256, 290, 15, 256, 290, 195);
      centerGlow.addColorStop(0, "rgba(255,255,255,0.88)");
      centerGlow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, 512, 512);

      /* Nervaduras botánicas longitudinales finas desde la base hasta la punta */
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = modeCfg.veinHex;
      ctx.lineWidth = 1.6;
      for (let i = -16; i <= 16; i++) {
        const spread = i / 16;
        ctx.beginPath();
        ctx.moveTo(256 + spread * 35, 505);
        ctx.quadraticCurveTo(256 + spread * 230, 250, 256 + spread * 55, 12);
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
    };

    /* Mapa de microrrelieve sedoso para los pétalos */
    const createPetalBumpMap = () => {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = "#a8a8a8";
      ctx.lineWidth = 1.2;
      for (let i = -24; i <= 24; i++) {
        const s = i / 24;
        ctx.beginPath();
        ctx.moveTo(128 + s * 20, 256);
        ctx.quadraticCurveTo(128 + s * 120, 128, 128 + s * 25, 0);
        ctx.stroke();
      }
      return new THREE.CanvasTexture(c);
    };

    /* 3. Textura realista de Hoja de Nenúfar (Lily Pad) con nervaduras radiales ramificadas */
    const createLilyPadTexture = () => {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext("2d");

      const rg = ctx.createRadialGradient(256, 256, 6, 256, 256, 256);
      rg.addColorStop(0.0, "#b7e478");
      rg.addColorStop(0.08, "#7cb53b");
      rg.addColorStop(0.55, "#5c9e31");
      rg.addColorStop(0.88, "#3f7a22");
      rg.addColorStop(1.0, "#2b5815");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, 512, 512);

      /* Nervaduras principales y secundarias desde el centro */
      const veinCount = 22;
      for (let i = 0; i < veinCount; i++) {
        const angle = (i / veinCount) * Math.PI * 2;
        const endX = 256 + Math.cos(angle) * 250;
        const endY = 256 + Math.sin(angle) * 250;
        const ctrlAngle = angle + (i % 2 === 0 ? 0.05 : -0.05);
        const ctrlX = 256 + Math.cos(ctrlAngle) * 130;
        const ctrlY = 256 + Math.sin(ctrlAngle) * 130;

        ctx.strokeStyle = "rgba(198, 238, 130, 0.52)";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(256, 256);
        ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
        ctx.stroke();

        /* Ramificaciones secundarias */
        for (let b = 1; b <= 2; b++) {
          const rStart = b * 82;
          const sx = 256 + Math.cos(angle) * rStart;
          const sy = 256 + Math.sin(angle) * rStart;
          const bAngle = angle + (b % 2 === 0 ? 0.22 : -0.22);
          ctx.lineWidth = 1.3;
          ctx.strokeStyle = "rgba(185, 230, 115, 0.35)";
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + Math.cos(bAngle) * 58, sy + Math.sin(bAngle) * 58);
          ctx.stroke();
        }
      }

      /* Punto umbilical central del tallo */
      const cg = ctx.createRadialGradient(256, 256, 1, 256, 256, 16);
      cg.addColorStop(0, "#d9f99d");
      cg.addColorStop(0.6, "#84cc16");
      cg.addColorStop(1, "rgba(132,204,22,0)");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(256, 256, 16, 0, Math.PI * 2);
      ctx.fill();

      return new THREE.CanvasTexture(c);
    };

    /* 4. Textura superior del Receptáculo Dorado (Semillero central del loto) */
    const createReceptacleTexture = () => {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext("2d");

      const rg = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
      rg.addColorStop(0, "#fef08a");
      rg.addColorStop(0.7, "#f59e0b");
      rg.addColorStop(1, "#b45309");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, 256, 256);

      /* Alveolos característicos del centro de la flor de loto */
      const holes = [
        [128, 128],
        [128, 86], [128, 170], [86, 128], [170, 128],
        [98, 98], [158, 98], [98, 158], [158, 158]
      ];
      holes.forEach(([hx, hy]) => {
        ctx.fillStyle = "rgba(146, 64, 14, 0.55)";
        ctx.beginPath();
        ctx.arc(hx, hy, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fde047";
        ctx.beginPath();
        ctx.arc(hx - 1.5, hy - 1.5, 4.5, 0, Math.PI * 2);
        ctx.fill();
      });

      return new THREE.CanvasTexture(c);
    };

    const envMap = createStudioEnvMap();
    const petalBump = createPetalBumpMap();
    const lilyPadTex = createLilyPadTexture();
    const receptacleTex = createReceptacleTexture();

    /* --- Inicialización del Renderer y Cámara en Vista Superior (Cenital) --- */
    const renderer = new THREE.WebGLRenderer({
      canvas: bgCanvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    const scene = new THREE.Scene();
    scene.environment = envMap;

    /* Cámara desde arriba (Vista Superior con ligero ángulo 3D para apreciar el volumen de los pétalos) */
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 9.2, 1.55);
    camera.lookAt(0, 0, 0);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    const compositionGroup = new THREE.Group();
    worldGroup.add(compositionGroup);

    /* Iluminación solar cenital cálida + luces de borde */
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.45);
    sunLight.position.set(3.5, 10, 4.5);
    scene.add(sunLight);

    const rimLight = new THREE.PointLight(0xfbbf24, 1.4, 18);
    rimLight.position.set(-4, 5, -3);
    scene.add(rimLight);

    const centerGlowLight = new THREE.PointLight(0xfef08a, 1.6, 6);
    centerGlowLight.position.set(0, 1.1, 0);
    compositionGroup.add(centerGlowLight);

    /* --- Construcción de las 2 Hojas de Nenúfar 3D con hendidura en V (como en la imagen de referencia) --- */
    const buildLilyPadMesh = (radius, cleftAngle) => {
      const ringSteps = 22;
      const segSteps = 68;
      const cleftHalfWidth = 0.24; /* Hendidura característica en V */
      const totalArc = Math.PI * 2 - cleftHalfWidth * 2;

      const positions = [];
      const uvs = [];
      const indices = [];

      for (let rIdx = 0; rIdx <= ringSteps; rIdx++) {
        const rNorm = rIdx / ringSteps;
        const r = rNorm * radius;

        for (let sIdx = 0; sIdx <= segSteps; sIdx++) {
          const sNorm = sIdx / segSteps;
          const theta = cleftAngle + cleftHalfWidth + sNorm * totalArc;

          /* Borde suavemente ondulado en 3D + hendidura central del tallo */
          const edgeWave = Math.sin(theta * 8) * 0.035 * Math.pow(rNorm, 2);
          const rimLift = Math.pow(rNorm, 3) * 0.09;
          const stemDimple = -Math.exp(-rNorm * 9) * 0.08;
          const y = edgeWave + rimLift + stemDimple;

          const x = Math.cos(theta) * r;
          const z = Math.sin(theta) * r;

          positions.push(x, y, z);
          uvs.push(0.5 + (Math.cos(theta - cleftAngle) * rNorm) * 0.49, 0.5 + (Math.sin(theta - cleftAngle) * rNorm) * 0.49);
        }
      }

      for (let rIdx = 0; rIdx < ringSteps; rIdx++) {
        for (let sIdx = 0; sIdx < segSteps; sIdx++) {
          const a = rIdx * (segSteps + 1) + sIdx;
          const b = a + segSteps + 1;
          indices.push(a, b, a + 1);
          indices.push(b, b + 1, a + 1);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();

      const mat = new THREE.MeshPhysicalMaterial({
        map: lilyPadTex,
        bumpMap: lilyPadTex,
        bumpScale: 0.025,
        roughness: 0.36,
        metalness: 0.04,
        clearcoat: 0.45,
        clearcoatRoughness: 0.28,
        side: THREE.DoubleSide
      });

      return new THREE.Mesh(geo, mat);
    };

    /* Hoja de Nenúfar 1 (Superior derecha, más grande — igual que en la imagen de referencia) */
    const padRight = buildLilyPadMesh(1.75, 0.08);
    padRight.position.set(1.08, -0.28, -0.18);
    compositionGroup.add(padRight);

    /* Hoja de Nenúfar 2 (Inferior izquierda, mediana — igual que en la imagen de referencia) */
    const padLeft = buildLilyPadMesh(1.38, Math.PI * 0.52);
    padLeft.position.set(-0.72, -0.34, 1.18);
    compositionGroup.add(padLeft);

    /* Gotas de agua cristalinas sobre las hojas de nenúfar */
    const dropGeo = new THREE.SphereGeometry(0.065, 16, 16);
    dropGeo.scale(1, 0.62, 1);
    const waterDropMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.05,
      metalness: 0.1,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.85,
      envMap,
      envMapIntensity: 2.4
    });
    const padDropCoords = [
      [1.45, -0.24, -0.55, 1.1],
      [1.72, -0.24, 0.38, 0.85],
      [0.85, -0.25, -0.95, 0.75],
      [-1.15, -0.31, 1.35, 1.0],
      [-0.45, -0.31, 1.72, 0.8]
    ];
    padDropCoords.forEach(([dx, dy, dz, s]) => {
      const d = new THREE.Mesh(dropGeo, waterDropMat);
      d.position.set(dx, dy, dz);
      d.scale.setScalar(s);
      compositionGroup.add(d);
    });

    /* --- Construcción de la Flor de Loto 3D Vista desde Arriba --- */
    const flowerHead = new THREE.Group();
    flowerHead.position.set(-0.22, 0.05, -0.15);
    compositionGroup.add(flowerHead);

    /* Constructor de Pétalos 3D Horizontales con UVs mapeados de base a punta */
    const buildLotusPetalGeo = (length, maxHalfWidth, cupDepth, tipLift) => {
      const uSteps = 20;
      const vSteps = 26;
      const positions = [];
      const uvs = [];
      const indices = [];

      for (let iv = 0; iv <= vSteps; iv++) {
        const v = iv / vSteps; /* 0 = base del pétalo, 1 = punta aguda del pétalo */
        /* Silueta auténtica de pétalo de loto: base estrecha, panza ancha y punta lanceolada */
        const widthProfile = Math.sin(Math.pow(v, 0.72) * Math.PI) * (1 - 0.18 * Math.pow(v, 2));
        const halfW = maxHalfWidth * widthProfile;
        const z = v * length;

        for (let iu = 0; iu <= uSteps; iu++) {
          const u = iu / uSteps;
          const s = (u - 0.5) * 2; /* -1 a 1 de borde izquierdo a derecho */
          const x = s * halfW;

          /* Forma cóncava acanalada (bordes elevados hacia arriba) + curva longitudinal hacia la punta */
          const cupY = Math.pow(Math.abs(s), 1.75) * cupDepth * Math.sin(v * Math.PI);
          const archY = Math.pow(v, 1.65) * tipLift - Math.sin(v * Math.PI) * 0.08;
          const centerRidge = -Math.exp(-Math.pow(s * 5, 2)) * 0.018 * Math.sin(v * Math.PI);
          const y = cupY + archY + centerRidge;

          positions.push(x, y, z);
          /* v=1 en la punta (arriba en el canvas 2D -> uv.y = 1) */
          uvs.push(u, v);
        }
      }

      for (let iv = 0; iv < vSteps; iv++) {
        for (let iu = 0; iu < uSteps; iu++) {
          const a = iv * (uSteps + 1) + iu;
          const b = a + uSteps + 1;
          indices.push(a, b, a + 1);
          indices.push(b, b + 1, a + 1);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return geo;
    };

    const petalMat = new THREE.MeshPhysicalMaterial({
      map: createRealisticPetalTexture(currentMode),
      bumpMap: petalBump,
      bumpScale: 0.018,
      roughness: 0.28,
      metalness: 0.03,
      clearcoat: 0.55,
      clearcoatRoughness: 0.22,
      envMap,
      envMapIntensity: 0.9,
      side: THREE.DoubleSide
    });

    /* 4 Anillos Concéntricos de Pétalos de Loto (34 pétalos en total visibles desde arriba) */
    const petals = [];
    const ringSpecs = [
      /* Anillo 1 (Interior, más erguido abrazando el receptáculo dorado) */
      { count: 7, len: 0.95, width: 0.34, cup: 0.16, lift: 0.48, pitch: -0.46, rOff: 0.24, yOff: 0.16, rotOff: 0 },
      /* Anillo 2 (Medio-interior) */
      { count: 8, len: 1.28, width: 0.44, cup: 0.18, lift: 0.38, pitch: -0.26, rOff: 0.28, yOff: 0.10, rotOff: Math.PI / 8 },
      /* Anillo 3 (Medio-exterior, pétalos amplios y acanalados) */
      { count: 9, len: 1.56, width: 0.52, cup: 0.19, lift: 0.26, pitch: -0.10, rOff: 0.32, yOff: 0.04, rotOff: 0.18 },
      /* Anillo 4 (Exterior, completamente abiertos sobre los nenúfares) */
      { count: 10, len: 1.72, width: 0.55, cup: 0.15, lift: 0.16, pitch: 0.04, rOff: 0.35, yOff: -0.02, rotOff: Math.PI / 10 }
    ];

    ringSpecs.forEach((spec, rIdx) => {
      const geo = buildLotusPetalGeo(spec.len, spec.width, spec.cup, spec.lift);
      for (let i = 0; i < spec.count; i++) {
        const pivot = new THREE.Group();
        const angle = (i / spec.count) * Math.PI * 2 + spec.rotOff;
        pivot.rotation.y = angle;
        pivot.position.y = spec.yOff;

        const mesh = new THREE.Mesh(geo, petalMat);
        mesh.position.z = spec.rOff;
        mesh.rotation.x = spec.pitch;
        pivot.add(mesh);
        flowerHead.add(pivot);

        petals.push({
          mesh,
          basePitch: spec.pitch,
          rIdx,
          i
        });
      }
    });

    /* Centro de la Flor de Loto: Receptáculo Dorado + 44 Estambres con Puntas de Polen */
    const receptacleGeo = new THREE.CylinderGeometry(0.36, 0.18, 0.24, 32);
    const receptacleSideMat = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      roughness: 0.35
    });
    const receptacleTopMat = new THREE.MeshStandardMaterial({
      map: receptacleTex,
      bumpMap: receptacleTex,
      bumpScale: 0.03,
      roughness: 0.3
    });
    const receptacleMesh = new THREE.Mesh(receptacleGeo, [receptacleSideMat, receptacleTopMat, receptacleSideMat]);
    receptacleMesh.position.y = 0.22;
    flowerHead.add(receptacleMesh);

    const stamenFilaments = [];
    const filamentMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xd97706,
      emissiveIntensity: 0.25,
      roughness: 0.3
    });
    const antherMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.45,
      roughness: 0.2
    });
    const filGeo = new THREE.CylinderGeometry(0.01, 0.014, 0.32, 6);
    const antGeo = new THREE.SphereGeometry(0.028, 8, 8);
    antGeo.scale(1, 1.5, 1);

    for (let i = 0; i < 44; i++) {
      const ring = i < 20 ? 0 : 1;
      const countInRing = ring === 0 ? 20 : 24;
      const idxInRing = ring === 0 ? i : i - 20;
      const angle = (idxInRing / countInRing) * Math.PI * 2 + ring * 0.14;

      const stPivot = new THREE.Group();
      stPivot.rotation.y = angle;
      stPivot.position.y = 0.18;

      const holder = new THREE.Group();
      holder.position.z = ring === 0 ? 0.34 : 0.40;
      const baseTilt = ring === 0 ? 0.45 : 0.68;
      holder.rotation.x = baseTilt;

      const fil = new THREE.Mesh(filGeo, filamentMat);
      fil.position.y = 0.16;
      const ant = new THREE.Mesh(antGeo, antherMat);
      ant.position.y = 0.33;

      holder.add(fil, ant);
      stPivot.add(holder);
      flowerHead.add(stPivot);
      stamenFilaments.push({ holder, baseTilt, idx: i });
    }

    /* --- Partículas Flotantes de Polen y Rocío en todo el Fondo del Hero --- */
    const bgSpores = [];
    const spGeo = new THREE.SphereGeometry(0.075, 12, 12);
    for (let i = 0; i < 30; i++) {
      const spMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? currentMode.sporeHex : currentMode.accentHex,
        transparent: true,
        opacity: 0.22 + Math.random() * 0.25
      });
      const sp = new THREE.Mesh(spGeo, spMat);
      const bx = (Math.random() - 0.5) * 14;
      const bz = (Math.random() - 0.5) * 7.5;
      const by = (Math.random() - 0.5) * 1.5;
      sp.position.set(bx, by, bz);
      sp.scale.setScalar(0.5 + Math.random() * 1.2);
      bgSpores.push({
        mesh: sp,
        bx,
        bz,
        by,
        speed: 0.3 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2
      });
      worldGroup.add(sp);
    }

    /* --- Posicionamiento Responsivo de la Flor de Loto en el Fondo Principal --- */
    const updateLayoutPosition = () => {
      const rect = heroSection.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();

      if (rect.width > 980) {
        /* En escritorio: ubicada en el lado derecho del fondo principal (en la ventana despejada) */
        const xOffset = Math.min(2.35, (rect.width / rect.height) * 0.92);
        compositionGroup.position.set(xOffset, 0, -0.32);
        compositionGroup.scale.setScalar(0.92);
      } else if (rect.width > 640) {
        /* En tablet: centrada en la zona inferior despejada */
        compositionGroup.position.set(0, 0, 0.85);
        compositionGroup.scale.setScalar(0.78);
      } else {
        /* En móvil: centrada y escalada para verse completa sin tapar el texto */
        compositionGroup.position.set(0, 0, 1.05);
        compositionGroup.scale.setScalar(0.66);
      }
    };
    updateLayoutPosition();
    window.addEventListener("resize", updateLayoutPosition);

    /* Interacción en todo el Hero y en la zona de la Flor de Loto */
    let pointerNormX = 0, pointerNormY = 0;
    let isDragging = false;
    let prevX = 0;
    let manualSpinY = 0;

    window.addEventListener("pointermove", (e) => {
      const rect = heroSection.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        pointerNormX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNormY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      }
      if (isDragging) {
        const dx = e.clientX - prevX;
        manualSpinY += dx * 0.01;
        prevX = e.clientX;
      }
    });

    if (orbStage) {
      orbStage.addEventListener("pointerdown", (e) => {
        if (e.target.closest("button")) return;
        isDragging = true;
        prevX = e.clientX;
        pulseEnergy = Math.min(pulseEnergy + 0.95, 1.5);
      });
    }

    window.addEventListener("pointerup", () => {
      isDragging = false;
    });

    /* Pausa cuando el Hero no está en pantalla */
    let isHeroVisible = true;
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        isHeroVisible = entries[0]?.isIntersecting ?? true;
      }, { threshold: 0.04 });
      io.observe(heroSection);
    }

    /* Loop de animación 3D */
    const clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);
      if (!isHeroVisible) return;

      const t = clock.getElapsedTime();
      pulseEnergy *= 0.94;
      bloomCurrent += (bloomTarget - bloomCurrent) * 0.06;

      /* Rotación suave de la flor de loto vista desde arriba + respuesta al cursor */
      flowerHead.rotation.y = t * 0.08 + manualSpinY + pointerNormX * 0.18;

      /* Inclinación 3D sutil de toda la composición al mover el cursor */
      const targetTiltX = pointerNormY * 0.14;
      const targetTiltZ = -pointerNormX * 0.14;
      compositionGroup.rotation.x += (targetTiltX - compositionGroup.rotation.x) * 0.06;
      compositionGroup.rotation.z += (targetTiltZ - compositionGroup.rotation.z) * 0.06;

      /* Vaivén orgánico de las hojas de nenúfar sobre el agua */
      padRight.rotation.y = Math.sin(t * 0.7) * 0.04;
      padRight.position.y = -0.28 + Math.sin(t * 1.1) * 0.03;
      padLeft.rotation.y = -Math.cos(t * 0.65) * 0.04;
      padLeft.position.y = -0.34 + Math.cos(t * 1.2) * 0.03;

      /* Respiración viva de los 34 pétalos de loto */
      petals.forEach((p) => {
        const wave = Math.sin(t * 1.5 - p.rIdx * 0.55 + p.i * 0.35) * 0.035;
        const pulsePitch = pulseEnergy * 0.14 * (p.rIdx + 1) * 0.3;
        p.mesh.rotation.x = p.basePitch * bloomCurrent + wave + pulsePitch;
      });

      /* Movimiento delicado de los estambres dorados centrales */
      stamenFilaments.forEach((st) => {
        st.holder.rotation.x = st.baseTilt + Math.sin(t * 2.2 + st.idx * 0.5) * 0.04 + pulseEnergy * 0.12;
      });

      /* Partículas de polen y rocío en el fondo del Hero */
      bgSpores.forEach((sp) => {
        sp.mesh.position.x = sp.bx + Math.sin(t * sp.speed + sp.phase) * 0.45 + pointerNormX * 0.35;
        sp.mesh.position.z = sp.bz + Math.cos(t * sp.speed + sp.phase) * 0.45 - pointerNormY * 0.35;
      });

      renderer.render(scene, camera);
    };
    animate();

    const applyModePalette = (modeKey) => {
      const next = MODES[modeKey] || MODES.comprar;
      currentModeKey = modeKey;
      currentMode = next;
      bloomTarget = next.bloomOpen;
      if (orbModeLabel) orbModeLabel.textContent = next.label;

      /* Actualizar textura realista de los pétalos con los colores de la sección activa */
      const newTex = createRealisticPetalTexture(next);
      if (petalMat.map) petalMat.map.dispose();
      petalMat.map = newTex;
      petalMat.needsUpdate = true;

      bgSpores.forEach((sp, idx) => {
        sp.mesh.material.color.setHex(idx % 2 === 0 ? next.sporeHex : next.accentHex);
      });
    };

    return {
      setMode(modeKey) {
        pulseEnergy = 0.85;
        applyModePalette(modeKey);
      },
      syncTheme(isDark) {
        ambientLight.intensity = isDark ? 0.72 : 0.88;
        sunLight.intensity = isDark ? 1.25 : 1.48;
      },
      triggerPulse() {
        pulseEnergy = 1.1;
      }
    };
  };

  threeController = initTopDownLotusThree();
});
