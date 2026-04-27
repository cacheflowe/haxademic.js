/**
 * Shared music theory constants for web audio demos.
 *
 * SCALES — ordered dark (0) → bright (7), suitable for mood-indexed access:
 *   const [name, intervals] = SCALES_ORDERED[Math.floor(mood * SCALES_ORDERED.length)];
 *
 * Each scale is an array of semitone offsets from the root (0–11).
 */

export const SCALES = {
  Phrygian: [0, 1, 3, 5, 7, 8, 10],
  Blues: [0, 3, 5, 6, 7, 10],
  Minor: [0, 2, 3, 5, 7, 8, 10],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Pent_Minor: [0, 3, 5, 7, 10],
  Pent_Major: [0, 2, 4, 7, 9],
  Major: [0, 2, 4, 5, 7, 9, 11],
  Lydian: [0, 2, 4, 6, 7, 9, 11],
};

/** Array of [name, intervals] pairs, same dark→bright order as SCALES. */
export const SCALES_ORDERED = Object.entries(SCALES);

/** Chromatic note names, index 0 = C. */
export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/**
 * 16-step trigger probability weights (0–1).
 * Higher values on downbeats; index 0 = step 1 (beat 1).
 */
export const STEP_WEIGHTS = [0.95, 0.35, 0.65, 0.25, 0.8, 0.3, 0.6, 0.7, 0.85, 0.35, 0.65, 0.25, 0.75, 0.4, 0.65, 0.55];

/**
 * Returns midi note numbers for all notes in a scale within [minMidi, maxMidi].
 *
 * @param {number} rootMidi  Root note as MIDI (e.g. 29 = F1)
 * @param {string} scaleName Key of SCALES
 * @param {number} minMidi
 * @param {number} maxMidi
 * @returns {number[]}
 */
export function scaleNotesInRange(rootMidi, scaleName, minMidi, maxMidi) {
  const intervals = new Set(SCALES[scaleName]);
  const notes = [];
  for (let midi = minMidi; midi <= maxMidi; midi++) {
    if (intervals.has((((midi - rootMidi) % 12) + 12) % 12)) notes.push(midi);
  }
  return notes;
}

/**
 * Returns [[label, midi], ...] pairs for use in <select> options.
 *
 * @param {number} rootMidi
 * @param {string} scaleName
 * @param {number} minMidi
 * @param {number} maxMidi
 * @returns {Array<[string, number]>}
 */
export function scaleNoteOptions(rootMidi, scaleName, minMidi, maxMidi) {
  return scaleNotesInRange(rootMidi, scaleName, minMidi, maxMidi).map((midi) => [
    `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`,
    midi,
  ]);
}

/**
 * Builds a chord by stacking every-other scale degree starting from rootMidi.
 *
 * @param {number} rootMidi  Root note of chord (not bass root)
 * @param {string} scaleName
 * @param {number} size      Number of voices
 * @returns {number[]}       Array of MIDI note numbers
 */
export function buildChordFromScale(rootMidi, scaleName, size) {
  const intervals = SCALES[scaleName];
  const chord = [];
  for (let i = 0; i < size; i++) {
    const degreeIdx = (i * 2) % intervals.length;
    const octaveOffset = Math.floor((i * 2) / intervals.length) * 12;
    chord.push(rootMidi + intervals[degreeIdx] + octaveOffset);
  }
  return chord;
}

/**
 * Oscillator types ordered dark (0) → bright (7) for mood-mapped synth character.
 * Pairs with SCALES_ORDERED for generative music mood sequencing.
 * Square (dark, hollow) → sawtooth (bright, brassy) → sine (bright, pure).
 */
export const LEAD_OSC_TYPES = ["square", "square", "sawtooth", "sawtooth", "triangle", "triangle", "sine", "sine"];
