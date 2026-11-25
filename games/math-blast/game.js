/**
 * MathBlastGame — Game-Specific Logic for Math Blast
 *
 * Contains stage definitions, level titles, and game-mode-specific rules.
 * This file is the "one game one folder" module for Math Blast.
 */

export const STAGE_DEFINITIONS = [
  {
    stage: 1,
    name: 'Starter Grove',
    icon: '🌱',
    desc: 'Single-digit + & − (Basic)',
    ops: ['add', 'sub']
  },
  {
    stage: 2,
    name: 'Carrying Crossing',
    icon: '⚡',
    desc: 'Carrying, borrowing, 2×, 5×, 10×',
    ops: ['add', 'sub', 'mul']
  },
  {
    stage: 3,
    name: 'Digit Mountain',
    icon: '🚀',
    desc: 'Double-digits, 3×-7×, simple ÷',
    ops: ['add', 'sub', 'mul', 'div']
  },
  {
    stage: 4,
    name: 'Champion Fortress',
    icon: '🏆',
    desc: 'Multiplication to 12, division to 144',
    ops: ['add', 'sub', 'mul', 'div']
  },
  {
    stage: 5,
    name: 'Wizard Peak',
    icon: '💎',
    desc: 'Advanced mental arithmetic',
    ops: ['add', 'sub', 'mul', 'div']
  },
  {
    stage: 6,
    name: 'Mythic Realm',
    icon: '👑',
    desc: 'Grandmaster arithmetic mastery',
    ops: ['add', 'sub', 'mul', 'div']
  }
];

export const LEVEL_TITLES = [
  '',
  'Apprentice',
  'Explorer',
  'Adventurer',
  'Champion',
  'Master',
  'Grandmaster',
  'Mythic Hero',
  'Legend'
];

export class MathBlastGame {
  constructor(stateRef) {
    this.state = stateRef;
  }

  /* ---------------------------------------------------------------- */
  /*  Stage Adventure Rules                                           */
  /* ---------------------------------------------------------------- */

  getStageQuestionsTotal() {
    return 10;
  }

  getStagePassThreshold() {
    return 0.80; // 80%
  }

  isStageCleared(correctCount, totalQuestions) {
    return totalQuestions > 0 && (correctCount / totalQuestions) >= this.getStagePassThreshold();
  }

  getStarsForAccuracy(accuracy) {
    if (accuracy >= 90) return 3;
    if (accuracy >= 70) return 2;
    if (accuracy >= 50) return 1;
    return 0;
  }

  /* ---------------------------------------------------------------- */
  /*  Level Quest Rules                                               */
  /* ---------------------------------------------------------------- */

  getLevelQuestionsTotal() {
    return 20;
  }

  getLevelPassThreshold() {
    return 0.80; // 80%
  }

  isLevelCleared(correctCount, totalQuestions) {
    return totalQuestions > 0 && (correctCount / totalQuestions) >= this.getLevelPassThreshold();
  }

  /* ---------------------------------------------------------------- */
  /*  Scoring                                                         */
  /* ---------------------------------------------------------------- */

  computeScore(points, streakMultiplier, bonusSeconds = 0) {
    return Math.floor(points * streakMultiplier) + (bonusSeconds * 2);
  }
}