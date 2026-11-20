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
  assert.strictEqual(songsFromUmd.length, 80, "songs.js must contain 80 songs");

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

// 16. Test Milestone 38 Live BPM Proximity & Rhythm Stability Graph Engine
{
  assert.strictEqual(typeof MusicTheory.analyzeRhythmTapHistory, "function", "analyzeRhythmTapHistory must be exported on MusicTheory");

  // 16.1 Empty tap history state (after Clear Data)
  const emptyStats = MusicTheory.analyzeRhythmTapHistory([], 100);
  assert.strictEqual(emptyStats.tapCount, 0);
  assert.strictEqual(emptyStats.currentBpm, null);
  assert.strictEqual(emptyStats.averageBpm, null);
  assert.strictEqual(emptyStats.points.length, 0);

  // 16.2 Single tap state
  const oneTap = MusicTheory.analyzeRhythmTapHistory([{ timestamp: 1000, instantBpm: null, targetBpm: 100, offsetMs: 12 }], 100);
  assert.strictEqual(oneTap.tapCount, 1);
  assert.strictEqual(oneTap.validBpmCount, 0);
  assert.strictEqual(oneTap.avgOffsetMs, 12);

  // 16.3 Multi-tap sequence: Locked In (100 BPM = 600ms intervals), Rushing (110 BPM), Dragging (88 BPM)
  const tapSeq = [
    { timestamp: 0, instantBpm: null, targetBpm: 100, offsetMs: 5 },
    { timestamp: 600, instantBpm: 100, targetBpm: 100, offsetMs: -4 },
    { timestamp: 1190, instantBpm: 101.7, targetBpm: 100, offsetMs: -10 },
    { timestamp: 1735, instantBpm: 110.1, targetBpm: 100, offsetMs: -25 },
    { timestamp: 2417, instantBpm: 88.0, targetBpm: 100, offsetMs: 30 }
  ];
  const stats = MusicTheory.analyzeRhythmTapHistory(tapSeq, 100, 24);
  assert.strictEqual(stats.tapCount, 5);
  assert.strictEqual(stats.validBpmCount, 4);
  assert.strictEqual(stats.points.length, 4);
  assert.strictEqual(stats.points[0].zone, "locked", "100 BPM vs 100 target is locked");
  assert.strictEqual(stats.points[1].zone, "locked", "101.7 BPM vs 100 target is locked (±3 BPM)");
  assert.strictEqual(stats.points[2].zone, "rushing", "110.1 BPM vs 100 target is rushing (> +7 BPM)");
  assert.strictEqual(stats.points[3].zone, "dragging", "88.0 BPM vs 100 target is dragging (< -7 BPM)");
  assert.strictEqual(stats.currentBpm, 88);
  assert.strictEqual(stats.bpmDelta, -12);
  assert.ok(typeof stats.stabilityScore === "number" && stats.stabilityScore >= 0 && stats.stabilityScore <= 100);

  console.log("✔ Test 16: 📈 Milestone 38 Live BPM Proximity & Rhythm Stability Graph Engine passed");
}

