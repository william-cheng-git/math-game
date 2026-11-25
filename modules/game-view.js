/**
 * GameView — Active Gameplay Screen
 *
 * Handles the in-game HUD, question display, answer input, validation,
 * timer, scoring, streaks, level-up banners, and transitions to summary.
 */
export class GameView {
  constructor(elementsRef, soundRef, storageRef, mathEngineRef, stateRef) {
    this.elements = elementsRef;
    this.sound = soundRef;
    this.storage = storageRef;
    this.mathEngine = mathEngineRef;
    this.state = stateRef;

    this.timerIntervalId = null;
    this.levelUpTimeoutId = null;
    this.streakMilestoneTimeoutId = null;
    this.lastTickTime = 0;

    this.onQuit = null;
    this.onNextQuestion = null;
    this.onTimeUp = null;
  }

  /* ---------------------------------------------------------------- */
  /*  Screen Switching                                                */
  /* ---------------------------------------------------------------- */

  show() {
    const { screenConfig, screenGame } = this.elements;
    if (screenConfig) screenConfig.classList.remove('active');
    if (screenGame) screenGame.classList.add('active');
    this._updateHUDVisibility();
  }

  hide() {
    const { screenGame } = this.elements;
    if (screenGame) screenGame.classList.remove('active');
  }

  _updateHUDVisibility() {
    const { hudLevelCard, hudStageCard, hudStageProgressCard, hudTimerContainer } = this.elements;
    const isStage = this.state.gameMode === 'stageAdventure';
    const isTimeRush = this.state.gameMode === 'timeRush';

    if (hudLevelCard) hudLevelCard.style.display = isTimeRush ? 'flex' : 'none';
    if (hudStageCard) hudStageCard.style.display = isStage ? 'flex' : 'none';
    if (hudStageProgressCard) hudStageProgressCard.style.display = isStage ? 'flex' : 'none';
    if (hudTimerContainer) hudTimerContainer.style.display = isTimeRush ? 'flex' : 'none';
  }

  /* ---------------------------------------------------------------- */
  /*  Question Display                                                */
  /* ---------------------------------------------------------------- */

  renderQuestion(question) {
    const { termA, termOp, termB, answerText, userAnswerBox,
            questionTierBadge, questionCounter, feedbackBanner,
            feedbackMascot, feedbackMsg } = this.elements;

    if (termA) termA.textContent = question.a;
    if (termOp) termOp.textContent = question.symbol;
    if (termB) termB.textContent = question.b;
    if (answerText) answerText.textContent = '';
    if (userAnswerBox) {
      userAnswerBox.classList.remove('correct', 'shake', 'active');
    }

    if (questionTierBadge) {
      const bonusText = question.bonusSeconds > 1 ? ` (+${question.bonusSeconds}s bonus)` : '';
      questionTierBadge.textContent = `⭐ ${question.tierName}${bonusText}`;
    }
    if (questionCounter) {
      questionCounter.textContent = `Question #${this.state.questionNumber}`;
    }

    if (feedbackBanner) {
      feedbackBanner.className = 'feedback-banner';
      feedbackBanner.style.display = 'block';
    }
    if (feedbackMascot) feedbackMascot.textContent = '🌟';
    if (feedbackMsg) feedbackMsg.textContent = 'Type your answer and tap GO!';
  }

  showFeedback(correct, question) {
    const { feedbackBanner, feedbackMascot, feedbackMsg,
            userAnswerBox, answerText } = this.elements;

    if (correct) {
      if (feedbackBanner) {
        feedbackBanner.className = 'feedback-banner correct';
        feedbackBanner.style.display = 'block';
      }
      if (feedbackMascot) feedbackMascot.textContent = '🌟';
      if (feedbackMsg) feedbackMsg.textContent = this._randomCorrectPhrase();
      if (userAnswerBox) userAnswerBox.classList.add('correct');
      if (this.sound) this.sound.playCorrect(question.tier);
    } else {
      if (feedbackBanner) {
        feedbackBanner.className = 'feedback-banner incorrect';
        feedbackBanner.style.display = 'block';
      }
      if (feedbackMascot) feedbackMascot.textContent = '🌱';
      if (feedbackMsg) feedbackMsg.textContent = `The answer was ${question.answer}. Nice try!`;
      if (userAnswerBox) userAnswerBox.classList.add('shake');
      if (this.sound) this.sound.playIncorrect();
    }
    if (answerText) answerText.textContent = this.state.currentInput;
  }

