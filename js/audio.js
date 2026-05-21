// Web Audio: генеративный амбиент по стадиям + клик + переход.
const Audio = (() => {
  let ctx = null;
  let masterGain = null;
  let ambientGain = null;
  let ambientNodes = [];   // {osc, gain, lfo, lfoGain}
  let started = false;
  let muted = false;

  function init() {
    if (ctx) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      ctx = new Ctx();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.5;
      masterGain.connect(ctx.destination);

      ambientGain = ctx.createGain();
      ambientGain.gain.value = 0;
      ambientGain.connect(masterGain);
    } catch (e) {
      ctx = null;
    }
  }

  function start() {
    if (started || !ctx) return;
    started = true;
    if (ctx.state === 'suspended') ctx.resume();
    setStageAmbient(State.stage);
    fadeAmbient(0.22, 1.5);
  }

  function fadeAmbient(target, sec) {
    if (!ambientGain) return;
    const now = ctx.currentTime;
    ambientGain.gain.cancelScheduledValues(now);
    ambientGain.gain.setValueAtTime(ambientGain.gain.value, now);
    ambientGain.gain.linearRampToValueAtTime(muted ? 0 : target, now + sec);
  }

  function stopAmbient() {
    for (const n of ambientNodes) {
      try {
        n.osc.stop(ctx.currentTime + 1.4);
        if (n.lfo) n.lfo.stop(ctx.currentTime + 1.4);
        n.gain.gain.cancelScheduledValues(ctx.currentTime);
        n.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
      } catch (e) {}
    }
    ambientNodes = [];
  }

  function setStageAmbient(stageIdx) {
    if (!ctx) return;
    stopAmbient();
    const stage = STAGES[stageIdx];
    const f = stage.audio.fundamental;
    const harmonics = stage.audio.harmonics;
    const wave = stageIdx < 3 ? 'sawtooth' : stageIdx < 6 ? 'triangle' : 'sine';

    harmonics.forEach((h, i) => {
      const osc = ctx.createOscillator();
      osc.type = wave;
      osc.frequency.value = f * h;
      osc.detune.value = (Math.random() - 0.5) * 12;

      const g = ctx.createGain();
      g.gain.value = 0;
      const target = 0.18 / Math.sqrt(harmonics.length) / (1 + i * 0.4);
      g.gain.linearRampToValueAtTime(target, ctx.currentTime + 1.5);

      // Низкий фильтр
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800 + stageIdx * 120;
      filter.Q.value = 1.2;

      // Медленный LFO на амплитуду
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.08 + Math.random() * 0.15;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = target * 0.35;
      lfo.connect(lfoGain);
      lfoGain.connect(g.gain);

      osc.connect(filter);
      filter.connect(g);
      g.connect(ambientGain);

      osc.start();
      lfo.start();
      ambientNodes.push({ osc, gain: g, lfo, lfoGain });
    });
  }

  function onStageChange(stageIdx) {
    if (!ctx || !started) return;
    setStageAmbient(stageIdx);
  }

  function playClick() {
    if (!ctx || !started) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    const stage = STAGES[State.stage];
    const f = stage.audio.fundamental * 4;
    osc.frequency.setValueAtTime(f * (1 + Math.random() * 0.3), t);
    osc.frequency.exponentialRampToValueAtTime(f * 0.5, t + 0.12);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);

    osc.connect(g);
    g.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  function playUpgrade() {
    if (!ctx || !started) return;
    const t = ctx.currentTime;
    [1, 1.5, 2].forEach((mult, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      const f = 440 * mult;
      osc.frequency.setValueAtTime(f, t + i * 0.06);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t + i * 0.06);
      g.gain.linearRampToValueAtTime(0.08, t + i * 0.06 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.06 + 0.3);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.32);
    });
  }

  function playTransition() {
    if (!ctx || !started) return;
    const t = ctx.currentTime;

    // Восходящий sweep
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 2.4);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.exponentialRampToValueAtTime(6000, t + 2.4);
    filter.Q.value = 8;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.18, t + 0.3);
    g.gain.linearRampToValueAtTime(0.0, t + 2.6);

    osc.connect(filter);
    filter.connect(g);
    g.connect(masterGain);
    osc.start(t);
    osc.stop(t + 2.7);

    // "Колокол" в середине
    [1, 1.5, 2, 3].forEach((m, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = 440 * m;
      const og = ctx.createGain();
      og.gain.setValueAtTime(0, t + 1.4);
      og.gain.linearRampToValueAtTime(0.08 / (i + 1), t + 1.42);
      og.gain.exponentialRampToValueAtTime(0.0001, t + 3.0);
      o.connect(og);
      og.connect(masterGain);
      o.start(t + 1.4);
      o.stop(t + 3.1);
    });
  }

  function setMuted(m) {
    muted = m;
    if (!ctx) return;
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(m ? 0 : 0.5, ctx.currentTime + 0.3);
  }

  function isMuted() { return muted; }

  return { init, start, onStageChange, playClick, playUpgrade, playTransition, setMuted, isMuted };
})();
