/**
 * Math Blast! — Difficulty Configuration
 *
 * Centralized configuration for number ranges per difficulty preset and
 * operation. Edit these values to control game difficulty without touching
 * game logic. Each operation defines min/max bounds for both operands.
 *
 * The `custom` preset is meant to be overridden by the user via the
 * configuration UI; its defaults are shown here.
 */
export const DIFFICULTY_PRESETS = {
  easy: {
    label: 'Easy',
    icon: '🌱',
    desc: 'Single-digit + & −',
    operations: ['add', 'sub'],
    ranges: {
      add: { a: { min: 1, max: 9 }, b: { min: 1, max: 9 } },
      sub: { a: { min: 2, max: 10 }, b: { min: 1, max: 9 } },
      mul: { a: { min: 1, max: 5 }, b: { min: 1, max: 5 } },
      div: { a: { min: 1, max: 25 }, b: { min: 1, max: 5 } }
    }
  },
  medium: {
    label: 'Medium',
    icon: '⚡',
    desc: 'Up to 20 with +, − & ×',
    operations: ['add', 'sub', 'mul'],
    ranges: {
      add: { a: { min: 3, max: 20 }, b: { min: 2, max: 20 } },
      sub: { a: { min: 9, max: 30 }, b: { min: 2, max: 28 } },
      mul: { a: { min: 2, max: 10 }, b: { min: 2, max: 10 } },
      div: { a: { min: 4, max: 100 }, b: { min: 2, max: 10 } }
    }
  },
  hard: {
    label: 'Hard',
    icon: '🏆',
    desc: 'Up to 100 with +, −, × & ÷',
    operations: ['add', 'sub', 'mul', 'div'],
    ranges: {
      add: { a: { min: 15, max: 100 }, b: { min: 10, max: 90 } },
      sub: { a: { min: 25, max: 100 }, b: { min: 10, max: 90 } },
      mul: { a: { min: 6, max: 12 }, b: { min: 4, max: 12 } },
      div: { a: { min: 36, max: 144 }, b: { min: 4, max: 12 } }
    }
  },
  custom: {
    label: 'Custom',
    icon: '⚙️',
    desc: 'Pick your own math rules!',
    operations: ['add', 'sub', 'mul', 'div'],
    ranges: {
      add: { a: { min: 1, max: 99 }, b: { min: 1, max: 99 } },
      sub: { a: { min: 2, max: 99 }, b: { min: 1, max: 98 } },
      mul: { a: { min: 1, max: 12 }, b: { min: 1, max: 12 } },
      div: { a: { min: 1, max: 144 }, b: { min: 1, max: 12 } }
    }
  }
};

/**
 * Default custom range overrides. These can be changed by the user through
 * the configuration screen to fine-tune difficulty.
 */
export const DEFAULT_CUSTOM_RANGES = {
  add: { a: { min: 1, max: 99 }, b: { min: 1, max: 99 } },
  sub: { a: { min: 2, max: 99 }, b: { min: 1, max: 98 } },
  mul: { a: { min: 1, max: 12 }, b: { min: 1, max: 12 } },
  div: { a: { min: 1, max: 144 }, b: { min: 1, max: 12 } }
};

/**
 * Get the effective range config for a given preset and operation.
 * Falls back to custom defaults if the preset or operation is missing.
 */
export function getRangeConfig(preset, op) {
  const presetConfig = DIFFICULTY_PRESETS[preset] || DIFFICULTY_PRESETS.custom;
  return presetConfig.ranges[op] || DEFAULT_CUSTOM_RANGES[op] || { a: { min: 1, max: 9 }, b: { min: 1, max: 9 } };
}

/**
 * Get the list of enabled operations for a preset.
 */
export function getOperationsForPreset(preset) {
  const presetConfig = DIFFICULTY_PRESETS[preset] || DIFFICULTY_PRESETS.easy;
  return [...presetConfig.operations];
}

/**
 * Get preset metadata (label, icon, description).
 */
export function getPresetMeta(preset) {
  const presetConfig = DIFFICULTY_PRESETS[preset] || DIFFICULTY_PRESETS.easy;
  return {
    label: presetConfig.label,
    icon: presetConfig.icon,
    desc: presetConfig.desc
  };
}