/**
 * StorageManager — Cookie & LocalStorage persistence
 *
 * Handles saving/loading game records, high scores, stage/level progress,
 * and history using browser cookies (with localStorage dual-sync fallback).
 */
export class StorageManager {
  constructor(stateRef, elementsRef, renderCallbacks) {
    this.state = stateRef;
    this.elements = elementsRef;
    this.render = renderCallbacks || {};

    this.COOKIE_NAME = 'math_blast_save_data';
    this.LOCALSTORAGE_KEY = 'math_blast_save_data';
    this.MAX_COOKIE_HISTORY = 15;
    this.SOUND_STORAGE_KEY = 'math_blast_sound_enabled';
  }

  init() {
    const soundSetting = localStorage.getItem(this.SOUND_STORAGE_KEY);
    if (soundSetting !== null) {
      this.state.soundEnabled = soundSetting === 'true';
    }
    this.updateSoundUI();
    this.loadData();
  }

  updateSoundUI() {
    const { soundIcon, btnSoundToggle } = this.elements;
    if (!soundIcon || !btnSoundToggle) return;

    if (this.state.soundEnabled) {
      soundIcon.textContent = '🔊';
      btnSoundToggle.classList.remove('muted');
      btnSoundToggle.title = 'Sound Effects: ON (Click to Mute)';
    } else {
      soundIcon.textContent = '🔇';
      btnSoundToggle.classList.add('muted');
      btnSoundToggle.title = 'Sound Effects: MUTED (Click to Unmute)';
    }
  }

  toggleSound() {
    this.state.soundEnabled = !this.state.soundEnabled;
    try {
      localStorage.setItem(this.SOUND_STORAGE_KEY, String(this.state.soundEnabled));
    } catch (e) {
      console.warn('LocalStorage error saving sound preference', e);
    }
    this.updateSoundUI();
    if (this.state.soundEnabled && this.render.playTap) {
      this.render.playTap();
    }
  }

  getCookie(name) {
    try {
      const matches = document.cookie.match(new RegExp(
        '(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'
      ));
      return matches ? decodeURIComponent(matches[1]) : undefined;
    } catch (e) {
      console.warn('Cookie reading unavailable', e);
      return undefined;
    }
  }

  setCookie(name, value, days = 365) {
    try {
      const expires = new Date(Date.now() + days * 864e5).toUTCString();
      document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
      return true;
    } catch (e) {
      console.warn('Cookie write failed', e);
      return false;
    }
  }

  deleteCookie(name) {
    try {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
    } catch (e) {
      console.warn('Cookie delete failed', e);
    }
  }

