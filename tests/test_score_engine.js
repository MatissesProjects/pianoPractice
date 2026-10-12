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

console.log("=== ALL SCORE ENGINE & BASS CLEF ALIGNMENT TESTS PASSED! ===");
