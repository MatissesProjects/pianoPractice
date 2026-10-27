/**
 * tests/test_education.js - Unit tests for Music Theory & Educational Engine
 */

const assert = require('assert');
const MusicTheory = require('../theory.js');

console.log("=== Running Piano Education Suite Tests ===");

// 1. Test Pitch to MIDI and MIDI to Pitch conversions
{
  assert.strictEqual(MusicTheory.pitchToMidi("C4"), 60, "Middle C (C4) should be MIDI 60");
  assert.strictEqual(MusicTheory.pitchToMidi("A4"), 69, "Concert A (A4) should be MIDI 69");
  assert.strictEqual(MusicTheory.pitchToMidi("C3"), 48, "C3 should be MIDI 48");
  assert.strictEqual(MusicTheory.pitchToMidi("C5"), 72, "C5 should be MIDI 72");
  assert.strictEqual(MusicTheory.pitchToMidi("F#4"), 66, "F#4 should be MIDI 66");
  assert.strictEqual(MusicTheory.pitchToMidi("Gb4"), 66, "Gb4 should be MIDI 66");

  assert.strictEqual(MusicTheory.midiToPitch(60), "C4", "MIDI 60 should be C4");
  assert.strictEqual(MusicTheory.midiToPitch(69), "A4", "MIDI 69 should be A4");
  assert.strictEqual(MusicTheory.midiToPitch(66, true), "Gb4", "MIDI 66 with flat flag should be Gb4");
  assert.strictEqual(MusicTheory.midiToPitch(66, false), "F#4", "MIDI 66 with sharp flag should be F#4");

  console.log("✔ Test 1: Pitch & MIDI conversions passed");
}

// 2. Test Frequency calculations
{
  const a4Freq = MusicTheory.pitchToFreq("A4");
  assert.ok(Math.abs(a4Freq - 440) < 0.001, "A4 should be 440 Hz");

  const c4Freq = MusicTheory.pitchToFreq("C4");
  assert.ok(Math.abs(c4Freq - 261.63) < 0.1, "C4 should be ~261.63 Hz");

  console.log("✔ Test 2: Frequency calculations passed");
}

// 3. Test Diatonic steps for staff placement
{
  assert.strictEqual(MusicTheory.getDiatonicStep("C4"), 0, "C4 should be diatonic step 0 (reference)");
  assert.strictEqual(MusicTheory.getDiatonicStep("D4"), 1, "D4 should be diatonic step 1");
  assert.strictEqual(MusicTheory.getDiatonicStep("E4"), 2, "E4 should be diatonic step 2");
  assert.strictEqual(MusicTheory.getDiatonicStep("C5"), 7, "C5 should be diatonic step 7");
  assert.strictEqual(MusicTheory.getDiatonicStep("C3"), -7, "C3 should be diatonic step -7");

  console.log("✔ Test 3: Diatonic step positioning passed");
}

