/**
 * Math Blast! 🚀 — Main Application Orchestrator (ES Module)
 *
 * Bootstraps all modules, manages global state, handles view switching,
 * and coordinates the game loop between modules.
 */
import { DIFFICULTY_PRESETS, getRangeConfig, getOperationsForPreset, getPresetMeta } from './config.js';
import { StorageManager } from './modules/storage.js';
import { SoundFX } from './modules/sound.js';
import { MathEngine } from './modules/math-engine.js';
import { HomeView } from './modules/home.js';
import { ConfigView } from './modules/config-view.js';
import { GameView } from './modules/game-view.js';
import { SummaryView } from './modules/summary-view.js';
import { Charts } from './modules/charts.js';
import { STAGE_DEFINITIONS, LEVEL_TITLES, MathBlastGame } from './games/math-blast/game.js';

/* ==========================================================================
   GLOBAL STATE
   ========================================================================== */
const state = {
  gameMode: 'stageAdventure',
  currentStage: 1,
  stageQuestionsTotal: 10,
  stageQuestionIndex: 0,
  currentLevel: 1,
  levelQuestionsTotal: 20,
  levelQuestionIndex: 0,
  levelCorrectCount: 0,
  levelMissedCount: 0,
  preset: 'easy',
  operations: ['add', 'sub'],
  startingTime: 60,
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
  isPlaying: false,
  isPaused: false,
  isSubmitting: false,
  playerLevel: 1,
  highestLevelReached: 1,
  levelTitles: LEVEL_TITLES,
  soundEnabled: true,
  saveData: {
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
  },
  STAGE_DEFINITIONS
};

/* ==========================================================================
   DOM ELEMENTS REFERENCE
   ========================================================================== */
const elements = {};

/* ==========================================================================
   MODULE INSTANCES
   ========================================================================== */
let storage, sound, mathEngine, homeView, configView, gameView, summaryView, charts, mathBlastGame;


/* ==========================================================================
   INITIALIZATION
   ========================================================================== */

function init() {
  _captureElements();
  sound = new SoundFX(state);
  mathEngine = new MathEngine(state);
  mathBlastGame = new MathBlastGame(state);
  charts = new Charts();
  storage = new StorageManager(state, elements, {
    updateStorageStatusUI: _updateStorageStatusUI,
    updateBestRecordUI: _updateBestRecordUI,
    renderStageGridUI: _renderStageGridUI,
    renderHistoryModal: _renderHistoryModal
  });
  homeView = new HomeView(elements, sound, (gameId) => {},
    () => { homeView.switchToConfig(); });
  configView = new ConfigView(elements, sound, storage, mathEngine, { DIFFICULTY_PRESETS });
  configView.setState(state);
  configView.setOnStartGame(() => startGame());
  gameView = new GameView(elements, sound, storage, mathEngine, state);
  summaryView = new SummaryView(elements, sound, storage, state, charts);
  storage.init();
  _bindGlobalEvents();
  homeView.init();
  configView.init();
  _applyPreset('easy');
  _selectTimeDuration(60);
  _switchScreen(elements.screenLanding);
}

/* ==========================================================================
   SCREEN SWITCHING
   ========================================================================== */

function _switchScreen(screen) {
  document.querySelectorAll('#main-content > section.screen').forEach(s => s.classList.remove('active'));
  if (screen) screen.classList.add('active');
}

/* ==========================================================================
   DOM ELEMENT CAPTURE (Part 1: screens, header, landing)
   ========================================================================== */

