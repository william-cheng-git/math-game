/**
 * MathEngine — Question Generator & Difficulty Tiers
 *
 * Generates arithmetic questions based on the configured difficulty preset
 * and number ranges (see config.js). Supports Stage Adventure mode (constant
 * difficulty within a stage) and Time Rush / Level Quest modes (adaptive by level).
 */
import { getRangeConfig, getOperationsForPreset, getPresetMeta } from '../config.js';

export class MathEngine {
  constructor(stateRef) {
    this.state = stateRef;
  }

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /* ------------------------------------------------------------------ */
  /*  Stage Adventure mode questions (constant difficulty within stage) */
  /* ------------------------------------------------------------------ */

  generateStageQuestion(stageNum) {
    const stageDef = this.state.STAGE_DEFINITIONS
      ? this.state.STAGE_DEFINITIONS.find(d => d.stage === stageNum)
      : null;
    const fallback = { stage: stageNum, name: `Stage ${stageNum}`, icon: '🗺️', desc: 'Math challenge', ops: ['add', 'sub'] };
    const def = stageDef || fallback;

    // Determine available operations (intersect stage ops with user-selected ops)
    let availableOps = def.ops.slice();
    if (this.state.operations && this.state.operations.length > 0) {
      const intersection = def.ops.filter(op => this.state.operations.includes(op));
      if (intersection.length > 0) availableOps = intersection;
    }
    const op = availableOps[Math.floor(Math.random() * availableOps.length)];

    let a = 0, b = 0, answer = 0, symbol = '+';
    let tier = stageNum;
    let tierName = `Stage ${stageNum}: ${def.name}`;
    let bonusSeconds = Math.min(5, stageNum);
    let basePoints = stageNum * 15;

    if (op === 'add') {
      symbol = '+';
      const ranges = this._stageAddRanges(stageNum);
      a = this.randomInt(ranges.a.min, ranges.a.max);
      b = this.randomInt(ranges.b.min, ranges.b.max);
      answer = a + b;
    } else if (op === 'sub') {
      symbol = '−';
      const ranges = this._stageSubRanges(stageNum);
      a = this.randomInt(ranges.a.min, ranges.a.max);
      b = this.randomInt(ranges.b.min, Math.max(ranges.b.min, a - ranges.b.padding || 1));
      answer = a - b;
    } else if (op === 'mul') {
      symbol = '×';
      const ranges = this._stageMulRanges(stageNum);
      a = this.randomInt(ranges.a.min, ranges.a.max);
      b = this.randomInt(ranges.b.min, ranges.b.max);
      answer = a * b;
    } else if (op === 'div') {
      symbol = '÷';
      const quotient = this._stageDivQuotient(stageNum);
      b = this._stageDivisor(stageNum);
      answer = quotient;
      a = b * quotient;
    }

    return { a, b, op, symbol, answer, tier, tierName, bonusSeconds, basePoints };
  }

  _stageAddRanges(stageNum) {
    if (stageNum === 1) return { a: { min: 1, max: 6 }, b: { min: 1, max: 5 } };
    if (stageNum === 2) return { a: { min: 5, max: 16 }, b: { min: 4, max: 9 } };
    if (stageNum === 3) return { a: { min: 15, max: 38 }, b: { min: 12, max: 30 } };
    if (stageNum === 4) return { a: { min: 30, max: 75 }, b: { min: 25, max: 65 } };
    if (stageNum === 5) return { a: { min: 55, max: 125 }, b: { min: 45, max: 95 } };
    return { a: { min: 90, max: 250 }, b: { min: 70, max: 200 } };
  }

  _stageSubRanges(stageNum) {
    if (stageNum === 1) return { a: { min: 2, max: 10 }, b: { min: 1, max: 10 }, padding: 1 };
    if (stageNum === 2) return { a: { min: 11, max: 20 }, b: { min: 3, max: 19 }, padding: 1 };
    if (stageNum === 3) return { a: { min: 25, max: 55 }, b: { min: 10, max: 53 }, padding: 2 };
    if (stageNum === 4) return { a: { min: 50, max: 95 }, b: { min: 20, max: 90 }, padding: 5 };
    if (stageNum === 5) return { a: { min: 80, max: 160 }, b: { min: 35, max: 150 }, padding: 10 };
    return { a: { min: 150, max: 350 }, b: { min: 50, max: 330 }, padding: 20 };
  }

