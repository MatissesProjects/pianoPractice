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

  // REAL-TIME POLYPHONIC CHORD RECOGNITION ENGINE
  function identifyActiveChord(activeNotesArray) {
    if (!activeNotesArray || activeNotesArray.length === 0) return null;

    // Normalize input to array of { num: number, pitch: string }
    const normalizedNotes = activeNotesArray.map(item => {
      if (typeof item === "string") {
        const num = pitchToMidi(item);
        return { num, pitch: item };
      }
      if (item && typeof item.num === "number") {
        return { num: item.num, pitch: item.pitch || midiToPitch(item.num) };
      }
      return null;
    }).filter(Boolean);

    if (normalizedNotes.length === 0) return null;
    if (normalizedNotes.length === 1) {
      const rootName = NOTE_NAMES_SHARP[normalizedNotes[0].num % 12];
      return { name: normalizedNotes[0].pitch, type: "Single Pitch", root: rootName };
    }

    const sorted = [...normalizedNotes].sort((a, b) => a.num - b.num);
    const bassPc = sorted[0].num % 12;
    const bassName = NOTE_NAMES_SHARP[bassPc];
    const uniquePitchClasses = [...new Set(sorted.map(n => n.num % 12))];

    // 1. Octaves & Unisons (all notes share same pitch class)
    if (uniquePitchClasses.length === 1) {
      const rootName = NOTE_NAMES_SHARP[uniquePitchClasses[0]];
      return { name: `${rootName} Octave`, type: "Octave / Unison", root: rootName };
    }

    // 2. Dyads & 2-Pitch-Class Combinations
    if (uniquePitchClasses.length === 2) {
      const p1 = sorted[0].num % 12;
      const p2 = sorted.find(n => (n.num % 12) !== p1).num % 12;
      const diff = (p2 - p1 + 12) % 12;

      if (diff === 7) {
        return { name: `${NOTE_NAMES_SHARP[p1]}5`, type: "Power Chord", root: NOTE_NAMES_SHARP[p1] };
      }
      if (diff === 5) {
        return { name: `${NOTE_NAMES_SHARP[p2]}5 / ${NOTE_NAMES_SHARP[p1]}`, type: "Inverted 5th", root: NOTE_NAMES_SHARP[p2] };
      }

      const intervalNames = {
        1: "Minor 2nd", 2: "Major 2nd", 3: "Minor 3rd", 4: "Major 3rd",
        5: "Perfect 4th", 6: "Tritone", 7: "Perfect 5th",
        8: "Minor 6th", 9: "Major 6th", 10: "Minor 7th", 11: "Major 7th"
      };
      const chordName = `${NOTE_NAMES_SHARP[p1]} + ${NOTE_NAMES_SHARP[p2]}`;
      return { name: chordName, type: intervalNames[diff] || "Dyad", root: NOTE_NAMES_SHARP[p1] };
    }

    // 3. Triads, 7ths, 9ths, Shells & Inversions
    const chordDefinitions = [
      // Standard Triads
      { sig: "0,4,7", nameSuffix: "Major", type: "Major Triad" },
      { sig: "0,3,7", nameSuffix: "Minor", type: "Minor Triad" },
      { sig: "0,3,6", nameSuffix: "Diminished", type: "Dim Triad" },
      { sig: "0,4,8", nameSuffix: "Augmented", type: "Aug Triad" },
      { sig: "0,5,7", nameSuffix: "sus4", type: "Suspended 4th" },
      { sig: "0,2,7", nameSuffix: "sus2", type: "Suspended 2nd" },

      // 7th Chords
      { sig: "0,4,7,11", nameSuffix: "maj7", type: "Major 7th" },
      { sig: "0,4,7,10", nameSuffix: "7", type: "Dominant 7th" },
      { sig: "0,3,7,10", nameSuffix: "m7", type: "Minor 7th" },
      { sig: "0,3,6,10", nameSuffix: "m7b5", type: "Half-Diminished 7th" },
      { sig: "0,3,6,9", nameSuffix: "dim7", type: "Diminished 7th" },
      { sig: "0,3,7,11", nameSuffix: "m(maj7)", type: "Minor-Major 7th" },
      { sig: "0,4,8,10", nameSuffix: "aug7", type: "Augmented 7th" },
      { sig: "0,2,7,10", nameSuffix: "7sus4", type: "Suspended 7th" },

      // 6th Chords
      { sig: "0,4,7,9", nameSuffix: "6", type: "6th Chord" },
      { sig: "0,3,7,9", nameSuffix: "m6", type: "Minor 6th" },

      // Added tone chords
      { sig: "0,2,4,7", nameSuffix: "add9", type: "Add9 Chord" },
      { sig: "0,2,3,7", nameSuffix: "m(add9)", type: "Minor Add9" },

      // Shell Voicings (No 5th)
      { sig: "0,4,10", nameSuffix: "7 (no 5th)", type: "Dominant 7th Shell" },
      { sig: "0,4,11", nameSuffix: "maj7 (no 5th)", type: "Major 7th Shell" },
      { sig: "0,3,10", nameSuffix: "m7 (no 5th)", type: "Minor 7th Shell" },

      // Extended 9ths
      { sig: "0,2,4,7,10", nameSuffix: "9", type: "Dominant 9th" },
      { sig: "0,2,4,7,11", nameSuffix: "maj9", type: "Major 9th" },
      { sig: "0,2,3,7,10", nameSuffix: "m9", type: "Minor 9th" }
    ];

    const matches = [];

    for (let r of uniquePitchClasses) {
      const rootName = NOTE_NAMES_SHARP[r];
      const intervals = uniquePitchClasses.map(pc => (pc - r + 12) % 12).sort((a, b) => a - b);
      const sig = intervals.join(",");

      for (const def of chordDefinitions) {
        if (sig === def.sig) {
          const isRootPosition = (bassPc === r);
          const separator = /^[0-9]|^(maj|m[0-9]|sus|dim|aug|add)/.test(def.nameSuffix) ? "" : " ";
          let chordName = `${rootName}${separator}${def.nameSuffix}`.trim();
          let chordType = def.type;

          if (!isRootPosition) {
            chordName = `${chordName} / ${bassName}`;
            const bassInterval = (bassPc - r + 12) % 12;
            if (bassInterval === 3 || bassInterval === 4) {
              chordType = "1st Inversion";
            } else if (bassInterval === 6 || bassInterval === 7 || bassInterval === 8) {
              chordType = "2nd Inversion";
            } else if (bassInterval === 9 || bassInterval === 10 || bassInterval === 11) {
              chordType = "3rd Inversion";
            } else {
              chordType = "Slash Chord";
            }
          }

          matches.push({
            root: r,
            rootName,
            isRootPosition,
            name: chordName,
            type: chordType,
            def
          });
        }
      }
    }

    if (matches.length > 0) {
      // Prioritize root-position match where bass matches candidate root
      const rootPosMatch = matches.find(m => m.isRootPosition);
      if (rootPosMatch) {
        return { name: rootPosMatch.name, type: rootPosMatch.type, root: rootPosMatch.rootName };
      }
      return { name: matches[0].name, type: matches[0].type, root: matches[0].rootName };
    }

    const pitchPills = sorted.map(n => n.pitch).join(" + ");
    return { name: pitchPills, type: "Multi-Note Cluster", root: bassName };
  }

  // STANDARD KEYBOARD HARDWARE PRESETS
  const STANDARD_KEYBOARD_PRESETS = [
    { id: "88", name: "88 Keys (Full Grand: A0 – C8)", count: 88, startMidi: 21, endMidi: 108 },
    { id: "76", name: "76 Keys (Stage: E1 – G7)", count: 76, startMidi: 28, endMidi: 103 },
    { id: "73", name: "73 Keys (Stage: E1 – E7)", count: 73, startMidi: 28, endMidi: 100 },
    { id: "61", name: "61 Keys (Standard: C2 – C7)", count: 61, startMidi: 36, endMidi: 96 },
    { id: "49", name: "49 Keys (Studio: C2 – C6)", count: 49, startMidi: 36, endMidi: 84 },
    { id: "37", name: "37 Keys (Default: C2 – C5)", count: 37, startMidi: 36, endMidi: 72 },
    { id: "32", name: "32 Keys (Mini Synth: F2 – C5)", count: 32, startMidi: 41, endMidi: 72 },
    { id: "25", name: "25 Keys (Mini: C3 – C5)", count: 25, startMidi: 48, endMidi: 72 }
  ];

  function extractTokensPitches(voiceStr) {
    if (!voiceStr) return [];
    const tokens = voiceStr.split("|").join(" ").split(/\s+/).filter(Boolean);
    const pitches = [];
    for (const t of tokens) {
      const clean = t.replace(/~/g, "");
      const [pitchPart] = clean.split(":");
      if (!pitchPart || pitchPart === "-") continue;
      const subNotes = pitchPart.split("+").filter(p => p && p !== "-");
      pitches.push(...subNotes);
    }
    return pitches;
  }

  function getRangeFromMidis(midiArray) {
    if (!midiArray || midiArray.length === 0) {
      return { minMidi: null, maxMidi: null, minPitch: null, maxPitch: null, span: 0, count: 0 };
    }
    const minMidi = Math.min(...midiArray);
    const maxMidi = Math.max(...midiArray);
    return {
      minMidi,
      maxMidi,
      minPitch: midiToPitch(minMidi),
      maxPitch: midiToPitch(maxMidi),
      span: maxMidi - minMidi + 1,
      count: midiArray.length
    };
  }

  function getSongPitchRange(song, options = { rh: true, lh: true, dyads: true }) {
    if (!song) return { minMidi: 60, maxMidi: 60, minPitch: "C4", maxPitch: "C4", span: 1 };
    
    const rhPitches = extractTokensPitches(song.rh);
    const lhPitches = extractTokensPitches(song.lh);
    const dyadPitches = extractTokensPitches(song.dyads);

    const rhMidis = rhPitches.map(p => pitchToMidi(p)).filter(m => m !== null);
    const lhMidis = lhPitches.map(p => pitchToMidi(p)).filter(m => m !== null);
    const dyadMidis = dyadPitches.map(p => pitchToMidi(p)).filter(m => m !== null);

    const rhRange = getRangeFromMidis(rhMidis);
    const lhRange = getRangeFromMidis(lhMidis);
    const dyadRange = getRangeFromMidis(dyadMidis);

    const allMidis = [...rhMidis, ...lhMidis, ...dyadMidis];
    const totalRange = getRangeFromMidis(allMidis);

    const effectiveMidis = [];
    if (options.rh !== false) effectiveMidis.push(...rhMidis);
    if (options.lh !== false) effectiveMidis.push(...lhMidis);
    if (options.dyads !== false) effectiveMidis.push(...dyadMidis);

    const selectedMidis = effectiveMidis.length > 0 ? effectiveMidis : allMidis;
    const effectiveRange = getRangeFromMidis(selectedMidis);

    const presetsAscending = [...STANDARD_KEYBOARD_PRESETS].sort((a, b) => a.count - b.count);
    const minSpanPreset = presetsAscending.find(p => p.count >= effectiveRange.span) || STANDARD_KEYBOARD_PRESETS[0];
    const minExactPreset = presetsAscending.find(p => p.startMidi <= effectiveRange.minMidi && p.endMidi >= effectiveRange.maxMidi) || STANDARD_KEYBOARD_PRESETS[0];

    return {
      minMidi: effectiveRange.minMidi,
      maxMidi: effectiveRange.maxMidi,
      minPitch: effectiveRange.minPitch,
      maxPitch: effectiveRange.maxPitch,
      span: effectiveRange.span,
      rh: rhRange,
      lh: lhRange,
      dyads: dyadRange,
      total: totalRange,
      minSpanPreset,
      minExactPreset
    };
  }

  function evaluateSongKeyboardCompatibility(song, keyboardConfig = {}, options = { rh: true, lh: true, dyads: true }) {
    const startMidi = typeof keyboardConfig.startMidi === "number" ? keyboardConfig.startMidi : 36;
    const keyCount = typeof keyboardConfig.keyCount === "number" ? keyboardConfig.keyCount : 37;
    const endMidi = startMidi + keyCount - 1;

    const range = getSongPitchRange(song, options);
    if (range.minMidi === null) {
      return {
        fitsExact: true,
        fitsSpan: true,
        status: "fits",
        statusMessage: "Fits keyboard",
        notesBelow: 0,
        notesAbove: 0,
        shiftNeeded: 0,
        range,
        recommendedPreset: "37"
      };
    }

    const fitsExact = (range.minMidi >= startMidi && range.maxMidi <= endMidi);
    const fitsSpan = (range.span <= keyCount);
    const notesBelow = Math.max(0, startMidi - range.minMidi);
    const notesAbove = Math.max(0, range.maxMidi - endMidi);

    let shiftNeeded = 0;
    if (fitsSpan && !fitsExact) {
      if (range.minMidi < startMidi) {
        shiftNeeded = range.minMidi - startMidi;
      } else if (range.maxMidi > endMidi) {
        shiftNeeded = range.maxMidi - endMidi;
      }
    }

    let status = "fits";
    let statusMessage = `Fits ${keyCount}-Key keyboard (${range.minPitch} – ${range.maxPitch})`;

    if (!fitsExact) {
      if (fitsSpan) {
        status = "shift_needed";
        const octaves = Math.round(shiftNeeded / 12);
        const octStr = Math.abs(octaves) >= 1 ? ` (${octaves > 0 ? '+' : ''}${octaves} oct)` : "";
        statusMessage = `Fits with shift: ${shiftNeeded > 0 ? '+' : ''}${shiftNeeded} semitones${octStr}`;
      } else {
        status = "exceeds";
        statusMessage = `Exceeds ${keyCount}-Key keyboard: needs ${range.span} keys (${range.minPitch} – ${range.maxPitch})`;
      }
    }

    return {
      fitsExact,
      fitsSpan,
      status,
      statusMessage,
      notesBelow,
      notesAbove,
      shiftNeeded,
      range,
      recommendedPreset: range.minExactPreset ? range.minExactPreset.id : "88",
      recommendedPresetName: range.minExactPreset ? range.minExactPreset.name : "88 Keys"
    };
  }

  // ==========================================
  // PIANO NOTES CHEAT SHEET ENGINE & DATA MODEL
  // Based on pianoNotesCheatSheet.png
  // ==========================================
  const CHEAT_SHEET_NOTE_COLORS = {
    'C': '#ef4444', // Vibrant Red (Middle C prominent)
    'D': '#8b5cf6', // Purple / Violet
    'E': '#1e40af', // Navy / Deep Indigo
    'F': '#0284c7', // Bright Sky Blue / Cyan
    'G': '#14b8a6', // Seafoam / Mint Teal
    'A': '#f97316', // Warm Orange / Peach
    'B': '#10b981'  // Emerald Green
  };

  const CHEAT_SHEET_ACCIDENTAL_COLORS = {
    'C#': '#dc2626', 'Db': '#dc2626',
    'D#': '#7c3aed', 'Eb': '#7c3aed',
    'F#': '#0284c7', 'Gb': '#0284c7',
    'G#': '#0d9488', 'Ab': '#0d9488',
    'A#': '#ea580c', 'Bb': '#ea580c'
  };

  function getCheatSheetNoteColor(pitchStr) {
    if (!pitchStr || pitchStr === "-") return "#64748b";
    const clean = pitchStr.trim().replace(/[0-9]/g, "");
    if (CHEAT_SHEET_ACCIDENTAL_COLORS[clean]) {
      return CHEAT_SHEET_ACCIDENTAL_COLORS[clean];
    }
    const letter = clean.charAt(0).toUpperCase();
    return CHEAT_SHEET_NOTE_COLORS[letter] || "#64748b";
  }

  // Grand staff & mnemonic definitions from pianoNotesCheatSheet.png
  const CHEAT_SHEET_STAFF_MAP = {
    'G2': { clef: 'bass', role: 'line', index: 1, posText: 'Bass Clef • Line 1', mnemonic: 'Good (Line 1)' },
    'A2': { clef: 'bass', role: 'space', index: 1, posText: 'Bass Clef • Space 1', mnemonic: 'All (Space 1)' },
    'B2': { clef: 'bass', role: 'line', index: 2, posText: 'Bass Clef • Line 2', mnemonic: 'Boys (Line 2)' },
    'C3': { clef: 'bass', role: 'space', index: 2, posText: 'Bass Clef • Space 2', mnemonic: 'Cows (Space 2)' },
    'D3': { clef: 'bass', role: 'line', index: 3, posText: 'Bass Clef • Line 3', mnemonic: 'Do (Line 3)' },
    'E3': { clef: 'bass', role: 'space', index: 3, posText: 'Bass Clef • Space 3', mnemonic: 'Eat (Space 3)' },
    'F3': { clef: 'bass', role: 'line', index: 4, posText: 'Bass Clef • Line 4 (F Clef Line)', mnemonic: 'Fine (Line 4)' },
    'G3': { clef: 'bass', role: 'space', index: 4, posText: 'Bass Clef • Space 4', mnemonic: 'Grass (Space 4)' },
    'A3': { clef: 'bass', role: 'line', index: 5, posText: 'Bass Clef • Line 5 (Top line)', mnemonic: 'Always (Line 5)', altClef: 'treble', altRole: 'ledger', altPosText: 'Treble • 2nd Ledger Line Below' },
    'B3': { clef: 'bass', role: 'space_above', index: 5, posText: 'Bass Clef • Space Above Line 5', mnemonic: 'Above Staff', altClef: 'treble', altRole: 'space_below_ledger', altPosText: 'Treble • Space Below Middle C' },
    'C4': { clef: 'grand-bridge', role: 'ledger', index: 0, isMiddleC: true, posText: '⭐ MIDDLE C • Center Bridge Ledger Line', mnemonic: 'Middle C (Central Ledger Line)' },
    'D4': { clef: 'treble', role: 'space_below', index: 1, posText: 'Treble Clef • Space Below Line 1', mnemonic: 'Below Staff', altClef: 'bass', altRole: 'space_above_ledger', altPosText: 'Bass • Space Above Middle C' },
    'E4': { clef: 'treble', role: 'line', index: 1, posText: 'Treble Clef • Line 1 (Bottom line)', mnemonic: 'Every (Line 1)', altClef: 'bass', altRole: 'ledger', altPosText: 'Bass • 2nd Ledger Line Above' },
    'F4': { clef: 'treble', role: 'space', index: 1, posText: 'Treble Clef • Space 1', mnemonic: 'F (FACE Space 1)' },
    'G4': { clef: 'treble', role: 'line', index: 2, posText: 'Treble Clef • Line 2 (G Clef Line)', mnemonic: 'Good (Line 2)' },
    'A4': { clef: 'treble', role: 'space', index: 2, posText: 'Treble Clef • Space 2', mnemonic: 'A (FACE Space 2)' },
    'B4': { clef: 'treble', role: 'line', index: 3, posText: 'Treble Clef • Line 3', mnemonic: 'Boy (Line 3)' },
    'C5': { clef: 'treble', role: 'space', index: 3, posText: 'Treble Clef • Space 3', mnemonic: 'C (FACE Space 3)' },
    'D5': { clef: 'treble', role: 'line', index: 4, posText: 'Treble Clef • Line 4', mnemonic: 'Does (Line 4)' },
    'E5': { clef: 'treble', role: 'space', index: 4, posText: 'Treble Clef • Space 4', mnemonic: 'E (FACE Space 4)' },
    'F5': { clef: 'treble', role: 'line', index: 5, posText: 'Treble Clef • Line 5 (Top line)', mnemonic: 'Fine (Line 5)' },
    'G5': { clef: 'treble', role: 'space_above', index: 5, posText: 'Treble Clef • Space Above Line 5', mnemonic: 'Above Staff' }
  };

  function getCheatSheetStaffInfo(pitchStr) {
    if (!pitchStr || pitchStr === "-") return null;
    const clean = pitchStr.trim();
    const letter = clean.charAt(0).toUpperCase();
    const octMatch = clean.match(/[0-9]/);
    const oct = octMatch ? parseInt(octMatch[0], 10) : 4;
    const isMidC = (clean === "C4");
    const color = getCheatSheetNoteColor(clean);
    const midi = pitchToMidi(clean);
    const freq = midiToFreq(midi);

    const baseInfo = CHEAT_SHEET_STAFF_MAP[clean];
    if (baseInfo) {
      return {
        pitch: clean,
        letter,
        octave: oct,
        color,
        midi,
        freq,
        isMiddleC: isMidC,
        clef: baseInfo.clef,
        staffRole: baseInfo.role,
        staffIndex: baseInfo.index,
        staffPosition: baseInfo.posText,
        mnemonic: baseInfo.mnemonic,
        altClef: baseInfo.altClef || null,
        altRole: baseInfo.altRole || null,
        altPosText: baseInfo.altPosText || null
      };
    }

    // Extrapolate for pitches outside the standard 22-note range
    const clef = (midi >= 60) ? "treble" : "bass";
    return {
      pitch: clean,
      letter,
      octave: oct,
      color,
      midi,
      freq,
      isMiddleC: isMidC,
      clef: clef,
      staffRole: 'extended',
      staffIndex: 0,
      staffPosition: `${clef === "treble" ? "High Treble" : "Low Bass"} • Octave ${oct}`,
      mnemonic: `${letter} in Octave ${oct}`,
      altClef: null,
      altRole: null,
      altPosText: null
    };
  }

  // Canonical 22 diatonic white keys from pianoNotesCheatSheet.png (G2 to G5)
  const CHEAT_SHEET_NOTES_RANGE = [
    "G2", "A2", "B2", "C3", "D3", "E3", "F3", "G3", "A3", "B3",
    "C4",
    "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5"
  ].map(p => getCheatSheetStaffInfo(p));

  // ==========================================
  // METRONOME & TIME SIGNATURE EQUAL DIVISIONS ENGINE
  // ==========================================

  const TIME_SIGNATURE_NAMES = {
    "4/4": "4/4 (Common Time)",
    "3/4": "3/4 (Waltz Time)",
    "2/4": "2/4 (March Time)",
    "6/8": "6/8 (Compound Duple)",
    "3/8": "3/8 (Compound Single)",
    "5/4": "5/4 (Odd Meter)",
    "7/8": "7/8 (Complex Meter)",
    "9/8": "9/8 (Compound Triple)",
    "12/8": "12/8 (Compound Quadruple)"
  };

  /**
   * Parse a time signature string (e.g. "4/4", "3/4", "6/8", or integer 4).
   * Computes numerator, denominator, beat unit in quarter notes, and compound status.
   */
  function parseTimeSignature(timeSigStr) {
    if (!timeSigStr) timeSigStr = "4/4";
    let num = 4;
    let den = 4;

    if (typeof timeSigStr === "number") {
      num = timeSigStr;
      den = 4;
    } else {
      const parts = String(timeSigStr).trim().split("/");
      num = parseInt(parts[0], 10) || 4;
      den = parts[1] ? (parseInt(parts[1], 10) || 4) : 4;
    }

    const timeSig = `${num}/${den}`;
    const beatUnitBeats = 4 / den; // quarter note duration equivalency
    const measureQuarterBeats = num * beatUnitBeats;
    const isCompound = (den === 8 || den === 16) && (num % 3 === 0 && num > 3);
    const compoundBeats = isCompound ? num / 3 : num;
    const name = TIME_SIGNATURE_NAMES[timeSig] || `${timeSig} Time`;

    return {
      numerator: num,
      denominator: den,
      timeSig,
      name,
      beatUnitBeats,
      measureQuarterBeats,
      isCompound,
      compoundBeats
    };
  }

  /**
   * Calculate sample-accurate equal divisions for metronome ticks across any time signature.
   * @param {number} bpm - Beats per minute (quarter notes per minute)
   * @param {string|number} timeSigStr - Time signature (e.g. "4/4", "3/4", "6/8")
   * @param {number} subdivision - Equal divisions per beat (1 = quarter/beat unit, 2 = eighths, 3 = triplets, 4 = sixteenths)
   */
  function calculateMetronomeIntervals(bpm, timeSigStr = "4/4", subdivision = 1) {
    const validBpm = Math.max(20, Math.min(300, parseInt(bpm, 10) || 96));
    const validSubdiv = Math.max(1, Math.min(8, parseInt(subdivision, 10) || 1));
    const ts = parseTimeSignature(timeSigStr);

    // Duration of 1 beat unit in seconds (e.g. at 120 BPM: quarter=0.5s, eighth=0.25s)
    const beatIntervalSec = (60.0 / validBpm) * ts.beatUnitBeats;
    // Exactly equal division interval
    const tickIntervalSec = beatIntervalSec / validSubdiv;
    const tickIntervalMs = tickIntervalSec * 1000;
    const ticksPerMeasure = ts.numerator * validSubdiv;
    const measureDurationSec = beatIntervalSec * ts.numerator;

    return {
      bpm: validBpm,
      timeSig: ts.timeSig,
      numerator: ts.numerator,
      denominator: ts.denominator,
      beatUnitBeats: ts.beatUnitBeats,
      subdivision: validSubdiv,
      ticksPerMeasure,
      beatIntervalSec,
      tickIntervalSec,
      tickIntervalMs,
      measureDurationSec,
      isCompound: ts.isCompound
    };
  }

  /**
   * Returns musical accent hierarchy, frequency and volume for a specific tick in a measure.
   * Ensures distinct auditory cues for downbeat, secondary strong beats, regular beats, and equal subdivisions.
   */
  function getMetronomeTickProfile(tickIndex, ticksPerMeasure, timeSigStr = "4/4", subdivision = 1) {
    const validSubdiv = Math.max(1, parseInt(subdivision, 10) || 1);
    const ts = parseTimeSignature(timeSigStr);
    const modTick = ((tickIndex % ticksPerMeasure) + ticksPerMeasure) % ticksPerMeasure;
    const isDownbeat = modTick === 0;
    const isBeatOnset = modTick % validSubdiv === 0;
    const beatIndex = Math.floor(modTick / validSubdiv); // 0-indexed beat (0..num-1)
    const beatNumber = beatIndex + 1; // 1-indexed

    let accentType = "beat";
    let freq = 640;
    let volume = 0.6;

    if (isDownbeat) {
      accentType = "downbeat";
      freq = 1200;
      volume = 1.0;
    } else if (isBeatOnset) {
      // Check secondary accents in common meters
      let isSecondary = false;
      if (ts.numerator === 4 && beatIndex === 2) {
        // Beat 3 in 4/4
        isSecondary = true;
      } else if (ts.numerator === 6 && beatIndex === 3) {
        // Beat 4 in 6/8
        isSecondary = true;
      } else if (ts.numerator === 12 && (beatIndex === 3 || beatIndex === 6 || beatIndex === 9)) {
        // Beats 4, 7, 10 in 12/8
        isSecondary = true;
      } else if (ts.numerator === 9 && (beatIndex === 3 || beatIndex === 6)) {
        // Beats 4, 7 in 9/8
        isSecondary = true;
      }

      if (isSecondary) {
        accentType = "secondary";
        freq = 900;
        volume = 0.75;
      } else {
        accentType = "beat";
        freq = 640;
        volume = 0.6;
      }
    } else {
      accentType = "subdivision";
      freq = 420;
      volume = 0.35;
    }

    return {
      tickIndex: modTick,
      beatNumber,
      beatIndex,
      isDownbeat,
      isBeatOnset,
      isSubdivision: !isBeatOnset,
      accentType,
      freq,
      volume
    };
  }

  const METRONOME_SOUND_PRESETS = [
    { id: "woodblock", label: "🪵 Wood Block", description: "Hollow resonant woodblock percussion (Default)" },
    { id: "mechanical", label: "⏱️ Mechanical Tick", description: "Classic pendulum wooden cabinet metronome" },
    { id: "digital", label: "⚡ Digital Beep", description: "Modern electronic precision sine beep" },
    { id: "cowbell", label: "🔔 Cowbell / Agogô", description: "Metallic dual-mode percussion bell" },
    { id: "stick", label: "🥁 Rimshot / Sticks", description: "Acoustic drumstick cross-stick click" }
  ];

  /**
   * Returns synthesis parameters for a given metronome sound and accent hierarchy.
   */
  function getMetronomeSoundParameters(soundId = "woodblock", accentType = "beat") {
    const sId = (soundId || "woodblock").toLowerCase();
    const isDownbeat = (accentType === "downbeat");
    const isSecondary = (accentType === "secondary");
    const isSub = (accentType === "subdivision");

    switch (sId) {
      case "mechanical":
        if (isDownbeat) {
          return { clickFreq: 3800, clickDur: 0.005, clickGain: 0.32, thumpFreq: 320, thumpDur: 0.024, thumpGain: 0.40 };
        } else if (isSecondary) {
          return { clickFreq: 3400, clickDur: 0.004, clickGain: 0.22, thumpFreq: 280, thumpDur: 0.020, thumpGain: 0.28 };
        } else if (isSub) {
          return { clickFreq: 2800, clickDur: 0.003, clickGain: 0.12, thumpFreq: 200, thumpDur: 0.014, thumpGain: 0.16 };
        }
        return { clickFreq: 3200, clickDur: 0.004, clickGain: 0.18, thumpFreq: 240, thumpDur: 0.018, thumpGain: 0.24 };

      case "digital":
        if (isDownbeat) {
          return { freq: 1600, gain: 0.38, dur: 0.042 };
        } else if (isSecondary) {
          return { freq: 1050, gain: 0.28, dur: 0.035 };
        } else if (isSub) {
          return { freq: 520, gain: 0.16, dur: 0.025 };
        }
        return { freq: 800, gain: 0.24, dur: 0.032 };

      case "cowbell":
        if (isDownbeat) {
          return { freq1: 800, freq2: 1240, filterFreq: 1000, filterQ: 6.0, gain: 0.40, dur: 0.080 };
        } else if (isSecondary) {
          return { freq1: 650, freq2: 1000, filterFreq: 850, filterQ: 6.0, gain: 0.30, dur: 0.070 };
        } else if (isSub) {
          return { freq1: 420, freq2: 650, filterFreq: 600, filterQ: 5.0, gain: 0.16, dur: 0.050 };
        }
        return { freq1: 540, freq2: 840, filterFreq: 750, filterQ: 5.5, gain: 0.26, dur: 0.065 };

      case "stick":
        if (isDownbeat) {
          return { freq1: 2400, freq2: 1800, filterFreq: 2200, filterQ: 4.0, gain: 0.42, dur: 0.022 };
        } else if (isSecondary) {
          return { freq1: 2100, freq2: 1600, filterFreq: 1900, filterQ: 4.0, gain: 0.30, dur: 0.018 };
        } else if (isSub) {
          return { freq1: 1500, freq2: 1200, filterFreq: 1400, filterQ: 3.5, gain: 0.16, dur: 0.014 };
        }
        return { freq1: 1900, freq2: 1450, filterFreq: 1750, filterQ: 4.0, gain: 0.26, dur: 0.016 };

      case "woodblock":
      default:
        if (isDownbeat) {
          return { freq1: 1220, freq2: 1928, filterFreq: 1320, filterQ: 5.5, gain: 0.46, dur: 0.052 };
        } else if (isSecondary) {
          return { freq1: 980, freq2: 1550, filterFreq: 1060, filterQ: 5.5, gain: 0.36, dur: 0.046 };
        } else if (isSub) {
          return { freq1: 640, freq2: 1010, filterFreq: 700, filterQ: 5.0, gain: 0.20, dur: 0.035 };
        }
        return { freq1: 860, freq2: 1360, filterFreq: 930, filterQ: 5.5, gain: 0.30, dur: 0.042 };
    }
  }

  /**
   * Synthesizes authentic metronome clicks across sound presets (Wood Block, Mechanical, Digital, Cowbell, Stick).
   * Fully scheduled in Web Audio API.
   */
  function synthesizeMetronomeClick(audioCtx, destinationNode, time, accentType = "beat", soundId = "woodblock", volScale = 1.0) {
    if (!audioCtx) return null;
    const dest = destinationNode || audioCtx.destination;
    const t = (typeof time === "number" && !isNaN(time)) ? time : audioCtx.currentTime;
    const sId = (soundId || "woodblock").toLowerCase();
    const effectiveVol = Math.max(0, Math.min(1, parseFloat(volScale) || 0));
    if (effectiveVol <= 0.0001) return null;

    const params = getMetronomeSoundParameters(sId, accentType);

    if (sId === "mechanical") {
      const oscClick = audioCtx.createOscillator();
      const clickGain = audioCtx.createGain();
      const clickFilter = audioCtx.createBiquadFilter();

      clickFilter.type = "bandpass";
      clickFilter.frequency.setValueAtTime(params.clickFreq, t);
      clickFilter.Q.setValueAtTime(4.0, t);

      oscClick.type = "triangle";
      oscClick.frequency.setValueAtTime(params.clickFreq, t);

      const targetClickPeak = params.clickGain * effectiveVol;
      clickGain.gain.setValueAtTime(targetClickPeak, t);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, t + params.clickDur);

      oscClick.connect(clickGain);
      clickGain.connect(clickFilter);
      clickFilter.connect(dest);
      oscClick.start(t);
      oscClick.stop(t + params.clickDur + 0.005);

      const oscThump = audioCtx.createOscillator();
      const thumpGain = audioCtx.createGain();

      oscThump.type = "sine";
      oscThump.frequency.setValueAtTime(params.thumpFreq * 1.15, t);
      oscThump.frequency.exponentialRampToValueAtTime(params.thumpFreq, t + 0.008);

      const targetThumpPeak = params.thumpGain * effectiveVol;
      thumpGain.gain.setValueAtTime(targetThumpPeak, t);
      thumpGain.gain.exponentialRampToValueAtTime(0.0001, t + params.thumpDur);

      oscThump.connect(thumpGain);
      thumpGain.connect(dest);
      oscThump.start(t);
      oscThump.stop(t + params.thumpDur + 0.005);

      return { soundId: sId, accentType, time: t, nodes: [oscClick, oscThump] };
    }

    if (sId === "digital") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(params.freq, t);

      const targetPeak = params.gain * effectiveVol;
      gain.gain.setValueAtTime(targetPeak, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + params.dur);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + params.dur + 0.005);

      return { soundId: sId, accentType, time: t, nodes: [osc] };
    }

    // Default: Wood Block, Cowbell, or Stick (dual-mode resonant percussion)
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    const gain2 = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(params.filterFreq, t);
    filter.Q.setValueAtTime(params.filterQ, t);

    if (sId === "woodblock") {
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(params.freq1 * 1.25, t);
      osc1.frequency.exponentialRampToValueAtTime(params.freq1, t + 0.007);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(params.freq2 * 1.05, t);
      osc2.frequency.exponentialRampToValueAtTime(params.freq2, t + 0.010);
    } else if (sId === "cowbell") {
      osc1.type = "square";
      osc1.frequency.setValueAtTime(params.freq1, t);

      osc2.type = "square";
      osc2.frequency.setValueAtTime(params.freq2, t);
    } else {
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(params.freq1, t);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(params.freq2, t);
    }

    const peak1 = params.gain * effectiveVol;
    gain1.gain.setValueAtTime(peak1, t);
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + params.dur);

    const peak2 = params.gain * 0.45 * effectiveVol;
    gain2.gain.setValueAtTime(peak2, t);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + params.dur * 0.65);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(filter);
    gain2.connect(filter);
    filter.connect(dest);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + params.dur + 0.01);
    osc2.stop(t + params.dur + 0.01);

    return { soundId: sId, accentType, time: t, nodes: [osc1, osc2] };
  }

  /**
   * Generates dynamic count-in array matching the authentic meter of the time signature.
   */
  function getTimeSignatureCountIn(timeSigStr = "4/4", bpm = 96) {
    const ts = parseTimeSignature(timeSigStr);
    const countBeats = [];
    // Count from ts.numerator down to 1, then GO! (num 0)
    for (let b = ts.numerator; b >= 1; b--) {
      const isDownbeat = (b === ts.numerator);
      countBeats.push({
        num: b,
        freq: isDownbeat ? 880 : 440,
        label: String(b)
      });
    }
    countBeats.push({
      num: 0,
      freq: 1046.5,
      label: "GO! 🔥"
    });

    const beatMs = (60 / bpm) * ts.beatUnitBeats * 1000;
    return {
      countBeats,
      beatMs,
      totalCountInMs: (countBeats.length - 1) * beatMs
    };
  }

  // ==========================================
  // OUTPUT DEVICE & MIDI MESSAGE UTILITIES
  // ==========================================

  /**
   * Format standard 3-byte MIDI channel voice message.
   * @param {number} cmd - Command nibble (8 = Note Off, 9 = Note On, 11 = CC)
   * @param {number} data1 - Note number or controller index (0-127)
   * @param {number} data2 - Velocity or controller value (0-127)
   * @param {number} channel - 1-indexed MIDI channel (1-16)
   */
  function formatMidiMessage(cmd, data1, data2, channel = 1) {
    const validCh = Math.max(1, Math.min(16, parseInt(channel, 10) || 1));
    const status = ((cmd & 0x0F) << 4) | ((validCh - 1) & 0x0F);
    const d1 = Math.max(0, Math.min(127, Math.round(data1 || 0)));
    const d2 = Math.max(0, Math.min(127, Math.round(data2 || 0)));
    return [status, d1, d2];
  }

  /**
   * Generates a MIDI Note On message for an output device.
   */
  function createMidiNoteOn(pitchOrMidi, velocity = 80, channel = 1) {
    let noteNum = 60;
    if (typeof pitchOrMidi === "number") {
      noteNum = pitchOrMidi;
    } else if (typeof pitchOrMidi === "string") {
      const parsed = pitchToMidi(pitchOrMidi);
      if (parsed !== null) noteNum = parsed;
    }
    return formatMidiMessage(9, noteNum, velocity, channel);
  }

  /**
   * Generates a MIDI Note Off message for an output device.
   */
  function createMidiNoteOff(pitchOrMidi, channel = 1) {
    let noteNum = 60;
    if (typeof pitchOrMidi === "number") {
      noteNum = pitchOrMidi;
    } else if (typeof pitchOrMidi === "string") {
      const parsed = pitchToMidi(pitchOrMidi);
      if (parsed !== null) noteNum = parsed;
    }
    return formatMidiMessage(8, noteNum, 0, channel);
  }

  /**
   * Generates a MIDI Control Change (e.g. CC 64 Sustain Pedal).
   */
  function createMidiCC(controllerNumber, value, channel = 1) {
    return formatMidiMessage(11, controllerNumber, value, channel);
  }

  /**
   * Classifies an audio device label and deviceId into categories and icons.
   */
  function classifyAudioDevice(label = "", deviceId = "") {
    const l = (label || "").toLowerCase();
    const id = (deviceId || "").toLowerCase();

    if (id === "default" && (!l || l.includes("default"))) {
      return { type: "default", icon: "💻", category: "Default System Output" };
    }
    if (id === "communications" || l.includes("communications")) {
      return { type: "communications", icon: "📞", category: "Communications Device" };
    }
    if (/headphone|headset|earphone|airpod|buds|wh-1000|bose|iem|front.*headphone/i.test(l)) {
      return { type: "headphones", icon: "🎧", category: "Headphones / Headset" };
    }
    if (/hdmi|displayport|nvidia|amd|tv|monitor|screen|ultrawide|lg tv|samsung/i.test(l)) {
      return { type: "display", icon: "🖥️", category: "Monitor / TV / HDMI" };
    }
    if (/focusrite|scarlett|motu|steinberg|behringer|rode|yamaha|komplete|apollo|audio interface|dac|usb audio|sound card/i.test(l)) {
      return { type: "interface", icon: "🎛️", category: "Audio Interface / USB DAC" };
    }
    if (/cable|virtual|voicemeeter|vb-audio|obs|blackhole|virtual-audio|stereo mix/i.test(l)) {
      return { type: "virtual", icon: "🔀", category: "Virtual Cable / Routing" };
    }
    if (/spdif|optical|digital/i.test(l)) {
      return { type: "digital", icon: "⚡", category: "Digital / Optical S/PDIF" };
    }
    if (/speaker|lautsprecher|haut-parleur|realtek/i.test(l)) {
      return { type: "speakers", icon: "🔊", category: "Speakers / Line Out" };
    }
    return { type: "audio", icon: "🔊", category: "Audio Output Device" };
  }

  /**
   * Filters and formats an array of MediaDeviceInfo for audio output destinations.
   */
  function filterAudioOutputDevices(devices) {
    if (!Array.isArray(devices)) return [];
    return devices
      .filter(d => d.kind === "audiooutput")
      .map((d, idx) => {
        const deviceId = d.deviceId || "";
        const rawLabel = d.label || "";
        const fallback = (deviceId === "default" ? "System Default Output" : `Audio Output ${idx + 1}`);
        const label = rawLabel || fallback;
        const info = classifyAudioDevice(label, deviceId);
        return {
          deviceId,
          groupId: d.groupId || "",
          label,
          type: info.type,
          icon: info.icon,
          category: info.category
        };
      });
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
    optimizeProgressionVoiceLeading,
    identifyActiveChord,
    STANDARD_KEYBOARD_PRESETS,
    getSongPitchRange,
    evaluateSongKeyboardCompatibility,
    CHEAT_SHEET_NOTE_COLORS,
    CHEAT_SHEET_ACCIDENTAL_COLORS,
    getCheatSheetNoteColor,
    CHEAT_SHEET_STAFF_MAP,
    getCheatSheetStaffInfo,
    CHEAT_SHEET_NOTES_RANGE,
    TIME_SIGNATURE_NAMES,
    parseTimeSignature,
    calculateMetronomeIntervals,
    getMetronomeTickProfile,
    getTimeSignatureCountIn,
    formatMidiMessage,
    createMidiNoteOn,
    createMidiNoteOff,
    createMidiCC,
    filterAudioOutputDevices,
    classifyAudioDevice,
    METRONOME_SOUND_PRESETS,
    getMetronomeSoundParameters,
    synthesizeMetronomeClick
  };
});

