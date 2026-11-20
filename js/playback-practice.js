// ============================================================================
// WAIT-FOR-ME PRACTICE, AUTO-PLAYBACK TRANSPORT, TEMPO FLOW & METRONOME
// ============================================================================

function parseSongSteps() {
  if (!currentSong) return;
  const showRH = document.getElementById("toggleRH").checked;
  const showLH = document.getElementById("toggleLH").checked;
  const showDyads = document.getElementById("toggleDyads").checked;
  const harmSelect = document.getElementById("harmonyTypeSelect");
  const harmonyType = harmSelect ? harmSelect.value : "song";
  const lhSelect = document.getElementById("lhStyleSelect");
  const lhStyle = lhSelect ? lhSelect.value : "song";

  const model = buildScoreModel(currentSong, showRH, showLH, showDyads, harmonyType, lhStyle);
  songNoteSteps = model.steps;
  currentSongMeasures = model.measures;
  currentPlaybackTimeline = (window.MusicTheory && window.MusicTheory.buildPlaybackTimeline)
    ? window.MusicTheory.buildPlaybackTimeline(songNoteSteps, currentSong.timeSig || "4/4")
    : null;

  // Clamp loop measure bounds to loaded arrangement measure count
  const totalMeasures = Math.max(1, currentPlaybackTimeline ? currentPlaybackTimeline.totalMeasures : currentSongMeasures.length || 1);
  const loopStartEl = document.getElementById("loopStartMeasure");
  const loopEndEl = document.getElementById("loopEndMeasure");
  if (loopStartEl) {
    loopStartEl.max = String(totalMeasures);
    const curStart = parseInt(loopStartEl.value, 10) || 1;
    if (curStart > totalMeasures) loopStartEl.value = String(totalMeasures);
  }
  if (loopEndEl) {
    loopEndEl.max = String(totalMeasures);
    const curEnd = parseInt(loopEndEl.value, 10) || 4;
    if (curEnd > totalMeasures) loopEndEl.value = String(totalMeasures);
  }

  // Reset practice stats and session telemetry for newly loaded piece
  clearWaitPracticeTimer();
  lastPerfectStepIndex = -1;
  practiceStats = { correct: 0, attempts: 0, cleanLoop: true };
  sessionStartTime = 0;
  sessionEndTime = 0;
  sessionCurrentStreak = 0;
  sessionBestStreak = 0;
  sessionMistakeMeasures.clear();
  sessionMistakeNotes = [];
  sessionRhythmCounts = { flawless: 0, shortTap: 0, other: 0 };
  isSongFinished = false;
  document.querySelectorAll(".measure-number").forEach(el => el.classList.remove("has-mistake"));
  document.querySelectorAll(".note-group").forEach(el => el.classList.remove("completed-target"));

  // Check if past performance exists to show review button
  try {
    const past = localStorage.getItem(`piano_mastery_${currentSong ? currentSong.id : 'piece'}`);
    const showBtn = !!past;
    const openRev = document.getElementById("openReviewBtn");
    if (openRev) openRev.style.display = showBtn ? "inline-flex" : "none";
    const hudRev = document.getElementById("hudReviewResultsBtn");
    if (hudRev) hudRev.style.display = showBtn ? "inline-flex" : "none";
  } catch (e) {}
}

function clearWaitPracticeTimer() {
  if (typeof waitPracticeStepTimerId !== "undefined" && waitPracticeStepTimerId !== null) {
    clearTimeout(waitPracticeStepTimerId);
    waitPracticeStepTimerId = null;
  }
}

function getVoiceBeatsForPitch(step, pitchStr) {
  if (!step) return 1.0;
  const matches = (a, b) => a === b || (window.MusicTheory && window.MusicTheory.areEnharmonicEquivalent(a, b));
  const voiceCandidates = [step.dyad, step.rh, step.lh];
  for (const v of voiceCandidates) {
    if (v && v.pitch && v.pitch !== "-") {
      const parts = v.pitch.split("+").filter(p => p && p !== "-");
      if (parts.some(p => matches(p, pitchStr))) {
        return v.tiedTotalBeats || v.beats || step.beats || 1.0;
      }
    }
  }
  return step.beats || 1.0;
}

