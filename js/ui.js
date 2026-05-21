// Привязка DOM к состоянию: апгрейды, прогресс, бустер, кнопка эволюции и рекламы.
const UI = (() => {
  let elEnergy, elRate, elStageName, elStageDesc, elMultiplier, elBooster;
  let elProgress, elAdvancePanel, elAdvanceTarget, elAdvanceBtn, elAdvanceCostInfo;
  let elRewardedBtn, elAdStatus, elHint, elTransitionText;
  let upgradeEls = {};
  let hintHiddenAt = 0;

  function init() {
    elEnergy = document.getElementById('energy');
    elRate = document.getElementById('rate');
    elStageName = document.getElementById('stage-name');
    elStageDesc = document.getElementById('stage-desc');
    elMultiplier = document.getElementById('multiplier');
    elBooster = document.getElementById('booster');
    elProgress = document.getElementById('stage-progress-fill');
    elAdvancePanel = document.getElementById('advance-panel');
    elAdvanceTarget = document.getElementById('advance-target');
    elAdvanceBtn = document.getElementById('advance-btn');
    elAdvanceCostInfo = document.getElementById('advance-cost-info');
    elRewardedBtn = document.getElementById('rewarded-btn');
    elAdStatus = document.getElementById('ad-status');
    elHint = document.getElementById('hint');
    elTransitionText = document.getElementById('transition-text');

    document.querySelectorAll('.upgrade').forEach(node => {
      const type = node.dataset.type;
      upgradeEls[type] = {
        root: node,
        level: node.querySelector('.u-level'),
        effect: node.querySelector('.u-effect'),
        buy: node.querySelector('.u-buy'),
      };
      upgradeEls[type].buy.addEventListener('click', (e) => {
        e.stopPropagation();
        buyUpgrade(type);
      });
    });

    elAdvanceBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (startAdvance()) {
        showTransitionText();
      }
    });

    elRewardedBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      elRewardedBtn.disabled = true;
      elAdStatus.textContent = 'Загрузка рекламы…';
      Yandex.showRewarded(
        () => {
          // Активировать бустер на 5 минут
          const now = performance.now();
          const remaining = Math.max(0, State.boosterEndTime - now);
          State.boosterEndTime = now + remaining + 5 * 60 * 1000;
          elAdStatus.textContent = '×2 активирован!';
          setTimeout(() => { elAdStatus.textContent = ''; }, 2500);
        },
        () => {
          elRewardedBtn.disabled = false;
          if (!isBoosterActive()) elAdStatus.textContent = '';
        }
      );
    });
  }

  function showTransitionText() {
    const nextStage = STAGES[State.stage + 1];
    const pal = nextStage.palette;
    elTransitionText.innerHTML = nextStage.name + '<span class="sub">эволюция</span>';
    elTransitionText.style.color = pal.main;
    elTransitionText.classList.remove('hidden');
    setTimeout(() => elTransitionText.classList.add('hidden'), 2800);
  }

  function update() {
    elEnergy.textContent = fmtNum(State.energy) + ' E';
    elRate.textContent = '+' + fmtNum(autoRate()) + ' / сек';
    const cur = STAGES[State.stage];
    elStageName.textContent = cur.name;
    elStageName.style.color = cur.palette.main;
    elStageDesc.textContent = cur.desc;

    elMultiplier.textContent = '×' + totalMultiplier().toFixed(2);

    if (isBoosterActive()) {
      elBooster.classList.remove('hidden');
      elBooster.textContent = '×2 бустер: ' + fmtTime(boosterRemainingMs());
    } else {
      elBooster.classList.add('hidden');
    }

    // Прогресс
    const advCost = advanceCost();
    if (isFinite(advCost)) {
      const ratio = Math.max(0, Math.min(1, State.energy / advCost));
      elProgress.style.width = (ratio * 100).toFixed(1) + '%';
      elProgress.parentElement.classList.remove('hidden');
    } else {
      elProgress.style.width = '100%';
    }

    // Эволюция
    if (canAdvance() && !State.transitioning) {
      elAdvancePanel.classList.remove('hidden');
      const next = STAGES[State.stage + 1];
      elAdvanceTarget.textContent = '→ ' + next.name;
      elAdvanceCostInfo.classList.add('hidden');
    } else {
      elAdvancePanel.classList.add('hidden');
      elAdvanceCostInfo.classList.remove('hidden');
      if (State.stage < STAGES.length - 1 && !State.transitioning) {
        const remaining = Math.max(0, advCost - State.energy);
        elAdvanceCostInfo.textContent = 'До следующей формы: ' + fmtNum(remaining) + ' E';
      } else if (State.stage >= STAGES.length - 1) {
        elAdvanceCostInfo.textContent = 'Финальная форма достигнута';
      } else {
        elAdvanceCostInfo.textContent = 'Переход…';
      }
    }

    // Апгрейды
    for (const type of ['click', 'auto', 'mult']) {
      const def = UPGRADE_DEFS[type];
      const lvl = State.upgrades[type];
      const cost = upgradeCost(type);
      const els = upgradeEls[type];
      els.level.textContent = 'Ур. ' + lvl;
      els.effect.textContent = def.effect(lvl);
      els.buy.textContent = 'Купить · ' + fmtNum(cost) + ' E';
      const affordable = State.energy >= cost;
      els.buy.disabled = !affordable || State.transitioning;
      els.buy.classList.toggle('affordable', affordable);
    }

    // Скрыть подсказку после первого клика
    if (State.totalEnergy >= 1 && !hintHiddenAt) {
      hintHiddenAt = performance.now();
      elHint.classList.add('hidden');
    }
  }

  return { init, update, showTransitionText };
})();