  _randomCorrectPhrase() {
    const phrases = [
      { text: 'Awesome! 🌟', mascot: '🌟' },
      { text: 'Super Fast! ⚡', mascot: '🚀' },
      { text: 'Spot On! 🎯', mascot: '🎯' },
      { text: 'Math Genius! 🧠', mascot: '💡' },
      { text: 'Keep It Up! 🔥', mascot: '⭐' },
      { text: 'Brilliant! ✨', mascot: '🎉' },
      { text: 'You Rock! 🎸', mascot: '🌟' }
    ];
    const p = phrases[Math.floor(Math.random() * phrases.length)];
    const { feedbackMascot, feedbackMsg } = this.elements;
    if (feedbackMascot) feedbackMascot.textContent = p.mascot;
    if (feedbackMsg) feedbackMsg.textContent = p.text;
    return p.text;
  }

  /* ---------------------------------------------------------------- */
  /*  HUD Updates                                                     */
  /* ---------------------------------------------------------------- */

  updateHUD() {
    const { hudScore, hudStreak, hudMultiplier, hudTimer,
            hudLevel, levelBarFill, hudStageNum, hudStageName,
            hudStageProgress, stageProgressFill } = this.elements;

    if (hudScore) hudScore.textContent = this.state.score;
    if (hudStreak) hudStreak.textContent = `${this.state.streak} 🔥`;

    const multiplier = this._getStreakMultiplier();
    if (hudMultiplier) hudMultiplier.textContent = `${multiplier.toFixed(1)}x`;

    if (hudTimer) hudTimer.textContent = Math.ceil(this.state.timeLeft);

    if (this.state.gameMode === 'stageAdventure') {
      if (hudStageNum) hudStageNum.textContent = `${this.state.currentStage} 🗺️`;
      if (hudStageProgress) {
        hudStageProgress.textContent = `${this.state.stageQuestionIndex + 1} / 10`;
      }
      if (stageProgressFill) {
        const pct = ((this.state.stageQuestionIndex + 1) / 10) * 100;
        stageProgressFill.style.width = `${pct}%`;
      }
    } else if (this.state.gameMode === 'timeRush') {
      if (hudLevel) {
        const titles = this.state.levelTitles || ['', 'Apprentice', 'Explorer', 'Adventurer', 'Champion', 'Master', 'Grandmaster', 'Mythic Hero', 'Legend'];
        const title = titles[this.state.playerLevel] || 'Apprentice';
        hudLevel.textContent = `${this.state.playerLevel} ⭐`;
      }
      if (levelBarFill) {
        const pct = Math.min(100, (this.state.score % 100));
        levelBarFill.style.width = `${pct}%`;
      }
    }
  }

  _getStreakMultiplier() {
    const s = this.state.streak;
    if (s >= 100) return 4.0;
    if (s >= 50) return 3.0;
    if (s >= 20) return 2.0;
    if (s >= 10) return 1.5;
    if (s >= 5) return 1.25;
    return 1.0;
  }

  /* ---------------------------------------------------------------- */
  /*  Timer                                                           */
  /* ---------------------------------------------------------------- */