function updateTargetBadgeDisplay(step, fulfilledSet) {
  const targetBadge = document.getElementById("hudTargetBadge");
  if (!targetBadge || !step) return;

  if (!step.expectedPitches || step.expectedPitches.length === 0) {
    const beatVal = step.beats || 1;
    targetBadge.innerHTML = `<span style="color:#f59e0b; font-size:1.02rem; font-weight:800; text-shadow:0 0 8px rgba(245,158,11,0.5);">𝄽 REST (${beatVal}b)</span>`;
    return;
  }

  const tiedList = Array.isArray(step.tiedPitches) ? step.tiedPitches : [];
  const partsHtml = step.expectedPitches.map(p => {
    const isDone = fulfilledSet && fulfilledSet.has(p);
    const label = p.replace(/#/g, "♯");
    if (isDone) {
      const prefix = tiedList.includes(p) ? "🔗 " : "";
      return `<span style="color:#34d399; font-weight:900; text-shadow:0 0 8px rgba(52,211,153,0.5);">${prefix}${label}✓</span>`;
    }
    if (typeof isPitchActivelyHeld === "function" && isPitchActivelyHeld(p)) {
      return `<span style="color:#fbbf24; font-weight:900;" title="Release key and re-press for this note">🔁 ${label}</span>`;
    }
    return `<span style="color:#f59e0b; font-weight:900;">${label}</span>`;
  });
  targetBadge.innerHTML = partsHtml.join("<span style='color:#94a3b8; font-weight:700; margin:0 4px;'>+</span>");
}

function handleNoteDown(pitchName, source = "input", meta = {}) {
  const now = performance.now();
  const midiNum = (typeof getCanonicalMidiNumber === "function")
    ? getCanonicalMidiNumber(meta.noteNumber !== undefined ? meta.noteNumber : pitchName)
    : getPitchMidiNumber(pitchName);
  if (midiNum === null || midiNum === undefined) return;

  const existing = activeHeldKeyAttacks.get(midiNum);
  const isCurrentlyHeld = Boolean(existing && existing.isDown);
  const lastReleaseMs = (typeof lastNoteUpPerfMs !== "undefined") ? (lastNoteUpPerfMs.get(midiNum) || 0) : 0;
  const debounceMs = (source === "midi" || source === "mouse") ? 30 : 0;

  if (isCurrentlyHeld && source === "midi" && meta.channel && existing.heldChannels) {
    existing.heldChannels.add(meta.channel);
  }

  const gate = (window.MusicTheory && window.MusicTheory.evaluateRepeatedNoteAttackGate)
    ? window.MusicTheory.evaluateRepeatedNoteAttackGate({
        isCurrentlyHeld,
        nowMs: now,
        lastReleaseMs,
        debounceMs
      })
    : { allowed: !isCurrentlyHeld };

  if (!gate.allowed) {
    return;
  }

  const noteAttack = {
    pitch: pitchName,
    noteNumber: midiNum,
    downTime: now,
    attackId: ++attackCounter,
    isDown: true,
    consumedStepIndex: null,
    expectedVoiceBeats: null,
    source: source,
    heldChannels: new Set(meta.channel ? [meta.channel] : []),
    ...meta
  };
  activeHeldKeyAttacks.set(midiNum, noteAttack);
  updateActiveChordRecognizer();

  // Connect interactive playing to Live Sustain stage
  if (midiNum && source !== "direct") {
    createSustainLane(midiNum, pitchName);
  }

  if (activeEducationalMode === "repertoire") {
    if (typeof isTempoFlowActive !== "undefined" && isTempoFlowActive) {
      verifyTempoFlowInput(pitchName, noteAttack);
    } else {
      checkAndPlayNoteOn(pitchName, noteAttack);
    }
  } else {
    handleEducationalNoteInput(pitchName);
  }
}

function handleNoteUp(pitchName, meta = {}) {
  const now = performance.now();
  const midiNum = (typeof getCanonicalMidiNumber === "function")
    ? getCanonicalMidiNumber(meta.noteNumber !== undefined ? meta.noteNumber : pitchName)
    : getPitchMidiNumber(pitchName);
  if (midiNum === null || midiNum === undefined) return;

  const noteAttack = activeHeldKeyAttacks.get(midiNum);
  if (noteAttack && meta.channel && noteAttack.heldChannels && noteAttack.heldChannels.size > 1) {
    noteAttack.heldChannels.delete(meta.channel);
    if (noteAttack.heldChannels.size > 0) return;
  }

  removeSustainLane(midiNum);
  if (typeof lastNoteUpPerfMs !== "undefined") {
    lastNoteUpPerfMs.set(midiNum, now);
  }

  if (noteAttack) {
    noteAttack.isDown = false;
    const durationMs = now - noteAttack.downTime;
    const bpm = (typeof getCurrentTempoBpm === "function")
      ? getCurrentTempoBpm()
      : (parseInt(document.getElementById("tempoSlider")?.value, 10) || 100);
    const heldBeats = (durationMs / 1000) * (bpm / 60);

    activeHeldKeyAttacks.delete(midiNum);

    if (activeEducationalMode === "repertoire" && isWaitPracticeMode) {
      handleTiedReleaseCheck(midiNum);
      checkAndPlayNoteOff(pitchName, heldBeats, durationMs, noteAttack);
    }
    if (typeof updateKeyboardTargetHighlights === "function" && typeof songNoteSteps !== "undefined") {
      updateKeyboardTargetHighlights(songNoteSteps[currentPracticeStep], stepFulfilledPitches);
    }
    if (typeof songNoteSteps !== "undefined" && songNoteSteps[currentPracticeStep]) {
      updateTargetBadgeDisplay(songNoteSteps[currentPracticeStep], stepFulfilledPitches);
    }
    updateActiveChordRecognizer();
  }
}

function handleTiedReleaseCheck(releasedMidiNum = null) {
  if (activeEducationalMode !== "repertoire" || !isWaitPracticeMode || isSongFinished) return;
  const step = songNoteSteps[currentPracticeStep];
  if (!step || !Array.isArray(step.tiedPitches) || step.tiedPitches.length === 0) return;

  let anyReleasedEarly = false;
  let releasedLabel = "";
  step.tiedPitches.forEach(p => {
    if (stepFulfilledPitches.has(p) && !isPitchActivelySustained(p)) {
      stepFulfilledPitches.delete(p);
      anyReleasedEarly = true;
      releasedLabel = p;
    }
  });

  if (anyReleasedEarly) {
    clearWaitPracticeTimer();
    updateTargetBadgeDisplay(step, stepFulfilledPitches);
    if (typeof updateKeyboardTargetHighlights === "function") {
      updateKeyboardTargetHighlights(step, stepFulfilledPitches);
    }
    const feedbackText = document.getElementById("hudFeedbackText");
    if (feedbackText) {
      feedbackText.style.color = "#f59e0b";
      feedbackText.textContent = `🔗 Released tie early — press ${releasedLabel || step.tiedPitches.join(" + ")} to continue`;
      delete feedbackText.dataset.baseText;
    }
  }
}

function checkAndPlayNote(playedPitch) {
  handleNoteDown(playedPitch, "direct");
  handleNoteUp(playedPitch);
}

function checkAndPlayNoteOn(playedPitch, noteAttack = null) {
  const isFromMidi = noteAttack && noteAttack.source === "midi";
  if (noteAttack && noteAttack.consumedStepIndex !== null) return;

  if (!isWaitPracticeMode || isSongFinished) {
    playSingleNoteAudit(playedPitch, "rh", !isFromMidi);
    return;
  }

  const currentStep = songNoteSteps[currentPracticeStep];
  if (!currentStep) return;

  // Start session timer on initial strike
  if (!sessionStartTime) {
    sessionStartTime = performance.now();
  }

  // Handle Rest Step Transition
  if (!currentStep.expectedPitches || currentStep.expectedPitches.length === 0) {
    const nextStep = songNoteSteps[currentPracticeStep + 1];
    if (nextStep && nextStep.expectedPitches && nextStep.expectedPitches.length > 0) {
      const matchesNext = nextStep.expectedPitches.some(p =>
        p === playedPitch || (window.MusicTheory && window.MusicTheory.areEnharmonicEquivalent(p, playedPitch))
      );
      if (matchesNext) {
        clearWaitPracticeTimer();
        isPracticeSessionStarted = true;
        advancePracticeStep();
        checkAndPlayNoteOn(playedPitch, noteAttack);
        return;
      }
    }
    return;
  }

  isPracticeSessionStarted = true;
  const expected = currentStep.expectedPitches;
  const targetBadge = document.getElementById("hudTargetBadge");
  const feedbackText = document.getElementById("hudFeedbackText");

  // Guard pre-rest / tie hold timer if current step is already completely fulfilled
  if (waitPracticeStepTimerId !== null && stepFulfilledPitches.size >= expected.length) {
    const matchesCurrentTied = currentStep.tiedFromPrev && Array.isArray(currentStep.tiedPitches) && currentStep.tiedPitches.some(p =>
      p === playedPitch || (window.MusicTheory && window.MusicTheory.areEnharmonicEquivalent(p, playedPitch))
    );
    if (matchesCurrentTied) {
      clearWaitPracticeTimer();
      if (noteAttack) noteAttack.consumedStepIndex = currentPracticeStep;
      playSingleNoteAudit(playedPitch, "rh", !isFromMidi);
      advancePracticeStep();
      return;
    }
    const nextStep = songNoteSteps[currentPracticeStep + 1];
    const stepAfterRest = songNoteSteps[currentPracticeStep + 2];
    const nextIsRest = nextStep && (!nextStep.expectedPitches || nextStep.expectedPitches.length === 0);
    if (nextIsRest && stepAfterRest && stepAfterRest.expectedPitches && stepAfterRest.expectedPitches.some(p =>
      p === playedPitch || (window.MusicTheory && window.MusicTheory.areEnharmonicEquivalent(p, playedPitch))
    )) {
      clearWaitPracticeTimer();
      stepFulfilledPitches.clear();
      currentPracticeStep = currentPracticeStep + 2;
      highlightActiveScoreNote(currentPracticeStep);
      checkAndPlayNoteOn(playedPitch, noteAttack);
      return;
    }
    return;
  }

  // Verify if this strike matches an unfulfilled expected note of the current step
  const matchedPitch = expected.find(p => {
    if (stepFulfilledPitches.has(p)) return false;
    return (p === playedPitch || (window.MusicTheory && window.MusicTheory.areEnharmonicEquivalent(p, playedPitch)));
  });

  practiceStats.attempts++;

  if (matchedPitch) {
    stepFulfilledPitches.add(matchedPitch);
    if (noteAttack) {
      noteAttack.consumedStepIndex = currentPracticeStep;
      noteAttack.expectedVoiceBeats = getVoiceBeatsForPitch(currentStep, matchedPitch);
    }

    practiceStats.correct++;
    sessionCurrentStreak++;
    if (sessionCurrentStreak > sessionBestStreak) {
      sessionBestStreak = sessionCurrentStreak;
    }

    playSingleNoteAudit(playedPitch, "rh", !isFromMidi);
    targetBadge.classList.remove("error-flash");

    const remaining = expected.filter(p => !stepFulfilledPitches.has(p));

    if (remaining.length > 0) {
      feedbackText.style.color = "#38bdf8";
      feedbackText.textContent = `🎵 ${playedPitch} locked (${stepFulfilledPitches.size}/${expected.length}) — now play ${remaining.join(" + ")}!`;
      delete feedbackText.dataset.baseText;
      updateTargetBadgeDisplay(currentStep, stepFulfilledPitches);
      if (typeof updateKeyboardTargetHighlights === "function") {
        updateKeyboardTargetHighlights(currentStep, stepFulfilledPitches);
      }
      return;
    }

    // ALL notes of this step are fulfilled!
    lastPerfectStepIndex = currentPracticeStep;
    const baseOkMsg = `✅ Perfect! ${expected.join(" + ")}`;
    feedbackText.style.color = "#34d399";
    feedbackText.dataset.baseText = baseOkMsg;
    feedbackText.textContent = baseOkMsg;

    // If the next step is a rest, hold the current note visually fulfilled for its live tempo duration
    const nextStep = songNoteSteps[currentPracticeStep + 1];
    const isNextStepRest = nextStep && (!nextStep.expectedPitches || nextStep.expectedPitches.length === 0);

    if (isNextStepRest) {
      const tempo = getCurrentTempoBpm();
      const noteDurationMs = Math.max(250, (currentStep.beats || 1) * (60000 / tempo));
      if (currentStep.beats && currentStep.beats > 1) {
        const holdMsg = `${baseOkMsg} • hold ${currentStep.beats}b`;
        feedbackText.dataset.baseText = holdMsg;
        feedbackText.textContent = holdMsg;
      }
      clearWaitPracticeTimer();
      const stepHolding = currentPracticeStep;
      waitPracticeStepTimerId = setTimeout(() => {
        waitPracticeStepTimerId = null;
        if (currentPracticeStep === stepHolding && isWaitPracticeMode && !isSongFinished) {
          advancePracticeStep();
        }
      }, noteDurationMs);
      return;
    }

    advancePracticeStep();
  } else {
    const remaining = expected.filter(p => !stepFulfilledPitches.has(p));
    const matchesAlreadyFulfilled = expected.some(p =>
      stepFulfilledPitches.has(p) &&
      (p === playedPitch || (window.MusicTheory && window.MusicTheory.areEnharmonicEquivalent(p, playedPitch)))
    );
    if (matchesAlreadyFulfilled && remaining.length > 0) {
      feedbackText.style.color = "#fbbf24";
      feedbackText.textContent = `⚠️ Already locked ${playedPitch} — still waiting for ${remaining.join(" + ")}!`;
      delete feedbackText.dataset.baseText;
      return;
    }

    // Genuine wrong note
    lastPerfectStepIndex = -1;
    practiceStats.cleanLoop = false;
    sessionCurrentStreak = 0;
    sessionMistakeMeasures.add(currentStep.measure);
    sessionMistakeNotes.push({
      measure: currentStep.measure,
      stepIndex: currentPracticeStep,
      played: playedPitch,
      expected: expected
    });

    if (!isFromMidi && isSynthAudioEnabled()) {
      playTone(getNoteFreq(playedPitch), 0.2);
    }
    targetBadge.classList.remove("error-flash");
    void targetBadge.offsetWidth;
    targetBadge.classList.add("error-flash");

    const targetEl = document.getElementById(`staff_note_${currentPracticeStep}`);
    if (targetEl) targetEl.classList.add("error-target");

    feedbackText.style.color = "#f87171";
    delete feedbackText.dataset.baseText;
    feedbackText.textContent = `❌ You played ${playedPitch} — try ${remaining.join(" + ")}!`;
  }
}

function checkAndPlayNoteOff(pitchName, heldBeats, durationMs, noteAttack = null) {
  if (!isWaitPracticeMode || !noteAttack || noteAttack.consumedStepIndex === null) return;
  const step = songNoteSteps[noteAttack.consumedStepIndex];
  const targetBeats = noteAttack.expectedVoiceBeats || (step ? (step.beats || 1.0) : 1.0);
  const bpm = getCurrentTempoBpm();
  const evalRes = (window.MusicTheory && window.MusicTheory.evaluateNoteHoldDuration)
    ? window.MusicTheory.evaluateNoteHoldDuration(durationMs, bpm, targetBeats)
    : { heldBeats, targetBeats, category: "good", label: "Good duration!" };

  if (evalRes.category === "staccato") sessionRhythmCounts.shortTap++;
  else if (evalRes.category === "flawless") sessionRhythmCounts.flawless++;
  else sessionRhythmCounts.other++;

  const feedbackText = document.getElementById("hudFeedbackText");
  if (feedbackText && noteAttack.consumedStepIndex === lastPerfectStepIndex && feedbackText.dataset.baseText) {
    feedbackText.textContent = `${feedbackText.dataset.baseText} • Held ${evalRes.heldBeats.toFixed(2)}b / ${evalRes.targetBeats}b (${evalRes.label})`;
  }
}

function advancePracticeStep() {
  clearWaitPracticeTimer();
  stepFulfilledPitches.clear();
  const isLoop = document.getElementById("toggleLoopSection")?.checked;
  const startM = parseInt(document.getElementById("loopStartMeasure")?.value, 10) || 1;
  const endM = parseInt(document.getElementById("loopEndMeasure")?.value, 10) || 999;

  let nextStepIdx = currentPracticeStep + 1;

  if (isLoop) {
    const nextStep = songNoteSteps[nextStepIdx];
    if (!nextStep || nextStep.measure > endM) {
      const loopStartStep = songNoteSteps.find(s => s.measure >= startM) || songNoteSteps[0];
      nextStepIdx = loopStartStep.index;

      if (practiceStats.cleanLoop && document.getElementById("toggleTempoRamp")?.checked) {
        const newTempo = Math.min(200, getCurrentTempoBpm() + 5);
        applyLiveTempoChange(newTempo);
        document.getElementById("hudFeedbackText").textContent = `⚡ Flawless loop! Tempo accelerated to ${newTempo} BPM!`;
      } else {
        document.getElementById("hudFeedbackText").textContent = `🔁 Looping measures ${startM}–${endM}...`;
      }
      practiceStats.cleanLoop = true;
    }
  } else {
    if (nextStepIdx >= songNoteSteps.length) {
      const acc = Math.round((practiceStats.correct / Math.max(1, practiceStats.attempts)) * 100);
      showPerformanceToast(acc, currentSong ? currentSong.title : "Piece");
      completeSongPerformance(acc, "wait");
      return;
    }
  }

  currentPracticeStep = nextStepIdx;
  highlightActiveScoreNote(currentPracticeStep);
}

// ============================================================================
// UPGRADED STEP-CHAINED PLAYBACK TRANSPORT (PAUSE/RESUME, SEEK, A-B LOOP, RAMP)
// ============================================================================

function getCurrentTempoBpm() {
  const raw = parseInt(document.getElementById("tempoSlider")?.value, 10);
  const base = (!isNaN(raw) && raw > 0) ? raw : ((currentSong && currentSong.tempo) ? currentSong.tempo : 96);
  return Math.max(30, Math.min(220, base));
}

function getActiveLoopBounds() {
  const isLoop = !!document.getElementById("toggleLoopSection")?.checked;
  const startM = document.getElementById("loopStartMeasure")?.value;
  const endM = document.getElementById("loopEndMeasure")?.value;
  if (window.MusicTheory && window.MusicTheory.resolveLoopStepBounds) {
    return window.MusicTheory.resolveLoopStepBounds(songNoteSteps, isLoop, startM, endM);
  }
  return {
    active: false,
    startStepIndex: 0,
    endStepIndex: Math.max(0, songNoteSteps.length - 1),
    startMeasure: 1,
    endMeasure: 1,
    totalMeasures: 1
  };
}

function clearTransportTimersAndVoices() {
  if (transportState.stepTimerId) {
    clearTimeout(transportState.stepTimerId);
    transportState.stepTimerId = null;
  }
  transportState.countInTimers.forEach(t => clearTimeout(t));
  transportState.countInTimers = [];
  transportState.voiceOffTimeouts.forEach(t => clearTimeout(t));
  transportState.voiceOffTimeouts.clear();
  playbackTimeouts.forEach(t => clearTimeout(t));
  playbackTimeouts = [];
  if (transportState.rafId) {
    cancelAnimationFrame(transportState.rafId);
    transportState.rafId = null;
  }
  document.querySelectorAll(".piano-key").forEach(k => k.classList.remove("active-rh", "active-lh", "active-dyad"));
  if (typeof stopAllPreviewVoices === "function") {
    stopAllPreviewVoices();
  }
  if (typeof sendMidiAllNotesOff === "function") {
    sendMidiAllNotesOff();
  }
  transportState.activeVoiceNotes.clear();
  setChordPillDisplay([]);
}

function updatePlaybackChordPill() {
  const combinedNotes = [];
  const seenMidi = new Set();
  for (const notes of transportState.activeVoiceNotes.values()) {
    for (const n of notes) {
      if (!seenMidi.has(n.num)) {
        seenMidi.add(n.num);
        combinedNotes.push(n);
      }
    }
  }
  setChordPillDisplay(combinedNotes);
}

function triggerTransportVoicePlayback(voiceKey, voiceData, defaultOct, bpm) {
  if (!voiceData || !voiceData.pitch || voiceData.pitch === "-") return;

  // Seamless tie continuation: keep already ringing note & highlight without re-striking
  if (voiceData.isTiedContinuation && transportState.activeVoiceNotes.has(voiceKey)) {
    const curNotes = transportState.activeVoiceNotes.get(voiceKey) || [];
    const nextMidis = voiceData.pitch.split("+").filter(p => p && p !== "-").map(p => getCanonicalMidiNumber(p));
    const curMidis = curNotes.map(n => n.num);
    const allMatch = nextMidis.length > 0 && nextMidis.length === curMidis.length && nextMidis.every(m => curMidis.includes(m));
    if (allMatch) return;
  }

  const beatMs = (60 / bpm) * 1000;
  const playBeats = voiceData.tied ? (voiceData.tiedTotalBeats || voiceData.beats || 1.0) : (voiceData.beats || 1.0);
  const voiceDurationMs = playBeats * beatMs;
  const voiceSoundDuration = (playBeats * (60 / bpm)) * 0.95;
  const activeClass = voiceKey === "dyad" ? "active-dyad" : (voiceKey === "lh" ? "active-lh" : "active-rh");

  document.querySelectorAll(`.piano-key.${activeClass}`).forEach(k => k.classList.remove(activeClass));
  if (transportState.voiceOffTimeouts.has(voiceKey)) {
    clearTimeout(transportState.voiceOffTimeouts.get(voiceKey));
    transportState.voiceOffTimeouts.delete(voiceKey);
  }

  const parts = voiceData.pitch.split("+").filter(p => p !== "-");
  const voiceNotes = [];
  const affectedKeyEls = [];

  parts.forEach(p => {
    let clean = p.trim();
    if (!clean.match(/[1-7]/)) {
      clean += defaultOct;
    }
    playTone(getNoteFreq(clean), voiceSoundDuration, 85, voiceKey);
    const num = getPitchMidiNumber(clean, defaultOct);
    if (num !== null) {
      voiceNotes.push({ num, pitch: clean });
    }
    const keyEl = findPianoKeyElement(clean, defaultOct);
    if (keyEl) {
      keyEl.classList.add(activeClass);
      affectedKeyEls.push(keyEl);
    }
  });

  transportState.activeVoiceNotes.set(voiceKey, voiceNotes);
  updatePlaybackChordPill();

  const offTimer = setTimeout(() => {
    affectedKeyEls.forEach(k => k.classList.remove(activeClass));
    if (transportState.activeVoiceNotes.get(voiceKey) === voiceNotes) {
      transportState.activeVoiceNotes.delete(voiceKey);
      updatePlaybackChordPill();
    }
    transportState.voiceOffTimeouts.delete(voiceKey);
  }, voiceDurationMs);

  transportState.voiceOffTimeouts.set(voiceKey, offTimer);
  playbackTimeouts.push(offTimer);
}

function clearTransportVoicePlayback(voiceKey) {
  const activeClass = voiceKey === "dyad" ? "active-dyad" : (voiceKey === "lh" ? "active-lh" : "active-rh");
  document.querySelectorAll(`.piano-key.${activeClass}`).forEach(k => k.classList.remove(activeClass));
  if (transportState.voiceOffTimeouts.has(voiceKey)) {
    clearTimeout(transportState.voiceOffTimeouts.get(voiceKey));
    transportState.voiceOffTimeouts.delete(voiceKey);
  }
  if (transportState.activeVoiceNotes.has(voiceKey)) {
    transportState.activeVoiceNotes.delete(voiceKey);
    updatePlaybackChordPill();
  }
}

function auditionStepNotes(step) {
  if (!step || !step.expectedPitches || step.expectedPitches.length === 0) {
    setChordPillDisplay([]);
    return;
  }
  step.expectedPitches.forEach(p => playSingleNoteAudit(p));
  const auditNotes = step.expectedPitches.map(pitchStr => ({
    pitch: pitchStr,
    num: getPitchMidiNumber(pitchStr) ?? 60
  }));
  setChordPillDisplay(auditNotes);
}

function updateTransportUI(liveBeatOverride = null) {
  const status = transportState.status;
  const playBtn = document.getElementById("mainPlayBtn");
  const pauseBtn = document.getElementById("transportPauseBtn");
  const stopBtn = document.getElementById("transportStopBtn");
  const scrubber = document.getElementById("transportScrubber");
  const loopOverlay = document.getElementById("transportLoopOverlay");
  const measureBadge = document.getElementById("transportMeasureBadge");
  const timeDisplay = document.getElementById("transportTimeDisplay");
  const statusPill = document.getElementById("transportStatusPill");

  if (playBtn) {
    if (status === "playing") {
      playBtn.classList.add("playing");
      playBtn.textContent = "⏸ Pause Preview";
    } else if (status === "counting_in") {
      playBtn.classList.add("playing");
      playBtn.textContent = "■ Stop Count-In";
    } else if (status === "paused") {
      playBtn.classList.remove("playing");
      playBtn.textContent = "▶ Resume Preview";
    } else {
      playBtn.classList.remove("playing");
      playBtn.textContent = "▶ Auto Play Preview";
    }
  }

  if (pauseBtn) {
    pauseBtn.disabled = (status === "stopped");
    pauseBtn.textContent = (status === "paused") ? "▶ Resume" : "⏸ Pause";
  }

  if (stopBtn) {
    stopBtn.disabled = (status === "stopped" && transportState.currentStepIndex === 0 && !isTempoFlowActive);
  }

  const timeline = currentPlaybackTimeline || (window.MusicTheory && window.MusicTheory.buildPlaybackTimeline
    ? window.MusicTheory.buildPlaybackTimeline(songNoteSteps, currentSong?.timeSig || "4/4")
    : null);
  const totalBeats = timeline ? timeline.totalBeats : 0;
  const curIdx = Math.max(0, Math.min(Math.max(0, songNoteSteps.length - 1), transportState.currentStepIndex || 0));
  const curTiming = timeline && timeline.stepTimings ? timeline.stepTimings[curIdx] : null;
  const curBeat = (typeof liveBeatOverride === "number" && !isNaN(liveBeatOverride))
    ? Math.max(0, Math.min(totalBeats, liveBeatOverride))
    : (curTiming ? curTiming.startBeat : 0);

  if (scrubber) {
    scrubber.value = totalBeats > 0 ? String(Math.round((curBeat / totalBeats) * 1000)) : "0";
  }

  const loop = getActiveLoopBounds();
  if (loopOverlay) {
    if (loop.active && totalBeats > 0 && timeline && timeline.stepTimings.length > 0) {
      const startTiming = timeline.stepTimings[loop.startStepIndex];
      const endTiming = timeline.stepTimings[loop.endStepIndex];
      if (startTiming && endTiming) {
        const leftPct = (startTiming.startBeat / totalBeats) * 100;
        const widthPct = Math.max(1.5, ((endTiming.endBeat - startTiming.startBeat) / totalBeats) * 100);
        loopOverlay.style.left = `${leftPct.toFixed(2)}%`;
        loopOverlay.style.width = `${Math.min(100 - leftPct, widthPct).toFixed(2)}%`;
        loopOverlay.style.display = "block";
      } else {
        loopOverlay.style.display = "none";
      }
    } else {
      loopOverlay.style.display = "none";
    }
  }

  if (measureBadge) {
    const stepObj = songNoteSteps[curIdx];
    const curM = stepObj ? (stepObj.measure || 1) : 1;
    const totM = timeline ? Math.max(1, timeline.totalMeasures) : 1;
    measureBadge.textContent = `M ${curM} / ${totM} • Step ${curIdx + 1}`;
  }

  if (timeDisplay) {
    const bpm = getCurrentTempoBpm();
    if (window.MusicTheory && window.MusicTheory.formatPlaybackClock) {
      timeDisplay.textContent = window.MusicTheory.formatPlaybackClock(curBeat, totalBeats, bpm).formatted;
    }
  }

  if (statusPill) {
    statusPill.classList.remove("is-playing", "is-paused", "is-counting", "is-looping");
    let label = "READY";
    if (isTempoFlowActive) {
      statusPill.classList.add("is-playing");
      label = "FLOW";
    } else if (status === "playing") {
      statusPill.classList.add("is-playing");
      label = "PLAYING";
    } else if (status === "paused") {
      statusPill.classList.add("is-paused");
      label = "PAUSED";
    } else if (status === "counting_in") {
      statusPill.classList.add("is-counting");
      label = "COUNT-IN";
    }
    if (loop.active) {
      statusPill.classList.add("is-looping");
      label += " • LOOP";
    }
    statusPill.textContent = label;
  }
}

function startTransportScrubberLoop() {
  if (transportState.rafId) {
    cancelAnimationFrame(transportState.rafId);
    transportState.rafId = null;
  }
  const tick = () => {
    if (transportState.status !== "playing") {
      transportState.rafId = null;
      return;
    }
    const timeline = currentPlaybackTimeline;
    const stepTiming = timeline && timeline.stepTimings ? timeline.stepTimings[transportState.currentStepIndex] : null;
    if (stepTiming) {
      const bpm = getCurrentTempoBpm();
      const elapsedBeats = ((performance.now() - transportState.stepStartPerfMs) / 1000) * (bpm / 60);
      const clampedBeat = stepTiming.startBeat + Math.min(stepTiming.beats, Math.max(0, elapsedBeats));
      updateTransportUI(clampedBeat);
    }
    transportState.rafId = requestAnimationFrame(tick);
  };
  transportState.rafId = requestAnimationFrame(tick);
}

function runPlaybackCountIn(bars, onComplete, isActiveCheck, timersArr) {
  const numBars = Math.max(0, parseInt(bars, 10) || 0);
  if (numBars <= 0) {
    onComplete();
    return;
  }
  const bpm = getCurrentTempoBpm();
  const timeSigStr = (currentSong && currentSong.timeSig) ? currentSong.timeSig : "4/4";
  const countInInfo = (window.MusicTheory && window.MusicTheory.getTimeSignatureCountIn)
    ? window.MusicTheory.getTimeSignatureCountIn(timeSigStr, bpm)
    : {
        countBeats: [
          { num: 4, freq: 880, label: "4" },
          { num: 3, freq: 440, label: "3" },
          { num: 2, freq: 440, label: "2" },
          { num: 1, freq: 440, label: "1" },
          { num: 0, freq: 1046.5, label: "GO! 🔥" }
        ],
        beatMs: (60 / bpm) * 1000
      };

  const singleBarBeats = countInInfo.countBeats.filter(b => b.num > 0);
  const goBeat = countInInfo.countBeats.find(b => b.num === 0) || { num: 0, freq: 1046.5, label: "GO! 🔥" };
  const sequence = [];
  for (let bar = 0; bar < numBars; bar++) {
    singleBarBeats.forEach(b => sequence.push({ ...b, barNum: bar + 1 }));
  }
  sequence.push({ ...goBeat, barNum: numBars });

  const targetBadge = document.getElementById("hudTargetBadge");
  const feedbackText = document.getElementById("hudFeedbackText");
  const beatMs = countInInfo.beatMs;

  sequence.forEach((b, idx) => {
    const t = setTimeout(() => {
      if (!isActiveCheck()) return;
      initAudio();
      if (audioCtx && typeof triggerMetronomeClickAudio === "function") {
        const isFirst = (b.num === singleBarBeats[0]?.num || b.num === 0);
        triggerMetronomeClickAudio(
          audioCtx.currentTime,
          { accentType: isFirst ? "downbeat" : "beat", isDownbeat: isFirst, freq: b.freq, volume: isFirst ? 0.95 : 0.65 },
          0.35,
          0.08
        );
      } else {
        playTone(b.freq, 0.12);
      }
      if (targetBadge) targetBadge.textContent = b.num > 0 ? `${b.num}` : "GO!";
      if (feedbackText) {
        feedbackText.style.color = b.num === 0 ? "#10b981" : "#f59e0b";
        const barPrefix = numBars > 1 && b.num > 0 ? `Bar ${b.barNum}/${numBars} • ` : "";
        feedbackText.textContent = `🥁 ${barPrefix}Count-in: ${b.label}...`;
      }
      if (idx === sequence.length - 1) {
        onComplete();
      }
    }, idx * beatMs);
    timersArr.push(t);
  });
}

function schedulePlaybackStep(stepIndex) {
  if (transportState.status !== "playing") return;
  if (!songNoteSteps || stepIndex < 0 || stepIndex >= songNoteSteps.length) {
    stopPlayback(true);
    return;
  }

  const step = songNoteSteps[stepIndex];
  const bpm = getCurrentTempoBpm();
  const beatMs = (60 / bpm) * 1000;
  const stepBeats = step.beats || 1.0;
  const stepDurationMs = stepBeats * beatMs;

  const showRH = !!document.getElementById("toggleRH")?.checked;
  const showLH = !!document.getElementById("toggleLH")?.checked;
  const showDyads = !!document.getElementById("toggleDyads")?.checked;

  const nowPerf = performance.now();
  const expectedNow = (typeof transportState.nextStepTargetPerfMs === "number" && transportState.nextStepTargetPerfMs > 0)
    ? transportState.nextStepTargetPerfMs
    : nowPerf;
  const stepAnchorPerfMs = (Math.abs(nowPerf - expectedNow) > 300) ? nowPerf : expectedNow;

  transportState.currentStepIndex = stepIndex;
  transportState.stepStartPerfMs = stepAnchorPerfMs;
  transportState.currentStepBeats = stepBeats;
  transportState.lastStepBpm = bpm;
  transportState.nextStepTargetPerfMs = stepAnchorPerfMs + stepDurationMs;
  const waitDelayMs = Math.max(4, transportState.nextStepTargetPerfMs - performance.now());
  currentPracticeStep = stepIndex;

  document.querySelectorAll(".note-group").forEach(g => g.classList.remove("active-target"));
  const targetEl = document.getElementById(`staff_note_${step.stepIndex}`);
  if (targetEl) {
    targetEl.classList.add("active-target");
    autoScrollScoreToNote(targetEl, true);
  }

  updateTargetBadgeDisplay(step, null);
  const progressText = document.getElementById("hudProgressText");
  if (progressText) {
    progressText.textContent = `Note: ${stepIndex + 1} / ${songNoteSteps.length} (Meas ${step.measure})`;
  }

  let maxVoiceMs = stepDurationMs;
  if (showDyads) {
    if (step.dyad && step.dyad.pitch && step.dyad.pitch !== "-") {
      triggerTransportVoicePlayback("dyad", step.dyad, 4, bpm);
      maxVoiceMs = Math.max(maxVoiceMs, (step.dyad.beats || stepBeats) * beatMs);
    } else if (step.dyad && step.dyad.pitch === "-") {
      clearTransportVoicePlayback("dyad");
    }
  } else if (showRH) {
    if (step.rh && step.rh.pitch && step.rh.pitch !== "-") {
      triggerTransportVoicePlayback("rh", step.rh, 4, bpm);
      maxVoiceMs = Math.max(maxVoiceMs, (step.rh.beats || stepBeats) * beatMs);
    } else if (step.rh && step.rh.pitch === "-") {
      clearTransportVoicePlayback("rh");
    }
  }

  if (showLH) {
    if (step.lh && step.lh.pitch && step.lh.pitch !== "-") {
      triggerTransportVoicePlayback("lh", step.lh, 2, bpm);
      maxVoiceMs = Math.max(maxVoiceMs, (step.lh.beats || stepBeats) * beatMs);
    } else if (step.lh && step.lh.pitch === "-") {
      clearTransportVoicePlayback("lh");
    }
  }

  updateTransportUI();

  if (transportState.stepTimerId) {
    clearTimeout(transportState.stepTimerId);
  }

  transportState.stepTimerId = setTimeout(() => {
    if (transportState.status !== "playing") return;
    const loop = getActiveLoopBounds();

    if (loop.active && stepIndex >= loop.endStepIndex) {
      transportState.loopPassCount++;
      if (document.getElementById("toggleTempoRamp")?.checked) {
        const nextBpm = Math.min(200, getCurrentTempoBpm() + 5);
        applyLiveTempoChange(nextBpm);
        const feedbackEl = document.getElementById("hudFeedbackText");
        if (feedbackEl) {
          feedbackEl.style.color = "#38bdf8";
          feedbackEl.textContent = `⚡ Loop pass #${transportState.loopPassCount}! Tempo ramped to ${nextBpm} BPM!`;
        }
      }
      transportState.nextStepTargetPerfMs = performance.now();
      schedulePlaybackStep(loop.startStepIndex);
      return;
    }

    if (stepIndex + 1 < songNoteSteps.length) {
      schedulePlaybackStep(stepIndex + 1);
    } else {
      const tailWait = Math.max(0, maxVoiceMs - stepDurationMs);
      transportState.stepTimerId = setTimeout(() => {
        if (transportState.status === "playing") {
          stopPlayback(true);
        }
      }, tailWait);
    }
  }, waitDelayMs);
}

function stopPlayback(resetToStart = true) {
  clearWaitPracticeTimer();
  clearTransportTimersAndVoices();
  if (typeof stopRepertoireMetronomeClock === "function") {
    stopRepertoireMetronomeClock();
  }
  transportState.status = "stopped";
  transportState.loopPassCount = 0;
  transportState.nextStepTargetPerfMs = 0;

  if (resetToStart) {
    const loop = getActiveLoopBounds();
    const targetStart = (loop && loop.active) ? loop.startStepIndex : 0;
    transportState.currentStepIndex = targetStart;
    currentPracticeStep = targetStart;
    document.querySelectorAll(".note-group").forEach(g => g.classList.remove("active-target"));
    if (isWaitPracticeMode && songNoteSteps && songNoteSteps.length > 0) {
      highlightActiveScoreNote(targetStart, false);
    } else if (typeof updateKeyboardTargetHighlights === "function") {
      updateKeyboardTargetHighlights(null);
    }
  } else if (typeof updateKeyboardTargetHighlights === "function") {
    updateKeyboardTargetHighlights(null);
  }
  updateTransportUI();
}

function startPlayback(options = {}) {
  if (!currentSong) return;
  if (transportState.status === "paused" && options.fromStepIndex === undefined && !options.forceRestart) {
    resumePlayback();
    return;
  }
  if (typeof isTempoFlowActive !== "undefined" && isTempoFlowActive) {
    stopTempoFlow();
  }

  initAudio();
  clearTransportTimersAndVoices();

  if (!songNoteSteps || songNoteSteps.length === 0) {
    parseSongSteps();
  }
  if (!songNoteSteps || songNoteSteps.length === 0) return;

  const loop = getActiveLoopBounds();
  let startIdx = 0;
  if (typeof options.fromStepIndex === "number") {
    startIdx = Math.max(0, Math.min(songNoteSteps.length - 1, options.fromStepIndex));
  } else if (loop.active) {
    const cur = transportState.currentStepIndex || 0;
    startIdx = (cur >= loop.startStepIndex && cur <= loop.endStepIndex) ? cur : loop.startStepIndex;
  } else {
    const cur = transportState.currentStepIndex || 0;
    startIdx = (cur >= 0 && cur < songNoteSteps.length) ? cur : 0;
  }

  transportState.currentStepIndex = startIdx;
  transportState.loopPassCount = 0;

  const countSel = document.getElementById("countInSelect");
  const bars = options.skipCountIn ? 0 : (countSel ? (parseInt(countSel.value, 10) || 0) : (transportState.countInBars || 0));

  const beginPlaying = () => {
    if (transportState.status === "stopped" || transportState.status === "paused") return;
    transportState.status = "playing";
    transportState.nextStepTargetPerfMs = performance.now();
    if (typeof updateKeyboardTargetHighlights === "function") updateKeyboardTargetHighlights(null);
    updateTransportUI();
    if (typeof isRepertoireMetroActive !== "undefined" && isRepertoireMetroActive) {
      startRepertoireMetronomeClock();
    }
    startTransportScrubberLoop();
    schedulePlaybackStep(startIdx);
  };

  if (bars > 0) {
    transportState.status = "counting_in";
    updateTransportUI();
    runPlaybackCountIn(bars, beginPlaying, () => transportState.status === "counting_in", transportState.countInTimers);
  } else {
    transportState.status = "playing";
    beginPlaying();
  }
}

function pausePlayback() {
  if (transportState.status !== "playing" && transportState.status !== "counting_in") return;
  const pausedStep = transportState.currentStepIndex || 0;
  clearTransportTimersAndVoices();
  if (typeof stopRepertoireMetronomeClock === "function") {
    stopRepertoireMetronomeClock();
  }
  transportState.status = "paused";
  transportState.nextStepTargetPerfMs = 0;
  transportState.currentStepIndex = pausedStep;
  currentPracticeStep = pausedStep;

  document.querySelectorAll(".note-group").forEach(g => g.classList.remove("active-target"));
  const targetEl = document.getElementById(`staff_note_${pausedStep}`);
  if (targetEl) {
    targetEl.classList.add("active-target");
  }
  updateTransportUI();
}

function resumePlayback() {
  if (transportState.status !== "paused") {
    startPlayback();
    return;
  }
  startPlayback({ fromStepIndex: transportState.currentStepIndex || 0, skipCountIn: true });
}

function togglePlayPause() {
  if (transportState.status === "counting_in") {
    stopPlayback(false);
  } else if (transportState.status === "playing") {
    pausePlayback();
  } else if (transportState.status === "paused") {
    resumePlayback();
  } else {
    startPlayback();
  }
}

function seekPlaybackToStep(stepIndex, options = {}) {
  if (!songNoteSteps || songNoteSteps.length === 0) return;
  clearWaitPracticeTimer();
  const clampedIdx = Math.max(0, Math.min(songNoteSteps.length - 1, Math.floor(stepIndex)));

  if (transportState.status === "playing") {
    clearTransportTimersAndVoices();
    transportState.status = "playing";
    transportState.currentStepIndex = clampedIdx;
    transportState.nextStepTargetPerfMs = performance.now();
    currentPracticeStep = clampedIdx;
    startTransportScrubberLoop();
    schedulePlaybackStep(clampedIdx);
  } else {
    transportState.currentStepIndex = clampedIdx;
    currentPracticeStep = clampedIdx;
    highlightActiveScoreNote(clampedIdx, true);
    updateTransportUI();
    if (options.audition) {
      auditionStepNotes(songNoteSteps[clampedIdx]);
    }
  }
}

function seekPlaybackToMeasure(measureNum) {
  if (!songNoteSteps || songNoteSteps.length === 0) return;
  const targetM = Math.max(1, parseInt(measureNum, 10) || 1);
  let targetStep = (currentPlaybackTimeline && currentPlaybackTimeline.measureStartSteps && currentPlaybackTimeline.measureStartSteps[targetM] !== undefined)
    ? currentPlaybackTimeline.measureStartSteps[targetM]
    : songNoteSteps.findIndex(s => (s.measure || 1) >= targetM);
  if (targetStep < 0) targetStep = 0;
  seekPlaybackToStep(targetStep, { audition: false });
}

function stepPlaybackBy(delta) {
  seekPlaybackToStep((transportState.currentStepIndex || 0) + delta, { audition: false });
}

function jumpPlaybackMeasure(delta) {
  if (!songNoteSteps || songNoteSteps.length === 0) return;
  const curStep = songNoteSteps[transportState.currentStepIndex || 0];
  const curMeasure = curStep ? (curStep.measure || 1) : 1;
  const totalMeasures = currentPlaybackTimeline ? Math.max(1, currentPlaybackTimeline.totalMeasures) : 1;
  const targetMeasure = Math.max(1, Math.min(totalMeasures, curMeasure + delta));
  seekPlaybackToMeasure(targetMeasure);
}

function applyLiveTempoChange(newBpm) {
  const clamped = Math.max(30, Math.min(220, Math.round(Number(newBpm) || 96)));
  const slider = document.getElementById("tempoSlider");
  if (slider) slider.value = String(clamped);
  const tempoText = document.getElementById("tempoText");
  if (tempoText) tempoText.textContent = `Tempo: ${clamped} BPM`;

  // Sync speed percentage active button highlight
  const baseBpm = (currentSong && currentSong.tempo) ? currentSong.tempo : 96;
  document.querySelectorAll(".speed-pct-btn").forEach(btn => {
    const pct = parseInt(btn.dataset.pct, 10);
    const pctBpm = (window.MusicTheory && window.MusicTheory.computeTempoFromSpeedPercent)
      ? window.MusicTheory.computeTempoFromSpeedPercent(baseBpm, pct, 30, 220)
      : Math.round(baseBpm * (pct / 100));
    btn.classList.toggle("active", pctBpm === clamped);
  });

  // Dynamically reschedule current step transition if actively playing
  if (transportState.status === "playing" && transportState.stepTimerId) {
    const prevBpm = transportState.lastStepBpm || clamped;
    const prevTotalMs = (transportState.currentStepBeats || 1) * (60 / prevBpm) * 1000;
    const elapsedMs = Math.max(0, performance.now() - transportState.stepStartPerfMs);
    const remainingFrac = Math.max(0.05, 1 - (elapsedMs / Math.max(1, prevTotalMs)));
    const newTotalMs = (transportState.currentStepBeats || 1) * (60 / clamped) * 1000;
    const remainingNewMs = remainingFrac * newTotalMs;
    const curStepIdx = transportState.currentStepIndex;

    clearTimeout(transportState.stepTimerId);
    transportState.lastStepBpm = clamped;
    transportState.nextStepTargetPerfMs = performance.now() + remainingNewMs;
    transportState.stepTimerId = setTimeout(() => {
      if (transportState.status !== "playing") return;
      const loop = getActiveLoopBounds();
      if (loop.active && curStepIdx >= loop.endStepIndex) {
        transportState.loopPassCount++;
        if (document.getElementById("toggleTempoRamp")?.checked) {
          const bumped = Math.min(200, getCurrentTempoBpm() + 5);
          applyLiveTempoChange(bumped);
        }
        transportState.nextStepTargetPerfMs = performance.now();
        schedulePlaybackStep(loop.startStepIndex);
        return;
      }
      if (curStepIdx + 1 < songNoteSteps.length) {
        schedulePlaybackStep(curStepIdx + 1);
      } else {
        stopPlayback(true);
      }
    }, remainingNewMs);
  }

  if (typeof isRepertoireMetroActive !== "undefined" && isRepertoireMetroActive) {
    const isPlaying = (transportState.status === "playing") || document.getElementById("mainPlayBtn")?.classList.contains("playing");
    if (isPlaying || isWaitPracticeMode) {
      startRepertoireMetronomeClock();
    }
  }
  updateTransportUI();
}

function setRelativeSpeedPercent(pct) {
  const baseBpm = (currentSong && currentSong.tempo) ? currentSong.tempo : 96;
  const targetBpm = (window.MusicTheory && window.MusicTheory.computeTempoFromSpeedPercent)
    ? window.MusicTheory.computeTempoFromSpeedPercent(baseBpm, pct, 30, 220)
    : Math.max(30, Math.min(220, Math.round(baseBpm * (pct / 100))));
  transportState.activeSpeedPct = pct;
  applyLiveTempoChange(targetBpm);
}

// 🥁 TEMPO FLOW MODE (METRONOME-SYNCED PLAYHEAD & TIMING EVALUATION)
function stopTempoFlow() {
  isTempoFlowActive = false;
  if (tempoFlowRunRafId) {
    cancelAnimationFrame(tempoFlowRunRafId);
    tempoFlowRunRafId = null;
  }
  tempoFlowTimeouts.forEach(t => clearTimeout(t));
  tempoFlowTimeouts = [];
  tempoFlowFulfilledSets.clear();
  tempoFlowStepOnsetTimes = [];
  const tfToggle = document.getElementById("tempoFlowToggle");
  if (tfToggle) {
    tfToggle.classList.remove("active-practice");
    tfToggle.textContent = "🥁 Tempo Flow Mode";
  }
  document.getElementById("practiceHud").style.display = "flex";
  const loop = getActiveLoopBounds();
  const startStep = loop.active ? loop.startStepIndex : 0;
  transportState.currentStepIndex = startStep;
  highlightActiveScoreNote(startStep);
  document.getElementById("hudFeedbackText").textContent = "Tempo Flow stopped. Ready to play.";
  updateTransportUI();
}

function startTempoFlow() {
  if (isWaitPracticeMode) {
    isWaitPracticeMode = false;
    document.getElementById("practiceModeToggle")?.classList.remove("active-practice");
    const pmToggle = document.getElementById("practiceModeToggle");
    if (pmToggle) pmToggle.textContent = "⏸ Practice Mode: Off";
  }
  stopPlayback(false);

  isTempoFlowActive = true;
  if (tempoFlowRunRafId) {
    cancelAnimationFrame(tempoFlowRunRafId);
    tempoFlowRunRafId = null;
  }
  tempoFlowTimeouts.forEach(t => clearTimeout(t));
  tempoFlowTimeouts = [];
  tempoFlowFulfilledSets.clear();
  tempoFlowStepOnsetTimes = [];
  tempoFlowStats = { total: 0, perfect: 0, good: 0, lateOrEarly: 0, missed: 0 };

  const tfToggle = document.getElementById("tempoFlowToggle");
  if (tfToggle) {
    tfToggle.classList.add("active-practice");
    tfToggle.textContent = "⏹ Stop Flow Mode";
  }

  document.getElementById("practiceHud").style.display = "flex";
  const targetBadge = document.getElementById("hudTargetBadge");
  const feedbackText = document.getElementById("hudFeedbackText");

  const bpm = getCurrentTempoBpm();
  const timeSigStr = (currentSong && currentSong.timeSig) ? currentSong.timeSig : "4/4";
  const countSel = document.getElementById("countInSelect");
  const selectedBars = countSel ? (parseInt(countSel.value, 10) || 0) : (transportState.countInBars || 0);
  const bars = Math.max(1, selectedBars);

  // Dynamic Audio-Visual Count-In Matching Time Signature
  const countInInfo = (window.MusicTheory && window.MusicTheory.getTimeSignatureCountIn)
    ? window.MusicTheory.getTimeSignatureCountIn(timeSigStr, bpm)
    : {
        countBeats: [
          { num: 4, freq: 880, label: "4" },
          { num: 3, freq: 440, label: "3" },
          { num: 2, freq: 440, label: "2" },
          { num: 1, freq: 440, label: "1" },
          { num: 0, freq: 1046.5, label: "GO! 🔥" }
        ],
        beatMs: (60 / bpm) * 1000
      };

  const singleBar = countInInfo.countBeats.filter(b => b.num > 0);
  const goBeat = countInInfo.countBeats.find(b => b.num === 0) || { num: 0, freq: 1046.5, label: "GO! 🔥" };
  const countBeats = [];
  for (let b = 0; b < bars; b++) {
    singleBar.forEach(item => countBeats.push({ ...item, barNum: b + 1 }));
  }
  countBeats.push({ ...goBeat, barNum: bars });
  const countBeatMs = countInInfo.beatMs;

  const loop = getActiveLoopBounds();
  const startIdx = loop.active ? loop.startStepIndex : 0;
  currentPracticeStep = startIdx;
  transportState.currentStepIndex = startIdx;
  highlightActiveScoreNote(startIdx);
  updateTransportUI();

  countBeats.forEach((b, idx) => {
    const t = setTimeout(() => {
      if (!isTempoFlowActive) return;
      playTone(b.freq, 0.12);
      if (targetBadge) targetBadge.textContent = b.num > 0 ? `${b.num}` : "GO!";
      feedbackText.style.color = b.num === 0 ? "#10b981" : "#f59e0b";
      const barPrefix = bars > 1 && b.num > 0 ? `Bar ${b.barNum}/${bars} • ` : "";
      feedbackText.textContent = `🥁 ${barPrefix}Metronome Count-in: ${b.label}... Get ready!`;

      if (idx === countBeats.length - 1) {
        runTempoFlowSequence(startIdx);
      }
    }, idx * countBeatMs);
    tempoFlowTimeouts.push(t);
  });
}

function runTempoFlowSequence(startIdx = 0) {
  if (!isTempoFlowActive) return;
  if (!songNoteSteps || songNoteSteps.length === 0) {
    finishTempoFlow();
    return;
  }

  tempoFlowFulfilledSets.clear();
  tempoFlowStepOnsetTimes = new Array(songNoteSteps.length);
  songNoteSteps.forEach(s => {
    if (s) {
      s._flowCounted = false;
      s._flowScored = false;
      s._flowMissed = false;
    }
  });

  let flowLoopMisses = 0;
  let flowMetroTimerId = null;
  let flowMetroTick = 0;
  tempoFlowClockAnchorPerfMs = performance.now();
  let flowMetroStartPerfMs = tempoFlowClockAnchorPerfMs;
  let flowMetroTickCount = 0;
  let flowMetroLastBpm = getCurrentTempoBpm();
  let nextStepTargetPerfMs = tempoFlowClockAnchorPerfMs;

  const scheduleStepOnsetLookahead = (fromIdx, fromPerfMs, bpmVal) => {
    const beatMs = (60 / bpmVal) * 1000;
    let cursorMs = fromPerfMs;
    for (let k = fromIdx; k < songNoteSteps.length; k++) {
      tempoFlowStepOnsetTimes[k] = cursorMs;
      cursorMs += (songNoteSteps[k]?.beats || 1.0) * beatMs;
    }
  };

  const startFlowScrubberRaf = () => {
    if (tempoFlowRunRafId) cancelAnimationFrame(tempoFlowRunRafId);
    const tickRaf = () => {
      if (!isTempoFlowActive) {
        tempoFlowRunRafId = null;
        return;
      }
      const timeline = currentPlaybackTimeline;
      const stepTiming = timeline && timeline.stepTimings ? timeline.stepTimings[currentPracticeStep] : null;
      if (stepTiming) {
        const bpm = getCurrentTempoBpm();
        const elapsedBeats = ((performance.now() - tempoFlowStepStartTime) / 1000) * (bpm / 60);
        const clampedBeat = stepTiming.startBeat + Math.min(stepTiming.beats, Math.max(0, elapsedBeats));
        updateTransportUI(clampedBeat);
      }
      tempoFlowRunRafId = requestAnimationFrame(tickRaf);
    };
    tempoFlowRunRafId = requestAnimationFrame(tickRaf);
  };

  // Isochronous Metronome Clicks synchronized with live BPM & anchored to wall clock
  function scheduleFlowMetro() {
    if (!isTempoFlowActive) return;
    const bpm = getCurrentTempoBpm();
    const timeSigStr = (currentSong && currentSong.timeSig) ? currentSong.timeSig : "4/4";
    const metroCalc = (window.MusicTheory && window.MusicTheory.calculateMetronomeIntervals)
      ? window.MusicTheory.calculateMetronomeIntervals(bpm, timeSigStr, 1)
      : { tickIntervalMs: (60 / bpm) * 1000, ticksPerMeasure: 4 };

    if (bpm !== flowMetroLastBpm) {
      flowMetroStartPerfMs = performance.now();
      flowMetroTickCount = 0;
      flowMetroLastBpm = bpm;
    }

    const profile = (window.MusicTheory && window.MusicTheory.getMetronomeTickProfile)
      ? window.MusicTheory.getMetronomeTickProfile(flowMetroTick, metroCalc.ticksPerMeasure, timeSigStr, 1)
      : { isDownbeat: flowMetroTick % metroCalc.ticksPerMeasure === 0, freq: flowMetroTick % metroCalc.ticksPerMeasure === 0 ? 880 : 440 };

    if (audioCtx && typeof triggerMetronomeClickAudio === "function") {
      triggerMetronomeClickAudio(audioCtx.currentTime, { ...profile, accentType: profile.isDownbeat ? "downbeat" : "beat" }, 0.25, 0.04);
    } else {
      playTone(profile.freq, 0.04);
    }
    flowMetroTick = (flowMetroTick + 1) % metroCalc.ticksPerMeasure;
    flowMetroTickCount++;
    const targetNextMs = flowMetroStartPerfMs + (flowMetroTickCount * metroCalc.tickIntervalMs);
    const waitMs = Math.max(4, targetNextMs - performance.now());
    flowMetroTimerId = setTimeout(scheduleFlowMetro, waitMs);
    tempoFlowTimeouts.push(flowMetroTimerId);
  }

  function finalizeCompletedStepCheck(stepIdxToCheck) {
    const checkedStep = songNoteSteps[stepIdxToCheck];
    if (!checkedStep || !checkedStep.expectedPitches || checkedStep.expectedPitches.length === 0) return;
    const fulfilled = tempoFlowFulfilledSets.get(stepIdxToCheck);
    const isDone = Boolean(fulfilled && fulfilled.size >= checkedStep.expectedPitches.length);
    if (!isDone && !checkedStep._flowMissed && !checkedStep._flowScored) {
      checkedStep._flowMissed = true;
      tempoFlowStats.missed++;
      flowLoopMisses++;
    }
  }

  function advanceFlowStep(stepIdx, isFirstInRun = false) {
    if (!isTempoFlowActive) return;

    if (!isFirstInRun) {
      finalizeCompletedStepCheck(currentPracticeStep);
    }

    const step = songNoteSteps[stepIdx];
    if (!step) {
      finishTempoFlow();
      return;
    }

    const bpm = getCurrentTempoBpm();
    const beatMs = (60 / bpm) * 1000;
    const stepBeats = step.beats || 1.0;
    const stepDurationMs = stepBeats * beatMs;
    const nowPerf = performance.now();
    const scheduledOnset = isFirstInRun ? nowPerf : nextStepTargetPerfMs;
    nextStepTargetPerfMs = scheduledOnset + stepDurationMs;
    scheduleStepOnsetLookahead(stepIdx, scheduledOnset, bpm);

    currentPracticeStep = stepIdx;
    transportState.currentStepIndex = stepIdx;
    tempoFlowStepStartTime = scheduledOnset;

    let fulfilledSet = tempoFlowFulfilledSets.get(stepIdx);
    if (!fulfilledSet) {
      fulfilledSet = new Set();
      tempoFlowFulfilledSets.set(stepIdx, fulfilledSet);
    }

    if (step.tiedFromPrev && Array.isArray(step.tiedPitches) && step.tiedPitches.length > 0) {
      step.tiedPitches.forEach(p => {
        if (typeof isPitchActivelySustained === "function" && isPitchActivelySustained(p)) {
          fulfilledSet.add(p);
        }
      });
    }

    const hasPlayableNotes = Array.isArray(step.expectedPitches) && step.expectedPitches.length > 0;
    if (hasPlayableNotes && !step._flowCounted) {
      step._flowCounted = true;
      tempoFlowStats.total++;
    }
    tempoFlowStepFulfilled = hasPlayableNotes ? (fulfilledSet.size >= step.expectedPitches.length) : true;

    highlightActiveScoreNote(stepIdx);
    updateTargetBadgeDisplay(step, fulfilledSet);
    document.getElementById("hudProgressText").textContent = `Step: ${stepIdx + 1} / ${songNoteSteps.length}`;
    updateTransportUI();

    const waitMs = Math.max(4, nextStepTargetPerfMs - performance.now());
    const stepTimer = setTimeout(() => {
      if (!isTempoFlowActive) return;
      const loop = getActiveLoopBounds();
      if (loop.active && stepIdx >= loop.endStepIndex) {
        finalizeCompletedStepCheck(stepIdx);
        if (flowLoopMisses === 0 && document.getElementById("toggleTempoRamp")?.checked) {
          const nextBpm = Math.min(200, getCurrentTempoBpm() + 5);
          applyLiveTempoChange(nextBpm);
        }
        flowLoopMisses = 0;
        for (let j = loop.startStepIndex; j <= loop.endStepIndex; j++) {
          tempoFlowFulfilledSets.delete(j);
          if (songNoteSteps[j]) {
            songNoteSteps[j]._flowCounted = false;
            songNoteSteps[j]._flowScored = false;
            songNoteSteps[j]._flowMissed = false;
          }
        }
        nextStepTargetPerfMs = performance.now();
        advanceFlowStep(loop.startStepIndex, true);
        return;
      }

      if (stepIdx + 1 < songNoteSteps.length) {
        advanceFlowStep(stepIdx + 1, false);
      } else {
        finalizeCompletedStepCheck(stepIdx);
        finishTempoFlow();
      }
    }, waitMs);

    tempoFlowTimeouts.push(stepTimer);
  }

  scheduleFlowMetro();
  startFlowScrubberRaf();
  advanceFlowStep(startIdx, true);
}

function verifyTempoFlowInput(playedPitch, noteAttack = null) {
  if (!isTempoFlowActive) return;
  if (noteAttack && noteAttack.consumedStepIndex !== null) return;

  const isFromMidi = noteAttack && noteAttack.source === "midi";
  playSingleNoteAudit(playedPitch, "rh", !isFromMidi);

  const hitTimeMs = performance.now();
  const bpm = getCurrentTempoBpm();
  const evalRes = (window.MusicTheory && window.MusicTheory.evaluateTempoFlowHit)
    ? window.MusicTheory.evaluateTempoFlowHit({
        hitTimeMs,
        steps: songNoteSteps,
        stepOnsetTimes: tempoFlowStepOnsetTimes,
        currentStepIndex: currentPracticeStep,
        playedPitch,
        stepFulfilledSets: tempoFlowFulfilledSets,
        bpm
      })
    : { matched: false };

  const feedbackText = document.getElementById("hudFeedbackText");
  if (!evalRes.matched) return;

  const targetStep = songNoteSteps[evalRes.stepIndex];
  if (!targetStep) return;

  if (noteAttack) noteAttack.consumedStepIndex = evalRes.stepIndex;

  let fulfilledSet = tempoFlowFulfilledSets.get(evalRes.stepIndex);
  if (!fulfilledSet) {
    fulfilledSet = new Set();
    tempoFlowFulfilledSets.set(evalRes.stepIndex, fulfilledSet);
  }
  fulfilledSet.add(evalRes.matchedPitch);

  if (evalRes.stepIndex === currentPracticeStep) {
    updateTargetBadgeDisplay(targetStep, fulfilledSet);
  }

  const allDone = fulfilledSet.size >= (targetStep.expectedPitches ? targetStep.expectedPitches.length : 1);
  if (!allDone) {
    if (feedbackText) {
      feedbackText.style.color = "#38bdf8";
      feedbackText.textContent = `🎵 ${playedPitch} locked (${fulfilledSet.size}/${targetStep.expectedPitches.length})`;
    }
    return;
  }

  if (targetStep._flowMissed) {
    targetStep._flowMissed = false;
    tempoFlowStats.missed = Math.max(0, tempoFlowStats.missed - 1);
  }

  if (!targetStep._flowScored) {
    targetStep._flowScored = true;
    if (evalRes.grade === "PERFECT") tempoFlowStats.perfect++;
    else if (evalRes.grade === "GOOD") tempoFlowStats.good++;
    else tempoFlowStats.lateOrEarly++;
  }

  if (evalRes.stepIndex === currentPracticeStep) {
    tempoFlowStepFulfilled = true;
  }

  const roundedSigned = Math.round(evalRes.offsetMs || 0);
  const signedLabel = `${roundedSigned >= 0 ? "+" : ""}${roundedSigned}ms`;
  if (feedbackText) {
    if (evalRes.grade === "PERFECT") {
      feedbackText.innerHTML = `<span class="timing-badge-perfect">🔥 PERFECT TIMING! (${signedLabel})</span>`;
    } else if (evalRes.grade === "GOOD") {
      feedbackText.innerHTML = `<span class="timing-badge-good">✨ GOOD! (${signedLabel})</span>`;
    } else if (evalRes.grade === "EARLY") {
      feedbackText.innerHTML = `<span class="timing-badge-early">⚠️ EARLY (${signedLabel})</span>`;
    } else {
      feedbackText.innerHTML = `<span class="timing-badge-early">⚠️ LATE (+${Math.round(evalRes.absOffsetMs || 0)}ms)</span>`;
    }
  }
}

function finishTempoFlow() {
  if (tempoFlowRunRafId) {
    cancelAnimationFrame(tempoFlowRunRafId);
    tempoFlowRunRafId = null;
  }
  const { perfect, good, lateOrEarly, missed, total } = tempoFlowStats;
  const maxPts = Math.max(1, total) * 100;
  const earned = perfect * 100 + good * 75 + lateOrEarly * 40;
  const accuracy = Math.min(100, Math.round((earned / maxPts) * 100));

  const feedbackText = document.getElementById("hudFeedbackText");
  feedbackText.innerHTML = `🏆 <strong>Tempo Flow Complete!</strong> Accuracy: <strong>${accuracy}%</strong> (🔥 Perfect: ${perfect}, ✨ Good: ${good}, ⚠️ Late/Early: ${lateOrEarly}, ❌ Miss: ${missed})`;

  const tfToggle = document.getElementById("tempoFlowToggle"); if (tfToggle) {
    tfToggle.classList.remove("active-practice");
    tfToggle.textContent = "🥁 Tempo Flow Mode";
  }
  isTempoFlowActive = false;

  // Complete song performance with rich review modal
  completeSongPerformance(accuracy, "tempo-flow", tempoFlowStats);
}

// REPERTOIRE STEADY METRONOME SYNCHRONIZER
function initRepertoireMetronome() {
  const btn = document.getElementById("repertoireMetroToggle");
  if (!btn) return;
  const saved = localStorage.getItem("piano_repertoire_metronome");
  if (saved === "true") {
    isRepertoireMetroActive = true;
    btn.classList.add("active-practice");
    btn.textContent = "⏱️ Metronome: On";
  }

  btn.addEventListener("click", () => {
    isRepertoireMetroActive = !isRepertoireMetroActive;
    localStorage.setItem("piano_repertoire_metronome", String(isRepertoireMetroActive));
    btn.classList.toggle("active-practice", isRepertoireMetroActive);
    btn.textContent = isRepertoireMetroActive ? "⏱️ Metronome: On" : "⏱️ Metronome: Off";

    const isPlaying = document.getElementById("mainPlayBtn")?.classList.contains("playing");
    if (isRepertoireMetroActive) {
      if (isPlaying || isWaitPracticeMode) {
        startRepertoireMetronomeClock();
      }
    } else {
      stopRepertoireMetronomeClock();
    }
  });

  const repSoundSel = document.getElementById("repertoireMetroSoundSelect");
  if (repSoundSel) {
    repSoundSel.value = currentMetroSound;
    repSoundSel.addEventListener("change", (e) => {
      setMetroSound(e.target.value, true);
    });
  }

  const synthInstSel = document.getElementById("synthInstrumentSelect");
  if (synthInstSel) {
    synthInstSel.value = currentSynthInstrument;
    synthInstSel.addEventListener("change", (e) => {
      setSynthInstrument(e.target.value, true);
    });
  }
}

function startRepertoireMetronomeClock() {
  stopRepertoireMetronomeClock();
  if (!isRepertoireMetroActive || !currentSong) return;
  initAudio();
  const bpm = parseInt(document.getElementById("tempoSlider")?.value, 10) || currentSong.tempo || 96;
  const timeSig = currentSong.timeSig || "4/4";
  const calc = (window.MusicTheory && window.MusicTheory.calculateMetronomeIntervals)
    ? window.MusicTheory.calculateMetronomeIntervals(bpm, timeSig, 1)
    : { tickIntervalSec: 60.0 / bpm, ticksPerMeasure: 4 };

  repMetroTickIndex = 0;
  repMetroNextTickTime = audioCtx.currentTime;

  function repScheduler() {
    const isPlaying = (typeof transportState !== "undefined" && transportState.status === "playing") || document.getElementById("mainPlayBtn")?.classList.contains("playing");
    if (!isRepertoireMetroActive || (!isPlaying && !isWaitPracticeMode)) {
      stopRepertoireMetronomeClock();
      return;
    }
    const intervalSec = calc.tickIntervalSec;
    const ticksPerMeasure = calc.ticksPerMeasure;

    while (repMetroNextTickTime < audioCtx.currentTime + 0.1) {
      scheduleRepertoireMetroClick(repMetroNextTickTime, repMetroTickIndex, ticksPerMeasure, timeSig);
      repMetroTickIndex = (repMetroTickIndex + 1) % ticksPerMeasure;
      repMetroNextTickTime += intervalSec;
    }
    repMetroTimerId = setTimeout(repScheduler, 25);
  }

  repScheduler();
}

function stopRepertoireMetronomeClock() {
  if (repMetroTimerId) {
    clearTimeout(repMetroTimerId);
    repMetroTimerId = null;
  }
  repMetroTickIndex = 0;
}

function scheduleRepertoireMetroClick(time, tick, ticksPerMeasure, timeSig) {
  const profile = (window.MusicTheory && window.MusicTheory.getMetronomeTickProfile)
    ? window.MusicTheory.getMetronomeTickProfile(tick, ticksPerMeasure, timeSig, 1)
    : { isDownbeat: tick === 0, accentType: tick === 0 ? "downbeat" : "beat", freq: tick === 0 ? 1000 : 500, volume: tick === 0 ? 0.7 : 0.4 };

  triggerMetronomeClickAudio(time, profile, 0.25, 0.04);
}

function initTransportKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    if (typeof activeEducationalMode === "undefined" || activeEducationalMode !== "repertoire") return;
    if (e.target && (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName) || e.target.isContentEditable)) return;

    const reviewModalOpen = document.getElementById("songReviewModal")?.classList.contains("is-open");
    const cheatModalOpen = document.getElementById("cheatSheetModal")?.classList.contains("is-open");
    if (reviewModalOpen || cheatModalOpen) return;

    if (e.code === "Space") {
      e.preventDefault();
      togglePlayPause();
    } else if (e.code === "Escape") {
      if (isTempoFlowActive) stopTempoFlow();
      else if (transportState.status !== "stopped") stopPlayback(true);
    } else if (e.code === "ArrowLeft") {
      e.preventDefault();
      if (e.shiftKey) jumpPlaybackMeasure(-1);
      else stepPlaybackBy(-1);
    } else if (e.code === "ArrowRight") {
      e.preventDefault();
      if (e.shiftKey) jumpPlaybackMeasure(1);
      else stepPlaybackBy(1);
    } else if (e.code === "Home") {
      e.preventDefault();
      const loop = getActiveLoopBounds();
      seekPlaybackToStep(loop.active ? loop.startStepIndex : 0);
    } else if (e.code === "KeyL" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const loopToggle = document.getElementById("toggleLoopSection");
      if (loopToggle) {
        loopToggle.checked = !loopToggle.checked;
        if (typeof updateScoreLoopHighlights === "function") updateScoreLoopHighlights();
        updateTransportUI();
      }
    }
  });
}

