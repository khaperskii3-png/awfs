// Состояние игры и формулы.
const State = {
  energy: 0,
  totalEnergy: 0,
  stage: 0,
  upgrades: { click: 0, auto: 0, mult: 0 },
  multiplier: 1,           // Постоянный множитель от эволюций
  boosterEndTime: 0,       // performance.now() мс
  transitioning: false,
  transitionStart: 0,
  transitionFromStage: 0,
  clickFx: [],             // Всплывающие "+N" числа после клика
};

const UPGRADE_DEFS = {
  click: {
    name: 'Сила клика',
    baseCost: 10,
    growth: 1.15,
    effect: lvl => `+${lvl + 1} за клик`,
  },
  auto: {
    name: 'Авто-генератор',
    baseCost: 25,
    growth: 1.18,
    effect: lvl => `+${(lvl * 0.5).toFixed(1)} в секунду`,
  },
  mult: {
    name: 'Резонанс',
    baseCost: 100,
    growth: 1.30,
    effect: lvl => `+${lvl * 10}% ко всему`,
  },
};

function clickPower() {
  return (1 + State.upgrades.click) * totalMultiplier();
}

function autoRate() {
  return State.upgrades.auto * 0.5 * totalMultiplier();
}

function totalMultiplier() {
  const upgradeMult = 1 + State.upgrades.mult * 0.1;
  const booster = isBoosterActive() ? 2 : 1;
  return upgradeMult * State.multiplier * booster;
}

function isBoosterActive() {
  return performance.now() < State.boosterEndTime;
}

function boosterRemainingMs() {
  return Math.max(0, State.boosterEndTime - performance.now());
}

function upgradeCost(type) {
  const def = UPGRADE_DEFS[type];
  return Math.floor(def.baseCost * Math.pow(def.growth, State.upgrades[type]));
}

function buyUpgrade(type) {
  const cost = upgradeCost(type);
  if (State.energy < cost) return false;
  State.energy -= cost;
  State.upgrades[type]++;
  Audio.playUpgrade();
  return true;
}

function advanceCost() {
  return STAGES[State.stage].advanceCost;
}

function canAdvance() {
  return State.stage < STAGES.length - 1 && State.energy >= advanceCost();
}

function startAdvance() {
  if (!canAdvance() || State.transitioning) return false;
  State.energy -= advanceCost();
  State.transitioning = true;
  State.transitionStart = performance.now();
  State.transitionFromStage = State.stage;
  Audio.playTransition();
  return true;
}

function completeAdvance() {
  State.stage++;
  State.multiplier *= 1.5;
  Audio.onStageChange(State.stage);
  Render.onStageEnter(State.stage);
}

function endTransition() {
  State.transitioning = false;
}

function doClick(x, y) {
  if (State.transitioning) return;
  const gain = clickPower();
  State.energy += gain;
  State.totalEnergy += gain;
  Audio.playClick();
  State.clickFx.push({
    x, y,
    text: '+' + fmtNum(gain),
    life: 1.0,
    vy: -40,
    color: STAGES[State.stage].palette.main,
  });
  Render.onClick(x, y);
}

function tick(dt) {
  if (State.transitioning) return;
  const gain = autoRate() * dt;
  if (gain > 0) {
    State.energy += gain;
    State.totalEnergy += gain;
  }
  // Обновление всплывающих чисел
  for (let i = State.clickFx.length - 1; i >= 0; i--) {
    const f = State.clickFx[i];
    f.life -= dt * 1.4;
    f.y += f.vy * dt;
    if (f.life <= 0) State.clickFx.splice(i, 1);
  }
}

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
function fmtNum(n) {
  if (!isFinite(n)) return '∞';
  if (n < 0.01) return '0';
  if (n < 1000) {
    if (Number.isInteger(n)) return n.toString();
    return parseFloat(n.toFixed(2)).toString();
  }
  let i = 0;
  while (n >= 1000 && i < SUFFIXES.length - 1) { n /= 1000; i++; }
  return n.toFixed(2) + SUFFIXES[i];
}

function fmtTime(ms) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m + ':' + (r < 10 ? '0' : '') + r;
}
