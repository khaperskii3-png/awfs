// Интеграция Яндекс Игры SDK с фолбэком для локальной разработки.
const Yandex = (() => {
  let ysdk = null;
  let ready = false;
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
        if (ysdk.features && ysdk.features.LoadingAPI && ysdk.features.LoadingAPI.ready) {
          try { ysdk.features.LoadingAPI.ready(); } catch (e) {}
        }
      })
      .catch(err => {
        console.warn('[Yandex] init failed:', err);
        ready = true;
        lastFullscreenTime = performance.now();
      });
  }

  function tick() {
    if (!ready) return;
    if (State.transitioning) return;
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
          onOpen: () => { Audio.setMuted(true); },
          onClose: () => { Audio.setMuted(false); },
          onError: (e) => { Audio.setMuted(false); console.warn('[Yandex] adv error:', e); },
        },
      });
    } catch (e) {
      console.warn('[Yandex] fullscreen exception:', e);
    }
  }

  function showRewarded(onReward, onClose) {
    if (rewardedInFlight) return;
    rewardedInFlight = true;
    if (!ysdk || !ysdk.adv || !ysdk.adv.showRewardedVideo) {
      // Локальный режим: моментально награждаем
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
          onOpen: () => { Audio.setMuted(true); },
          onRewarded: () => { rewarded = true; onReward && onReward(); },
          onClose: () => {
            Audio.setMuted(false);
            rewardedInFlight = false;
            onClose && onClose();
            if (!rewarded) console.log('[Yandex] rewarded закрыт без награды');
          },
          onError: (e) => {
            Audio.setMuted(false);
            rewardedInFlight = false;
            console.warn('[Yandex] rewarded error:', e);
            onClose && onClose();
          },
        },
      });
    } catch (e) {
      rewardedInFlight = false;
      console.warn('[Yandex] rewarded exception:', e);
    }
  }

  function nextAdInMs() {
    return Math.max(0, FULLSCREEN_INTERVAL_MS - (performance.now() - lastFullscreenTime));
  }

  return { init, tick, showFullscreenAd, showRewarded, nextAdInMs };
})();