// 17. Test Milestone 39 Hardware Audio Output Discovery, Multi-Channel Audio Routing & Multi-Channel MIDI Output Engine
{
  assert.strictEqual(typeof MusicTheory.filterAudioOutputDevices, "function", "filterAudioOutputDevices must be exported");
  assert.ok(MusicTheory.AUDIO_OUTPUT_CHANNEL_MODES && typeof MusicTheory.AUDIO_OUTPUT_CHANNEL_MODES === "object", "AUDIO_OUTPUT_CHANNEL_MODES must be exported");
  assert.strictEqual(typeof MusicTheory.getAudioChannelRoutingOptions, "function", "getAudioChannelRoutingOptions must be exported");
  assert.strictEqual(typeof MusicTheory.computeAudioChannelGains, "function", "computeAudioChannelGains must be exported");
  assert.strictEqual(typeof MusicTheory.resolveMidiOutputChannels, "function", "resolveMidiOutputChannels must be exported");

  // 17.1 Audio Output Device Normalization (empty pre-permission deviceId & authorized devices merge)
  const rawDevices = [
    { kind: "audiooutput", deviceId: "", label: "" },
    { kind: "audiooutput", deviceId: "communications", label: "Communications Headphones" },
    { kind: "audioinput", deviceId: "mic-1", label: "USB Microphone" }
  ];
  const authorizedExtra = [
    { kind: "audiooutput", deviceId: "usb-dac-99", label: "Focusrite Scarlett 4i4 USB" }
  ];
  const filtered = MusicTheory.filterAudioOutputDevices(rawDevices, authorizedExtra);
  assert.strictEqual(filtered.length, 3, "Must include normalized default, communications, and authorized USB DAC");
  assert.strictEqual(filtered[0].deviceId, "default", "Empty pre-permission deviceId must normalize to 'default'");
  assert.ok(filtered.some(d => d.deviceId === "usb-dac-99" && d.label === "Focusrite Scarlett 4i4 USB"), "Authorized device from selectAudioOutput must be merged");

  // 17.2 Audio Channel Routing Options by Hardware Channel Count
  const stereoOpts = MusicTheory.getAudioChannelRoutingOptions(2);
  const primaryOpts = stereoOpts.filter(o => o.group === "primary");
  assert.strictEqual(primaryOpts.length, 5, "Primary group must expose 5 stereo/channel routing modes");
  assert.deepStrictEqual(primaryOpts.map(o => o.id), ["stereo", "ch1", "ch2", "split_hands", "mono"]);

  const multi8Opts = MusicTheory.getAudioChannelRoutingOptions(8);
  assert.ok(multi8Opts.some(o => o.id === "ch3_4" && o.isHardwareNative), "8-channel interface must expose native Ch 3+4 stereo pair");
  assert.ok(multi8Opts.some(o => o.id === "ch5_6" && o.isHardwareNative), "8-channel interface must expose native Ch 5+6 stereo pair");
  assert.ok(multi8Opts.some(o => o.id === "ch7_8" && o.isHardwareNative), "8-channel interface must expose native Ch 7+8 stereo pair");
  assert.ok(multi8Opts.some(o => o.id === "ch3") && multi8Opts.some(o => o.id === "ch8"), "8-channel interface must expose discrete Ch 3..8 outputs");
  assert.ok(multi8Opts.some(o => o.id === "all_multi"), "Multi-channel interface must expose all_multi broadcast mode");

  // 17.3 Audio Channel Gain Matrix Computation (Stereo, Ch 1 Left Only, Ch 2 Right Only, Split Hands LH/RH, Multi-Channel)
  const stereoGains = MusicTheory.computeAudioChannelGains("stereo", 2, "center");
  assert.deepStrictEqual(stereoGains.gains, [1, 1], "Stereo mode routes full gain to Ch 1 and Ch 2");
  assert.deepStrictEqual(stereoGains.leftBusGains, [1, 0], "Stereo mode routes Left bus to Ch 1");
  assert.deepStrictEqual(stereoGains.rightBusGains, [0, 1], "Stereo mode routes Right bus to Ch 2");

  const ch1Gains = MusicTheory.computeAudioChannelGains("ch1", 2, "center");
  assert.deepStrictEqual(ch1Gains.gains, [1, 0], "Ch 1 mode routes exclusively to Ch 1 (Left) and mutes Ch 2");

  const ch2Gains = MusicTheory.computeAudioChannelGains("ch2", 2, "center");
  assert.deepStrictEqual(ch2Gains.gains, [0, 1], "Ch 2 mode routes exclusively to Ch 2 (Right) and mutes Ch 1");

  const splitLh = MusicTheory.computeAudioChannelGains("split_hands", 2, "lh");
  const splitRh = MusicTheory.computeAudioChannelGains("split_hands", 2, "rh");
  assert.deepStrictEqual(splitLh.gains, [1, 0], "Split Hands routes LH strictly to Ch 1 (Left)");
  assert.deepStrictEqual(splitRh.gains, [0, 1], "Split Hands routes RH strictly to Ch 2 (Right)");
  assert.deepStrictEqual(splitLh.leftBusGains, [1, 0], "Split Hands maps Left/LH bus to Ch 1");
  assert.deepStrictEqual(splitRh.rightBusGains, [0, 1], "Split Hands maps Right/RH bus to Ch 2");

  const ch34Gains = MusicTheory.computeAudioChannelGains("ch3_4", 4, "center");
  assert.deepStrictEqual(ch34Gains.gains, [0, 0, 1, 1], "Ch 3+4 mode mutes Ch 1-2 and activates Ch 3-4");

  const ch5Gains = MusicTheory.computeAudioChannelGains("ch5", 8, "center");
  assert.deepStrictEqual(ch5Gains.gains, [0, 0, 0, 0, 1, 0, 0, 0], "Discrete Ch 5 mode activates only hardware index 4");

  const allMultiGains = MusicTheory.computeAudioChannelGains("all_multi", 6, "center");
  assert.deepStrictEqual(allMultiGains.gains, [1, 1, 1, 1, 1, 1], "all_multi activates all 6 hardware channels");

  // 17.4 Multi-Channel MIDI Output Resolution (Individual Ch 1..16, Split Hands, Omni Broadcast)
  assert.deepStrictEqual(MusicTheory.resolveMidiOutputChannels("1", "rh"), [1], "Channel 1 resolves to channel [1]");
  assert.deepStrictEqual(MusicTheory.resolveMidiOutputChannels("10", "rh"), [10], "Channel 10 resolves to channel [10]");
  assert.deepStrictEqual(MusicTheory.resolveMidiOutputChannels("16", "lh"), [16], "Channel 16 resolves to channel [16]");
  assert.deepStrictEqual(MusicTheory.resolveMidiOutputChannels("split", "rh"), [1], "Split Hands MIDI routes RH to Ch 1");
  assert.deepStrictEqual(MusicTheory.resolveMidiOutputChannels("split", "lh"), [2], "Split Hands MIDI routes LH to Ch 2");
  assert.deepStrictEqual(MusicTheory.resolveMidiOutputChannels("split", "dyad"), [3], "Split Hands MIDI routes Dyads to Ch 3");
  const omniChannels = MusicTheory.resolveMidiOutputChannels("omni_out", "rh");
  assert.strictEqual(omniChannels.length, 16, "omni_out broadcasts across all 16 MIDI channels");
  assert.strictEqual(omniChannels[0], 1);
  assert.strictEqual(omniChannels[15], 16);

  console.log("✔ Test 17: 🔊 Milestone 39 Hardware Audio Output Discovery, Multi-Channel Audio Routing & Multi-Channel MIDI Output Engine passed");
}

