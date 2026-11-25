/**
 * SummaryView — Game Over & Summary Screen
 *
 * Renders the round-complete screen with metrics, charts, and action buttons.
 */
export class SummaryView {
  constructor(elementsRef, soundRef, storageRef, stateRef, chartRef) {
    this.elements = elementsRef;
    this.sound = soundRef;
    this.storage = storageRef;
    this.state = stateRef;
    this.chart = chartRef;

    this.onPlayAgain = null;
    this.onChangeSettings = null;
    this.onViewHistory = null;
    this.onNextStage = null;
  }

  /* ---------------------------------------------------------------- */
  /*  Screen Switching                                                */
  /* ---------------------------------------------------------------- */

  show() {
    const { screenGame, screenSummary } = this.elements;
    if (screenGame) screenGame.classList.remove('active');
    if (screenSummary) screenSummary.classList.add('active');
  }

  /* ---------------------------------------------------------------- */
  /*  Render Summary                                                  */
  /* ---------------------------------------------------------------- */

  render(results) {
    const {
      highScoreBanner, summaryMascot, summaryTitle, summaryCompliment,
      summaryScore, summaryLevel, summaryAccuracy, summaryCorrect,
      summaryMissed, summaryStreak, summaryBonusEarned,
      accuracyChartCanvas, accuracySvgFallback,
      legendCorrectPct, legendMissedPct,
      btnNextStage, btnNextStageText, stageResultBanner,
      stageResultIcon, stageResultTitle, stageResultSub, stageStarsDisplay
    } = this.elements;

    // Core metrics
    if (summaryScore) summaryScore.textContent = results.score;
    if (summaryLevel) summaryLevel.textContent = `Level ${results.maxLevel}`;
    if (summaryAccuracy) summaryAccuracy.textContent = `${results.accuracy}%`;
    if (summaryCorrect) summaryCorrect.textContent = results.correct;
    if (summaryMissed) summaryMissed.textContent = results.missed;
    if (summaryStreak) summaryStreak.textContent = results.bestStreak;
    if (summaryBonusEarned) summaryBonusEarned.textContent = `+${results.bonusTimeEarned}s`;

    // Compliment
    if (summaryCompliment) {
      summaryCompliment.textContent = results.accuracy >= 80
        ? 'Fantastic effort! Look at your math power:'
        : 'Great job! Keep practicing to improve:';
    }

    // High score banner
    if (highScoreBanner) {
      highScoreBanner.classList.toggle('hidden', !results.isHighScore);
    }

    // Stage result banner (Stage Adventure mode)
    if (this.state.gameMode === 'stageAdventure') {
      if (stageResultBanner) {
        stageResultBanner.classList.remove('hidden');
        if (stageResultIcon) stageResultIcon.textContent = results.stageCleared ? '🎉' : '💪';
        if (stageResultTitle) stageResultTitle.textContent = results.stageCleared
          ? `STAGE ${this.state.currentStage} CLEARED!`
          : `STAGE ${this.state.currentStage} — Try Again`;
        if (stageResultSub) {
          stageResultSub.textContent = results.stageCleared
            ? `You scored ${results.accuracy}% accuracy! Next stage unlocked!`
            : `You scored ${results.accuracy}% accuracy. Need ≥80% to clear.`;
        }
        if (stageStarsDisplay) {
          const stars = results.starsEarned || 0;
          stageStarsDisplay.textContent = stars === 3 ? '⭐⭐⭐' : stars === 2 ? '⭐⭐☆' : stars === 1 ? '⭐☆☆' : '☆☆☆';
        }
      }
      if (btnNextStage) btnNextStage.classList.toggle('hidden', !results.stageCleared);
      if (btnNextStageText) btnNextStageText.textContent = `Next Stage 🚀`;
    } else {
      if (stageResultBanner) stageResultBanner.classList.add('hidden');
      if (btnNextStage) btnNextStage.classList.add('hidden');
    }

    // Accuracy chart
    if (this.chart && accuracyChartCanvas) {
      this.chart.renderAccuracyPie(accuracyChartCanvas, accuracySvgFallback,
        results.correct, results.missed, legendCorrectPct, legendMissedPct);
    }

    // Bind actions
    this._bindActions();
  }

  /* ---------------------------------------------------------------- */
  /*  Action Bindings                                                 */
  /* ---------------------------------------------------------------- */

  _bindActions() {
    const { btnPlayAgain, btnChangeSettings, btnSummaryHistory, btnNextStage, btnLevelQuit } = this.elements;

    if (btnPlayAgain) {
      const clone = btnPlayAgain.cloneNode(true);
      btnPlayAgain.parentNode.replaceChild(clone, btnPlayAgain);
      clone.addEventListener('click', () => {
        if (this.sound) this.sound.playTap();
        if (this.onPlayAgain) this.onPlayAgain();
      });
    }

    if (btnChangeSettings) {
      const clone = btnChangeSettings.cloneNode(true);
      btnChangeSettings.parentNode.replaceChild(clone, btnChangeSettings);
      clone.addEventListener('click', () => {
        if (this.sound) this.sound.playTap();
        if (this.onChangeSettings) this.onChangeSettings();
      });
    }

    if (btnSummaryHistory) {
      const clone = btnSummaryHistory.cloneNode(true);
      btnSummaryHistory.parentNode.replaceChild(clone, btnSummaryHistory);
      clone.addEventListener('click', () => {
        if (this.sound) this.sound.playTap();
        if (this.onViewHistory) this.onViewHistory();
      });
    }

    if (btnNextStage) {
      const clone = btnNextStage.cloneNode(true);
      btnNextStage.parentNode.replaceChild(clone, btnNextStage);
      clone.addEventListener('click', () => {
        if (this.sound) this.sound.playTap();
        if (this.onNextStage) this.onNextStage();
      });
    }
  }

  setOnPlayAgain(cb) { this.onPlayAgain = cb; }
  setOnChangeSettings(cb) { this.onChangeSettings = cb; }
  setOnViewHistory(cb) { this.onViewHistory = cb; }
  setOnNextStage(cb) { this.onNextStage = cb; }
}