/**
 * theory.js - Educational Music Theory, Scales, Intervals, and Drill Engine
 * Compatible with both browser environments (window.MusicTheory) and Node.js.
 */

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.MusicTheory = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {

  const NOTE_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const NOTE_NAMES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

  const NOTE_OFFSETS = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11
  };

  const INTERVAL_NAMES = {
    0: "Unison",
    1: "Minor 2nd (Half Step)",
    2: "Major 2nd (Whole Step)",
    3: "Minor 3rd",
    4: "Major 3rd",
    5: "Perfect 4th",
    6: "Tritone (Dim 5th / Aug 4th)",
    7: "Perfect 5th",
    8: "Minor 6th",
    9: "Major 6th",
    10: "Minor 7th",
    11: "Major 7th",
    12: "Octave"
  };

  const SCALE_FORMULAS = {
    major: {
      name: "Major (Ionian)",
      intervals: [0, 2, 4, 5, 7, 9, 11, 12],
      description: "Bright and uplifting; the bedrock foundation of Western music harmony.",
      rhFinger: [1, 2, 3, 1, 2, 3, 4, 5],
      lhFinger: [5, 4, 3, 2, 1, 3, 2, 1]
    },
    natural_minor: {
      name: "Natural Minor (Aeolian)",
      intervals: [0, 2, 3, 5, 7, 8, 10, 12],
      description: "Somber, melancholic, and introspective mood.",
      rhFinger: [1, 2, 3, 1, 2, 3, 4, 5],
      lhFinger: [5, 4, 3, 2, 1, 3, 2, 1]
    },
    harmonic_minor: {
      name: "Harmonic Minor",
      intervals: [0, 2, 3, 5, 7, 8, 11, 12],
      description: "Distinctive augmented 2nd skip (flat 6 to natural 7) giving classical tension.",
      rhFinger: [1, 2, 3, 1, 2, 3, 4, 5],
      lhFinger: [5, 4, 3, 2, 1, 3, 2, 1]
    },
    major_pentatonic: {
      name: "Major Pentatonic",
      intervals: [0, 2, 4, 7, 9, 12],
      description: "5-note scale without half steps; melodious, folk, gospel, and country staple.",
      rhFinger: [1, 2, 3, 1, 2, 3],
      lhFinger: [5, 4, 3, 2, 1, 1]
    },
    minor_pentatonic: {
      name: "Minor Pentatonic",
      intervals: [0, 3, 5, 7, 10, 12],
      description: "Essential rock, blues, and pop soloing framework.",
      rhFinger: [1, 2, 3, 4, 5, 5],
      lhFinger: [5, 4, 3, 2, 1, 1]
    },
    blues: {
      name: "Blues Scale",
      intervals: [0, 3, 5, 6, 7, 10, 12],
      description: "Minor pentatonic with the expressive chromatic 'blue note' (flat 5th).",
      rhFinger: [1, 2, 3, 4, 4, 5, 5],
      lhFinger: [5, 4, 3, 2, 2, 1, 1]
    },
    dorian: {
      name: "Dorian Mode",
      intervals: [0, 2, 3, 5, 7, 9, 10, 12],
      description: "Minor scale with a raised 6th degree; hallmark of medieval folk and modal jazz.",
      rhFinger: [1, 2, 3, 1, 2, 3, 4, 5],
      lhFinger: [5, 4, 3, 2, 1, 3, 2, 1]
    },
    mixolydian: {
      name: "Mixolydian Mode",
      intervals: [0, 2, 4, 5, 7, 9, 10, 12],
      description: "Major scale with a lowered flat-7th; staple of rock, blues and Celtic tunes.",
      rhFinger: [1, 2, 3, 1, 2, 3, 4, 5],
      lhFinger: [5, 4, 3, 2, 1, 3, 2, 1]
    }
  };

  const CHORD_TYPES = {
    "major": { name: "Major", intervals: [0, 4, 7], symbol: "" },
    "minor": { name: "Minor", intervals: [0, 3, 7], symbol: "m" },
    "diminished": { name: "Diminished", intervals: [0, 3, 6], symbol: "dim" },
    "augmented": { name: "Augmented", intervals: [0, 4, 8], symbol: "aug" },
    "sus4": { name: "Suspended 4th", intervals: [0, 5, 7], symbol: "sus4" },
    "sus2": { name: "Suspended 2nd", intervals: [0, 2, 7], symbol: "sus2" },
    "dom7": { name: "Dominant 7th", intervals: [0, 4, 7, 10], symbol: "7" },
    "maj7": { name: "Major 7th", intervals: [0, 4, 7, 11], symbol: "maj7" },
    "min7": { name: "Minor 7th", intervals: [0, 3, 7, 10], symbol: "m7" }
  };

  // Diatonic letter steps for staff geometry
  const DIATONIC_BASE = { 'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6 };

  function pitchToMidi(pitchStr) {
    if (!pitchStr || pitchStr === "-") return null;
    const clean = pitchStr.trim();
    const match = clean.match(/^([A-G])([#b]?)([0-8])$/);
    if (!match) return null;
    const letter = match[1];
    const acc = match[2] || "";
    const oct = parseInt(match[3], 10);
    const key = letter + acc;
    const semi = NOTE_OFFSETS[key];
    if (semi === undefined) return null;
    return (oct + 1) * 12 + semi;
  }

  function midiToPitch(midiNum, useFlat = false) {
    if (typeof midiNum !== "number" || isNaN(midiNum) || midiNum < 12 || midiNum > 127) return null;
    const oct = Math.floor(midiNum / 12) - 1;
    const semi = midiNum % 12;
    const names = useFlat ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP;
    return `${names[semi]}${oct}`;
  }

  function midiToFreq(midiNum) {
    if (typeof midiNum !== "number" || isNaN(midiNum)) return 0;
    return 440 * Math.pow(2, (midiNum - 69) / 12);
  }

  function pitchToFreq(pitchStr) {
    const midi = pitchToMidi(pitchStr);
    return midi !== null ? midiToFreq(midi) : null;
  }

  function getDiatonicStep(pitchStr) {
    if (!pitchStr || pitchStr === "-") return null;
    const clean = pitchStr.trim();
    const match = clean.match(/^([A-G])([#b]?)([0-8])$/);
    if (!match) return null;
    const letter = match[1];
    const oct = parseInt(match[3], 10);
    return (oct - 4) * 7 + DIATONIC_BASE[letter];
  }

  function areEnharmonicEquivalent(pitchA, pitchB) {
    const midiA = pitchToMidi(pitchA);
    const midiB = pitchToMidi(pitchB);
    return midiA !== null && midiB !== null && midiA === midiB;
  }

  function generateScale(rootPitch, scaleType = "major", octave = 4) {
    const rootSemi = NOTE_OFFSETS[rootPitch];
    if (rootSemi === undefined) return null;
    const formula = SCALE_FORMULAS[scaleType] || SCALE_FORMULAS.major;

    const baseMidi = (octave + 1) * 12 + rootSemi;
    const useFlat = rootPitch.includes("b") || ["F", "Bb", "Eb", "Ab", "Db"].includes(rootPitch);

    const notes = formula.intervals.map((interval, idx) => {
      const noteMidi = baseMidi + interval;
      const pitch = midiToPitch(noteMidi, useFlat);
      return {
        step: idx + 1,
        midi: noteMidi,
        pitch: pitch,
        freq: midiToFreq(noteMidi),
        rhFinger: formula.rhFinger[idx] || 1,
        lhFinger: formula.lhFinger[idx] || 5
      };
    });

    return {
      root: rootPitch,
      scaleType: scaleType,
      name: `${rootPitch} ${formula.name}`,
      description: formula.description,
      notes: notes
    };
  }

  function generateChord(rootPitch, chordType = "major", octave = 4, inversion = 0) {
    const rootSemi = NOTE_OFFSETS[rootPitch];
    if (rootSemi === undefined) return null;
    const typeDef = CHORD_TYPES[chordType] || CHORD_TYPES.major;

    const baseMidi = (octave + 1) * 12 + rootSemi;
    const useFlat = rootPitch.includes("b") || ["F", "Bb", "Eb", "Ab"].includes(rootPitch);

    let midiNotes = typeDef.intervals.map(intVal => baseMidi + intVal);

    // Apply inversion: shift bottom notes up an octave
    for (let inv = 0; inv < inversion && inv < midiNotes.length; inv++) {
      midiNotes[inv] += 12;
    }
    midiNotes.sort((a, b) => a - b);

    const pitchArray = midiNotes.map(m => midiToPitch(m, useFlat));

    let invLabel = "Root Position";
    if (inversion === 1) invLabel = "1st Inversion";
    if (inversion === 2) invLabel = "2nd Inversion";
    if (inversion === 3) invLabel = "3rd Inversion";

    return {
      root: rootPitch,
      chordType: chordType,
      fullName: `${rootPitch}${typeDef.symbol} (${invLabel})`,
      inversion: inversion,
      inversionLabel: invLabel,
      midiNotes: midiNotes,
      pitches: pitchArray,
      freqs: midiNotes.map(midiToFreq)
    };
  }

  function getInterval(pitch1, pitch2) {
    const m1 = pitchToMidi(pitch1);
    const m2 = pitchToMidi(pitch2);
    if (m1 === null || m2 === null) return null;
    const semitones = Math.abs(m2 - m1);
    let name = INTERVAL_NAMES[semitones];
    if (!name) {
      const mod = semitones % 12;
      if (mod === 0) {
        name = `${Math.floor(semitones / 12)} Octaves`;
      } else {
        name = INTERVAL_NAMES[mod] ? `${INTERVAL_NAMES[mod]} (+${Math.floor(semitones / 12)} oct)` : `${semitones} semitones`;
      }
    }
    return {
      semitones: semitones,
      name: name,
      octaves: Math.floor(semitones / 12)
    };
  }

  // Sight Reading Flashcard Generator
  const FLASHCARD_PRESETS = {
    treble_basic: {
      name: "Treble Clef Primer (C4 – G5)",
      clef: "treble",
      pitches: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5"]
    },
    bass_basic: {
      name: "Bass Clef Primer (C3 – C4)",
      clef: "bass",
      pitches: ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4"]
    },
    grand_staff: {
      name: "Grand Staff (Bass & Treble)",
      clef: "grand",
      pitches: ["F2", "G2", "A2", "B2", "C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5"]
    },
    accidentals: {
      name: "Black Keys & Accidentals (♯ / ♭)",
      clef: "treble",
      pitches: ["C#4", "D#4", "F#4", "G#4", "A#4", "Db4", "Eb4", "Gb4", "Ab4", "Bb4", "C#5", "D#5", "F#5"]
    },
    ledger_lines: {
      name: "Ledger Line Master (High & Low Extremes)",
      clef: "grand",
      pitches: ["C2", "D2", "E2", "F2", "A5", "B5", "C6", "D6"]
    }
  };

  function getRandomFlashcard(presetKey = "treble_basic", excludePitch = null) {
    const preset = FLASHCARD_PRESETS[presetKey] || FLASHCARD_PRESETS.treble_basic;
    let pool = preset.pitches;
    if (excludePitch && pool.length > 1) {
      pool = pool.filter(p => p !== excludePitch);
    }
    const randomIndex = Math.floor(Math.random() * pool.length);
    const targetPitch = pool[randomIndex];
    const midi = pitchToMidi(targetPitch);

    let clef = preset.clef;
    if (clef === "grand") {
      // Notes >= C4 drawn in treble, notes < C4 drawn in bass
      clef = midi >= 60 ? "treble" : "bass";
    }

    // Determine distractor multiple-choice options
    const allNoteLetters = ["C", "D", "E", "F", "G", "A", "B"];
    const targetLetter = targetPitch.replace(/[0-9]/g, "");
    const distractors = allNoteLetters
      .filter(l => l !== targetLetter)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const options = [targetLetter, ...distractors].sort(() => 0.5 - Math.random());

    return {
      pitch: targetPitch,
      noteLetter: targetLetter,
      clef: clef,
      midi: midi,
      freq: midiToFreq(midi),
      diatonicStep: getDiatonicStep(targetPitch),
      options: options,
      presetName: preset.name
    };
  }

  // Ear Training Quiz Generator
  function generateEarTrainingChallenge(type = "pitch_match") {
    if (type === "pitch_match") {
      const pitches = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
      const target = pitches[Math.floor(Math.random() * pitches.length)];
      return {
        type: "pitch_match",
        prompt: "Listen to the note and play it back!",
        targetPitch: target,
        midi: pitchToMidi(target),
        freq: pitchToFreq(target)
      };
    } else if (type === "interval_recognition") {
      const rootPitches = ["C4", "D4", "E4", "F4", "G4"];
      const testIntervals = [
        { semitones: 2, label: "Major 2nd" },
        { semitones: 4, label: "Major 3rd" },
        { semitones: 5, label: "Perfect 4th" },
        { semitones: 7, label: "Perfect 5th" },
        { semitones: 12, label: "Octave" }
      ];
      const root = rootPitches[Math.floor(Math.random() * rootPitches.length)];
      const chosenInterval = testIntervals[Math.floor(Math.random() * testIntervals.length)];
      const rootMidi = pitchToMidi(root);
      const targetMidi = rootMidi + chosenInterval.semitones;

      const distractors = testIntervals
        .filter(i => i.label !== chosenInterval.label)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(i => i.label);

      const options = [chosenInterval.label, ...distractors].sort(() => 0.5 - Math.random());

      return {
        type: "interval_recognition",
        prompt: "Listen to the two notes. Which interval is it?",
        rootPitch: root,
        rootMidi: rootMidi,
        targetPitch: midiToPitch(targetMidi),
        targetMidi: targetMidi,
        correctInterval: chosenInterval.label,
        options: options
      };
    } else if (type === "chord_quality") {
      const roots = ["C4", "D4", "E4", "F4", "G4", "A4"];
      const qualities = ["major", "minor"];
      const root = roots[Math.floor(Math.random() * roots.length)];
      const quality = qualities[Math.floor(Math.random() * qualities.length)];
      const chord = generateChord(root.replace("4", ""), quality, 4);

      return {
        type: "chord_quality",
        prompt: "Listen to the triad. Is it Major or Minor?",
        chord: chord,
        correctQuality: quality === "major" ? "Major Triad" : "Minor Triad",
        options: ["Major Triad", "Minor Triad"]
      };
    }
  }

  // Circle of Fifths Key Signatures Reference
  const CIRCLE_OF_FIFTHS = [
    { key: "C", sharps: 0, flats: 0, relativeMinor: "Am", accidentalsList: [] },
    { key: "G", sharps: 1, flats: 0, relativeMinor: "Em", accidentalsList: ["F#"] },
    { key: "D", sharps: 2, flats: 0, relativeMinor: "Bm", accidentalsList: ["F#", "C#"] },
    { key: "A", sharps: 3, flats: 0, relativeMinor: "F#m", accidentalsList: ["F#", "C#", "G#"] },
    { key: "E", sharps: 4, flats: 0, relativeMinor: "C#m", accidentalsList: ["F#", "C#", "G#", "D#"] },
    { key: "B", sharps: 5, flats: 0, relativeMinor: "G#m", accidentalsList: ["F#", "C#", "G#", "D#", "A#"] },
    { key: "F#", sharps: 6, flats: 0, relativeMinor: "D#m", accidentalsList: ["F#", "C#", "G#", "D#", "A#", "E#"] },
    { key: "Db", sharps: 0, flats: 5, relativeMinor: "Bbm", accidentalsList: ["Bb", "Eb", "Ab", "Db", "Gb"] },
    { key: "Ab", sharps: 0, flats: 4, relativeMinor: "Fm", accidentalsList: ["Bb", "Eb", "Ab", "Db"] },
    { key: "Eb", sharps: 0, flats: 3, relativeMinor: "Cm", accidentalsList: ["Bb", "Eb", "Ab"] },
    { key: "Bb", sharps: 0, flats: 2, relativeMinor: "Gm", accidentalsList: ["Bb", "Eb"] },
    { key: "F", sharps: 0, flats: 1, relativeMinor: "Dm", accidentalsList: ["Bb"] }
  ];

  return {
    NOTE_NAMES_SHARP,
    NOTE_NAMES_FLAT,
    NOTE_OFFSETS,
    INTERVAL_NAMES,
    SCALE_FORMULAS,
    CHORD_TYPES,
    CIRCLE_OF_FIFTHS,
    FLASHCARD_PRESETS,
    pitchToMidi,
    midiToPitch,
    midiToFreq,
    pitchToFreq,
    getDiatonicStep,
    areEnharmonicEquivalent,
    generateScale,
    generateChord,
    getInterval,
    getRandomFlashcard,
    generateEarTrainingChallenge
  };
});