  _stageMulRanges(stageNum) {
    if (stageNum === 2) return { a: { min: 2, max: 10 }, b: { min: 2, max: 9 } };
    if (stageNum === 3) return { a: { min: 3, max: 7 }, b: { min: 3, max: 8 } };
    if (stageNum === 4) return { a: { min: 6, max: 12 }, b: { min: 4, max: 12 } };
    if (stageNum === 5) return { a: { min: 8, max: 15 }, b: { min: 6, max: 13 } };
    return { a: { min: 9, max: 18 }, b: { min: 7, max: 16 } };
  }

  _stageDivQuotient(stageNum) {
    if (stageNum === 3) return this.randomInt(2, 8);
    if (stageNum === 4) return this.randomInt(4, 12);
    if (stageNum === 5) return this.randomInt(6, 14);
    return this.randomInt(8, 16);
  }

  _stageDivisor(stageNum) {
    if (stageNum === 3) return this.randomInt(2, 7);
    if (stageNum === 4) return this.randomInt(4, 12);
    if (stageNum === 5) return this.randomInt(6, 14);
    return this.randomInt(7, 16);
  }

  /* ------------------------------------------------------------------ */
  /*  Time Rush / Level Quest questions (config-driven ranges)          */
  /* ------------------------------------------------------------------ */

  generateQuestion() {
    let activeOps = this.state.operations.slice();
    if (!activeOps || activeOps.length === 0) activeOps = ['add'];
    const op = activeOps[Math.floor(Math.random() * activeOps.length)];

    const preset = this.state.preset;
    const lvl = this.state.playerLevel || 1;

    // Use runtime custom ranges if preset is "custom" and customRanges exist in state
    let rangeCfg;
    if (preset === 'custom' && this.state.customRanges) {
      rangeCfg = this.state.customRanges[op];
    } else {
      rangeCfg = getRangeConfig(preset, op);
    }

    let a = 0, b = 0, answer = 0, symbol = '+';
    let tier = 1;
    let tierName = 'Level 1';
    let bonusSeconds = 1;
    let basePoints = 10;

    // Determine tier based on level (1-5 scale)
    tier = Math.min(5, Math.max(1, Math.ceil(lvl / 1)));
    bonusSeconds = Math.min(5, tier);
    basePoints = tier * 10 + 5;

    if (op === 'add') {
      symbol = '+';
      a = this.randomInt(rangeCfg.a.min, rangeCfg.a.max);
      b = this.randomInt(rangeCfg.b.min, rangeCfg.b.max);
      answer = a + b;
      tierName = `Level ${lvl} (Addition)`;
    } else if (op === 'sub') {
      symbol = '−';
      a = this.randomInt(rangeCfg.a.min, rangeCfg.a.max);
      b = this.randomInt(rangeCfg.b.min, Math.max(rangeCfg.b.min, a - 1));
      answer = a - b;
      tierName = `Level ${lvl} (Subtraction)`;
    } else if (op === 'mul') {
      symbol = '×';
      a = this.randomInt(rangeCfg.a.min, rangeCfg.a.max);
      b = this.randomInt(rangeCfg.b.min, rangeCfg.b.max);
      answer = a * b;
      tierName = `Level ${lvl} (Multiplication)`;
    } else if (op === 'div') {
      symbol = '÷';
      // Exact integer division: pick a divisor and quotient within range
      b = this.randomInt(Math.max(1, rangeCfg.b.min), Math.max(1, rangeCfg.b.max));
      const maxQuotient = Math.max(1, Math.floor(rangeCfg.a.max / b));
      const minQuotient = Math.max(1, Math.ceil(rangeCfg.a.min / b));
      const quotient = this.randomInt(minQuotient, maxQuotient);
      answer = quotient;
      a = b * quotient;
      tierName = `Level ${lvl} (Division)`;
    }

    // Scale points by tier
    basePoints = Math.max(basePoints, tier * 15);

    return { a, b, op, symbol, answer, tier, tierName, bonusSeconds, basePoints };
  }