function _captureElements() {
  const get = (id) => document.getElementById(id);
  const getAll = (sel) => document.querySelectorAll(sel);

  elements.screenLanding = get('screen-landing');
  elements.screenConfig = get('screen-config');
  elements.screenGame = get('screen-game');
  elements.screenSummary = get('screen-summary');
  elements.modalHistory = get('modal-history');
  elements.modalConfirmClear = get('modal-confirm-clear');
  elements.modalConfirmQuit = get('modal-confirm-quit');

  elements.headerHomeBtn = get('header-home-btn');
  elements.btnSoundToggle = get('btn-sound-toggle');
  elements.soundIcon = get('sound-icon');
  elements.btnOpenHistory = get('btn-open-history');

  elements.gameCards = getAll('.landing-games-grid .game-card');
  elements.btnPlaySelectedGame = get('btn-play-selected-game');

  elements.modeBtnStage = get('mode-btn-stage');
  elements.modeBtnTime = get('mode-btn-time');
  elements.modeBtnLevelQuest = get('mode-btn-level-quest');
  elements.presetCards = getAll('.preset-card');
  elements.opCheckboxes = {
    add: get('op-add'),
    sub: get('op-sub'),
    mul: get('op-mul'),
    div: get('op-div')
  };
  elements.timerChips = getAll('.timer-chip');
  elements.customTimeInput = get('custom-time-input');
  elements.configBestRecord = get('config-best-record');
  elements.bestPresetName = get('best-preset-name');
  elements.bestScoreVal = get('best-score-val');
  elements.bestAccVal = get('best-acc-val');
  elements.btnStartGame = get('btn-start-game');
  elements.stageCards = getAll('.stage-grid .stage-card');
  elements.levelCards = getAll('.level-grid .level-card');
}

/* ==========================================================================
   DOM ELEMENT CAPTURE (Part 2: gameplay HUD)
   ========================================================================== */

(function _captureHUD() {
  elements.hudLevelCard = document.getElementById('hud-level-card');
  elements.hudLevel = document.getElementById('hud-level');
  elements.levelBarFill = document.getElementById('level-bar-fill');
  elements.hudStageCard = document.getElementById('hud-stage-card');
  elements.hudStageNum = document.getElementById('hud-stage-num');
  elements.hudStageName = document.getElementById('hud-stage-name');
  elements.hudStageProgressCard = document.getElementById('hud-stage-progress-card');
  elements.hudStageProgress = document.getElementById('hud-stage-progress');
  elements.stageProgressFill = document.getElementById('stage-progress-fill');
  elements.hudScore = document.getElementById('hud-score');
  elements.scorePopup = document.getElementById('score-popup');
  elements.hudTimer = document.getElementById('hud-timer');
  elements.hudTimerContainer = document.getElementById('hud-timer-container');
  elements.timerBarFill = document.getElementById('timer-bar-fill');
  elements.bonusTimePopup = document.getElementById('bonus-time-popup');
  elements.hudStreak = document.getElementById('hud-streak');
  elements.hudMultiplier = document.getElementById('hud-multiplier');
  elements.btnQuitGame = document.getElementById('btn-quit-game');
})();

/* ==========================================================================
   DOM ELEMENT CAPTURE (Part 3: gameplay question/feedback/keypad)
   ========================================================================== */

(function _captureGameplay() {
  elements.levelUpBanner = document.getElementById('level-up-banner');
  elements.levelUpTitle = document.getElementById('level-up-title');
  elements.levelUpDesc = document.getElementById('level-up-desc');
  elements.levelUpBadge = document.getElementById('level-up-badge');
  elements.streakAchievementBanner = document.getElementById('streak-achievement-banner');
  elements.streakAchievementIcon = document.getElementById('streak-achievement-icon');
  elements.streakAchievementKicker = document.getElementById('streak-achievement-kicker');
  elements.streakAchievementTitle = document.getElementById('streak-achievement-title');
  elements.streakAchievementDesc = document.getElementById('streak-achievement-desc');
  elements.streakAchievementBonus = document.getElementById('streak-achievement-bonus');

  elements.questionTierBadge = document.getElementById('question-tier-badge');
  elements.questionCounter = document.getElementById('question-counter');
  elements.termA = document.getElementById('term-a');
  elements.termOp = document.getElementById('term-op');
  elements.termB = document.getElementById('term-b');
  elements.userAnswerBox = document.getElementById('user-answer-box');
  elements.answerText = document.getElementById('answer-text');
  elements.feedbackBanner = document.getElementById('feedback-banner');
  elements.feedbackMascot = document.getElementById('feedback-mascot');
  elements.feedbackMsg = document.getElementById('feedback-msg');

  elements.keypadBtns = document.querySelectorAll('.key-btn[data-key]');
  elements.keyClear = document.querySelector('.key-clear');
  elements.keyBackspace = document.querySelector('.key-backspace');
  elements.btnSkipQuestion = document.getElementById('btn-skip-question');
  elements.btnSubmitAnswer = document.getElementById('btn-submit-answer');
})();

