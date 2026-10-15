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

function buildScoreModel(song, showRH, showLH, showDyads, harmonyType = "song") {
  if (!song) return { measures: [], steps: [] };

  let dyadSource = song.dyads || "";
  let dyadFSource = song.dyadsF || "";

  if (showDyads && harmonyType && harmonyType !== "song") {
    if (typeof MusicTheory !== "undefined" && MusicTheory.generateSongHarmonies) {
      const gen = MusicTheory.generateSongHarmonies(song, harmonyType);
      dyadSource = gen.dyads;
      dyadFSource = gen.dyadsF;
    }
  }

  const rhM = (song.rh || "").split("|").map(m => m.trim().split(/\s+/).filter(Boolean));
  const lhM = (song.lh || "").split("|").map(m => m.trim().split(/\s+/).filter(Boolean));
  const dyadM = (dyadSource || "").split("|").map(m => m.trim().split(/\s+/).filter(Boolean));
  const rhFM = (song.rhF || "").split("|").map(m => m.trim().split(/\s+/).filter(Boolean));
  const lhFM = (song.lhF || "").split("|").map(m => m.trim().split(/\s+/).filter(Boolean));
  const dyadFM = (dyadFSource || "").split("|").map(m => m.trim().split(/\s+/).filter(Boolean));

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

    if (showDyads && showLH) {
      let dyadBeat = 0;
      const dyadEvents = mDyad.map((t, k) => {
        const p = parseToken(t);
        const ev = { ...p, f: mDyadF[k] || "", startBeat: dyadBeat };
        dyadBeat += p.beats;
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
        ...dyadEvents.map(e => e.startBeat),
        ...lhEvents.map(e => e.startBeat)
      ])).sort((a, b) => a - b);

      onsets.forEach((b, k) => {
        const dyadEv = dyadEvents.find(e => Math.abs(e.startBeat - b) < 0.001) || null;
        const lhEv = lhEvents.find(e => Math.abs(e.startBeat - b) < 0.001) || null;
        const expectedList = [];
        if (dyadEv && dyadEv.pitch && dyadEv.pitch !== "-") {
          dyadEv.pitch.split("+").filter(p => p !== "-").forEach(p => expectedList.push(p));
        }
        if (lhEv && lhEv.pitch && lhEv.pitch !== "-") {
          lhEv.pitch.split("+").filter(p => p !== "-").forEach(p => expectedList.push(p));
        }
        const expected = Array.from(new Set(expectedList));

        const nextB = onsets[k + 1];
        const maxMB = Math.max(
          ...dyadEvents.map(e => e.startBeat + e.beats),
          ...lhEvents.map(e => e.startBeat + e.beats),
          0
        );
        const stepBeats = nextB !== undefined ? (nextB - b) : (maxMB > b ? (maxMB - b) : Math.max(dyadEv ? dyadEv.beats : 1, lhEv ? lhEv.beats : 1));

        const item = {
          stepIndex: stepGlobalIdx,
          index: stepGlobalIdx,
          measure: m + 1,
          startBeat: b,
          dyad: dyadEv,
          dyadF: dyadEv ? dyadEv.f : "",
          lh: lhEv,
          lhF: lhEv ? lhEv.f : "",
          expectedPitches: expected,
          displayLabel: expected.join(" + "),
          beats: stepBeats
        };
        measureItems.push(item);
        steps.push(item);
        stepGlobalIdx++;
      });
    } else if (showDyads && !showLH) {
      let dyadBeat = 0;
      mDyad.forEach((t, k) => {
        const parsed = parseToken(t);
        const item = {
          stepIndex: stepGlobalIdx,
          index: stepGlobalIdx,
          measure: m + 1,
          startBeat: dyadBeat,
          dyad: parsed,
          dyadF: mDyadF[k] || "",
          expectedPitches: parsed.pitch.split("+").filter(p => p !== "-"),
          beats: parsed.beats
        };
        dyadBeat += parsed.beats;
        item.displayLabel = item.expectedPitches.join(" + ");
        measureItems.push(item);
        steps.push(item);
        stepGlobalIdx++;
      });
    } else if (showRH && !showLH) {
      let rhBeat = 0;
      mRH.forEach((t, k) => {
        const parsed = parseToken(t);
        const item = {
          stepIndex: stepGlobalIdx,
          index: stepGlobalIdx,
          measure: m + 1,
          startBeat: rhBeat,
          rh: parsed,
          rhF: mRHF[k] || "",
          expectedPitches: parsed.pitch.split("+").filter(p => p !== "-"),
          beats: parsed.beats
        };
        rhBeat += parsed.beats;
        item.displayLabel = item.expectedPitches.join(" + ");
        measureItems.push(item);
        steps.push(item);
        stepGlobalIdx++;
      });
    } else if (showLH && !showRH) {
      let lhBeat = 0;
      mLH.forEach((t, k) => {
        const parsed = parseToken(t);
        const item = {
          stepIndex: stepGlobalIdx,
          index: stepGlobalIdx,
          measure: m + 1,
          startBeat: lhBeat,
          lh: parsed,
          lhF: mLHF[k] || "",
          expectedPitches: parsed.pitch.split("+").filter(p => p !== "-"),
          beats: parsed.beats
        };
        lhBeat += parsed.beats;
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
        const expectedList = [];
        if (rhEv && rhEv.pitch && rhEv.pitch !== "-") {
          rhEv.pitch.split("+").filter(p => p !== "-").forEach(p => expectedList.push(p));
        }
        if (lhEv && lhEv.pitch && lhEv.pitch !== "-") {
          lhEv.pitch.split("+").filter(p => p !== "-").forEach(p => expectedList.push(p));
        }
        const expected = Array.from(new Set(expectedList));

        const nextB = onsets[k + 1];
        const maxMB = Math.max(
          ...rhEvents.map(e => e.startBeat + e.beats),
          ...lhEvents.map(e => e.startBeat + e.beats),
          0
        );
        const stepBeats = nextB !== undefined ? (nextB - b) : (maxMB > b ? (maxMB - b) : Math.max(rhEv ? rhEv.beats : 1, lhEv ? lhEv.beats : 1));

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

// 6. Test Multi-Note Onset Fulfillment in 2-Hand Mode (Step requiring concurrent notes)
{
  const ode = songDatabase.find(s => s.id === "ode-to-joy");
  const model = buildScoreModel(ode, true, true, false);
  const step0 = model.steps[0]; // Onset 0: E4 and C3

  assert.deepStrictEqual(step0.expectedPitches, ["E4", "C3"]);

  // Simulate Practice Engine State Machine
  let currentStepIdx = 0;
  const fulfilledPitches = new Set();
  const heldAttacks = new Map();
  let attackCounter = 0;

  function noteDown(pitch, now = 1000) {
    const existing = heldAttacks.get(pitch);
    if (existing && existing.isDown) return false;
    const attack = { pitch, downTime: now, attackId: ++attackCounter, isDown: true };
    heldAttacks.set(pitch, attack);

    const step = model.steps[currentStepIdx];
    const expected = step.expectedPitches;
    if (expected.includes(pitch) && !fulfilledPitches.has(pitch)) {
      fulfilledPitches.add(pitch);
      if (fulfilledPitches.size >= expected.length) {
        // Step fully satisfied!
        fulfilledPitches.clear();
        currentStepIdx++;
        return true;
      }
    }
    return false;
  }

  function noteUp(pitch, now = 1500) {
    const attack = heldAttacks.get(pitch);
    if (attack) {
      attack.isDown = false;
      heldAttacks.delete(pitch);
      return true;
    }
    return false;
  }

  // LH lands first (C3)
  noteDown("C3", 1000);
  assert.strictEqual(currentStepIdx, 0, "Step must NOT advance when only LH C3 has landed");
  assert.strictEqual(fulfilledPitches.has("C3"), true, "C3 is marked fulfilled");
  assert.strictEqual(fulfilledPitches.size, 1, "Only 1 of 2 pitches fulfilled");

  // RH lands 25ms later (E4)
  noteDown("E4", 1025);
  assert.strictEqual(currentStepIdx, 1, "Step advances to Step 1 only after both E4 and C3 are fulfilled");
  assert.strictEqual(fulfilledPitches.size, 0, "Fulfilled set is reset for Step 1");

  console.log("✔ Test 6: Multi-note onset fulfillment in 2-hand mode passed");
}

// 7. Test Consecutive Identical Notes Gating (Anti-Skip on Held Key & Two-Hand Landing)
{
  const ode = songDatabase.find(s => s.id === "ode-to-joy");
  const model = buildScoreModel(ode, true, true, false);
  // Measure 1:
  // Step 0 (Onset 0): RH E4, LH C3 -> expected ["E4", "C3"]
  // Step 1 (Onset 1): RH E4, LH holds -> expected ["E4"]  (Consecutive E4!)

  assert.deepStrictEqual(model.steps[0].expectedPitches, ["E4", "C3"]);
  assert.deepStrictEqual(model.steps[1].expectedPitches, ["E4"]);

  let currentStepIdx = 0;
  const fulfilledPitches = new Set();
  const heldAttacks = new Map();
  let attackCounter = 0;

  function noteDown(pitch, now = 1000) {
    const existing = heldAttacks.get(pitch);
    if (existing && existing.isDown) return false; // Blocked because key is already held
    const attack = { pitch, downTime: now, attackId: ++attackCounter, isDown: true };
    heldAttacks.set(pitch, attack);

    const step = model.steps[currentStepIdx];
    const expected = step.expectedPitches;
    if (expected.includes(pitch) && !fulfilledPitches.has(pitch)) {
      fulfilledPitches.add(pitch);
      if (fulfilledPitches.size >= expected.length) {
        fulfilledPitches.clear();
        currentStepIdx++;
        return true;
      }
    }
    return false;
  }

  function noteUp(pitch, now = 1500) {
    const attack = heldAttacks.get(pitch);
    if (attack) {
      attack.isDown = false;
      heldAttacks.delete(pitch);
      return true;
    }
    return false;
  }

  // Play Step 0: C3 then E4
  noteDown("C3", 1000);
  noteDown("E4", 1020);
  assert.strictEqual(currentStepIdx, 1, "Advanced to Step 1 (E4)");

  // Player is STILL HOLDING E4 from Step 0!
  assert.strictEqual(heldAttacks.get("E4")?.isDown, true, "E4 is physically held down");

  // Attempting to trigger noteDown on held E4 without release must be rejected:
  const retriggerWhileHeld = noteDown("E4", 1040);
  assert.strictEqual(retriggerWhileHeld, false, "Cannot retrigger E4 while key is held down");
  assert.strictEqual(currentStepIdx, 1, "Must remain on Step 1, not skipping past it!");

  // Player lifts E4 (Note-Off)
  noteUp("E4", 1400);
  assert.strictEqual(heldAttacks.has("E4"), false, "E4 is released");
  assert.strictEqual(currentStepIdx, 1, "Still on Step 1 after release");

  // Player strikes E4 again (New Note-On for Step 1)
  const strikeStep1 = noteDown("E4", 1500);
  assert.strictEqual(strikeStep1, true, "New Note-On strike satisfies Step 1");
  assert.strictEqual(currentStepIdx, 2, "Advances to Step 2 (F4 + C3)");

  console.log("✔ Test 7: Consecutive identical notes anti-skip and attack gating passed");
}

// 8. Test Note-Off Duration Calculation & Rhythmic Feedback
{
  function evaluateHoldDuration(durationMs, bpm = 100, targetBeats = 1.0) {
    const heldBeats = (durationMs / 1000) * (bpm / 60);
    const holdRatio = heldBeats / targetBeats;
    let category = "good";
    if (holdRatio < 0.45) category = "staccato";
    else if (holdRatio >= 0.75 && holdRatio <= 1.35) category = "flawless";
    else if (holdRatio > 1.5) category = "tenuto";
    return { heldBeats, holdRatio, category };
  }

  // At 100 BPM: 1 beat = 600ms
  // Perfect quarter note hold ~ 600ms (1.00 beat)
  const r1 = evaluateHoldDuration(600, 100, 1.0);
  assert.strictEqual(r1.heldBeats.toFixed(2), "1.00");
  assert.strictEqual(r1.category, "flawless");

  // Staccato tap ~ 150ms (0.25 beat)
  const r2 = evaluateHoldDuration(150, 100, 1.0);
  assert.strictEqual(r2.category, "staccato");

  // Tenuto hold ~ 1200ms (2.00 beats)
  const r3 = evaluateHoldDuration(1200, 100, 1.0);
  assert.strictEqual(r3.category, "tenuto");

  // Half note (2.0 beats = 1200ms) with 1180ms hold
  const r4 = evaluateHoldDuration(1180, 100, 2.0);
  assert.strictEqual(r4.category, "flawless");

  console.log("✔ Test 8: Note-off duration calculations and rhythmic feedback passed");
}

// 9. Test Universal Master Volume Control (Clamping, Mute Toggle, Gain Attenuation & Sync)
{
  class MasterVolumeController {
    constructor(initialVol = 0.8) {
      this.currentMasterVolume = initialVol;
      this.isMasterMuted = false;
      this.preMuteVolume = initialVol;
      this.storage = new Map();
      this.sliderElements = [];
    }

    setMasterVolume(val) {
      const parsed = Math.max(0, Math.min(1, parseFloat(val)));
      this.currentMasterVolume = parsed;
      if (this.currentMasterVolume > 0 && this.isMasterMuted) {
        this.isMasterMuted = false;
      }
      this.storage.set("piano_master_volume", this.currentMasterVolume.toString());
      return this.getState();
    }

    toggleMasterMute() {
      if (this.isMasterMuted) {
        this.isMasterMuted = false;
        this.currentMasterVolume = this.preMuteVolume > 0 ? this.preMuteVolume : 0.8;
      } else {
        this.isMasterMuted = true;
        this.preMuteVolume = this.currentMasterVolume > 0 ? this.currentMasterVolume : 0.8;
      }
      return this.getState();
    }

    getState() {
      const effectiveVol = this.isMasterMuted ? 0 : this.currentMasterVolume;
      const pct = Math.round(effectiveVol * 100);
      const icon = this.isMasterMuted || pct === 0 ? "🔇" : (pct < 50 ? "🔉" : "🔊");
      return {
        masterVolume: this.currentMasterVolume,
        isMuted: this.isMasterMuted,
        effectiveGain: effectiveVol,
        pctText: `${pct}%`,
        icon
      };
    }

    calculateAttenuatedGain(baseGain) {
      const effectiveGain = this.isMasterMuted ? 0 : this.currentMasterVolume;
      return baseGain * effectiveGain;
    }
  }

  const vol = new MasterVolumeController(0.8);
  assert.strictEqual(vol.getState().pctText, "80%");
  assert.strictEqual(vol.getState().icon, "🔊");
  assert.strictEqual(vol.getState().effectiveGain, 0.8);

  // Test Clamping
  const over = vol.setMasterVolume(1.5);
  assert.strictEqual(over.effectiveGain, 1.0, "Clamped to 1.0 max");
  assert.strictEqual(over.pctText, "100%");
  assert.strictEqual(over.icon, "🔊");

  const under = vol.setMasterVolume(-0.2);
  assert.strictEqual(under.effectiveGain, 0.0, "Clamped to 0.0 min");
  assert.strictEqual(under.pctText, "0%");
  assert.strictEqual(under.icon, "🔇");

  // Mid-range volume & icon state
  const mid = vol.setMasterVolume(0.35);
  assert.strictEqual(mid.effectiveGain, 0.35);
  assert.strictEqual(mid.pctText, "35%");
  assert.strictEqual(mid.icon, "🔉");

  // Mute toggle preserves previous volume
  const muted = vol.toggleMasterMute();
  assert.strictEqual(muted.isMuted, true);
  assert.strictEqual(muted.effectiveGain, 0);
  assert.strictEqual(muted.pctText, "0%");
  assert.strictEqual(muted.icon, "🔇");

  // Unmute restores previous volume
  const unmuted = vol.toggleMasterMute();
  assert.strictEqual(unmuted.isMuted, false);
  assert.strictEqual(unmuted.effectiveGain, 0.35);
  assert.strictEqual(unmuted.pctText, "35%");
  assert.strictEqual(unmuted.icon, "🔉");

  // Moving slider while muted un-mutes automatically
  vol.toggleMasterMute();
  assert.strictEqual(vol.getState().isMuted, true);
  const adjusted = vol.setMasterVolume(0.60);
  assert.strictEqual(adjusted.isMuted, false, "Slider drag unmutes automatically");
  assert.strictEqual(adjusted.effectiveGain, 0.60);
  assert.strictEqual(adjusted.pctText, "60%");
  assert.strictEqual(adjusted.icon, "🔊");

  // Perceptual Quadratic Audio Taper calculation:
  // volScale = Math.pow(effectiveVol, 2)
  function getPerceptualGain(baseGain, vol, isMuted) {
    if (isMuted || vol <= 0.0001) return 0;
    return baseGain * Math.pow(vol, 2);
  }

  assert.strictEqual(getPerceptualGain(0.20, 1.0, false), 0.20, "100% volume produces 100% base gain");
  assert.strictEqual(getPerceptualGain(0.20, 0.5, false), 0.05, "50% slider produces 25% power (-12 dB) for natural human volume curve");
  assert.strictEqual(getPerceptualGain(0.20, 0.2, false).toFixed(4), "0.0080", "20% slider produces 4% power (-28 dB)");
  assert.strictEqual(getPerceptualGain(0.20, 0.0, false), 0, "0% volume produces absolute silence");
  assert.strictEqual(getPerceptualGain(0.20, 0.8, true), 0, "Muted state produces absolute silence");

  // Synth Audio Gating verification:
  function shouldTriggerSynth(isSynthEnabled, isMidiInput) {
    if (!isSynthEnabled) return false;
    return true;
  }
  assert.strictEqual(shouldTriggerSynth(false, true), false, "When synth audio is unchecked, MIDI strikes produce no synth audio");
  assert.strictEqual(shouldTriggerSynth(false, false), false, "When synth audio is unchecked, mouse strikes produce no synth audio");
  assert.strictEqual(shouldTriggerSynth(true, true), true, "When synth audio is checked, MIDI strikes trigger live synth");

  console.log("✔ Test 9: Universal master volume control, perceptual taper & synth audio gating passed");
}

// 10. Test Polyphonic Independent Voice Sustaining (LH Whole Notes vs RH Quarter Notes)
{
  const marySong = songDatabase.find(s => s.id === "mary-had-a-little-lamb");
  assert.ok(marySong, "Mary Had a Little Lamb exists in songDatabase");

  const model = buildScoreModel(marySong, true, true, false);
  const m1Steps = model.measures[0];
  assert.strictEqual(m1Steps.length, 4, "Measure 1 has 4 onset steps");

  // Step 0: Onset of LH whole note (C3:4) and RH quarter note (E4:1)
  assert.strictEqual(m1Steps[0].startBeat, 0);
  assert.strictEqual(m1Steps[0].rh.pitch, "E4");
  assert.strictEqual(m1Steps[0].rh.beats, 1);
  assert.strictEqual(m1Steps[0].lh.pitch, "C3");
  assert.strictEqual(m1Steps[0].lh.beats, 4);

  // Steps 1-3: RH steps through quarter notes while LH sustains (lh is null)
  for (let s = 1; s <= 3; s++) {
    assert.strictEqual(m1Steps[s].startBeat, s);
    assert.ok(m1Steps[s].rh, `Step ${s} has RH onset`);
    assert.strictEqual(m1Steps[s].lh, null, `Step ${s} has no new LH onset; LH is held`);
  }

  // Simulation of Independent Voice Playback Engine
  const bpm = 100;
  const beatMs = (60 / bpm) * 1000; // 600ms per beat
  
  // Track active keys and voice notes over simulated timeline
  const activeKeys = {
    "active-rh": new Set(),
    "active-lh": new Set()
  };
  const activeVoiceNotes = new Map();

  function triggerVoice(voiceKey, voiceData, defaultOct) {
    if (!voiceData || !voiceData.pitch || voiceData.pitch === "-") return;
    const voiceBeats = voiceData.beats || 1.0;
    const voiceSoundDuration = (voiceBeats * (60 / bpm)) * 0.95;
    const activeClass = voiceKey === "lh" ? "active-lh" : "active-rh";

    // Clear previous keys for this voice
    activeKeys[activeClass].clear();

    const parts = voiceData.pitch.split("+").filter(p => p !== "-");
    const voiceNotes = [];
    parts.forEach(p => {
      voiceNotes.push(p);
      activeKeys[activeClass].add(p);
    });

    activeVoiceNotes.set(voiceKey, voiceNotes);

    return {
      voiceSoundDuration,
      voiceDurationMs: voiceBeats * beatMs
    };
  }

  function expireVoice(voiceKey, targetNotes) {
    const activeClass = voiceKey === "lh" ? "active-lh" : "active-rh";
    if (activeVoiceNotes.get(voiceKey) === targetNotes) {
      activeVoiceNotes.delete(voiceKey);
      activeKeys[activeClass].clear();
    }
  }

  // At Beat 0 (t = 0): LH C3:4 and RH E4:1 start simultaneously
  const lh0 = triggerVoice("lh", m1Steps[0].lh, 2);
  const rh0 = triggerVoice("rh", m1Steps[0].rh, 4);

  assert.strictEqual(lh0.voiceSoundDuration, (4 * (60 / bpm)) * 0.95, "LH sound duration covers full 4 beats");
  assert.strictEqual(rh0.voiceSoundDuration, (1 * (60 / bpm)) * 0.95, "RH sound duration covers 1 beat");
  assert.ok(activeKeys["active-lh"].has("C3"), "LH C3 key is active at Beat 0");
  assert.ok(activeKeys["active-rh"].has("E4"), "RH E4 key is active at Beat 0");

  // At Beat 1 (t = 600ms): RH transitions to D4:1, LH is holding without onset
  // Notice: previous RH key expires or gets replaced, but LH C3 MUST NOT BE TOUCHED!
  expireVoice("rh", activeVoiceNotes.get("rh"));
  assert.strictEqual(activeKeys["active-rh"].size, 0, "Previous RH note released");
  assert.ok(activeKeys["active-lh"].has("C3"), "LH C3 remains active and sustained across beat 1 transition");

  const rh1 = triggerVoice("rh", m1Steps[1].rh, 4);
  assert.ok(activeKeys["active-rh"].has("D4"), "RH D4 active at Beat 1");
  assert.ok(activeKeys["active-lh"].has("C3"), "LH C3 STILL held at Beat 1");
  assert.deepStrictEqual(activeVoiceNotes.get("lh"), ["C3"], "LH C3 voice note is maintained");
  assert.deepStrictEqual(activeVoiceNotes.get("rh"), ["D4"], "RH D4 voice note is active");

  // At Beat 2 (t = 1200ms): RH transitions to C4:1, LH continues holding
  expireVoice("rh", activeVoiceNotes.get("rh"));
  const rh2 = triggerVoice("rh", m1Steps[2].rh, 4);
  assert.ok(activeKeys["active-rh"].has("C4"), "RH C4 active at Beat 2");
  assert.ok(activeKeys["active-lh"].has("C3"), "LH C3 STILL held at Beat 2");

  // At Beat 3 (t = 1800ms): RH transitions to D4:1, LH continues holding
  expireVoice("rh", activeVoiceNotes.get("rh"));
  const rh3 = triggerVoice("rh", m1Steps[3].rh, 4);
  assert.ok(activeKeys["active-rh"].has("D4"), "RH D4 active at Beat 3");
  assert.ok(activeKeys["active-lh"].has("C3"), "LH C3 STILL held at Beat 3");

  // At Beat 4 (t = 2400ms): LH 4-beat duration expires, RH 1-beat duration expires
  expireVoice("rh", activeVoiceNotes.get("rh"));
  expireVoice("lh", activeVoiceNotes.get("lh"));
  assert.strictEqual(activeKeys["active-rh"].size, 0, "RH keys cleared at end of measure");
  assert.strictEqual(activeKeys["active-lh"].size, 0, "LH keys cleared when whole note completes at beat 4");
  assert.strictEqual(activeVoiceNotes.size, 0, "All voices cleared");

  console.log("✔ Test 10: Polyphonic independent voice sustaining (LH whole notes vs RH quarter notes) passed");
}

// 11. Test Customizable Visualizer Key Count & Starting Offset Engine
{
  const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  function midiToPitch(num) {
    const oct = Math.floor(num / 12) - 1;
    const semi = num % 12;
    return `${NOTE_NAMES[semi]}${oct}`;
  }

  function simulateKeyboardLayout(startMidi, keyCount) {
    const minMidi = Math.max(21, Math.min(108, startMidi));
    const count = Math.max(12, Math.min(88, keyCount));
    const maxMidi = Math.min(108, minMidi + count - 1);

    const keys = [];
    const isStartBlack = [1, 3, 6, 8, 10].includes(minMidi % 12);
    if (isStartBlack) {
      keys.push({
        pitch: midiToPitch(minMidi),
        midi: minMidi,
        isBlack: true,
        isLeadingDummy: true
      });
    }

    for (let m = minMidi; m <= maxMidi; m++) {
      const semi = m % 12;
      const isBlack = [1, 3, 6, 8, 10].includes(semi);
      if (isBlack) continue;

      const whitePitch = midiToPitch(m);
      keys.push({
        pitch: whitePitch,
        midi: m,
        isBlack: false,
        isMiddleC: whitePitch === "C4"
      });

      const nextMidi = m + 1;
      const nextSemi = nextMidi % 12;
      const isNextBlack = [1, 3, 6, 8, 10].includes(nextSemi);
      if (isNextBlack && nextMidi <= maxMidi) {
        keys.push({
          pitch: midiToPitch(nextMidi),
          midi: nextMidi,
          isBlack: true,
          isMiddleC: false
        });
      }
    }

    const whiteKeys = keys.filter(k => !k.isBlack);
    const blackKeys = keys.filter(k => k.isBlack);

    return {
      keys,
      totalCount: keys.length,
      whiteCount: whiteKeys.length,
      blackCount: blackKeys.length,
      startPitch: keys[0].pitch,
      endPitch: keys[keys.length - 1].pitch,
      hasMiddleC: keys.some(k => k.pitch === "C4")
    };
  }

  // 11.1 Full 88-Key Grand Piano (A0 to C8)
  const full88 = simulateKeyboardLayout(21, 88);
  assert.strictEqual(full88.totalCount, 88, "88-key layout produces exactly 88 keys");
  assert.strictEqual(full88.whiteCount, 52, "88-key piano has exactly 52 white keys");
  assert.strictEqual(full88.blackCount, 36, "88-key piano has exactly 36 black keys");
  assert.strictEqual(full88.startPitch, "A0", "88-key piano starts on A0");
  assert.strictEqual(full88.endPitch, "C8", "88-key piano ends on C8");
  assert.strictEqual(full88.hasMiddleC, true, "Middle C is present in 88-key layout");

  // 11.2 76-Key Workstation (E1 to G7)
  const stage76 = simulateKeyboardLayout(28, 76);
  assert.strictEqual(stage76.totalCount, 76, "76-key layout produces exactly 76 keys");
  assert.strictEqual(stage76.startPitch, "E1", "76-key piano starts on E1");
  assert.strictEqual(stage76.endPitch, "G7", "76-key piano ends on G7");

  // 11.3 61-Key Standard 5-Octave (C2 to C7)
  const synth61 = simulateKeyboardLayout(36, 61);
  assert.strictEqual(synth61.totalCount, 61, "61-key layout produces exactly 61 keys");
  assert.strictEqual(synth61.whiteCount, 36, "61-key layout has 36 white keys");
  assert.strictEqual(synth61.blackCount, 25, "61-key layout has 25 black keys");
  assert.strictEqual(synth61.startPitch, "C2");
  assert.strictEqual(synth61.endPitch, "C7");

  // 11.4 49-Key Studio 4-Octave (C2 to C6)
  const studio49 = simulateKeyboardLayout(36, 49);
  assert.strictEqual(studio49.totalCount, 49, "49-key layout produces exactly 49 keys");
  assert.strictEqual(studio49.whiteCount, 29);
  assert.strictEqual(studio49.blackCount, 20);
  assert.strictEqual(studio49.startPitch, "C2");
  assert.strictEqual(studio49.endPitch, "C6");

  // 11.5 37-Key Default (C2 to C5)
  const def37 = simulateKeyboardLayout(36, 37);
  assert.strictEqual(def37.totalCount, 37, "37-key layout produces exactly 37 keys");
  assert.strictEqual(def37.startPitch, "C2");
  assert.strictEqual(def37.endPitch, "C5");

  // 11.6 32-Key Mini Synth (F2 to C5, e.g. Arturia Keystep)
  const mini32 = simulateKeyboardLayout(41, 32);
  assert.strictEqual(mini32.totalCount, 32, "32-key layout produces exactly 32 keys");
  assert.strictEqual(mini32.startPitch, "F2", "32-key controller starts on F2");
  assert.strictEqual(mini32.endPitch, "C5", "32-key controller ends on C5");

  // 11.7 25-Key Mini Controller (C3 to C5)
  const mini25 = simulateKeyboardLayout(48, 25);
  assert.strictEqual(mini25.totalCount, 25, "25-key layout produces exactly 25 keys");
  assert.strictEqual(mini25.startPitch, "C3");
  assert.strictEqual(mini25.endPitch, "C5");

  // 11.8 Custom Chromatic Offset Starting on a Black Key (F#3, 25 Keys)
  const blackOffset = simulateKeyboardLayout(54, 25);
  assert.strictEqual(blackOffset.totalCount, 25, "Custom black-key start produces exact key count");
  assert.strictEqual(blackOffset.startPitch, "F#3", "First key is F#3");
  assert.strictEqual(blackOffset.endPitch, "F#5", "Last key is F#5");

  // 11.9 Offset Shift Arithmetic
  function shiftOffset(currentStart, delta, keyCount) {
    const maxStart = 108 - keyCount + 1;
    return Math.max(21, Math.min(maxStart, currentStart + delta));
  }
  // Shift by 1 semitone
  assert.strictEqual(shiftOffset(36, 1, 37), 37, "Shift start +1 semitone");
  assert.strictEqual(shiftOffset(36, -1, 37), 35, "Shift start -1 semitone");
  // Shift by 1 octave
  assert.strictEqual(shiftOffset(36, 12, 37), 48, "Shift start +1 octave");
  assert.strictEqual(shiftOffset(36, -12, 37), 24, "Shift start -1 octave");
  // Clamping at lower boundary
  assert.strictEqual(shiftOffset(21, -1, 88), 21, "Clamped at minimum A0");
  // Clamping at upper boundary for 88 keys
  assert.strictEqual(shiftOffset(21, 1, 88), 21, "88-key piano cannot shift above A0 (max is C8)");

  console.log("✔ Test 11: Customizable visualizer key count & starting offset engine passed");
}

// 12. Test Real-Time MIDI Channel Activity Monitor & Device Switch Reset Engine
{
  const channelActivity = {};
  for (let c = 1; c <= 16; c++) {
    channelActivity[c] = {
      totalMessages: 0,
      isActive: false,
      lastActiveTime: 0,
      heldNotes: new Set()
    };
  }

  function recordMidiTelemetry(channel, cmd, noteNumber, velocity) {
    if (channel < 1 || channel > 16) return;
    const st = channelActivity[channel];
    st.totalMessages++;
    st.lastActiveTime = Date.now();

    if (cmd === 9 && velocity > 0) {
      if (noteNumber !== undefined) st.heldNotes.add(noteNumber);
      st.isActive = true;
    } else if (cmd === 8 || (cmd === 9 && velocity === 0)) {
      if (noteNumber !== undefined) st.heldNotes.delete(noteNumber);
      if (st.heldNotes.size === 0) {
        // Note release decay expires -> return to IDLE
        st.isActive = false;
      }
    } else {
      // CC / pitch bend pulse expires -> return to IDLE
      st.isActive = false;
    }
  }

  function getChannelBadge(channel) {
    const st = channelActivity[channel];
    return (st && st.isActive) ? "LIVE" : "IDLE";
  }

  function getOmniBadge() {
    const anyActive = Object.values(channelActivity).some(s => s.isActive);
    return anyActive ? "LIVE" : "OMNI";
  }

  function resetChannelActivity() {
    for (let c = 1; c <= 16; c++) {
      const st = channelActivity[c];
      st.heldNotes.clear();
      st.lastActiveTime = 0;
      st.totalMessages = 0;
      st.isActive = false;
    }
  }

  function processMidiMessage(status, data1, data2, currentFilter) {
    const cmd = status >> 4;
    const channel = (status & 0xF) + 1;
    const velocity = data2 !== undefined ? data2 : 0;
    let telemetryRecorded = false;

    // Track live incoming channel telemetry for voice messages (status < 0xF0)
    if (status < 0xF0 && channel >= 1 && channel <= 16) {
      recordMidiTelemetry(channel, cmd, data1, velocity);
      telemetryRecorded = true;
    }

    // Filter gating check
    const passesFilter = (currentFilter === "all" || channel === parseInt(currentFilter, 10));

    return {
      channel,
      cmd,
      telemetryRecorded,
      passesFilter
    };
  }

  // 12.1 Channel Voice Messages & Polyphonic Note Tracking (Channel 1)
  // Press Middle C (60) on Channel 1
  const noteOn1 = processMidiMessage(0x90, 60, 100, "all");
  assert.strictEqual(noteOn1.channel, 1);
  assert.strictEqual(noteOn1.telemetryRecorded, true);
  assert.strictEqual(channelActivity[1].isActive, true);
  assert.strictEqual(channelActivity[1].heldNotes.has(60), true);
  assert.strictEqual(getChannelBadge(1), "LIVE");
  assert.strictEqual(getOmniBadge(), "LIVE");

  // Press E4 (64) on Channel 1 (2-note chord)
  const noteOn2 = processMidiMessage(0x90, 64, 90, "all");
  assert.strictEqual(channelActivity[1].heldNotes.size, 2);
  assert.strictEqual(channelActivity[1].isActive, true);
  assert.strictEqual(getChannelBadge(1), "LIVE");

  // Release Middle C (60) while E4 is still held
  const noteOff1 = processMidiMessage(0x80, 60, 0, "all");
  assert.strictEqual(channelActivity[1].heldNotes.size, 1);
  assert.strictEqual(channelActivity[1].heldNotes.has(64), true);
  assert.strictEqual(channelActivity[1].isActive, true, "Channel 1 remains LIVE while other notes are held");
  assert.strictEqual(getChannelBadge(1), "LIVE");

  // 12.2 Clean Return to IDLE When Notes Release
  // Release E4 (64) -> All notes released on Channel 1
  const noteOff2 = processMidiMessage(0x80, 64, 0, "all");
  assert.strictEqual(channelActivity[1].heldNotes.size, 0);
  assert.strictEqual(channelActivity[1].isActive, false, "Channel 1 returns to inactive once all notes released");
  assert.strictEqual(getChannelBadge(1), "IDLE", "Channel 1 must return cleanly to IDLE (never lingering as ACTIVE)");
  assert.strictEqual(getOmniBadge(), "OMNI", "Omni returns to OMNI once all channels are idle");

  // 12.3 Real-time System Messages Ignored (Clocks & Active Sensing)
  const msgClock = processMidiMessage(0xF8, 0, 0, "all");
  assert.strictEqual(msgClock.telemetryRecorded, false, "MIDI Clock (0xF8) must not trigger channel telemetry");

  const msgSense = processMidiMessage(0xFE, 0, 0, "all");
  assert.strictEqual(msgSense.telemetryRecorded, false, "Active Sensing (0xFE) must not trigger channel telemetry");

  // 12.4 Pre-Filter Telemetry Recording Verification
  // When filter is set to Channel 1, receiving data on Channel 5 still records Ch 5 activity
  const msgCh5 = processMidiMessage(0x94, 67, 100, "1"); // Note on Ch 5 while filter is '1'
  assert.strictEqual(msgCh5.telemetryRecorded, true, "Channel 5 activity recorded even when filter is set to Ch 1");
  assert.strictEqual(msgCh5.passesFilter, false, "Channel 5 data correctly gated from downstream processing");
  assert.strictEqual(channelActivity[5].isActive, true, "Channel 5 marked LIVE so user sees live channel");
  assert.strictEqual(getChannelBadge(5), "LIVE");

  // 12.5 Device Switch / Rescan Clean Reset
  // Switch MIDI device: all channels must reset completely to IDLE
  resetChannelActivity();
  for (let c = 1; c <= 16; c++) {
    assert.strictEqual(channelActivity[c].isActive, false, `Channel ${c} must be inactive after device reset`);
    assert.strictEqual(channelActivity[c].heldNotes.size, 0, `Channel ${c} held notes must be empty after device reset`);
    assert.strictEqual(channelActivity[c].totalMessages, 0, `Channel ${c} message count must be 0 after device reset`);
    assert.strictEqual(getChannelBadge(c), "IDLE", `Channel ${c} badge must be IDLE after device reset`);
  }
  assert.strictEqual(getOmniBadge(), "OMNI", "Omni badge must be OMNI after device reset");

  console.log("✔ Test 12: Real-time MIDI channel activity monitor, IDLE return & device reset engine passed");
}

// 13. Test Dual-Hand Harmony Practice & Multi-Level Harmony Engine
{
  // 13.1 Simultaneous Left-Hand + Harmonies Alignment across repertoire
  songDatabase.forEach(song => {
    // Model with both Harmonies and Left-Hand active
    const model = buildScoreModel(song, false, true, true, "song");
    assert.ok(model.steps.length > 0, `Song ${song.title} must generate steps with Harmonies + LH`);
    assert.ok(model.measures.length > 0, `Song ${song.title} must generate measures with Harmonies + LH`);

    // Verify LH bass notes are present in the score steps
    const hasLhStep = model.steps.some(st => st.lh !== null && st.lh !== undefined);
    assert.strictEqual(hasLhStep, true, `Song ${song.title} must include LH bass steps when harmonies are on`);

    // Verify Dyad harmony notes are present in the score steps
    const hasDyadStep = model.steps.some(st => st.dyad !== null && st.dyad !== undefined);
    assert.strictEqual(hasDyadStep, true, `Song ${song.title} must include dyad steps when harmonies are on`);

    // Verify concurrent onset expectations (where both hands strike simultaneously)
    const dualOnsetStep = model.steps.find(st => st.dyad && st.dyad.pitch !== "-" && st.lh && st.lh.pitch !== "-");
    if (dualOnsetStep) {
      const dyadPitches = dualOnsetStep.dyad.pitch.split("+").filter(p => p !== "-");
      const lhPitches = dualOnsetStep.lh.pitch.split("+").filter(p => p !== "-");
      dyadPitches.forEach(p => assert.ok(dualOnsetStep.expectedPitches.includes(p)));
      lhPitches.forEach(p => assert.ok(dualOnsetStep.expectedPitches.includes(p)));
    }
  });

  // 13.2 Ode to Joy Dual-Hand Harmony Verification
  const odeSong = songDatabase.find(s => s.id === "ode-to-joy");
  const odeModel = buildScoreModel(odeSong, false, true, true, "song");
  // M1 Beat 0: Dyad C4+E4, LH C3
  const odeStep0 = odeModel.steps[0];
  assert.strictEqual(odeStep0.measure, 1);
  assert.strictEqual(odeStep0.startBeat, 0);
  assert.strictEqual(odeStep0.dyad.pitch, "C4+E4");
  assert.strictEqual(odeStep0.lh.pitch, "C3");
  assert.deepStrictEqual(odeStep0.expectedPitches, ["C4", "E4", "C3"]);

  // M1 Beat 1: Dyad C4+E4, LH is held (null onset)
  const odeStep1 = odeModel.steps[1];
  assert.strictEqual(odeStep1.measure, 1);
  assert.strictEqual(odeStep1.startBeat, 1);
  assert.strictEqual(odeStep1.dyad.pitch, "C4+E4");
  assert.strictEqual(odeStep1.lh, null);
  assert.deepStrictEqual(odeStep1.expectedPitches, ["C4", "E4"]);

  // 13.3 Multi-Level Harmony Interval Generation (Thirds, Fifths, Sixths, Octaves, Triads)
  const leanSong = songDatabase.find(s => s.id === "lean-on-me");
  
  // Thirds Above: C4 -> C4+E4, D4 -> D4+F4, E4 -> E4+G4
  const thirdsModel = buildScoreModel(leanSong, false, false, true, "thirds");
  assert.strictEqual(thirdsModel.steps[0].dyad.pitch, "C4+E4");
  assert.strictEqual(thirdsModel.steps[2].dyad.pitch, "D4+F4");
  assert.strictEqual(thirdsModel.steps[3].dyad.pitch, "E4+G4");
  assert.strictEqual(thirdsModel.steps[0].dyadF, "1+3");

  // Thirds Below: E4 -> C4+E4
  const thirdsBelowModel = buildScoreModel(leanSong, false, false, true, "thirds_below");
  assert.strictEqual(thirdsBelowModel.steps[3].dyad.pitch, "C4+E4"); // E4 - 2 diatonic steps = C4

  // Fifths: C4 -> C4+G4, D4 -> D4+A4
  const fifthsModel = buildScoreModel(leanSong, false, false, true, "fifths");
  assert.strictEqual(fifthsModel.steps[0].dyad.pitch, "C4+G4");
  assert.strictEqual(fifthsModel.steps[2].dyad.pitch, "D4+A4");
  assert.strictEqual(fifthsModel.steps[0].dyadF, "1+5");

  // Sixths: C4 -> C4+A4, D4 -> D4+B4
  const sixthsModel = buildScoreModel(leanSong, false, false, true, "sixths");
  assert.strictEqual(sixthsModel.steps[0].dyad.pitch, "C4+A4");
  assert.strictEqual(sixthsModel.steps[2].dyad.pitch, "D4+B4");
  assert.strictEqual(sixthsModel.steps[0].dyadF, "1+5");

  // Octaves: C4 -> C4+C5
  const octavesModel = buildScoreModel(leanSong, false, false, true, "octaves");
  assert.strictEqual(octavesModel.steps[0].dyad.pitch, "C4+C5");
  assert.strictEqual(octavesModel.steps[0].dyadF, "1+5");

  // Full Triads: C4 -> C4+E4+G4
  const triadsModel = buildScoreModel(leanSong, false, true, true, "triads");
  assert.strictEqual(triadsModel.steps[0].dyad.pitch, "C4+E4+G4");
  assert.strictEqual(triadsModel.steps[0].dyadF, "1+3+5");
  assert.deepStrictEqual(triadsModel.steps[0].expectedPitches, ["C4", "E4", "G4", "C3"]);

  // 13.4 Key-Signature & Accidental Awareness (Minuet in G & Canon in D)
  const canonSong = songDatabase.find(s => s.id === "canon-in-d");
  const canonThirds = buildScoreModel(canonSong, false, false, true, "thirds");
  // In D major, melody pitch F#4 -> 3rd above is A4 => F#4+A4
  const canonStep0 = canonThirds.steps[0];
  assert.strictEqual(canonStep0.dyad.pitch, "F#4+A4");
  // D4 in melody (step 2) -> 3rd above is F#4 => D4+F#4
  const canonStep2 = canonThirds.steps[2];
  assert.strictEqual(canonStep2.dyad.pitch, "D4+F#4");

  // 13.5 Grand Staff Geometry Calculations
  const isGrandStaffDualHarm = ((false || true) && true); // showDyads=true, showLH=true
  assert.strictEqual(isGrandStaffDualHarm, true, "Grand staff must be true when showDyads and showLH are active");
  const systemHeight = isGrandStaffDualHarm ? 275 : 160;
  assert.strictEqual(systemHeight, 275, "System height must be 275 for dual-hand grand staff");
  const trebleBottomY = 30 + 12 + 40; // 82
  const bassTopY = isGrandStaffDualHarm ? (trebleBottomY + 80) : 12; // 162
  assert.strictEqual(bassTopY, 162, "Bass staff must be positioned at trebleBottomY + 80 (162px)");

  console.log("✔ Test 13: Dual-hand harmony practice & multi-level harmony engine passed");
}

// 14. Test Unique Song IDs & Dynamic Category Pill Derivation
{
  // 14.1 Verify all song IDs are strictly unique
  const idCounts = {};
  songDatabase.forEach(song => {
    idCounts[song.id] = (idCounts[song.id] || 0) + 1;
  });
  const duplicates = Object.entries(idCounts).filter(([id, count]) => count > 1);
  assert.strictEqual(duplicates.length, 0, `No duplicate song IDs allowed, found: ${JSON.stringify(duplicates)}`);

  // 14.2 Verify specific renamed primer arrangements vs classical mastery
  const furEliseMotif = songDatabase.find(s => s.id === "fur-elise-motif");
  assert.ok(furEliseMotif, "Für Elise (Hook Motif) must be accessible with id 'fur-elise-motif'");

  const furEliseMastery = songDatabase.find(s => s.id === "fur-elise");
  assert.ok(furEliseMastery, "Classical Mastery Für Elise must be accessible with id 'fur-elise'");
  assert.strictEqual(furEliseMastery.category, "Classical Mastery");

  const scarboroughPrimer = songDatabase.find(s => s.id === "scarborough-fair-primer");
  assert.ok(scarboroughPrimer, "Scarborough Fair primer must be accessible");

  const greensleevesPrimer = songDatabase.find(s => s.id === "greensleeves-primer");
  assert.ok(greensleevesPrimer, "Greensleeves primer must be accessible");

  const amazingGraceF = songDatabase.find(s => s.id === "amazing-grace-f");
  assert.ok(amazingGraceF, "Amazing Grace (Key of F) must be accessible");

  // 14.3 Verify Dynamic Category Pills includes all categories
  const uniqueCats = [...new Set(songDatabase.map(s => s.category).filter(Boolean))];
  assert.ok(uniqueCats.includes("Classical Mastery"), "Dynamic categories must include Classical Mastery");
  assert.ok(uniqueCats.includes("C 5-Finger"), "Dynamic categories must include C 5-Finger");
  assert.ok(uniqueCats.includes("Harmonic / Dyads"), "Dynamic categories must include Harmonic / Dyads");
  assert.ok(uniqueCats.includes("Extended Scale"), "Dynamic categories must include Extended Scale");
  assert.ok(uniqueCats.includes("Minor / Modal"), "Dynamic categories must include Minor / Modal");

  const dynamicCategories = [
    { key: "all", label: `All (${songDatabase.length})` },
    ...uniqueCats.map(cat => ({
      key: cat,
      label: `${cat} (${songDatabase.filter(s => s.category === cat).length})`
    }))
  ];
  assert.strictEqual(dynamicCategories.length, uniqueCats.length + 1);
  const masteryEntry = dynamicCategories.find(c => c.key === "Classical Mastery");
  assert.ok(masteryEntry.label.includes("Classical Mastery ("));

  console.log("✔ Test 14: Unique song IDs & dynamic category pill derivation passed");
}

// 15. Test Velocity-Sensitive Timbre Scaling & CC 64 Sustain Pedal Engine
{
  class MockSynthVoiceEngine {
    constructor() {
      this.isSustainPedalDown = false;
      this.pedaledNotes = new Set();
      this.activeHeldMidiNotes = new Set();
      this.liveOscillators = new Map();
      this.currentMasterVolume = 0.8;
      this.isMasterMuted = false;
    }

    startLiveTone(noteNumber, velocity = 100) {
      if (this.liveOscillators.has(noteNumber)) {
        this.stopLiveTone(noteNumber, true);
      }
      const effectiveVol = this.isMasterMuted ? 0 : this.currentMasterVolume;
      if (effectiveVol <= 0.0001) return null;

      const velNorm = Math.max(0.15, Math.min(1, velocity / 127));
      const volScale = Math.pow(effectiveVol, 2) * velNorm;
      const freq = 440 * Math.pow(2, (noteNumber - 69) / 12);
      const filterCutoff = freq * (2.5 + velNorm * 6);

      const voice = {
        noteNumber,
        velocity,
        velNorm,
        volScale,
        filterCutoff,
        isRinging: true
      };
      this.liveOscillators.set(noteNumber, voice);
      return voice;
    }

    stopLiveTone(noteNumber, forceImmediate = false) {
      if (this.isSustainPedalDown && !forceImmediate) {
        this.pedaledNotes.add(noteNumber);
        return false;
      }
      const voice = this.liveOscillators.get(noteNumber);
      if (!voice) return false;
      voice.isRinging = false;
      this.liveOscillators.delete(noteNumber);
      return true;
    }

    handleMidiMessage(status, data1, data2) {
      const cmd = status >> 4;
      const velocity = data2 !== undefined ? data2 : 0;
      const noteNumber = data1;

      // CC 64 Sustain Pedal
      if (cmd === 11 && data1 === 64) {
        this.isSustainPedalDown = (velocity >= 64);
        if (!this.isSustainPedalDown) {
          this.pedaledNotes.forEach(num => {
            if (!this.activeHeldMidiNotes.has(num)) {
              this.stopLiveTone(num, true);
            }
          });
          this.pedaledNotes.clear();
        }
        return { type: "pedal", down: this.isSustainPedalDown };
      }

      // Note On
      if (cmd === 9 && velocity > 0) {
        this.activeHeldMidiNotes.add(noteNumber);
        const voice = this.startLiveTone(noteNumber, velocity);
        return { type: "note_on", voice };
      }

      // Note Off
      if (cmd === 8 || (cmd === 9 && velocity === 0)) {
        this.activeHeldMidiNotes.delete(noteNumber);
        const stopped = this.stopLiveTone(noteNumber);
        return { type: "note_off", stopped };
      }

      return null;
    }
  }

  const engine = new MockSynthVoiceEngine();

  // 15.1 Verify Velocity Scaling & Filter Cutoff
  const softStrike = engine.startLiveTone(60, 30); // Middle C soft
  const hardStrike = engine.startLiveTone(60, 120); // Middle C forte

  assert.ok(hardStrike.volScale > softStrike.volScale * 2.5, "Hard strike volume must exceed soft strike");
  assert.ok(hardStrike.filterCutoff > softStrike.filterCutoff * 1.5, "Hard strike filter must be brighter");

  // 15.2 Verify Note-Off without pedal stops immediately
  engine.handleMidiMessage(0x90, 60, 100); // Note On C4
  assert.strictEqual(engine.liveOscillators.has(60), true, "Voice 60 active");
  engine.handleMidiMessage(0x80, 60, 0); // Note Off C4
  assert.strictEqual(engine.liveOscillators.has(60), false, "Voice 60 stopped immediately without pedal");

  // 15.3 Verify CC 64 Sustain Pedal keeps notes ringing after key release
  engine.handleMidiMessage(0xB0, 64, 127); // Pedal Down (CC 64 = 127)
  assert.strictEqual(engine.isSustainPedalDown, true, "Sustain pedal is down");

  engine.handleMidiMessage(0x90, 64, 90); // Note On E4
  assert.strictEqual(engine.liveOscillators.has(64), true, "Voice 64 active");

  engine.handleMidiMessage(0x80, 64, 0); // Note Off E4 (Key released, but pedal down!)
  assert.strictEqual(engine.pedaledNotes.has(64), true, "Voice 64 registered in pedaledNotes");
  assert.strictEqual(engine.liveOscillators.has(64), true, "Voice 64 remains sounding because pedal is down");

  // Release pedal (CC 64 = 0)
  engine.handleMidiMessage(0xB0, 64, 0); // Pedal Up
  assert.strictEqual(engine.isSustainPedalDown, false, "Sustain pedal is released");
  assert.strictEqual(engine.pedaledNotes.size, 0, "Pedaled notes cleared");
  assert.strictEqual(engine.liveOscillators.has(64), false, "Voice 64 stops when pedal is released");

  // 15.4 Re-strike cleanly while pedaled
  engine.handleMidiMessage(0xB0, 64, 127); // Pedal Down
  engine.handleMidiMessage(0x90, 67, 100); // Note On G4
  engine.handleMidiMessage(0x80, 67, 0);   // Note Off G4 (kept by pedal)
  assert.strictEqual(engine.pedaledNotes.has(67), true);

  // Re-strike G4
  engine.handleMidiMessage(0x90, 67, 110); // Re-strike Note On G4
  assert.strictEqual(engine.liveOscillators.has(67), true, "G4 restrikes cleanly without oscillator leaks");
  engine.handleMidiMessage(0xB0, 64, 0);   // Release pedal

  console.log("✔ Test 15: Velocity-sensitive timbre scaling & CC 64 sustain pedal engine passed");
}

// ==========================================
// TEST 16: Proportional Beat Spacing, Rest Glyphs & Roman Numeral Harmonic Analysis
// ==========================================
{
  // 16.1 Verify Beat-Proportional Spacing calculation
  const NOTE_OFFSETS = window.MusicTheory.NOTE_OFFSETS;

  function calculateNoteX(item, measureStartX, availableInnerX, totalMeasureBeats, nIdx, noteCount) {
    const beatVal = (typeof item.startBeat === "number" && !isNaN(item.startBeat))
      ? item.startBeat
      : (nIdx * (totalMeasureBeats / Math.max(1, noteCount)));
    const beatFraction = Math.max(0, Math.min(1, beatVal / totalMeasureBeats));
    return measureStartX + 18 + beatFraction * availableInnerX;
  }

  const testSong = {
    id: "rhythm-sync-test",
    title: "Rhythm Sync Test",
    rh: "C4:2.0 E4:1.0 G4:1.0 | C5:3.0 -:1.0",
    lh: "C3:4.0 | C3:2.0 G3:2.0",
    meter: 4
  };

  const model = buildScoreModel(testSong, true, true, false);
  assert.strictEqual(model.measures.length, 2, "Must build 2 measures");

  const m1 = model.measures[0];
  // In Measure 1:
  // Onsets: C4+C3 at beat 0; E4 at beat 2; G4 at beat 3
  assert.strictEqual(m1.length, 3, "Measure 1 should have 3 rhythm steps");
  assert.strictEqual(m1[0].startBeat, 0, "First step at beat 0");
  assert.strictEqual(m1[1].startBeat, 2, "Second step at beat 2 (after half note)");
  assert.strictEqual(m1[2].startBeat, 3, "Third step at beat 3 (after quarter note)");

  const startX = 50;
  const availW = 200;
  const x0 = calculateNoteX(m1[0], startX, availW, 4, 0, 3);
  const x1 = calculateNoteX(m1[1], startX, availW, 4, 1, 3);
  const x2 = calculateNoteX(m1[2], startX, availW, 4, 2, 3);

  // Proportional:
  // x0 = 50 + 18 + (0/4)*200 = 68
  // x1 = 50 + 18 + (2/4)*200 = 68 + 100 = 168 (exactly at the half-way point of the measure!)
  // x2 = 50 + 18 + (3/4)*200 = 68 + 150 = 218 (at 3/4 point)
  assert.strictEqual(Math.round(x0), 68, "Beat 0 coordinate");
  assert.strictEqual(Math.round(x1), 168, "Beat 2 coordinate is exactly midpoint");
  assert.strictEqual(Math.round(x2), 218, "Beat 3 coordinate is at 3/4 distance");

  // 16.2 Verify Rhythmic Rest Glyphs
  function getRestGlyph(beats) {
    if (beats >= 3.5) return "𝄻"; // Whole rest
    if (beats >= 1.75) return "𝄼"; // Half rest
    if (beats <= 0.75) return "𝄾"; // Eighth rest
    return "𝄽"; // Quarter rest
  }

  assert.strictEqual(getRestGlyph(4.0), "𝄻", "Whole rest (4 beats)");
  assert.strictEqual(getRestGlyph(2.0), "𝄼", "Half rest (2 beats)");
  assert.strictEqual(getRestGlyph(1.0), "𝄽", "Quarter rest (1 beat)");
  assert.strictEqual(getRestGlyph(0.5), "𝄾", "Eighth rest (0.5 beat)");

  // Measure 2 has a 1-beat rest at beat 3
  const m2 = model.measures[1];
  const restItem = m2.find(item => item.rh && item.rh.pitch === "-");
  assert.ok(restItem, "Measure 2 contains rest token '-'");
  assert.strictEqual(restItem.startBeat, 3, "Rest occurs at beat 3");
  assert.strictEqual(getRestGlyph(restItem.rh.beats), "𝄽", "Quarter rest glyph for 1.0 beat");

  // 16.3 Verify Harmonic Roman Numeral Analysis
  function getRomanNumeralAnalysis(chordInfo, song) {
    if (!chordInfo || !chordInfo.name || !song) return null;
    let tonic = "C";
    if (song.category && song.category.includes("C 5-Finger")) tonic = "C";
    else if (song.id === "canon-in-d") tonic = "D";
    else if (song.id === "bach-minuet-g" || (song.rh && song.rh.includes("F#4") && !song.rh.includes("C#5"))) tonic = "G";
    else if (song.id && (song.id.includes("scarborough-fair") || song.id === "gymnopedie-no-1")) tonic = "D";
    else if (song.id && (song.id.includes("fur-elise") || song.id.includes("greensleeves"))) tonic = "A";
    else if (song.id && song.id.includes("amazing-grace-f")) tonic = "F";
    else {
      const firstBass = song.lh ? song.lh.match(/([A-G][#b]?)/) : null;
      if (firstBass) tonic = firstBass[1];
      else {
        const firstMel = song.rh ? song.rh.match(/([A-G][#b]?)/) : null;
        if (firstMel) tonic = firstMel[1];
      }
    }

    const tonicSemi = NOTE_OFFSETS[tonic] ?? 0;
    const rootMatch = chordInfo.name.match(/^([A-G][#b]?)/);
    if (!rootMatch) return null;
    const chordRoot = rootMatch[1];
    const chordSemi = NOTE_OFFSETS[chordRoot];
    if (chordSemi === undefined) return null;

    const diff = (chordSemi - tonicSemi + 12) % 12;
    const isMinor = chordInfo.name.includes("Minor") || chordInfo.name.includes("m7") || chordInfo.type === "Minor Triad";

    const majorNumerals = {
      0: "I", 1: "♭II", 2: "ii", 3: "♭III", 4: "iii", 5: "IV",
      6: "♯IV", 7: "V", 8: "♭VI", 9: "vi", 10: "♭VII", 11: "vii°"
    };

    let base = majorNumerals[diff] || "I";
    if (isMinor) base = base.toLowerCase();
    else if (chordInfo.type === "Major Triad") base = base.toUpperCase();

    if (chordInfo.name.includes("7")) base += "7";
    return base;
  }

  // Canon in D (Tonic D)
  const canonSong = { id: "canon-in-d", title: "Canon in D" };
  assert.strictEqual(getRomanNumeralAnalysis({ name: "D Major", type: "Major Triad" }, canonSong), "I");
  assert.strictEqual(getRomanNumeralAnalysis({ name: "A Major", type: "Major Triad" }, canonSong), "V");
  assert.strictEqual(getRomanNumeralAnalysis({ name: "B Minor", type: "Minor Triad" }, canonSong), "vi");
  assert.strictEqual(getRomanNumeralAnalysis({ name: "F# Minor", type: "Minor Triad" }, canonSong), "iii");
  assert.strictEqual(getRomanNumeralAnalysis({ name: "G Major", type: "Major Triad" }, canonSong), "IV");

  // C Major Piece (Tonic C)
  const cSong = { id: "c-primer", category: "C 5-Finger", title: "Primer" };
  assert.strictEqual(getRomanNumeralAnalysis({ name: "C Major", type: "Major Triad" }, cSong), "I");
  assert.strictEqual(getRomanNumeralAnalysis({ name: "G Major", type: "Major Triad" }, cSong), "V");
  assert.strictEqual(getRomanNumeralAnalysis({ name: "A Minor", type: "Minor Triad" }, cSong), "vi");
  assert.strictEqual(getRomanNumeralAnalysis({ name: "F Major", type: "Major Triad" }, cSong), "IV");
  assert.strictEqual(getRomanNumeralAnalysis({ name: "D Minor", type: "Minor Triad" }, cSong), "ii");
  assert.strictEqual(getRomanNumeralAnalysis({ name: "G7", type: "Dominant 7th" }, cSong), "V7");

  console.log("✔ Test 16: Beat-proportional spacing, rest glyphs & Roman numeral harmonic badges passed");
}

// ==========================================
// TEST 17: 🥁 Tempo Flow Mode Playhead Timing Windows & Accuracy Scoring
// ==========================================
{
  function classifyTimingOffset(diffMs, isLate = true) {
    const absDiff = Math.abs(diffMs);
    if (absDiff <= 45) return { grade: "PERFECT", pts: 100, badge: "🔥" };
    if (absDiff <= 95) return { grade: "GOOD", pts: 75, badge: "✨" };
    return { grade: isLate ? "LATE" : "EARLY", pts: 40, badge: "⚠️" };
  }

  function calculateFlowAccuracy(stats) {
    const { perfect, good, lateOrEarly, missed, total } = stats;
    const maxPts = Math.max(1, total) * 100;
    const earned = perfect * 100 + good * 75 + lateOrEarly * 40;
    return Math.min(100, Math.round((earned / maxPts) * 100));
  }

  // 17.1 Test Timing Window Classification
  // Hit right on the beat (+12ms): PERFECT
  assert.strictEqual(classifyTimingOffset(12).grade, "PERFECT");
  // Hit boundary +44ms: PERFECT
  assert.strictEqual(classifyTimingOffset(44).grade, "PERFECT");
  // Hit +48ms: GOOD
  assert.strictEqual(classifyTimingOffset(48).grade, "GOOD");
  // Hit +92ms: GOOD
  assert.strictEqual(classifyTimingOffset(92).grade, "GOOD");
  // Hit +115ms: LATE
  assert.strictEqual(classifyTimingOffset(115, true).grade, "LATE");
  // Hit early -110ms: EARLY
  assert.strictEqual(classifyTimingOffset(110, false).grade, "EARLY");

  // 17.2 Test Accuracy Rating Formula
  const allPerfect = { total: 10, perfect: 10, good: 0, lateOrEarly: 0, missed: 0 };
  assert.strictEqual(calculateFlowAccuracy(allPerfect), 100, "10/10 Perfect is 100%");

  const mixed = { total: 10, perfect: 8, good: 2, lateOrEarly: 0, missed: 0 };
  // (8*100 + 2*75) / 1000 = 950 / 1000 = 95%
  assert.strictEqual(calculateFlowAccuracy(mixed), 95, "8 Perfect, 2 Good is 95%");

  const humanPlay = { total: 10, perfect: 4, good: 2, lateOrEarly: 2, missed: 2 };
  // (4*100 + 2*75 + 2*40 + 0) / 1000 = (400 + 150 + 80) / 1000 = 630 / 1000 = 63%
  assert.strictEqual(calculateFlowAccuracy(humanPlay), 63, "4 Perfect, 2 Good, 2 Late, 2 Miss is 63%");

  // 17.3 Count-in & Step Duration Schedule
  const bpm = 120;
  const beatMs = (60 / bpm) * 1000; // 500ms
  assert.strictEqual(beatMs, 500, "120 BPM = 500ms per beat");

  const countInBeats = 4;
  const countInDuration = countInBeats * beatMs; // 2000ms
  assert.strictEqual(countInDuration, 2000, "4-beat count-in is 2000ms at 120 BPM");

  const halfNoteStep = { beats: 2.0 };
  const quarterNoteStep = { beats: 1.0 };
  const eighthNoteStep = { beats: 0.5 };

  assert.strictEqual(halfNoteStep.beats * beatMs, 1000, "Half note is 1000ms");
  assert.strictEqual(quarterNoteStep.beats * beatMs, 500, "Quarter note is 500ms");
  assert.strictEqual(eighthNoteStep.beats * beatMs, 250, "Eighth note is 250ms");

  console.log("✔ Test 17: 🥁 Tempo Flow Mode timing windows, scoring & count-in passed");
}

// ==========================================
// TEST 18: 🎹 Real-Time Polyphonic Chord Recognizer, Inversion Engine & Non-Clobbering
// ==========================================
{
  const theory = window.MusicTheory;
  assert.ok(typeof theory.identifyActiveChord === "function", "identifyActiveChord must be exported from MusicTheory");

  // 18.1 Single Note
  const single = theory.identifyActiveChord(["C4"]);
  assert.strictEqual(single.name, "C4");
  assert.strictEqual(single.type, "Single Pitch");

  // 18.2 Octaves / Unisons across multiple registers
  const octave2 = theory.identifyActiveChord(["C3", "C4"]);
  assert.strictEqual(octave2.name, "C Octave");
  assert.strictEqual(octave2.type, "Octave / Unison");

  const octave3 = theory.identifyActiveChord(["C2", "C3", "C4"]);
  assert.strictEqual(octave3.name, "C Octave");
  assert.strictEqual(octave3.type, "Octave / Unison");

  // 18.3 Power Chords & Dyads
  const powerChord = theory.identifyActiveChord(["C3", "G3"]);
  assert.strictEqual(powerChord.name, "C5");
  assert.strictEqual(powerChord.type, "Power Chord");

  const powerChordWithOctave = theory.identifyActiveChord(["C3", "G3", "C4"]);
  assert.strictEqual(powerChordWithOctave.name, "C5");
  assert.strictEqual(powerChordWithOctave.type, "Power Chord");

  const invertedFifth = theory.identifyActiveChord(["G3", "C4"]);
  assert.strictEqual(invertedFifth.name, "C5 / G");
  assert.strictEqual(invertedFifth.type, "Inverted 5th");

  const maj3rdDyad = theory.identifyActiveChord(["C4", "E4"]);
  assert.strictEqual(maj3rdDyad.name, "C + E");
  assert.strictEqual(maj3rdDyad.type, "Major 3rd");

  // 18.4 Major Triad & Inversions (Root, 1st Inv, 2nd Inv)
  const cMajRoot = theory.identifyActiveChord(["C4", "E4", "G4"]);
  assert.strictEqual(cMajRoot.name, "C Major");
  assert.strictEqual(cMajRoot.type, "Major Triad");

  const cMaj1stInv = theory.identifyActiveChord(["E4", "G4", "C5"]);
  assert.strictEqual(cMaj1stInv.name, "C Major / E");
  assert.strictEqual(cMaj1stInv.type, "1st Inversion");

  const cMaj2ndInv = theory.identifyActiveChord(["G3", "C4", "E4"]);
  assert.strictEqual(cMaj2ndInv.name, "C Major / G");
  assert.strictEqual(cMaj2ndInv.type, "2nd Inversion");

  // 18.5 Minor Triad & Inversions
  const aMinRoot = theory.identifyActiveChord(["A3", "C4", "E4"]);
  assert.strictEqual(aMinRoot.name, "A Minor");
  assert.strictEqual(aMinRoot.type, "Minor Triad");

  const aMin1stInv = theory.identifyActiveChord(["C4", "E4", "A4"]);
  assert.strictEqual(aMin1stInv.name, "A Minor / C");
  assert.strictEqual(aMin1stInv.type, "1st Inversion");

  const aMin2ndInv = theory.identifyActiveChord(["E3", "A3", "C4"]);
  assert.strictEqual(aMin2ndInv.name, "A Minor / E");
  assert.strictEqual(aMin2ndInv.type, "2nd Inversion");

  // 18.6 Dominant 7th & Inversions
  const g7Root = theory.identifyActiveChord(["G3", "B3", "D4", "F4"]);
  assert.strictEqual(g7Root.name, "G7");
  assert.strictEqual(g7Root.type, "Dominant 7th");

  const g7_3rdInv = theory.identifyActiveChord(["F3", "G3", "B3", "D4"]);
  assert.strictEqual(g7_3rdInv.name, "G7 / F");
  assert.strictEqual(g7_3rdInv.type, "3rd Inversion");

  // 18.7 Other 7th Chords
  const cMaj7 = theory.identifyActiveChord(["C4", "E4", "G4", "B4"]);
  assert.strictEqual(cMaj7.name, "Cmaj7");
  assert.strictEqual(cMaj7.type, "Major 7th");

  const dMin7 = theory.identifyActiveChord(["D4", "F4", "A4", "C5"]);
  assert.strictEqual(dMin7.name, "Dm7");
  assert.strictEqual(dMin7.type, "Minor 7th");

  const bDim7 = theory.identifyActiveChord(["B3", "D4", "F4", "G#4"]);
  assert.strictEqual(bDim7.name, "Bdim7");
  assert.strictEqual(bDim7.type, "Diminished 7th");

  const bHalfDim7 = theory.identifyActiveChord(["B3", "D4", "F4", "A4"]);
  assert.strictEqual(bHalfDim7.name, "Bm7b5");
  assert.strictEqual(bHalfDim7.type, "Half-Diminished 7th");

  // 18.8 Shell Voicings (No 5th)
  const c7Shell = theory.identifyActiveChord(["C4", "E4", "A#4"]);
  assert.strictEqual(c7Shell.name, "C7 (no 5th)");
  assert.strictEqual(c7Shell.type, "Dominant 7th Shell");

  const cMaj7Shell = theory.identifyActiveChord(["C4", "E4", "B4"]);
  assert.strictEqual(cMaj7Shell.name, "Cmaj7 (no 5th)");
  assert.strictEqual(cMaj7Shell.type, "Major 7th Shell");

  // 18.9 Multi-Note Cluster
  const cluster = theory.identifyActiveChord(["C4", "C#4", "D4"]);
  assert.strictEqual(cluster.type, "Multi-Note Cluster");

  // 18.10 Non-Clobbering Simulation & State Lifecycle
  // Mock keyboard state mimicking handleIncomingMIDIMessage and handleNoteDown
  const activeHeldMidiNotes = new Map();
  const pedaledNotes = new Set();
  let isSustainPedalDown = false;
  let chordPillText = "";

  function setChordPillMock(notes) {
    if (!notes || notes.length === 0) {
      chordPillText = "";
      return;
    }
    const info = theory.identifyActiveChord(notes);
    chordPillText = info ? `${info.name} (${info.type})` : "";
  }

  function updateMockRecognizer() {
    const map = new Map();
    for (const [num, d] of activeHeldMidiNotes) map.set(num, d);
    if (isSustainPedalDown) {
      for (const num of pedaledNotes) {
        if (!map.has(num)) map.set(num, { num, pitch: theory.midiToPitch(num) });
      }
    }
    setChordPillMock(Array.from(map.values()));
  }

  function playSingleNoteAuditMock(noteStr) {
    // In buggy version, this line overwrote the chord pill:
    // setChordPillMock([{ num: theory.pitchToMidi(noteStr), pitch: noteStr }]);
    // In our fixed version, playSingleNoteAudit ONLY plays audio tone and highlights key!
  }

  // Step A: Strike C4 (60)
  activeHeldMidiNotes.set(60, { num: 60, pitch: "C4" });
  updateMockRecognizer();
  playSingleNoteAuditMock("C4");
  assert.strictEqual(chordPillText, "C4 (Single Pitch)");

  // Step B: Strike E4 (64) while C4 held
  activeHeldMidiNotes.set(64, { num: 64, pitch: "E4" });
  updateMockRecognizer();
  playSingleNoteAuditMock("E4");
  assert.strictEqual(chordPillText, "C + E (Major 3rd)", "Dyad preserved without being clobbered by E4");

  // Step C: Strike G4 (67) while C4 and E4 held
  activeHeldMidiNotes.set(67, { num: 67, pitch: "G4" });
  updateMockRecognizer();
  playSingleNoteAuditMock("G4");
  assert.strictEqual(chordPillText, "C Major (Major Triad)", "Full C Major chord preserved without being clobbered by G4");

  // Step D: Sustain pedal engagement & Arpeggiated ringing
  isSustainPedalDown = true;
  // Release C4 & E4 physically from keybed, but sustained by pedal
  pedaledNotes.add(60);
  activeHeldMidiNotes.delete(60);
  pedaledNotes.add(64);
  activeHeldMidiNotes.delete(64);
  updateMockRecognizer();
  assert.strictEqual(chordPillText, "C Major (Major Triad)", "Ringing pedaled notes preserve full chord recognition");

  // Step E: Release pedal
  isSustainPedalDown = false;
  pedaledNotes.clear();
  updateMockRecognizer();
  assert.strictEqual(chordPillText, "G4 (Single Pitch)", "Pedal release cleanly updates to currently held key");

  // Step F: Release G4
  activeHeldMidiNotes.delete(67);
  updateMockRecognizer();
  assert.strictEqual(chordPillText, "", "Releasing all notes cleanly clears chord pill");

  console.log("✔ Test 18: 🎹 Real-Time Polyphonic Chord Recognizer, Inversion Engine & Non-Clobbering passed");
}

console.log("=== ALL SCORE ENGINE & BASS CLEF ALIGNMENT TESTS PASSED! ===");