function initPracticeAndTransportControls() {
  const practiceModeToggle = document.getElementById("practiceModeToggle");
  if (practiceModeToggle) {
    practiceModeToggle.addEventListener("click", () => {
      if (typeof isTempoFlowActive !== "undefined" && isTempoFlowActive) {
        stopTempoFlow();
      }
      isWaitPracticeMode = !isWaitPracticeMode;
      practiceModeToggle.classList.toggle("active-practice", isWaitPracticeMode);
      practiceModeToggle.textContent = isWaitPracticeMode ? "🎯 Wait-for-Me Practice Mode" : "⏸ Practice Mode: Off";
      document.getElementById("practiceHud").style.display = isWaitPracticeMode ? "flex" : "none";
      stopPlayback(true);
      currentPracticeStep = 0;
      highlightActiveScoreNote(0);
      if (typeof isRepertoireMetroActive !== "undefined" && isRepertoireMetroActive) {
        if (isWaitPracticeMode) {
          startRepertoireMetronomeClock();
        } else {
          stopRepertoireMetronomeClock();
        }
      }
    });
  }

  const tempoFlowToggle = document.getElementById("tempoFlowToggle");
  if (tempoFlowToggle) {
    tempoFlowToggle.addEventListener("click", () => {
      if (isTempoFlowActive) {
        stopTempoFlow();
      } else {
        startTempoFlow();
      }
    });
  }

  const hudFeedbackEl = document.getElementById("hudFeedbackText");
  if (hudFeedbackEl && typeof MutationObserver !== "undefined") {
    const feedbackObserver = new MutationObserver(() => {
      if (hudFeedbackEl.title !== hudFeedbackEl.textContent) {
        hudFeedbackEl.title = hudFeedbackEl.textContent;
      }
    });
    feedbackObserver.observe(hudFeedbackEl, { childList: true, characterData: true, subtree: true });
  }

  const tempoSlider = document.getElementById("tempoSlider");
  if (tempoSlider) {
    tempoSlider.addEventListener("input", (e) => {
      applyLiveTempoChange(e.target.value);
    });
  }

  document.querySelectorAll(".controls-bar .tempo-preset-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const speed = btn.dataset.speed;
      if (!speed) return;
      applyLiveTempoChange(speed);
    });
  });

  document.querySelectorAll(".speed-pct-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const pct = parseInt(btn.dataset.pct, 10);
      if (!isNaN(pct)) setRelativeSpeedPercent(pct);
    });
  });

  const countInSelect = document.getElementById("countInSelect");
  if (countInSelect) {
    countInSelect.value = String(transportState.countInBars || 0);
    countInSelect.addEventListener("change", (e) => {
      const bars = Math.max(0, Math.min(2, parseInt(e.target.value, 10) || 0));
      transportState.countInBars = bars;
      try {
        localStorage.setItem("piano_count_in_bars", String(bars));
      } catch (err) {}
    });
  }

  document.getElementById("mainPlayBtn")?.addEventListener("click", () => {
    togglePlayPause();
  });

  document.getElementById("transportPauseBtn")?.addEventListener("click", () => {
    togglePlayPause();
  });

  document.getElementById("transportStopBtn")?.addEventListener("click", () => {
    if (isTempoFlowActive) stopTempoFlow();
    else stopPlayback(true);
  });

  document.getElementById("transportPrevMeasureBtn")?.addEventListener("click", () => {
    jumpPlaybackMeasure(-1);
  });

  document.getElementById("transportNextMeasureBtn")?.addEventListener("click", () => {
    jumpPlaybackMeasure(1);
  });

  const scrubber = document.getElementById("transportScrubber");
  if (scrubber) {
    scrubber.addEventListener("input", (e) => {
      const timeline = currentPlaybackTimeline;
      if (!timeline || timeline.totalBeats <= 0) return;
      const frac = Math.max(0, Math.min(1, parseFloat(e.target.value) / 1000));
      const targetBeat = frac * timeline.totalBeats;
      const targetStep = (window.MusicTheory && window.MusicTheory.findStepAtBeat)
        ? window.MusicTheory.findStepAtBeat(timeline, targetBeat)
        : 0;
      if (transportState.status !== "playing") {
        seekPlaybackToStep(targetStep, { audition: false });
      } else {
        updateTransportUI(targetBeat);
      }
    });
    scrubber.addEventListener("change", (e) => {
      const timeline = currentPlaybackTimeline;
      if (!timeline || timeline.totalBeats <= 0) return;
      const frac = Math.max(0, Math.min(1, parseFloat(e.target.value) / 1000));
      const targetBeat = frac * timeline.totalBeats;
      const targetStep = (window.MusicTheory && window.MusicTheory.findStepAtBeat)
        ? window.MusicTheory.findStepAtBeat(timeline, targetBeat)
        : 0;
      seekPlaybackToStep(targetStep, { audition: false });
    });
  }

  const syncLoopUI = () => {
    if (typeof updateScoreLoopHighlights === "function") updateScoreLoopHighlights();
    updateTransportUI();
  };
  document.getElementById("toggleLoopSection")?.addEventListener("change", syncLoopUI);
  document.getElementById("loopStartMeasure")?.addEventListener("change", syncLoopUI);
  document.getElementById("loopEndMeasure")?.addEventListener("change", syncLoopUI);

  document.getElementById("setLoopABtn")?.addEventListener("click", () => {
    const curStep = songNoteSteps[transportState.currentStepIndex || 0];
    const m = curStep ? (curStep.measure || 1) : 1;
    const startEl = document.getElementById("loopStartMeasure");
    const endEl = document.getElementById("loopEndMeasure");
    if (startEl) startEl.value = String(m);
    if (endEl && (parseInt(endEl.value, 10) || 1) < m) endEl.value = String(m);
    syncLoopUI();
  });

  document.getElementById("setLoopBBtn")?.addEventListener("click", () => {
    const curStep = songNoteSteps[transportState.currentStepIndex || 0];
    const m = curStep ? (curStep.measure || 1) : 1;
    const startEl = document.getElementById("loopStartMeasure");
    const endEl = document.getElementById("loopEndMeasure");
    const loopChk = document.getElementById("toggleLoopSection");
    if (endEl) endEl.value = String(m);
    if (startEl && (parseInt(startEl.value, 10) || 1) > m) startEl.value = String(m);
    if (loopChk) loopChk.checked = true;
    syncLoopUI();
  });

  initTransportKeyboardShortcuts();
  updateTransportUI();
}