  loadData() {
    let rawData = null;
    let loadedFrom = '';

    const cookieStr = this.getCookie(this.COOKIE_NAME);
    if (cookieStr) {
      try {
        rawData = JSON.parse(cookieStr);
        loadedFrom = 'cookies';
      } catch (e) {
        console.warn('Error parsing cookie JSON', e);
      }
    }

    if (!rawData) {
      try {
        const localStr = localStorage.getItem(this.LOCALSTORAGE_KEY);
        if (localStr) {
          rawData = JSON.parse(localStr);
          loadedFrom = 'localStorage';
        }
      } catch (e) {
        console.warn('Error reading localStorage', e);
      }
    }

    const defaultStageProgress = {
      unlockedStage: 1,
      stars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      bestAccuracy: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      bestScore: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    };

    if (rawData && typeof rawData === 'object') {
      const rawStage = (rawData.stageProgress && typeof rawData.stageProgress === 'object') ? rawData.stageProgress : {};
      this.state.saveData = {
        highScores: Object.assign({ easy: 0, medium: 0, hard: 0, custom: 0 }, rawData.highScores),
        bestAccuracy: Object.assign({ easy: 0, medium: 0, hard: 0, custom: 0 }, rawData.bestAccuracy),
        stageProgress: {
          unlockedStage: Math.max(1, parseInt(rawStage.unlockedStage, 10) || 1),
          stars: Object.assign({}, defaultStageProgress.stars, rawStage.stars),
          bestAccuracy: Object.assign({}, defaultStageProgress.bestAccuracy, rawStage.bestAccuracy),
          bestScore: Object.assign({}, defaultStageProgress.bestScore, rawStage.bestScore)
        },
        levelProgress: {
          unlockedLevel: Math.max(1, parseInt(rawStage.unlockedStage, 10) || 1),
          stars: Object.assign({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, rawStage.stars),
          bestAccuracy: Object.assign({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, rawStage.bestAccuracy),
          bestScore: Object.assign({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, rawStage.bestScore)
        },
        history: Array.isArray(rawData.history) ? rawData.history : []
      };
    }

    if (this.render.updateStorageStatusUI) this.render.updateStorageStatusUI(loadedFrom);
    if (this.render.updateBestRecordUI) this.render.updateBestRecordUI();
    if (this.render.renderStageGridUI) this.render.renderStageGridUI();
  }

  saveData() {
    const fullJson = JSON.stringify(this.state.saveData);

    try {
      localStorage.setItem(this.LOCALSTORAGE_KEY, fullJson);
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }

    const cookieData = {
      highScores: this.state.saveData.highScores,
      bestAccuracy: this.state.saveData.bestAccuracy,
      stageProgress: this.state.saveData.stageProgress,
      history: this.state.saveData.history.slice(-this.MAX_COOKIE_HISTORY)
    };
    const cookieJson = JSON.stringify(cookieData);
    const cookieSuccess = this.setCookie(this.COOKIE_NAME, cookieJson);

    if (this.render.updateStorageStatusUI) this.render.updateStorageStatusUI(cookieSuccess ? 'cookies & localStorage' : 'localStorage fallback');
    if (this.render.updateBestRecordUI) this.render.updateBestRecordUI();
    if (this.render.renderStageGridUI) this.render.renderStageGridUI();
  }

  clearAll() {
    this.deleteCookie(this.COOKIE_NAME);
    try {
      localStorage.removeItem(this.LOCALSTORAGE_KEY);
    } catch (e) {}

    this.state.saveData = {
      highScores: { easy: 0, medium: 0, hard: 0, custom: 0 },
      bestAccuracy: { easy: 0, medium: 0, hard: 0, custom: 0 },
      stageProgress: {
        unlockedStage: 1,
        stars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
        bestAccuracy: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
        bestScore: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
      },
      levelProgress: {
        unlockedLevel: 1,
        stars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        bestAccuracy: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        bestScore: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      },
      history: []
    };

    if (this.render.updateStorageStatusUI) this.render.updateStorageStatusUI('cleared');
    if (this.render.updateBestRecordUI) this.render.updateBestRecordUI();
    if (this.render.renderStageGridUI) this.render.renderStageGridUI();
    if (this.render.renderHistoryModal) this.render.renderHistoryModal();
  }

  updateStorageStatusUI(source) {
    const el = this.elements.storageStatusText;
    if (!el) return;
    if (source === 'cleared') {
      el.textContent = 'History has been reset.';
    } else {
      el.textContent = 'Saved securely in browser cookies & localStorage';
    }
  }

  updateBestRecordUI() {
    const { bestPresetName, bestScoreVal, bestAccVal } = this.elements;
    const preset = this.state.preset;
    const bestScore = this.state.saveData.highScores[preset] || 0;
    const bestAcc = this.state.saveData.bestAccuracy[preset] || 0;

    const presetNames = { easy: 'Easy', medium: 'Medium', hard: 'Hard', custom: 'Custom' };

    if (bestPresetName) bestPresetName.textContent = presetNames[preset] || 'Mode';
    if (bestScoreVal) bestScoreVal.textContent = `${bestScore} pts`;
    if (bestAccVal) bestAccVal.textContent = `${bestAcc}%`;
  }
}