elements.storageStatusText = document.getElementById('storage-status-text');

/* ==========================================================================
   DOM ELEMENT CAPTURE (Part 4: summary screen)
   ========================================================================== */

(function _captureSummary() {
  elements.highScoreBanner = document.getElementById('high-score-banner');
  elements.stageResultBanner = document.getElementById('stage-result-banner');
  elements.stageResultIcon = document.getElementById('stage-result-icon');
  elements.stageResultTitle = document.getElementById('stage-result-title');
  elements.stageResultSub = document.getElementById('stage-result-sub');
  elements.stageStarsDisplay = document.getElementById('stage-stars-display');
  elements.summaryMascot = document.getElementById('summary-mascot');
  elements.summaryTitle = document.getElementById('summary-heading');
  elements.summaryCompliment = document.getElementById('summary-compliment');
  elements.summaryScore = document.getElementById('summary-score');
  elements.summaryLevel = document.getElementById('summary-level');
  elements.summaryAccuracy = document.getElementById('summary-accuracy');
  elements.summaryCorrect = document.getElementById('summary-correct');
  elements.summaryMissed = document.getElementById('summary-missed');
  elements.summaryStreak = document.getElementById('summary-streak');
  elements.summaryBonusEarned = document.getElementById('summary-bonus-earned');
  elements.accuracyChartCanvas = document.getElementById('accuracyChart');
  elements.accuracySvgFallback = document.getElementById('accuracy-svg-fallback');
  elements.legendCorrectPct = document.getElementById('legend-correct-pct');
  elements.legendMissedPct = document.getElementById('legend-missed-pct');
  elements.btnNextStage = document.getElementById('btn-next-stage');
  elements.btnNextStageText = document.getElementById('btn-next-stage-text');
  elements.btnPlayAgain = document.getElementById('btn-play-again');
  elements.btnPlayAgainText = document.getElementById('btn-play-again-text');
  elements.btnChangeSettings = document.getElementById('btn-change-settings');
  elements.btnChangeSettingsText = document.getElementById('btn-change-settings-text');
  elements.btnSummaryHistory = document.getElementById('btn-summary-history');
})();

/* ==========================================================================
   DOM ELEMENT CAPTURE (Part 5: history modal + confirm modals)
   ========================================================================== */

(function _captureModals() {
  elements.btnCloseHistory = document.getElementById('btn-close-history');
  elements.histTotalGames = document.getElementById('hist-total-games');
  elements.histBestScore = document.getElementById('hist-best-score');
  elements.histAvgAccuracy = document.getElementById('hist-avg-accuracy');
  elements.tabScoreTrend = document.getElementById('tab-score-trend');
  elements.tabAccuracyTrend = document.getElementById('tab-accuracy-trend');
  elements.viewScoreTrend = document.getElementById('view-score-trend');
  elements.viewAccuracyTrend = document.getElementById('view-accuracy-trend');
  elements.scoreTrendCanvas = document.getElementById('scoreTrendChart');
  elements.scoreTrendSvgFallback = document.getElementById('score-trend-svg-fallback');
  elements.accuracyTrendCanvas = document.getElementById('accuracyTrendChart');
  elements.accTrendSvgFallback = document.getElementById('acc-trend-svg-fallback');
  elements.historyTbody = document.getElementById('history-tbody');
  elements.btnClearHistory = document.getElementById('btn-clear-history');

  elements.btnCancelClear = document.getElementById('btn-cancel-clear');
  elements.btnConfirmClear = document.getElementById('btn-confirm-clear');
  elements.btnResumeGame = document.getElementById('btn-resume-game');
  elements.btnReallyQuit = document.getElementById('btn-really-quit');
})();

/* ==========================================================================
   HELPER: Preset & Time
   ========================================================================== */

function _applyPreset(preset) {
  state.preset = preset;
  const cards = elements.presetCards;
  cards.forEach(c => {
    const active = c.dataset.preset === preset;
    c.classList.toggle('active', active);
    c.setAttribute('aria-checked', String(active));
  });
  if (storage.updateBestRecordUI) storage.updateBestRecordUI();
}

