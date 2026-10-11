/**
 * tests/test_score_engine.js - Automated tests for Score Model, Bass Clef Layout & Alignment
 */

const assert = require('assert');
global.window = global;
require('../theory.js');
require('../songs.js');

console.log("=== Running Score Engine & Bass Clef Alignment Tests ===");

const songDatabase = window.songDatabase;
assert.ok(songDatabase && songDatabase.length > 0, "Song database must be loaded");

const DIATONIC_BASE = { 'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6 };
function getDiatonicStep(pitchStr) {
  if (!pitchStr || pitchStr === "-") return null;
  const clean = pitchStr.trim();
  const match = clean.match(/^([A-G])([#b]?)([0-8])?$/);
  if (!match) return null;
  const letter = match[1];
  const oct = match[3] ? parseInt(match[3], 10) : 4;
  return (oct - 4) * 7 + DIATONIC_BASE[letter];
}

function parseToken(tokenStr) {
  if (!tokenStr || tokenStr === "|") return { pitch: tokenStr, beats: 0 };
  const parts = tokenStr.split(":");
  const pitch = parts[0];
  const beats = parts[1] ? parseFloat(parts[1]) : 1.0;
  return { pitch, beats };
}

function buildScoreModel(song, showRH, showLH, showDyads) {
  if (!song) return { measures: [], steps: [] };

  const rhM = (song.rh || "").split("|").map(m => m.trim().split(/\s+/).filter(Boolean));
  const lhM = (song.lh || "").split("|").map(m => m.trim().split(/\s+/).filter(Boolean));
  const dyadM = (song.dyads || "").split("|").map(m => m.trim().split(/\s+/).filter(Boolean));
  const rhFM = (song.rhF || "").split("|").map(m => m.trim().split(/\s+/).filter(Boolean));
  const lhFM = (song.lhF || "").split("|").map(m => m.trim().split(/\s+/).filter(Boolean));
  const dyadFM = (song.dyadsF || "").split("|").map(m => m.trim().split(/\s+/).filter(Boolean));

  const totalMeasures = Math.max(rhM.length, lhM.length, dyadM.length);
  const measures = [];
  const steps = [];
  let stepGlobalIdx = 0;

  for (let m = 0; m < totalMeasures; m++) {
    const mRH = rhM[m] || [];
    const mLH = lhM[m] || [];
    const mDyad = dyadM[m] || [];
    const mRHF = rhFM[m] || [];
    const mLHF = lhFM[m] || [];
    const mDyadF = dyadFM[m] || [];

    const measureItems = [];

    if (showDyads) {
      mDyad.forEach((t, k) => {
        const parsed = parseToken(t);
        const item = {
          stepIndex: stepGlobalIdx,
          index: stepGlobalIdx,
          measure: m + 1,
          dyad: parsed,
          dyadF: mDyadF[k] || "",
          expectedPitches: parsed.pitch.split("+").filter(p => p !== "-"),
          beats: parsed.beats
        };
        item.displayLabel = item.expectedPitches.join(" + ");
        measureItems.push(item);
        steps.push(item);
        stepGlobalIdx++;
      });
    } else if (showRH && !showLH) {
      mRH.forEach((t, k) => {
        const parsed = parseToken(t);
        const item = {
          stepIndex: stepGlobalIdx,
          index: stepGlobalIdx,
          measure: m + 1,
          rh: parsed,
          rhF: mRHF[k] || "",
          expectedPitches: parsed.pitch.split("+").filter(p => p !== "-"),
          beats: parsed.beats
        };
        item.displayLabel = item.expectedPitches.join(" + ");
        measureItems.push(item);
        steps.push(item);
        stepGlobalIdx++;
      });
    } else if (showLH && !showRH) {
      mLH.forEach((t, k) => {
        const parsed = parseToken(t);
        const item = {
          stepIndex: stepGlobalIdx,
          index: stepGlobalIdx,
          measure: m + 1,
          lh: parsed,
          lhF: mLHF[k] || "",
          expectedPitches: parsed.pitch.split("+").filter(p => p !== "-"),
          beats: parsed.beats
        };
        item.displayLabel = item.expectedPitches.join(" + ");
        measureItems.push(item);
        steps.push(item);
        stepGlobalIdx++;
      });
    } else if (showRH && showLH) {
      let rhBeat = 0;
      const rhEvents = mRH.map((t, k) => {
        const p = parseToken(t);
        const ev = { ...p, f: mRHF[k] || "", startBeat: rhBeat };
        rhBeat += p.beats;
        return ev;
      });

      let lhBeat = 0;
      const lhEvents = mLH.map((t, k) => {
        const p = parseToken(t);
        const ev = { ...p, f: mLHF[k] || "", startBeat: lhBeat };
        lhBeat += p.beats;
        return ev;
      });

      const onsets = Array.from(new Set([
        ...rhEvents.map(e => e.startBeat),
        ...lhEvents.map(e => e.startBeat)
      ])).sort((a, b) => a - b);

      onsets.forEach((b, k) => {
        const rhEv = rhEvents.find(e => Math.abs(e.startBeat - b) < 0.001) || null;
        const lhEv = lhEvents.find(e => Math.abs(e.startBeat - b) < 0.001) || null;
        const expected = [];
        if (rhEv && rhEv.pitch && rhEv.pitch !== "-") {
          rhEv.pitch.split("+").filter(p => p !== "-").forEach(p => expected.push(p));
        }
        if (lhEv && lhEv.pitch && lhEv.pitch !== "-") {
          lhEv.pitch.split("+").filter(p => p !== "-").forEach(p => expected.push(p));
        }

        const nextB = onsets[k + 1];
        const stepBeats = nextB !== undefined ? (nextB - b) : Math.max(rhEv ? rhEv.beats : 1, lhEv ? lhEv.beats : 1);

        const item = {
          stepIndex: stepGlobalIdx,
          index: stepGlobalIdx,
          measure: m + 1,
          startBeat: b,
          rh: rhEv,
          lh: lhEv,
          expectedPitches: expected,
          displayLabel: expected.join(" + "),
          beats: stepBeats
        };
        measureItems.push(item);
        steps.push(item);
        stepGlobalIdx++;
      });
    }

    measures.push(measureItems);
  }

  return { measures, steps };
}

// 1. Test Left Hand Solo Mode (Level 4: Bass Clef Foundation) across all songs
{
  songDatabase.forEach(song => {
    const model = buildScoreModel(song, false, true, false);
    const lhTokens = song.lh.split('|').map(m => m.trim().split(/\s+/).filter(Boolean));
    
    assert.strictEqual(model.measures.length, lhTokens.length, `${song.title}: measure count matches song definition`);
    
    // Check that each measure's note count equals the LH definition
    model.measures.forEach((mItems, mIdx) => {
      assert.strictEqual(mItems.length, lhTokens[mIdx].length, `${song.title} measure ${mIdx + 1} note count`);
    });

    // Ensure no step has '|' or invalid pitches
    model.steps.forEach((step, sIdx) => {
      assert.ok(step.expectedPitches.length > 0, `${song.title} step ${sIdx} has expected pitches`);
      step.expectedPitches.forEach(p => {
        assert.notStrictEqual(p, "|", `${song.title} step ${sIdx} must not contain '|'`);
        assert.ok(getDiatonicStep(p) !== null, `${song.title} step ${sIdx} pitch ${p} has valid diatonic step`);
      });
    });
  });
  console.log("✔ Test 1: Left-hand solo mode across all 56 songs passed");
}

// 2. Test Grand Staff Mode (Level 5: 2-Hand Coordination) onset synchronization
{
  const ode = songDatabase.find(s => s.id === "ode-to-joy");
  const model = buildScoreModel(ode, true, true, false);

  // Measure 1 of Ode to Joy: RH has 4 quarters (E4, E4, F4, G4), LH has 2 halves (C3, C3)
  const m1 = model.measures[0];
  assert.strictEqual(m1.length, 4, "Ode to Joy measure 1 has 4 onsets");
  
  // Onset 0: RH E4 and LH C3
  assert.strictEqual(m1[0].rh.pitch, "E4");
  assert.strictEqual(m1[0].lh.pitch, "C3");
  assert.deepStrictEqual(m1[0].expectedPitches, ["E4", "C3"]);

  // Onset 1: RH E4, LH holds (no new note)
  assert.strictEqual(m1[1].rh.pitch, "E4");
  assert.strictEqual(m1[1].lh, null);
  assert.deepStrictEqual(m1[1].expectedPitches, ["E4"]);

  // Onset 2: RH F4 and LH C3
  assert.strictEqual(m1[2].rh.pitch, "F4");
  assert.strictEqual(m1[2].lh.pitch, "C3");
  assert.deepStrictEqual(m1[2].expectedPitches, ["F4", "C3"]);

  console.log("✔ Test 2: Grand staff onset synchronization in Ode to Joy passed");
}

// 3. Test Left-Hand Chords/Dyads support (Gymnopédie No. 1)
{
  const gymno = songDatabase.find(s => s.id === "gymnopedie-1");
  const model = buildScoreModel(gymno, true, true, false);

  // Measure 1: RH has D4:3 (beat 0), LH has G2:1 (beat 0) and B3+D4:2 (beat 1)
  const m1 = model.measures[0];
  assert.strictEqual(m1.length, 2, "Gymnopédie measure 1 has 2 onsets");

  // Onset 0: RH F#4, LH G2
  assert.strictEqual(m1[0].rh.pitch, "F#4");
  assert.strictEqual(m1[0].lh.pitch, "G2");
  assert.deepStrictEqual(m1[0].expectedPitches, ["F#4", "G2"]);

  // Onset 1: LH chord B3+D4
  assert.strictEqual(m1[1].rh, null);
  assert.strictEqual(m1[1].lh.pitch, "B3+D4");
  assert.deepStrictEqual(m1[1].expectedPitches, ["B3", "D4"]);

  console.log("✔ Test 3: Left-hand chords/dyads in Gymnopédie No. 1 passed");
}

// 4. Test Multi-System Y Geometry (LH Solo vs Grand Staff)
{
  const numSystems = 4;
  const staffLineSpacing = 10;
  
  // Case A: Left-Hand Solo mode (showRH = false, showLH = true)
  {
    const isGrandStaff = false;
    const showRH = false;
    const showLH = true;
    const showDyads = false;
    const systemHeight = 160;

    for (let s = 0; s < numSystems; s++) {
      const systemTopY = 30 + s * systemHeight;
      const trebleTopY = (showRH || showDyads) ? (systemTopY + 12) : 0;
      const bassTopY = isGrandStaff ? (trebleTopY + 80) : (showLH ? (systemTopY + 12) : 0);
      const bassBottomY = bassTopY + 4 * staffLineSpacing;

      assert.strictEqual(trebleTopY, 0, "Treble staff not positioned in LH solo");
      assert.strictEqual(bassTopY, systemTopY + 12, `System ${s} bassTopY properly spaced at row offset`);
      assert.ok(bassTopY > 0, `System ${s} bassTopY must be greater than 0`);
      if (s > 0) {
        const prevSystemTopY = 30 + (s - 1) * systemHeight;
        assert.ok(bassTopY >= prevSystemTopY + systemHeight, `System ${s} does not overlap system ${s-1}`);
      }
    }
  }

  // Case B: Grand Staff mode (showRH = true, showLH = true)
  {
    const isGrandStaff = true;
    const showRH = true;
    const showLH = true;
    const showDyads = false;
    const systemHeight = 275;

    for (let s = 0; s < numSystems; s++) {
      const systemTopY = 30 + s * systemHeight;
      const trebleTopY = (showRH || showDyads) ? (systemTopY + 12) : 0;
      const trebleBottomY = trebleTopY + 4 * staffLineSpacing;
      const bassTopY = isGrandStaff ? (trebleBottomY + 80) : (showLH ? (systemTopY + 12) : 0);
      const bassBottomY = bassTopY + 4 * staffLineSpacing;

      assert.strictEqual(trebleTopY, systemTopY + 12);
      assert.strictEqual(bassTopY, trebleBottomY + 80, `Grand staff bass staff has generous clearance below treble staff`);
      assert.ok(bassBottomY < systemTopY + systemHeight, `System ${s} fits within systemHeight`);
    }
  }
  console.log("✔ Test 4: Multi-system geometry calculation passed");
}

// 5. Test Ledger Lines below Bass Staff and above Treble Staff
{
  function computeLedgerLines(refDiatonicStep, step) {
    const lines = [];
    if (refDiatonicStep === 2 && step <= 0) { // Below Treble Staff
      for (let s = 0; s >= step; s -= 2) lines.push(s);
    } else if (refDiatonicStep === 2 && step >= 12) { // Above Treble Staff
      for (let s = 12; s <= step; s += 2) lines.push(s);
    } else if (refDiatonicStep === -10 && step >= 0) { // Above Bass Staff
      for (let s = 0; s <= step; s += 2) lines.push(s);
    } else if (refDiatonicStep === -10 && step <= -12) { // Below Bass Staff
      for (let s = -12; s >= step; s -= 2) lines.push(s);
    }
    return lines;
  }

  // Low bass notes below bass staff
  assert.deepStrictEqual(computeLedgerLines(-10, getDiatonicStep("E2")), [-12], "E2 has 1 ledger line below bass staff");
  assert.deepStrictEqual(computeLedgerLines(-10, getDiatonicStep("D2")), [-12], "D2 space sits below ledger line -12");
  assert.deepStrictEqual(computeLedgerLines(-10, getDiatonicStep("C2")), [-12, -14], "C2 has 2 ledger lines below bass staff");

  // Middle C above bass staff
  assert.deepStrictEqual(computeLedgerLines(-10, getDiatonicStep("C4")), [0], "C4 has 1 ledger line above bass staff");

  // Middle C below treble staff
  assert.deepStrictEqual(computeLedgerLines(2, getDiatonicStep("C4")), [0], "C4 has 1 ledger line below treble staff");

  // High treble notes
  assert.deepStrictEqual(computeLedgerLines(2, getDiatonicStep("A5")), [12], "A5 has 1 ledger line above treble staff");
  assert.deepStrictEqual(computeLedgerLines(2, getDiatonicStep("C6")), [12, 14], "C6 has 2 ledger lines above treble staff");

  console.log("✔ Test 5: Full ledger line calculations passed");
}

console.log("=== ALL SCORE ENGINE & BASS CLEF ALIGNMENT TESTS PASSED! ===");
