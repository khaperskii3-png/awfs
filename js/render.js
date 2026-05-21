// Canvas рендер: фон, сцена стадии, переход, эффекты клика.
const Render = (() => {
  let canvas, ctx;
  let w = 0, h = 0, dpr = 1;
  let stars = [];                // Фоновое звёздное поле
  let stageDataCache = {};       // idx -> состояние сцены (кэшируется отдельно для каждой стадии)
  let clickRipples = [];         // Круги при клике

  function init() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    initStars();
    onStageEnter(State.stage);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initStars() {
    stars = [];
    const n = 140;
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.2 + 0.2,
        twinkle: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 1.4,
      });
    }
  }

  // Инициализация специфичных для стадии данных
  function buildStageData(idx) {
    const data = { idx };
    switch (idx) {
      case 0: // Кварк — хаос частиц
        data.particles = [];
        for (let i = 0; i < 60; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * 140;
          data.particles.push({
            x: Math.cos(a) * r, y: Math.sin(a) * r,
            vx: (Math.random() - 0.5) * 160,
            vy: (Math.random() - 0.5) * 160,
            r: 1.5 + Math.random() * 2.5,
            colorIdx: Math.floor(Math.random() * 3),
            trail: [],
          });
        }
        break;
      case 1: // Атом — электроны на орбитах
        data.electrons = [];
        for (let i = 0; i < 3; i++) {
          data.electrons.push({
            a: 80 + i * 35,
            b: 50 + i * 20,
            angle: i * 2.094,
            tilt: i * 1.04,
            speed: 1.8 - i * 0.4,
          });
        }
        break;
      case 2: // Молекула — связанные атомы
        data.atoms = [];
        const N = 5;
        for (let i = 0; i < N; i++) {
          const a = (i / N) * Math.PI * 2;
          data.atoms.push({
            ox: Math.cos(a) * 110,
            oy: Math.sin(a) * 110,
            wobble: Math.random() * Math.PI * 2,
            r: 14 + Math.random() * 6,
          });
        }
        data.atoms.push({ ox: 0, oy: 0, wobble: 0, r: 22 });
        break;
      case 3: // Клетка — пульсирующий организм
        data.organelles = [];
        for (let i = 0; i < 8; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * 60;
          data.organelles.push({
            x: Math.cos(a) * r, y: Math.sin(a) * r,
            r: 4 + Math.random() * 8,
            phase: Math.random() * Math.PI * 2,
            drift: Math.random() * Math.PI * 2,
          });
        }
        data.membranePoints = 32;
        break;
      case 4: // Существо
        data.path = []; // путь движения
        data.tail = []; // волна хвоста
        for (let i = 0; i < 8; i++) data.tail.push(0);
        break;
      case 5: // Планета
        data.cloudOffset = 0;
        data.moonAngle = 0;
        break;
      case 6: // Звезда
        data.prominences = [];
        for (let i = 0; i < 8; i++) {
          data.prominences.push({
            angle: (i / 8) * Math.PI * 2,
            length: 60 + Math.random() * 80,
            phase: Math.random() * Math.PI * 2,
          });
        }
        break;
      case 7: { // Галактика
        data.galaxyParticles = [];
        const arms = 3;
        for (let i = 0; i < 320; i++) {
          const arm = i % arms;
          const t = Math.random();
          const r = Math.pow(t, 0.7) * 230;
          const baseA = arm * (Math.PI * 2 / arms) + Math.pow(t, 0.5) * 4.5;
          const jitter = (Math.random() - 0.5) * 0.5;
          data.galaxyParticles.push({
            r,
            a: baseA + jitter,
            size: 0.5 + Math.random() * 1.8,
            brightness: 0.4 + Math.random() * 0.6,
          });
        }
        break;
      }
      case 8: { // Вселенная — сетка мини-галактик
        data.cells = [];
        for (let row = -1; row <= 1; row++) {
          for (let col = -1; col <= 1; col++) {
            data.cells.push({
              x: col * 140, y: row * 110,
              rot: Math.random() * Math.PI * 2,
              speed: 0.2 + Math.random() * 0.4,
            });
          }
        }
        data.webPoints = [];
        for (let i = 0; i < 60; i++) {
          data.webPoints.push({
            x: (Math.random() - 0.5) * 500,
            y: (Math.random() - 0.5) * 400,
            phase: Math.random() * Math.PI * 2,
          });
        }
        break;
      }
      case 9: { // Мультивселенная — пузыри
        data.bubbles = [];
        for (let i = 0; i < 6; i++) {
          data.bubbles.push({
            x: (Math.random() - 0.5) * 320,
            y: (Math.random() - 0.5) * 220,
            r: 50 + Math.random() * 50,
            phase: Math.random() * Math.PI * 2,
            driftA: Math.random() * Math.PI * 2,
            hue: Math.random() * 360,
          });
        }
        break;
      }
    }
    return data;
  }

  function getStageData(idx) {
    if (!stageDataCache[idx]) stageDataCache[idx] = buildStageData(idx);
    return stageDataCache[idx];
  }

  function onStageEnter(idx) {
    stageDataCache[idx] = buildStageData(idx);
  }

  function onClick(x, y) {
    clickRipples.push({ x, y, r: 0, life: 1.0, color: STAGES[State.stage].palette.main });
  }

  // ---- Главный цикл рендера ----
  let lastT = performance.now();
  function frame(nowMs) {
    const now = nowMs || performance.now();
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;

    drawBackground(now);
    drawStars(now / 1000);

    if (State.transitioning) {
      drawTransition(now);
    } else {
      drawStage(State.stage, now / 1000, 1.0);
    }

    drawClickRipples(dt);
    drawClickFx();
  }

  function drawBackground(now) {
    const pal = STAGES[State.stage].palette;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, pal.bg1);
    g.addColorStop(1, pal.bg2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function drawStars(t) {
    ctx.save();
    for (const s of stars) {
      const tw = 0.5 + 0.5 * Math.sin(t * s.speed + s.twinkle);
      ctx.globalAlpha = 0.35 + 0.5 * tw;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ---- Переход между стадиями ----
  const TRANSITION_MS = 2800;
  function drawTransition(now) {
    const elapsed = now - State.transitionStart;
    const p = Math.min(1, elapsed / TRANSITION_MS);

    // На середине переключаем стадию
    if (p >= 0.5 && State.stage === State.transitionFromStage) {
      completeAdvance();
    }

    // Фейд старой/новой сцены
    const oldAlpha = p < 0.5 ? 1 - p * 2 : 0;
    const newAlpha = p < 0.5 ? 0 : (p - 0.5) * 2;

    if (oldAlpha > 0) drawStage(State.transitionFromStage, now / 1000, oldAlpha);
    if (newAlpha > 0) drawStage(State.stage, now / 1000, newAlpha);

    // Вспышка
    const flash = Math.exp(-Math.pow((p - 0.5) * 6, 2));
    if (flash > 0.01) {
      ctx.save();
      ctx.globalAlpha = flash * 0.95;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // Расходящиеся кольца
    const cx = w / 2, cy = h / 2;
    for (let i = 0; i < 3; i++) {
      const lp = (p * 3 - i * 0.3) % 1;
      if (lp < 0 || lp > 1) continue;
      const r = lp * Math.max(w, h);
      ctx.save();
      ctx.globalAlpha = (1 - lp) * 0.5;
      ctx.strokeStyle = STAGES[State.stage].palette.main;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 30;
      ctx.shadowColor = STAGES[State.stage].palette.glow;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (p >= 1) endTransition();
  }

  // ---- Универсальный диспетчер стадий ----
  function drawStage(idx, t, alpha) {
    const data = getStageData(idx);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(w / 2, h / 2);
    const drawers = [
      drawQuark, drawAtom, drawMolecule, drawCell, drawCreature,
      drawPlanet, drawStar, drawGalaxy, drawUniverse, drawMultiverse,
    ];
    drawers[idx](t, data);
    ctx.restore();
  }

  // ---------- Стадия 0: Кварк ----------
  function drawQuark(t, data) {
    const pal = STAGES[0].palette;
    const colors = [pal.main, pal.accent, pal.extra];
    const R = 180;

    // Граница "вакуума"
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, R + 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const dt = 1 / 60;
    for (const p of data.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const d = Math.hypot(p.x, p.y);
      if (d > R) {
        const nx = p.x / d, ny = p.y / d;
        const dot = p.vx * nx + p.vy * ny;
        p.vx -= 2 * dot * nx;
        p.vy -= 2 * dot * ny;
        p.x = nx * R; p.y = ny * R;
      }
      p.trail.unshift({ x: p.x, y: p.y });
      if (p.trail.length > 8) p.trail.pop();

      const col = colors[p.colorIdx];
      ctx.save();
      ctx.shadowBlur = 14;
      ctx.shadowColor = col;
      // Хвост
      ctx.strokeStyle = col;
      ctx.lineWidth = p.r * 0.6;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      for (let i = 0; i < p.trail.length; i++) {
        const tp = p.trail[i];
        if (i === 0) ctx.moveTo(tp.x, tp.y);
        else ctx.lineTo(tp.x, tp.y);
      }
      ctx.stroke();
      // Частица
      ctx.globalAlpha = 1;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ---------- Стадия 1: Атом ----------
  function drawAtom(t, data) {
    const pal = STAGES[1].palette;

    // Орбиты
    ctx.save();
    ctx.strokeStyle = pal.accent;
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;
    for (const e of data.electrons) {
      ctx.save();
      ctx.rotate(e.tilt);
      ctx.beginPath();
      ctx.ellipse(0, 0, e.a, e.b, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // Ядро
    const pulse = 1 + 0.06 * Math.sin(t * 3);
    ctx.save();
    ctx.shadowBlur = 40;
    ctx.shadowColor = pal.glow;
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 26 * pulse);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, pal.main);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 26 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Электроны
    for (const e of data.electrons) {
      e.angle += e.speed * 1/60;
      const lx = Math.cos(e.angle) * e.a;
      const ly = Math.sin(e.angle) * e.b;
      const cs = Math.cos(e.tilt), sn = Math.sin(e.tilt);
      const x = lx * cs - ly * sn;
      const y = lx * sn + ly * cs;

      ctx.save();
      ctx.shadowBlur = 24;
      ctx.shadowColor = pal.accent;
      ctx.fillStyle = pal.accent;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ---------- Стадия 2: Молекула ----------
  function drawMolecule(t, data) {
    const pal = STAGES[2].palette;
    const rot = t * 0.4;

    // Связи
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = pal.glow;
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.6;
    const center = data.atoms[data.atoms.length - 1];
    for (let i = 0; i < data.atoms.length - 1; i++) {
      const a = data.atoms[i];
      const ax = Math.cos(rot) * a.ox - Math.sin(rot) * a.oy;
      const ay = Math.sin(rot) * a.ox + Math.cos(rot) * a.oy;
      ctx.beginPath();
      ctx.moveTo(center.ox, center.oy);
      ctx.lineTo(ax, ay);
      ctx.stroke();
    }
    ctx.restore();

    // Атомы
    for (let i = 0; i < data.atoms.length; i++) {
      const a = data.atoms[i];
      a.wobble += 1/60 * 2;
      const wob = Math.sin(a.wobble) * 2;
      let x, y;
      if (i === data.atoms.length - 1) {
        x = a.ox; y = a.oy;
      } else {
        x = Math.cos(rot) * a.ox - Math.sin(rot) * a.oy;
        y = Math.sin(rot) * a.ox + Math.cos(rot) * a.oy;
      }
      const r = a.r + wob;

      ctx.save();
      ctx.shadowBlur = 22;
      ctx.shadowColor = pal.glow;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.5, pal.main);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ---------- Стадия 3: Клетка ----------
  function drawCell(t, data) {
    const pal = STAGES[3].palette;
    const baseR = 140;
    const pulse = 1 + 0.08 * Math.sin(t * 1.8);

    // Мембрана
    ctx.save();
    ctx.shadowBlur = 30;
    ctx.shadowColor = pal.glow;
    const grad = ctx.createRadialGradient(0, 0, baseR * 0.2, 0, 0, baseR);
    grad.addColorStop(0, 'rgba(255, 80, 140, 0.45)');
    grad.addColorStop(0.7, 'rgba(255, 60, 100, 0.18)');
    grad.addColorStop(1, 'rgba(60, 0, 30, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    const N = data.membranePoints;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const wob = Math.sin(a * 4 + t * 1.5) * 6 + Math.sin(a * 7 + t * 0.7) * 4;
      const r = baseR * pulse + wob;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = pal.main;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.restore();

    // Ядро клетки
    ctx.save();
    ctx.shadowBlur = 24;
    ctx.shadowColor = pal.glow;
    const ng = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
    ng.addColorStop(0, '#ffaadd');
    ng.addColorStop(1, 'rgba(150, 0, 60, 0.0)');
    ctx.fillStyle = ng;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Органеллы
    for (const o of data.organelles) {
      o.drift += 1/60 * 0.4;
      const cx = o.x + Math.cos(o.drift + o.phase) * 12;
      const cy = o.y + Math.sin(o.drift) * 12;
      const r = o.r * (1 + 0.2 * Math.sin(t * 2.5 + o.phase));
      ctx.save();
      ctx.shadowBlur = 16;
      ctx.shadowColor = pal.accent;
      ctx.fillStyle = pal.accent;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ---------- Стадия 4: Существо ----------
  function drawCreature(t, data) {
    const pal = STAGES[4].palette;
    // Тело плывёт по фигурной траектории
    const cx = Math.sin(t * 0.5) * 140;
    const cy = Math.cos(t * 0.7) * 80;
    const heading = Math.atan2(Math.cos(t * 0.7) * 80 * 0.7 * -1, Math.cos(t * 0.5) * 140 * 0.5);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(heading);

    // Хвост (волна)
    ctx.shadowBlur = 18;
    ctx.shadowColor = pal.glow;
    ctx.strokeStyle = pal.main;
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < 30; i++) {
      const xi = -i * 4;
      const yi = Math.sin(t * 8 + i * 0.5) * (i * 0.4);
      if (i === 0) ctx.moveTo(xi, yi); else ctx.lineTo(xi, yi);
    }
    ctx.stroke();

    // Тело — эллипс
    ctx.fillStyle = pal.main;
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Брюшко
    ctx.fillStyle = pal.accent;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.ellipse(0, 6, 30, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Плавник верхний
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = pal.extra;
    ctx.beginPath();
    ctx.moveTo(-4, -12);
    ctx.quadraticCurveTo(0, -32, 14, -10);
    ctx.closePath();
    ctx.fill();

    // Глаз
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(22, -4, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(23, -5, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ---------- Стадия 5: Планета ----------
  function drawPlanet(t, data) {
    const pal = STAGES[5].palette;
    const R = 110;

    // Атмосфера
    ctx.save();
    ctx.shadowBlur = 40;
    ctx.shadowColor = pal.glow;
    const ag = ctx.createRadialGradient(0, 0, R * 0.9, 0, 0, R * 1.25);
    ag.addColorStop(0, 'rgba(100, 180, 255, 0.5)');
    ag.addColorStop(1, 'rgba(100, 180, 255, 0)');
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Сфера
    ctx.save();
    ctx.shadowBlur = 30;
    ctx.shadowColor = pal.glow;
    const g = ctx.createRadialGradient(-30, -30, 10, 0, 0, R);
    g.addColorStop(0, '#aaddff');
    g.addColorStop(0.5, pal.main);
    g.addColorStop(1, '#001a44');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Континенты (клиппинг)
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = 'rgba(80, 180, 90, 0.75)';
    const off = (data.cloudOffset += 1/60 * 8) % 360;
    for (let i = 0; i < 5; i++) {
      const x = ((i * 70 - off) % 280) - 140;
      ctx.beginPath();
      ctx.ellipse(x, -20 + i * 8, 28 + (i % 3) * 8, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
    for (let i = 0; i < 4; i++) {
      const x = ((i * 100 - off * 1.6) % 320) - 160;
      ctx.beginPath();
      ctx.ellipse(x, 20 - i * 6, 36, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Кольцо
    ctx.save();
    ctx.rotate(0.3);
    ctx.scale(1, 0.25);
    ctx.strokeStyle = 'rgba(255, 220, 180, 0.6)';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#ffddaa';
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Луна
    data.moonAngle += 1/60 * 0.8;
    const mx = Math.cos(data.moonAngle) * (R * 2);
    const my = Math.sin(data.moonAngle) * (R * 0.6);
    ctx.save();
    ctx.shadowBlur = 16;
    ctx.shadowColor = '#ffffff';
    const mg = ctx.createRadialGradient(mx - 4, my - 4, 1, mx, my, 16);
    mg.addColorStop(0, '#ffffff');
    mg.addColorStop(1, '#665566');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(mx, my, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ---------- Стадия 6: Звезда ----------
  function drawStar(t, data) {
    const pal = STAGES[6].palette;
    const pulse = 1 + 0.05 * Math.sin(t * 1.4);
    const R = 90 * pulse;

    // Корона
    ctx.save();
    ctx.shadowBlur = 60;
    ctx.shadowColor = pal.glow;
    const cg = ctx.createRadialGradient(0, 0, R * 0.7, 0, 0, R * 2.4);
    cg.addColorStop(0, 'rgba(255, 200, 80, 0.7)');
    cg.addColorStop(0.5, 'rgba(255, 120, 30, 0.25)');
    cg.addColorStop(1, 'rgba(80, 0, 0, 0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, 0, R * 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Протуберанцы
    for (const p of data.prominences) {
      p.angle += 1/60 * 0.15;
      const flick = 0.7 + 0.3 * Math.sin(t * 5 + p.phase);
      const len = p.length * flick;
      const a = p.angle;
      ctx.save();
      ctx.shadowBlur = 30;
      ctx.shadowColor = pal.extra;
      ctx.strokeStyle = pal.extra;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * R, Math.sin(a) * R);
      // Дуга
      const mid = R + len * 0.5;
      const mx = Math.cos(a + 0.25) * mid;
      const my = Math.sin(a + 0.25) * mid;
      const ex = Math.cos(a + 0.5) * R;
      const ey = Math.sin(a + 0.5) * R;
      ctx.quadraticCurveTo(mx, my, ex, ey);
      ctx.stroke();
      ctx.restore();
    }

    // Ядро
    ctx.save();
    ctx.shadowBlur = 40;
    ctx.shadowColor = pal.accent;
    const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    sg.addColorStop(0, '#ffffff');
    sg.addColorStop(0.4, pal.accent);
    sg.addColorStop(1, pal.main);
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ---------- Стадия 7: Галактика ----------
  function drawGalaxy(t, data) {
    const pal = STAGES[7].palette;
    const rot = t * 0.18;

    // Тёмный ореол
    ctx.save();
    const dg = ctx.createRadialGradient(0, 0, 30, 0, 0, 260);
    dg.addColorStop(0, 'rgba(140, 100, 200, 0.18)');
    dg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = dg;
    ctx.beginPath();
    ctx.arc(0, 0, 260, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Звёзды спирали
    ctx.save();
    ctx.shadowBlur = 8;
    for (const s of data.galaxyParticles) {
      const a = s.a + rot;
      const x = Math.cos(a) * s.r;
      const y = Math.sin(a) * s.r * 0.55;
      const col = s.r < 80 ? pal.accent : (s.r < 160 ? pal.main : pal.extra);
      ctx.shadowColor = col;
      ctx.fillStyle = col;
      ctx.globalAlpha = s.brightness;
      ctx.beginPath();
      ctx.arc(x, y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Ядро
    ctx.save();
    ctx.shadowBlur = 50;
    ctx.shadowColor = pal.accent;
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, 50);
    cg.addColorStop(0, '#ffffff');
    cg.addColorStop(0.4, pal.accent);
    cg.addColorStop(1, 'rgba(120, 80, 200, 0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.ellipse(0, 0, 50, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ---------- Стадия 8: Вселенная (сетка галактик) ----------
  function drawUniverse(t, data) {
    const pal = STAGES[8].palette;

    // Космическая паутина — линии и узлы
    ctx.save();
    ctx.strokeStyle = pal.extra;
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 1;
    const pts = data.webPoints;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const d = Math.hypot(dx, dy);
        if (d < 110) {
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      }
    }
    for (const p of pts) {
      const sz = 0.6 + 0.4 * Math.sin(t * 2 + p.phase);
      ctx.shadowBlur = 8;
      ctx.shadowColor = pal.accent;
      ctx.fillStyle = pal.accent;
      ctx.globalAlpha = 0.5 * sz;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5 + sz, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Мини-галактики в узлах
    for (const c of data.cells) {
      c.rot += 1/60 * c.speed;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      // Спираль из 25 точек
      for (let i = 0; i < 24; i++) {
        const tt = i / 24;
        const a = tt * 5;
        const r = tt * 30;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r * 0.55;
        ctx.shadowBlur = 6;
        ctx.shadowColor = pal.main;
        ctx.fillStyle = pal.main;
        ctx.globalAlpha = 0.4 + tt * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, 0.8 + (1 - tt) * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      // Ядро
      ctx.shadowBlur = 14;
      ctx.shadowColor = pal.accent;
      ctx.fillStyle = pal.accent;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ---------- Стадия 9: Мультивселенная ----------
  function drawMultiverse(t, data) {
    const pal = STAGES[9].palette;
    for (const b of data.bubbles) {
      b.phase += 1/60 * 0.5;
      b.driftA += 1/60 * 0.3;
      const bx = b.x + Math.cos(b.driftA) * 14;
      const by = b.y + Math.sin(b.driftA * 0.7) * 10;
      const r = b.r * (1 + 0.06 * Math.sin(t * 1.4 + b.phase));
      const hue = (b.hue + t * 30) % 360;

      ctx.save();
      ctx.shadowBlur = 30;
      ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;

      // Пузырь
      const g = ctx.createRadialGradient(bx - r * 0.3, by - r * 0.3, r * 0.1, bx, by, r);
      g.addColorStop(0, `hsla(${hue}, 100%, 85%, 0.35)`);
      g.addColorStop(0.7, `hsla(${(hue + 60) % 360}, 100%, 50%, 0.18)`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();

      // Внутри — маленькая вселенная (точки)
      ctx.save();
      ctx.beginPath();
      ctx.arc(bx, by, r * 0.85, 0, Math.PI * 2);
      ctx.clip();
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2 + b.phase;
        const rr = ((i * 7) % r) * 0.85;
        const x = bx + Math.cos(a + i) * rr;
        const y = by + Math.sin(a * 1.3 + i) * rr;
        ctx.fillStyle = `hsl(${(hue + i * 18) % 360}, 100%, 80%)`;
        ctx.beginPath();
        ctx.arc(x, y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Контур
      ctx.strokeStyle = `hsla(${hue}, 100%, 80%, 0.65)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ---------- Эффекты клика ----------
  function drawClickRipples(dt) {
    for (let i = clickRipples.length - 1; i >= 0; i--) {
      const r = clickRipples[i];
      r.life -= dt * 1.8;
      r.r += dt * 220;
      if (r.life <= 0) { clickRipples.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = r.life * 0.8;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 18;
      ctx.shadowColor = r.color;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawClickFx() {
    for (const f of State.clickFx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = f.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = f.color;
      ctx.font = 'bold 16px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
  }

  return { init, frame, onStageEnter, onClick };
})();