function _selectTimeDuration(seconds) {
  state.startingTime = seconds;
  state.timeLeft = seconds;
  state.timerInitial = seconds;
  elements.timerChips.forEach(chip => {
    chip.classList.toggle('active', parseInt(chip.dataset.time, 10) === seconds);
  });
}

/* ==========================================================================
   HELPER: UI updates
   ========================================================================== */

function _updateStorageStatusUI(source) {
  const el = elements.storageStatusText;
  if (!el) return;
  el.textContent = source === 'cleared' ? 'History has been reset.' : 'Saved securely in browser cookies & localStorage';
}

function _updateBestRecordUI() {
  const preset = state.preset;
  const bestScore = state.saveData.highScores[preset] || 0;
  const bestAcc = state.saveData.bestAccuracy[preset] || 0;
  const names = { easy: 'Easy', medium: 'Medium', hard: 'Hard', custom: 'Custom' };
  if (elements.bestPresetName) elements.bestPresetName.textContent = names[preset] || 'Mode';
  if (elements.bestScoreVal) elements.bestScoreVal.textContent = `${bestScore} pts`;
  if (elements.bestAccVal) elements.bestAccVal.textContent = `${bestAcc}%`;
}

function _renderStageGridUI() {
  const unlocked = state.saveData.stageProgress.unlockedStage || 1;
  const stars = state.saveData.stageProgress.stars || {};
  if (!elements.stageCards || elements.stageCards.length === 0) return;
  elements.stageCards.forEach(card => {
    const stageNum = parseInt(card.dataset.stage, 10);
    const starsEl = document.getElementById(`stage-stars-${stageNum}`);
    const isUnlocked = stageNum <= unlocked;
    const isActive = stageNum === state.currentStage;
    card.classList.toggle('locked', !isUnlocked);
    card.classList.toggle('active', isActive && isUnlocked);
    card.setAttribute('aria-checked', String(isActive && isUnlocked));
    card.setAttribute('aria-disabled', String(!isUnlocked));
    if (starsEl) {
      if (!isUnlocked) starsEl.textContent = '🔒 Locked';
      else {
        const sc = stars[stageNum] || 0;
        starsEl.textContent = sc === 3 ? '⭐⭐⭐' : sc === 2 ? '⭐⭐☆' : sc === 1 ? '⭐☆☆' : '☆☆☆';
      }
    }
  });
  if (elements.btnStartGame) {
    const cap = elements.btnStartGame.querySelector('.btn-caption');
    if (cap) cap.textContent = state.gameMode === 'stageAdventure'
      ? `START STAGE ${state.currentStage} 🚀` : 'START GAME';
  }
}

function _renderHistoryModal() {
  // History modal rendering handled by existing code paths
}

/* ==========================================================================
   GAME LOGIC
   ========================================================================== */

function startGame() {
  state.questionNumber = 0;
  state.score = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.correctCount = 0;
  state.missedCount = 0;
  state.totalAnswered = 0;
  state.bonusTimeEarned = 0;
  state.isPlaying = true;
  state.isSubmitting = false;

  if (state.gameMode === 'stageAdventure') {
    state.stageQuestionIndex = 0;
  } else if (state.gameMode === 'levelQuest') {
    state.levelQuestionIndex = 0;
    state.levelCorrectCount = 0;
    state.levelMissedCount = 0;
  }

  state.timerInitial = state.startingTime;
  state.timeLeft = state.startingTime;

  gameView.show();
  gameView.updateHUD();
  gameView.startTimer((timeLeft) => {
    state.timeLeft = timeLeft;
  });
  generateAndShowQuestion();
}

function generateAndShowQuestion() {
  state.questionNumber++;

  let question;
  if (state.gameMode === 'stageAdventure') {
    question = mathEngine.generateStageQuestion(state.currentStage);
    question.tierName = `Stage ${state.currentStage}`;
  } else {
    question = mathEngine.generateQuestion();
  }

  state.currentQuestion = question;
  state.currentInput = '';
  gameView.renderQuestion(question);
  gameView.updateHUD();
}

function appendDigit(digit) {
  if (state.isSubmitting) return;
  if (state.currentInput.length >= 6) return;
  state.currentInput += digit;
  elements.answerText.textContent = state.currentInput;
}

