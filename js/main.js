// Точка входа: инициализация модулей, главный цикл, обработчики клика.
(function () {
  let lastTickT = performance.now();
  let audioStarted = false;

  function startAudioIfNeeded() {
    if (audioStarted) return;
    audioStarted = true;
    Audio.start();
  }

  function onPointer(ev) {
    // Игнорируем клики по элементам HUD — они обрабатывают сами
    if (ev.target && ev.target !== document.getElementById('game')) return;

    startAudioIfNeeded();

    let x, y;
    if (ev.touches && ev.touches.length) {
      x = ev.touches[0].clientX;
      y = ev.touches[0].clientY;
    } else if (ev.changedTouches && ev.changedTouches.length) {
      x = ev.changedTouches[0].clientX;
      y = ev.changedTouches[0].clientY;
    } else {
      x = ev.clientX;
      y = ev.clientY;
    }

    if (typeof x === 'number') {
      doClick(x, y);
    }
  }

  let firstFrameDone = false;
  function loop(now) {
    const dt = Math.min(0.1, (now - lastTickT) / 1000);
    lastTickT = now;

    // Пока показывается реклама — не накапливаем энергию и не двигаем сцену
    if (!Yandex.isAdShowing()) {
      tick(dt);
    }
    Render.frame(now);
    UI.update();
    Yandex.tick();

    if (!firstFrameDone) {
      firstFrameDone = true;
      Yandex.markGameReady();
    }

    requestAnimationFrame(loop);
  }

  function start() {
    Audio.init();
    Render.init();
    UI.init();
    Yandex.init();

    // Обработка кликов/тапов на canvas. Используем pointerdown — пускает и мышь, и тач.
    const canvas = document.getElementById('game');
    canvas.addEventListener('pointerdown', onPointer, { passive: true });

    // Первое взаимодействие должно стартануть AudioContext (политика браузера)
    window.addEventListener('pointerdown', startAudioIfNeeded, { once: true });
    window.addEventListener('keydown', startAudioIfNeeded, { once: true });

    // Предотвратить контекстное меню по правому клику
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    // Старт цикла
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
