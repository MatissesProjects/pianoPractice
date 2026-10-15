/**
 * theory.js - Educational Music Theory, Scales, Intervals, and Drill Engine
 * Compatible with both browser environments (window.MusicTheory) and Node.js.
 */

(function (root, factory) {
  const exp = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = exp;
  }
  if (root) {
    root.MusicTheory = exp;
  }
})(typeof self !== "undefined" ? self : (typeof global !== "undefined" ? global : this), function () {

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
  const DIATONIC_LETTERS = ["C", "D", "E", "F", "G", "A", "B"];

  // Conservatory Authentic 12-Key Standard Fingerings (RH: 1=Thumb..5=Pinky, LH: 5=Pinky..1=Thumb)
  const MAJOR_SCALE_FINGERINGS = {
    "C":  { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
    "G":  { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
    "D":  { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
    "A":  { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
    "E":  { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
    "B":  { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [4, 3, 2, 1, 4, 3, 2, 1] },
    "F#": { rh: [2, 3, 4, 1, 2, 3, 1, 2], lh: [4, 3, 2, 1, 3, 2, 1, 4] },
    "Gb": { rh: [2, 3, 4, 1, 2, 3, 1, 2], lh: [4, 3, 2, 1, 3, 2, 1, 4] },
    "Db": { rh: [2, 3, 1, 2, 3, 4, 1, 2], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
    "C#": { rh: [2, 3, 1, 2, 3, 4, 1, 2], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
    "Ab": { rh: [3, 4, 1, 2, 3, 1, 2, 3], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
    "G#": { rh: [3, 4, 1, 2, 3, 1, 2, 3], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
    "Eb": { rh: [3, 1, 2, 3, 4, 1, 2, 3], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
    "D#": { rh: [3, 1, 2, 3, 4, 1, 2, 3], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
    "Bb": { rh: [4, 1, 2, 3, 1, 2, 3, 4], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
    "A#": { rh: [4, 1, 2, 3, 1, 2, 3, 4], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
    "F":  { rh: [1, 2, 3, 4, 1, 2, 3, 4], lh: [5, 4, 3, 2, 1, 3, 2, 1] }
  };

  const MINOR_SCALE_FINGERINGS = {
    "C":  { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
    "G":  { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
    "D":  { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
    "A":  { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
    "E":  { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
    "B":  { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [4, 3, 2, 1, 4, 3, 2, 1] },
    "F#": { rh: [2, 3, 1, 2, 3, 1, 2, 3], lh: [4, 3, 2, 1, 3, 2, 1, 4] },
    "Gb": { rh: [2, 3, 1, 2, 3, 1, 2, 3], lh: [4, 3, 2, 1, 3, 2, 1, 4] },
    "Db": { rh: [3, 4, 1, 2, 3, 1, 2, 3], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
    "C#": { rh: [3, 4, 1, 2, 3, 1, 2, 3], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
    "Ab": { rh: [3, 4, 1, 2, 3, 1, 2, 3], lh: [3, 2, 1, 3, 2, 1, 4, 3] },
    "G#": { rh: [3, 4, 1, 2, 3, 1, 2, 3], lh: [3, 2, 1, 3, 2, 1, 4, 3] },
    "Eb": { rh: [2, 1, 2, 3, 4, 1, 2, 3], lh: [2, 1, 4, 3, 2, 1, 3, 2] },
    "D#": { rh: [2, 1, 2, 3, 4, 1, 2, 3], lh: [2, 1, 4, 3, 2, 1, 3, 2] },
    "Bb": { rh: [2, 1, 2, 3, 1, 2, 3, 4], lh: [2, 1, 3, 2, 1, 4, 3, 2] },
    "A#": { rh: [2, 1, 2, 3, 1, 2, 3, 4], lh: [2, 1, 3, 2, 1, 4, 3, 2] },
    "F":  { rh: [1, 2, 3, 4, 1, 2, 3, 4], lh: [5, 4, 3, 2, 1, 3, 2, 1] }
  };

  function spellPitchOnLetter(targetMidi, targetLetter) {
    const naturalSemi = NOTE_OFFSETS[targetLetter];
    for (let oct = 0; oct <= 8; oct++) {
      const baseMidi = (oct + 1) * 12 + naturalSemi;
      const diff = targetMidi - baseMidi;
      if (Math.abs(diff) <= 2) {
        const acc = diff === 1 ? "#" : diff === -1 ? "b" : diff === 2 ? "##" : diff === -2 ? "bb" : "";
        return `${targetLetter}${acc}${oct}`;
      }
    }
    return midiToPitch(targetMidi, false);
  }

  function pitchToMidi(pitchStr, defaultOct = 4) {
    if (!pitchStr || pitchStr === "-") return null;
    const clean = pitchStr.trim();
    const match = clean.match(/^([A-G])([#b]?)([0-8])?$/);
    if (!match) return null;
    const letter = match[1];
    const acc = match[2] || "";
    const oct = match[3] !== undefined ? parseInt(match[3], 10) : defaultOct;
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

  function pitchToFreq(pitchStr, defaultOct = 4) {
    const midi = pitchToMidi(pitchStr, defaultOct);
    return midi !== null ? midiToFreq(midi) : null;
  }

  function getDiatonicStep(pitchStr, defaultOct = 4) {
    if (!pitchStr || pitchStr === "-") return null;
    const clean = pitchStr.trim();
    const match = clean.match(/^([A-G])([#b]?)([0-8])?$/);
    if (!match) return null;
    const letter = match[1];
    const oct = match[3] !== undefined ? parseInt(match[3], 10) : defaultOct;
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

    const isHeptatonic = formula.intervals.length === 8; // 7 degrees + octave
    const rootLetter = rootPitch.charAt(0);
    const rootLetterIdx = DIATONIC_LETTERS.indexOf(rootLetter);

    const isMinorFamily = ["natural_minor", "harmonic_minor", "dorian"].includes(scaleType);
    const keyFingers = isHeptatonic
      ? (isMinorFamily ? MINOR_SCALE_FINGERINGS[rootPitch] : MAJOR_SCALE_FINGERINGS[rootPitch])
      : null;

    const notes = formula.intervals.map((interval, idx) => {
      const noteMidi = baseMidi + interval;
      let pitch;
      if (isHeptatonic && rootLetterIdx !== -1) {
        const targetLetter = DIATONIC_LETTERS[(rootLetterIdx + idx) % 7];
        pitch = spellPitchOnLetter(noteMidi, targetLetter);
      } else {
        pitch = midiToPitch(noteMidi, useFlat);
      }
      return {
        step: idx + 1,
        midi: noteMidi,
        pitch: pitch,
        freq: midiToFreq(noteMidi),
        rhFinger: keyFingers ? keyFingers.rh[idx] : (formula.rhFinger[idx] || 1),
        lhFinger: keyFingers ? keyFingers.lh[idx] : (formula.lhFinger[idx] || 5)
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

  // ==========================================
  // ADAPTIVE SPACED-REPETITION SYSTEM (SRS)
  // ==========================================
  const SRS_STORAGE_KEY = "piano_srs_stats";

  function getSRSStorage() {
    if (typeof localStorage === "undefined") return {};
    try {
      const data = localStorage.getItem(SRS_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  function saveSRSStorage(data) {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function recordSRSAttempt(pitchOrId, isCorrect, responseTimeMs = 1500) {
    if (!pitchOrId) return;
    const stats = getSRSStorage();
    const cur = stats[pitchOrId] || { attempts: 0, errors: 0, correct: 0, avgResponseMs: 1500, streak: 0 };
    cur.attempts++;
    if (isCorrect) {
      cur.correct++;
      cur.streak++;
    } else {
      cur.errors++;
      cur.streak = 0;
    }
    const cleanTime = Math.max(200, Math.min(10000, responseTimeMs));
    cur.avgResponseMs = Math.round(cur.avgResponseMs * 0.65 + cleanTime * 0.35);
    stats[pitchOrId] = cur;
    saveSRSStorage(stats);
    return cur;
  }

  function getSRSItemStats(pitchOrId) {
    const stats = getSRSStorage();
    return stats[pitchOrId] || { attempts: 0, errors: 0, correct: 0, avgResponseMs: 1500, streak: 0 };
  }

  function getAllSRSStats() {
    return getSRSStorage();
  }

  function clearSRSStats() {
    if (typeof localStorage !== "undefined") {
      try { localStorage.removeItem(SRS_STORAGE_KEY); } catch (e) {}
    }
  }

  function getSRSMasteryLevel(pitchOrId) {
    const item = getSRSItemStats(pitchOrId);
    if (!item || item.attempts < 2) return "new"; // Not enough data
    const errorRate = item.errors / item.attempts;
    if (errorRate <= 0.15 && item.avgResponseMs < 1400 && item.streak >= 2) return "mastered";
    if (errorRate > 0.35 || item.avgResponseMs > 2000) return "needs_practice";
    return "learning";
  }

  function getRandomFlashcard(presetKey = "treble_basic", excludePitch = null, useSRS = true) {
    const preset = FLASHCARD_PRESETS[presetKey] || FLASHCARD_PRESETS.treble_basic;
    let pool = [...preset.pitches];
    if (excludePitch && pool.length > 1) {
      pool = pool.filter(p => p !== excludePitch);
    }

    let targetPitch;
    if (useSRS && pool.length > 1) {
      // Weight selection so difficult notes (needs_practice) appear 3.5x more often
      const weights = pool.map(pitch => {
        const mastery = getSRSMasteryLevel(pitch);
        if (mastery === "needs_practice") return 3.5;
        if (mastery === "new") return 2.2;
        if (mastery === "learning") return 1.8;
        return 1.0; // mastered
      });
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      let randVal = Math.random() * totalWeight;
      for (let i = 0; i < pool.length; i++) {
        randVal -= weights[i];
        if (randVal <= 0) {
          targetPitch = pool[i];
          break;
        }
      }
      if (!targetPitch) targetPitch = pool[pool.length - 1];
    } else {
      const randomIndex = Math.floor(Math.random() * pool.length);
      targetPitch = pool[randomIndex];
    }

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
      presetName: preset.name,
      srsMastery: getSRSMasteryLevel(targetPitch),
      srsStats: getSRSItemStats(targetPitch)
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

  // Multi-Level Harmony Generation Engine
  function diatonicStepToPitch(step, accidentalMap = {}) {
    if (typeof step !== "number" || isNaN(step)) return null;
    const base = ((step % 7) + 7) % 7;
    const oct = Math.floor(step / 7) + 4;
    const letter = DIATONIC_LETTERS[base];
    const acc = accidentalMap[letter] || "";
    return `${letter}${acc}${oct}`;
  }

  function detectKeyAccidentals(song) {
    const map = {};
    if (!song) return map;
    const allNotes = ((song.rh || "") + " " + (song.lh || "")).match(/[A-G][#b]?[0-8]/g) || [];
    allNotes.forEach(n => {
      const m = n.match(/^([A-G])([#b]?)/);
      if (m && m[2]) {
        map[m[1]] = m[2];
      }
    });
    return map;
  }

  function harmonizePitch(pitchStr, harmonyType = "thirds", accidentalMap = {}) {
    if (!pitchStr || pitchStr === "-") return "-";
    const subPitches = pitchStr.split("+").filter(p => p !== "-");
    if (subPitches.length === 0) return "-";
    const root = subPitches[0];
    const step = getDiatonicStep(root);
    if (step === null) return pitchStr;

    let harmPitches = [root];

    if (harmonyType === "thirds") {
      const p3 = diatonicStepToPitch(step + 2, accidentalMap);
      harmPitches = [root, p3];
    } else if (harmonyType === "thirds_below") {
      const p3b = diatonicStepToPitch(step - 2, accidentalMap);
      harmPitches = [p3b, root];
    } else if (harmonyType === "fifths") {
      const p5 = diatonicStepToPitch(step + 4, accidentalMap);
      harmPitches = [root, p5];
    } else if (harmonyType === "sixths") {
      const p6 = diatonicStepToPitch(step + 5, accidentalMap);
      harmPitches = [root, p6];
    } else if (harmonyType === "octaves") {
      const p8 = diatonicStepToPitch(step + 7, accidentalMap);
      harmPitches = [root, p8];
    } else if (harmonyType === "triads") {
      const p3 = diatonicStepToPitch(step + 2, accidentalMap);
      const p5 = diatonicStepToPitch(step + 4, accidentalMap);
      harmPitches = [root, p3, p5];
    }

    const valid = harmPitches.filter(Boolean);
    const sorted = [...new Set(valid)].sort((a, b) => {
      const mA = pitchToMidi(a) ?? 0;
      const mB = pitchToMidi(b) ?? 0;
      return mA - mB;
    });

    return sorted.join("+");
  }

  function harmonizeToken(tokenStr, harmonyType = "thirds", accidentalMap = {}, fingerStr = "1") {
    if (!tokenStr || tokenStr === "-" || tokenStr === "|") return { token: tokenStr, finger: "-" };
    const parts = tokenStr.split(":");
    const pitch = parts[0];
    const beatsPart = parts[1] ? `:${parts[1]}` : "";
    if (pitch === "-") return { token: `-${beatsPart}`, finger: "-" };

    const harmonizedPitch = harmonizePitch(pitch, harmonyType, accidentalMap);

    let finger = "1+3";
    if (harmonyType === "fifths" || harmonyType === "sixths" || harmonyType === "octaves") {
      finger = "1+5";
    } else if (harmonyType === "triads") {
      finger = "1+3+5";
    }

    return {
      token: `${harmonizedPitch}${beatsPart}`,
      finger: finger
    };
  }

  function generateSongHarmonies(song, harmonyType = "thirds") {
    if (!song) return { dyads: "", dyadsF: "" };
    if (harmonyType === "song" && song.dyads) {
      return { dyads: song.dyads, dyadsF: song.dyadsF || "" };
    }

    const accMap = detectKeyAccidentals(song);
    const rhMeasures = (song.rh || "").split("|").map(m => m.trim().split(/\s+/).filter(Boolean));
    const rhFMeasures = (song.rhF || "").split("|").map(m => m.trim().split(/\s+/).filter(Boolean));

    const dyadMeasures = [];
    const dyadFMeasures = [];

    rhMeasures.forEach((measureTokens, mIdx) => {
      const fTokens = rhFMeasures[mIdx] || [];
      const mDyad = [];
      const mDyadF = [];

      measureTokens.forEach((tok, tIdx) => {
        const res = harmonizeToken(tok, harmonyType, accMap, fTokens[tIdx]);
        mDyad.push(res.token);
        mDyadF.push(res.finger);
      });

      dyadMeasures.push(mDyad.join(" "));
      dyadFMeasures.push(mDyadF.join(" "));
    });

    return {
      dyads: dyadMeasures.join(" | "),
      dyadsF: dyadFMeasures.join(" | ")
    };
  }

  // ==========================================
  // CHORD PROGRESSIONS & VOICE-LEADING GYM
  // ==========================================
  const PROGRESSION_TEMPLATES = {
    pop_anthem: {
      id: "pop_anthem",
      name: "Pop Anthem (I – V – vi – IV)",
      numerals: ["I", "V", "vi", "IV"],
      description: "The most iconic progression in modern pop and rock (100+ global hit songs)."
    },
    jazz_turnaround: {
      id: "jazz_turnaround",
      name: "Jazz Turnaround (ii7 – V7 – Imaj7)",
      numerals: ["ii7", "V7", "Imaj7"],
      description: "The fundamental harmonic engine of standard jazz repertoire."
    },
    classical_cadence: {
      id: "classical_cadence",
      name: "Classical Cadence (I – IV – I64 – V7 – I)",
      numerals: ["I", "IV", "I64", "V7", "I"],
      description: "Standard conservatory voice-leading cadence with cadential 6/4 tonic resolution."
    },
    andalusian: {
      id: "andalusian",
      name: "Andalusian Cadence (i – VII – VI – V)",
      numerals: ["i", "VII", "VI", "V"],
      description: "Descending flamenco and dramatic classical minor cadence."
    },
    doo_wop: {
      id: "doo_wop",
      name: "50s Doo-Wop (I – vi – IV – V)",
      numerals: ["I", "vi", "IV", "V"],
      description: "Timeless 1950s rock, rhythm & blues, and soul progression."
    }
  };

  // Convert key root and Roman numeral into detailed chord data
  function getNumeralChordInfo(keyRoot = "C", numeral = "I") {
    const isMinorKey = keyRoot.endsWith("m") || ["Am", "Dm", "Em"].includes(keyRoot);
    const cleanKey = keyRoot.replace(/m$/, "");
    const tonicSemi = NOTE_OFFSETS[cleanKey] ?? 0;
    const useFlat = cleanKey.includes("b") || ["F", "Bb", "Eb", "Ab", "Db"].includes(cleanKey);

    const majorScaleOffsets = [0, 2, 4, 5, 7, 9, 11];
    const naturalMinorScaleOffsets = [0, 2, 3, 5, 7, 8, 10];
    const scaleOffsets = isMinorKey ? naturalMinorScaleOffsets : majorScaleOffsets;

    let degree = 0; // 0-based scale degree
    let chordType = "major";
    let is64 = false;

    switch (numeral) {
      case "I": degree = 0; chordType = "major"; break;
      case "i": degree = 0; chordType = "minor"; break;
      case "ii": degree = 1; chordType = "minor"; break;
      case "ii7": degree = 1; chordType = "m7"; break;
      case "iii": degree = 2; chordType = "minor"; break;
      case "IV": degree = 3; chordType = "major"; break;
      case "iv": degree = 3; chordType = "minor"; break;
      case "V": degree = 4; chordType = "major"; break;
      case "V7": degree = 4; chordType = "7"; break;
      case "vi": degree = 5; chordType = "minor"; break;
      case "VI": degree = 5; chordType = "major"; break;
      case "VII": degree = 6; chordType = "major"; break;
      case "vii°": degree = 6; chordType = "dim"; break;
      case "Imaj7": degree = 0; chordType = "maj7"; break;
      case "I64": degree = 0; chordType = "major"; is64 = true; break;
      default: degree = 0; chordType = "major";
    }

    const rootSemi = (tonicSemi + scaleOffsets[degree]) % 12;
    const rootName = useFlat ? NOTE_NAMES_FLAT[rootSemi] : NOTE_NAMES_SHARP[rootSemi];

    let intervals = [0, 4, 7];
    if (chordType === "minor") intervals = [0, 3, 7];
    else if (chordType === "dim") intervals = [0, 3, 6];
    else if (chordType === "7") intervals = [0, 4, 7, 10];
    else if (chordType === "maj7") intervals = [0, 4, 7, 11];
    else if (chordType === "m7") intervals = [0, 3, 7, 10];

    // LH Bass pitch: normally root in octave 2 or 3; for I64 bass is 5th of triad
    const bassDegreeOffset = is64 ? scaleOffsets[(degree + 4) % 7] : scaleOffsets[degree];
    const bassSemi = (tonicSemi + bassDegreeOffset) % 12;
    const bassName = (useFlat ? NOTE_NAMES_FLAT[bassSemi] : NOTE_NAMES_SHARP[bassSemi]) + (bassSemi < 5 ? "3" : "2");

    const chordPitchClasses = intervals.map(int => (rootSemi + int) % 12);

    return {
      numeral,
      keyRoot,
      rootName,
      chordType,
      chordName: `${rootName}${chordType === 'minor' ? 'm' : chordType === '7' ? '7' : chordType === 'maj7' ? 'maj7' : chordType === 'm7' ? 'm7' : chordType === 'dim' ? 'dim' : ''}${is64 ? ' (6/4)' : ''}`,
      rootSemi,
      intervals,
      pitchClasses: chordPitchClasses,
      lhBassPitch: bassName,
      is64
    };
  }

  // Voice-Leading Optimizer: Minimizes total semitone finger displacement between successive chords
  function optimizeProgressionVoiceLeading(keyRoot = "C", progressionKey = "pop_anthem") {
    const template = PROGRESSION_TEMPLATES[progressionKey] || PROGRESSION_TEMPLATES.pop_anthem;
    const chords = template.numerals.map(num => getNumeralChordInfo(keyRoot, num));

    const voicedSteps = [];
    let prevVoicingMidis = null;

    for (let cIdx = 0; cIdx < chords.length; cIdx++) {
      const chord = chords[cIdx];
      const pcs = chord.pitchClasses;

      if (cIdx === 0) {
        // Initial chord: close root position centered in octave 4 (MIDI 60-68)
        let rootMidi = 60 + ((chord.rootSemi - (60 % 12) + 12) % 12);
        if (rootMidi > 67) rootMidi -= 12;
        const rhMidis = chord.intervals.map(int => rootMidi + int);
        prevVoicingMidis = rhMidis;

        const useFlat = keyRoot.includes("b") || ["F", "Bb", "Eb", "Ab"].includes(keyRoot);
        const rhPitches = rhMidis.map(m => midiToPitch(m, useFlat));

        voicedSteps.push({
          index: cIdx,
          numeral: chord.numeral,
          chordName: chord.chordName,
          lhPitch: chord.lhBassPitch,
          lhMidi: pitchToMidi(chord.lhBassPitch),
          rhMidis: rhMidis,
          rhPitches: rhPitches,
          voicingName: "Root Position",
          semitoneMovement: 0,
          description: template.description
        });
      } else {
        // Evaluate candidate voicings across inversions and octaves (MIDI 53 to 84)
        const candidateVoicings = [];
        const numVoices = chord.intervals.length;

        for (let oct = 3; oct <= 5; oct++) {
          const baseRoot = (oct + 1) * 12 + chord.rootSemi;
          for (let inv = 0; inv < numVoices; inv++) {
            const rawMidis = chord.intervals.map((int, i) => {
              const noteM = baseRoot + int;
              return i < inv ? noteM + 12 : noteM;
            }).sort((a, b) => a - b);

            if (rawMidis[0] >= 53 && rawMidis[rawMidis.length - 1] <= 84) {
              candidateVoicings.push({
                midis: rawMidis,
                inversionName: inv === 0 ? "Root Position" : inv === 1 ? "1st Inversion" : inv === 2 ? "2nd Inversion" : "3rd Inversion"
              });
            }
          }
        }

        // Minimize distance metric: sum |curr[i] - prev[i]|
        let bestCandidate = candidateVoicings[0] || { midis: prevVoicingMidis, inversionName: "Root Position" };
        let minCost = Infinity;

        candidateVoicings.forEach(cand => {
          let cost = 0;
          const len = Math.min(cand.midis.length, prevVoicingMidis.length);
          for (let v = 0; v < len; v++) {
            cost += Math.abs(cand.midis[v] - prevVoicingMidis[v]);
          }
          if (cand.midis.length !== prevVoicingMidis.length) {
            cost += Math.abs(cand.midis.length - prevVoicingMidis.length) * 4;
          }
          // Slight penalty for moving too far from middle C range (MIDI 65)
          const avgPitch = cand.midis.reduce((s, m) => s + m, 0) / cand.midis.length;
          cost += Math.abs(avgPitch - 65) * 0.25;

          if (cost < minCost) {
            minCost = cost;
            bestCandidate = cand;
          }
        });

        const useFlat = keyRoot.includes("b") || ["F", "Bb", "Eb", "Ab"].includes(keyRoot);
        const rhPitches = bestCandidate.midis.map(m => midiToPitch(m, useFlat));

        voicedSteps.push({
          index: cIdx,
          numeral: chord.numeral,
          chordName: chord.chordName,
          lhPitch: chord.lhBassPitch,
          lhMidi: pitchToMidi(chord.lhBassPitch),
          rhMidis: bestCandidate.midis,
          rhPitches: rhPitches,
          voicingName: bestCandidate.inversionName,
          semitoneMovement: Math.round(minCost),
          description: template.description
        });

        prevVoicingMidis = bestCandidate.midis;
      }
    }

    return {
      progressionId: progressionKey,
      progressionName: template.name,
      description: template.description,
      key: keyRoot,
      steps: voicedSteps,
      totalMovement: voicedSteps.reduce((sum, s) => sum + s.semitoneMovement, 0)
    };
  }

  return {
    NOTE_NAMES_SHARP,
    NOTE_NAMES_FLAT,
    NOTE_OFFSETS,
    DIATONIC_BASE,
    DIATONIC_LETTERS,
    MAJOR_SCALE_FINGERINGS,
    MINOR_SCALE_FINGERINGS,
    INTERVAL_NAMES,
    SCALE_FORMULAS,
    CHORD_TYPES,
    CIRCLE_OF_FIFTHS,
    FLASHCARD_PRESETS,
    PROGRESSION_TEMPLATES,
    spellPitchOnLetter,
    pitchToMidi,
    midiToPitch,
    midiToFreq,
    pitchToFreq,
    getDiatonicStep,
    diatonicStepToPitch,
    areEnharmonicEquivalent,
    generateScale,
    generateChord,
    getInterval,
    getRandomFlashcard,
    generateEarTrainingChallenge,
    detectKeyAccidentals,
    harmonizePitch,
    harmonizeToken,
    generateSongHarmonies,
    recordSRSAttempt,
    getSRSItemStats,
    getAllSRSStats,
    clearSRSStats,
    getSRSMasteryLevel,
    getNumeralChordInfo,
    optimizeProgressionVoiceLeading
  };
});

