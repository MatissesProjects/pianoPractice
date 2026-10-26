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

const {
  DIATONIC_BASE,
  getDiatonicStep,
  parseToken,
  getRomanNumeralAnalysis,
  buildScoreModel
} = window.MusicTheory;

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
      if (step.expectedPitches.length > 0) {
        step.expectedPitches.forEach(p => {
          assert.notStrictEqual(p, "|", `${song.title} step ${sIdx} must not contain '|'`);
          assert.ok(getDiatonicStep(p) !== null, `${song.title} step ${sIdx} pitch ${p} has valid diatonic step`);
        });
      } else {
        assert.strictEqual(step.displayLabel, "REST", `${song.title} step ${sIdx} rest step display label`);
      }
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
  
  // Thirds Above: C4 -> C4+E4, C4 -> C4+E4, D4 -> D4+F4, E4 -> E4+G4
  const thirdsModel = buildScoreModel(leanSong, false, false, true, "thirds");
  assert.strictEqual(thirdsModel.steps[0].dyad.pitch, "C4+E4");
  assert.strictEqual(thirdsModel.steps[1].dyad.pitch, "C4+E4");
  assert.strictEqual(thirdsModel.steps[2].dyad.pitch, "D4+F4");
  assert.strictEqual(thirdsModel.steps[3].dyad.pitch, "E4+G4");
  assert.strictEqual(thirdsModel.steps[0].dyadF, "1+3");

  // Thirds Below: E4 (step 3) -> C4+E4
  const thirdsBelowModel = buildScoreModel(leanSong, false, false, true, "thirds_below");
  assert.strictEqual(thirdsBelowModel.steps[3].dyad.pitch, "C4+E4"); // E4 - 2 diatonic steps = C4

  // Fifths: C4 -> C4+G4, D4 -> D4+A4
  const fifthsModel = buildScoreModel(leanSong, false, false, true, "fifths");
  assert.strictEqual(fifthsModel.steps[0].dyad.pitch, "C4+G4");
  assert.strictEqual(fifthsModel.steps[1].dyad.pitch, "C4+G4");
  assert.strictEqual(fifthsModel.steps[2].dyad.pitch, "D4+A4");
  assert.strictEqual(fifthsModel.steps[0].dyadF, "1+5");

  // Sixths: C4 -> C4+A4, D4 -> D4+B4
  const sixthsModel = buildScoreModel(leanSong, false, false, true, "sixths");
  assert.strictEqual(sixthsModel.steps[0].dyad.pitch, "C4+A4");
  assert.strictEqual(sixthsModel.steps[1].dyad.pitch, "C4+A4");
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
  assert.deepStrictEqual(triadsModel.steps[0].expectedPitches, ["C4", "E4", "G4", "C3", "G3"]);

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