function clearInput() {
  state.currentInput = '';
  elements.answerText.textContent = '';
}

function backspaceDigit() {
  state.currentInput = state.currentInput.slice(0, -1);
  elements.answerText.textContent = state.currentInput;
}

function submitAnswer() {
  if (state.isSubmitting || !state.currentQuestion) return;
  if (state.currentInput.trim() === '') return;

  state.isSubmitting = true;

  const userVal = parseInt(state.currentInput, 10);
  const correct = userVal === state.currentQuestion.answer;

  if (correct) {
    state.correctCount++;
    state.streak++;
    if (state.streak > state.bestStreak) state.bestStreak = state.streak;

    const multiplier = gameView._getStreakMultiplier();
    const basePts = state.currentQuestion.basePoints || 10;
    const earned = Math.floor(basePts * multiplier);
    state.score += earned;

    const bonus = state.currentQuestion.bonusSeconds || 0;
    if (bonus > 0) {
      gameView.addBonusTime(bonus);
    }

    gameView.showScorePopup(earned);
    gameView.showFeedback(true, state.currentQuestion);

    if (state.streak === 5) gameView.showStreakMilestone(5, 25);
    else if (state.streak === 10) gameView.showStreakMilestone(10, 50);
    else if (state.streak === 20) gameView.showStreakMilestone(20, 100);
    else if (state.streak === 50) gameView.showStreakMilestone(50, 250);
    else if (state.streak === 100) gameView.showStreakMilestone(100, 500);

    if (state.gameMode !== 'stageAdventure') {
      if (state.correctCount % 5 === 0 && state.playerLevel < 8) {
        state.playerLevel++;
        state.highestLevelReached = Math.max(state.highestLevelReached, state.playerLevel);
        gameView.showLevelUpBanner(state.playerLevel);
        gameView.addBonusTime(5);
      }
    }
  } else {
    state.missedCount++;
    state.streak = 0;
    gameView.showFeedback(false, state.currentQuestion);
  }

  state.totalAnswered++;

  setTimeout(() => {
    state.isSubmitting = false;
    advanceQuestion();
  }, 900);
}

function skipQuestion() {
  if (state.isSubmitting || !state.isPlaying) return;
  state.missedCount++;
  state.streak = 0;
  state.totalAnswered++;
  gameView.showFeedback(false, state.currentQuestion);
  state.isSubmitting = true;
  setTimeout(() => {
    state.isSubmitting = false;
    advanceQuestion();
  }, 900);
}

function advanceQuestion() {
  if (!state.isPlaying) return;

  let roundOver = false;

  if (state.gameMode === 'stageAdventure') {
    state.stageQuestionIndex++;
    if (state.stageQuestionIndex >= state.stageQuestionsTotal) {
      roundOver = true;
    }
  } else if (state.gameMode === 'timeRush') {
    if (state.timeLeft <= 0) {
      roundOver = true;
    }
  } else if (state.gameMode === 'levelQuest') {
    state.levelQuestionIndex++;
    if (state.levelQuestionIndex >= state.levelQuestionsTotal) {
      roundOver = true;
    }
  }

  if (roundOver) {
    endGame();
  } else {
    generateAndShowQuestion();
  }
}