// ==========================================
// TEST 18: Milestone 40 Multi-Instrument Song Synthesis Engine, Timbre Library & Song Instrument Presets
// ==========================================
{
  // 18.1 INSTRUMENT_PRESETS Definition & Verification
  assert.ok(MusicTheory.INSTRUMENT_PRESETS, "MusicTheory must export INSTRUMENT_PRESETS");
  const expectedInstruments = [
    "grand_piano", "electric_piano", "harpsichord", "church_organ",
    "rock_organ", "celesta", "acoustic_guitar", "chiptune",
    "strings_synth", "vibraphone", "honky_tonk"
  ];
  assert.strictEqual(Object.keys(MusicTheory.INSTRUMENT_PRESETS).length, 11, "Must contain exactly 11 authentic instrument models");
  expectedInstruments.forEach(id => {
    const inst = MusicTheory.INSTRUMENT_PRESETS[id];
    assert.ok(inst, `Instrument ${id} must exist in INSTRUMENT_PRESETS`);
    assert.strictEqual(inst.id, id, `Instrument ${id} must have matching id`);
    assert.ok(inst.name && inst.name.length > 0, `Instrument ${id} must have display name`);
    assert.ok(inst.shortName && inst.shortName.length > 0, `Instrument ${id} must have shortName`);
    assert.ok(inst.icon && inst.icon.length > 0, `Instrument ${id} must have an icon`);
    assert.ok(inst.category, `Instrument ${id} must have a category`);
    assert.ok(typeof inst.attackSec === "number" && inst.attackSec >= 0, `Instrument ${id} must define attackSec`);
    assert.ok(typeof inst.decaySec === "number", `Instrument ${id} must define decaySec`);
    assert.ok(typeof inst.sustainLevel === "number" && inst.sustainLevel >= 0 && inst.sustainLevel <= 1.0, `Instrument ${id} must define sustainLevel between 0 and 1`);
    assert.ok(typeof inst.releaseSec === "number" && inst.releaseSec > 0, `Instrument ${id} must define releaseSec`);
    assert.ok(typeof inst.velocitySensitivity === "number", `Instrument ${id} must define velocitySensitivity`);
  });

  // 18.2 Harpsichord Velocity Invariance & Organ Continuous Sustain
  assert.strictEqual(MusicTheory.INSTRUMENT_PRESETS.harpsichord.velocitySensitivity, 0.0, "Harpsichord must be velocity invariant (velocitySensitivity = 0)");
  assert.strictEqual(MusicTheory.INSTRUMENT_PRESETS.church_organ.sustainLevel, 1.0, "Church Organ must have 100% continuous sustain while held");
  assert.strictEqual(MusicTheory.INSTRUMENT_PRESETS.chiptune.icon, "👾", "Chiptune must have retro gaming icon");

  // 18.3 getSongDefaultInstrument Heuristic & Song Attribute Resolution
  assert.strictEqual(MusicTheory.getSongDefaultInstrument({ id: "custom", instrument: "vibraphone" }), "vibraphone", "Explicit song.instrument takes highest priority");
  assert.strictEqual(MusicTheory.getSongDefaultInstrument({ id: "korobeiniki-tetris", title: "Tetris" }), "chiptune", "Tetris resolves to chiptune");
  assert.strictEqual(MusicTheory.getSongDefaultInstrument({ id: "hedwigs-theme", title: "Hedwig's Theme" }), "celesta", "Hedwig's Theme resolves to celesta");
  assert.strictEqual(MusicTheory.getSongDefaultInstrument({ id: "pink-panther", title: "The Pink Panther" }), "vibraphone", "Pink Panther resolves to vibraphone");
  assert.strictEqual(MusicTheory.getSongDefaultInstrument({ id: "the-entertainer", title: "The Entertainer" }), "honky_tonk", "The Entertainer resolves to honky_tonk");
  assert.strictEqual(MusicTheory.getSongDefaultInstrument({ id: "bach-minuet-g", title: "Minuet in G" }), "harpsichord", "Bach Minuet resolves to harpsichord");
  assert.strictEqual(MusicTheory.getSongDefaultInstrument({ id: "smoke-on-the-water", title: "Smoke on the Water" }), "rock_organ", "Smoke on the Water resolves to rock_organ");
  assert.strictEqual(MusicTheory.getSongDefaultInstrument({ id: "amazing-grace", title: "Amazing Grace" }), "church_organ", "Amazing Grace resolves to church_organ");
  assert.strictEqual(MusicTheory.getSongDefaultInstrument({ id: "lean-on-me", title: "Lean on Me" }), "electric_piano", "Lean on Me resolves to electric_piano");
  assert.strictEqual(MusicTheory.getSongDefaultInstrument({ id: "scarborough-fair", title: "Scarborough Fair" }), "acoustic_guitar", "Scarborough Fair resolves to acoustic_guitar");
  assert.strictEqual(MusicTheory.getSongDefaultInstrument({ id: "fur-elise", title: "Für Elise" }), "grand_piano", "Für Elise resolves to grand_piano");
  assert.strictEqual(MusicTheory.getSongDefaultInstrument(null), "grand_piano", "Null song gracefully falls back to grand_piano");

  // 18.4 getInstrumentParameters Retrieval & Fallback
  const ep = MusicTheory.getInstrumentParameters("electric_piano");
  assert.strictEqual(ep.id, "electric_piano");
  assert.strictEqual(ep.shortName, "Electric Piano");
  const fallback = MusicTheory.getInstrumentParameters("non_existent_preset");
  assert.strictEqual(fallback.id, "grand_piano", "Non-existent preset falls back to grand_piano");

  console.log("✔ Test 18: 🎹 Milestone 40 Multi-Instrument Song Synthesis Engine & Timbre Library passed");
}

