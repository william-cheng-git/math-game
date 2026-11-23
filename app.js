/**
 * Math Blast! 🚀 Kid-Friendly Arithmetic Game
 * -------------------------------------------------------------
 * Pure client-side JavaScript, zero backend required.
 * Fully compatible with GitHub Pages hosting.
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. CONSTANTS & CONFIGURATION
     ========================================================================== */
  const COOKIE_NAME = 'math_blast_save_data';
  const LOCALSTORAGE_KEY = 'math_blast_save_data';
  const MAX_COOKIE_HISTORY = 15; // Cookies have 4KB limit; store recent 15 in cookie, full in localStorage
  const SOUND_STORAGE_KEY = 'math_blast_sound_enabled';

  // Encouraging feedback messages
  const CORRECT_PHRASES = [
    { text: 'Awesome! 🌟', mascot: '🌟' },
    { text: 'Super Fast! ⚡', mascot: '🚀' },
    { text: 'Spot On! 🎯', mascot: '🎯' },
    { text: 'Math Genius! 🧠', mascot: '💡' },
    { text: 'Keep It Up! 🔥', mascot: '⭐' },
    { text: 'Brilliant! ✨', mascot: '🎉' },
    { text: 'You Rock! 🎸', mascot: '🌟' }
  ];

  const ENCOURAGING_TRY_AGAIN = [
    { text: 'Nice try! Keep going! 💪', mascot: '🌱' },
    { text: 'Almost had it! On to the next! 🚀', mascot: '⭐' },
    { text: "Good effort! Practice makes perfect! 🌟", mascot: '🌟' },
    { text: 'No worries! You got the next one! ✨', mascot: '🎯' }
  ];

  /* ==========================================================================
     2. APP STATE
     ========================================================================== */
  const state = {
    // Current setup
    preset: 'easy', // 'easy', 'medium', 'hard', 'custom'
    operations: ['add', 'sub'], // 'add', 'sub', 'mul', 'div'
    startingTime: 60,

    // Active gameplay
    currentQuestion: null,
    questionNumber: 0,
    currentInput: '',
    score: 0,
    streak: 0,
    bestStreak: 0,
    correctCount: 0,
    missedCount: 0,
    totalAnswered: 0,
    bonusTimeEarned: 0,
    timeLeft: 60,
    timerInitial: 60,
    timerIntervalId: null,
    isPlaying: false,
    isPaused: false,
    isSubmitting: false, // Prevents duplicate scoring on rapid Enter key or double clicks
    lastTickTime: 0,

    // Level progression
    playerLevel: 1,
    highestLevelReached: 1,
    levelTitles: [
      '',
      'Apprentice',
      'Explorer',
      'Adventurer',
      'Champion',
      'Master',
      'Grandmaster',
      'Mythic Hero',
      'Legend'
    ],
    levelUpTimeoutId: null,
    streakMilestoneTimeoutId: null,

    // Sound
    soundEnabled: true,
    audioCtx: null,

    // Persistence
    saveData: {
      highScores: { easy: 0, medium: 0, hard: 0, custom: 0 },
      bestAccuracy: { easy: 0, medium: 0, hard: 0, custom: 0 },
      history: []
    },

    // Chart instances
    accuracyChartInstance: null,
    scoreTrendChartInstance: null,
    accuracyTrendChartInstance: null
  };

  /* ==========================================================================
     3. DOM ELEMENTS
     ========================================================================== */
  const elements = {
    // Screens
    screenConfig: document.getElementById('screen-config'),
    screenGame: document.getElementById('screen-game'),
    screenSummary: document.getElementById('screen-summary'),
    modalHistory: document.getElementById('modal-history'),
    modalConfirmClear: document.getElementById('modal-confirm-clear'),
    modalConfirmQuit: document.getElementById('modal-confirm-quit'),

    // Global Header
    headerHomeBtn: document.getElementById('header-home-btn'),
    btnSoundToggle: document.getElementById('btn-sound-toggle'),
    soundIcon: document.getElementById('sound-icon'),
    btnOpenHistory: document.getElementById('btn-open-history'),

    // Config Screen
    presetCards: document.querySelectorAll('.preset-card'),
    opCheckboxes: {
      add: document.getElementById('op-add'),
      sub: document.getElementById('op-sub'),
      mul: document.getElementById('op-mul'),
      div: document.getElementById('op-div')
    },
    timerChips: document.querySelectorAll('.timer-chip'),
    customTimeInput: document.getElementById('custom-time-input'),
    configBestRecord: document.getElementById('config-best-record'),
    bestPresetName: document.getElementById('best-preset-name'),
    bestScoreVal: document.getElementById('best-score-val'),
    bestAccVal: document.getElementById('best-acc-val'),
    btnStartGame: document.getElementById('btn-start-game'),

    // Gameplay Screen
    hudLevel: document.getElementById('hud-level'),
    levelBarFill: document.getElementById('level-bar-fill'),
    hudScore: document.getElementById('hud-score'),
    scorePopup: document.getElementById('score-popup'),
    hudTimer: document.getElementById('hud-timer'),
    hudTimerContainer: document.getElementById('hud-timer-container'),
    timerBarFill: document.getElementById('timer-bar-fill'),
    bonusTimePopup: document.getElementById('bonus-time-popup'),
    hudStreak: document.getElementById('hud-streak'),
    hudMultiplier: document.getElementById('hud-multiplier'),
    btnQuitGame: document.getElementById('btn-quit-game'),

    // Achievement Banners
    levelUpBanner: document.getElementById('level-up-banner'),
    levelUpTitle: document.getElementById('level-up-title'),
    levelUpDesc: document.getElementById('level-up-desc'),
    levelUpBadge: document.getElementById('level-up-badge'),
    streakAchievementBanner: document.getElementById('streak-achievement-banner'),
    streakAchievementIcon: document.getElementById('streak-achievement-icon'),
    streakAchievementKicker: document.getElementById('streak-achievement-kicker'),
    streakAchievementTitle: document.getElementById('streak-achievement-title'),
    streakAchievementDesc: document.getElementById('streak-achievement-desc'),
    streakAchievementBonus: document.getElementById('streak-achievement-bonus'),

    questionTierBadge: document.getElementById('question-tier-badge'),
    questionCounter: document.getElementById('question-counter'),
    termA: document.getElementById('term-a'),
    termOp: document.getElementById('term-op'),
    termB: document.getElementById('term-b'),
    userAnswerBox: document.getElementById('user-answer-box'),
    answerText: document.getElementById('answer-text'),
    feedbackBanner: document.getElementById('feedback-banner'),
    feedbackMascot: document.getElementById('feedback-mascot'),
    feedbackMsg: document.getElementById('feedback-msg'),

    keypadBtns: document.querySelectorAll('.key-btn[data-key]'),
    keyClear: document.querySelector('.key-clear'),
    keyBackspace: document.querySelector('.key-backspace'),
    btnSkipQuestion: document.getElementById('btn-skip-question'),
    btnSubmitAnswer: document.getElementById('btn-submit-answer'),

    // Summary Screen
    highScoreBanner: document.getElementById('high-score-banner'),
    summaryMascot: document.getElementById('summary-mascot'),
    summaryTitle: document.getElementById('summary-heading'),
    summaryCompliment: document.getElementById('summary-compliment'),
    summaryScore: document.getElementById('summary-score'),
    summaryLevel: document.getElementById('summary-level'),
    summaryAccuracy: document.getElementById('summary-accuracy'),
    summaryCorrect: document.getElementById('summary-correct'),
    summaryMissed: document.getElementById('summary-missed'),
    summaryStreak: document.getElementById('summary-streak'),
    summaryBonusEarned: document.getElementById('summary-bonus-earned'),
    accuracyChartCanvas: document.getElementById('accuracyChart'),
    accuracySvgFallback: document.getElementById('accuracy-svg-fallback'),
    legendCorrectPct: document.getElementById('legend-correct-pct'),
    legendMissedPct: document.getElementById('legend-missed-pct'),
    btnPlayAgain: document.getElementById('btn-play-again'),
    btnChangeSettings: document.getElementById('btn-change-settings'),
    btnSummaryHistory: document.getElementById('btn-summary-history'),

    // History Modal
    btnCloseHistory: document.getElementById('btn-close-history'),
    histTotalGames: document.getElementById('hist-total-games'),
    histBestScore: document.getElementById('hist-best-score'),
    histAvgAccuracy: document.getElementById('hist-avg-accuracy'),
    tabScoreTrend: document.getElementById('tab-score-trend'),
    tabAccuracyTrend: document.getElementById('tab-accuracy-trend'),
    viewScoreTrend: document.getElementById('view-score-trend'),
    viewAccuracyTrend: document.getElementById('view-accuracy-trend'),
    scoreTrendCanvas: document.getElementById('scoreTrendChart'),
    scoreTrendSvgFallback: document.getElementById('score-trend-svg-fallback'),
    accuracyTrendCanvas: document.getElementById('accuracyTrendChart'),
    accTrendSvgFallback: document.getElementById('acc-trend-svg-fallback'),
    historyTbody: document.getElementById('history-tbody'),
    storageStatusText: document.getElementById('storage-status-text'),
    btnClearHistory: document.getElementById('btn-clear-history'),

    // Modals confirm
    btnCancelClear: document.getElementById('btn-cancel-clear'),
    btnConfirmClear: document.getElementById('btn-confirm-clear'),
    btnResumeGame: document.getElementById('btn-resume-game'),
    btnReallyQuit: document.getElementById('btn-really-quit')
  };

  /* ==========================================================================
     4. STORAGE: COOKIE & LOCALSTORAGE ENGINE
     ========================================================================== */
  const StorageManager = {
    init() {
      // Load sound setting
      const soundSetting = localStorage.getItem(SOUND_STORAGE_KEY);
      if (soundSetting !== null) {
        state.soundEnabled = soundSetting === 'true';
      }
      this.updateSoundUI();

      // Load game records from Cookie or LocalStorage
      this.loadData();
    },

    updateSoundUI() {
      if (state.soundEnabled) {
        elements.soundIcon.textContent = '🔊';
        elements.btnSoundToggle.classList.remove('muted');
        elements.btnSoundToggle.title = 'Sound Effects: ON (Click to Mute)';
      } else {
        elements.soundIcon.textContent = '🔇';
        elements.btnSoundToggle.classList.add('muted');
        elements.btnSoundToggle.title = 'Sound Effects: MUTED (Click to Unmute)';
      }
    },

    toggleSound() {
      state.soundEnabled = !state.soundEnabled;
      try {
        localStorage.setItem(SOUND_STORAGE_KEY, String(state.soundEnabled));
      } catch (e) {
        console.warn('LocalStorage error saving sound preference', e);
      }
      this.updateSoundUI();
      if (state.soundEnabled) {
        SoundFX.playTap();
      }
    },

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
    },

    setCookie(name, value, days = 365) {
      try {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
        return true;
      } catch (e) {
        console.warn('Cookie write failed', e);
        return false;
      }
    },

    deleteCookie(name) {
      try {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
      } catch (e) {
        console.warn('Cookie delete failed', e);
      }
    },

    loadData() {
      let rawData = null;
      let loadedFrom = '';

      // 1. Try Cookie first
      const cookieStr = this.getCookie(COOKIE_NAME);
      if (cookieStr) {
        try {
          rawData = JSON.parse(cookieStr);
          loadedFrom = 'cookies';
        } catch (e) {
          console.warn('Error parsing cookie JSON', e);
        }
      }

      // 2. Fallback to LocalStorage
      if (!rawData) {
        try {
          const localStr = localStorage.getItem(LOCALSTORAGE_KEY);
          if (localStr) {
            rawData = JSON.parse(localStr);
            loadedFrom = 'localStorage';
          }
        } catch (e) {
          console.warn('Error reading localStorage', e);
        }
      }

      // If data exists, merge into state
      if (rawData && typeof rawData === 'object') {
        state.saveData = {
          highScores: Object.assign({ easy: 0, medium: 0, hard: 0, custom: 0 }, rawData.highScores),
          bestAccuracy: Object.assign({ easy: 0, medium: 0, hard: 0, custom: 0 }, rawData.bestAccuracy),
          history: Array.isArray(rawData.history) ? rawData.history : []
        };
      }

      this.updateStorageStatusUI(loadedFrom);
      this.updateBestRecordUI();
    },

    saveData() {
      const fullJson = JSON.stringify(state.saveData);

      // Save to localStorage (full history)
      try {
        localStorage.setItem(LOCALSTORAGE_KEY, fullJson);
      } catch (e) {
        console.warn('LocalStorage save failed', e);
      }

      // Save trimmed copy to cookies to respect 4KB cookie limit
      const cookieData = {
        highScores: state.saveData.highScores,
        bestAccuracy: state.saveData.bestAccuracy,
        history: state.saveData.history.slice(-MAX_COOKIE_HISTORY)
      };
      const cookieJson = JSON.stringify(cookieData);
      const cookieSuccess = this.setCookie(COOKIE_NAME, cookieJson);

      this.updateStorageStatusUI(cookieSuccess ? 'cookies & localStorage' : 'localStorage fallback');
      this.updateBestRecordUI();
    },

    clearAll() {
      this.deleteCookie(COOKIE_NAME);
      try {
        localStorage.removeItem(LOCALSTORAGE_KEY);
      } catch (e) {}

      state.saveData = {
        highScores: { easy: 0, medium: 0, hard: 0, custom: 0 },
        bestAccuracy: { easy: 0, medium: 0, hard: 0, custom: 0 },
        history: []
      };

      this.updateStorageStatusUI('cleared');
      this.updateBestRecordUI();
      renderHistoryModal();
    },

    updateStorageStatusUI(source) {
      if (elements.storageStatusText) {
        if (source === 'cleared') {
          elements.storageStatusText.textContent = 'History has been reset.';
        } else {
          elements.storageStatusText.textContent = 'Saved securely in browser cookies & localStorage';
        }
      }
    },

    updateBestRecordUI() {
      const preset = state.preset;
      const bestScore = state.saveData.highScores[preset] || 0;
      const bestAcc = state.saveData.bestAccuracy[preset] || 0;

      const presetNames = {
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard',
        custom: 'Custom'
      };

      if (elements.bestPresetName) elements.bestPresetName.textContent = presetNames[preset] || 'Mode';
      if (elements.bestScoreVal) elements.bestScoreVal.textContent = `${bestScore} pts`;
      if (elements.bestAccVal) elements.bestAccVal.textContent = `${bestAcc}%`;
    }
  };

  /* ==========================================================================
     5. SOUND SYNTHESIS ENGINE (Web Audio API)
     Zero external audio dependencies, works 100% offline without CORS/HTTP errors.
     ========================================================================== */
  const SoundFX = {
    getAudioContext() {
      if (!state.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          state.audioCtx = new AudioContextClass();
        }
      }
      if (state.audioCtx && state.audioCtx.state === 'suspended') {
        state.audioCtx.resume();
      }
      return state.audioCtx;
    },

    playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.2, startTimeOffset = 0) {
      if (!state.soundEnabled) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTimeOffset);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime + startTimeOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTimeOffset + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTimeOffset);
      osc.stop(ctx.currentTime + startTimeOffset + duration);
    },

    playTap() {
      this.playTone(520, 'sine', 0.05, 0.12);
    },

    playCorrect(tier = 1) {
      if (!state.soundEnabled) return;
      // Cheerful upward arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        this.playTone(freq, 'triangle', 0.16, 0.22, idx * 0.06);
      });

      // Extra sparkle for higher tier bonus problems
      if (tier >= 3) {
        setTimeout(() => {
          this.playTone(1318.51, 'sine', 0.25, 0.2, 0); // E6
          this.playTone(1567.98, 'sine', 0.35, 0.25, 0.08); // G6
        }, 180);
      }
    },

    playBonusTime() {
      if (!state.soundEnabled) return;
      // Sparkly time power-up chime
      const freqs = [880, 1108.73, 1318.51, 1760];
      freqs.forEach((f, i) => {
        this.playTone(f, 'sine', 0.18, 0.18, i * 0.05);
      });
    },

    playIncorrect() {
      if (!state.soundEnabled) return;
      // Soft encouraging wobble - not a harsh buzz!
      this.playTone(329.63, 'sine', 0.14, 0.18, 0); // E4
      this.playTone(293.66, 'sine', 0.22, 0.16, 0.1); // D4
    },

    playStreak() {
      if (!state.soundEnabled) return;
      // High streak fanfare
      const freqs = [587.33, 739.99, 880, 1174.66];
      freqs.forEach((f, i) => {
        this.playTone(f, 'triangle', 0.2, 0.25, i * 0.08);
      });
    },

    playLevelUp() {
      if (!state.soundEnabled) return;
      // Majestic ascending chime: C5, E5, G5, C6, E6 + high sparkle
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, idx) => {
        this.playTone(freq, 'triangle', 0.26, 0.26, idx * 0.08);
      });
      setTimeout(() => {
        this.playTone(1567.98, 'sine', 0.42, 0.22, 0); // G6 shimmer
      }, 420);
    },

    playStreakMilestone(milestone) {
      if (!state.soundEnabled) return;
      if (milestone >= 50) {
        // Godlike fanfare
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
        notes.forEach((freq, idx) => {
          this.playTone(freq, 'triangle', 0.28, 0.28, idx * 0.07);
        });
      } else {
        // High-energy victory arpeggio
        const notes = [587.33, 739.99, 880, 1174.66, 1479.98];
        notes.forEach((freq, idx) => {
          this.playTone(freq, 'triangle', 0.22, 0.25, idx * 0.07);
        });
      }
    },

    playHighScoreFanfare() {
      if (!state.soundEnabled) return;
      // Triumphant victory fanfare melody
      const melody = [
        { f: 523.25, d: 0.12, t: 0.0 },
        { f: 659.25, d: 0.12, t: 0.12 },
        { f: 783.99, d: 0.14, t: 0.24 },
        { f: 1046.50, d: 0.35, t: 0.38 },
        { f: 880.00, d: 0.14, t: 0.75 },
        { f: 1046.50, d: 0.55, t: 0.90 }
      ];
      melody.forEach(note => {
        this.playTone(note.f, 'triangle', note.d, 0.3, note.t);
      });
    },

    playTimerTick() {
      if (!state.soundEnabled) return;
      this.playTone(800, 'sine', 0.04, 0.08);
    },

    playRoundOver() {
      if (!state.soundEnabled) return;
      this.playTone(659.25, 'triangle', 0.2, 0.2, 0);
      this.playTone(523.25, 'triangle', 0.4, 0.25, 0.15);
    }
  };

  /* ==========================================================================
     6. ARITHMETIC QUESTION GENERATOR & DIFFICULTY TIERS
     ========================================================================== */
  const MathEngine = {
    randomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    generateQuestion() {
      // Pick operation from currently active operations
      let activeOps = state.operations.slice();
      if (!activeOps || activeOps.length === 0) {
        activeOps = ['add'];
      }
      const op = activeOps[Math.floor(Math.random() * activeOps.length)];

      let a = 0;
      let b = 0;
      let answer = 0;
      let symbol = '+';
      let tier = 1;
      let tierName = 'Level 1';
      let bonusSeconds = 1;
      let basePoints = 10;

      const preset = state.preset;
      const lvl = state.playerLevel || 1; // Adaptive difficulty proportional to player level!

      if (op === 'add') {
        symbol = '+';
        if (preset === 'easy') {
          // Easy: single-digit progressing to teens as level increases
          if (lvl === 1) {
            a = this.randomInt(1, 5);
            b = this.randomInt(1, 5);
            tier = 1;
            tierName = 'Level 1 (Starter +)';
            bonusSeconds = 1;
            basePoints = 10;
          } else if (lvl === 2) {
            a = this.randomInt(3, 9);
            b = this.randomInt(2, 9);
            tier = 2;
            tierName = 'Level 2 (Carrying +)';
            bonusSeconds = 2;
            basePoints = 20;
          } else if (lvl === 3) {
            a = this.randomInt(6, 14);
            b = this.randomInt(4, 9);
            tier = 3;
            tierName = 'Level 3 (Teens +)';
            bonusSeconds = 3;
            basePoints = 35;
          } else if (lvl === 4) {
            a = this.randomInt(10, 22);
            b = this.randomInt(5, 14);
            tier = 4;
            tierName = 'Level 4 (Double Digits)';
            bonusSeconds = 4;
            basePoints = 50;
          } else {
            // Level 5+
            a = this.randomInt(15, 35);
            b = this.randomInt(10, 25);
            tier = 5;
            tierName = `Level ${lvl} (Master +)`;
            bonusSeconds = 5;
            basePoints = 75;
          }
          answer = a + b;
        } else if (preset === 'medium') {
          if (lvl === 1) {
            a = this.randomInt(3, 12);
            b = this.randomInt(2, 10);
            tier = 1;
            tierName = 'Level 1 (Basic +)';
            bonusSeconds = 1;
            basePoints = 15;
          } else if (lvl === 2) {
            a = this.randomInt(8, 20);
            b = this.randomInt(5, 15);
            tier = 2;
            tierName = 'Level 2 (Regrouping +)';
            bonusSeconds = 2;
            basePoints = 25;
          } else if (lvl === 3) {
            a = this.randomInt(14, 32);
            b = this.randomInt(10, 25);
            tier = 3;
            tierName = 'Level 3 (2-Digits +)';
            bonusSeconds = 3;
            basePoints = 40;
          } else if (lvl === 4) {
            a = this.randomInt(22, 50);
            b = this.randomInt(16, 40);
            tier = 4;
            tierName = 'Level 4 (Harder +)';
            bonusSeconds = 4;
            basePoints = 55;
          } else {
            a = this.randomInt(35, 75);
            b = this.randomInt(25, 65);
            tier = 5;
            tierName = `Level ${lvl} (Master +)`;
            bonusSeconds = 5;
            basePoints = 75;
          }
          answer = a + b;
        } else {
          // Hard or Custom
          if (lvl === 1) {
            a = this.randomInt(15, 40);
            b = this.randomInt(10, 35);
            tier = 2;
            tierName = 'Level 1 (Addition)';
            bonusSeconds = 2;
            basePoints = 25;
          } else if (lvl === 2) {
            a = this.randomInt(25, 60);
            b = this.randomInt(18, 50);
            tier = 3;
            tierName = 'Level 2 (Big Addition)';
            bonusSeconds = 3;
            basePoints = 40;
          } else if (lvl === 3) {
            a = this.randomInt(40, 85);
            b = this.randomInt(28, 75);
            tier = 4;
            tierName = 'Level 3 (Advanced +)';
            bonusSeconds = 4;
            basePoints = 55;
          } else if (lvl === 4) {
            a = this.randomInt(60, 115);
            b = this.randomInt(45, 95);
            tier = 5;
            tierName = 'Level 4 (Champion +)';
            bonusSeconds = 5;
            basePoints = 75;
          } else {
            a = this.randomInt(85, 175);
            b = this.randomInt(65, 145);
            tier = 5;
            tierName = `Level ${lvl} (Mythic +)`;
            bonusSeconds = 5;
            basePoints = 90;
          }
          answer = a + b;
        }
      } else if (op === 'sub') {
        symbol = '−';
        if (preset === 'easy') {
          // Subtraction with guaranteed non-negative answer (a >= b)
          if (lvl === 1) {
            a = this.randomInt(2, 8);
            b = this.randomInt(1, a);
            tier = 1;
            tierName = 'Level 1 (Simple −)';
            bonusSeconds = 1;
            basePoints = 10;
          } else if (lvl === 2) {
            a = this.randomInt(9, 14);
            b = this.randomInt(3, a);
            tier = 2;
            tierName = 'Level 2 (Borrowing −)';
            bonusSeconds = 2;
            basePoints = 20;
          } else if (lvl === 3) {
            a = this.randomInt(13, 22);
            b = this.randomInt(5, a - 1);
            tier = 3;
            tierName = 'Level 3 (Teens −)';
            bonusSeconds = 3;
            basePoints = 35;
          } else if (lvl === 4) {
            a = this.randomInt(18, 30);
            b = this.randomInt(8, a - 2);
            tier = 4;
            tierName = 'Level 4 (2-Digits −)';
            bonusSeconds = 4;
            basePoints = 50;
          } else {
            a = this.randomInt(25, 48);
            b = this.randomInt(10, a - 3);
            tier = 5;
            tierName = `Level ${lvl} (Master −)`;
            bonusSeconds = 5;
            basePoints = 75;
          }
          answer = a - b;
        } else if (preset === 'medium') {
          if (lvl === 1) {
            a = this.randomInt(9, 16);
            b = this.randomInt(2, a - 1);
            tier = 1;
            tierName = 'Level 1 (Intro −)';
            bonusSeconds = 1;
            basePoints = 15;
          } else if (lvl === 2) {
            a = this.randomInt(15, 26);
            b = this.randomInt(6, a - 2);
            tier = 2;
            tierName = 'Level 2 (Borrowing −)';
            bonusSeconds = 2;
            basePoints = 25;
          } else if (lvl === 3) {
            a = this.randomInt(25, 45);
            b = this.randomInt(12, a - 4);
            tier = 3;
            tierName = 'Level 3 (Double Digits −)';
            bonusSeconds = 3;
            basePoints = 40;
          } else if (lvl === 4) {
            a = this.randomInt(40, 75);
            b = this.randomInt(18, a - 6);
            tier = 4;
            tierName = 'Level 4 (Tougher −)';
            bonusSeconds = 4;
            basePoints = 55;
          } else {
            a = this.randomInt(60, 110);
            b = this.randomInt(25, a - 8);
            tier = 5;
            tierName = `Level ${lvl} (Master −)`;
            bonusSeconds = 5;
            basePoints = 75;
          }
          answer = a - b;
        } else {
          // Hard or Custom
          if (lvl === 1) {
            a = this.randomInt(25, 50);
            b = this.randomInt(8, a - 4);
            tier = 2;
            tierName = 'Level 1 (Subtraction)';
            bonusSeconds = 2;
            basePoints = 25;
          } else if (lvl === 2) {
            a = this.randomInt(40, 75);
            b = this.randomInt(15, a - 5);
            tier = 3;
            tierName = 'Level 2 (Borrowing −)';
            bonusSeconds = 3;
            basePoints = 40;
          } else if (lvl === 3) {
            a = this.randomInt(65, 110);
            b = this.randomInt(25, a - 8);
            tier = 4;
            tierName = 'Level 3 (Advanced −)';
            bonusSeconds = 4;
            basePoints = 55;
          } else if (lvl === 4) {
            a = this.randomInt(90, 150);
            b = this.randomInt(35, a - 10);
            tier = 5;
            tierName = 'Level 4 (Champion −)';
            bonusSeconds = 5;
            basePoints = 75;
          } else {
            a = this.randomInt(120, 220);
            b = this.randomInt(45, a - 15);
            tier = 5;
            tierName = `Level ${lvl} (Mythic −)`;
            bonusSeconds = 5;
            basePoints = 90;
          }
          answer = a - b;
        }
      } else if (op === 'mul') {
        symbol = '×';
        if (preset === 'medium') {
          if (lvl === 1) {
            const factors = [2, 5, 10];
            a = factors[Math.floor(Math.random() * factors.length)];
            b = this.randomInt(2, 5);
            tier = 1;
            tierName = 'Level 1 (Easy ×)';
            bonusSeconds = 1;
            basePoints = 15;
          } else if (lvl === 2) {
            const factors = [2, 3, 4, 5, 10];
            a = factors[Math.floor(Math.random() * factors.length)];
            b = this.randomInt(2, 8);
            tier = 2;
            tierName = 'Level 2 (Tables 2-5)';
            bonusSeconds = 2;
            basePoints = 25;
          } else if (lvl === 3) {
            const factors = [3, 4, 6, 7];
            a = factors[Math.floor(Math.random() * factors.length)];
            b = this.randomInt(3, 8);
            tier = 3;
            tierName = 'Level 3 (Tables 3-7)';
            bonusSeconds = 3;
            basePoints = 40;
          } else if (lvl === 4) {
            const factors = [6, 7, 8, 9];
            a = factors[Math.floor(Math.random() * factors.length)];
            b = this.randomInt(4, 9);
            tier = 4;
            tierName = 'Level 4 (Tables 6-9)';
            bonusSeconds = 4;
            basePoints = 55;
          } else {
            a = this.randomInt(6, 10);
            b = this.randomInt(6, 10);
            tier = 5;
            tierName = `Level ${lvl} (Master ×)`;
            bonusSeconds = 5;
            basePoints = 75;
          }
          answer = a * b;
        } else {
          // Hard or Custom
          if (lvl === 1) {
            a = this.randomInt(3, 8);
            b = this.randomInt(3, 8);
            tier = 2;
            tierName = 'Level 1 (Multiplication)';
            bonusSeconds = 2;
            basePoints = 25;
          } else if (lvl === 2) {
            a = this.randomInt(4, 9);
            b = this.randomInt(4, 9);
            tier = 3;
            tierName = 'Level 2 (Up to 9×9)';
            bonusSeconds = 3;
            basePoints = 40;
          } else if (lvl === 3) {
            a = this.randomInt(6, 11);
            b = this.randomInt(5, 10);
            tier = 4;
            tierName = 'Level 3 (Tables to 11)';
            bonusSeconds = 4;
            basePoints = 55;
          } else if (lvl === 4) {
            a = this.randomInt(7, 12);
            b = this.randomInt(6, 12);
            tier = 5;
            tierName = 'Level 4 (Full 12×12)';
            bonusSeconds = 5;
            basePoints = 75;
          } else {
            // Level 5+: 2-digit factors
            a = this.randomInt(9, 15);
            b = this.randomInt(6, 12);
            tier = 5;
            tierName = `Level ${lvl} (Mythic ×)`;
            bonusSeconds = 5;
            basePoints = 90;
          }
          answer = a * b;
        }
      } else if (op === 'div') {
        symbol = '÷';
        // Exact integer division with NO remainders!
        // b = divisor, answer = quotient, dividend a = b * answer
        if (preset === 'medium') {
          if (lvl === 1) {
            const divisors = [2, 5, 10];
            b = divisors[Math.floor(Math.random() * divisors.length)];
            answer = this.randomInt(2, 5);
            tier = 1;
            tierName = 'Level 1 (Easy ÷)';
            bonusSeconds = 1;
            basePoints = 15;
          } else if (lvl === 2) {
            b = this.randomInt(2, 5);
            answer = this.randomInt(2, 8);
            tier = 2;
            tierName = 'Level 2 (Divisors 2-5)';
            bonusSeconds = 2;
            basePoints = 25;
          } else if (lvl === 3) {
            b = this.randomInt(3, 7);
            answer = this.randomInt(3, 8);
            tier = 3;
            tierName = 'Level 3 (Divisors 3-7)';
            bonusSeconds = 3;
            basePoints = 40;
          } else if (lvl === 4) {
            b = this.randomInt(4, 8);
            answer = this.randomInt(4, 9);
            tier = 4;
            tierName = 'Level 4 (Divisors 4-8)';
            bonusSeconds = 4;
            basePoints = 55;
          } else {
            b = this.randomInt(6, 9);
            answer = this.randomInt(5, 10);
            tier = 5;
            tierName = `Level ${lvl} (Master ÷)`;
            bonusSeconds = 5;
            basePoints = 75;
          }
          a = b * answer;
        } else {
          // Hard or Custom
          if (lvl === 1) {
            b = this.randomInt(3, 8);
            answer = this.randomInt(3, 8);
            tier = 2;
            tierName = 'Level 1 (Division)';
            bonusSeconds = 2;
            basePoints = 25;
          } else if (lvl === 2) {
            b = this.randomInt(4, 9);
            answer = this.randomInt(4, 9);
            tier = 3;
            tierName = 'Level 2 (Medium ÷)';
            bonusSeconds = 3;
            basePoints = 40;
          } else if (lvl === 3) {
            b = this.randomInt(5, 11);
            answer = this.randomInt(5, 10);
            tier = 4;
            tierName = 'Level 3 (Advanced ÷)';
            bonusSeconds = 4;
            basePoints = 55;
          } else if (lvl === 4) {
            b = this.randomInt(6, 12);
            answer = this.randomInt(6, 12);
            tier = 5;
            tierName = 'Level 4 (Tables to 12 ÷)';
            bonusSeconds = 5;
            basePoints = 75;
          } else {
            b = this.randomInt(7, 14);
            answer = this.randomInt(6, 13);
            tier = 5;
            tierName = `Level ${lvl} (Mythic ÷)`;
            bonusSeconds = 5;
            basePoints = 90;
          }
          a = b * answer;
        }
      }

      return {
        a,
        b,
        op,
        symbol,
        answer,
        tier,
        tierName,
        bonusSeconds,
        basePoints
      };
    }
  };

  /* ==========================================================================
     7. GAME CONTROLLER, LEVEL PROGRESSION & TIMER
     ========================================================================== */
  function getLevelThreshold(level) {
    const thresholds = [0, 100, 250, 450, 700, 1000, 1400, 1900];
    if (level < thresholds.length) return thresholds[level];
    return 1900 + (level - 7) * 600;
  }

  function getPrevLevelThreshold(level) {
    if (level <= 1) return 0;
    return getLevelThreshold(level - 1);
  }

  function updateLevelHUD() {
    const lvl = state.playerLevel;
    if (elements.hudLevel) {
      elements.hudLevel.textContent = `${lvl} ⭐`;
    }
    const prevThresh = getPrevLevelThreshold(lvl);
    const nextThresh = getLevelThreshold(lvl);
    const range = Math.max(1, nextThresh - prevThresh);
    const currentInLevel = Math.max(0, state.score - prevThresh);
    const pct = Math.min(100, Math.max(0, Math.round((currentInLevel / range) * 100)));
    if (elements.levelBarFill) {
      elements.levelBarFill.style.width = `${pct}%`;
    }
  }

  function triggerLevelUp(newLevel) {
    const titleIdx = Math.min(newLevel, state.levelTitles.length - 1);
    const title = state.levelTitles[titleIdx];

    // Grant Level-up Time Bonus (+5s!)
    addBonusTime(5);

    // Play level up sound & confetti
    SoundFX.playLevelUp();
    triggerConfetti();

    // Display Level Up Banner
    if (elements.levelUpBanner) {
      if (elements.levelUpTitle) {
        elements.levelUpTitle.textContent = `LEVEL ${newLevel}: ${title.toUpperCase()}!`;
      }
      if (elements.levelUpDesc) {
        elements.levelUpDesc.textContent = `+5s Bonus Time! Math challenges upgraded! 🚀`;
      }
      if (elements.levelUpBadge) {
        elements.levelUpBadge.textContent = `+5s ⏱️`;
      }

      elements.levelUpBanner.classList.remove('hidden', 'fade-out');

      if (state.levelUpTimeoutId) clearTimeout(state.levelUpTimeoutId);
      state.levelUpTimeoutId = setTimeout(() => {
        elements.levelUpBanner.classList.add('fade-out');
        setTimeout(() => {
          elements.levelUpBanner.classList.add('hidden');
          elements.levelUpBanner.classList.remove('fade-out');
        }, 400);
      }, 2600);
    }
  }

  function triggerStreakMilestone(streak, milestoneData) {
    // Play celebratory sound & confetti
    SoundFX.playStreakMilestone(streak);
    triggerConfetti();

    // Display Streak Achievement Banner
    if (elements.streakAchievementBanner) {
      if (elements.streakAchievementIcon) elements.streakAchievementIcon.textContent = milestoneData.icon;
      if (elements.streakAchievementKicker) elements.streakAchievementKicker.textContent = milestoneData.kicker;
      if (elements.streakAchievementTitle) elements.streakAchievementTitle.textContent = milestoneData.title;
      if (elements.streakAchievementDesc) elements.streakAchievementDesc.textContent = milestoneData.desc;
      if (elements.streakAchievementBonus) elements.streakAchievementBonus.textContent = `+${milestoneData.bonus} PTS`;

      elements.streakAchievementBanner.classList.remove('hidden', 'fade-out');

      if (state.streakMilestoneTimeoutId) clearTimeout(state.streakMilestoneTimeoutId);
      state.streakMilestoneTimeoutId = setTimeout(() => {
        elements.streakAchievementBanner.classList.add('fade-out');
        setTimeout(() => {
          elements.streakAchievementBanner.classList.add('hidden');
          elements.streakAchievementBanner.classList.remove('fade-out');
        }, 400);
      }, 2600);
    }
  }

  function switchScreen(screenElement) {
    [elements.screenConfig, elements.screenGame, elements.screenSummary].forEach(screen => {
      screen.classList.remove('active');
    });
    screenElement.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startGame() {
    // Sync settings from inputs
    validateSettings();

    // Reset game state
    state.isPlaying = true;
    state.isPaused = false;
    state.isSubmitting = false; // Debounce lock reset
    state.score = 0;
    state.streak = 0;
    state.bestStreak = 0;
    state.playerLevel = 1;
    state.highestLevelReached = 1;
    state.correctCount = 0;
    state.missedCount = 0;
    state.totalAnswered = 0;
    state.bonusTimeEarned = 0;
    state.questionNumber = 0;
    state.currentInput = '';
    state.timeLeft = state.startingTime;
    state.timerInitial = state.startingTime;
    state.lastTickTime = Date.now();

    // Reset HUD
    elements.hudScore.textContent = '0';
    elements.hudStreak.textContent = '0 🔥';
    elements.hudMultiplier.textContent = '1x';
    updateLevelHUD();
    updateTimerHUD();

    // Reset banners
    if (elements.levelUpBanner) elements.levelUpBanner.classList.add('hidden');
    if (elements.streakAchievementBanner) elements.streakAchievementBanner.classList.add('hidden');

    // Audio context initialization
    SoundFX.getAudioContext();
    SoundFX.playTap();

    // Switch to gameplay screen
    switchScreen(elements.screenGame);

    // Present first question
    nextQuestion();

    // Start timer interval
    if (state.timerIntervalId) clearInterval(state.timerIntervalId);
    state.timerIntervalId = setInterval(gameTimerTick, 100);
  }

  function gameTimerTick() {
    if (!state.isPlaying || state.isPaused) return;

    const now = Date.now();
    const deltaSeconds = (now - state.lastTickTime) / 1000;
    state.lastTickTime = now;

    state.timeLeft = Math.max(0, state.timeLeft - deltaSeconds);
    updateTimerHUD();

    if (state.timeLeft <= 0) {
      endGame();
    }
  }

  function updateTimerHUD() {
    const displaySeconds = Math.ceil(state.timeLeft);
    elements.hudTimer.textContent = String(displaySeconds);

    // Progress bar fill %
    const pct = Math.min(100, Math.max(0, (state.timeLeft / state.timerInitial) * 100));
    elements.timerBarFill.style.width = `${pct}%`;

    // Urgency cues
    if (state.timeLeft <= 5.5) {
      elements.hudTimerContainer.classList.add('urgent');
      elements.hudTimerContainer.classList.remove('warning');
    } else if (state.timeLeft <= 15) {
      elements.hudTimerContainer.classList.add('warning');
      elements.hudTimerContainer.classList.remove('urgent');
    } else {
      elements.hudTimerContainer.classList.remove('warning', 'urgent');
    }
  }

  function addBonusTime(bonusSeconds) {
    state.timeLeft += bonusSeconds;
    state.bonusTimeEarned += bonusSeconds;
    updateTimerHUD();

    // Show floating bonus notification
    elements.bonusTimePopup.textContent = `+${bonusSeconds}s! ⏱️`;
    elements.bonusTimePopup.classList.remove('show');
    // Force reflow
    void elements.bonusTimePopup.offsetWidth;
    elements.bonusTimePopup.classList.add('show');

    SoundFX.playBonusTime();
  }

  function nextQuestion() {
    state.isSubmitting = false; // Release submission lock for the new question
    state.questionNumber++;
    state.currentQuestion = MathEngine.generateQuestion();
    state.currentInput = '';
    elements.answerText.textContent = '';

    // Render Question
    elements.questionCounter.textContent = `Question #${state.questionNumber}`;
    elements.termA.textContent = String(state.currentQuestion.a);
    elements.termOp.textContent = state.currentQuestion.symbol;
    elements.termB.textContent = String(state.currentQuestion.b);

    // Render Tier Badge
    elements.questionTierBadge.innerHTML = `⭐ ${state.currentQuestion.tierName} <span class="tier-bonus-text">(+${state.currentQuestion.bonusSeconds}s bonus)</span>`;

    // Reset visual feedback
    elements.userAnswerBox.className = 'user-answer-box active';
    elements.feedbackBanner.className = 'feedback-banner';
    elements.feedbackMascot.textContent = '🌟';
    elements.feedbackMsg.textContent = 'Type your answer and tap GO!';
  }

  function appendDigit(digit) {
    if (!state.isPlaying || state.isSubmitting) return;
    if (state.currentInput.length >= 4) return; // Cap at 4 digits for kid sanity
    state.currentInput += digit;
    elements.answerText.textContent = state.currentInput;
    SoundFX.playTap();
  }

  function backspaceDigit() {
    if (!state.isPlaying || state.isSubmitting) return;
    state.currentInput = state.currentInput.slice(0, -1);
    elements.answerText.textContent = state.currentInput;
    SoundFX.playTap();
  }

  function clearInput() {
    if (!state.isPlaying || state.isSubmitting) return;
    state.currentInput = '';
    elements.answerText.textContent = '';
    SoundFX.playTap();
  }

  function submitAnswer() {
    // Debounce & Lock: ignore rapid Enter keystrokes or double clicks on the same question
    if (!state.isPlaying || state.isSubmitting) return;

    if (!state.currentInput || state.currentInput.trim() === '') {
      // Empty input wiggle
      elements.userAnswerBox.classList.add('shake');
      setTimeout(() => elements.userAnswerBox.classList.remove('shake'), 400);
      elements.feedbackBanner.className = 'feedback-banner incorrect';
      elements.feedbackMascot.textContent = '👉';
      elements.feedbackMsg.textContent = 'Please enter an answer first!';
      return;
    }

    // Lock submission immediately to prevent duplicate scoring!
    state.isSubmitting = true;

    const userAnswer = parseInt(state.currentInput, 10);
    const expected = state.currentQuestion.answer;
    state.totalAnswered++;

    if (userAnswer === expected) {
      // CORRECT ANSWER!
      state.correctCount++;
      state.streak++;
      if (state.streak > state.bestStreak) {
        state.bestStreak = state.streak;
      }

      // Calculate Streak Multiplier (scaled extra high for long streaks)
      let multiplier = 1.0;
      if (state.streak >= 100) multiplier = 4.0;
      else if (state.streak >= 50) multiplier = 3.0;
      else if (state.streak >= 20) multiplier = 2.5;
      else if (state.streak >= 10) multiplier = 2.0;
      else if (state.streak >= 5) multiplier = 1.5;
      else if (state.streak >= 3) multiplier = 1.25;

      const ptsEarned = Math.round(state.currentQuestion.basePoints * multiplier);
      state.score += ptsEarned;

      // Update HUD
      elements.hudScore.textContent = String(state.score);
      elements.hudStreak.textContent = `${state.streak} 🔥`;
      elements.hudMultiplier.textContent = `${multiplier}x`;

      // Score popup
      elements.scorePopup.textContent = `+${ptsEarned}`;
      elements.scorePopup.classList.remove('show');
      void elements.scorePopup.offsetWidth;
      elements.scorePopup.classList.add('show');

      // Grant Bonus Time for thinking!
      addBonusTime(state.currentQuestion.bonusSeconds);

      // Play Sound
      SoundFX.playCorrect(state.currentQuestion.tier);

      // Check Streak Milestones: 5, 10, 20, 50, 100
      const STREAK_MILESTONES = {
        5: { bonus: 25, title: '5 IN A ROW!', kicker: '🔥 SUPER STREAK!', desc: '+25 Streak Bonus Points! You are on fire!', icon: '🔥' },
        10: { bonus: 50, title: '10 IN A ROW!', kicker: '⚡ UNSTOPPABLE!', desc: '+50 Streak Bonus Points! 2x Multiplier Active!', icon: '⚡' },
        20: { bonus: 100, title: '20 IN A ROW!', kicker: '🌟 MATH MASTER!', desc: '+100 Streak Bonus Points! Pure mathematical brilliance!', icon: '🌟' },
        50: { bonus: 250, title: '50 IN A ROW!', kicker: '🚀 LEGENDARY HERO!', desc: '+250 Streak Bonus Points! True Math Champion!', icon: '🚀' },
        100: { bonus: 500, title: '100 IN A ROW!', kicker: '👑 MYTHIC GODLIKE!', desc: '+500 Streak Bonus Points! Unbelievable Mastery!', icon: '👑' }
      };

      if (STREAK_MILESTONES[state.streak]) {
        const ms = STREAK_MILESTONES[state.streak];
        state.score += ms.bonus;
        elements.hudScore.textContent = String(state.score);
        triggerStreakMilestone(state.streak, ms);
      } else if (state.streak % 5 === 0 && state.streak > 5) {
        setTimeout(() => SoundFX.playStreak(), 200);
      }

      // Check Level Up progression!
      while (state.score >= getLevelThreshold(state.playerLevel)) {
        state.playerLevel++;
        if (state.playerLevel > state.highestLevelReached) {
          state.highestLevelReached = state.playerLevel;
        }
        triggerLevelUp(state.playerLevel);
      }
      updateLevelHUD();

      // Visual feedback
      elements.userAnswerBox.className = 'user-answer-box correct';
      elements.feedbackBanner.className = 'feedback-banner correct';
      const phrase = CORRECT_PHRASES[Math.floor(Math.random() * CORRECT_PHRASES.length)];
      elements.feedbackMascot.textContent = phrase.mascot;
      elements.feedbackMsg.textContent = `${phrase.text} (+${ptsEarned} pts, +${state.currentQuestion.bonusSeconds}s)`;

      // Move to next after quick encouraging beat
      setTimeout(() => {
        if (state.isPlaying) {
          nextQuestion();
        }
      }, 350);

    } else {
      // INCORRECT ANSWER
      state.missedCount++;
      state.streak = 0;
      elements.hudStreak.textContent = '0 🔥';
      elements.hudMultiplier.textContent = '1x';

      SoundFX.playIncorrect();

      // Visual feedback (gentle without harsh punishment)
      elements.userAnswerBox.className = 'user-answer-box shake';
      elements.feedbackBanner.className = 'feedback-banner incorrect';
      const encouragement = ENCOURAGING_TRY_AGAIN[Math.floor(Math.random() * ENCOURAGING_TRY_AGAIN.length)];
      elements.feedbackMascot.textContent = encouragement.mascot;
      elements.feedbackMsg.textContent = `${encouragement.text} (Correct: ${expected})`;

      // Allow quick transition to keep rhythm
      setTimeout(() => {
        if (state.isPlaying) {
          nextQuestion();
        }
      }, 750);
    }
  }

  function skipQuestion() {
    if (!state.isPlaying || state.isSubmitting) return;
    state.isSubmitting = true;

    state.totalAnswered++;
    state.missedCount++;
    state.streak = 0;
    elements.hudStreak.textContent = '0 🔥';
    elements.hudMultiplier.textContent = '1x';

    SoundFX.playIncorrect();

    const expected = state.currentQuestion.answer;
    elements.feedbackBanner.className = 'feedback-banner';
    elements.feedbackMascot.textContent = '⏭️';
    elements.feedbackMsg.textContent = `Skipped! The answer was ${expected}.`;

    setTimeout(() => {
      if (state.isPlaying) {
        nextQuestion();
      }
    }, 450);
  }

  function endGame() {
    if (!state.isPlaying) return;
    state.isPlaying = false;
    state.isSubmitting = false;
    clearInterval(state.timerIntervalId);
    state.timerIntervalId = null;

    SoundFX.playRoundOver();

    // Calculate final stats
    const total = state.totalAnswered;
    const correct = state.correctCount;
    const missed = state.missedCount;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Check High Score
    const prevBestScore = state.saveData.highScores[state.preset] || 0;
    const prevBestAcc = state.saveData.bestAccuracy[state.preset] || 0;
    const isNewHighScore = state.score > prevBestScore && state.score > 0;
    const isNewBestAcc = accuracy > prevBestAcc && total >= 5;

    if (isNewHighScore) {
      state.saveData.highScores[state.preset] = state.score;
    }
    if (isNewBestAcc) {
      state.saveData.bestAccuracy[state.preset] = accuracy;
    }

    // Record game in history
    const now = new Date();
    const dateFormatted = `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const gameRecord = {
      id: String(now.getTime()),
      date: dateFormatted,
      timestamp: now.getTime(),
      preset: state.preset,
      score: state.score,
      maxLevel: state.highestLevelReached,
      total,
      correct,
      missed,
      accuracy,
      streak: state.bestStreak,
      duration: state.startingTime,
      bonusEarned: state.bonusTimeEarned
    };

    state.saveData.history.push(gameRecord);
    StorageManager.saveData();

    // Populate Summary Screen
    elements.summaryScore.textContent = String(state.score);
    if (elements.summaryLevel) {
      const lvlTitle = state.levelTitles[Math.min(state.highestLevelReached, state.levelTitles.length - 1)];
      elements.summaryLevel.textContent = `Lvl ${state.highestLevelReached} (${lvlTitle})`;
    }
    elements.summaryAccuracy.textContent = `${accuracy}%`;
    elements.summaryCorrect.textContent = String(correct);
    elements.summaryMissed.textContent = String(missed);
    elements.summaryStreak.textContent = `${state.bestStreak} 🔥`;
    elements.summaryBonusEarned.textContent = `+${state.bonusTimeEarned}s`;

    // Legend percentages
    elements.legendCorrectPct.textContent = `${accuracy}% (${correct})`;
    elements.legendMissedPct.textContent = `${100 - accuracy}% (${missed})`;

    // High Score Banner & Celebration
    if (isNewHighScore) {
      elements.highScoreBanner.classList.remove('hidden');
      elements.summaryMascot.textContent = '🏆';
      elements.summaryTitle.textContent = 'NEW HIGH SCORE!';
      elements.summaryCompliment.textContent = 'You set a brand new record for this mode! You are unstoppable!';
      SoundFX.playHighScoreFanfare();
      triggerConfetti();
    } else {
      elements.highScoreBanner.classList.add('hidden');
      elements.summaryMascot.textContent = accuracy >= 80 ? '🌟' : '🚀';
      elements.summaryTitle.textContent = 'Round Complete!';
      elements.summaryCompliment.textContent = accuracy >= 80
        ? 'Outstanding math work! Your accuracy is through the roof!'
        : 'Great effort! Every round makes your brain stronger!';
    }

    // Render Accuracy Pie / Donut Chart
    renderAccuracyPieChart(correct, missed);

    // Switch screen
    switchScreen(elements.screenSummary);
  }

  /* ==========================================================================
     8. CELEBRATION & CONFETTI ENGINE
     Uses canvas-confetti if loaded via CDN, with smooth fallback particle burst!
     ========================================================================== */
  function triggerConfetti() {
    if (typeof window.confetti === 'function') {
      try {
        // Multi-stage confetti burst
        window.confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        setTimeout(() => {
          window.confetti({
            particleCount: 60,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
          });
          window.confetti({
            particleCount: 60,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
          });
        }, 250);
        return;
      } catch (e) {
        console.warn('Canvas confetti error, falling back', e);
      }
    }

    // Fallback simple DOM starburst particles
    createFallbackConfetti();
  }

  function createFallbackConfetti() {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.inset = '0';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);

    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];
    const emojis = ['⭐', '🎉', '✨', '🏆', '💎'];

    for (let i = 0; i < 35; i++) {
      const p = document.createElement('span');
      p.textContent = emojis[i % emojis.length];
      p.style.position = 'absolute';
      p.style.left = `${Math.random() * 90 + 5}vw`;
      p.style.top = `${Math.random() * 40 + 10}vh`;
      p.style.fontSize = `${Math.random() * 20 + 16}px`;
      p.style.transition = 'all 1.4s ease-out';
      p.style.transform = 'translateY(0) scale(1) rotate(0deg)';
      p.style.opacity = '1';
      container.appendChild(p);

      setTimeout(() => {
        p.style.transform = `translateY(${Math.random() * 300 + 150}px) scale(0.5) rotate(${Math.random() * 360}deg)`;
        p.style.opacity = '0';
      }, 50);
    }

    setTimeout(() => {
      container.remove();
    }, 1800);
  }

  /* ==========================================================================
     9. CHARTS: ACCURACY PIE CHART & TREND GRAPHS (Chart.js + SVG Fallback)
     ========================================================================== */
  function renderAccuracyPieChart(correct, missed) {
    const total = correct + missed;
    const safeCorrect = total === 0 ? 1 : correct;
    const safeMissed = total === 0 ? 0 : missed;

    // Check if Chart.js is available
    if (typeof Chart !== 'undefined') {
      try {
        elements.accuracySvgFallback.classList.add('hidden');
        elements.accuracyChartCanvas.classList.remove('hidden');

        if (state.accuracyChartInstance) {
          state.accuracyChartInstance.destroy();
          state.accuracyChartInstance = null;
        }

        const ctx = elements.accuracyChartCanvas.getContext('2d');
        state.accuracyChartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Correct', 'Missed/Skipped'],
            datasets: [{
              data: [safeCorrect, safeMissed],
              backgroundColor: ['#10b981', '#f87171'],
              borderColor: ['#ffffff', '#ffffff'],
              borderWidth: 4,
              hoverOffset: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    const label = context.label || '';
                    const val = context.raw || 0;
                    const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                    return ` ${label}: ${val} (${pct}%)`;
                  }
                }
              }
            },
            cutout: '68%'
          }
        });
        return;
      } catch (err) {
        console.warn('Chart.js render failed, using SVG fallback', err);
      }
    }

    // SVG Fallback for Donut/Pie Chart
    renderAccuracySvgFallback(correct, missed);
  }

  function renderAccuracySvgFallback(correct, missed) {
    elements.accuracyChartCanvas.classList.add('hidden');
    elements.accuracySvgFallback.classList.remove('hidden');

    const total = correct + missed;
    const correctPct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (correctPct / 100) * circumference;

    elements.accuracySvgFallback.innerHTML = `
      <svg width="180" height="180" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="${radius}" fill="none" stroke="#fecaca" stroke-width="24" />
        <circle cx="80" cy="80" r="${radius}" fill="none" stroke="#10b981" stroke-width="24"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${strokeDashoffset}"
          stroke-linecap="round"
          transform="rotate(-90 80 80)"
        />
        <text x="80" y="75" text-anchor="middle" font-family="'Fredoka', sans-serif" font-weight="700" font-size="28" fill="#1e293b">
          ${correctPct}%
        </text>
        <text x="80" y="98" text-anchor="middle" font-family="'Quicksand', sans-serif" font-weight="700" font-size="12" fill="#64748b">
          ACCURACY
        </text>
      </svg>
    `;
  }

  function renderTrendGraphs() {
    const history = state.saveData.history.slice(-12); // Last 12 games
    const labels = history.map((g, i) => `#${i + 1} (${g.preset})`);
    const scores = history.map(g => g.score);
    const accuracies = history.map(g => g.accuracy);

    if (history.length === 0) {
      elements.scoreTrendSvgFallback.innerHTML = '<p class="empty-history-cell">Play your first round to generate trend graphs! 🚀</p>';
      elements.scoreTrendSvgFallback.classList.remove('hidden');
      elements.scoreTrendCanvas.classList.add('hidden');

      elements.accTrendSvgFallback.innerHTML = '<p class="empty-history-cell">Play your first round to generate trend graphs! 🚀</p>';
      elements.accTrendSvgFallback.classList.remove('hidden');
      elements.accuracyTrendCanvas.classList.add('hidden');
      return;
    }

    if (typeof Chart !== 'undefined') {
      try {
        elements.scoreTrendSvgFallback.classList.add('hidden');
        elements.scoreTrendCanvas.classList.remove('hidden');
        elements.accTrendSvgFallback.classList.add('hidden');
        elements.accuracyTrendCanvas.classList.remove('hidden');

        // Score Trend Chart
        if (state.scoreTrendChartInstance) {
          state.scoreTrendChartInstance.destroy();
          state.scoreTrendChartInstance = null;
        }

        const scoreCtx = elements.scoreTrendCanvas.getContext('2d');
        state.scoreTrendChartInstance = new Chart(scoreCtx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Score',
              data: scores,
              borderColor: '#4f46e5',
              backgroundColor: 'rgba(79, 70, 229, 0.12)',
              borderWidth: 3,
              tension: 0.35,
              fill: true,
              pointBackgroundColor: '#4f46e5',
              pointRadius: 5,
              pointHoverRadius: 7
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: { precision: 0 }
              }
            },
            plugins: {
              legend: { display: false }
            }
          }
        });

        // Accuracy Trend Chart
        if (state.accuracyTrendChartInstance) {
          state.accuracyTrendChartInstance.destroy();
          state.accuracyTrendChartInstance = null;
        }

        const accCtx = elements.accuracyTrendCanvas.getContext('2d');
        state.accuracyTrendChartInstance = new Chart(accCtx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Accuracy %',
              data: accuracies,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              borderWidth: 3,
              tension: 0.35,
              fill: true,
              pointBackgroundColor: '#10b981',
              pointRadius: 5,
              pointHoverRadius: 7
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                min: 0,
                max: 100,
                ticks: {
                  callback: val => `${val}%`
                }
              }
            },
            plugins: {
              legend: { display: false }
            }
          }
        });

        return;
      } catch (err) {
        console.warn('Trend Chart.js failed, fallback to SVG', err);
      }
    }

    // SVG Fallback for Trend Lines
    renderTrendSvgFallback(history);
  }

  function renderTrendSvgFallback(history) {
    elements.scoreTrendCanvas.classList.add('hidden');
    elements.scoreTrendSvgFallback.classList.remove('hidden');
    elements.accuracyTrendCanvas.classList.add('hidden');
    elements.accTrendSvgFallback.classList.remove('hidden');

    const maxScore = Math.max(...history.map(g => g.score), 10);
    const width = 500;
    const height = 180;
    const padding = 25;

    // Draw Score Path
    const scorePoints = history.map((g, i) => {
      const x = padding + (i / Math.max(1, history.length - 1)) * (width - 2 * padding);
      const y = height - padding - (g.score / maxScore) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    elements.scoreTrendSvgFallback.innerHTML = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="background:#f8fafc; border-radius:12px;">
        <polyline fill="none" stroke="#4f46e5" stroke-width="3" stroke-linecap="round" points="${scorePoints}" />
        ${history.map((g, i) => {
          const x = padding + (i / Math.max(1, history.length - 1)) * (width - 2 * padding);
          const y = height - padding - (g.score / maxScore) * (height - 2 * padding);
          return `<circle cx="${x}" cy="${y}" r="4" fill="#4f46e5" /><text x="${x}" y="${y - 8}" font-size="10" text-anchor="middle" fill="#4f46e5">${g.score}</text>`;
        }).join('')}
      </svg>
    `;

    // Draw Accuracy Path
    const accPoints = history.map((g, i) => {
      const x = padding + (i / Math.max(1, history.length - 1)) * (width - 2 * padding);
      const y = height - padding - (g.accuracy / 100) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    elements.accTrendSvgFallback.innerHTML = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="background:#f8fafc; border-radius:12px;">
        <polyline fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" points="${accPoints}" />
        ${history.map((g, i) => {
          const x = padding + (i / Math.max(1, history.length - 1)) * (width - 2 * padding);
          const y = height - padding - (g.accuracy / 100) * (height - 2 * padding);
          return `<circle cx="${x}" cy="${y}" r="4" fill="#10b981" /><text x="${x}" y="${y - 8}" font-size="10" text-anchor="middle" fill="#059669">${g.accuracy}%</text>`;
        }).join('')}
      </svg>
    `;
  }

  function renderHistoryModal() {
    const history = state.saveData.history;
    const totalGames = history.length;

    let bestScoreAllTime = 0;
    let sumAccuracy = 0;

    history.forEach(g => {
      if (g.score > bestScoreAllTime) bestScoreAllTime = g.score;
      sumAccuracy += g.accuracy;
    });

    const avgAccuracy = totalGames > 0 ? Math.round(sumAccuracy / totalGames) : 0;

    elements.histTotalGames.textContent = String(totalGames);
    elements.histBestScore.textContent = `${bestScoreAllTime} pts`;
    elements.histAvgAccuracy.textContent = `${avgAccuracy}%`;

    // Render Table
    if (totalGames === 0) {
      elements.historyTbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-history-cell">No games played yet! Start your first game above! 🚀</td>
        </tr>
      `;
    } else {
      const reversed = history.slice().reverse();
      elements.historyTbody.innerHTML = reversed.map(game => {
        const accColor = game.accuracy >= 90 ? '#10b981' : game.accuracy >= 70 ? '#f59e0b' : '#ef4444';
        const lvl = game.maxLevel || 1;
        return `
          <tr>
            <td><strong>${game.date}</strong></td>
            <td><span class="preset-badge" style="position:static; display:inline-block;">${game.preset}</span></td>
            <td><span style="color:#9333ea; font-weight:700;">Level ${lvl} ⭐</span></td>
            <td><strong>${game.score} pts</strong></td>
            <td><span style="color:${accColor}; font-weight:700;">${game.accuracy}%</span></td>
            <td>${game.correct}/${game.total}</td>
            <td>${game.duration}s</td>
          </tr>
        `;
      }).join('');
    }

    // Render Trend Graphs
    renderTrendGraphs();

    elements.modalHistory.classList.remove('hidden');
  }

  /* ==========================================================================
     10. CONFIGURATION & PRESET LOGIC
     ========================================================================== */
  function applyPreset(presetName) {
    state.preset = presetName;

    elements.presetCards.forEach(card => {
      const isCurrent = card.dataset.preset === presetName;
      card.classList.toggle('active', isCurrent);
      card.setAttribute('aria-checked', String(isCurrent));
    });

    if (presetName === 'easy') {
      elements.opCheckboxes.add.checked = true;
      elements.opCheckboxes.sub.checked = true;
      elements.opCheckboxes.mul.checked = false;
      elements.opCheckboxes.div.checked = false;
    } else if (presetName === 'medium') {
      elements.opCheckboxes.add.checked = true;
      elements.opCheckboxes.sub.checked = true;
      elements.opCheckboxes.mul.checked = true;
      elements.opCheckboxes.div.checked = false;
    } else if (presetName === 'hard') {
      elements.opCheckboxes.add.checked = true;
      elements.opCheckboxes.sub.checked = true;
      elements.opCheckboxes.mul.checked = true;
      elements.opCheckboxes.div.checked = true;
    }

    validateSettings();
    StorageManager.updateBestRecordUI();
    SoundFX.playTap();
  }

  function validateSettings() {
    // Collect active operations
    const activeOps = [];
    if (elements.opCheckboxes.add.checked) activeOps.push('add');
    if (elements.opCheckboxes.sub.checked) activeOps.push('sub');
    if (elements.opCheckboxes.mul.checked) activeOps.push('mul');
    if (elements.opCheckboxes.div.checked) activeOps.push('div');

    // Never leave with zero operations
    if (activeOps.length === 0) {
      elements.opCheckboxes.add.checked = true;
      activeOps.push('add');
    }
    state.operations = activeOps;

    // Detect if operation checkboxes still match preset
    const isEasy = activeOps.length === 2 && activeOps.includes('add') && activeOps.includes('sub');
    const isMedium = activeOps.length === 3 && activeOps.includes('add') && activeOps.includes('sub') && activeOps.includes('mul');
    const isHard = activeOps.length === 4;

    if (state.preset === 'easy' && !isEasy) state.preset = 'custom';
    else if (state.preset === 'medium' && !isMedium) state.preset = 'custom';
    else if (state.preset === 'hard' && !isHard) state.preset = 'custom';

    elements.presetCards.forEach(card => {
      const isCurrent = card.dataset.preset === state.preset;
      card.classList.toggle('active', isCurrent);
      card.setAttribute('aria-checked', String(isCurrent));
    });

    StorageManager.updateBestRecordUI();
  }

  function selectTimeDuration(seconds) {
    state.startingTime = seconds;
    elements.timerChips.forEach(chip => {
      chip.classList.toggle('active', parseInt(chip.dataset.time, 10) === seconds);
    });
    elements.customTimeInput.value = '';
    SoundFX.playTap();
  }

  /* ==========================================================================
     11. EVENT LISTENERS SETUP
     ========================================================================== */
  function setupEventListeners() {
    // Header navigation
    elements.headerHomeBtn.addEventListener('click', () => {
      if (state.isPlaying) {
        elements.modalConfirmQuit.classList.remove('hidden');
      } else {
        switchScreen(elements.screenConfig);
      }
    });

    elements.headerHomeBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        elements.headerHomeBtn.click();
      }
    });

    elements.btnSoundToggle.addEventListener('click', () => {
      StorageManager.toggleSound();
    });

    elements.btnOpenHistory.addEventListener('click', () => {
      renderHistoryModal();
    });

    // Preset Selection
    elements.presetCards.forEach(card => {
      card.addEventListener('click', () => {
        applyPreset(card.dataset.preset);
      });
    });

    // Operation Checkboxes
    Object.values(elements.opCheckboxes).forEach(cb => {
      cb.addEventListener('change', () => {
        validateSettings();
        SoundFX.playTap();
      });
    });

    // Timer chips
    elements.timerChips.forEach(chip => {
      chip.addEventListener('click', () => {
        selectTimeDuration(parseInt(chip.dataset.time, 10));
      });
    });

    // Custom time input
    elements.customTimeInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (val && val >= 10 && val <= 600) {
        state.startingTime = val;
        elements.timerChips.forEach(chip => chip.classList.remove('active'));
      }
    });

    // Start Game
    elements.btnStartGame.addEventListener('click', () => {
      startGame();
    });

    // On-screen keypad digits
    elements.keypadBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        appendDigit(btn.dataset.key);
      });
    });

    elements.keyClear.addEventListener('click', () => {
      clearInput();
    });

    elements.keyBackspace.addEventListener('click', () => {
      backspaceDigit();
    });

    elements.btnSubmitAnswer.addEventListener('click', () => {
      submitAnswer();
    });

    elements.btnSkipQuestion.addEventListener('click', () => {
      skipQuestion();
    });

    // Physical Keyboard Support
    window.addEventListener('keydown', (e) => {
      // Don't intercept if typing in custom time input or modals
      if (e.target === elements.customTimeInput) return;
      if (!elements.modalHistory.classList.contains('hidden')) {
        if (e.key === 'Escape') elements.modalHistory.classList.add('hidden');
        return;
      }
      if (!elements.modalConfirmClear.classList.contains('hidden')) {
        if (e.key === 'Escape') elements.modalConfirmClear.classList.add('hidden');
        return;
      }
      if (!elements.modalConfirmQuit.classList.contains('hidden')) {
        if (e.key === 'Escape') elements.modalConfirmQuit.classList.add('hidden');
        return;
      }

      if (state.isPlaying) {
        if (e.key >= '0' && e.key <= '9') {
          e.preventDefault();
          appendDigit(e.key);
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          backspaceDigit();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          submitAnswer();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          elements.modalConfirmQuit.classList.remove('hidden');
        } else if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          clearInput();
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          skipQuestion();
        }
      }
    });

    // Quit in-game
    elements.btnQuitGame.addEventListener('click', () => {
      elements.modalConfirmQuit.classList.remove('hidden');
    });

    elements.btnResumeGame.addEventListener('click', () => {
      elements.modalConfirmQuit.classList.add('hidden');
    });

    elements.btnReallyQuit.addEventListener('click', () => {
      elements.modalConfirmQuit.classList.add('hidden');
      state.isPlaying = false;
      if (state.timerIntervalId) clearInterval(state.timerIntervalId);
      switchScreen(elements.screenConfig);
    });

    // Summary screen buttons
    elements.btnPlayAgain.addEventListener('click', () => {
      startGame();
    });

    elements.btnChangeSettings.addEventListener('click', () => {
      switchScreen(elements.screenConfig);
    });

    elements.btnSummaryHistory.addEventListener('click', () => {
      renderHistoryModal();
    });

    // History Modal
    elements.btnCloseHistory.addEventListener('click', () => {
      elements.modalHistory.classList.add('hidden');
    });

    elements.tabScoreTrend.addEventListener('click', () => {
      elements.tabScoreTrend.classList.add('active');
      elements.tabAccuracyTrend.classList.remove('active');
      elements.viewScoreTrend.classList.remove('hidden');
      elements.viewAccuracyTrend.classList.add('hidden');
    });

    elements.tabAccuracyTrend.addEventListener('click', () => {
      elements.tabAccuracyTrend.classList.add('active');
      elements.tabScoreTrend.classList.remove('active');
      elements.viewAccuracyTrend.classList.remove('hidden');
      elements.viewScoreTrend.classList.add('hidden');
    });

    elements.btnClearHistory.addEventListener('click', () => {
      elements.modalConfirmClear.classList.remove('hidden');
    });

    elements.btnCancelClear.addEventListener('click', () => {
      elements.modalConfirmClear.classList.add('hidden');
    });

    elements.btnConfirmClear.addEventListener('click', () => {
      StorageManager.clearAll();
      elements.modalConfirmClear.classList.add('hidden');
    });

    // Close modals when clicking backdrop
    [elements.modalHistory, elements.modalConfirmClear, elements.modalConfirmQuit].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    });
  }

  /* ==========================================================================
     12. INITIALIZATION
     ========================================================================== */
  function init() {
    StorageManager.init();
    setupEventListeners();
    applyPreset('easy');
    selectTimeDuration(60);
  }

  // Boot up when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