// 4. Test Scale Generation
{
  const cMajor = MusicTheory.generateScale("C", "major", 4);
  assert.strictEqual(cMajor.notes.length, 8, "C Major should have 8 notes");
  const pitches = cMajor.notes.map(n => n.pitch);
  assert.deepStrictEqual(pitches, ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"], "C Major pitches match");

  const aMinor = MusicTheory.generateScale("A", "natural_minor", 4);
  const aPitches = aMinor.notes.map(n => n.pitch);
  assert.deepStrictEqual(aPitches, ["A4", "B4", "C5", "D5", "E5", "F5", "G5", "A5"], "A Natural Minor pitches match");

  const cBlues = MusicTheory.generateScale("C", "blues", 4);
  const bluesPitches = cBlues.notes.map(n => n.pitch);
  assert.strictEqual(bluesPitches.length, 7, "Blues scale should have 7 notes including root octave");

  console.log("✔ Test 4: Scale generation passed");
}

// 5. Test Chord Generation & Inversions
{
  const cMajRoot = MusicTheory.generateChord("C", "major", 4, 0);
  assert.deepStrictEqual(cMajRoot.pitches, ["C4", "E4", "G4"], "C Major Root position");

  const cMaj1st = MusicTheory.generateChord("C", "major", 4, 1);
  assert.deepStrictEqual(cMaj1st.pitches, ["E4", "G4", "C5"], "C Major 1st inversion");

  const cMaj2nd = MusicTheory.generateChord("C", "major", 4, 2);
  assert.deepStrictEqual(cMaj2nd.pitches, ["G4", "C5", "E5"], "C Major 2nd inversion");

  console.log("✔ Test 5: Chord & Inversion generation passed");
}

// 6. Test Intervals
{
  const intFifth = MusicTheory.getInterval("C4", "G4");
  assert.strictEqual(intFifth.semitones, 7);
  assert.strictEqual(intFifth.name, "Perfect 5th");

  const intThird = MusicTheory.getInterval("C4", "E4");
  assert.strictEqual(intThird.semitones, 4);
  assert.strictEqual(intThird.name, "Major 3rd");

  const intOctave = MusicTheory.getInterval("C4", "C5");
  assert.strictEqual(intOctave.semitones, 12);
  assert.strictEqual(intOctave.name, "Octave");

  console.log("✔ Test 6: Interval calculation passed");
}

// 7. Test Sight-Reading Flashcard Generator
{
  const card = MusicTheory.getRandomFlashcard("treble_basic");
  assert.ok(card.pitch, "Flashcard should contain a pitch");
  assert.ok(card.options.length >= 4, "Flashcard should contain at least 4 options");
  assert.ok(card.options.includes(card.noteLetter), "Options must include correct note letter");
  assert.strictEqual(card.clef, "treble", "Basic treble card should have treble clef");

  console.log("✔ Test 7: Flashcard generator passed");
}

// 8. Test Ear Training Challenge Generator
{
  const pitchChallenge = MusicTheory.generateEarTrainingChallenge("pitch_match");
  assert.strictEqual(pitchChallenge.type, "pitch_match");
  assert.ok(pitchChallenge.targetPitch);

  const intervalChallenge = MusicTheory.generateEarTrainingChallenge("interval_recognition");
  assert.strictEqual(intervalChallenge.type, "interval_recognition");
  assert.ok(intervalChallenge.options.includes(intervalChallenge.correctInterval));

  const chordChallenge = MusicTheory.generateEarTrainingChallenge("chord_quality");
  assert.strictEqual(chordChallenge.type, "chord_quality");
  assert.ok(chordChallenge.options.includes(chordChallenge.correctQuality));

  console.log("✔ Test 8: Ear training generator passed");
}

// 9. Test Circle of Fifths table
{
  assert.strictEqual(MusicTheory.CIRCLE_OF_FIFTHS.length, 12, "Circle of Fifths must have 12 keys");
  const cEntry = MusicTheory.CIRCLE_OF_FIFTHS.find(k => k.key === "C");
  assert.strictEqual(cEntry.relativeMinor, "Am");
  assert.strictEqual(cEntry.sharps, 0);

  const gEntry = MusicTheory.CIRCLE_OF_FIFTHS.find(k => k.key === "G");
  assert.strictEqual(gEntry.sharps, 1);
  assert.deepStrictEqual(gEntry.accidentalsList, ["F#"]);

  console.log("✔ Test 9: Circle of Fifths table passed");
}

// 10. Test Optional-Octave Parsing & Deduplication Support
{
  assert.strictEqual(MusicTheory.pitchToMidi("C"), 60, "Default octave for C is 4 (MIDI 60)");
  assert.strictEqual(MusicTheory.pitchToMidi("A", 4), 69, "Default octave for A is 4 (MIDI 69)");
  assert.strictEqual(MusicTheory.pitchToMidi("C", 3), 48, "Custom default octave 3 for C yields MIDI 48");
  assert.strictEqual(MusicTheory.getDiatonicStep("C"), 0, "Default octave diatonic step for C is 0");
  assert.strictEqual(MusicTheory.getDiatonicStep("E", 4), 2, "Default octave diatonic step for E is 2");
  assert.strictEqual(MusicTheory.getDiatonicStep("C", 3), -7, "Default octave 3 for C yields diatonic step -7");
  assert.ok(Math.abs(MusicTheory.pitchToFreq("A") - 440) < 0.001, "pitchToFreq without octave defaults to A4 (440Hz)");

  console.log("✔ Test 10: Optional-octave parsing & deduplication support passed");
}

// 11. Test Degree-Aware Enharmonic Scale Spelling & Authentic 12-Key Fingerings
{
  // D Harmonic Minor: D-E-F-G-A-Bb-C#-D (never A#)
  const dHarmMinor = MusicTheory.generateScale("D", "harmonic_minor", 4);
  const dPitches = dHarmMinor.notes.map(n => n.pitch);
  assert.deepStrictEqual(dPitches, ["D4", "E4", "F4", "G4", "A4", "Bb4", "C#5", "D5"], "D Harmonic Minor avoids A# enharmonic collision");

  // G Harmonic Minor: G-A-Bb-C-D-Eb-F#-G (never A# or D#)
  const gHarmMinor = MusicTheory.generateScale("G", "harmonic_minor", 4);
  const gPitches = gHarmMinor.notes.map(n => n.pitch);
  assert.deepStrictEqual(gPitches, ["G4", "A4", "Bb4", "C5", "D5", "Eb5", "F#5", "G5"], "G Harmonic Minor has clean Bb and Eb degrees");

  // F Major: F-G-A-Bb-C-D-E-F with standard RH fingering 1-2-3-4-1-2-3-4
  const fMajor = MusicTheory.generateScale("F", "major", 4);
  const fPitches = fMajor.notes.map(n => n.pitch);
  assert.deepStrictEqual(fPitches, ["F4", "G4", "A4", "Bb4", "C5", "D5", "E5", "F5"], "F Major uses Bb degree");
  const fRhFingers = fMajor.notes.map(n => n.rhFinger);
  assert.deepStrictEqual(fRhFingers, [1, 2, 3, 4, 1, 2, 3, 4], "F Major standard RH fingering avoids thumb on Bb");

  // Bb Major: standard RH fingering 4-1-2-3-1-2-3-4
  const bbMajor = MusicTheory.generateScale("Bb", "major", 4);
  const bbRhFingers = bbMajor.notes.map(n => n.rhFinger);
  assert.deepStrictEqual(bbRhFingers, [4, 1, 2, 3, 1, 2, 3, 4], "Bb Major authentic standard fingering");

  // Eb Major: standard RH fingering 3-1-2-3-4-1-2-3
  const ebMajor = MusicTheory.generateScale("Eb", "major", 4);
  const ebRhFingers = ebMajor.notes.map(n => n.rhFinger);
  assert.deepStrictEqual(ebRhFingers, [3, 1, 2, 3, 4, 1, 2, 3], "Eb Major authentic standard fingering");

  console.log("✔ Test 11: Degree-aware enharmonic scale spelling & 12-key fingerings passed");
}

// 12. Test Chord Progressions & Voice-Leading Optimizer
{
  assert.ok(MusicTheory.PROGRESSION_TEMPLATES, "PROGRESSION_TEMPLATES must exist");
  assert.ok(MusicTheory.PROGRESSION_TEMPLATES.pop_anthem, "Pop anthem must exist");
  assert.ok(MusicTheory.PROGRESSION_TEMPLATES.jazz_turnaround, "Jazz turnaround must exist");
  assert.ok(MusicTheory.PROGRESSION_TEMPLATES.classical_cadence, "Classical cadence must exist");
  assert.ok(MusicTheory.PROGRESSION_TEMPLATES.andalusian, "Andalusian cadence must exist");
  assert.ok(MusicTheory.PROGRESSION_TEMPLATES.doo_wop, "Doo-wop cadence must exist");

  // Verify Chord Info generation
  const cChord = MusicTheory.getNumeralChordInfo("C", "I");
  assert.strictEqual(cChord.chordName, "C", "C I chord is C Major");
  assert.deepStrictEqual(cChord.pitchClasses, [0, 4, 7], "C pitch classes");
  assert.strictEqual(cChord.lhBassPitch, "C3", "C3 bass anchor");

  const gChord = MusicTheory.getNumeralChordInfo("C", "V");
  assert.strictEqual(gChord.chordName, "G", "C V chord is G Major");
  assert.deepStrictEqual(gChord.pitchClasses, [7, 11, 2], "G pitch classes");

  const i64Chord = MusicTheory.getNumeralChordInfo("C", "I64");
  assert.strictEqual(i64Chord.is64, true, "I64 flag set");
  assert.strictEqual(i64Chord.lhBassPitch, "G2", "I64 has 5th in bass (G2)");

  // Verify Voice-Leading Optimization (Pop Anthem: I - V - vi - IV)
  const popResult = MusicTheory.optimizeProgressionVoiceLeading("C", "pop_anthem");
  assert.strictEqual(popResult.steps.length, 4, "Pop Anthem has 4 steps");

  // Step 0: C Major home voicing
  assert.strictEqual(popResult.steps[0].numeral, "I");
  assert.strictEqual(popResult.steps[0].semitoneMovement, 0, "First chord movement is 0");

  // Step 1: G Major - verify minimal motion voice leading (smooth inversion)
  // Instead of jumping up 21 semitones to root position [G4, B4, D5],
  // it uses a close inversion (e.g. [B3, D4, G4]) with semitone movement <= 4!
  assert.strictEqual(popResult.steps[1].numeral, "V");
  assert.ok(popResult.steps[1].semitoneMovement <= 4, `G Major movement must be smooth (got ${popResult.steps[1].semitoneMovement} st)`);

  // Total progression movement across all 4 chords
  assert.ok(popResult.totalMovement <= 10, `Total progression finger movement must be highly efficient (got ${popResult.totalMovement} st)`);

  // Verify Jazz Turnaround (ii7 - V7 - Imaj7 in D Major)
  const jazzResult = MusicTheory.optimizeProgressionVoiceLeading("D", "jazz_turnaround");
  assert.strictEqual(jazzResult.steps.length, 3, "Jazz turnaround has 3 steps");
  assert.strictEqual(jazzResult.steps[0].chordName, "Em7", "ii7 in D is Em7");
  assert.strictEqual(jazzResult.steps[1].chordName, "A7", "V7 in D is A7");
  assert.strictEqual(jazzResult.steps[2].chordName, "Dmaj7", "Imaj7 in D is Dmaj7");

  // Verify Andalusian Cadence (i - VII - VI - V in A Minor)
  const andalusianResult = MusicTheory.optimizeProgressionVoiceLeading("Am", "andalusian");
  assert.strictEqual(andalusianResult.steps.length, 4, "Andalusian has 4 steps");
  assert.strictEqual(andalusianResult.steps[0].chordName, "Am", "i in Am is Am");
  assert.strictEqual(andalusianResult.steps[1].chordName, "G", "VII in Am is G");
  assert.strictEqual(andalusianResult.steps[2].chordName, "F", "VI in Am is F");
  assert.strictEqual(andalusianResult.steps[3].chordName, "E", "V in Am is E");

  console.log("✔ Test 12: Chord Progressions & Voice-Leading Optimizer passed");
}

// 13. Test Adaptive Spaced-Repetition (SRS) Engine & Weighted Selection
{
  const mockStorage = {};
  global.localStorage = {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: (k) => { delete mockStorage[k]; }
  };

  MusicTheory.clearSRSStats();

  // Initially unpracticed note
  assert.strictEqual(MusicTheory.getSRSMasteryLevel("C4"), "new", "Initial state is 'new'");

  // Record 5 fast, flawless attempts on C4
  for (let i = 0; i < 5; i++) {
    MusicTheory.recordSRSAttempt("C4", true, 600);
  }
  const cStats = MusicTheory.getSRSItemStats("C4");
  assert.strictEqual(cStats.attempts, 5, "5 attempts recorded");
  assert.strictEqual(cStats.errors, 0, "0 errors");
  assert.strictEqual(MusicTheory.getSRSMasteryLevel("C4"), "mastered", "C4 is 'mastered'");

  // Record 4 attempts with high error rate & slow response on F2
  MusicTheory.recordSRSAttempt("F2", false, 2800);
  MusicTheory.recordSRSAttempt("F2", false, 2400);
  MusicTheory.recordSRSAttempt("F2", true, 2200);
  MusicTheory.recordSRSAttempt("F2", false, 2600);

  const fStats = MusicTheory.getSRSItemStats("F2");
  assert.strictEqual(fStats.attempts, 4);
  assert.strictEqual(fStats.errors, 3);
  assert.strictEqual(MusicTheory.getSRSMasteryLevel("F2"), "needs_practice", "F2 is 'needs_practice'");

  // Test Weighted Draw Distribution:
  // With weights 3.5 (F2) vs 1.0 (C4), F2 should be drawn roughly 3.5x more often
  const draws = { "C4": 0, "F2": 0, "other": 0 };
  for (let d = 0; d < 1000; d++) {
    const card = MusicTheory.getRandomFlashcard("grand_staff", null, true);
    if (card.pitch === "C4") draws["C4"]++;
    else if (card.pitch === "F2") draws["F2"]++;
    else draws["other"]++;
  }

  // F2 (needs_practice, weight 3.5) must be drawn more frequently than C4 (mastered, weight 1.0)
  assert.ok(draws["F2"] > draws["C4"] * 1.5, `Difficult note (${draws["F2"]}) drawn >1.5x more than mastered note (${draws["C4"]})`);

  console.log("✔ Test 13: Adaptive Spaced-Repetition (SRS) Engine & Weighted Selection passed");
}

// 14. Test Ear Training SRS Weighting, Score Engine Exports & UMD Song Database
{
  // 14.1 UMD Song Database Export Verification
  const songsFromUmd = require("../songs.js");
  assert.ok(Array.isArray(songsFromUmd), "songs.js must export an Array via UMD module.exports");
  assert.strictEqual(songsFromUmd.length, 56, "songs.js must contain 56 songs");

  // 14.2 Score Engine Exports on MusicTheory
  assert.strictEqual(typeof MusicTheory.parseToken, "function", "parseToken must be exported on MusicTheory");
  assert.strictEqual(typeof MusicTheory.getRomanNumeralAnalysis, "function", "getRomanNumeralAnalysis must be exported on MusicTheory");
  assert.strictEqual(typeof MusicTheory.buildScoreModel, "function", "buildScoreModel must be exported on MusicTheory");

  const parsed = MusicTheory.parseToken("F#4+A4:1.5~");
  assert.strictEqual(parsed.pitch, "F#4+A4");
  assert.strictEqual(parsed.beats, 1.5);
  assert.strictEqual(parsed.tied, true);

  const roman = MusicTheory.getRomanNumeralAnalysis({ name: "G Major", type: "Major Triad" }, { category: "C 5-Finger" });
  assert.strictEqual(roman, "V", "G Major in C Major must analyze as V");

  // 14.3 Adaptive SRS Weighting in Ear Training (Pitch Match, Interval, Chord Quality)
  MusicTheory.clearSRSStats();

  // Make E4 'needs_practice' (high errors) and C4 'mastered' (fast & 0 errors)
  for (let i = 0; i < 5; i++) {
    MusicTheory.recordSRSAttempt("C4", true, 500);
  }
  MusicTheory.recordSRSAttempt("E4", false, 2900);
  MusicTheory.recordSRSAttempt("E4", false, 2600);
  MusicTheory.recordSRSAttempt("E4", false, 2500);

  assert.strictEqual(MusicTheory.getSRSMasteryLevel("C4"), "mastered");
  assert.strictEqual(MusicTheory.getSRSMasteryLevel("E4"), "needs_practice");

  const earPitchCounts = { C4: 0, E4: 0 };
  for (let i = 0; i < 800; i++) {
    const ch = MusicTheory.generateEarTrainingChallenge("pitch_match", true);
    assert.ok(ch.srsKey, "Pitch match challenge must return srsKey");
    assert.ok(ch.srsMastery, "Pitch match challenge must return srsMastery");
    if (ch.targetPitch === "C4") earPitchCounts.C4++;
    if (ch.targetPitch === "E4") earPitchCounts.E4++;
  }
  assert.ok(earPitchCounts.E4 > earPitchCounts.C4 * 1.4, `Ear Training SRS must favor needs_practice E4 (${earPitchCounts.E4}) over mastered C4 (${earPitchCounts.C4})`);

  // Interval SRS metadata check
  const intCh = MusicTheory.generateEarTrainingChallenge("interval_recognition", true);
  assert.strictEqual(intCh.srsKey, intCh.correctInterval, "Interval challenge must return interval label as srsKey");
  assert.strictEqual(typeof intCh.srsMastery, "string");

  // Chord Quality SRS metadata check
  const chdCh = MusicTheory.generateEarTrainingChallenge("chord_quality", true);
  assert.strictEqual(chdCh.srsKey, chdCh.correctQuality, "Chord quality challenge must return quality label as srsKey");
  assert.strictEqual(typeof chdCh.srsMastery, "string");

  console.log("✔ Test 14: Ear Training SRS Weighting, Score Engine Exports & UMD Song Database passed");
}

// 15. Test Milestone 36 Beginner Pedagogy & Deep Music Theory Engine
{
  // 15.1 Interval Pedagogy & Song Mnemonics
  assert.ok(MusicTheory.INTERVAL_PEDAGOGY, "INTERVAL_PEDAGOGY must be exported");
  assert.strictEqual(MusicTheory.INTERVAL_PEDAGOGY[4].name, "Major 3rd");
  assert.ok(MusicTheory.INTERVAL_PEDAGOGY[7].mnemonicAsc.includes("Star Wars"), "Perfect 5th ascending mnemonic must include Star Wars");

  const intChal = MusicTheory.generateEarTrainingChallenge("interval_recognition", true);
  assert.strictEqual(typeof intChal.semitones, "number");
  assert.strictEqual(typeof intChal.mnemonicAsc, "string");
  assert.ok(intChal.mnemonicAsc.length > 3, "Interval ear training challenge must include famous song mnemonic");

  // 15.2 Scale Pedagogy: Step Formula, Solfege, Degrees & Thumb-Tuck Transitions
  const cMajScale = MusicTheory.generateScale("C", "major", 4);
  assert.strictEqual(cMajScale.stepFormula, "W - W - H - W - W - W - H");
  assert.strictEqual(cMajScale.notes[0].solfege, "Do");
  assert.strictEqual(cMajScale.notes[0].degree, "1");
  // In C Major RH (1,2,3,1,2,3,4,5), index 3 (F4) is where thumb tucks under finger 3
  assert.strictEqual(cMajScale.notes[3].pitch, "F4");
  assert.strictEqual(cMajScale.notes[3].degreeIndex, 3, "Scale note must include numeric degreeIndex");
  const prevRhNote = cMajScale.notes[Math.max(0, cMajScale.notes[3].degreeIndex - 1)];
  assert.strictEqual(prevRhNote.pitch, "E4", "Previous note before F4 thumb-tuck must resolve to E4");
  assert.ok(cMajScale.notes[3].rhTransition && cMajScale.notes[3].rhTransition.includes("Thumb Tuck"), "F4 in C Major RH must have Thumb Tuck transition");
  // In C Major LH (5,4,3,2,1,3,2,1), index 5 (A4) is where finger 3 crosses over thumb 1
  assert.strictEqual(cMajScale.notes[5].pitch, "A4");
  assert.strictEqual(cMajScale.notes[5].degreeIndex, 5, "Scale note at index 5 must have degreeIndex 5");
  const prevLhNote = cMajScale.notes[Math.max(0, cMajScale.notes[5].degreeIndex - 1)];
  assert.strictEqual(prevLhNote.pitch, "G4", "Previous note before A4 crossover must resolve to G4");
  assert.ok(cMajScale.notes[5].lhTransition && cMajScale.notes[5].lhTransition.includes("Finger Cross"), "A4 in C Major LH must have Finger Cross transition");

  const aMinScale = MusicTheory.generateScale("A", "natural_minor", 4);
  assert.strictEqual(aMinScale.stepFormula, "W - H - W - W - H - W - W");
  assert.strictEqual(aMinScale.notes[2].degree, "♭3");
  assert.strictEqual(aMinScale.notes[2].solfege, "Me");

  const pedInfo = MusicTheory.getScalePedagogyInfo("G", "major", 4);
  assert.strictEqual(pedInfo.stepFormula, "W - W - H - W - W - W - H");
  assert.strictEqual(pedInfo.thumbTucksRH.length, 1);
  assert.strictEqual(pedInfo.fingerCrossesLH.length, 1);

  // 15.3 Chord Construction Recipe & Inversions
  const cMajRecipe = MusicTheory.getChordConstructionRecipe("C", "major", 4, 0);
  assert.ok(cMajRecipe.recipe.includes("Major 3rd") && cMajRecipe.recipe.includes("Perfect 5th"));
  assert.strictEqual(cMajRecipe.stepMath, "4 half-steps + 3 half-steps");
  assert.strictEqual(cMajRecipe.tones.length, 3);
  assert.strictEqual(cMajRecipe.tones[0].roleLabel, "Root (1)");
  assert.strictEqual(cMajRecipe.tones[1].roleLabel, "Major 3rd (3)");
  assert.strictEqual(cMajRecipe.tones[2].roleLabel, "Perfect 5th (5)");

  // 15.4 Diatonic 7-Chord Family Generator (Major & Minor Keys)
  const cFamily = MusicTheory.generateDiatonicChordFamily("C");
  assert.strictEqual(cFamily.chords.length, 7);
  assert.strictEqual(cFamily.chords[0].roman, "I");
  assert.strictEqual(cFamily.chords[0].symbol, "C");
  assert.strictEqual(cFamily.chords[1].roman, "ii");
  assert.strictEqual(cFamily.chords[1].symbol, "Dm");
  assert.strictEqual(cFamily.chords[4].roman, "V");
  assert.strictEqual(cFamily.chords[4].symbol, "G");
  assert.strictEqual(cFamily.chords[6].roman, "vii°");
  assert.strictEqual(cFamily.chords[6].symbol, "Bdim");

  const amFamily = MusicTheory.generateDiatonicChordFamily("Am");
  assert.strictEqual(amFamily.isMinor, true);
  assert.strictEqual(amFamily.chords[0].roman, "i");
  assert.strictEqual(amFamily.chords[0].symbol, "Am");

  // 15.5 Engraved Key Signature Staff Info
  const gSig = MusicTheory.getKeySignatureStaffInfo("G");
  assert.strictEqual(gSig.accidentalType, "sharps");
  assert.strictEqual(gSig.count, 1);
  assert.strictEqual(gSig.symbols[0].note, "F#");
  assert.ok(gSig.ruleText.includes("G Major"), "Key rule text for G Major must explain how to find G");

  const fSig = MusicTheory.getKeySignatureStaffInfo("F");
  assert.strictEqual(fSig.accidentalType, "flats");
  assert.strictEqual(fSig.count, 1);
  assert.strictEqual(fSig.symbols[0].note, "Bb");

  // 15.6 Beginner Bootcamp Curriculum (7 Interactive Modules)
  assert.ok(Array.isArray(MusicTheory.BEGINNER_BOOTCAMP_MODULES), "BEGINNER_BOOTCAMP_MODULES must be an array");
  assert.strictEqual(MusicTheory.BEGINNER_BOOTCAMP_MODULES.length, 7, "Bootcamp must contain 7 interactive modules");
  MusicTheory.BEGINNER_BOOTCAMP_MODULES.forEach(mod => {
    assert.ok(mod.id && mod.title && Array.isArray(mod.steps), "Each bootcamp module must have id, title, and steps");
    assert.ok(mod.interactiveTask && Array.isArray(mod.interactiveTask.targetNotes) && mod.interactiveTask.targetNotes.length > 0, "Each module must have interactive targetNotes");
  });

  // 15.7 Song Theory DNA & Warmup Analyzer
  const allSongs = require("../songs.js");
  const odeSong = allSongs.find(s => s.id === "ode-to-joy") || allSongs[0];
  const dna = MusicTheory.analyzeSongTheoryDNA(odeSong);
  assert.ok(dna, "analyzeSongTheoryDNA must return DNA object");
  assert.strictEqual(typeof dna.keySignature, "string");
  assert.strictEqual(typeof dna.timeSignature, "string");
  assert.ok(dna.warmupScale && Array.isArray(dna.warmupScale.notes), "DNA must include warmupScale notes");
  assert.ok(Array.isArray(dna.primaryChords), "DNA must include primaryChords array");

  const leanSong = allSongs.find(s => s.id === "lean-on-me");
  const leanDna = MusicTheory.analyzeSongTheoryDNA(leanSong, { rh: true, lh: true, dyads: false, lhStyle: "roots" });
  assert.deepStrictEqual(leanDna.primaryChords.map(c => c.label), ["I (C)", "IV (F)", "V (G)"], "Lean on Me DNA chords must be clean I (C), IV (F), V (G)");
  assert.ok(leanDna.totalNotes > 50, "Lean on Me totalNotes must reflect actual playable steps rather than scale length 8");

  console.log("✔ Test 15: 🎓 Milestone 36 Beginner Pedagogy, Bootcamp, Diatonic Family & Song Theory DNA passed");
}

console.log("=== ALL 15 EDUCATION SUITE TESTS PASSED SUCCESSFULLY! ===");



