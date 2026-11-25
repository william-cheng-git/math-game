/**
 * ConfigView — Configuration & Setup Screen
 *
 * Handles the pre-game configuration UI: difficulty presets, operations
 * toggles, timer duration, game mode, stage/level selection, and start game.
 */
export class ConfigView {
  constructor(elementsRef, soundRef, storageRef, mathEngineRef, configRef) {
    this.elements = elementsRef;
    this.sound = soundRef;
    this.storage = storageRef;
    this.mathEngine = mathEngineRef;
    this.config = configRef;
    this.state = null;
    this.onStartGame = null;
    this.customRanges = {
      add: { a: { min: 1, max: 99 }, b: { min: 1, max: 99 } },
      sub: { a: { min: 2, max: 99 }, b: { min: 1, max: 98 } },
      mul: { a: { min: 1, max: 12 }, b: { min: 1, max: 12 } },
      div: { a: { min: 1, max: 144 }, b: { min: 1, max: 12 } }
    };
  }

  setState(stateRef) {
    this.state = stateRef;
  }

  init() {
    this._bindModeSelection();
    this._bindPresetSelection();
    this._bindOperationToggles();
    this._bindTimerChips();
    this._bindCustomTimeInput();
    this._bindCustomRangeInputs();
    this._bindStartGame();
    this._bindStageCards();
    this._bindLevelCards();
  }

  setOnStartGame(callback) {
    this.onStartGame = callback;
  }

  _updateStartButtonLabel() {
    const btn = this.elements.btnStartGame;
    if (!btn) return;
    const caption = btn.querySelector('.btn-caption');
    if (!caption) return;
    if (this.state.gameMode === 'stageAdventure') {
      caption.textContent = `START STAGE ${this.state.currentStage} 🚀`;
    } else {
      caption.textContent = 'START GAME';
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Game Mode Selection                                             */
  /* ---------------------------------------------------------------- */

  _bindModeSelection() {
    const { modeBtnStage, modeBtnTime, modeBtnLevelQuest } = this.elements;

    const setMode = (mode) => {
      this.state.gameMode = mode;

      [modeBtnStage, modeBtnTime, modeBtnLevelQuest].forEach(btn => {
        if (!btn) return;
        const isActive = btn.dataset.mode === mode;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-checked', String(isActive));
      });

      const panelMap = {
        stageAdventure: 'panel-stage-adventure',
        timeRush: 'panel-time-rush',
        levelQuest: 'panel-level-quest'
      };
      ['panel-stage-adventure', 'panel-time-rush', 'panel-level-quest'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      });
      const activePanel = document.getElementById(panelMap[mode]);
      if (activePanel) activePanel.classList.remove('hidden');

      this._updateStartButtonLabel();
      if (this.sound) this.sound.playTap();
    };

    if (modeBtnStage) modeBtnStage.addEventListener('click', () => setMode('stageAdventure'));
    if (modeBtnTime) modeBtnTime.addEventListener('click', () => setMode('timeRush'));
    if (modeBtnLevelQuest) modeBtnLevelQuest.addEventListener('click', () => setMode('levelQuest'));
  }

  /* ---------------------------------------------------------------- */
  /*  Difficulty Presets                                              */
  /* ---------------------------------------------------------------- */

  _bindPresetSelection() {
    const cards = this.elements.presetCards;
    if (!cards || cards.length === 0) return;

    const customSection = document.getElementById('custom-range-section');

    const showCustomRanges = (show) => {
      if (customSection) {
        customSection.classList.toggle('hidden', !show);
      }
    };

    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-checked', 'false');
        });
        card.classList.add('active');
        card.setAttribute('aria-checked', 'true');

        this.state.preset = card.dataset.preset;
        this._updateStartButtonLabel();

        // Show custom range controls only when "custom" preset is selected
        showCustomRanges(this.state.preset === 'custom');