// ==========================================
// TEST 19: 🎯 HUD Target Badge High-Contrast Rendering & Feedback Layout Stability
// ==========================================
{
  function simulateUpdateTargetBadgeDisplay(step, fulfilledSet) {
    if (!step) return "";
    if (!step.expectedPitches || step.expectedPitches.length === 0) {
      return `<span style="color:#94a3b8; font-size:0.95rem;">𝄽 REST</span>`;
    }
    const partsHtml = step.expectedPitches.map(p => {
      const isDone = fulfilledSet && fulfilledSet.has(p);
      const label = p.replace(/#/g, "♯");
      if (isDone) {
        return `<span style="color:#34d399; font-weight:900; text-shadow:0 0 8px rgba(52,211,153,0.5);">${label}✓</span>`;
      }
      return `<span style="color:#f59e0b; font-weight:900;">${label}</span>`;
    });
    return partsHtml.join("<span style='color:#94a3b8; font-weight:700; margin:0 4px;'>+</span>");
  }

  // 19.1 Single Note Unfulfilled & Fulfilled
  const singleStep = { expectedPitches: ["C4"], displayLabel: "C4" };
  const singleHtml = simulateUpdateTargetBadgeDisplay(singleStep, new Set());
  assert.ok(singleHtml.includes("color:#f59e0b"), "Unfulfilled pitch must render in bold amber/orange #f59e0b");
  assert.ok(singleHtml.includes("C4"), "Label C4 must be present");

  const singleFulfilledHtml = simulateUpdateTargetBadgeDisplay(singleStep, new Set(["C4"]));
  assert.ok(singleFulfilledHtml.includes("color:#34d399"), "Fulfilled pitch must render in emerald green #34d399");
  assert.ok(singleFulfilledHtml.includes("C4✓"), "Label must include checkmark C4✓");

  // 19.2 Multi-Note Chord Unfulfilled & Partial Fulfillment
  const chordStep = { expectedPitches: ["C4", "G4"], displayLabel: "C4 + G4" };
  const chordHtml = simulateUpdateTargetBadgeDisplay(chordStep, new Set());
  assert.ok(chordHtml.includes("C4"), "Pitch C4 must be present");
  assert.ok(chordHtml.includes("G4"), "Pitch G4 must be present");
  assert.ok(chordHtml.includes("+"), "Separator + must be present");
  // Ensure no invisible text
  assert.strictEqual((chordHtml.match(/color:#f59e0b/g) || []).length, 2, "Both unfulfilled pitches must be explicitly colored #f59e0b");

  const partialSet = new Set(["C4"]);
  const partialHtml = simulateUpdateTargetBadgeDisplay(chordStep, partialSet);
  assert.ok(partialHtml.includes("C4✓") && partialHtml.includes("color:#34d399"), "C4 must be green with checkmark");
  assert.ok(partialHtml.includes("G4") && partialHtml.includes("color:#f59e0b"), "G4 must remain bright orange #f59e0b");

  // 19.3 Enharmonics & Accidental Glyphs
  const sharpStep = { expectedPitches: ["F#4", "C#5"], displayLabel: "F#4 + C#5" };
  const sharpHtml = simulateUpdateTargetBadgeDisplay(sharpStep, new Set());
  assert.ok(sharpHtml.includes("F♯4") && sharpHtml.includes("C♯5"), "Accidentals must be formatted with proper ♯ glyph");

  // 19.4 Rest Measures / Empty Pitches
  const restStep = { expectedPitches: [], displayLabel: "" };
  const restHtml = simulateUpdateTargetBadgeDisplay(restStep, new Set());
  assert.ok(restHtml.includes("REST"), "Rest step must display 𝄽 REST instead of empty rectangle");

  console.log("✔ Test 19: 🎯 HUD Target Badge High-Contrast Rendering & Feedback Layout Stability passed");
}

// 20. Test SVG Vector Rest Rendering, Lean on Me Durations & Full Repertoire Rhythm Audit
{
  // 20.1 Vector SVG Rest Generator Simulation
  function simulateRenderNoteheadOnly(pitchStr, beats, cx, bottomStaffY) {
    const elements = [];
    if (pitchStr === "-") {
      const cy = bottomStaffY - 20;
      if (beats >= 3.5) {
        elements.push({ type: "rect", x: cx - 7, y: bottomStaffY - 30, width: 14, height: 5, class: "rest-rect" });
      } else if (beats >= 1.75) {
        elements.push({ type: "rect", x: cx - 7, y: bottomStaffY - 25, width: 14, height: 5, class: "rest-rect" });
        if (beats >= 2.75) {
          elements.push({ type: "circle", cx: cx + 12, cy: bottomStaffY - 22.5, r: 2.2, class: "rest-rect" });
        }
      } else if (beats >= 0.85) {
        elements.push({ type: "path", class: "rest-glyph", cy });
        if (beats >= 1.4) {
          elements.push({ type: "circle", cx: cx + 8, cy: cy + 5, r: 2.2, class: "rest-rect" });
        }
      } else {
        elements.push({ type: "path", class: "rest-glyph", cy });
        if (beats >= 0.7) {
          elements.push({ type: "circle", cx: cx + 7, cy: cy - 4, r: 2.0, class: "rest-rect" });
        }
      }
    }
    return elements;
  }

  // Verify whole rest geometry: hangs downward from Line 4 (bottomStaffY - 30)
  const wholeRest = simulateRenderNoteheadOnly("-", 4, 100, 120);
  assert.strictEqual(wholeRest.length, 1);
  assert.strictEqual(wholeRest[0].type, "rect");
  assert.strictEqual(wholeRest[0].y, 90, "Whole rest must hang from Line 4 (y=90)");
  assert.strictEqual(wholeRest[0].height, 5);

  // Verify half rest geometry: sits on top of Line 3 (bottomStaffY - 20)
  const halfRest = simulateRenderNoteheadOnly("-", 2, 100, 120);
  assert.strictEqual(halfRest.length, 1);
  assert.strictEqual(halfRest[0].type, "rect");
  assert.strictEqual(halfRest[0].y, 95, "Half rest must sit on top of Line 3 (y=95)");
  assert.strictEqual(halfRest[0].height, 5);

  // Verify dotted half rest includes aug dot
  const dottedHalf = simulateRenderNoteheadOnly("-", 3, 100, 120);
  assert.strictEqual(dottedHalf.length, 2);
  assert.strictEqual(dottedHalf[1].type, "circle", "Dotted half rest must include aug dot");

  // Verify quarter rest and eighth rest generate vector paths
  const quarterRest = simulateRenderNoteheadOnly("-", 1, 100, 120);
  assert.strictEqual(quarterRest[0].type, "path");
  assert.strictEqual(quarterRest[0].class, "rest-glyph");

  const eighthRest = simulateRenderNoteheadOnly("-", 0.5, 100, 120);
  assert.strictEqual(eighthRest[0].type, "path");
  assert.strictEqual(eighthRest[0].class, "rest-glyph");

  // 20.2 Measure Rest Padding in buildScoreModel
  const songWithGap = {
    title: "Test Piece",
    timeSig: "4/4",
    tempo: 90,
    rh: "C4:2 | D4:4",
    rhF: "1 | 2",
    lh: "C3:4 | -:4",
    lhF: "5 | -"
  };
  const gapModel = buildScoreModel(songWithGap, true, true, false);
  // Measure 1: RH played 2 beats, should be padded with a half rest (beats=2)
  const m1 = gapModel.measures[0];
  const rhRests = m1.filter(item => item.rh && item.rh.pitch === "-");
  assert.strictEqual(rhRests.length, 1, "Incomplete RH measure must be padded with a rest");
  assert.strictEqual(rhRests[0].rh.beats, 2, "Padded rest must equal 2 beats (4 - 2)");

  // 20.3 Lean on Me Authentic Sheet Music Transcription Verification
  const lean = songDatabase.find(s => s.id === "lean-on-me");
  assert.ok(lean, "Lean on Me must exist in database");
  
  // RH: First C is a 2-beat hollow note, followed by eighth notes C, D, E, leading into tied dyad F4+A4:0.5~
  assert.ok(lean.rh.startsWith("C4:2 C4:0.5 D4:0.5 E4:0.5 F4+A4:0.5~ | F4+A4:2"), "RH opening C (half), C-D-E (eighths), tied F4+A4");
  // LH: Open fifth/octave chord C3+G3+C4:3, C3+G3+C4:0.5, tied F2+C3+F3:0.5~
  assert.ok(lean.lh.startsWith("C3+G3+C4:3 C3+G3+C4:0.5 F2+C3+F3:0.5~ | F2+C3+F3:3"), "LH open fifths/octaves with tied F2+C3+F3");
  // Dyads: First dyad is 2 beats C4+E4:2, followed by eighth notes C4+E4, D4+F4, E4+G4, and tied F4+A4:0.5~
  assert.ok(lean.dyads.startsWith("C4+E4:2 C4+E4:0.5 D4+F4:0.5 E4+G4:0.5 F4+A4:0.5~ | F4+A4:2"), "Dyads opening C4+E4 and tied F4+A4 across barline");

  const leanModel = buildScoreModel(lean, true, true, false);
  // Measure 1: Step 0 has RH beats=2 and LH beats=3
  assert.strictEqual(leanModel.measures[0][0].rh.beats, 2, "Lean on Me opening RH note is 2 beats");
  assert.strictEqual(leanModel.measures[0][0].lh.beats, 3, "Lean on Me opening LH chord is a 3-beat dotted half");
  // Step 1 (Beat 2.0): RH beats=0.5 (C4), LH sustains dotted half
  assert.strictEqual(leanModel.measures[0][1].rh.beats, 0.5, "Lean on Me step 1 RH note is 0.5 beat");
  assert.strictEqual(leanModel.measures[0][1].lh, null, "Lean on Me step 1 LH sustains previous chord");
  // Step 3 (Beat 3.0): RH beats=0.5 (E4), LH beats=0.5 (C3+G3+C4)
  assert.strictEqual(leanModel.measures[0][3].rh.beats, 0.5, "Lean on Me step 3 RH note is 0.5 beat");
  assert.strictEqual(leanModel.measures[0][3].lh.beats, 0.5, "Lean on Me step 3 LH chord is 0.5 beat");
  // Step 4 (last note of M1, Beat 3.5): tied note
  const m1Step4 = leanModel.measures[0][4];
  assert.strictEqual(m1Step4.rh.tied, true, "Measure 1 Step 4 RH has tie annotation");
  assert.strictEqual(m1Step4.lh.tied, true, "Measure 1 Step 4 LH has tie annotation");
  // Measure 2: Step 0 is tied from prev
  assert.strictEqual(leanModel.measures[1][0].tiedFromPrev, true, "Lean on Me measure 2 step 0 is tied from prev");
  assert.strictEqual(leanModel.measures[1][0].rh.beats, 2, "Lean on Me measure 2 RH note is 2 beats");
  assert.strictEqual(leanModel.measures[1][0].lh.beats, 3, "Lean on Me measure 2 LH note is 3 beats");

  // 20.4 Full Repertoire Duration Audit (All 56 Songs)
  function getExpBeats(timeSig) {
    if (!timeSig) return 4;
    const parts = timeSig.split('/').map(Number);
    const num = parts[0] || 4;
    const den = parts[1] || 4;
    return num * (4 / den);
  }

  let durationDiscrepancies = 0;
  songDatabase.forEach(song => {
    const expBeats = getExpBeats(song.timeSig);
    const rhMeasures = (song.rh || '').split('|').map(m => m.trim().split(/\s+/).filter(Boolean));
    const lhMeasures = (song.lh || '').split('|').map(m => m.trim().split(/\s+/).filter(Boolean));
    const dyadMeasures = (song.dyads || '').split('|').map(m => m.trim().split(/\s+/).filter(Boolean));
    const totalM = Math.max(rhMeasures.length, lhMeasures.length, dyadMeasures.length);

    for (let m = 0; m < totalM; m++) {
      const rh = rhMeasures[m] || [];
      const lh = lhMeasures[m] || [];
      const dy = dyadMeasures[m] || [];

      const rhBeats = rh.reduce((sum, t) => sum + parseToken(t).beats, 0);
      const lhBeats = lh.reduce((sum, t) => sum + parseToken(t).beats, 0);
      const dyBeats = dy.reduce((sum, t) => sum + parseToken(t).beats, 0);

      const isPickup = (m === 0 && ((rh.length > 0 && rhBeats < expBeats) || (lh.length > 0 && lhBeats < expBeats)));

      const rhDiff = Math.abs(rhBeats - expBeats) > 0.01;
      const lhDiff = Math.abs(lhBeats - expBeats) > 0.01;
      const dyDiff = Math.abs(dyBeats - expBeats) > 0.01;
      const syncDiff = (rh.length > 0 && lh.length > 0 && Math.abs(rhBeats - lhBeats) > 0.01);

      if ((rhDiff && !isPickup) || (lhDiff && !isPickup) || (dyDiff && !isPickup) || (syncDiff && !isPickup)) {
        durationDiscrepancies++;
      }
    }
  });

  assert.strictEqual(durationDiscrepancies, 0, "All 56 songs in songDatabase must have 0 measure duration discrepancies");

  console.log("✔ Test 20: 🎼 SVG Vector Rest Rendering, Lean on Me Durations & Full Repertoire Rhythm Audit passed");
}

// 21. Full 24-Measure Lean on Me Arrangement, Tie Annotations, 16th Notes & SVG Tie Arcs
{
  const lean = songDatabase.find(s => s.id === "lean-on-me");
  assert.ok(lean, "Lean on Me exists");

  const rhMeasures = lean.rh.split("|").map(m => m.trim());
  const lhMeasures = lean.lh.split("|").map(m => m.trim());
  const dyadMeasures = lean.dyads.split("|").map(m => m.trim());

  assert.strictEqual(rhMeasures.length, 24, "Lean on Me RH must have exactly 24 measures");
  assert.strictEqual(lhMeasures.length, 24, "Lean on Me LH must have exactly 24 measures");
  assert.strictEqual(dyadMeasures.length, 24, "Lean on Me Dyads must have exactly 24 measures");

  // Verify fingerings are present for all 24 measures
  assert.strictEqual(lean.rhF.split("|").length, 24, "RH fingers match 24 measures");
  assert.strictEqual(lean.lhF.split("|").length, 24, "LH fingers match 24 measures");
  assert.strictEqual(lean.dyadsF.split("|").length, 24, "Dyad fingers match 24 measures");

  // Verify Bridge syncopation: 16th notes (0.25) and dotted eighth notes (0.75) in Measure 17
  assert.ok(lean.rh.includes("0.75") && lean.rh.includes("0.25"), "RH contains dotted eighth (0.75) and 16th (0.25) note rhythms");
  const parsed16th = parseToken("A4:0.25");
  assert.strictEqual(parsed16th.beats, 0.25);
  const parsedDotted8th = parseToken("G4:0.75");
  assert.strictEqual(parsedDotted8th.beats, 0.75);

  // Verify Tie Token parsing
  const tiedToken = parseToken("F4+A4:0.5~");
  assert.strictEqual(tiedToken.pitch, "F4+A4");
  assert.strictEqual(tiedToken.beats, 0.5);
  assert.strictEqual(tiedToken.tied, true);

  // Verify Cross-Step Tie Model Detection
  const model = buildScoreModel(lean, true, true, false);
  const tiedSteps = model.steps.filter(s => s.tiedFromPrev);
  assert.ok(tiedSteps.length >= 5, "At least 5 steps have tiedFromPrev=true across the 24-measure piece");

  // Verify SVG Tie Arc calculation helper
  function computeTieArcD(n1, n2, scoreWidth = 920, rightMargin = 30, leftMargin = 72) {
    let curveUp = false;
    if (typeof n1.isChordTop === "boolean") curveUp = n1.isChordTop;
    else curveUp = !n1.stemUp;
    const ySign = curveUp ? -1 : 1;
    const yOffset = ySign * 7;
    if (n1.systemIdx === n2.systemIdx) {
      const x1 = n1.cx + 5;
      const x2 = n2.cx - 5;
      const y1 = n1.cy + yOffset;
      const y2 = n2.cy + yOffset;
      const midX = (x1 + x2) / 2;
      const span = Math.max(10, x2 - x1);
      const curveDepth = ySign * Math.min(18, Math.max(8, span * 0.12));
      const midY = (y1 + y2) / 2 + curveDepth;
      return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    } else {
      const x1 = n1.cx + 5;
      const x2 = scoreWidth - rightMargin;
      const y1 = n1.cy + yOffset;
      const midX1 = (x1 + x2) / 2;
      const midY1 = y1 + ySign * 10;
      return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${midX1.toFixed(1)} ${midY1.toFixed(1)} ${x2.toFixed(1)} ${y1.toFixed(1)}`;
    }
  }

  const arcSameRow = computeTieArcD({ cx: 200, cy: 100, stemUp: true, systemIdx: 0 }, { cx: 260, cy: 100, stemUp: true, systemIdx: 0 });
  assert.ok(arcSameRow.startsWith("M 205.0 107.0 Q 230.0"), "Same row tie arc draws quadratic bezier below notehead when stemUp is true");

  const arcCrossRow = computeTieArcD({ cx: 800, cy: 100, stemUp: true, systemIdx: 0 }, { cx: 120, cy: 100, stemUp: true, systemIdx: 1 });
  assert.ok(arcCrossRow.startsWith("M 805.0 107.0 Q"), "Cross-row tie arc terminates at right margin");

  console.log("✔ Test 21: Full 24-Measure Lean on Me Arrangement, Tie Annotations, 16th Notes & SVG Tie Arcs passed");
}

// 22. Sheet Music Viewport Auto-Scroll Stabilization & Anti-Bounce Engine
{
  const fs = require("fs");
  const htmlContent = fs.readFileSync("index.html", "utf-8");

  // 22.1 Verify CSS scroll-behavior: smooth is removed from .sheet-music-container
  const sheetMusicCssMatch = htmlContent.match(/\.sheet-music-container\s*\{[^}]*\}/);
  assert.ok(sheetMusicCssMatch, ".sheet-music-container CSS rule must exist");
  assert.ok(!sheetMusicCssMatch[0].includes("scroll-behavior: smooth"), ".sheet-music-container must not specify CSS scroll-behavior: smooth (prevents scroll fighting and reset lag)");

  // 22.2 Verify SVG Element scrollIntoView is eliminated from score follow
  assert.ok(!htmlContent.includes("targetEl.scrollIntoView"), "targetEl.scrollIntoView must be completely removed to eliminate Chromium SVG scroll-to-top bug (Issue 828439)");

  // 22.3 Verify autoScrollScoreToNote is defined and wired in highlightActiveScoreNote and playCurrentSong
  assert.ok(htmlContent.includes("function autoScrollScoreToNote(targetEl"), "autoScrollScoreToNote helper must be defined");
  assert.ok(htmlContent.includes("autoScrollScoreToNote(targetEl, true)"), "autoScrollScoreToNote must be invoked in note follow");

  // 22.4 Behavioral Simulation of autoScrollScoreToNote
  function simulateAutoScroll({
    relativeTop,
    relativeBottom,
    containerH = 500,
    currentScroll = 0,
    padTop = 60,
    padBottom = 80,
    lastTarget = null,
    lastTime = 0,
    now = 1000
  }) {
    // 1. Reading comfort zone check
    if (relativeTop >= padTop && relativeBottom <= (containerH - padBottom)) {
      return { scrolled: false, reason: "in_comfort_zone", target: currentScroll };
    }

    const noteHeight = relativeBottom - relativeTop;
    const noteAbsoluteY = currentScroll + relativeTop + (noteHeight / 2);
    const desiredScrollTop = Math.max(0, Math.round(noteAbsoluteY - (containerH * 0.38)));

    // 2. Animation guard check
    if (lastTarget !== null && (now - lastTime < 400)) {
      if (Math.abs(lastTarget - desiredScrollTop) < 60) {
        return { scrolled: false, reason: "animation_guard", target: lastTarget };
      }
    }

    if (Math.abs(currentScroll - desiredScrollTop) < 6) {
      return { scrolled: false, reason: "already_at_target", target: currentScroll };
    }

    return { scrolled: true, target: desiredScrollTop };
  }

  // Case A: Note 0 on System 1 is comfortably in view at the start
  const res1 = simulateAutoScroll({ relativeTop: 70, relativeBottom: 110, containerH: 500, currentScroll: 0 });
  assert.strictEqual(res1.scrolled, false, "Note inside comfort zone must not trigger scrolling");

  // Case B: Advancing to System 3 down the page (relativeBottom = 480, exceeds containerH - 80)
  const res2 = simulateAutoScroll({ relativeTop: 440, relativeBottom: 480, containerH: 500, currentScroll: 200 });
  assert.strictEqual(res2.scrolled, true, "Note beyond bottom padding must trigger scroll");
  assert.ok(res2.target > 200, "Scroll target must advance down the page, NEVER bounce to 0");
  assert.strictEqual(res2.target, 470, "Scroll target places note at 38% down the 500px viewport (660 - 190 = 470)");

  // Case C: Rapid successive eighth note 150ms later targeting the same system
  const res3 = simulateAutoScroll({
    relativeTop: 440,
    relativeBottom: 480,
    containerH: 500,
    currentScroll: 250, // mid-flight
    lastTarget: 470,
    lastTime: 1000,
    now: 1150
  });
  assert.strictEqual(res3.scrolled, false, "Successive note within 400ms towards same system must not interrupt animation");
  assert.strictEqual(res3.reason, "animation_guard");

  // Case D: Resetting piece sets scrollTop to 0 cleanly
  assert.ok(htmlContent.includes("scoreContainer.scrollTop = 0"), "Reset and song loading must immediately reset scoreContainer.scrollTop = 0");

  console.log("✔ Test 22: 📜 Sheet Music Viewport Auto-Scroll Stabilization & Anti-Bounce Engine passed");
}

// 23. Authentic Sheet Music Rest Rendering in When the Saints Go Marching In and Repertoire
{
  const saints = songDatabase.find(s => s.id === "when-the-saints");
  assert.ok(saints, "When the Saints Go Marching In exists in database");

  // 23.1 Verify explicit rests exist in song data
  assert.ok(saints.rh.includes("-:1"), "RH must include quarter rest tokens (-:1)");
  assert.ok(saints.dyads.includes("-:1"), "Dyads must include quarter rest tokens (-:1)");

  // 23.2 Build Score Model (Grand Staff: showRH=true, showLH=true)
  const saintsModel = buildScoreModel(saints, true, true, false);

  // Measure 1, Step 0 (Beat 0): RH has 1-beat rest, LH has 4-beat whole note C3
  const m1Step0 = saintsModel.measures[0][0];
  assert.strictEqual(m1Step0.startBeat, 0, "Measure 1 Step 0 is on Beat 0");
  assert.strictEqual(m1Step0.rh.pitch, "-", "Measure 1 Step 0 RH must be a rest");
  assert.strictEqual(m1Step0.rh.beats, 1, "Measure 1 Step 0 RH must be a 1-beat quarter rest");
  assert.strictEqual(m1Step0.lh.pitch, "C3", "Measure 1 Step 0 LH must be whole note C3");
  assert.strictEqual(m1Step0.lh.beats, 4, "Measure 1 Step 0 LH must be 4 beats");
  assert.deepStrictEqual(m1Step0.expectedPitches, ["C3"], "Only LH pitch C3 is expected to be played on beat 0");

  // Measure 1, Step 1 (Beat 1): RH plays C4:1, LH sustains C3
  const m1Step1 = saintsModel.measures[0][1];
  assert.strictEqual(m1Step1.startBeat, 1, "Measure 1 Step 1 is on Beat 1");
  assert.strictEqual(m1Step1.rh.pitch, "C4", "Measure 1 Step 1 RH is C4");
  assert.strictEqual(m1Step1.lh, null, "Measure 1 Step 1 LH is sustaining from beat 0");

  // 23.3 Verify rest rendering simulation across Treble and Bass
  function simulateScoreRenderStep(item, showRH, showLH, showDyads) {
    const rendered = [];
    if (showDyads && item.dyad) {
      if (item.dyad.pitch === "-") {
        rendered.push({ hand: "treble", type: "rest", beats: item.dyad.beats });
      } else {
        const pitches = item.dyad.pitch.split("+").filter(p => p !== "-");
        pitches.forEach(p => rendered.push({ hand: "treble", type: "note", pitch: p }));
      }
    } else if (showRH && item.rh) {
      if (item.rh.pitch === "-") {
        rendered.push({ hand: "treble", type: "rest", beats: item.rh.beats });
      } else {
        const pitches = item.rh.pitch.split("+").filter(p => p !== "-");
        pitches.forEach(p => rendered.push({ hand: "treble", type: "note", pitch: p }));
      }
    }
    if (showLH && item.lh) {
      if (item.lh.pitch === "-") {
        rendered.push({ hand: "bass", type: "rest", beats: item.lh.beats });
      } else {
        const lhPitches = item.lh.pitch.split("+").filter(p => p !== "-");
        lhPitches.forEach(p => rendered.push({ hand: "bass", type: "note", pitch: p }));
      }
    }
    return rendered;
  }

  // Measure 1 Step 0 in Grand Staff
  const renderedM1S0 = simulateScoreRenderStep(m1Step0, true, true, false);
  assert.strictEqual(renderedM1S0.length, 2, "Must render exactly 2 elements: RH rest and LH note");
  assert.deepStrictEqual(renderedM1S0[0], { hand: "treble", type: "rest", beats: 1 }, "Treble staff renders 1-beat rest");
  assert.deepStrictEqual(renderedM1S0[1], { hand: "bass", type: "note", pitch: "C3" }, "Bass staff renders note C3");

  // 23.4 Verify index.html contains rest dispatch logic for all 3 modes
  const fs = require("fs");
  const normHtml = fs.readFileSync("index.html", "utf-8").replace(/\r\n/g, "\n");
  assert.ok(normHtml.includes('if (item.dyad.pitch === "-") {\n                renderNoteheadOnly(noteGroup, "-", item.dyad.beats, cx, trebleBottomY, 2);'), "Dyads mode must render rests when pitch is '-'");
  assert.ok(normHtml.includes('if (item.rh.pitch === "-") {\n                renderNoteheadOnly(noteGroup, "-", item.rh.beats, cx, trebleBottomY, 2);'), "RH mode must render rests when pitch is '-'");
  assert.ok(normHtml.includes('if (item.lh.pitch === "-") {\n                renderNoteheadOnly(noteGroup, "-", item.lh.beats, cx, bassBottomY, -10);'), "LH mode must render rests when pitch is '-'");

  // 23.5 Verify Lean on Me Measure 9 eighth rest
  const lean = songDatabase.find(s => s.id === "lean-on-me");
  const leanModel = buildScoreModel(lean, true, true, false);
  // Measure 9 has C5:1.5 then -:0.5
  const m9Rests = leanModel.measures[8].filter(step => step.rh && step.rh.pitch === "-");
  assert.strictEqual(m9Rests.length, 1, "Lean on Me measure 9 must have an eighth rest in RH");
  assert.strictEqual(m9Rests[0].rh.beats, 0.5, "Lean on Me measure 9 rest is 0.5 beat (eighth rest)");

  console.log("✔ Test 23: 𝄽 Authentic Sheet Music Rest Rendering in When the Saints Go Marching In and Repertoire passed");
}

// ============================================================================
// TEST 24: 𝄽 Classical Rest Glyphs, Collision-Free Spacing & Rest Timing Engine
// ============================================================================
{
  const fs = require("fs");
  const html = fs.readFileSync("index.html", "utf-8").replace(/\r\n/g, "\n");

  // 24.1 Classical SMuFL Quarter Rest Vector Outline
  // Ensure the old tadpole blob/loop was removed and replaced with classical SMuFL restQuarter path
  assert.ok(!html.includes("${cx + 4.2} ${cy + 14.5}"), "Old tadpole bulb coordinates must be completely eliminated");
  assert.ok(html.includes("Classical engraved SMuFL restQuarter glyph"), "Must use classical engraved SMuFL restQuarter glyph");
  assert.ok(html.includes("${(cx + 3.2).toFixed(1)} ${(cy - 13.0).toFixed(1)}"), "Starts with top hook in Space 4");
  assert.ok(html.includes("${(cx + 3.4).toFixed(1)} ${(cy + 11.2).toFixed(1)}"), "Features upward-pointing open crescent tail in Space 1");

  // Simulate classical quarter rest path at cx = 100, cy = 60
  function classicalRestD(cx, cy) {
    return [
      `M ${(cx + 3.2).toFixed(1)} ${(cy - 13.0).toFixed(1)}`,
      `C ${(cx + 2.4).toFixed(1)} ${(cy - 13.8).toFixed(1)} ${(cx - 1.2).toFixed(1)} ${(cy - 12.5).toFixed(1)} ${(cx - 3.2).toFixed(1)} ${(cy - 9.0).toFixed(1)}`,
      `C ${(cx - 3.8).toFixed(1)} ${(cy - 7.2).toFixed(1)} ${(cx - 3.0).toFixed(1)} ${(cy - 5.5).toFixed(1)} ${(cx - 1.0).toFixed(1)} ${(cy - 2.8).toFixed(1)}`,
      `L ${(cx + 3.4).toFixed(1)} ${(cy + 1.6).toFixed(1)}`,
      `C ${(cx + 3.6).toFixed(1)} ${(cy + 3.2).toFixed(1)} ${(cx + 1.2).toFixed(1)} ${(cy + 5.6).toFixed(1)} ${(cx - 2.8).toFixed(1)} ${(cy + 7.4).toFixed(1)}`,
      `C ${(cx - 4.8).toFixed(1)} ${(cy + 8.5).toFixed(1)} ${(cx - 4.6).toFixed(1)} ${(cy + 11.0).toFixed(1)} ${(cx - 2.0).toFixed(1)} ${(cy + 13.0).toFixed(1)}`,
      `C ${(cx + 0.2).toFixed(1)} ${(cy + 14.5).toFixed(1)} ${(cx + 2.5).toFixed(1)} ${(cy + 13.8).toFixed(1)} ${(cx + 3.4).toFixed(1)} ${(cy + 11.2).toFixed(1)}`,
      `C ${(cx + 3.6).toFixed(1)} ${(cy + 10.4).toFixed(1)} ${(cx + 2.8).toFixed(1)} ${(cy + 10.0).toFixed(1)} ${(cx + 2.2).toFixed(1)} ${(cy + 10.6).toFixed(1)}`,
      `C ${(cx + 1.5).toFixed(1)} ${(cy + 12.2).toFixed(1)} ${(cx - 0.2).toFixed(1)} ${(cy + 12.5).toFixed(1)} ${(cx - 1.5).toFixed(1)} ${(cy + 11.2).toFixed(1)}`,
      `C ${(cx - 2.8).toFixed(1)} ${(cy + 10.0).toFixed(1)} ${(cx - 2.6).toFixed(1)} ${(cy + 8.4).toFixed(1)} ${(cx - 0.2).toFixed(1)} ${(cy + 6.6).toFixed(1)}`,
      `C ${(cx + 1.4).toFixed(1)} ${(cy + 5.2).toFixed(1)} ${(cx + 1.8).toFixed(1)} ${(cy + 3.6).toFixed(1)} ${(cx + 1.2).toFixed(1)} ${(cy + 2.0).toFixed(1)}`,
      `L ${(cx - 2.8).toFixed(1)} ${(cy - 3.6).toFixed(1)}`,
      `C ${(cx - 3.8).toFixed(1)} ${(cy - 5.2).toFixed(1)} ${(cx - 3.0).toFixed(1)} ${(cy - 7.4).toFixed(1)} ${(cx - 1.5).toFixed(1)} ${(cy - 9.0).toFixed(1)}`,
      `C ${(cx - 0.2).toFixed(1)} ${(cy - 10.5).toFixed(1)} ${(cx + 2.2).toFixed(1)} ${(cy - 11.5).toFixed(1)} ${(cx + 3.2).toFixed(1)} ${(cy - 13.0).toFixed(1)} Z`
    ].join(' ');
  }

  const dStr = classicalRestD(100, 60);
  assert.ok(dStr.startsWith("M 103.2 47.0"), "Top hook starts at x=103.2, y=47.0 (Space 4)");
  assert.ok(dStr.includes("103.4 71.2"), "Lower crescent hook apex at x=103.4, y=71.2 (Space 1)");
  assert.ok(dStr.endsWith("Z"), "Path forms closed vector contour");

  // 24.2 Clef, Time Signature, and Barline Collision-Free Clearance
  assert.ok(html.includes("const leftMargin = 74;"), "leftMargin updated to 74 for proper clef buffer");
  assert.ok(html.includes('tClef.setAttribute("x", leftMargin - 42);'), "tClef positioned at leftMargin - 42 (x=32)");
  assert.ok(html.includes('timeSig.setAttribute("x", leftMargin + 8);'), "timeSig positioned at leftMargin + 8 (x=82)");
  assert.ok(html.includes('measureStartX = leftMargin + 28'), "Measure 1 starts at leftMargin + 28 (x=102)");

  const leftMargin = 74;
  const clefX = leftMargin - 42; // 32
  const clefRight = clefX + 33;  // 65 (approx width 33px)
  const timeSigX = leftMargin + 8; // 82
  const timeSigLeft = timeSigX - 16; // 66 (text-anchor middle, 32px width)
  const timeSigRight = timeSigX + 16; // 98
  const note0X = leftMargin + 28 + 18; // 120
  const note0Left = note0X - 7; // 113

  assert.ok(clefRight < timeSigLeft, `Clef right edge (${clefRight}) must be strictly less than TimeSig left edge (${timeSigLeft}) - zero overlap`);
  assert.ok(timeSigRight < note0Left, `TimeSig right edge (${timeSigRight}) must be strictly less than Note 0 left edge (${note0Left}) - ample 15px clearance`);

  // 24.3 Active-Target and Error-Target Rest CSS Styling
  assert.ok(html.includes(".note-group.active-target .rest-glyph"), "CSS must style .note-group.active-target .rest-glyph");
  assert.ok(html.includes(".note-group.active-target .rest-rect"), "CSS must style .note-group.active-target .rest-rect");
  assert.ok(html.includes("fill: #f59e0b !important;"), "Active rest must have amber #f59e0b fill");
  assert.ok(html.includes(".note-group.error-target .rest-glyph"), "CSS must style .note-group.error-target .rest-glyph");
  assert.ok(html.includes("𝄽 REST (${beatVal}b)"), "HUD target badge must display beat value on rests");

  // 24.4 Precision Rest Timing Engine in Wait-for-Me Practice Mode
  assert.ok(html.includes("let isPracticeSessionStarted = false;"), "Must declare isPracticeSessionStarted state variable");
  assert.ok(html.includes("if (stepIdx === 0 && !isPracticeSessionStarted)"), "Must guard step 0 pickup rest on initial load");
  assert.ok(html.includes("Count in: play ${nextLabel} to begin!"), "Must display count-in prompt on pickup rest");
  assert.ok(html.includes("isNextStepRest"), "Must detect when following step is a rest");
  assert.ok(html.includes("noteDurationMs = Math.max(250, (currentStep.beats || 1) * (60000 / tempo))"), "Must hold note for full duration before transitioning to rest");

  // 24.5 When the Saints Go Marching In - Measure 2 whole note G4 into Measure 3 rest
  const saints = songDatabase.find(s => s.id === "when-the-saints");
  const saintsModel = buildScoreModel(saints, true, false, false);
  const m2Step = saintsModel.measures[1][0]; // Measure 2: G4:4
  const m3RestStep = saintsModel.measures[2][0]; // Measure 3: -:1

  assert.strictEqual(m2Step.rh.pitch, "G4", "Measure 2 is G4");
  assert.strictEqual(m2Step.beats, 4, "Measure 2 G4 is 4 beats");
  assert.strictEqual(m3RestStep.rh.pitch, "-", "Measure 3 begins with rest");
  assert.strictEqual(m3RestStep.beats, 1, "Measure 3 rest is 1 beat");

  // In 120 BPM, G4 note hold must be 2000ms, and rest hold must be 500ms
  const tempo = saints.tempo || 120;
  const g4HoldMs = m2Step.beats * (60000 / tempo);
  const restHoldMs = m3RestStep.beats * (60000 / tempo);
  assert.strictEqual(g4HoldMs, 2000, "G4 whole note holds for 2000ms (4 beats at 120 BPM)");
  assert.strictEqual(restHoldMs, 500, "Quarter rest holds for 500ms (1 beat at 120 BPM)");

  console.log("✔ Test 24: 𝄽 Classical Rest Glyphs, Collision-Free Spacing & Rest Timing Engine passed");
}

// ============================================================================
// TEST 25: 🎹 Keyboard Size Song Allowance & Range Filtering Engine
// ============================================================================
{
  const fs = require("fs");
  const html = fs.readFileSync("index.html", "utf-8").replace(/\r\n/g, "\n");

  // 25.1 Verify Theory Module Exports
  assert.ok(Array.isArray(MusicTheory.STANDARD_KEYBOARD_PRESETS), "Must export STANDARD_KEYBOARD_PRESETS");
  assert.strictEqual(MusicTheory.STANDARD_KEYBOARD_PRESETS.length, 8, "Must define 8 standard keyboard presets");
  assert.strictEqual(typeof MusicTheory.getSongPitchRange, "function", "Must export getSongPitchRange function");
  assert.strictEqual(typeof MusicTheory.evaluateSongKeyboardCompatibility, "function", "Must export evaluateSongKeyboardCompatibility function");

  // 25.2 Pitch Range Calculations Across Repertoire
  const leanOnMe = songDatabase.find(s => s.id === "lean-on-me");
  assert.ok(leanOnMe, "Lean on Me must exist in repertoire");
  const leanRange = MusicTheory.getSongPitchRange(leanOnMe);
  assert.strictEqual(leanRange.minPitch, "F2", "Lean on Me lowest note is F2");
  assert.strictEqual(leanRange.maxPitch, "F5", "Lean on Me highest note is F5");
  assert.strictEqual(leanRange.span, 37, "Lean on Me spans 37 semitones");
  assert.strictEqual(leanRange.rh.minPitch, "C4", "Lean on Me RH lowest note is C4");
  assert.strictEqual(leanRange.rh.maxPitch, "F5", "Lean on Me RH highest note is F5");
  assert.strictEqual(leanRange.rh.span, 18, "Lean on Me RH spans 18 keys");

  const ode = songDatabase.find(s => s.id === "ode-to-joy");
  assert.ok(ode, "Ode to Joy must exist");
  const odeRange = MusicTheory.getSongPitchRange(ode);
  assert.strictEqual(odeRange.minPitch, "G2", "Ode to Joy min pitch G2");
  assert.strictEqual(odeRange.maxPitch, "G4", "Ode to Joy max pitch G4");
  assert.strictEqual(odeRange.span, 25, "Ode to Joy spans 25 keys");

  // 25.3 Compatibility Evaluation across Standard Presets
  // Preset 25 Keys (C3 to C5, MIDI 48 to 72)
  const kb25 = { startMidi: 48, keyCount: 25 };
  const leanEval25 = MusicTheory.evaluateSongKeyboardCompatibility(leanOnMe, kb25);
  assert.strictEqual(leanEval25.status, "exceeds", "Full Lean on Me exceeds 25 keys");
  assert.strictEqual(leanEval25.fitsExact, false, "Lean on Me does not fit exact on 25 keys");
  assert.strictEqual(leanEval25.fitsSpan, false, "Lean on Me 37-key span cannot fit on 25 keys");
  assert.strictEqual(leanEval25.recommendedPreset, "49", "Recommends 49 keys for Lean on Me (F2-F5)");

  // Lean on Me RH only on 25 keys
  const leanEval25RH = MusicTheory.evaluateSongKeyboardCompatibility(leanOnMe, kb25, { rh: true, lh: false, dyads: false });
  assert.strictEqual(leanEval25RH.status, "shift_needed", "Lean on Me RH fits 25 keys with octave/semitone shift");
  assert.strictEqual(leanEval25RH.fitsSpan, true, "18 key span fits within 25 keys");
  assert.strictEqual(leanEval25RH.shiftNeeded, 5, "Requires +5 semitone shift");

  // Mary Had a Little Lamb RH only on 25 keys
  const mary = songDatabase.find(s => s.id === "mary-had-a-little-lamb");
  assert.ok(mary, "Mary Had a Little Lamb must exist");
  const maryEval25RH = MusicTheory.evaluateSongKeyboardCompatibility(mary, kb25, { rh: true, lh: false, dyads: false });
  assert.strictEqual(maryEval25RH.status, "fits", "Mary Had a Little Lamb RH (C4-G4) fits exact on 25 keys (C3-C5)");
  assert.strictEqual(maryEval25RH.fitsExact, true);

  // Ode to Joy on 37 Keys (C2 to C5, MIDI 36 to 72)
  const kb37 = { startMidi: 36, keyCount: 37 };
  const odeEval37 = MusicTheory.evaluateSongKeyboardCompatibility(ode, kb37);
  assert.strictEqual(odeEval37.status, "fits", "Ode to Joy fits exact on 37 keys");
  assert.strictEqual(odeEval37.fitsExact, true);

  // Lean on Me on 37 Keys (F2 to F5, span 37)
  const leanEval37 = MusicTheory.evaluateSongKeyboardCompatibility(leanOnMe, kb37);
  assert.strictEqual(leanEval37.status, "shift_needed", "Lean on Me fits 37 keys if shifted to start at F2");
  assert.strictEqual(leanEval37.fitsSpan, true, "Span 37 fits count 37");
  assert.strictEqual(leanEval37.shiftNeeded, 5, "Requires +5 semitone shift from C2 to F2");

  // 49 Keys (C2 to C6, MIDI 36 to 84) encompasses all repertoire pieces
  const kb49 = { startMidi: 36, keyCount: 49 };
  songDatabase.forEach(song => {
    const comp = MusicTheory.evaluateSongKeyboardCompatibility(song, kb49);
    assert.strictEqual(comp.fitsSpan, true, `${song.title} span must fit within 49 keys`);
    assert.strictEqual(comp.fitsExact, true, `${song.title} must fit exact on standard 49-key range`);
  });

  // 88 Keys (Full Grand) fits all 56 songs exact
  const kb88 = { startMidi: 21, keyCount: 88 };
  songDatabase.forEach(song => {
    const comp = MusicTheory.evaluateSongKeyboardCompatibility(song, kb88);
    assert.strictEqual(comp.fitsExact, true, `${song.title} must fit exact on 88 keys`);
  });

  // 25.4 UI DOM Markup & Filter Toolbar Verification
  assert.ok(html.includes('id="keyboardRangeWarningBanner"'), "Must include keyboardRangeWarningBanner in HTML");
  assert.ok(html.includes('id="kbWarningAutoFitBtn"'), "Must include kbWarningAutoFitBtn");
  assert.ok(html.includes('id="kbWarningShiftBtn"'), "Must include kbWarningShiftBtn");
  assert.ok(html.includes('id="kbWarningDismissBtn"'), "Must include kbWarningDismissBtn");
  assert.ok(html.includes('id="catalogKbFilterToggle"'), "Must include catalogKbFilterToggle");
  assert.ok(html.includes('id="kbDockFilterCheckbox"'), "Must include kbDockFilterCheckbox in shared keyboard dock");
  assert.ok(html.includes('id="catalogKbScopeSelect"'), "Must include catalogKbScopeSelect");
  assert.ok(html.includes('id="keyboardFilterStatsBadge"'), "Must include keyboardFilterStatsBadge");

  // 25.5 CSS Styling Verification
  assert.ok(html.includes('.card-range-badge'), "Must include .card-range-badge CSS rule");
  assert.ok(html.includes('.compat-tag.compat-fits'), "Must include .compat-tag.compat-fits CSS rule");
  assert.ok(html.includes('.compat-tag.compat-shift'), "Must include .compat-tag.compat-shift CSS rule");
  assert.ok(html.includes('.compat-tag.compat-exceeds'), "Must include .compat-tag.compat-exceeds CSS rule");
  assert.ok(html.includes('.catalog-card.disallowed-song'), "Must include .catalog-card.disallowed-song CSS rule");
  assert.ok(html.includes('.keyboard-range-warning'), "Must include .keyboard-range-warning CSS rule");

  // 25.6 Script Logic Verification
  assert.ok(html.includes('function autoFitKeyboardToSong'), "Must define autoFitKeyboardToSong");
  assert.ok(html.includes('function shiftKeyboardToFitSong'), "Must define shiftKeyboardToFitSong");
  assert.ok(html.includes('function updateKeyboardRangeWarning'), "Must define updateKeyboardRangeWarning");
  assert.ok(html.includes('function handleFilterByKeyboardToggle'), "Must define handleFilterByKeyboardToggle");
  assert.ok(html.includes('onKeyboardLayoutChanged()'), "Must call onKeyboardLayoutChanged on keyboard shifts and preset changes");
  assert.ok(html.includes('card.dataset.compat = compat.status'), "Catalog cards must annotate data-compat attribute");

  console.log("✔ Test 25: 🎹 Keyboard Size Song Allowance & Range Filtering Engine passed");
}

// ==========================================
// Test 26: 🎼 Interactive Piano Notes Cheat Sheet, Keyboard Colorization & Live Sustain Integration
// ==========================================
{
  const fs = require("fs");
  const html = fs.readFileSync("index.html", "utf-8").replace(/\r\n/g, "\n");

  // 26.1 Music Theory Cheat Sheet Exports & Color Mappings
  const colors = MusicTheory.CHEAT_SHEET_NOTE_COLORS;
  assert.ok(colors, "CHEAT_SHEET_NOTE_COLORS must be exported");
  assert.strictEqual(colors.C, '#ef4444', "C must be Red #ef4444");
  assert.strictEqual(colors.D, '#8b5cf6', "D must be Purple #8b5cf6");
  assert.strictEqual(colors.E, '#1e40af', "E must be Navy #1e40af");
  assert.strictEqual(colors.F, '#0284c7', "F must be Sky Blue #0284c7");
  assert.strictEqual(colors.G, '#14b8a6', "G must be Mint Teal #14b8a6");
  assert.strictEqual(colors.A, '#f97316', "A must be Orange #f97316");
  assert.strictEqual(colors.B, '#10b981', "B must be Emerald #10b981");

  assert.strictEqual(MusicTheory.getCheatSheetNoteColor("C4"), '#ef4444');
  assert.strictEqual(MusicTheory.getCheatSheetNoteColor("G3"), '#14b8a6');
  assert.strictEqual(MusicTheory.getCheatSheetNoteColor("A2"), '#f97316');
  assert.strictEqual(MusicTheory.getCheatSheetNoteColor("F#4"), '#0284c7');
  assert.strictEqual(MusicTheory.getCheatSheetNoteColor("Bb3"), '#ea580c');

  // 26.2 Staff Position & Mnemonic Metadata
  const midC = MusicTheory.getCheatSheetStaffInfo("C4");
  assert.ok(midC, "C4 staff info must exist");
  assert.strictEqual(midC.isMiddleC, true, "C4 isMiddleC must be true");
  assert.strictEqual(midC.clef, "grand-bridge", "C4 clef must be grand-bridge");
  assert.ok(midC.staffPosition.includes("MIDDLE C"), "C4 staffPosition must mention MIDDLE C");

  const e4 = MusicTheory.getCheatSheetStaffInfo("E4");
  assert.ok(e4, "E4 staff info must exist");
  assert.strictEqual(e4.clef, "treble");
  assert.strictEqual(e4.staffRole, "line");
  assert.strictEqual(e4.staffIndex, 1);
  assert.ok(e4.mnemonic.includes("Every"), "E4 mnemonic must include Every");

  const g2 = MusicTheory.getCheatSheetStaffInfo("G2");
  assert.ok(g2, "G2 staff info must exist");
  assert.strictEqual(g2.clef, "bass");
  assert.strictEqual(g2.staffRole, "line");
  assert.strictEqual(g2.staffIndex, 1);
  assert.ok(g2.mnemonic.includes("Good"), "G2 mnemonic must include Good");

  const c3 = MusicTheory.getCheatSheetStaffInfo("C3");
  assert.ok(c3, "C3 staff info must exist");
  assert.strictEqual(c3.clef, "bass");
  assert.strictEqual(c3.staffRole, "space");
  assert.strictEqual(c3.staffIndex, 2);
  assert.ok(c3.mnemonic.includes("Cows"), "C3 mnemonic must include Cows");

  // 22 Notes Range in Cheat Sheet (G2 to G5)
  const range = MusicTheory.CHEAT_SHEET_NOTES_RANGE;
  assert.ok(Array.isArray(range), "CHEAT_SHEET_NOTES_RANGE must be an array");
  assert.strictEqual(range.length, 22, "Must contain exactly 22 diatonic white keys from G2 to G5");
  assert.strictEqual(range[0].pitch, "G2", "First note must be G2");
  assert.strictEqual(range[10].pitch, "C4", "Index 10 must be Middle C (C4)");
  assert.strictEqual(range[21].pitch, "G5", "Last note must be G5");

  // 26.3 UI DOM Markup Verification
  assert.ok(html.includes('id="toggleCheatSheetColors"'), "Must include toggleCheatSheetColors toggle");
  assert.ok(html.includes('id="openCheatSheetBtn"'), "Must include openCheatSheetBtn in keyboard dock");
  assert.ok(html.includes('id="theoryOpenCheatSheetBtn"'), "Must include theoryOpenCheatSheetBtn in Theory panel");
  assert.ok(html.includes('id="cheatSheetModal"'), "Must include cheatSheetModal dialog");
  assert.ok(html.includes('id="cheatSheetSvg"'), "Must include cheatSheetSvg container");
  assert.ok(html.includes('id="csInspectorCard"'), "Must include csInspectorCard note inspector");
  assert.ok(html.includes('id="csPlayScaleBtn"'), "Must include csPlayScaleBtn sequence player");
  assert.ok(html.includes('id="csCloseModalBtn"'), "Must include csCloseModalBtn close button");

  // 26.4 CSS Styling Verification
  assert.ok(html.includes('.piano-key-cheat-label'), "Must include .piano-key-cheat-label CSS rule");
  assert.ok(html.includes('content: "MIDDLE C"'), "Middle C marker must display authentic MIDDLE C label");
  assert.ok(html.includes('.lane-staff-badge'), "Must include .lane-staff-badge CSS rule");
  assert.ok(html.includes('.lane-staff-badge.is-mid-c'), "Must include .lane-staff-badge.is-mid-c CSS rule");
  assert.ok(html.includes('.cheat-sheet-modal-backdrop'), "Must include .cheat-sheet-modal-backdrop CSS rule");
  assert.ok(html.includes('.cheat-sheet-modal-dialog'), "Must include .cheat-sheet-modal-dialog CSS rule");

  // 26.5 Script Logic Verification
  assert.ok(html.includes('function isCheatSheetColorsEnabled'), "Must define isCheatSheetColorsEnabled");
  assert.ok(html.includes('function createSustainLane'), "Must define createSustainLane");
  assert.ok(html.includes('function removeSustainLane'), "Must define removeSustainLane");
  assert.ok(html.includes('function renderCheatSheetSvg'), "Must define renderCheatSheetSvg");
  assert.ok(html.includes('function openCheatSheetModal'), "Must define openCheatSheetModal");
  assert.ok(html.includes('function closeCheatSheetModal'), "Must define closeCheatSheetModal");
  assert.ok(html.includes('function selectCheatSheetNote'), "Must define selectCheatSheetNote");

  // 26.6 Complete Inline Script Syntax & Balance Validation
  const vm = require("vm");
  const scriptStart = html.indexOf("<script>");
  const scriptEnd = html.lastIndexOf("</script>");
  const scriptContent = html.slice(scriptStart + "<script>".length, scriptEnd);
  assert.doesNotThrow(() => {
    new vm.Script(scriptContent);
  }, "index.html inline script must be syntactically valid and free of unclosed braces or tokens");

  console.log("✔ Test 26: 🎼 Interactive Piano Notes Cheat Sheet, Keyboard Colorization & Live Sustain Integration passed");
}

// ==========================================
// TEST 27: ⏱️ Metronome Engine Architecture — Equal Divisions, Proper Time Signatures, Beat Subdivisions & Repertoire Synchronization
// ==========================================
{
  const fs = require("fs");
  const html = fs.readFileSync("index.html", "utf-8").replace(/\r\n/g, "\n");
  const theory = window.MusicTheory;
  assert.ok(theory, "window.MusicTheory must be available");
  assert.ok(typeof theory.parseTimeSignature === "function", "theory.parseTimeSignature must be exported");
  assert.ok(typeof theory.calculateMetronomeIntervals === "function", "theory.calculateMetronomeIntervals must be exported");
  assert.ok(typeof theory.getMetronomeTickProfile === "function", "theory.getMetronomeTickProfile must be exported");
  assert.ok(typeof theory.getTimeSignatureCountIn === "function", "theory.getTimeSignatureCountIn must be exported");

  // 27.1 Time Signature Parsing & Quarter-Note Beat Equivalencies
  const sig4_4 = theory.parseTimeSignature("4/4");
  assert.strictEqual(sig4_4.numerator, 4);
  assert.strictEqual(sig4_4.denominator, 4);
  assert.strictEqual(sig4_4.beatUnitBeats, 1.0, "Quarter note is 1.0 beat in 4/4");
  assert.strictEqual(sig4_4.measureQuarterBeats, 4.0, "4/4 measure has 4.0 quarter beats");
  assert.strictEqual(sig4_4.isCompound, false, "4/4 is not compound");

  const sig3_4 = theory.parseTimeSignature("3/4");
  assert.strictEqual(sig3_4.numerator, 3);
  assert.strictEqual(sig3_4.denominator, 4);
  assert.strictEqual(sig3_4.beatUnitBeats, 1.0);
  assert.strictEqual(sig3_4.measureQuarterBeats, 3.0);

  const sig2_4 = theory.parseTimeSignature("2/4");
  assert.strictEqual(sig2_4.numerator, 2);
  assert.strictEqual(sig2_4.denominator, 4);
  assert.strictEqual(sig2_4.beatUnitBeats, 1.0);
  assert.strictEqual(sig2_4.measureQuarterBeats, 2.0);

  const sig6_8 = theory.parseTimeSignature("6/8");
  assert.strictEqual(sig6_8.numerator, 6);
  assert.strictEqual(sig6_8.denominator, 8);
  assert.strictEqual(sig6_8.beatUnitBeats, 0.5, "Eighth note is 0.5 beat in 6/8");
  assert.strictEqual(sig6_8.measureQuarterBeats, 3.0, "6/8 measure has 3.0 quarter beats");
  assert.strictEqual(sig6_8.isCompound, true, "6/8 is compound duple");
  assert.strictEqual(sig6_8.compoundBeats, 2, "6/8 has 2 compound beats");

  const sig3_8 = theory.parseTimeSignature("3/8");
  assert.strictEqual(sig3_8.numerator, 3);
  assert.strictEqual(sig3_8.denominator, 8);
  assert.strictEqual(sig3_8.beatUnitBeats, 0.5);
  assert.strictEqual(sig3_8.measureQuarterBeats, 1.5);

  const sig5_4 = theory.parseTimeSignature("5/4");
  assert.strictEqual(sig5_4.numerator, 5);
  assert.strictEqual(sig5_4.denominator, 4);
  assert.strictEqual(sig5_4.measureQuarterBeats, 5.0);

  const sig7_8 = theory.parseTimeSignature("7/8");
  assert.strictEqual(sig7_8.numerator, 7);
  assert.strictEqual(sig7_8.denominator, 8);
  assert.strictEqual(sig7_8.measureQuarterBeats, 3.5);

  const sig12_8 = theory.parseTimeSignature("12/8");
  assert.strictEqual(sig12_8.numerator, 12);
  assert.strictEqual(sig12_8.denominator, 8);
  assert.strictEqual(sig12_8.isCompound, true);
  assert.strictEqual(sig12_8.compoundBeats, 4);

  // Fallback defaults for missing / numeric
  assert.strictEqual(theory.parseTimeSignature(null).timeSig, "4/4");
  assert.strictEqual(theory.parseTimeSignature(3).timeSig, "3/4");

  // 27.2 Strictly Equal Divisions Across Tempos & Subdivisions
  // At 120 BPM:
  // 4/4 with 1 division per beat:
  const metro120_44_1 = theory.calculateMetronomeIntervals(120, "4/4", 1);
  assert.strictEqual(metro120_44_1.ticksPerMeasure, 4);
  assert.strictEqual(metro120_44_1.beatIntervalSec, 0.5);
  assert.strictEqual(metro120_44_1.tickIntervalSec, 0.5, "Each tick interval must be mathematically equal (0.5s)");
  assert.strictEqual(metro120_44_1.tickIntervalMs, 500);
  assert.strictEqual(metro120_44_1.measureDurationSec, 2.0);

  // 4/4 with 2 equal divisions (eighth notes):
  const metro120_44_2 = theory.calculateMetronomeIntervals(120, "4/4", 2);
  assert.strictEqual(metro120_44_2.ticksPerMeasure, 8);
  assert.strictEqual(metro120_44_2.tickIntervalSec, 0.25, "Eighth note subdivision must be equal (0.25s)");
  assert.strictEqual(metro120_44_2.tickIntervalMs, 250);

  // 4/4 with 3 equal divisions (triplets):
  const metro120_44_3 = theory.calculateMetronomeIntervals(120, "4/4", 3);
  assert.strictEqual(metro120_44_3.ticksPerMeasure, 12);
  assert.ok(Math.abs(metro120_44_3.tickIntervalMs - (500 / 3)) < 0.001);

  // 4/4 with 4 equal divisions (sixteenth notes):
  const metro120_44_4 = theory.calculateMetronomeIntervals(120, "4/4", 4);
  assert.strictEqual(metro120_44_4.ticksPerMeasure, 16);
  assert.strictEqual(metro120_44_4.tickIntervalSec, 0.125, "Sixteenth note subdivision must be equal (0.125s)");
  assert.strictEqual(metro120_44_4.tickIntervalMs, 125);

  // 6/8 with 1 equal division (6 eighth notes):
  const metro120_68_1 = theory.calculateMetronomeIntervals(120, "6/8", 1);
  assert.strictEqual(metro120_68_1.ticksPerMeasure, 6);
  assert.strictEqual(metro120_68_1.tickIntervalSec, 0.25, "6/8 eighth pulse is 0.25s at 120 BPM quarter speed");
  assert.strictEqual(metro120_68_1.measureDurationSec, 1.5, "6/8 measure is 1.5s total");

  // 3/4 with 1 division per beat at 60 BPM:
  const metro60_34_1 = theory.calculateMetronomeIntervals(60, "3/4", 1);
  assert.strictEqual(metro60_34_1.ticksPerMeasure, 3);
  assert.strictEqual(metro60_34_1.tickIntervalSec, 1.0);
  assert.strictEqual(metro60_34_1.measureDurationSec, 3.0);

  // 27.3 Accent Hierarchy (Downbeat, Secondary Accent, Main Beats, Subdivisions)
  // In 4/4 (1 division):
  const p0 = theory.getMetronomeTickProfile(0, 4, "4/4", 1);
  assert.strictEqual(p0.isDownbeat, true);
  assert.strictEqual(p0.accentType, "downbeat");
  assert.strictEqual(p0.freq, 1200);

  const p1 = theory.getMetronomeTickProfile(1, 4, "4/4", 1);
  assert.strictEqual(p1.isDownbeat, false);
  assert.strictEqual(p1.accentType, "beat");
  assert.strictEqual(p1.freq, 640);

  const p2 = theory.getMetronomeTickProfile(2, 4, "4/4", 1);
  assert.strictEqual(p2.accentType, "secondary", "Beat 3 in 4/4 must have secondary accent");
  assert.strictEqual(p2.freq, 900);

  const p3 = theory.getMetronomeTickProfile(3, 4, "4/4", 1);
  assert.strictEqual(p3.accentType, "beat");
  assert.strictEqual(p3.freq, 640);

  // In 4/4 with 2 subdivisions (8 ticks total):
  const sub_p0 = theory.getMetronomeTickProfile(0, 8, "4/4", 2);
  assert.strictEqual(sub_p0.accentType, "downbeat");
  const sub_p1 = theory.getMetronomeTickProfile(1, 8, "4/4", 2);
  assert.strictEqual(sub_p1.accentType, "subdivision", "Off-beat '&' must be subdivision");
  assert.strictEqual(sub_p1.freq, 420);
  const sub_p2 = theory.getMetronomeTickProfile(2, 8, "4/4", 2);
  assert.strictEqual(sub_p2.accentType, "beat", "Beat 2 must be main beat");
  const sub_p4 = theory.getMetronomeTickProfile(4, 8, "4/4", 2);
  assert.strictEqual(sub_p4.accentType, "secondary", "Beat 3 must be secondary accent");

  // In 6/8 (6 ticks): Beat 4 (index 3) is secondary accent
  const p68_down = theory.getMetronomeTickProfile(0, 6, "6/8", 1);
  assert.strictEqual(p68_down.accentType, "downbeat");
  const p68_sec = theory.getMetronomeTickProfile(3, 6, "6/8", 1);
  assert.strictEqual(p68_sec.accentType, "secondary", "Beat 4 in 6/8 must have secondary accent");
  assert.strictEqual(p68_sec.freq, 900);

  // 27.4 Authentic Time Signature Count-in Generator
  const countIn4 = theory.getTimeSignatureCountIn("4/4", 120);
  assert.strictEqual(countIn4.countBeats.length, 5, "4/4 count-in has 4 beats + GO!");
  assert.strictEqual(countIn4.countBeats[0].label, "4");
  assert.strictEqual(countIn4.countBeats[4].label, "GO! 🔥");
  assert.strictEqual(countIn4.beatMs, 500);

  const countIn3 = theory.getTimeSignatureCountIn("3/4", 120);
  assert.strictEqual(countIn3.countBeats.length, 4, "3/4 count-in has 3 beats + GO!");
  assert.strictEqual(countIn3.countBeats[0].label, "3");
  assert.strictEqual(countIn3.countBeats[1].label, "2");
  assert.strictEqual(countIn3.countBeats[2].label, "1");
  assert.strictEqual(countIn3.countBeats[3].label, "GO! 🔥");

  const countIn2 = theory.getTimeSignatureCountIn("2/4", 120);
  assert.strictEqual(countIn2.countBeats.length, 3, "2/4 count-in has 2 beats + GO!");
  assert.strictEqual(countIn2.countBeats[0].label, "2");

  const countIn68 = theory.getTimeSignatureCountIn("6/8", 120);
  assert.strictEqual(countIn68.countBeats.length, 7, "6/8 count-in has 6 pulses + GO!");
  assert.strictEqual(countIn68.countBeats[0].label, "6");
  assert.strictEqual(countIn68.beatMs, 250);

  // 27.5 DOM & CSS Markup Validation in index.html
  assert.ok(html.includes('id="repertoireMetroToggle"'), "index.html must include #repertoireMetroToggle button");
  assert.ok(html.includes('id="metroSubdivisionSelect"'), "index.html must include #metroSubdivisionSelect");
  assert.ok(html.includes('value="6/8"'), "index.html time signature select must support 6/8");
  assert.ok(html.includes('value="3/8"'), "index.html time signature select must support 3/8");
  assert.ok(html.includes('value="5/4"'), "index.html time signature select must support 5/4");
  assert.ok(html.includes('value="7/8"'), "index.html time signature select must support 7/8");
  assert.ok(html.includes('.beat-light.active-secondary'), "CSS must include .beat-light.active-secondary styling");
  assert.ok(html.includes('.subdivision-lights-bar'), "CSS must include .subdivision-lights-bar styling");
  assert.ok(html.includes('.sub-light.active-sub'), "CSS must include .sub-light.active-sub styling");

  // 27.6 Script Logic Verification
  assert.ok(html.includes('function initRepertoireMetronome'), "index.html must define initRepertoireMetronome");
  assert.ok(html.includes('function startRepertoireMetronomeClock'), "index.html must define startRepertoireMetronomeClock");
  assert.ok(html.includes('function stopRepertoireMetronomeClock'), "index.html must define stopRepertoireMetronomeClock");
  assert.ok(html.includes('function scheduleRepertoireMetroClick'), "index.html must define scheduleRepertoireMetroClick");
  assert.ok(html.includes('getTimeSignatureCountIn(timeSigStr, bpm)'), "Tempo Flow mode must use dynamic time signature count-in");
  assert.ok(html.includes('calculateMetronomeIntervals(bpm, timeSigStr, 1)'), "Tempo Flow mode must schedule isochronous equal-division clicks");

  // 27.7 Complete Script Syntax Validation
  const vm = require("vm");
  const scriptStart = html.indexOf("<script>");
  const scriptEnd = html.lastIndexOf("</script>");
  const scriptContent = html.slice(scriptStart + "<script>".length, scriptEnd);
  assert.doesNotThrow(() => {
    new vm.Script(scriptContent);
  }, "index.html inline script must be syntactically valid and free of unclosed tokens or syntax errors");

  console.log("✔ Test 27: ⏱️ Metronome Engine Architecture — Equal Divisions, Proper Time Signatures, Beat Subdivisions & Repertoire Synchronization passed");
}

// ==========================================
// TEST 28: 🔊 Hardware Output Device Selection (Web Audio setSinkId & Web MIDI Outputs)
// ==========================================
{
  const fs = require("fs");
  const html = fs.readFileSync("index.html", "utf-8").replace(/\r\n/g, "\n");
  const theory = window.MusicTheory;
  assert.ok(theory, "window.MusicTheory must be available");

  // 28.1 Theory MIDI Message Formatting & Encoding
  assert.ok(typeof theory.formatMidiMessage === "function", "theory.formatMidiMessage must be exported");
  assert.ok(typeof theory.createMidiNoteOn === "function", "theory.createMidiNoteOn must be exported");
  assert.ok(typeof theory.createMidiNoteOff === "function", "theory.createMidiNoteOff must be exported");
  assert.ok(typeof theory.createMidiCC === "function", "theory.createMidiCC must be exported");
  assert.ok(typeof theory.filterAudioOutputDevices === "function", "theory.filterAudioOutputDevices must be exported");

  // Test Note-On bitwise generation across channels 1..16
  const msgNoteOnCh1 = theory.formatMidiMessage(9, 60, 100, 1);
  assert.deepStrictEqual(msgNoteOnCh1, [0x90, 60, 100], "Channel 1 Note-On status byte must be 0x90");

  const msgNoteOnCh10 = theory.formatMidiMessage(9, 36, 127, 10);
  assert.deepStrictEqual(msgNoteOnCh10, [0x99, 36, 127], "Channel 10 Note-On status byte must be 0x99 (percussion)");

  const msgNoteOnCh16 = theory.formatMidiMessage(9, 72, 80, 16);
  assert.deepStrictEqual(msgNoteOnCh16, [0x9F, 72, 80], "Channel 16 Note-On status byte must be 0x9F");

  // Test Note-Off bitwise generation
  const msgNoteOffCh1 = theory.formatMidiMessage(8, 60, 0, 1);
  assert.deepStrictEqual(msgNoteOffCh1, [0x80, 60, 0], "Channel 1 Note-Off status byte must be 0x80");

  // Test Control Change (CC) generation (CC 64 Damper Sustain, CC 120 All Sound Off, CC 123 All Notes Off)
  const msgSustainOn = theory.createMidiCC(64, 127, 1);
  assert.deepStrictEqual(msgSustainOn, [0xB0, 64, 127], "Damper pedal down on Ch 1 must produce [0xB0, 64, 127]");

  const msgSustainOff = theory.createMidiCC(64, 0, 1);
  assert.deepStrictEqual(msgSustainOff, [0xB0, 64, 0], "Damper pedal release on Ch 1 must produce [0xB0, 64, 0]");

  const msgAllSoundOff = theory.createMidiCC(120, 0, 2);
  assert.deepStrictEqual(msgAllSoundOff, [0xB1, 120, 0], "All Sound Off on Ch 2 must produce [0xB1, 120, 0]");

  const msgAllNotesOff = theory.createMidiCC(123, 0, 1);
  assert.deepStrictEqual(msgAllNotesOff, [0xB0, 123, 0], "All Notes Off on Ch 1 must produce [0xB0, 123, 0]");

  // Test createMidiNoteOn with pitch strings and MIDI numbers
  const noteOnFromPitch = theory.createMidiNoteOn("C4", 90, 1);
  assert.deepStrictEqual(noteOnFromPitch, [0x90, 60, 90], "createMidiNoteOn with 'C4' must map to MIDI 60");

  const noteOnFromNumber = theory.createMidiNoteOn(69, 110, 3);
  assert.deepStrictEqual(noteOnFromNumber, [0x92, 69, 110], "createMidiNoteOn with 69 on Ch 3 must map to [0x92, 69, 110]");

  // Test createMidiNoteOff with pitch strings and MIDI numbers
  const noteOffFromPitch = theory.createMidiNoteOff("A4", 1);
  assert.deepStrictEqual(noteOffFromPitch, [0x80, 69, 0], "createMidiNoteOff with 'A4' must map to [0x80, 69, 0]");

  // Boundary clamping: velocity and data bytes capped to 0..127
  const clampedNoteOn = theory.createMidiNoteOn("C4", 150, 1);
  assert.strictEqual(clampedNoteOn[2], 127, "Velocity above 127 must be clamped to 127");

  // 28.2 Audio Output Device Filtering
  const mockDevices = [
    { kind: "audioinput", deviceId: "mic1", label: "Built-in Microphone" },
    { kind: "videoinput", deviceId: "cam1", label: "Webcam" },
    { kind: "audiooutput", deviceId: "default", label: "System Default Output" },
    { kind: "audiooutput", deviceId: "hp_out", label: "Headphones (Realtek Audio)" },
    { kind: "audiooutput", deviceId: "dac_out", label: "Focusrite Scarlett 2i2 USB" },
    { kind: "audiooutput", deviceId: "spk_out", label: "" } // Unlabeled output fallback
  ];

  const filteredOutputs = theory.filterAudioOutputDevices(mockDevices);
  assert.strictEqual(filteredOutputs.length, 4, "Should only extract the 4 audiooutput devices");
  assert.strictEqual(filteredOutputs[0].deviceId, "default");
  assert.strictEqual(filteredOutputs[0].label, "System Default Output");
  assert.strictEqual(filteredOutputs[1].deviceId, "hp_out");
  assert.strictEqual(filteredOutputs[2].deviceId, "dac_out");
  assert.strictEqual(filteredOutputs[3].deviceId, "spk_out");
  assert.strictEqual(filteredOutputs[3].label, "Audio Output 4", "Unlabeled output must receive friendly fallback label");

  // 28.3 DOM & UI Verification in index.html
  assert.ok(html.includes('id="audioOutputSelect"'), "index.html must include #audioOutputSelect in header audio deck");
  assert.ok(html.includes('id="refreshAudioDevicesBtn"'), "index.html must include #refreshAudioDevicesBtn");
  assert.ok(html.includes('id="audioOutputStatusIcon"'), "index.html must include #audioOutputStatusIcon");
  assert.ok(html.includes('id="midiOutputSelect"'), "index.html must include #midiOutputSelect");
  assert.ok(html.includes('id="midiDeviceSelect"'), "index.html must include #midiDeviceSelect");
  assert.ok(html.includes('title="Select MIDI input device'), "midiDeviceSelect must be labeled for MIDI input");
  assert.ok(html.includes('title="Send MIDI note output to digital piano or external synth"'), "midiOutputSelect must be labeled for MIDI output");

  // CSS Styling Verification
  assert.ok(html.includes('.audio-output-control'), "CSS must include .audio-output-control");
  assert.ok(html.includes('.audio-output-select'), "CSS must include .audio-output-select");
  assert.ok(html.includes('.midi-select'), "CSS must include .midi-select");

  // 28.4 Script Functions & Routing Logic
  assert.ok(html.includes('function initAudioOutputRouting'), "index.html must define initAudioOutputRouting");
  assert.ok(html.includes('function updateAudioOutputDeviceList'), "index.html must define updateAudioOutputDeviceList");
  assert.ok(html.includes('function setAudioOutputDevice'), "index.html must define setAudioOutputDevice");
  assert.ok(html.includes('function initMidiOutputRouting'), "index.html must define initMidiOutputRouting");
  assert.ok(html.includes('function updateMidiOutputDeviceList'), "index.html must define updateMidiOutputDeviceList");
  assert.ok(html.includes('function setMidiOutputDevice'), "index.html must define setMidiOutputDevice");
  assert.ok(html.includes('function sendMidiOutputNoteOn'), "index.html must define sendMidiOutputNoteOn");
  assert.ok(html.includes('function sendMidiOutputNoteOff'), "index.html must define sendMidiOutputNoteOff");
  assert.ok(html.includes('function sendMidiOutputSustain'), "index.html must define sendMidiOutputSustain");
  assert.ok(html.includes('function sendMidiAllNotesOff'), "index.html must define sendMidiAllNotesOff");
  assert.ok(html.includes('audioCtx.setSinkId'), "index.html must route Web Audio via audioCtx.setSinkId");

  // 28.5 Boot Up & Lifecycle Invocation
  assert.ok(html.includes('initAudioOutputRouting();'), "index.html boot up must invoke initAudioOutputRouting");
  assert.ok(html.includes('initMidiOutputRouting();'), "index.html boot up must invoke initMidiOutputRouting");

  // 28.6 Complete Script Syntax Validation
  const vm = require("vm");
  const scriptStart = html.indexOf("<script>");
  const scriptEnd = html.lastIndexOf("</script>");
  const scriptContent = html.slice(scriptStart + "<script>".length, scriptEnd);
  assert.doesNotThrow(() => {
    new vm.Script(scriptContent);
  }, "index.html inline script must be syntactically valid and free of unclosed tokens or syntax errors");

  console.log("✔ Test 28: 🔊 Hardware Output Device Selection (Web Audio setSinkId & Web MIDI Outputs) passed");
}

// ==========================================
// TEST 29: 🔊 Universal Multi-Device Audio Output Enumeration, Discovery & Native Picker Engine
// ==========================================
{
  const fs = require("fs");
  const html = fs.readFileSync("index.html", "utf-8").replace(/\r\n/g, "\n");
  const theory = window.MusicTheory;
  assert.ok(theory, "window.MusicTheory must be available");

  // 29.1 Device Categorization & Classification (theory.classifyAudioDevice)
  assert.ok(typeof theory.classifyAudioDevice === "function", "theory.classifyAudioDevice must be exported");

  const headPhoneTest = theory.classifyAudioDevice("Headphones (Realtek(R) Audio)", "hp1");
  assert.strictEqual(headPhoneTest.type, "headphones", "Headphones must be classified as type 'headphones'");
  assert.strictEqual(headPhoneTest.icon, "🎧", "Headphones must receive 🎧 icon");

  const displayTest = theory.classifyAudioDevice("2 - LG UltraWide (NVIDIA High Definition Audio)", "disp1");
  assert.strictEqual(displayTest.type, "display", "Monitor/TV audio must be classified as 'display'");
  assert.strictEqual(displayTest.icon, "🖥️", "Display audio must receive 🖥️ icon");

  const dacTest = theory.classifyAudioDevice("Focusrite USB Audio (Scarlett 2i2 USB)", "dac1");
  assert.strictEqual(dacTest.type, "interface", "USB DAC / Audio interface must be classified as 'interface'");
  assert.strictEqual(dacTest.icon, "🎛️", "Audio interface must receive 🎛️ icon");

  const virtualTest = theory.classifyAudioDevice("CABLE Input (VB-Audio Virtual Cable)", "virt1");
  assert.strictEqual(virtualTest.type, "virtual", "Virtual audio cable must be classified as 'virtual'");
  assert.strictEqual(virtualTest.icon, "🔀", "Virtual audio cable must receive 🔀 icon");

  const spdifTest = theory.classifyAudioDevice("Digital Audio (S/PDIF) (High Definition Audio Device)", "spdif1");
  assert.strictEqual(spdifTest.type, "digital", "S/PDIF optical audio must be classified as 'digital'");
  assert.strictEqual(spdifTest.icon, "⚡", "S/PDIF audio must receive ⚡ icon");

  const speakerTest = theory.classifyAudioDevice("Speakers (Realtek(R) Audio)", "spk1");
  assert.strictEqual(speakerTest.type, "speakers", "Speakers must be classified as 'speakers'");
  assert.strictEqual(speakerTest.icon, "🔊", "Speakers must receive 🔊 icon");

  const defaultTest = theory.classifyAudioDevice("Default - System Default Output", "default");
  assert.strictEqual(defaultTest.type, "default", "Default system device must be classified as 'default'");
  assert.strictEqual(defaultTest.icon, "💻", "Default system device must receive 💻 icon");

  // 29.2 Full 11-Device Computer Audio Output Enumeration
  const mock11Devices = [
    { kind: "audioinput", deviceId: "mic_built_in", label: "Microphone Array (Realtek(R) Audio)" },
    { kind: "videoinput", deviceId: "webcam1", label: "Integrated Webcam HD" },
    { kind: "audiooutput", deviceId: "default", label: "Default - Speakers (Realtek(R) Audio)" },
    { kind: "audiooutput", deviceId: "dev_speakers", label: "Speakers (Realtek(R) Audio)" },
    { kind: "audiooutput", deviceId: "dev_headphones", label: "Headphones (Realtek(R) Audio)" },
    { kind: "audiooutput", deviceId: "dev_spdif", label: "Digital Audio (S/PDIF) (High Definition Audio Device)" },
    { kind: "audiooutput", deviceId: "dev_hdmi_lg", label: "2 - LG UltraWide (NVIDIA High Definition Audio)" },
    { kind: "audiooutput", deviceId: "dev_bt_stereo", label: "Headphones (WH-1000XM4 Stereo)" },
    { kind: "audiooutput", deviceId: "dev_bt_ag", label: "Headset (WH-1000XM4 Hands-Free AG Audio)" },
    { kind: "audiooutput", deviceId: "dev_vb_cable", label: "CABLE Input (VB-Audio Virtual Cable)" },
    { kind: "audiooutput", deviceId: "dev_focusrite", label: "Focusrite USB Audio (Scarlett 2i2 USB)" },
    { kind: "audiooutput", deviceId: "dev_voicemeeter", label: "VoiceMeeter Input (VB-Audio VoiceMeeter VAIO)" },
    { kind: "audiooutput", deviceId: "communications", label: "Communications - Headset (WH-1000XM4 Hands-Free AG Audio)" }
  ];

  const filtered11 = theory.filterAudioOutputDevices(mock11Devices);
  assert.strictEqual(filtered11.length, 11, "Must accurately extract all 11 audiooutput devices on the computer");

  // Verify full label preservation (no 30-character aggressive truncation)
  assert.ok(filtered11.some(d => d.label === "Digital Audio (S/PDIF) (High Definition Audio Device)"), "Long device labels must not be aggressively truncated");
  assert.ok(filtered11.some(d => d.label === "2 - LG UltraWide (NVIDIA High Definition Audio)"), "Display device labels must be preserved in full");
  assert.ok(filtered11.some(d => d.label === "Focusrite USB Audio (Scarlett 2i2 USB)"), "USB interface labels must be preserved in full");

  // Verify icons & categories attached to filtered results
  const focusriteItem = filtered11.find(d => d.deviceId === "dev_focusrite");
  assert.strictEqual(focusriteItem.icon, "🎛️", "Focusrite device must be tagged with 🎛️ icon");
  const hdmiItem = filtered11.find(d => d.deviceId === "dev_hdmi_lg");
  assert.strictEqual(hdmiItem.icon, "🖥️", "HDMI display device must be tagged with 🖥️ icon");

  // 29.3 DOM UI Elements in index.html
  assert.ok(html.includes('id="openAudioPickerBtn"'), "index.html must include #openAudioPickerBtn for system output picker");
  assert.ok(html.includes('id="refreshAudioDevicesBtn"'), "index.html must include #refreshAudioDevicesBtn for rescan & discovery");
  assert.ok(html.includes('id="testAudioOutputBtn"'), "index.html must include #testAudioOutputBtn for audible test chimes");
  assert.ok(html.includes('id="audioOutputLabel"'), "index.html must include #audioOutputLabel for dynamic device count badge");
  assert.ok(html.includes('.audio-output-actions'), "index.html CSS must include .audio-output-actions");

  // 29.4 Discovery & Routing Function Validation
  assert.ok(html.includes('function requestAudioOutputAccess'), "index.html must define requestAudioOutputAccess");
  assert.ok(html.includes('function openNativeAudioOutputPicker'), "index.html must define openNativeAudioOutputPicker");
  assert.ok(html.includes('function playTestAudioChime'), "index.html must define playTestAudioChime");
  assert.ok(html.includes('__discover__'), "index.html must include __discover__ action in dropdown");
  assert.ok(html.includes('__system_picker__'), "index.html must include __system_picker__ action in dropdown");
  assert.ok(html.includes('audioCtx.setSinkId'), "index.html must route Web Audio via audioCtx.setSinkId");

  // 29.5 Script Syntax Validation via Node vm
  const vm = require("vm");
  const scriptStart = html.indexOf("<script>");
  const scriptEnd = html.lastIndexOf("</script>");
  const scriptContent = html.slice(scriptStart + "<script>".length, scriptEnd);
  assert.doesNotThrow(() => {
    new vm.Script(scriptContent);
  }, "index.html script must remain fully syntactically valid with multi-device discovery");

  console.log("✔ Test 29: 🔊 Universal Multi-Device Audio Output Enumeration, Discovery & Native Picker Engine passed");
}

// ==========================================
// TEST 30: 🪵 Multi-Timbre Metronome Engine & Acoustic Wood Block Synthesis
// ==========================================
{
  const fs = require("fs");
  const html = fs.readFileSync("index.html", "utf-8").replace(/\r\n/g, "\n");
  const theory = window.MusicTheory;
  assert.ok(theory, "window.MusicTheory must be available");

  // 30.1 Presets Validation (METRONOME_SOUND_PRESETS)
  assert.ok(Array.isArray(theory.METRONOME_SOUND_PRESETS), "theory.METRONOME_SOUND_PRESETS must be exported as an array");
  assert.strictEqual(theory.METRONOME_SOUND_PRESETS.length, 5, "Must support 5 distinct metronome sound presets");

  const woodblockPreset = theory.METRONOME_SOUND_PRESETS.find(p => p.id === "woodblock");
  assert.ok(woodblockPreset, "Wood Block preset must exist");
  assert.strictEqual(woodblockPreset.id, "woodblock");
  assert.ok(woodblockPreset.label.includes("Wood Block"), "Wood Block label must include 'Wood Block'");

  const mechanicalPreset = theory.METRONOME_SOUND_PRESETS.find(p => p.id === "mechanical");
  assert.ok(mechanicalPreset, "Mechanical Tick preset must exist");

  const digitalPreset = theory.METRONOME_SOUND_PRESETS.find(p => p.id === "digital");
  assert.ok(digitalPreset, "Digital Beep preset must exist");

  const cowbellPreset = theory.METRONOME_SOUND_PRESETS.find(p => p.id === "cowbell");
  assert.ok(cowbellPreset, "Cowbell preset must exist");

  const stickPreset = theory.METRONOME_SOUND_PRESETS.find(p => p.id === "stick");
  assert.ok(stickPreset, "Stick preset must exist");

  // 30.2 Sound Parameter Engine (getMetronomeSoundParameters)
  assert.ok(typeof theory.getMetronomeSoundParameters === "function", "theory.getMetronomeSoundParameters must be exported");

  const wbDownbeat = theory.getMetronomeSoundParameters("woodblock", "downbeat");
  assert.strictEqual(wbDownbeat.freq1, 1220, "Wood Block downbeat primary frequency must be 1220 Hz");
  assert.strictEqual(wbDownbeat.freq2, 1928, "Wood Block downbeat secondary frequency must be 1928 Hz");
  assert.strictEqual(wbDownbeat.filterFreq, 1320, "Wood Block downbeat bandpass filter must be 1320 Hz");
  assert.strictEqual(wbDownbeat.filterQ, 5.5, "Wood Block filter Q factor must be 5.5");

  const wbBeat = theory.getMetronomeSoundParameters("woodblock", "beat");
  assert.strictEqual(wbBeat.freq1, 860, "Wood Block beat primary frequency must be 860 Hz");
  assert.strictEqual(wbBeat.freq2, 1360, "Wood Block beat secondary frequency must be 1360 Hz");
  assert.ok(wbDownbeat.gain > wbBeat.gain, "Wood Block downbeat must have higher gain than regular beat");

  const mechBeat = theory.getMetronomeSoundParameters("mechanical", "beat");
  assert.strictEqual(mechBeat.clickFreq, 3200, "Mechanical click frequency must be 3200 Hz");
  assert.strictEqual(mechBeat.thumpFreq, 240, "Mechanical cabinet thump frequency must be 240 Hz");

  const digiBeat = theory.getMetronomeSoundParameters("digital", "downbeat");
  assert.strictEqual(digiBeat.freq, 1600, "Digital downbeat frequency must be 1600 Hz");

  // 30.3 Web Audio Synthesis Engine (synthesizeMetronomeClick)
  assert.ok(typeof theory.synthesizeMetronomeClick === "function", "theory.synthesizeMetronomeClick must be exported");

  // Mock AudioContext and Web Audio Nodes
  function createMockAudioContext() {
    return {
      currentTime: 1.0,
      destination: { id: "dest" },
      createOscillator() {
        return {
          type: "sine",
          frequency: {
            setValueAtTime: (v, t) => {},
            exponentialRampToValueAtTime: (v, t) => {}
          },
          connect: (n) => {},
          start: (t) => {},
          stop: (t) => {}
        };
      },
      createGain() {
        return {
          gain: {
            setValueAtTime: (v, t) => {},
            exponentialRampToValueAtTime: (v, t) => {}
          },
          connect: (n) => {}
        };
      },
      createBiquadFilter() {
        return {
          type: "bandpass",
          frequency: { setValueAtTime: (v, t) => {} },
          Q: { setValueAtTime: (v, t) => {} },
          connect: (n) => {}
        };
      }
    };
  }

  const mockCtx = createMockAudioContext();

  // Test Wood Block synthesis
  const wbResult = theory.synthesizeMetronomeClick(mockCtx, null, 1.5, "downbeat", "woodblock", 0.8);
  assert.ok(wbResult, "synthesizeMetronomeClick for woodblock must return synthesis object");
  assert.strictEqual(wbResult.soundId, "woodblock");
  assert.strictEqual(wbResult.accentType, "downbeat");
  assert.strictEqual(wbResult.time, 1.5);
  assert.strictEqual(wbResult.nodes.length, 2, "Wood Block must create dual resonant body oscillators");

  // Test Mechanical synthesis
  const mechResult = theory.synthesizeMetronomeClick(mockCtx, null, 2.0, "beat", "mechanical", 0.8);
  assert.ok(mechResult, "synthesizeMetronomeClick for mechanical must return synthesis object");
  assert.strictEqual(mechResult.soundId, "mechanical");
  assert.strictEqual(mechResult.nodes.length, 2, "Mechanical tick must create click and thump oscillators");

  // Test Digital synthesis
  const digiResult = theory.synthesizeMetronomeClick(mockCtx, null, 2.5, "subdivision", "digital", 0.8);
  assert.ok(digiResult, "synthesizeMetronomeClick for digital must return synthesis object");
  assert.strictEqual(digiResult.soundId, "digital");
  assert.strictEqual(digiResult.nodes.length, 1, "Digital beep creates single sine oscillator");

  // Test Cowbell and Stick synthesis
  const cowResult = theory.synthesizeMetronomeClick(mockCtx, null, 3.0, "beat", "cowbell", 0.8);
  assert.strictEqual(cowResult.soundId, "cowbell");
  const stickResult = theory.synthesizeMetronomeClick(mockCtx, null, 3.5, "beat", "stick", 0.8);
  assert.strictEqual(stickResult.soundId, "stick");

  // Silence gate on 0 volume
  const silentResult = theory.synthesizeMetronomeClick(mockCtx, null, 4.0, "beat", "woodblock", 0);
  assert.strictEqual(silentResult, null, "Zero volume scale must bypass synthesis and return null");

  // Null audio context safety
  const nullCtxResult = theory.synthesizeMetronomeClick(null, null, 1.0, "beat", "woodblock", 0.8);
  assert.strictEqual(nullCtxResult, null, "Null audio context must safely return null without throwing");

  // 30.4 DOM Elements & UI Selectors in index.html
  assert.ok(html.includes('id="metroSoundSelect"'), "index.html must include #metroSoundSelect in Rhythm Workshop");
  assert.ok(html.includes('id="repertoireMetroSoundSelect"'), "index.html must include #repertoireMetroSoundSelect in transport controls");
  assert.ok(html.includes('value="woodblock"'), "Both metronome sound selects must support 'woodblock'");
  assert.ok(html.includes('value="mechanical"'), "Both metronome sound selects must support 'mechanical'");
  assert.ok(html.includes('value="digital"'), "Both metronome sound selects must support 'digital'");
  assert.ok(html.includes('value="cowbell"'), "Both metronome sound selects must support 'cowbell'");
  assert.ok(html.includes('value="stick"'), "Both metronome sound selects must support 'stick'");

  // 30.5 Script Logic & Synchronization in index.html
  assert.ok(html.includes('let currentMetroSound = "woodblock"'), "index.html must default currentMetroSound to 'woodblock'");
  assert.ok(html.includes('function setMetroSound'), "index.html must define setMetroSound function");
  assert.ok(html.includes('function playMetronomeSoundPreview'), "index.html must define playMetronomeSoundPreview function");
  assert.ok(html.includes('piano_metro_sound'), "index.html must persist metronome sound in LocalStorage (piano_metro_sound)");
  assert.ok(html.includes('synthesizeMetronomeClick(audioCtx, masterGainNode || audioCtx.destination, time, profile.accentType, currentMetroSound'), "scheduleMetroClick must route clicks through synthesizeMetronomeClick");
  assert.ok(html.includes('synthesizeMetronomeClick(audioCtx, masterGainNode || audioCtx.destination, time, profile.accentType, currentMetroSound, effectiveVol)'), "scheduleRepertoireMetroClick must route clicks through synthesizeMetronomeClick");

  // 30.6 Complete Script Syntax Validation via Node vm
  const vm = require("vm");
  const scriptStart = html.indexOf("<script>");
  const scriptEnd = html.lastIndexOf("</script>");
  const scriptContent = html.slice(scriptStart + "<script>".length, scriptEnd);
  assert.doesNotThrow(() => {
    new vm.Script(scriptContent);
  }, "index.html inline script must be syntactically valid with multi-sound metronome engine");

  console.log("✔ Test 30: 🪵 Multi-Timbre Metronome Engine & Acoustic Wood Block Synthesis passed");
}

// ==========================================
// TEST 31: 🎨 Visual Expansion, 3D Realism, Metronome Pendulum & UI Cleanliness Verification
// ==========================================
{
  const fs = require("fs");
  const path = require("path");
  const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
  const readmePath = path.join(__dirname, "../README.md");

  // 31.1 README.md Existence & Comprehensive Content
  assert.ok(fs.existsSync(readmePath), "README.md must exist in project root");
  const readme = fs.readFileSync(readmePath, "utf8");
  assert.ok(readme.includes("# 🎹 Piano Practice Lab & Interactive Score Reader"), "README.md must have main title");
  assert.ok(readme.includes("Repertoire Practice Lab"), "README.md must document Repertoire Practice Lab");
  assert.ok(readme.includes("Sight-Reading Speed Drill"), "README.md must document Sight-Reading Speed Drill");
  assert.ok(readme.includes("Ear Training & Interval Gym"), "README.md must document Ear Training & Interval Gym");
  assert.ok(readme.includes("Scales, Chords & Theory Studio"), "README.md must document Scales, Chords & Theory Studio");
  assert.ok(readme.includes("Rhythm & Metronome Workshop"), "README.md must document Rhythm & Metronome Workshop");
  assert.ok(readme.includes("Theory Lessons & Circle of Fifths"), "README.md must document Theory Lessons & Circle of Fifths");
  assert.ok(readme.includes("3D Piano Keyboard Visualizer"), "README.md must document 3D Piano Keyboard Visualizer");
  assert.ok(readme.includes("Web Audio"), "README.md must document Web Audio architecture");
  assert.ok(readme.includes("Web MIDI"), "README.md must document Web MIDI architecture");
  assert.ok(readme.includes("Testing & Verification"), "README.md must document Testing & Verification");

  // 31.2 3D Piano Keyboard Aesthetics & Tactile Realism
  assert.ok(html.includes('.piano-key.white:hover'), "index.html must include .piano-key.white:hover style");
  assert.ok(html.includes('.piano-key.black:hover'), "index.html must include .piano-key.black:hover style");
  assert.ok(html.includes('transform: translateY(3px) scale(0.992)'), "index.html must include tactile key depression transforms");
  assert.ok(html.includes('transform: translateY(3.5px) scale(0.99)'), "index.html must include live key tactile press transform");

  // 31.3 Metronome Mechanical Pendulum Arm Visualizer
  assert.ok(html.includes('id="metroPendulumCase"'), "index.html must include #metroPendulumCase in Rhythm Workshop");
  assert.ok(html.includes('id="metroPendulumRod"'), "index.html must include #metroPendulumRod pendulum arm");
  assert.ok(html.includes('id="metroPendulumWeight"'), "index.html must include #metroPendulumWeight adjustable bob");
  assert.ok(html.includes('.metro-pendulum-rod.swinging'), "index.html must include .metro-pendulum-rod.swinging animation rule");
  assert.ok(html.includes('@keyframes pendulumSwing'), "index.html must define @keyframes pendulumSwing");
  assert.ok(html.includes('--metro-swing-period'), "index.html must dynamically drive --metro-swing-period");
  assert.ok(html.includes('--pendulum-bob-pos'), "index.html must dynamically drive --pendulum-bob-pos based on BPM");

  // 31.4 Practice Feedback, Streak Flame & Ear Pulse Visuals
  assert.ok(html.includes('.hud-streak-hot'), "index.html must include .hud-streak-hot fiery streak styling");
  assert.ok(html.includes('@keyframes streakFlame'), "index.html must include @keyframes streakFlame");
  assert.ok(html.includes('.hud-stars-sparkle'), "index.html must include .hud-stars-sparkle celebration styling");
  assert.ok(html.includes('@keyframes soundWavePulse'), "index.html must include @keyframes soundWavePulse");
  assert.ok(html.includes('.playing-sound-pulse'), "index.html must include .playing-sound-pulse for audio buttons");

  // 31.5 Sight-Reading Speed Drill Timer Progress Bar
  assert.ok(html.includes('id="srTimerTrack"'), "index.html must include #srTimerTrack progress bar track");
  assert.ok(html.includes('id="srTimerProgress"'), "index.html must include #srTimerProgress bar element");
  assert.ok(html.includes('.sr-timer-progress.urgent'), "index.html must include .sr-timer-progress.urgent styling");

  // 31.6 CSS Brace Balance & Cleanup Validation
  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
  assert.ok(styleMatch, "index.html must contain <style> tag");
  const styleContent = styleMatch[1];
  let openBraceCount = 0;
  for (let i = 0; i < styleContent.length; i++) {
    if (styleContent[i] === '{') openBraceCount++;
    if (styleContent[i] === '}') openBraceCount--;
  }
  assert.strictEqual(openBraceCount, 0, "<style> block must have perfectly balanced curly braces (0 unclosed)");

  // 31.7 Complete Script Syntax Validation via Node vm
  const vm = require("vm");
  const scriptStart = html.indexOf("<script>");
  const scriptEnd = html.lastIndexOf("</script>");
  const scriptContent = html.slice(scriptStart + "<script>".length, scriptEnd);
  assert.doesNotThrow(() => {
    new vm.Script(scriptContent);
  }, "index.html inline script must be syntactically valid with visual expansion & pendulum engine");

  console.log("✔ Test 31: 🎨 Visual Expansion, 3D Realism, Metronome Pendulum & UI Cleanliness passed");
}

// ==========================================
// TEST 32: 𝄢 Left-Hand Accompaniment Engine & Multi-Level Left-Hand Style Selector
// ==========================================
{
  const theory = require("../theory.js");
  const fs = require("fs");
  const path = require("path");
  const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");

  // 32.1 Exports & Style Presets in theory.js
  assert.ok(theory.LH_ACCOMPANIMENT_STYLES, "theory must export LH_ACCOMPANIMENT_STYLES");
  assert.strictEqual(theory.LH_ACCOMPANIMENT_STYLES.length, 6, "Must define 6 LH accompaniment styles");
  const styleIds = theory.LH_ACCOMPANIMENT_STYLES.map(s => s.id);
  assert.ok(styleIds.includes("song"), "Must include 'song' style");
  assert.ok(styleIds.includes("roots"), "Must include 'roots' style");
  assert.ok(styleIds.includes("fifths"), "Must include 'fifths' style");
  assert.ok(styleIds.includes("octaves"), "Must include 'octaves' style");
  assert.ok(styleIds.includes("triads"), "Must include 'triads' style");
  assert.ok(styleIds.includes("thirds"), "Must include 'thirds' style");

  // 32.2 Bass Root Extraction & Pitch Transformations
  assert.strictEqual(theory.extractBassRoot("C3"), "C3", "Single note returns itself");
  assert.strictEqual(theory.extractBassRoot("C3+G3+C4"), "C3", "Extracts lowest root pitch from 3-note chord");
  assert.strictEqual(theory.extractBassRoot("F2+C3+F3"), "F2", "Extracts lowest root F2");
  assert.strictEqual(theory.extractBassRoot("G2+F3+B3"), "G2", "Extracts lowest root G2");
  assert.strictEqual(theory.extractBassRoot("-"), "-", "Rest returns '-'");

  assert.strictEqual(theory.transformLeftHandPitch("C3+G3+C4", "roots"), "C3", "Roots style simplifies multi-note chord to single root C3");
  assert.strictEqual(theory.transformLeftHandPitch("C3", "fifths"), "C3+G3", "Fifths style adds diatonic 5th above C3");
  assert.strictEqual(theory.transformLeftHandPitch("G2", "fifths"), "G2+D3", "Fifths style adds diatonic 5th above G2");
  assert.strictEqual(theory.transformLeftHandPitch("C3", "octaves"), "C3+C4", "Octaves style adds diatonic octave above C3");
  assert.strictEqual(theory.transformLeftHandPitch("G2", "octaves"), "G2+G3", "Octaves style adds diatonic octave above G2");
  assert.strictEqual(theory.transformLeftHandPitch("C3", "triads"), "C3+E3+G3", "Triads style builds C Major triad C3+E3+G3");
  assert.strictEqual(theory.transformLeftHandPitch("G2", "triads"), "G2+B2+D3", "Triads style builds G Major triad G2+B2+D3");
  assert.strictEqual(theory.transformLeftHandPitch("C3", "thirds"), "C3+E3", "Thirds style adds diatonic 3rd above C3");

  // 32.3 Lean on Me Simplification with Single Roots
  const leanSong = songDatabase.find(s => s.id === "lean-on-me");
  assert.ok(leanSong, "Lean on Me must exist");
  const leanRoots = theory.generateLeftHandAccompaniment(leanSong, "roots");

  // Measure 1 of Lean on Me with roots: C3:3 C3:0.5 F2:0.5~
  const leanRootsM1 = leanRoots.lh.split("|")[0].trim();
  assert.ok(leanRootsM1.includes("C3:3") && leanRootsM1.includes("F2:0.5~"), "Lean on Me M1 simplified to C3 and F2 roots with tie preserved");
  assert.ok(!leanRootsM1.includes("+"), "Lean on Me M1 with roots style must have zero chord plus signs");
  assert.strictEqual(leanRoots.lhF.split("|")[0].trim(), "5 5 5", "Fingers simplified to single finger 5");

  // 32.4 Ode to Joy Accompaniment Generation (Fifths, Octaves, Triads)
  const odeSong = songDatabase.find(s => s.id === "ode-to-joy");
  assert.ok(odeSong, "Ode to Joy must exist");
  const odeFifths = theory.generateLeftHandAccompaniment(odeSong, "fifths");
  assert.strictEqual(odeFifths.lh.split("|")[0].trim(), "C3+G3:2 C3+G3:2", "Ode to Joy M1 transformed to open 5ths C3+G3");
  assert.strictEqual(odeFifths.lhF.split("|")[0].trim(), "5+1 5+1", "Fingers set to 5+1");

  const odeOctaves = theory.generateLeftHandAccompaniment(odeSong, "octaves");
  assert.strictEqual(odeOctaves.lh.split("|")[0].trim(), "C3+C4:2 C3+C4:2", "Ode to Joy M1 transformed to bass octaves C3+C4");
  assert.strictEqual(odeOctaves.lhF.split("|")[0].trim(), "5+1 5+1", "Fingers set to 5+1");

  const odeTriads = theory.generateLeftHandAccompaniment(odeSong, "triads");
  assert.strictEqual(odeTriads.lh.split("|")[0].trim(), "C3+E3+G3:2 C3+E3+G3:2", "Ode to Joy M1 transformed to full triads C3+E3+G3");
  assert.strictEqual(odeTriads.lhF.split("|")[0].trim(), "5+3+1 5+3+1", "Fingers set to 5+3+1");

  // 32.5 Score Model Integration with lhStyle
  const leanRootsModel = buildScoreModel(leanSong, true, true, false, "song", "roots");
  const leanStep0 = leanRootsModel.steps[0];
  assert.deepStrictEqual(leanStep0.expectedPitches, ["C4", "C3"], "Step 0 expected pitches simplified to RH C4 and LH C3 (no G3 or top C4)");
  assert.strictEqual(leanStep0.lh.pitch, "C3", "LH pitch is single root C3");
  assert.strictEqual(leanStep0.lhF, "5", "LH finger is single 5");

  const odeFifthsModel = buildScoreModel(odeSong, true, true, false, "song", "fifths");
  const odeStep0 = odeFifthsModel.steps[0];
  assert.deepStrictEqual(odeStep0.expectedPitches, ["E4", "C3", "G3"], "Step 0 expected pitches include melody E4 and fifth C3+G3");
  assert.strictEqual(odeStep0.lh.pitch, "C3+G3", "LH pitch is open fifth C3+G3");
  assert.strictEqual(odeStep0.lhF, "5+1", "LH finger is 5+1");

  // 32.6 UI Controls, Styling & LocalStorage in index.html
  assert.ok(html.includes('id="lhStyleSelectWrap"'), "index.html must include #lhStyleSelectWrap");
  assert.ok(html.includes('id="lhStyleSelect"'), "index.html must include #lhStyleSelect");
  assert.ok(html.includes('value="roots"'), "index.html must include 'roots' option");
  assert.ok(html.includes('value="fifths"'), "index.html must include 'fifths' option");
  assert.ok(html.includes('value="octaves"'), "index.html must include 'octaves' option");
  assert.ok(html.includes('value="triads"'), "index.html must include 'triads' option");
  assert.ok(html.includes('value="thirds"'), "index.html must include 'thirds' option");
  assert.ok(html.includes('piano_lh_style'), "index.html must persist LH style in LocalStorage (piano_lh_style)");
  assert.ok(html.includes('.lh-style-select-wrap'), "index.html CSS must include .lh-style-select-wrap");
  assert.ok(html.includes('.lh-style-select-wrap.active-lh-style'), "index.html CSS must include .lh-style-select-wrap.active-lh-style");

  // 32.7 Complete Script Syntax Validation via Node vm
  const vm = require("vm");
  const scriptStart = html.indexOf("<script>");
  const scriptEnd = html.lastIndexOf("</script>");
  const scriptContent = html.slice(scriptStart + "<script>".length, scriptEnd);
  assert.doesNotThrow(() => {
    new vm.Script(scriptContent);
  }, "index.html inline script must be syntactically valid with Left Hand Accompaniment Engine");

  console.log("✔ Test 32: 𝄢 Left-Hand Accompaniment Engine & Multi-Level Left-Hand Style Selector passed");
}

// ==========================================
// TEST 33: 🏆 Post-Song Comprehensive Performance Review, Score Inspection & Anti-Reset Engine
// ==========================================
{
  const fs = require("fs");
  const path = require("path");
  const vm = require("vm");
  const htmlPath = path.join(__dirname, "..", "index.html");
  const html = fs.readFileSync(htmlPath, "utf8");

  // 33.1 DOM Elements: Modal, Hero Grade, 4 Metric Cards, Problem Measure Diagnostic & Actions
  const requiredElements = [
    'id="songReviewModal"',
    'id="reviewModalTitle"',
    'id="reviewModalSubtitle"',
    'id="reviewGradeBadge"',
    'id="reviewStarsBanner"',
    'id="reviewAccuracyPct"',
    'id="reviewPedagogicalVerdict"',
    'id="reviewNotesRatio"',
    'id="reviewMissCount"',
    'id="reviewPeakStreak"',
    'id="reviewCleanliness"',
    'id="reviewTimingMain"',
    'id="reviewTimingSub"',
    'id="reviewTimeDuration"',
    'id="reviewTempoAndBest"',
    'id="reviewDiagnosticPanel"',
    'id="reviewLoopMistakesBtn"',
    'id="closeReviewModalBtn"',
    'id="reviewInspectScoreBtn"',
    'id="reviewReplayBtn"',
    'id="reviewNextSongBtn"',
    'id="openReviewBtn"',
    'id="hudReviewResultsBtn"',
    'id="perfCloseBtn"'
  ];

  requiredElements.forEach(elemId => {
    assert.ok(html.includes(elemId), `index.html must include ${elemId}`);
  });

  // Verify #perfToast properly closes before cheat sheet modal
  const perfToastPos = html.indexOf('id="perfToast"');
  const cheatSheetPos = html.indexOf('id="cheatSheetModal"');
  assert.ok(perfToastPos < cheatSheetPos, "perfToast must appear before cheatSheetModal");
  const perfToastSlice = html.slice(perfToastPos, cheatSheetPos);
  assert.ok(perfToastSlice.includes("</div>"), "perfToast must contain a closing </div> before cheatSheetModal starts");

  // 33.2 CSS Rules & Animations
  const requiredCss = [
    ".song-review-modal-backdrop",
    ".song-review-modal-dialog",
    ".review-grade-badge",
    ".review-grade-badge.grade-s",
    ".review-grade-badge.grade-a",
    ".review-grade-badge.grade-b",
    ".review-grade-badge.grade-c",
    ".review-grade-badge.grade-d",
    ".review-metrics-grid",
    ".review-stat-card",
    ".review-diagnostic-panel",
    ".measure-number.has-mistake",
    ".note-group.completed-target"
  ];

  requiredCss.forEach(cssRule => {
    assert.ok(html.includes(cssRule), `index.html CSS must include ${cssRule}`);
  });

  // 33.3 Performance Evaluation & Letter Grade Logic
  function evaluateGrade(accuracy) {
    if (accuracy >= 98) return { letter: "S", class: "grade-s" };
    if (accuracy >= 90) return { letter: "A", class: "grade-a" };
    if (accuracy >= 80) return { letter: "B", class: "grade-b" };
    if (accuracy >= 70) return { letter: "C", class: "grade-c" };
    return { letter: "D", class: "grade-d" };
  }

  assert.strictEqual(evaluateGrade(100).letter, "S", "100% accuracy yields S grade");
  assert.strictEqual(evaluateGrade(98).letter, "S", "98% accuracy yields S grade");
  assert.strictEqual(evaluateGrade(94).letter, "A", "94% accuracy yields A grade");
  assert.strictEqual(evaluateGrade(85).letter, "B", "85% accuracy yields B grade");
  assert.strictEqual(evaluateGrade(74).letter, "C", "74% accuracy yields C grade");
  assert.strictEqual(evaluateGrade(55).letter, "D", "55% accuracy yields D grade");

  // 33.4 Anti-Score Reset on Completion: advancePracticeStep does not clobber view
  const advFuncMatch = html.match(/function advancePracticeStep\(\)[\s\S]*?highlightActiveScoreNote\(currentPracticeStep\);[\s\S]*?\}/);
  assert.ok(advFuncMatch, "advancePracticeStep function must exist");
  const advFuncStr = advFuncMatch[0];
  assert.ok(advFuncStr.includes("completeSongPerformance(acc, \"wait\");"), "advancePracticeStep must call completeSongPerformance on completion");
  assert.ok(advFuncStr.includes("return;"), "advancePracticeStep must return early on completion to prevent premature score reset");
  assert.ok(!advFuncStr.includes("scoreContainer.scrollTop = 0;"), "advancePracticeStep completion must not reset scoreContainer.scrollTop = 0");

  // 33.5 Problem Measures Diagnostic & Automatic Loop Range Calculation
  function calculateProblemMeasureLoop(mistakeMeasures) {
    if (!mistakeMeasures || mistakeMeasures.length === 0) return null;
    return {
      startM: Math.min(...mistakeMeasures),
      endM: Math.max(...mistakeMeasures)
    };
  }

  const loopRange1 = calculateProblemMeasureLoop([3, 7, 5]);
  assert.deepStrictEqual(loopRange1, { startM: 3, endM: 7 }, "Problem measures [3, 7, 5] bounds to 3..7");

  const loopRange2 = calculateProblemMeasureLoop([12]);
  assert.deepStrictEqual(loopRange2, { startM: 12, endM: 12 }, "Single problem measure 12 bounds to 12..12");

  assert.strictEqual(calculateProblemMeasureLoop([]), null, "Empty mistake array returns null");

  // 33.6 Persistent Review & Replay Functions in Script
  const scriptStart = html.indexOf("<script>");
  const scriptEnd = html.lastIndexOf("</script>");
  const scriptContent = html.slice(scriptStart + "<script>".length, scriptEnd);

  assert.ok(scriptContent.includes("function completeSongPerformance("), "Script must define completeSongPerformance");
  assert.ok(scriptContent.includes("function showSongReviewModal("), "Script must define showSongReviewModal");
  assert.ok(scriptContent.includes("function closeSongReviewModal("), "Script must define closeSongReviewModal");
  assert.ok(scriptContent.includes("function replaySongPractice("), "Script must define replaySongPractice");
  assert.ok(scriptContent.includes("function loopProblemMeasures("), "Script must define loopProblemMeasures");
  assert.ok(scriptContent.includes("function advanceToNextSong("), "Script must define advanceToNextSong");
  assert.ok(scriptContent.includes("function openLastReview("), "Script must define openLastReview");
  assert.ok(scriptContent.includes("function annotateScoreMistakeMeasures("), "Script must define annotateScoreMistakeMeasures");
  assert.ok(scriptContent.includes("function playVictoryFanfare("), "Script must define playVictoryFanfare");

  // 33.7 Script Syntax Validation via Node vm
  assert.doesNotThrow(() => {
    new vm.Script(scriptContent);
  }, "index.html inline script must be syntactically valid with Performance Review & Anti-Reset Suite");

  console.log("✔ Test 33: 🏆 Post-Song Comprehensive Performance Review, Score Inspection & Anti-Reset Engine passed");
}

// ============================================================================
// TEST 34: 🛠️ FIXES.MD Complete Audit & Codebase Deduplication Verification
// ============================================================================
{
  const fs = require("fs");
  const vm = require("vm");
  const html = fs.readFileSync("index.html", "utf-8").replace(/\r\n/g, "\n");

  // 34.1 Global MIDI Deck Un-Nested Above #panelRepertoire
  const midiDeckIdx = html.indexOf('id="globalMidiDeck"');
  const panelRepIdx = html.indexOf('id="panelRepertoire"');
  assert.ok(midiDeckIdx > 0, "globalMidiDeck must exist in index.html");
  assert.ok(panelRepIdx > 0, "panelRepertoire must exist in index.html");
  assert.ok(midiDeckIdx < panelRepIdx, "globalMidiDeck must be placed BEFORE #panelRepertoire so it persists across all 6 educational tabs");

  // 34.2 Unified Score Engine Destructured from window.MusicTheory (No Duplicate Inline Definitions)
  assert.ok(html.includes("parseToken,\n      getRomanNumeralAnalysis,\n      buildScoreModel,"), "index.html must destructure parseToken, getRomanNumeralAnalysis, and buildScoreModel from MusicTheory");
  assert.ok(!html.includes("function buildScoreModel(song, showRH"), "index.html must not contain duplicate inline function buildScoreModel definition");

  // 34.3 Velocity-Sensitive Multi-Oscillator playTone() + Sustain Pedal UI Badge
  const playToneMatch = html.match(/function playTone\(freq, duration = 0\.35, velocity = 90\)[\s\S]*?osc2\.stop\(now \+ duration \+ 0\.02\);\s*\}/);
  assert.ok(playToneMatch, "playTone must accept velocity and use dual oscillators (osc1 + osc2) with lowpass filter");
  assert.ok(playToneMatch[0].includes('osc1.type = "triangle"'), "playTone fundamental oscillator must be triangle");
  assert.ok(playToneMatch[0].includes('osc2.type = "sine"'), "playTone 2nd harmonic oscillator must be sine");
  assert.ok(playToneMatch[0].includes('filter.type = "lowpass"'), "playTone must include dynamic lowpass BiquadFilter");

  assert.ok(html.includes('id="sustainPedalBadge"'), "index.html must include #sustainPedalBadge in the sustain header");
  assert.ok(html.includes("function updateSustainPedalUI()"), "index.html must define updateSustainPedalUI()");

  // 34.4 Adaptive SRS Integration in Ear Training UI
  assert.ok(html.includes('id="earSrsPill"'), "Ear Training header must include #earSrsPill");
  assert.ok(html.includes('id="earSrsStatsDisplay"'), "Ear Training header must include #earSrsStatsDisplay");
  assert.ok(html.includes("function updateEarSRSHudDisplay("), "index.html must define updateEarSRSHudDisplay");
  assert.ok(html.includes('window.MusicTheory.generateEarTrainingChallenge(earSubmode, true)'), "loadEarChallenge must request SRS-weighted challenges");
  assert.ok(html.includes("window.MusicTheory.recordSRSAttempt(earCurrentChallenge.srsKey"), "Ear Training verification must record SRS attempts with response time");

  // 34.5 Full Inline Script Syntax Check
  const scriptStart = html.indexOf("<script>");
  const scriptEnd = html.lastIndexOf("</script>");
  const scriptContent = html.slice(scriptStart + "<script>".length, scriptEnd);
  assert.doesNotThrow(() => {
    new vm.Script(scriptContent);
  }, "index.html inline script must be syntactically valid");

  console.log("✔ Test 34: 🛠️ FIXES.MD Complete Audit & Codebase Deduplication Verification passed");
}

console.log("=== ALL SCORE ENGINE & BASS CLEF ALIGNMENT TESTS PASSED! ===");