// ==========================================
// TEST 19: 🎛️ Milestone 42 Playback Transport Timeline, Loop Bounds, Speed % & Clock Formatting
// ==========================================
{
  const sampleSteps = [
    { stepIndex: 0, measure: 1, beats: 2 },
    { stepIndex: 1, measure: 1, beats: 2 },
    { stepIndex: 2, measure: 2, beats: 1 },
    { stepIndex: 3, measure: 2, beats: 3 },
    { stepIndex: 4, measure: 3, beats: 4 },
    { stepIndex: 5, measure: 4, beats: 2 }
  ];

  // 19.1 buildPlaybackTimeline
  const tl44 = MusicTheory.buildPlaybackTimeline(sampleSteps, "4/4");
  assert.strictEqual(tl44.totalBeats, 14, "Total beats across sample steps must equal 14");
  assert.strictEqual(tl44.totalMeasures, 4, "Total measures must equal 4");
  assert.strictEqual(tl44.beatsPerMeasure, 4, "4/4 beatsPerMeasure must equal 4");
  assert.strictEqual(tl44.stepTimings.length, 6);
  assert.strictEqual(tl44.stepTimings[0].startBeat, 0);
  assert.strictEqual(tl44.stepTimings[0].endBeat, 2);
  assert.strictEqual(tl44.stepTimings[2].startBeat, 4);
  assert.strictEqual(tl44.stepTimings[5].startBeat, 12);
  assert.strictEqual(tl44.stepTimings[5].endBeat, 14);
  assert.strictEqual(tl44.measureStartSteps[1], 0);
  assert.strictEqual(tl44.measureStartSteps[2], 2);
  assert.strictEqual(tl44.measureStartSteps[3], 4);
  assert.strictEqual(tl44.measureStartSteps[4], 5);
  assert.strictEqual(tl44.measureStartBeats[3], 8);

  const tl34 = MusicTheory.buildPlaybackTimeline([], "3/4");
  assert.strictEqual(tl34.totalBeats, 0, "Empty timeline has 0 beats");
  assert.strictEqual(tl34.totalMeasures, 0, "Empty timeline has 0 measures");
  assert.strictEqual(tl34.beatsPerMeasure, 3, "3/4 beatsPerMeasure must equal 3");

  // 19.2 resolveLoopStepBounds
  const loopOff = MusicTheory.resolveLoopStepBounds(sampleSteps, false, 2, 3);
  assert.strictEqual(loopOff.active, false, "Disabled loop reports active: false");

  const loopNormal = MusicTheory.resolveLoopStepBounds(sampleSteps, true, 2, 3);
  assert.strictEqual(loopNormal.active, true);
  assert.strictEqual(loopNormal.startMeasure, 2);
  assert.strictEqual(loopNormal.endMeasure, 3);
  assert.strictEqual(loopNormal.startStepIndex, 2);
  assert.strictEqual(loopNormal.endStepIndex, 4);

  const loopSwapped = MusicTheory.resolveLoopStepBounds(sampleSteps, true, 4, 2);
  assert.strictEqual(loopSwapped.startMeasure, 2, "Reversed bounds auto-swap startMeasure");
  assert.strictEqual(loopSwapped.endMeasure, 4, "Reversed bounds auto-swap endMeasure");
  assert.strictEqual(loopSwapped.startStepIndex, 2);
  assert.strictEqual(loopSwapped.endStepIndex, 5);

  const loopClamped = MusicTheory.resolveLoopStepBounds(sampleSteps, true, -5, 99);
  assert.strictEqual(loopClamped.startMeasure, 1, "Out-of-range start clamps to 1");
  assert.strictEqual(loopClamped.endMeasure, 4, "Out-of-range end clamps to totalMeasures (4)");

  const loopEmpty = MusicTheory.resolveLoopStepBounds([], true, 1, 4);
  assert.strictEqual(loopEmpty.active, false);
  assert.strictEqual(loopEmpty.totalMeasures, 0);

  // 19.3 computeTempoFromSpeedPercent
  assert.strictEqual(MusicTheory.computeTempoFromSpeedPercent(120, 50), 60, "50% of 120 BPM = 60");
  assert.strictEqual(MusicTheory.computeTempoFromSpeedPercent(100, 75), 75, "75% of 100 BPM = 75");
  assert.strictEqual(MusicTheory.computeTempoFromSpeedPercent(96, 100), 96, "100% of 96 BPM = 96");
  assert.strictEqual(MusicTheory.computeTempoFromSpeedPercent(96, 125), 120, "125% of 96 BPM = 120");
  assert.strictEqual(MusicTheory.computeTempoFromSpeedPercent(50, 50, 30, 220), 30, "Clamps to minBpm 30");
  assert.strictEqual(MusicTheory.computeTempoFromSpeedPercent(200, 125, 30, 220), 220, "Clamps to maxBpm 220");

  // 19.4 findStepAtBeat
  assert.strictEqual(MusicTheory.findStepAtBeat(tl44, 0), 0, "Beat 0 maps to step 0");
  assert.strictEqual(MusicTheory.findStepAtBeat(tl44, 1.5), 0, "Beat 1.5 falls inside step 0 [0..2)");
  assert.strictEqual(MusicTheory.findStepAtBeat(tl44, 2.0), 1, "Beat 2.0 lands cleanly on step 1");
  assert.strictEqual(MusicTheory.findStepAtBeat(tl44, 6.5), 3, "Beat 6.5 falls inside step 3 [5..8)");
  assert.strictEqual(MusicTheory.findStepAtBeat(tl44, 999), 5, "Overshoot clamps to final step");
  assert.strictEqual(MusicTheory.findStepAtBeat(tl44, -4), 0, "Negative beat clamps to step 0");
  assert.strictEqual(MusicTheory.findStepAtBeat(tl34, 2), 0, "Empty timeline safely returns 0");

  // 19.5 formatPlaybackClock
  const clkZero = MusicTheory.formatPlaybackClock(0, 48, 96);
  assert.strictEqual(clkZero.elapsedSec, 0);
  assert.strictEqual(clkZero.totalSec, 30);
  assert.strictEqual(clkZero.formatted, "0:00 / 0:30");

  const clkRollover = MusicTheory.formatPlaybackClock(96, 120, 96);
  assert.strictEqual(clkRollover.elapsedSec, 60);
  assert.strictEqual(clkRollover.totalSec, 75);
  assert.strictEqual(clkRollover.formatted, "1:00 / 1:15");

  console.log("✔ Test 19: 🎛️ Milestone 42 Playback Transport Timeline, Loop Bounds, Speed % & Clock Formatting passed");
}