function endGame() {
  state.isPlaying = false;
  gameView.destroy();
  gameView.hide();

  const accuracy = state.totalAnswered > 0
    ? Math.round((state.correctCount / state.totalAnswered) * 100)
    : 0;

  let stageCleared = false;
  let starsEarned = 0;

  if (state.gameMode === 'stageAdventure') {
    stageCleared = mathBlastGame.isStageCleared(state.correctCount, state.stageQuestionsTotal);
    starsEarned = mathBlastGame.getStarsForAccuracy(accuracy);

    if (stageCleared) {
      const nextUnlocked = Math.max(state.saveData.stageProgress.unlockedStage, state.currentStage + 1);
      state.saveData.stageProgress.unlockedStage = nextUnlocked;
    }
    state.saveData.stageProgress.stars[state.currentStage] = Math.max(
      state.saveData.stageProgress.stars[state.currentStage] || 0, starsEarned
    );
    state.saveData.stageProgress.bestAccuracy[state.currentStage] = Math.max(
      state.saveData.stageProgress.bestAccuracy[state.currentStage] || 0, accuracy
    );
    state.saveData.stageProgress.bestScore[state.currentStage] = Math.max(
      state.saveData.stageProgress.bestScore[state.currentStage] || 0, state.score
    );
  }

  const prevBest = state.saveData.highScores[state.preset] || 0;
  const isHighScore = state.score > prevBest;
  if (isHighScore) {
    state.saveData.highScores[state.preset] = state.score;
    state.saveData.bestAccuracy[state.preset] = Math.max(
      state.saveData.bestAccuracy[state.preset] || 0, accuracy
    );
    if (sound) sound.playHighScoreFanfare();
  }

  state.saveData.history.push({
    timestamp: new Date().toISOString(),
    mode: state.gameMode,
    stage: state.currentStage,
    level: state.currentLevel,
    score: state.score,
    accuracy: accuracy,
    correct: state.correctCount,
    missed: state.missedCount,
    duration: Math.max(0, state.timerInitial - state.timeLeft),
    preset: state.preset
  });

  storage.saveData();

  const results = {
    score: state.score,
    maxLevel: state.playerLevel,
    accuracy: accuracy,
    correct: state.correctCount,
    missed: state.missedCount,
    bestStreak: state.bestStreak,
    bonusTimeEarned: state.bonusTimeEarned,
    isHighScore: isHighScore,
    stageCleared: stageCleared,
    starsEarned: starsEarned
  };

  summaryView.setOnPlayAgain(() => startGame());
  summaryView.setOnChangeSettings(() => {
    _switchScreen(elements.screenConfig);
  });
  summaryView.setOnViewHistory(() => {
    elements.modalHistory.classList.remove('hidden');
  });
  if (state.gameMode === 'stageAdventure') {
    summaryView.setOnNextStage(() => {
      state.currentStage = Math.min(state.currentStage + 1, state.saveData.stageProgress.unlockedStage);
      _renderStageGridUI();
      startGame();
    });
  }

  summaryView.render(results);
  summaryView.show();

  if (isHighScore && typeof confetti !== 'undefined') {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
  }
}

/* ==========================================================================
   EVENT BINDING
   ========================================================================== */

function _bindGlobalEvents() {
  elements.headerHomeBtn.addEventListener('click', () => {
    _switchScreen(elements.screenLanding);
    if (sound) sound.playTap();
  });

  elements.btnSoundToggle.addEventListener('click', () => {
    storage.toggleSound();
  });

  elements.btnOpenHistory.addEventListener('click', () => {
    elements.modalHistory.classList.remove('hidden');
    if (sound) sound.playTap();
  });

  elements.keypadBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      appendDigit(btn.dataset.key);
      if (sound) sound.playTap();
    });
  });

  elements.keyClear.addEventListener('click', () => {
    clearInput();
    if (sound) sound.playTap();
  });

  elements.keyBackspace.addEventListener('click', () => {
    backspaceDigit();
    if (sound) sound.playTap();
  });

  elements.btnSubmitAnswer.addEventListener('click', () => {
    submitAnswer();
  });

  elements.btnSkipQuestion.addEventListener('click', () => {
    skipQuestion();
    if (sound) sound.playTap();
  });

  window.addEventListener('keydown', (e) => {
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

  elements.btnQuitGame.addEventListener('click', () => {
    elements.modalConfirmQuit.classList.remove('hidden');
  });

  elements.btnResumeGame.addEventListener('click', () => {
    elements.modalConfirmQuit.classList.add('hidden');
  });

  elements.btnReallyQuit.addEventListener('click', () => {
    elements.modalConfirmQuit.classList.add('hidden');
    state.isPlaying = false;
    gameView.destroy();
    gameView.hide();
    _switchScreen(elements.screenConfig);
  });

  elements.btnCancelClear.addEventListener('click', () => {
    elements.modalConfirmClear.classList.add('hidden');
  });

  elements.btnConfirmClear.addEventListener('click', () => {
    storage.clearAll();
    elements.modalConfirmClear.classList.add('hidden');
  });

  [elements.modalHistory, elements.modalConfirmClear, elements.modalConfirmQuit].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  });
}

/* ==========================================================================
   BOOT
   ========================================================================== */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}