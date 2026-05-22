// Интеграция Яндекс Игры SDK с фолбэком для локальной разработки.
const Yandex = (() => {
  let ysdk = null;
  let ready = false;
  let gameReadyReported = false;
  let adInProgress = false;
  let lastFullscreenTime = 0;
  const FULLSCREEN_INTERVAL_MS = 3 * 60 * 1000;
  let rewardedInFlight = false;

  function init() {
    if (typeof window.YaGames === 'undefined') {
      console.log('[Yandex] SDK не доступен — локальный режим');
      lastFullscreenTime = performance.now();
      ready = true;
      return;
    }
    window.YaGames.init()
      .then(sdk => {
        ysdk = sdk;
        ready = true;
        lastFullscreenTime = performance.now();
        console.log('[Yandex] SDK готов');
      })
      .catch(err => {
        console.warn('[Yandex] init failed:', err);
        ready = true;
        lastFullscreenTime = performance.now();
      });
  }

  // Вызывается из main.js после первого кадра — сигнал «игра готова к игре»
  function markGameReady() {
    if (gameReadyReported) return;
    gameReadyReported = true;
    if (ysdk && ysdk.features && ysdk.features.LoadingAPI && ysdk.features.LoadingAPI.ready) {
      try { ysdk.features.LoadingAPI.ready(); } catch (e) { console.warn('[Yandex] LoadingAPI.ready:', e); }
    }
  }

  function isAdShowing() { return adInProgress; }

  function tick() {
    if (!ready) return;
    if (State.transitioning || adInProgress) return;
    const now = performance.now();
    if (now - lastFullscreenTime >= FULLSCREEN_INTERVAL_MS) {
      showFullscreenAd();
    }
  }

  function showFullscreenAd() {
    lastFullscreenTime = performance.now();
    if (!ysdk || !ysdk.adv || !ysdk.adv.showFullscreenAdv) {
      console.log('[Yandex] fullscreen ad (заглушка)');
      return;
    }
    try {
      ysdk.adv.showFullscreenAdv({
        callbacks: {
          onOpen: () => { adInProgress = true; Audio.setMuted(true); },
          onClose: (wasShown) => { adInProgress = false; Audio.setMuted(false); },
          onError: (e) => { adInProgress = false; Audio.setMuted(false); console.warn('[Yandex] adv error:', e); },
          onOffline: () => { adInProgress = false; Audio.setMuted(false); },
        },
      });
    } catch (e) {
      adInProgress = false;
      Audio.setMuted(false);
      console.warn('[Yandex] fullscreen exception:', e);
    }
  }

  function showRewarded(onReward, onClose) {
    if (rewardedInFlight) return;
    rewardedInFlight = true;
    if (!ysdk || !ysdk.adv || !ysdk.adv.showRewardedVideo) {
      console.log('[Yandex] rewarded (заглушка) — выдаём бонус сразу');
      setTimeout(() => {
        rewardedInFlight = false;
        onReward && onReward();
        onClose && onClose();
      }, 200);
      return;
    }
    let rewarded = false;
    try {
      ysdk.adv.showRewardedVideo({
        callbacks: {
          onOpen: () => { adInProgress = true; Audio.setMuted(true); },
          onRewarded: () => { rewarded = true; onReward && onReward(); },
          onClose: () => {
            adInProgress = false;
            Audio.setMuted(false);
            rewardedInFlight = false;
            onClose && onClose();
            if (!rewarded) console.log('[Yandex] rewarded закрыт без награды');
          },
          onError: (e) => {
            adInProgress = false;
            Audio.setMuted(false);
            rewardedInFlight = false;
            console.warn('[Yandex] rewarded error:', e);
            onClose && onClose();
          },
        },
      });
    } catch (e) {
      adInProgress = false;
      Audio.setMuted(false);
      rewardedInFlight = false;
      console.warn('[Yandex] rewarded exception:', e);
    }
  }

  function nextAdInMs() {
    return Math.max(0, FULLSCREEN_INTERVAL_MS - (performance.now() - lastFullscreenTime));
  }

  return { init, markGameReady, tick, showFullscreenAd, showRewarded, nextAdInMs, isAdShowing };
})();