// ==========================================
// TEST 20: 🎹 Milestone 43 GM Program Change, Per-Voice Ties, Attack Gate & Tempo Flow Precision
// ==========================================
{
  const songDatabase = require("../songs.js");

  // 20.1 GM Program Numbers & MIDI Program Change Messages
  Object.values(MusicTheory.INSTRUMENT_PRESETS).forEach(inst => {
    assert.ok(typeof inst.gmProgram === "number" && inst.gmProgram >= 0 && inst.gmProgram <= 127, `${inst.id} must define valid gmProgram (0..127)`);
  });
  assert.deepStrictEqual(MusicTheory.createMidiProgramChange(4, 1), [0xC0, 4], "Program change Ch 1 Electric Piano");
  assert.deepStrictEqual(MusicTheory.createMidiProgramChange(19, 2), [0xC1, 19], "Program change Ch 2 Church Organ");
  assert.deepStrictEqual(MusicTheory.createMidiProgramChange(200, 99), [0xCF, 127], "Program & channel clamp safely");

  // 20.2 Per-Voice Cross-Step Tie Model (2-hand Lean on Me + 3-step chain + rest break)
  const lean = songDatabase.find(s => s.id === "lean-on-me");
  const leanModel = MusicTheory.buildScoreModel(lean, true, true, false);
  const m2Step0 = leanModel.measures[1][0];
  const m1Last = leanModel.measures[0][leanModel.measures[0].length - 1];
  assert.strictEqual(m2Step0.tiedFromPrev, true, "Lean on Me M2 Beat 0 has tied RH note F4");
  assert.deepStrictEqual(m2Step0.tiedPitches, ["F4"], "Only RH F4 is in tiedPitches; untied LH F2 is NOT treated as tied");
  assert.deepStrictEqual(m2Step0.newExpectedPitches, ["F2"], "LH F2 remains a fresh required note attack");
  assert.strictEqual(m2Step0.rh.isTiedContinuation, true, "RH F4:2 is marked as tied continuation");
  assert.strictEqual(m1Last.rh.tiedTotalBeats, 2.5, "Chain head F4:0.5~ accumulates 0.5 + 2.0 = 2.5 beats");

  const chainSong = { timeSig: "4/4", rh: "C4:1~ C4:1~ C4:2 | C4:1~ -:1 C4:2", lh: "C3:4 | C3:4", dyads: "" };
  const chainModel = MusicTheory.buildScoreModel(chainSong, true, false, false);
  assert.strictEqual(chainModel.steps[0].rh.tiedTotalBeats, 4, "3-step tie chain sums to 4 beats on head event");
  assert.strictEqual(chainModel.steps[1].rh.isTiedContinuation, true);
  assert.strictEqual(chainModel.steps[2].rh.isTiedContinuation, true);
  assert.strictEqual(chainModel.steps[5].tiedFromPrev, false, "Intervening rest breaks tie chain cleanly");

  // 20.3 Repeated-Note Anti-Skip & Switch-Bounce Attack Gate
  const heldGate = MusicTheory.evaluateRepeatedNoteAttackGate({ isCurrentlyHeld: true, nowMs: 2000, lastReleaseMs: 0, debounceMs: 30 });
  assert.deepStrictEqual(heldGate, { allowed: false, reason: "already_held" }, "Held key without release must ALWAYS be rejected");

  const bounceGate = MusicTheory.evaluateRepeatedNoteAttackGate({ isCurrentlyHeld: false, nowMs: 1020, lastReleaseMs: 1005, debounceMs: 30 });
  assert.deepStrictEqual(bounceGate, { allowed: false, reason: "switch_bounce" }, "Sub-30ms contact bounce after release is rejected");

  const freshGate = MusicTheory.evaluateRepeatedNoteAttackGate({ isCurrentlyHeld: false, nowMs: 1045, lastReleaseMs: 1005, debounceMs: 30 });
  assert.deepStrictEqual(freshGate, { allowed: true, reason: "fresh_attack" }, "Deliberate release & re-press >= 30ms is accepted");

  // 20.4 Hold Duration Evaluation
  assert.strictEqual(MusicTheory.evaluateNoteHoldDuration(100, 120, 1.0).category, "staccato");
  assert.strictEqual(MusicTheory.evaluateNoteHoldDuration(500, 120, 1.0).category, "flawless");
  assert.strictEqual(MusicTheory.evaluateNoteHoldDuration(300, 120, 1.0).category, "good");
  assert.strictEqual(MusicTheory.evaluateNoteHoldDuration(900, 120, 1.0).category, "tenuto");

  // 20.5 Tempo Flow Hit Evaluator (Early Lookahead, Multi-Note Chords & Late Grace)
  const flowSteps = [
    { stepIndex: 0, beats: 1, expectedPitches: ["E4"] },
    { stepIndex: 1, beats: 1, expectedPitches: ["E4"] },
    { stepIndex: 2, beats: 1, expectedPitches: ["F4", "C3"] },
    { stepIndex: 3, beats: 1, expectedPitches: [] },
    { stepIndex: 4, beats: 1, expectedPitches: ["G4"] }
  ];
  const onsets = [1000, 1500, 2000, 2500, 3000];
  const fulfilled = new Map();

  // Play step 0 on time (+10ms)
  const h0 = MusicTheory.evaluateTempoFlowHit({ hitTimeMs: 1010, steps: flowSteps, stepOnsetTimes: onsets, currentStepIndex: 0, playedPitch: "E4", stepFulfilledSets: fulfilled, bpm: 120 });
  assert.strictEqual(h0.matched, true);
  assert.strictEqual(h0.stepIndex, 0);
  assert.strictEqual(h0.grade, "PERFECT");
  fulfilled.set(0, new Set([h0.matchedPitch]));

  // Anticipate repeated note step 1 early by -20ms while playhead is still on step 0
  const h1 = MusicTheory.evaluateTempoFlowHit({ hitTimeMs: 1480, steps: flowSteps, stepOnsetTimes: onsets, currentStepIndex: 0, playedPitch: "E4", stepFulfilledSets: fulfilled, bpm: 120 });
  assert.strictEqual(h1.matched, true);
  assert.strictEqual(h1.stepIndex, 1, "Anticipated repeated note matches step 1 instead of failing");
  assert.strictEqual(h1.offsetMs, -20);
  assert.strictEqual(h1.grade, "PERFECT");
  fulfilled.set(1, new Set([h1.matchedPitch]));

  // Anticipate step 2 first pitch by -75ms -> GOOD
  const h2a = MusicTheory.evaluateTempoFlowHit({ hitTimeMs: 1925, steps: flowSteps, stepOnsetTimes: onsets, currentStepIndex: 1, playedPitch: "F4", stepFulfilledSets: fulfilled, bpm: 120 });
  assert.strictEqual(h2a.stepIndex, 2);
  assert.strictEqual(h2a.grade, "GOOD");
  fulfilled.set(2, new Set([h2a.matchedPitch]));

  // Re-playing F4 on step 2 must not re-match F4; C3 completes the chord on step 2 (+25ms -> PERFECT)
  const h2Dup = MusicTheory.evaluateTempoFlowHit({ hitTimeMs: 2010, steps: flowSteps, stepOnsetTimes: onsets, currentStepIndex: 2, playedPitch: "F4", stepFulfilledSets: fulfilled, bpm: 120 });
  assert.strictEqual(h2Dup.matched, false, "Already-fulfilled chord pitch does not double match");
  const h2b = MusicTheory.evaluateTempoFlowHit({ hitTimeMs: 2025, steps: flowSteps, stepOnsetTimes: onsets, currentStepIndex: 2, playedPitch: "C3", stepFulfilledSets: fulfilled, bpm: 120 });
  assert.strictEqual(h2b.matched, true);
  assert.strictEqual(h2b.stepIndex, 2);
  assert.strictEqual(h2b.grade, "PERFECT");
  fulfilled.set(2, new Set(["F4", "C3"]));

  // Late grace on unfulfilled step 4 after playhead would advance, vs skipping rest step 3
  const flowLateOnsets = [1000, 1500];
  const flowLateSteps = [{ stepIndex: 0, beats: 1, expectedPitches: ["C4"] }, { stepIndex: 1, beats: 1, expectedPitches: ["D4"] }];
  const lateGraceHit = MusicTheory.evaluateTempoFlowHit({ hitTimeMs: 1580, steps: flowLateSteps, stepOnsetTimes: flowLateOnsets, currentStepIndex: 1, playedPitch: "C4", stepFulfilledSets: new Map(), bpm: 120 });
  assert.strictEqual(lateGraceHit.matched, true, "Unfulfilled step 0 receives late grace within 140ms after beat 1");
  assert.strictEqual(lateGraceHit.stepIndex, 0);
  assert.strictEqual(lateGraceHit.grade, "LATE");

  console.log("✔ Test 20: 🎹 Milestone 43 GM Program Change, Per-Voice Ties, Attack Gate & Tempo Flow Precision passed");
}

