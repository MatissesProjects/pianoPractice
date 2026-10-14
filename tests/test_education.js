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

console.log("=== ALL 11 EDUCATION SUITE TESTS PASSED SUCCESSFULLY! ===");

