/**
 * SoundFX — Web Audio API Synthesis Engine
 *
 * Generates all sound effects procedurally. Zero external audio assets,
 * works 100% offline without CORS or 404 issues.
 */
export class SoundFX {
  constructor(stateRef) {
    this.state = stateRef;
    this.audioCtx = null;
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.2, startTimeOffset = 0) {
    if (!this.state.soundEnabled) return;
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
  }

  playTap() {
    this.playTone(520, 'sine', 0.05, 0.12);
  }

  playCorrect(tier = 1) {
    if (!this.state.soundEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.16, 0.22, idx * 0.06);
    });

    if (tier >= 3) {
      setTimeout(() => {
        this.playTone(1318.51, 'sine', 0.25, 0.2, 0); // E6
        this.playTone(1567.98, 'sine', 0.35, 0.25, 0.08); // G6
      }, 180);
    }
  }

  playBonusTime() {
    if (!this.state.soundEnabled) return;
    const freqs = [880, 1108.73, 1318.51, 1760];
    freqs.forEach((f, i) => {
      this.playTone(f, 'sine', 0.18, 0.18, i * 0.05);
    });
  }

  playIncorrect() {
    if (!this.state.soundEnabled) return;
    this.playTone(329.63, 'sine', 0.14, 0.18, 0); // E4
    this.playTone(293.66, 'sine', 0.22, 0.16, 0.1); // D4
  }

  playStreak() {
    if (!this.state.soundEnabled) return;
    const freqs = [587.33, 739.99, 880, 1174.66];
    freqs.forEach((f, i) => {
      this.playTone(f, 'triangle', 0.2, 0.25, i * 0.08);
    });
  }

  playLevelUp() {
    if (!this.state.soundEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.26, 0.26, idx * 0.08);
    });
    setTimeout(() => {
      this.playTone(1567.98, 'sine', 0.42, 0.22, 0); // G6 shimmer
    }, 420);
  }

  playStreakMilestone(milestone) {
    if (!this.state.soundEnabled) return;
    if (milestone >= 50) {
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
      notes.forEach((freq, idx) => {
        this.playTone(freq, 'triangle', 0.28, 0.28, idx * 0.07);
      });
    } else {
      const notes = [587.33, 739.99, 880, 1174.66, 1479.98];
      notes.forEach((freq, idx) => {
        this.playTone(freq, 'triangle', 0.22, 0.25, idx * 0.07);
      });
    }
  }

  playHighScoreFanfare() {
    if (!this.state.soundEnabled) return;
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
  }

  playTimerTick() {
    if (!this.state.soundEnabled) return;
    this.playTone(800, 'sine', 0.04, 0.08);
  }

  playRoundOver() {
    if (!this.state.soundEnabled) return;
    this.playTone(659.25, 'triangle', 0.2, 0.2, 0);
    this.playTone(523.25, 'triangle', 0.4, 0.25, 0.15);
  }

  playFailure() {
    if (!this.state.soundEnabled) return;
    this.playTone(349.23, 'sine', 0.3, 0.2, 0);  // F4
    this.playTone(329.63, 'sine', 0.3, 0.18, 0.15); // E4
    this.playTone(293.66, 'sine', 0.5, 0.16, 0.3);  // D4
  }

  playCongrats() {
    if (!this.state.soundEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.24, 0.26, idx * 0.07);
    });
    setTimeout(() => {
      this.playTone(2093.00, 'sine', 0.5, 0.22, 0); // C7 shimmer
    }, 450);
  }
}