  startTimer(tickCallback) {
    this.stopTimer();
    const startTime = Date.now();
    this.lastTickTime = startTime;

    this.timerIntervalId = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;
      this.state.timeLeft = Math.max(0, this.state.timerInitial - elapsed);

      if (tickCallback) tickCallback(this.state.timeLeft);

      this.updateHUD();
      this._updateTimerUrgency();

      if (this.state.timeLeft <= 0) {
        this.stopTimer();
        if (this.onTimeUp) this.onTimeUp();
      }
    }, 100);
  }

  stopTimer() {
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
  }

  _updateTimerUrgency() {
    const { hudTimerContainer } = this.elements;
    if (!hudTimerContainer) return;

    hudTimerContainer.classList.remove('warning', 'urgent');
    if (this.state.timeLeft <= 5) {
      hudTimerContainer.classList.add('urgent');
    } else if (this.state.timeLeft <= 15) {
      hudTimerContainer.classList.add('warning');
    }
  }

  addBonusTime(seconds) {
    this.state.timeLeft += seconds;
    this.state.bonusTimeEarned += seconds;
    this.updateHUD();

    const { bonusTimePopup } = this.elements;
    if (bonusTimePopup) {
      bonusTimePopup.textContent = `+${seconds}s!`;
      bonusTimePopup.classList.add('show');
      setTimeout(() => bonusTimePopup.classList.remove('show'), 1000);
    }
    if (this.sound) this.sound.playBonusTime();
  }

  /* ---------------------------------------------------------------- */
  /*  Score / Streak Popups                                           */
  /* ---------------------------------------------------------------- */

  showScorePopup(points) {
    const { scorePopup } = this.elements;
    if (!scorePopup) return;
    scorePopup.textContent = `+${points} pts!`;
    scorePopup.classList.add('show');
    setTimeout(() => scorePopup.classList.remove('show'), 800);
  }

  /* ---------------------------------------------------------------- */
  /*  Achievement Banners                                             */
  /* ---------------------------------------------------------------- */

  showLevelUpBanner(newLevel) {
    const { levelUpBanner, levelUpTitle, levelUpDesc, levelUpBadge } = this.elements;
    if (!levelUpBanner) return;

    const titles = this.state.levelTitles || ['', 'Apprentice', 'Explorer', 'Adventurer', 'Champion', 'Master', 'Grandmaster', 'Mythic Hero', 'Legend'];
    const title = titles[newLevel] || `Level ${newLevel}`;

    if (levelUpTitle) levelUpTitle.textContent = `LEVEL ${newLevel}: ${title.toUpperCase()}!`;
    if (levelUpDesc) levelUpDesc.textContent = '+5s Bonus Time! Harder math unlocked! 🚀';
    if (levelUpBadge) levelUpBadge.textContent = '+5s ⏱️';

    levelUpBanner.classList.remove('hidden');
    if (this.sound) this.sound.playLevelUp();

    this.levelUpTimeoutId = setTimeout(() => {
      levelUpBanner.classList.add('hidden');
    }, 4000);
  }

  showStreakMilestone(milestone, bonusPts) {
    const { streakAchievementBanner, streakAchievementIcon,
            streakAchievementKicker, streakAchievementTitle,
            streakAchievementDesc, streakAchievementBonus } = this.elements;
    if (!streakAchievementBanner) return;

    if (streakAchievementIcon) streakAchievementIcon.textContent = '🔥';
    if (streakAchievementKicker) streakAchievementKicker.textContent = '🔥 STREAK MILESTONE!';
    if (streakAchievementTitle) streakAchievementTitle.textContent = `${milestone} IN A ROW!`;
    if (streakAchievementDesc) streakAchievementDesc.textContent = 'Super Streak! Extra bonus points earned!';
    if (streakAchievementBonus) streakAchievementBonus.textContent = `+${bonusPts} PTS`;

    streakAchievementBanner.classList.remove('hidden');
    if (this.sound) this.sound.playStreakMilestone(milestone);

    this.streakMilestoneTimeoutId = setTimeout(() => {
      streakAchievementBanner.classList.add('hidden');
    }, 4000);
  }

  hideBanners() {
    const { levelUpBanner, streakAchievementBanner } = this.elements;
    if (levelUpBanner) levelUpBanner.classList.add('hidden');
    if (streakAchievementBanner) streakAchievementBanner.classList.add('hidden');
    if (this.levelUpTimeoutId) clearTimeout(this.levelUpTimeoutId);
    if (this.streakMilestoneTimeoutId) clearTimeout(this.streakMilestoneTimeoutId);
  }

  /* ---------------------------------------------------------------- */
  /*  Cleanup                                                         */
  /* ---------------------------------------------------------------- */

  destroy() {
    this.stopTimer();
    this.hideBanners();
  }