        if (this.storage && this.storage.updateBestRecordUI) {
          this.storage.updateBestRecordUI();
        }
        if (this.sound) this.sound.playTap();
      });
    });

    // Initialize visibility based on current preset
    showCustomRanges(this.state.preset === 'custom');
  }

  /* ---------------------------------------------------------------- */
  /*  Operations Toggles                                              */
  /* ---------------------------------------------------------------- */

  _bindOperationToggles() {
    const checkboxes = this.elements.opCheckboxes;
    if (!checkboxes) return;

    Object.values(checkboxes).forEach(cb => {
      cb.addEventListener('change', () => {
        this.state.operations = Object.entries(checkboxes)
          .filter(([key, el]) => el.checked)
          .map(([key]) => key);
        if (this.storage && this.storage.updateBestRecordUI) {
          this.storage.updateBestRecordUI();
        }
        if (this.sound) this.sound.playTap();
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /*  Timer Duration                                                  */
  /* ---------------------------------------------------------------- */

  _bindTimerChips() {
    const chips = this.elements.timerChips;
    if (!chips || chips.length === 0) return;

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const time = parseInt(chip.dataset.time, 10);
        this.state.startingTime = time;
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        if (this.sound) this.sound.playTap();
      });
    });
  }

  _bindCustomTimeInput() {
    const input = this.elements.customTimeInput;
    if (!input) return;
    input.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (val && val >= 10 && val <= 600) {
        this.state.startingTime = val;
        this.elements.timerChips.forEach(chip => chip.classList.remove('active'));
      }
    });
  }

  /* ---------------------------------------------------------------- */
  /*  Custom Number Range Inputs                                      */
  /* ---------------------------------------------------------------- */

  _bindCustomRangeInputs() {
    const ops = ['add', 'sub', 'mul', 'div'];
    const sides = ['a', 'b'];

    ops.forEach(op => {
      sides.forEach(side => {
        const minEl = document.getElementById(`custom-${op}-${side}-min`);
        const maxEl = document.getElementById(`custom-${op}-${side}-max`);

        if (minEl) {
          minEl.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val) && val >= 1) {
              this.customRanges[op][side].min = val;
              // Ensure min <= max
              if (this.customRanges[op][side].min > this.customRanges[op][side].max) {
                this.customRanges[op][side].max = this.customRanges[op][side].min;
                maxEl.value = this.customRanges[op][side].max;
              }
            }
          });
        }

        if (maxEl) {
          maxEl.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val) && val >= 1) {
              this.customRanges[op][side].max = val;
              // Ensure min <= max
              if (this.customRanges[op][side].max < this.customRanges[op][side].min) {
                this.customRanges[op][side].min = this.customRanges[op][side].max;
                minEl.value = this.customRanges[op][side].min;
              }
            }
          });
        }
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /*  Start Game                                                      */
  /* ---------------------------------------------------------------- */

  _bindStartGame() {
    const btn = this.elements.btnStartGame;
    if (!btn) return;
    btn.addEventListener('click', () => {
      const cb = this.elements.opCheckboxes;
      this.state.operations = Object.entries(cb)
        .filter(([key, el]) => el.checked)
        .map(([key]) => key);
      if (this.state.operations.length === 0) {
        this.state.operations = ['add'];
      }

      this.state.timerInitial = this.state.startingTime;
      this.state.timeLeft = this.state.startingTime;

      // Pass custom ranges to state when custom preset is active
      if (this.state.preset === 'custom') {
        this.state.customRanges = JSON.parse(JSON.stringify(this.customRanges));
      }

      if (this.state.gameMode === 'stageAdventure') {
        this.state.stageQuestionIndex = 0;
        this.state.score = 0;
        this.state.streak = 0;
        this.state.correctCount = 0;
        this.state.missedCount = 0;
        this.state.totalAnswered = 0;
        this.state.bonusTimeEarned = 0;
        this.state.isPlaying = true;
      }

      if (this.onStartGame) this.onStartGame();
    });
  }

  /* ---------------------------------------------------------------- */
  /*  Stage / Level Card Selection                                    */
  /* ---------------------------------------------------------------- */

  _bindStageCards() {
    const cards = this.elements.stageCards;
    if (!cards || cards.length === 0) return;
    cards.forEach(card => {
      card.addEventListener('click', () => {
        if (card.classList.contains('locked')) return;
        cards.forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-checked', 'false');
        });
        card.classList.add('active');
        card.setAttribute('aria-checked', 'true');
        this.state.currentStage = parseInt(card.dataset.stage, 10);
        this._updateStartButtonLabel();
        if (this.sound) this.sound.playTap();
      });
    });
  }

  _bindLevelCards() {
    const cards = this.elements.levelCards;
    if (!cards || cards.length === 0) return;
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-checked', 'false');
        });
        card.classList.add('active');
        card.setAttribute('aria-checked', 'true');
        this.state.currentLevel = parseInt(card.dataset.level, 10);
        if (this.sound) this.sound.playTap();
      });
    });
  }