// ==========================================
// TEST 21: 🎼 Milestone 44 Song Encoding Validator, Repertoire Expansion (80 Songs) & Bootcamp Link Integrity
// ==========================================
{
  const songDatabase = require("../songs.js");
  assert.strictEqual(typeof MusicTheory.validateSongEncoding, "function", "validateSongEncoding must be exported on MusicTheory");
  assert.strictEqual(songDatabase.length, 80, "Repertoire must contain 80 songs");

  // 21.1 Validate every song in songs.js with strict musical & encoding checks
  songDatabase.forEach((song, idx) => {
    const res = MusicTheory.validateSongEncoding(song);
    assert.strictEqual(res.valid, true, `Song [${idx + 1}] '${song.id}' failed validateSongEncoding: ${res.errors.join("; ")}`);
    assert.strictEqual(res.errors.length, 0);
  });

  // 21.2 Negative validation tests on validateSongEncoding
  const baseValidSong = {
    id: "test-valid",
    title: "Test Song",
    category: "C 5-Finger",
    instrument: "grand_piano",
    tempo: 100,
    timeSig: "4/4",
    rh: "C4:2 D4:2 | E4:4",
    rhF: "1 2 | 3",
    lh: "C3:4 | C3:4",
    lhF: "5 | 5",
    dyads: "C4+E4:2 G3+D4:2 | C4+E4:4",
    dyadsF: "1+3 1+2 | 1+3",
    tip: "Validation unit test song."
  };
  assert.strictEqual(MusicTheory.validateSongEncoding(baseValidSong).valid, true, "Clean song passes validator");

  // Broken tie into different pitch
  const brokenTie = { ...baseValidSong, rh: "E4:2~ D4:2 | C4:4" };
  const brokenTieRes = MusicTheory.validateSongEncoding(brokenTie);
  assert.strictEqual(brokenTieRes.valid, false);
  assert.ok(brokenTieRes.errors.some(e => e.includes("broken tie")), "Broken tie must be rejected");

  // Non-standard duration (:2.5)
  const oddDur = { ...baseValidSong, rh: "C4:1.5 D4:2.5 | E4:4" };
  const oddDurRes = MusicTheory.validateSongEncoding(oddDur);
  assert.strictEqual(oddDurRes.valid, false);
  assert.ok(oddDurRes.errors.some(e => e.includes("non-standard duration 2.5")), "Non-standard 2.5 duration must be rejected");

  // Measure beat sum mismatch
  const badBeats = { ...baseValidSong, rh: "C4:2 D4:2 | E4:3" };
  assert.strictEqual(MusicTheory.validateSongEncoding(badBeats).valid, false, "Wrong measure beat sum must be rejected");

  // Finger count mismatch
  const badFingers = { ...baseValidSong, rhF: "1 | 3" };
  assert.strictEqual(MusicTheory.validateSongEncoding(badFingers).valid, false, "Token/finger count mismatch must be rejected");

  // Out-of-49-key-range pitch (A1 < C2 or D6 > C6)
  const outRange = { ...baseValidSong, rh: "C4:2 D6:2 | E4:4", lh: "A1:4 | C3:4" };
  const outRangeRes = MusicTheory.validateSongEncoding(outRange);
  assert.strictEqual(outRangeRes.valid, false);
  assert.ok(outRangeRes.errors.some(e => e.includes("49-key range")), "Out-of-range pitch must be rejected");

  // Tied rest
  const tiedRest = { ...baseValidSong, rh: "-:2~ D4:2 | E4:4", rhF: "- 2 | 3" };
  assert.strictEqual(MusicTheory.validateSongEncoding(tiedRest).valid, false, "Rest with tie '~' must be rejected");

  // Monophonic dyads track without '+'
  const monoDyads = { ...baseValidSong, dyads: "C4:2 D4:2 | E4:4", dyadsF: "1 2 | 3" };
  assert.strictEqual(MusicTheory.validateSongEncoding(monoDyads).valid, false, "Dyads track without '+' chord must be rejected");

  // Invalid pickup > expBeats / 2
  const badPickup = { ...baseValidSong, rh: "C4:1 D4:2 | E4:4", lh: "C3:3 | C3:4", dyads: "C4+E4:1 G3+D4:2 | C4+E4:4" };
  assert.strictEqual(MusicTheory.validateSongEncoding(badPickup).valid, false, "Oversized 3-beat pickup in 4/4 must be rejected");

  // Minor-2nd simultaneous clash inside chord
  const clashChord = { ...baseValidSong, dyads: "E4+F4:2 G3+D4:2 | C4+E4:4" };
  assert.strictEqual(MusicTheory.validateSongEncoding(clashChord).valid, false, "Minor-2nd chord clash must be rejected");

  // 21.3 All Beginner Bootcamp recommendedSongs resolve to existing song IDs
  const idSet = new Set(songDatabase.map(s => s.id));
  MusicTheory.BEGINNER_BOOTCAMP_MODULES.forEach(mod => {
    mod.recommendedSongs.forEach(recId => {
      assert.ok(idSet.has(recId), `Bootcamp Module ${mod.number} recommended song '${recId}' must exist in songs.js`);
    });
  });

  // 21.4 Key Signature & Song Theory DNA Accuracy on Fixed & New Pieces
  const checkKey = (id, expectedKey) => {
    const s = songDatabase.find(x => x.id === id);
    assert.ok(s, `Song '${id}' must exist`);
    const dna = MusicTheory.analyzeSongTheoryDNA(s);
    assert.strictEqual(dna.keySignature, expectedKey, `${id} DNA keySignature must be '${expectedKey}'`);
  };
  checkKey("gymnopedie-1", "D Major");
  checkKey("moonlight-sonata-mvt1", "C# Minor");
  checkKey("house-of-the-rising-sun", "A Minor");
  checkKey("nocturne-op9-no2", "Eb Major");
  checkKey("c-minor-blues-riff", "C Minor");
  checkKey("amazing-grace", "G Major");

  console.log("✔ Test 21: 🎼 Milestone 44 Song Encoding Validator, Repertoire Expansion (80 Songs) & Bootcamp Link Integrity passed");
}

console.log("=== ALL 21 EDUCATION SUITE TESTS PASSED SUCCESSFULLY! ===");



