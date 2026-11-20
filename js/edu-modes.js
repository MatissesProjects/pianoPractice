// ============================================================================
// EDUCATIONAL MODES: SIGHT-READING, EAR TRAINING, SCALES, RHYTHM & THEORY
// ============================================================================

function handleEducationalNoteInput(pitchName) {
  if (activeEducationalMode === "sight-reading") {
    verifySightReadingInput(pitchName);
  } else if (activeEducationalMode === "ear-training") {
    verifyEarTrainingPitchInput(pitchName);
  } else if (activeEducationalMode === "scales") {
    if (typeof isVoiceLeadingActive !== "undefined" && isVoiceLeadingActive && isVlPracticeActive) {
      verifyVoiceLeadingInput(pitchName);
    } else if (typeof isChordLabActive !== "undefined" && isChordLabActive && isChordLabPracticeActive) {
      verifyChordLabInput(pitchName);
    } else if (isScalePracticeActive) {
      verifyScalePracticeInput(pitchName);
    } else {
      if (typeof highlightPlaybackKey === "function") highlightPlaybackKey(pitchName, "rh", 250);
    }
  } else if (activeEducationalMode === "theory") {
    if (typeof isBootcampTaskActive !== "undefined" && isBootcampTaskActive) {
      verifyBootcampNoteInput(pitchName);
    } else {
      if (typeof highlightPlaybackKey === "function") highlightPlaybackKey(pitchName, "rh", 250);
    }
  } else if (activeEducationalMode === "rhythm") {
    registerRhythmTap();
  } else {
    if (typeof highlightPlaybackKey === "function") highlightPlaybackKey(pitchName, "rh", 250);
  }
}

// 1. Mode Navigation Deck Handler
function initModeNavigation() {
  const navButtons = document.querySelectorAll(".mode-nav-btn");
  const panels = {
    "repertoire": document.getElementById("panelRepertoire"),
    "sight-reading": document.getElementById("panelSightReading"),
    "ear-training": document.getElementById("panelEarTraining"),
    "scales": document.getElementById("panelScales"),
    "rhythm": document.getElementById("panelRhythm"),
    "theory": document.getElementById("panelTheory")
  };

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetMode = btn.dataset.mode;
      if (targetMode === activeEducationalMode) return;

      // Cleanup previous mode
      if (activeEducationalMode === "repertoire") {
        stopPlayback();
        if (typeof isTempoFlowActive !== "undefined" && isTempoFlowActive) stopTempoFlow();
        if (typeof isRepertoireMetroActive !== "undefined" && isRepertoireMetroActive) stopRepertoireMetronomeClock();
      }
      if (activeEducationalMode === "rhythm" && metroIsPlaying) stopMetronome();
      if (activeEducationalMode === "sight-reading") stopSightReadingDrill();
      if (activeEducationalMode === "scales") {
        if (typeof isVlPracticeActive !== "undefined" && isVlPracticeActive) toggleVoiceLeadingPractice();
        if (typeof isChordLabPracticeActive !== "undefined" && isChordLabPracticeActive) toggleChordLabPractice();
        if (typeof isScalePracticeActive !== "undefined" && isScalePracticeActive) toggleScalePractice();
      }
      if (activeEducationalMode === "theory") {
        if (typeof isBootcampTaskActive !== "undefined" && isBootcampTaskActive) toggleBootcampTask();
      }

      activeEducationalMode = targetMode;

      navButtons.forEach(b => b.classList.toggle("active", b === btn));
      Object.keys(panels).forEach(k => {
        if (panels[k]) panels[k].classList.toggle("active-panel", k === targetMode);
      });

      const repCatalog = document.getElementById("repertoireCatalogSection");
      if (repCatalog) {
        repCatalog.style.display = (targetMode === "repertoire") ? "block" : "none";
      }

      // Trigger view initializations
      if (targetMode === "sight-reading") {
        if (!srCurrentCard) nextSightReadingCard();
      } else if (targetMode === "ear-training") {
        if (!earCurrentChallenge) loadEarChallenge();
      } else if (targetMode === "scales") {
        if (typeof isVoiceLeadingActive !== "undefined" && isVoiceLeadingActive) {
          updateVoiceLeadingDisplay();
        } else if (typeof isChordLabActive !== "undefined" && isChordLabActive) {
          updateChordLabDisplay();
        } else {
          updateScaleDisplay();
        }
      } else if (targetMode === "theory") {
        renderCircleOfFifthsSvg();
        if (typeof renderBootcampModule === "function") renderBootcampModule();
      }
    });
  });
}

// 2. SIGHT-READING SPEED DRILL ENGINE
function initSightReadingModule() {
  const startBtn = document.getElementById("srStartBtn");
  startBtn?.addEventListener("click", () => {
    if (srIsRunning) stopSightReadingDrill();
    else startSightReadingDrill();
  });

  document.getElementById("srPresetSelect")?.addEventListener("change", () => {
    if (!srIsRunning) nextSightReadingCard();
  });

  // Answer button clicks
  document.querySelectorAll("#srButtonsGrid .answer-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      verifySightReadingInput(btn.dataset.note);
    });
  });

  // Physical keyboard shortcuts (A-G)
  window.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
    const key = e.key.toUpperCase();
    if (["A", "B", "C", "D", "E", "F", "G"].includes(key)) {
      if (activeEducationalMode === "sight-reading") {
        verifySightReadingInput(key);
      }
    } else if (e.code === "Space") {
      if (activeEducationalMode === "ear-training") {
        e.preventDefault();
        playEarChallengeAudio();
      } else if (activeEducationalMode === "rhythm") {
        e.preventDefault();
        registerRhythmTap();
      }
    }
  });
}

function startSightReadingDrill() {
  srIsRunning = true;
  const startBtn = document.getElementById("srStartBtn");
  if (startBtn) startBtn.textContent = "■ Stop Drill";
  srStats = { correct: 0, attempts: 0, streak: 0, bestStreak: srStats.bestStreak, solved: 0 };
  updateSightReadingHUD();

  const mode = document.getElementById("srModeSelect").value;
  const track = document.getElementById("srTimerTrack");
  const prog = document.getElementById("srTimerProgress");
  if (mode === "timed") {
    srTimeRemaining = 60;
    document.getElementById("srTimerDisplay").textContent = "60s";
    if (track && prog) {
      track.style.display = "block";
      prog.style.width = "100%";
      prog.classList.remove("urgent");
    }
    clearInterval(srTimerInterval);
    srTimerInterval = setInterval(() => {
      srTimeRemaining--;
      document.getElementById("srTimerDisplay").textContent = `${srTimeRemaining}s`;
      if (prog) {
        prog.style.width = `${Math.max(0, (srTimeRemaining / 60) * 100)}%`;
        if (srTimeRemaining <= 15) prog.classList.add("urgent");
      }
      if (srTimeRemaining <= 0) {
        stopSightReadingDrill();
        document.getElementById("srPromptText").textContent = `🎉 Time's up! You solved ${srStats.solved} notes with ${getSRAccuracy()}% accuracy!`;
      }
    }, 1000);
  } else {
    if (track) track.style.display = "none";
    document.getElementById("srTimerDisplay").textContent = mode === "sprint" ? "20 Cards" : "Zen ∞";
  }

  nextSightReadingCard();
}

function stopSightReadingDrill() {
  srIsRunning = false;
  clearInterval(srTimerInterval);
  const track = document.getElementById("srTimerTrack");
  if (track) track.style.display = "none";
  const startBtn = document.getElementById("srStartBtn");
  if (startBtn) startBtn.textContent = "▶ Start Drill";
}

function updateSRSHudDisplay() {
  if (!window.MusicTheory || !window.MusicTheory.getAllSRSStats) return;
  const stats = window.MusicTheory.getAllSRSStats();
  const keys = Object.keys(stats);
  const el = document.getElementById("srSrsStatsDisplay");
  if (!el) return;
  if (keys.length === 0) {
    el.textContent = "Adaptive Ready";
    return;
  }
  let mastered = 0, practice = 0;
  keys.forEach(k => {
    const lvl = window.MusicTheory.getSRSMasteryLevel(k);
    if (lvl === "mastered") mastered++;
    else if (lvl === "needs_practice") practice++;
  });
  el.textContent = `${mastered} Mastered / ${practice} Focus`;
}

function nextSightReadingCard() {
  const preset = document.getElementById("srPresetSelect")?.value || "treble_basic";
  if (!window.MusicTheory) return;
  srCurrentCard = window.MusicTheory.getRandomFlashcard(preset, srCurrentCard ? srCurrentCard.pitch : null, true);
  srCardShownTime = performance.now();
  renderSightReadingSvg(srCurrentCard);
  document.getElementById("srPromptText").textContent = `Identify this note (${srCurrentCard.clef === 'treble' ? 'Treble 𝄞' : 'Bass 𝄢'}):`;
  updateSRSHudDisplay();
}

function renderSightReadingSvg(card) {
  const svg = document.getElementById("srSvg");
  if (!svg || !card) return;
  svg.innerHTML = "";

  const width = 340;
  const midY = 90;
  const spacing = 12;
  const staffTop = midY - 2 * spacing;
  const staffBottom = midY + 2 * spacing;

  // Draw 5 staff lines
  for (let i = 0; i < 5; i++) {
    const y = staffTop + i * spacing;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", "40");
    line.setAttribute("y1", y);
    line.setAttribute("x2", width - 40);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", "#1e293b");
    line.setAttribute("stroke-width", "1.5");
    svg.appendChild(line);
  }

  // Draw Clef
  const clef = document.createElementNS("http://www.w3.org/2000/svg", "text");
  clef.setAttribute("x", "52");
  clef.setAttribute("class", "clef-text");
  clef.setAttribute("fill", "#0f172a");

  if (card.clef === "treble") {
    clef.setAttribute("y", staffBottom - 2);
    clef.setAttribute("font-size", "54");
    clef.textContent = "𝄞";
  } else {
    clef.setAttribute("y", staffTop + 34);
    clef.setAttribute("font-size", "44");
    clef.textContent = "𝄢";
  }
  svg.appendChild(clef);

  // Notehead Position Calculation
  const noteX = 210;
  const refStep = card.clef === "treble" ? 2 : -10;
  const step = card.diatonicStep !== null ? card.diatonicStep : 0;
  const halfStepPx = spacing / 2;
  const noteY = staffBottom - (step - refStep) * halfStepPx;

  // Draw Ledger lines if necessary
  if (card.clef === "treble" && step <= 0) { // Below Treble Staff (Middle C, etc)
    for (let s = 0; s >= step; s -= 2) {
      const ly = staffBottom - (s - refStep) * halfStepPx;
      const lline = document.createElementNS("http://www.w3.org/2000/svg", "line");
      lline.setAttribute("x1", noteX - 16);
      lline.setAttribute("y1", ly);
      lline.setAttribute("x2", noteX + 16);
      lline.setAttribute("y2", ly);
      lline.setAttribute("stroke", "#475569");
      lline.setAttribute("stroke-width", "1.6");
      svg.appendChild(lline);
    }
  } else if (card.clef === "treble" && step >= 12) { // Above Treble Staff
    for (let s = 12; s <= step; s += 2) {
      const ly = staffBottom - (s - refStep) * halfStepPx;
      const lline = document.createElementNS("http://www.w3.org/2000/svg", "line");
      lline.setAttribute("x1", noteX - 16);
      lline.setAttribute("y1", ly);
      lline.setAttribute("x2", noteX + 16);
      lline.setAttribute("y2", ly);
      lline.setAttribute("stroke", "#475569");
      lline.setAttribute("stroke-width", "1.6");
      svg.appendChild(lline);
    }
  } else if (card.clef === "bass" && step >= 0) { // Above Bass Staff
    for (let s = 0; s <= step; s += 2) {
      const ly = staffBottom - (s - refStep) * halfStepPx;
      const lline = document.createElementNS("http://www.w3.org/2000/svg", "line");
      lline.setAttribute("x1", noteX - 16);
      lline.setAttribute("y1", ly);
      lline.setAttribute("x2", noteX + 16);
      lline.setAttribute("y2", ly);
      lline.setAttribute("stroke", "#475569");
      lline.setAttribute("stroke-width", "1.6");
      svg.appendChild(lline);
    }
  } else if (card.clef === "bass" && step <= -12) { // Below Bass Staff
    for (let s = -12; s >= step; s -= 2) {
      const ly = staffBottom - (s - refStep) * halfStepPx;
      const lline = document.createElementNS("http://www.w3.org/2000/svg", "line");
      lline.setAttribute("x1", noteX - 16);
      lline.setAttribute("y1", ly);
      lline.setAttribute("x2", noteX + 16);
      lline.setAttribute("y2", ly);
      lline.setAttribute("stroke", "#475569");
      lline.setAttribute("stroke-width", "1.6");
      svg.appendChild(lline);
    }
  }

  // Draw Accidental
  if (card.pitch.includes("#")) {
    const sharp = document.createElementNS("http://www.w3.org/2000/svg", "text");
    sharp.setAttribute("x", noteX - 22);
    sharp.setAttribute("y", noteY + 6);
    sharp.setAttribute("font-size", "24");
    sharp.setAttribute("fill", "#0284c7");
    sharp.setAttribute("font-family", "serif");
    sharp.textContent = "♯";
    svg.appendChild(sharp);
  } else if (card.pitch.includes("b")) {
    const flat = document.createElementNS("http://www.w3.org/2000/svg", "text");
    flat.setAttribute("x", noteX - 20);
    flat.setAttribute("y", noteY + 5);
    flat.setAttribute("font-size", "24");
    flat.setAttribute("fill", "#0284c7");
    flat.setAttribute("font-family", "serif");
    flat.textContent = "♭";
    svg.appendChild(flat);
  }

  // Notehead
  const head = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
  head.setAttribute("cx", noteX);
  head.setAttribute("cy", noteY);
  head.setAttribute("rx", "7.5");
  head.setAttribute("ry", "5.5");
  head.setAttribute("transform", `rotate(-20, ${noteX}, ${noteY})`);

  let headColor = "#0f172a";
  if (card.srsMastery === "mastered") headColor = "#0284c7";
  else if (card.srsMastery === "needs_practice") headColor = "#e11d48";
  else if (card.srsMastery === "learning") headColor = "#d97706";
  head.setAttribute("fill", headColor);
  svg.appendChild(head);

  // SRS Mastery Indicator Badge in SVG
  if (card.srsMastery && card.srsMastery !== "new") {
    const srsBadge = document.createElementNS("http://www.w3.org/2000/svg", "text");
    srsBadge.setAttribute("x", width - 42);
    srsBadge.setAttribute("y", staffTop - 6);
    srsBadge.setAttribute("font-size", "10");
    srsBadge.setAttribute("font-weight", "800");
    srsBadge.setAttribute("text-anchor", "end");
    srsBadge.setAttribute("fill", headColor);
    srsBadge.textContent = card.srsMastery === "mastered" ? "⭐ Mastered" : (card.srsMastery === "needs_practice" ? "🔥 Focus Note" : "⚡ Learning");
    svg.appendChild(srsBadge);
  }

  // Notestem
  const stem = document.createElementNS("http://www.w3.org/2000/svg", "line");
  const stemUp = step < (refStep + 4);
  if (stemUp) {
    stem.setAttribute("x1", noteX + 6.8);
    stem.setAttribute("y1", noteY);
    stem.setAttribute("x2", noteX + 6.8);
    stem.setAttribute("y2", noteY - 36);
  } else {
    stem.setAttribute("x1", noteX - 6.8);
    stem.setAttribute("y1", noteY);
    stem.setAttribute("x2", noteX - 6.8);
    stem.setAttribute("y2", noteY + 36);
  }
  stem.setAttribute("stroke", "#0f172a");
  stem.setAttribute("stroke-width", "2");
  svg.appendChild(stem);
}

function verifySightReadingInput(userAnswer) {
  if (!srCurrentCard) return;
  const targetLetter = srCurrentCard.noteLetter;
  const targetPitch = srCurrentCard.pitch;

  srStats.attempts++;

  // Check match: user can answer by letter ("C") or full pitch ("C4") or MIDI number
  const isMatch = (userAnswer === targetLetter) || (userAnswer === targetPitch) || (window.MusicTheory && window.MusicTheory.areEnharmonicEquivalent(userAnswer, targetPitch));

  const responseMs = performance.now() - srCardShownTime;
  if (window.MusicTheory && window.MusicTheory.recordSRSAttempt) {
    window.MusicTheory.recordSRSAttempt(targetPitch, isMatch, responseMs);
    updateSRSHudDisplay();
  }

  playTone(srCurrentCard.freq, 0.25);

  const btnEl = document.querySelector(`#srButtonsGrid .answer-btn[data-note="${targetLetter}"]`);

  if (isMatch) {
    srStats.correct++;
    srStats.solved++;
    srStats.streak++;
    if (srStats.streak > srStats.bestStreak) srStats.bestStreak = srStats.streak;

    if (btnEl) {
      btnEl.classList.add("correct-flash");
      setTimeout(() => btnEl.classList.remove("correct-flash"), 300);
    }
    document.getElementById("srPromptText").innerHTML = `<span style="color:#10b981;">✅ Correct! Note is <strong>${targetPitch}</strong></span>`;

    const mode = document.getElementById("srModeSelect").value;
    if (mode === "sprint" && srStats.solved >= 20) {
      stopSightReadingDrill();
      document.getElementById("srPromptText").innerHTML = `🎉 Sprint Finished! 20/20 in <strong>${getSRAccuracy()}%</strong> accuracy!`;
    } else {
      setTimeout(nextSightReadingCard, 280);
    }
  } else {
    srStats.streak = 0;
    const pressedBtn = document.querySelector(`#srButtonsGrid .answer-btn[data-note="${userAnswer.replace(/[0-9]/g, '')}"]`);
    if (pressedBtn) {
      pressedBtn.classList.add("wrong-flash");
      setTimeout(() => pressedBtn.classList.remove("wrong-flash"), 350);
    }
    document.getElementById("srPromptText").innerHTML = `<span style="color:#ef4444;">❌ That was ${userAnswer} — try <strong>${targetPitch}</strong>!</span>`;
  }

  updateSightReadingHUD();
}

function getSRAccuracy() {
  if (srStats.attempts === 0) return 100;
  return Math.round((srStats.correct / srStats.attempts) * 100);
}

function updateSightReadingHUD() {
  document.getElementById("srAccuracyDisplay").textContent = `${getSRAccuracy()}%`;
  const streakEl = document.getElementById("srStreakDisplay");
  if (streakEl) {
    streakEl.textContent = `${srStats.streak}`;
    streakEl.classList.toggle("hud-streak-hot", srStats.streak >= 5);
  }
  document.getElementById("srBestStreakDisplay").textContent = `${srStats.bestStreak}`;
  document.getElementById("srSolvedDisplay").textContent = `${srStats.solved}`;
}

// 3. EAR TRAINING & INTERVAL GYM ENGINE
function initEarTrainingModule() {
  document.querySelectorAll(".ear-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".ear-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      earSubmode = tab.dataset.submode;
      loadEarChallenge();
    });
  });

  document.getElementById("earPlaySoundBtn")?.addEventListener("click", playEarChallengeAudio);
  document.getElementById("earMnemonicHintBtn")?.addEventListener("click", () => {
    if (!earCurrentChallenge || earSubmode !== "interval_recognition") return;
    const banner = document.getElementById("earMnemonicBanner");
    if (banner) {
      banner.style.display = "block";
      banner.innerHTML = `🎶 <strong>Famous Song Hook:</strong> ${earCurrentChallenge.mnemonicAsc || "Listen for the interval step distance"} <span style="color:#c4b5fd;">(${earCurrentChallenge.feeling || earCurrentChallenge.consonance || "Harmonic interval"})</span>`;
    }
  });
}

function updateEarSRSHudDisplay() {
  const srsDisplay = document.getElementById("earSrsStatsDisplay");
  if (!srsDisplay || !window.MusicTheory) return;
  const stats = window.MusicTheory.getAllSRSStats();
  const keys = Object.keys(stats);
  if (keys.length === 0) {
    srsDisplay.textContent = "Adaptive";
    return;
  }
  const masteredCount = keys.filter(k => window.MusicTheory.getSRSMasteryLevel(k) === "mastered").length;
  srsDisplay.textContent = `${masteredCount} Mastered`;
}

function loadEarChallenge() {
  if (!window.MusicTheory) return;
  earCurrentChallenge = window.MusicTheory.generateEarTrainingChallenge(earSubmode, true);
  earChallengeShownTime = performance.now();
  const promptEl = document.getElementById("earPromptText");
  const titleEl = document.getElementById("earSubmodeTitle");
  const feedbackEl = document.getElementById("earFeedbackBanner");
  const grid = document.getElementById("earOptionsGrid");
  const mnemonicRow = document.getElementById("earMnemonicCoachRow");
  const mnemonicBanner = document.getElementById("earMnemonicBanner");

  grid.innerHTML = "";
  feedbackEl.textContent = "Click 'Hear Sound' (or Spacebar) to listen.";
  feedbackEl.style.color = "#94a3b8";
  if (mnemonicBanner) mnemonicBanner.style.display = "none";

  if (earSubmode === "pitch_match") {
    if (mnemonicRow) mnemonicRow.style.display = "none";
    titleEl.textContent = "Ear Training: Single Pitch Reproduction";
    promptEl.textContent = "Listen to the note, then play it on your keyboard or piano!";
    grid.innerHTML = `<div style="color:var(--text-muted); font-size:0.9rem;">Play the matching key on your piano keyboard or MIDI device to answer!</div>`;
  } else if (earSubmode === "interval_recognition") {
    if (mnemonicRow) mnemonicRow.style.display = "flex";
    titleEl.textContent = "Ear Training: Relative Interval Identification";
    promptEl.textContent = "Listen to the two notes in sequence. Which interval was played?";
    earCurrentChallenge.options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "ear-opt-btn";
      btn.textContent = opt;
      btn.addEventListener("click", () => verifyEarTrainingChoice(opt));
      grid.appendChild(btn);
    });
  } else if (earSubmode === "chord_quality") {
    if (mnemonicRow) mnemonicRow.style.display = "none";
    titleEl.textContent = "Ear Training: Major vs. Minor Triad Quality";
    promptEl.textContent = "Listen to the triad chord. Does it sound bright (Major) or somber (Minor)?";
    earCurrentChallenge.options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "ear-opt-btn";
      btn.textContent = opt;
      btn.addEventListener("click", () => verifyEarTrainingChoice(opt));
      grid.appendChild(btn);
    });
  }

  updateEarSRSHudDisplay();
  playEarChallengeAudio();
}

function playEarChallengeAudio() {
  if (!earCurrentChallenge) return;
  initAudio();

  const soundBtn = document.getElementById("earPlaySoundBtn");
  if (soundBtn) {
    soundBtn.classList.remove("playing-sound-pulse");
    void soundBtn.offsetWidth;
    soundBtn.classList.add("playing-sound-pulse");
    setTimeout(() => soundBtn.classList.remove("playing-sound-pulse"), 850);
  }

  if (earSubmode === "pitch_match") {
    playTone(earCurrentChallenge.freq, 0.6);
  } else if (earSubmode === "interval_recognition") {
    const rootFreq = window.MusicTheory.midiToFreq(earCurrentChallenge.rootMidi);
    const targetFreq = window.MusicTheory.midiToFreq(earCurrentChallenge.targetMidi);
    playTone(rootFreq, 0.45);
    setTimeout(() => playTone(targetFreq, 0.6), 480);
  } else if (earSubmode === "chord_quality") {
    earCurrentChallenge.chord.freqs.forEach(f => playTone(f, 0.8));
  }
}

function verifyEarTrainingChoice(choice) {
  if (!earCurrentChallenge) return;
  earStats.attempts++;
  const elapsedMs = earChallengeShownTime ? Math.round(performance.now() - earChallengeShownTime) : 1500;
  const feedbackEl = document.getElementById("earFeedbackBanner");

  let correct = false;
  let explanation = "";

  if (earSubmode === "interval_recognition") {
    correct = (choice === earCurrentChallenge.correctInterval);
    const hook = earCurrentChallenge.mnemonicAsc ? ` · 🎵 <em>${earCurrentChallenge.mnemonicAsc}</em>` : "";
    explanation = `The interval from <strong>${earCurrentChallenge.rootPitch}</strong> to <strong>${earCurrentChallenge.targetPitch}</strong> is a <strong>${earCurrentChallenge.correctInterval}</strong>${hook}!`;
    highlightPlaybackKey(earCurrentChallenge.rootPitch, "rh", 1200);
    highlightPlaybackKey(earCurrentChallenge.targetPitch, "dyad", 1200);
  } else if (earSubmode === "chord_quality") {
    correct = (choice === earCurrentChallenge.correctQuality);
    const mood = earCurrentChallenge.chord.mood ? ` (${earCurrentChallenge.chord.mood})` : "";
    explanation = `That was a <strong>${earCurrentChallenge.chord.fullName}</strong> chord${mood}!`;
    (earCurrentChallenge.chord.pitches || []).forEach(p => highlightPlaybackKey(p, "dyad", 1200));
  }

  if (window.MusicTheory && earCurrentChallenge.srsKey) {
    window.MusicTheory.recordSRSAttempt(earCurrentChallenge.srsKey, correct, elapsedMs);
  }

  if (correct) {
    earStats.correct++;
    earStats.streak++;
    feedbackEl.style.color = "#34d399";
    feedbackEl.innerHTML = `✅ Brilliant! ${explanation} (${(elapsedMs / 1000).toFixed(1)}s)`;
    setTimeout(loadEarChallenge, 1750);
  } else {
    earStats.streak = 0;
    feedbackEl.style.color = "#f87171";
    feedbackEl.innerHTML = `❌ Incorrect. ${explanation}`;
    setTimeout(playEarChallengeAudio, 1400);
  }
  updateEarStatsHUD();
}

function verifyEarTrainingPitchInput(pitchName) {
  if (earSubmode !== "pitch_match" || !earCurrentChallenge) return;
  earStats.attempts++;
  const elapsedMs = earChallengeShownTime ? Math.round(performance.now() - earChallengeShownTime) : 1500;
  playTone(window.MusicTheory.pitchToFreq(pitchName), 0.4);

  const target = earCurrentChallenge.targetPitch;
  const feedbackEl = document.getElementById("earFeedbackBanner");
  const isMatch = (pitchName === target) || (window.MusicTheory && window.MusicTheory.areEnharmonicEquivalent(pitchName, target));

  if (window.MusicTheory && (earCurrentChallenge.srsKey || target)) {
    window.MusicTheory.recordSRSAttempt(earCurrentChallenge.srsKey || target, isMatch, elapsedMs);
  }

  if (isMatch) {
    earStats.correct++;
    earStats.streak++;
    feedbackEl.style.color = "#34d399";
    feedbackEl.innerHTML = `✅ Spot on! You played <strong>${target}</strong> (${(elapsedMs / 1000).toFixed(1)}s)!`;
    setTimeout(loadEarChallenge, 1400);
  } else {
    earStats.streak = 0;
    feedbackEl.style.color = "#f87171";
    feedbackEl.innerHTML = `❌ You played ${pitchName} — target was <strong>${target}</strong>!`;
  }
  updateEarStatsHUD();
}

function updateEarStatsHUD() {
  const acc = earStats.attempts === 0 ? 100 : Math.round((earStats.correct / earStats.attempts) * 100);
  document.getElementById("earAccuracy").textContent = `${acc}%`;
  const streakEl = document.getElementById("earStreak");
  if (streakEl) {
    streakEl.textContent = `${earStats.streak}`;
    streakEl.classList.toggle("hud-streak-hot", earStats.streak >= 5);
  }
  document.getElementById("earScore").textContent = `${earStats.correct}`;
  updateEarSRSHudDisplay();
}

// 4. SCALES, CHORDS & VOICE-LEADING STUDIO ENGINE
function initScalesModule() {
  document.querySelectorAll("#tonicSelectorRow .tonic-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#tonicSelectorRow .tonic-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTonic = btn.dataset.tonic;
      updateScaleDisplay();
    });
  });

  document.querySelectorAll("#scaleFormulaPills .scale-pill-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#scaleFormulaPills .scale-pill-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentScaleFormula = btn.dataset.scale;
      updateScaleDisplay();
    });
  });

  document.getElementById("scaleHandSelect")?.addEventListener("change", (e) => {
    currentScaleHand = e.target.value || "rh";
    if (isScalePracticeActive) toggleScalePractice();
    updateScaleDisplay();
  });

  document.getElementById("scaleDirectionSelect")?.addEventListener("change", (e) => {
    currentScaleDirection = e.target.value || "asc";
    if (isScalePracticeActive) toggleScalePractice();
    updateScaleDisplay();
  });

  document.getElementById("scaleListenBtn")?.addEventListener("click", playScaleSequence);
  document.getElementById("scalePracticeBtn")?.addEventListener("click", toggleScalePractice);
  initVoiceLeadingModule();
  initChordLabModule();
}

function updateScaleDisplay() {
  if (!window.MusicTheory) return;
  const startOct = currentScaleHand === "lh" ? 3 : 4;
  currentScaleObj = window.MusicTheory.generateScale(currentTonic, currentScaleFormula, startOct);
  if (!currentScaleObj) return;

  document.getElementById("scaleDisplayTitle").textContent = `${currentScaleObj.name} (${currentScaleHand === "lh" ? "Left Hand · Bass Clef" : "Right Hand · Treble Clef"})`;
  document.getElementById("scaleDescriptionText").textContent = currentScaleObj.description;

  const formulaEl = document.getElementById("scaleFormulaFormula");
  if (formulaEl) {
    formulaEl.textContent = `Formula: ${currentScaleObj.stepFormula || "W - W - H - W - W - W - H"}`;
  }

  // Build practice sequence according to direction
  const baseNotes = currentScaleObj.notes;
  currentScalePracticeSeq = currentScaleDirection === "asc_desc"
    ? [...baseNotes, ...[...baseNotes].reverse().slice(1)]
    : [...baseNotes];

  // Update thumb-tuck / finger-crossing coaching banner
  const tuckTextEl = document.getElementById("scaleThumbTuckText");
  if (tuckTextEl) {
    const transitions = baseNotes.filter(n => currentScaleHand === "lh" ? n.lhTransition : n.rhTransition);
    if (transitions.length > 0) {
      const tNote = transitions[0];
      const rawIdx = typeof tNote.degreeIndex === "number" ? tNote.degreeIndex : baseNotes.indexOf(tNote);
      const prevNote = baseNotes[Math.max(0, rawIdx - 1)] || tNote;
      if (currentScaleHand === "lh") {
        tuckTextEl.innerHTML = `<strong>Left Hand Crossover:</strong> Play <strong>${prevNote.pitch}</strong> with finger ${prevNote.lhFinger || 1}, then smoothly cross <strong>Finger ${tNote.lhFinger}</strong> over onto <strong>${tNote.pitch}</strong>!`;
      } else {
        tuckTextEl.innerHTML = `<strong>Right Hand Thumb-Tuck:</strong> After playing <strong>${prevNote.pitch}</strong> with finger ${prevNote.rhFinger || 3}, tuck your <strong>Thumb (1)</strong> smoothly underneath onto <strong>${tNote.pitch}</strong> to keep your hand level!`;
      }
    } else {
      tuckTextEl.textContent = `Keep your wrist relaxed and fingers curved as you walk through ${currentScaleObj.name}.`;
    }
  }

  // Render fingering badges with Solfege & Thumb-Tuck highlight
  const fRow = document.getElementById("scaleFingeringRow");
  fRow.innerHTML = "";
  baseNotes.forEach(n => {
    const b = document.createElement("div");
    const hasTrans = currentScaleHand === "lh" ? Boolean(n.lhTransition) : Boolean(n.rhTransition);
    b.className = "finger-badge" + (hasTrans ? " thumb-tuck-highlight" : "");
    const transLabel = hasTrans
      ? `<span class="fb-tuck-tag">${currentScaleHand === "lh" ? "↪ Cross" : "⚡ Tuck 1"}</span>`
      : "";
    b.innerHTML = `
      <span class="fb-pitch">${n.pitch}</span>
      <span class="fb-solfege">${n.degree || ""} · ${n.solfege || ""}</span>
      <span class="fb-rh">RH: ${n.rhFinger}</span>
      <span class="fb-lh">LH: ${n.lhFinger}</span>
      ${transLabel}
    `;
    fRow.appendChild(b);
  });

  // Highlight keyboard keys for this scale
  document.querySelectorAll(".piano-key").forEach(k => k.classList.remove("active-rh", "active-lh", "active-dyad"));
  const highlightClass = currentScaleHand === "lh" ? "active-lh" : "active-rh";
  baseNotes.forEach(n => {
    const keyEl = document.querySelector(`.piano-key[data-note="${n.pitch}"]`);
    if (keyEl) keyEl.classList.add(highlightClass);
  });

  renderScaleSvg(currentScaleObj);
}

function renderScaleSvg(scaleObj) {
  const svg = document.getElementById("scaleScoreSvg");
  if (!svg || !scaleObj) return;
  svg.innerHTML = "";

  const width = 900;
  const staffTop = 35;
  const spacing = 11;
  const staffBottom = staffTop + 4 * spacing;
  const isBass = currentScaleHand === "lh";
  const refStep = isBass ? -10 : 2;

  // Draw 5 staff lines
  for (let i = 0; i < 5; i++) {
    const y = staffTop + i * spacing;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", "40");
    line.setAttribute("y1", y);
    line.setAttribute("x2", width - 40);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", "#94a3b8");
    line.setAttribute("stroke-width", "1.2");
    svg.appendChild(line);
  }

  // Clef
  const clef = document.createElementNS("http://www.w3.org/2000/svg", "text");
  clef.setAttribute("x", "50");
  clef.setAttribute("y", isBass ? staffTop + 32 : staffBottom - 2);
  clef.setAttribute("font-size", isBass ? "40" : "48");
  clef.setAttribute("class", "clef-text");
  clef.textContent = isBass ? "𝄢" : "𝄞";
  svg.appendChild(clef);

  // Distribute scale notes horizontally
  const seqNotes = currentScalePracticeSeq.length > 0 ? currentScalePracticeSeq : scaleObj.notes;
  const count = seqNotes.length;
  const stepX = (width - 180) / Math.max(1, count);

  seqNotes.forEach((note, idx) => {
    const cx = 130 + idx * stepX;
    const step = window.MusicTheory.getDiatonicStep(note.pitch);
    const validStep = step !== null ? step : refStep;
    const cy = staffBottom - (validStep - refStep) * (spacing / 2);

    // Ledger lines
    if (!isBass && validStep <= 0) {
      for (let s = 0; s >= validStep; s -= 2) {
        const ly = staffBottom - (s - refStep) * (spacing / 2);
        const lline = document.createElementNS("http://www.w3.org/2000/svg", "line");
        lline.setAttribute("x1", cx - 12);
        lline.setAttribute("y1", ly);
        lline.setAttribute("x2", cx + 12);
        lline.setAttribute("y2", ly);
        lline.setAttribute("stroke", "#94a3b8");
        lline.setAttribute("stroke-width", "1.4");
        svg.appendChild(lline);
      }
    } else if (isBass && validStep >= 0) {
      for (let s = 0; s <= validStep; s += 2) {
        const ly = staffBottom - (s - refStep) * (spacing / 2);
        const lline = document.createElementNS("http://www.w3.org/2000/svg", "line");
        lline.setAttribute("x1", cx - 12);
        lline.setAttribute("y1", ly);
        lline.setAttribute("x2", cx + 12);
        lline.setAttribute("y2", ly);
        lline.setAttribute("stroke", "#94a3b8");
        lline.setAttribute("stroke-width", "1.4");
        svg.appendChild(lline);
      }
    }

    // Accidental
    if (note.pitch.includes("#")) {
      const acc = document.createElementNS("http://www.w3.org/2000/svg", "text");
      acc.setAttribute("x", cx - 15);
      acc.setAttribute("y", cy + 5);
      acc.setAttribute("font-size", "18");
      acc.setAttribute("fill", "#0284c7");
      acc.textContent = "♯";
      svg.appendChild(acc);
    } else if (note.pitch.includes("b")) {
      const acc = document.createElementNS("http://www.w3.org/2000/svg", "text");
      acc.setAttribute("x", cx - 14);
      acc.setAttribute("y", cy + 4);
      acc.setAttribute("font-size", "18");
      acc.setAttribute("fill", "#0284c7");
      acc.textContent = "♭";
      svg.appendChild(acc);
    }

    const hasTrans = (idx < scaleObj.notes.length) && (isBass ? Boolean(note.lhTransition) : Boolean(note.rhTransition));

    // Notehead
    const head = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    head.setAttribute("id", `scale_notehead_${idx}`);
    head.setAttribute("cx", cx);
    head.setAttribute("cy", cy);
    head.setAttribute("rx", "6.2");
    head.setAttribute("ry", "4.5");
    head.setAttribute("transform", `rotate(-20, ${cx}, ${cy})`);
    head.setAttribute("fill", hasTrans ? "#d97706" : "#1e293b");
    svg.appendChild(head);

    // Solfege / Finger above staff
    const fingerNum = isBass ? note.lhFinger : note.rhFinger;
    const topLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    topLabel.setAttribute("x", cx);
    topLabel.setAttribute("y", staffTop - 10);
    topLabel.setAttribute("font-size", "10");
    topLabel.setAttribute("font-weight", "800");
    topLabel.setAttribute("text-anchor", "middle");
    topLabel.setAttribute("fill", hasTrans ? "#d97706" : "#64748b");
    topLabel.textContent = hasTrans ? `⚡${fingerNum}` : `${fingerNum}`;
    svg.appendChild(topLabel);

    // Pitch + Solfege label below staff
    const deg = document.createElementNS("http://www.w3.org/2000/svg", "text");
    deg.setAttribute("x", cx);
    deg.setAttribute("y", staffBottom + 32);
    deg.setAttribute("font-size", "10.5");
    deg.setAttribute("font-weight", "800");
    deg.setAttribute("text-anchor", "middle");
    deg.setAttribute("fill", "#0284c7");
    deg.textContent = note.solfege ? `${note.pitch} (${note.solfege})` : note.pitch;
    svg.appendChild(deg);
  });
}

function playScaleSequence() {
  if (!currentScaleObj) return;
  initAudio();
  const notes = currentScaleObj.notes;
  const fullSeq = currentScaleDirection === "asc"
    ? [...notes, ...[...notes].reverse().slice(1)]
    : currentScalePracticeSeq;
  let delay = 0;
  const handRole = currentScaleHand === "lh" ? "lh" : "rh";

  fullSeq.forEach((n) => {
    setTimeout(() => {
      playTone(n.freq, 0.35);
      highlightPlaybackKey(n.pitch, handRole, 320);
    }, delay);
    delay += 320;
  });
}

function toggleScalePractice() {
  isScalePracticeActive = !isScalePracticeActive;
  scalePracticeStepIdx = 0;
  const btn = document.getElementById("scalePracticeBtn");
  if (btn) btn.textContent = isScalePracticeActive ? "■ Stop Practice" : "🎯 Practice Scale";
  const desc = document.getElementById("scaleDescriptionText");

  if (isScalePracticeActive && currentScalePracticeSeq.length > 0) {
    highlightScalePracticeNote(0);
    const firstN = currentScalePracticeSeq[0];
    const fNum = currentScaleHand === "lh" ? firstN.lhFinger : firstN.rhFinger;
    desc.innerHTML = `<strong>Practice Started:</strong> Play the amber note on your piano keyboard: <strong>${firstN.pitch}</strong> (${currentScaleHand.toUpperCase()} Finger ${fNum}, Solfège: ${firstN.solfege || "Do"})`;
  } else {
    updateScaleDisplay();
  }
}

function highlightScalePracticeNote(idx) {
  document.querySelectorAll("#scaleScoreSvg ellipse").forEach(e => e.setAttribute("fill", "#1e293b"));
  const targetHead = document.getElementById(`scale_notehead_${idx}`);
  if (targetHead) targetHead.setAttribute("fill", "#f59e0b");
}

function verifyScalePracticeInput(pitchName) {
  if (!isScalePracticeActive || !currentScalePracticeSeq.length) return;
  const targetNote = currentScalePracticeSeq[scalePracticeStepIdx];
  if (!targetNote) return;

  const isMatch = (pitchName === targetNote.pitch) || (window.MusicTheory && window.MusicTheory.areEnharmonicEquivalent(pitchName, targetNote.pitch));
  playTone(window.MusicTheory.pitchToFreq(pitchName), 0.3);

  if (isMatch) {
    scalePracticeStepIdx++;
    if (scalePracticeStepIdx >= currentScalePracticeSeq.length) {
      scalePracticeStepIdx = 0;
      document.getElementById("scaleDescriptionText").innerHTML = `🎉 Superb! You completed the <strong>${currentScaleObj.name}</strong>! Ready for another pass!`;
    } else {
      const nextN = currentScalePracticeSeq[scalePracticeStepIdx];
      const fNum = currentScaleHand === "lh" ? nextN.lhFinger : nextN.rhFinger;
      const transHint = (currentScaleHand === "lh" ? nextN.lhTransition : nextN.rhTransition)
        ? ` — ⚡ <strong>${currentScaleHand === "lh" ? nextN.lhTransition : nextN.rhTransition}!</strong>`
        : "";
      document.getElementById("scaleDescriptionText").innerHTML = `✅ Nice! Now play <strong>${nextN.pitch}</strong> (${currentScaleHand.toUpperCase()} Finger ${fNum} · ${nextN.solfege || ""})${transHint}`;
    }
    highlightScalePracticeNote(scalePracticeStepIdx);
  }
}

function initVoiceLeadingModule() {
  // Submode switcher (Scales / Voice-Leading / Chord Builder Lab)
  const btnScales = document.getElementById("btnSubmodeScales");
  const btnVL = document.getElementById("btnSubmodeVoiceLeading");
  const btnChordLab = document.getElementById("btnSubmodeChordLab");
  const subviewScales = document.getElementById("subviewScales");
  const subviewVL = document.getElementById("subviewVoiceLeading");
  const subviewChordLab = document.getElementById("subviewChordLab");

  function switchScalesPanelSubmode(mode) {
    if (isScalePracticeActive) toggleScalePractice();
    if (isVlPracticeActive) toggleVoiceLeadingPractice();
    if (isChordLabPracticeActive) toggleChordLabPractice();

    isVoiceLeadingActive = (mode === "vl");
    isChordLabActive = (mode === "chordlab");

    btnScales?.classList.toggle("active", mode === "scales");
    btnVL?.classList.toggle("active", mode === "vl");
    btnChordLab?.classList.toggle("active", mode === "chordlab");

    if (subviewScales) subviewScales.style.display = (mode === "scales") ? "block" : "none";
    if (subviewVL) subviewVL.style.display = (mode === "vl") ? "block" : "none";
    if (subviewChordLab) subviewChordLab.style.display = (mode === "chordlab") ? "block" : "none";

    if (mode === "scales") updateScaleDisplay();
    else if (mode === "vl") updateVoiceLeadingDisplay();
    else if (mode === "chordlab") updateChordLabDisplay();
  }

  btnScales?.addEventListener("click", () => switchScalesPanelSubmode("scales"));
  btnVL?.addEventListener("click", () => switchScalesPanelSubmode("vl"));
  btnChordLab?.addEventListener("click", () => switchScalesPanelSubmode("chordlab"));

  // Key Selectors
  document.querySelectorAll("#vlKeySelectorRow .tonic-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#vlKeySelectorRow .tonic-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentVlKey = btn.dataset.key;
      currentVlStepIdx = 0;
      updateVoiceLeadingDisplay();
    });
  });

  // Progression Selectors
  document.querySelectorAll("#vlProgressionPills .scale-pill-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#vlProgressionPills .scale-pill-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentVlProg = btn.dataset.prog;
      currentVlStepIdx = 0;
      updateVoiceLeadingDisplay();
    });
  });

  document.getElementById("vlListenBtn")?.addEventListener("click", playVoiceLeadingProgression);
  document.getElementById("vlPracticeBtn")?.addEventListener("click", toggleVoiceLeadingPractice);
}

function initChordLabModule() {
  document.querySelectorAll("#chordLabRootRow .tonic-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#chordLabRootRow .tonic-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentChordLabRoot = btn.dataset.root;
      updateChordLabDisplay();
    });
  });

  document.querySelectorAll("#chordLabTypePills .scale-pill-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#chordLabTypePills .scale-pill-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentChordLabType = btn.dataset.chordtype || btn.dataset.chordType || "major";
      updateChordLabDisplay();
    });
  });

  document.querySelectorAll("#chordLabInversionRow .scale-pill-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#chordLabInversionRow .scale-pill-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentChordLabInversion = parseInt(btn.dataset.inv, 10) || 0;
      updateChordLabDisplay();
    });
  });

  document.getElementById("chordLabListenBtn")?.addEventListener("click", playChordLabSequence);
  document.getElementById("chordLabPracticeBtn")?.addEventListener("click", toggleChordLabPractice);
}

function updateChordLabDisplay() {
  if (!window.MusicTheory || !window.MusicTheory.getChordConstructionRecipe) return;
  currentChordLabRecipe = window.MusicTheory.getChordConstructionRecipe(currentChordLabRoot, currentChordLabType, 4, currentChordLabInversion);
  if (!currentChordLabRecipe) return;

  const invNames = ["Root Position", "1st Inversion", "2nd Inversion"];
  const titleEl = document.getElementById("chordLabDisplayTitle");
  if (titleEl) titleEl.textContent = `${currentChordLabRecipe.symbol} — ${currentChordLabRecipe.typeName} (${invNames[currentChordLabInversion] || "Root Position"})`;

  const notesListEl = document.getElementById("chordLabNotesList");
  if (notesListEl) {
    notesListEl.textContent = `Notes: ${currentChordLabRecipe.pitches.join(" + ")} (Bass: ${currentChordLabRecipe.lhBassPitch})`;
  }

  const recipeTextEl = document.getElementById("chordLabRecipeText");
  if (recipeTextEl) recipeTextEl.textContent = currentChordLabRecipe.recipe;

  const mathTextEl = document.getElementById("chordLabMathText");
  if (mathTextEl) mathTextEl.textContent = currentChordLabRecipe.stepMath;

  const fingersTextEl = document.getElementById("chordLabFingersText");
  if (fingersTextEl) {
    fingersTextEl.textContent = `RH: ${currentChordLabRecipe.rhFingers.join(" – ")} | LH: ${currentChordLabRecipe.lhFingers.join(" – ")}`;
  }

  const moodEl = document.getElementById("chordLabMoodText");
  if (moodEl) {
    moodEl.textContent = currentChordLabRecipe.mood;
  }

  const feedbackEl = document.getElementById("chordLabFeedbackText");
  if (feedbackEl && !isChordLabPracticeActive) {
    feedbackEl.innerHTML = `Click <strong>"▶ Arpeggiate & Block Play"</strong> to hear each interval stack, or click <strong>"🎯 Practice Chord on Piano"</strong> to build <strong>${currentChordLabRecipe.pitches.join(" + ")}</strong> on your keyboard!`;
  }

  document.querySelectorAll(".piano-key").forEach(k => k.classList.remove("active-rh", "active-lh", "active-dyad"));
  currentChordLabRecipe.pitches.forEach((p, idx) => {
    const keyEl = document.querySelector(`.piano-key[data-note="${p}"]`);
    if (keyEl) keyEl.classList.add(idx === 0 ? "active-rh" : "active-dyad");
  });

  renderChordLabSvg(currentChordLabRecipe);
}

function renderChordLabSvg(recipe) {
  const svg = document.getElementById("chordLabScoreSvg");
  if (!svg || !recipe) return;
  svg.innerHTML = "";

  const width = 900;
  const staffTop = 30;
  const spacing = 11;
  const staffBottom = staffTop + 4 * spacing;

  for (let i = 0; i < 5; i++) {
    const y = staffTop + i * spacing;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", "40");
    line.setAttribute("y1", y);
    line.setAttribute("x2", width - 40);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", "#94a3b8");
    line.setAttribute("stroke-width", "1.2");
    svg.appendChild(line);
  }

  const clef = document.createElementNS("http://www.w3.org/2000/svg", "text");
  clef.setAttribute("x", "50");
  clef.setAttribute("y", staffBottom - 2);
  clef.setAttribute("font-size", "48");
  clef.setAttribute("class", "clef-text");
  clef.textContent = "𝄞";
  svg.appendChild(clef);

  // Draw Arpeggio notes on left half + Stacked Block Chord on right half
  const tones = recipe.tones || [];
  tones.forEach((t, idx) => {
    const cx = 170 + idx * 115;
    const step = window.MusicTheory.getDiatonicStep(t.pitch) || 0;
    const cy = staffBottom - (step - 2) * (spacing / 2);

    if (step <= 0) {
      for (let s = 0; s >= step; s -= 2) {
        const ly = staffBottom - (s - 2) * (spacing / 2);
        const lline = document.createElementNS("http://www.w3.org/2000/svg", "line");
        lline.setAttribute("x1", cx - 12);
        lline.setAttribute("y1", ly);
        lline.setAttribute("x2", cx + 12);
        lline.setAttribute("y2", ly);
        lline.setAttribute("stroke", "#94a3b8");
        lline.setAttribute("stroke-width", "1.4");
        svg.appendChild(lline);
      }
    }

    if (t.pitch.includes("#") || t.pitch.includes("b")) {
      const acc = document.createElementNS("http://www.w3.org/2000/svg", "text");
      acc.setAttribute("x", cx - 16);
      acc.setAttribute("y", cy + 5);
      acc.setAttribute("font-size", "18");
      acc.setAttribute("fill", "#0284c7");
      acc.textContent = t.pitch.includes("#") ? "♯" : "♭";
      svg.appendChild(acc);
    }

    const head = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    head.setAttribute("cx", cx);
    head.setAttribute("cy", cy);
    head.setAttribute("rx", "6.5");
    head.setAttribute("ry", "4.8");
    head.setAttribute("transform", `rotate(-20, ${cx}, ${cy})`);
    head.setAttribute("fill", idx === 0 ? "#0284c7" : "#7c3aed");
    svg.appendChild(head);

    const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    lbl.setAttribute("x", cx);
    lbl.setAttribute("y", staffBottom + 28);
    lbl.setAttribute("font-size", "11");
    lbl.setAttribute("font-weight", "800");
    lbl.setAttribute("text-anchor", "middle");
    lbl.setAttribute("fill", "#1e293b");
    lbl.textContent = `${t.pitch} (RH ${t.rhFinger})`;
    svg.appendChild(lbl);
  });

  // Block chord stack on right side
  const stackX = 700;
  tones.forEach((t, idx) => {
    const step = window.MusicTheory.getDiatonicStep(t.pitch) || 0;
    const cy = staffBottom - (step - 2) * (spacing / 2);
    if (step <= 0) {
      const ly = staffBottom - (0 - 2) * (spacing / 2);
      const lline = document.createElementNS("http://www.w3.org/2000/svg", "line");
      lline.setAttribute("x1", stackX - 14);
      lline.setAttribute("y1", ly);
      lline.setAttribute("x2", stackX + 14);
      lline.setAttribute("y2", ly);
      lline.setAttribute("stroke", "#94a3b8");
      lline.setAttribute("stroke-width", "1.4");
      svg.appendChild(lline);
    }
    const head = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    head.setAttribute("cx", stackX);
    head.setAttribute("cy", cy);
    head.setAttribute("rx", "6.8");
    head.setAttribute("ry", "4.8");
    head.setAttribute("transform", `rotate(-20, ${stackX}, ${cy})`);
    head.setAttribute("fill", idx === 0 ? "#0284c7" : "#a855f7");
    svg.appendChild(head);
  });

  const stackLbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
  stackLbl.setAttribute("x", stackX);
  stackLbl.setAttribute("y", staffBottom + 28);
  stackLbl.setAttribute("font-size", "11.5");
  stackLbl.setAttribute("font-weight", "800");
  stackLbl.setAttribute("text-anchor", "middle");
  stackLbl.setAttribute("fill", "#7c3aed");
  stackLbl.textContent = `${recipe.symbol} Block Voicing`;
  svg.appendChild(stackLbl);
}

function playChordLabSequence() {
  if (!currentChordLabRecipe) return;
  initAudio();
  let delay = 0;
  currentChordLabRecipe.tones.forEach((t, idx) => {
    setTimeout(() => {
      playTone(t.freq, 0.45);
      highlightPlaybackKey(t.pitch, idx === 0 ? "rh" : "dyad", 400);
    }, delay);
    delay += 340;
  });
  setTimeout(() => {
    currentChordLabRecipe.tones.forEach((t, idx) => {
      playTone(t.freq, 0.9);
      highlightPlaybackKey(t.pitch, idx === 0 ? "rh" : "dyad", 850);
    });
  }, delay + 120);
}

function toggleChordLabPractice() {
  isChordLabPracticeActive = !isChordLabPracticeActive;
  chordLabFulfilledPitches.clear();
  const btn = document.getElementById("chordLabPracticeBtn");
  if (btn) btn.textContent = isChordLabPracticeActive ? "■ Stop Practice" : "🎯 Practice Chord";
  const moodEl = document.getElementById("chordLabMoodText");
  if (isChordLabPracticeActive && currentChordLabRecipe) {
    if (moodEl) {
      moodEl.innerHTML = `🎯 <strong>Play all notes of ${currentChordLabRecipe.fullName}:</strong> <strong>${currentChordLabRecipe.pitches.join(" + ")}</strong> on your keyboard!`;
    }
  } else {
    updateChordLabDisplay();
  }
}

function verifyChordLabInput(pitchName) {
  if (!isChordLabPracticeActive || !currentChordLabRecipe) return;
  const expected = currentChordLabRecipe.pitches || [];
  const isMatch = expected.some(p => p === pitchName || (window.MusicTheory && window.MusicTheory.areEnharmonicEquivalent(p, pitchName)));
  playTone(window.MusicTheory.pitchToFreq(pitchName), 0.35);

  if (isMatch) {
    chordLabFulfilledPitches.add(pitchName);
    const remaining = expected.filter(p => !chordLabFulfilledPitches.has(p) && !(window.MusicTheory && Array.from(chordLabFulfilledPitches).some(fp => window.MusicTheory.areEnharmonicEquivalent(fp, p))));
    const moodEl = document.getElementById("chordLabMoodText");
    if (remaining.length === 0) {
      chordLabFulfilledPitches.clear();
      currentChordLabRecipe.tones.forEach(t => playTone(t.freq, 0.8));
      if (moodEl) {
        moodEl.innerHTML = `🎉 <strong style="color:#34d399;">Chord Mastered!</strong> You built <strong>${currentChordLabRecipe.fullName}</strong> (${expected.join(" + ")})! Try another inversion or chord quality!`;
      }
    } else if (moodEl) {
      moodEl.innerHTML = `✅ Locked <strong>${pitchName}</strong> — now play: <strong>${remaining.join(" + ")}</strong>`;
    }
  }
}

function updateVoiceLeadingDisplay() {
  if (!window.MusicTheory || !window.MusicTheory.optimizeProgressionVoiceLeading) return;
  currentVlData = window.MusicTheory.optimizeProgressionVoiceLeading(currentVlKey, currentVlProg);
  if (!currentVlData) return;

  document.getElementById("vlDisplayTitle").textContent = `${currentVlKey} – ${currentVlData.progressionName}`;
  document.getElementById("vlDescriptionText").textContent = currentVlData.description;

  const efficiencyAdjective = currentVlData.totalMovement <= 5 ? "🌟 Buttery Smooth Voice-Leading!" : (currentVlData.totalMovement <= 10 ? "✨ Smooth Voice-Leading" : "🎵 Standard Inversions");
  document.getElementById("vlSmoothnessText").textContent = `Voice-Leading Efficiency: ${currentVlData.totalMovement} semitones total finger motion across ${currentVlData.steps.length} chords (${efficiencyAdjective})`;

  // Render cards
  const cardsContainer = document.getElementById("vlProgressionCards");
  if (cardsContainer) {
    cardsContainer.innerHTML = "";
    currentVlData.steps.forEach((step, idx) => {
      const card = document.createElement("div");
      card.className = `vl-chord-card ${idx === currentVlStepIdx ? 'active' : ''} ${idx < currentVlStepIdx ? 'completed' : ''}`;
      card.id = `vl_card_${idx}`;
      card.innerHTML = `
        <div class="vl-numeral">${step.numeral}</div>
        <div class="vl-chord-name">${step.chordName}</div>
        <div class="vl-voicing-tag">${step.voicingName}</div>
        <div class="vl-movement-tag">${idx === 0 ? 'Home Voicing' : `+${step.semitoneMovement} st`}</div>
      `;
      card.addEventListener("click", () => {
        currentVlStepIdx = idx;
        highlightVoiceLeadingStep(idx);
        playChordVoicing(step);
      });
      cardsContainer.appendChild(card);

      if (idx < currentVlData.steps.length - 1) {
        const arrow = document.createElement("div");
        arrow.className = "vl-arrow";
        arrow.textContent = "→";
        cardsContainer.appendChild(arrow);
      }
    });
  }

  renderVoiceLeadingSvg(currentVlData);
  highlightVoiceLeadingStep(currentVlStepIdx);
}

function renderVoiceLeadingSvg(data) {
  const svg = document.getElementById("vlScoreSvg");
  if (!svg || !data) return;
  svg.innerHTML = "";

  const width = 900;
  const trebleStaffTop = 32;
  const spacing = 10;
  const trebleStaffBottom = trebleStaffTop + 4 * spacing;
  const bassStaffTop = trebleStaffBottom + 35;
  const bassStaffBottom = bassStaffTop + 4 * spacing;

  // Draw Staves
  for (let i = 0; i < 5; i++) {
    const lineT = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lineT.setAttribute("x1", "30");
    lineT.setAttribute("x2", `${width - 30}`);
    lineT.setAttribute("y1", `${trebleStaffTop + i * spacing}`);
    lineT.setAttribute("y2", `${trebleStaffTop + i * spacing}`);
    lineT.setAttribute("stroke", "#475569");
    lineT.setAttribute("stroke-width", "1");
    svg.appendChild(lineT);

    const lineB = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lineB.setAttribute("x1", "30");
    lineB.setAttribute("x2", `${width - 30}`);
    lineB.setAttribute("y1", `${bassStaffTop + i * spacing}`);
    lineB.setAttribute("y2", `${bassStaffTop + i * spacing}`);
    lineB.setAttribute("stroke", "#475569");
    lineB.setAttribute("stroke-width", "1");
    svg.appendChild(lineB);
  }

  // Clef labels
  const trebleLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  trebleLabel.setAttribute("x", "40");
  trebleLabel.setAttribute("y", `${trebleStaffBottom - 10}`);
  trebleLabel.setAttribute("font-size", "26");
  trebleLabel.setAttribute("fill", "#64748b");
  trebleLabel.textContent = "𝄞";
  svg.appendChild(trebleLabel);

  const bassLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  bassLabel.setAttribute("x", "40");
  bassLabel.setAttribute("y", `${bassStaffBottom - 12}`);
  bassLabel.setAttribute("font-size", "22");
  bassLabel.setAttribute("fill", "#64748b");
  bassLabel.textContent = "𝄢";
  svg.appendChild(bassLabel);

  const numSteps = data.steps.length;
  const availWidth = width - 140;
  const stepWidth = availWidth / numSteps;

  data.steps.forEach((step, idx) => {
    const cx = 100 + idx * stepWidth + stepWidth / 2;

    if (idx > 0) {
      const barline = document.createElementNS("http://www.w3.org/2000/svg", "line");
      barline.setAttribute("x1", `${100 + idx * stepWidth}`);
      barline.setAttribute("x2", `${100 + idx * stepWidth}`);
      barline.setAttribute("y1", `${trebleStaffTop}`);
      barline.setAttribute("y2", `${bassStaffBottom}`);
      barline.setAttribute("stroke", "#64748b");
      barline.setAttribute("stroke-width", "1.5");
      svg.appendChild(barline);
    }

    const nameText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    nameText.setAttribute("x", `${cx}`);
    nameText.setAttribute("y", `${trebleStaffTop - 12}`);
    nameText.setAttribute("font-size", "12");
    nameText.setAttribute("font-weight", "800");
    nameText.setAttribute("text-anchor", "middle");
    nameText.setAttribute("fill", idx === currentVlStepIdx ? "#f59e0b" : "#38bdf8");
    nameText.setAttribute("id", `vl_svg_name_${idx}`);
    nameText.textContent = `${step.numeral} (${step.chordName})`;
    svg.appendChild(nameText);

    step.rhPitches.forEach(p => {
      const dStep = window.MusicTheory.getDiatonicStep(p);
      if (dStep !== null) {
        const cy = trebleStaffBottom - (dStep - 2) * (spacing / 2);
        const head = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        head.setAttribute("cx", `${cx}`);
        head.setAttribute("cy", `${cy}`);
        head.setAttribute("rx", "6");
        head.setAttribute("ry", "4.5");
        head.setAttribute("transform", `rotate(-20, ${cx}, ${cy})`);
        head.setAttribute("fill", idx === currentVlStepIdx ? "#f59e0b" : "#a855f7");
        head.setAttribute("class", `vl-rh-head-${idx}`);
        svg.appendChild(head);
      }
    });

    const lhStep = window.MusicTheory.getDiatonicStep(step.lhPitch);
    if (lhStep !== null) {
      const cyB = bassStaffBottom - (lhStep - (-10)) * (spacing / 2);
      const headB = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      headB.setAttribute("cx", `${cx}`);
      headB.setAttribute("cy", `${cyB}`);
      headB.setAttribute("rx", "6.2");
      headB.setAttribute("ry", "4.6");
      headB.setAttribute("transform", `rotate(-20, ${cx}, ${cyB})`);
      headB.setAttribute("fill", idx === currentVlStepIdx ? "#f59e0b" : "#34d399");
      headB.setAttribute("class", `vl-lh-head-${idx}`);
      svg.appendChild(headB);
    }
  });
}

function highlightVoiceLeadingStep(idx) {
  if (!currentVlData || !currentVlData.steps[idx]) return;
  const step = currentVlData.steps[idx];

  document.querySelectorAll(".vl-chord-card").forEach((c, i) => {
    c.classList.toggle("active", i === idx);
    c.classList.toggle("completed", i < idx);
  });

  currentVlData.steps.forEach((s, i) => {
    const isCur = (i === idx);
    document.querySelectorAll(`.vl-rh-head-${i}`).forEach(h => h.setAttribute("fill", isCur ? "#f59e0b" : "#a855f7"));
    document.querySelectorAll(`.vl-lh-head-${i}`).forEach(h => h.setAttribute("fill", isCur ? "#f59e0b" : "#34d399"));
    const nameEl = document.getElementById(`vl_svg_name_${i}`);
    if (nameEl) nameEl.setAttribute("fill", isCur ? "#f59e0b" : "#38bdf8");
  });

  document.querySelectorAll(".piano-key").forEach(k => k.classList.remove("active-rh", "active-lh", "active-dyad"));
  const lhKey = document.querySelector(`.piano-key[data-note="${step.lhPitch}"]`);
  if (lhKey) lhKey.classList.add("active-lh");
  step.rhPitches.forEach(p => {
    const key = document.querySelector(`.piano-key[data-note="${p}"]`);
    if (key) key.classList.add("active-dyad");
  });
}

function playChordVoicing(step) {
  if (!step) return;
  initAudio();
  playTone(window.MusicTheory.pitchToFreq(step.lhPitch), 0.9);
  step.rhPitches.forEach(p => {
    playTone(window.MusicTheory.pitchToFreq(p), 0.9);
  });
}

function playVoiceLeadingProgression() {
  if (!currentVlData) return;
  initAudio();
  let delay = 0;
  currentVlData.steps.forEach((step, idx) => {
    setTimeout(() => {
      highlightVoiceLeadingStep(idx);
      playChordVoicing(step);
    }, delay);
    delay += 950;
  });
  setTimeout(() => {
    highlightVoiceLeadingStep(currentVlStepIdx);
  }, delay);
}

function toggleVoiceLeadingPractice() {
  isVlPracticeActive = !isVlPracticeActive;
  currentVlStepIdx = 0;
  vlFulfilledPitches.clear();
  const btn = document.getElementById("vlPracticeBtn");
  if (btn) btn.textContent = isVlPracticeActive ? "■ Stop Practice" : "🎯 Practice Progression";
  const desc = document.getElementById("vlDescriptionText");

  if (isVlPracticeActive) {
    highlightVoiceLeadingStep(0);
    const s = currentVlData.steps[0];
    desc.innerHTML = `<strong>Practice Started:</strong> Play the chord <strong>${s.chordName}</strong> (LH: ${s.lhPitch}, RH: ${s.rhPitches.join(" + ")})`;
  } else {
    updateVoiceLeadingDisplay();
  }
}

function verifyVoiceLeadingInput(pitchName) {
  if (!isVlPracticeActive || !currentVlData) return;
  const targetStep = currentVlData.steps[currentVlStepIdx];
  if (!targetStep) return;

  const expected = [targetStep.lhPitch, ...targetStep.rhPitches];
  const isMatch = expected.some(p => p === pitchName || (window.MusicTheory && window.MusicTheory.areEnharmonicEquivalent(p, pitchName)));
  playTone(window.MusicTheory.pitchToFreq(pitchName), 0.35);

  if (isMatch) {
    vlFulfilledPitches.add(pitchName);
    const desc = document.getElementById("vlDescriptionText");
    const remaining = expected.filter(p => !vlFulfilledPitches.has(p) && !(window.MusicTheory && Array.from(vlFulfilledPitches).some(fp => window.MusicTheory.areEnharmonicEquivalent(fp, p))));

    if (remaining.length === 0) {
      playChordVoicing(targetStep);
      currentVlStepIdx++;
      vlFulfilledPitches.clear();

      if (currentVlStepIdx >= currentVlData.steps.length) {
        desc.innerHTML = `🎉 <strong>Full Progression Mastered!</strong> Magnificent smooth voice leading across all ${currentVlData.steps.length} chords!`;
        currentVlStepIdx = 0;
      } else {
        const nextS = currentVlData.steps[currentVlStepIdx];
        desc.innerHTML = `✅ Superb! Now play <strong>${nextS.chordName}</strong> (${nextS.numeral}) — LH: ${nextS.lhPitch}, RH: ${nextS.rhPitches.join(" + ")}`;
      }
      highlightVoiceLeadingStep(currentVlStepIdx);
    } else {
      desc.innerHTML = `🎵 Locked <strong>${pitchName}</strong> — now play: <strong>${remaining.join(" + ")}</strong>`;
    }
  }
}

// 5. RHYTHM & PRECISION AUDIO-VISUAL METRONOME WORKSHOP
function setMetroSound(soundId, playPreview = false) {
  currentMetroSound = soundId || "woodblock";
  try {
    localStorage.setItem("piano_metro_sound", currentMetroSound);
  } catch (e) {}

  const s1 = document.getElementById("metroSoundSelect");
  if (s1 && s1.value !== currentMetroSound) s1.value = currentMetroSound;

  const s2 = document.getElementById("repertoireMetroSoundSelect");
  if (s2 && s2.value !== currentMetroSound) s2.value = currentMetroSound;

  if (playPreview) {
    playMetronomeSoundPreview(currentMetroSound);
  }
}

function playMetronomeSoundPreview(soundId) {
  try {
    if (typeof initAudio === "function") initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === "suspended") audioCtx.resume();
    const effectiveVol = isMasterMuted ? 0 : currentMasterVolume;
    if (effectiveVol <= 0.0001) return;
    if (window.MusicTheory && window.MusicTheory.synthesizeMetronomeClick) {
      window.MusicTheory.synthesizeMetronomeClick(audioCtx, masterGainNode || audioCtx.destination, audioCtx.currentTime, "downbeat", soundId, effectiveVol);
    }
  } catch (e) {
    console.warn("Unable to play metronome sound preview:", e);
  }
}

function initRhythmModule() {
  const slider = document.getElementById("metroBpmSlider");
  slider?.addEventListener("input", (e) => {
    metroBpm = parseInt(e.target.value, 10);
    updateMetroBpmDisplay();
  });

  document.getElementById("metroBpmMinus5")?.addEventListener("click", () => adjustMetroBpm(-5));
  document.getElementById("metroBpmMinus1")?.addEventListener("click", () => adjustMetroBpm(-1));
  document.getElementById("metroBpmPlus1")?.addEventListener("click", () => adjustMetroBpm(1));
  document.getElementById("metroBpmPlus5")?.addEventListener("click", () => adjustMetroBpm(5));

  document.querySelectorAll(".metronome-visualizer .tempo-preset-btn[data-bpm]").forEach(btn => {
    btn.addEventListener("click", () => {
      metroBpm = parseInt(btn.dataset.bpm, 10);
      updateMetroBpmDisplay();
    });
  });

  const soundSel = document.getElementById("metroSoundSelect");
  if (soundSel) {
    soundSel.value = currentMetroSound;
    soundSel.addEventListener("change", (e) => {
      setMetroSound(e.target.value, true);
    });
  }

  const timeSigSel = document.getElementById("metroTimeSigSelect");
  if (timeSigSel) {
    timeSigSel.value = metroTimeSig;
    timeSigSel.addEventListener("change", (e) => {
      metroTimeSig = e.target.value;
      buildMetroBeatLights();
    });
  }

  const subSel = document.getElementById("metroSubdivisionSelect");
  if (subSel) {
    subSel.value = String(metroSubdivision);
    subSel.addEventListener("change", (e) => {
      metroSubdivision = parseInt(e.target.value, 10) || 1;
      buildMetroBeatLights();
    });
  }

  document.getElementById("metroStartBtn")?.addEventListener("click", toggleMetronome);
  document.getElementById("metroTapTempoBtn")?.addEventListener("click", handleTapTempo);
  document.getElementById("rhythmTapHitBtn")?.addEventListener("click", registerRhythmTap);
  document.getElementById("rhythmClearDataBtn")?.addEventListener("click", clearRhythmTapData);

  buildMetroBeatLights();
  updateMetroBpmDisplay();
  renderRhythmBpmGraph();
}

function adjustMetroBpm(delta) {
  metroBpm = Math.max(40, Math.min(220, metroBpm + delta));
  updateMetroBpmDisplay();
}

function updateMetroBpmDisplay() {
  document.getElementById("metroBpmDisplay").textContent = `${metroBpm} BPM`;
  const slider = document.getElementById("metroBpmSlider");
  if (slider) slider.value = metroBpm;

  const rod = document.getElementById("metroPendulumRod");
  if (rod) {
    rod.style.setProperty("--metro-swing-period", `${(60.0 / metroBpm)}s`);
    const bobPos = Math.round(10 + ((220 - metroBpm) / 180) * 44);
    rod.style.setProperty("--pendulum-bob-pos", `${bobPos}px`);
  }

  const termEl = document.getElementById("metroItalianTerm");
  if (metroBpm < 66) termEl.textContent = "Largo (Broad & Slow)";
  else if (metroBpm < 84) termEl.textContent = "Andante (Walking Pace)";
  else if (metroBpm < 108) termEl.textContent = "Moderato (Moderate)";
  else if (metroBpm < 132) termEl.textContent = "Allegro (Fast & Bright)";
  else if (metroBpm < 168) termEl.textContent = "Vivace (Lively)";
  else termEl.textContent = "Presto (Very Fast)";

  renderRhythmBpmGraph();
}

function buildMetroBeatLights() {
  const container = document.getElementById("metroBeatLights");
  if (!container) return;
  container.innerHTML = "";

  const ts = (window.MusicTheory && window.MusicTheory.parseTimeSignature)
    ? window.MusicTheory.parseTimeSignature(metroTimeSig)
    : { numerator: 4, denominator: 4 };

  const numBeats = ts.numerator;
  for (let i = 0; i < numBeats; i++) {
    const beatWrap = document.createElement("div");
    beatWrap.style.display = "flex";
    beatWrap.style.flexDirection = "column";
    beatWrap.style.alignItems = "center";
    beatWrap.style.gap = "0.25rem";

    const d = document.createElement("div");
    d.className = "beat-light" + (i === 0 ? " active-downbeat" : "");
    d.dataset.beatIndex = i;
    beatWrap.appendChild(d);

    // If subdivisions > 1, add mini subdivision lights
    if (metroSubdivision > 1) {
      const subRow = document.createElement("div");
      subRow.className = "subdivision-lights-bar";
      for (let s = 0; s < metroSubdivision; s++) {
        const subDot = document.createElement("div");
        subDot.className = "sub-light";
        subDot.dataset.beatIndex = i;
        subDot.dataset.subIndex = s;
        subRow.appendChild(subDot);
      }
      beatWrap.appendChild(subRow);
    }

    container.appendChild(beatWrap);
  }
}

function toggleMetronome() {
  if (metroIsPlaying) stopMetronome();
  else startMetronome();
}

function startMetronome() {
  initAudio();
  metroIsPlaying = true;
  metroTickIndex = 0;
  const startBtn = document.getElementById("metroStartBtn");
  if (startBtn) startBtn.textContent = "■ Stop Metronome";

  const rod = document.getElementById("metroPendulumRod");
  if (rod) {
    rod.style.setProperty("--metro-swing-period", `${(60.0 / metroBpm)}s`);
    const bobPos = Math.round(10 + ((220 - metroBpm) / 180) * 44);
    rod.style.setProperty("--pendulum-bob-pos", `${bobPos}px`);
    rod.classList.add("swinging");
  }

  metroNextTickTime = audioCtx.currentTime;
  schedulerMetro();
}

function stopMetronome() {
  metroIsPlaying = false;
  if (metroTimerId) {
    clearTimeout(metroTimerId);
    metroTimerId = null;
  }
  metroTickIndex = 0;
  const startBtn = document.getElementById("metroStartBtn");
  if (startBtn) startBtn.textContent = "▶ Start Metronome";

  const rod = document.getElementById("metroPendulumRod");
  if (rod) rod.classList.remove("swinging");

  document.querySelectorAll("#metroBeatLights .beat-light").forEach(l => l.classList.remove("active-downbeat", "active-secondary", "active-upbeat"));
  document.querySelectorAll("#metroBeatLights .sub-light").forEach(sl => sl.classList.remove("active-sub"));
}

function schedulerMetro() {
  if (!metroIsPlaying) return;
  const calc = (window.MusicTheory && window.MusicTheory.calculateMetronomeIntervals)
    ? window.MusicTheory.calculateMetronomeIntervals(metroBpm, metroTimeSig, metroSubdivision)
    : { tickIntervalSec: (60.0 / metroBpm) / metroSubdivision, ticksPerMeasure: 4 * metroSubdivision };

  const intervalSec = calc.tickIntervalSec;
  const ticksPerMeasure = calc.ticksPerMeasure;

  while (metroNextTickTime < audioCtx.currentTime + 0.1) {
    scheduleMetroClick(metroNextTickTime, metroTickIndex, ticksPerMeasure, metroTimeSig, metroSubdivision);
    metroTickIndex = (metroTickIndex + 1) % ticksPerMeasure;
    metroNextTickTime += intervalSec;
  }
  metroTimerId = setTimeout(schedulerMetro, 25);
}

function scheduleMetroClick(time, tick, totalTicks, timeSigStr, subdivision) {
  const effectiveVol = isMasterMuted ? 0 : currentMasterVolume;
  const profile = (window.MusicTheory && window.MusicTheory.getMetronomeTickProfile)
    ? window.MusicTheory.getMetronomeTickProfile(tick, totalTicks, timeSigStr, subdivision)
    : {
        isDownbeat: tick === 0,
        isBeatOnset: tick % subdivision === 0,
        beatIndex: Math.floor(tick / subdivision),
        accentType: tick === 0 ? "downbeat" : (tick % subdivision === 0 ? "beat" : "subdivision"),
        freq: tick === 0 ? 1200 : (tick % subdivision === 0 ? 640 : 420),
        volume: tick === 0 ? 1.0 : (tick % subdivision === 0 ? 0.6 : 0.35)
      };

  if (effectiveVol > 0.0001) {
    triggerMetronomeClickAudio(time, profile, 0.35, 0.045);
  }

  // Trigger visual lights
  const timeMs = (time - audioCtx.currentTime) * 1000;
  setTimeout(() => {
    lastBeatPerfTime = performance.now();
    const beatIndex = Math.floor(tick / subdivision);
    const subIndex = tick % subdivision;

    const lights = document.querySelectorAll("#metroBeatLights .beat-light");
    lights.forEach((l, idx) => {
      l.classList.toggle("active-downbeat", idx === beatIndex && profile.isDownbeat);
      l.classList.toggle("active-secondary", idx === beatIndex && profile.accentType === "secondary");
      l.classList.toggle("active-upbeat", idx === beatIndex && profile.accentType === "beat");
    });

    const subLights = document.querySelectorAll("#metroBeatLights .sub-light");
    subLights.forEach(sl => {
      const bIdx = parseInt(sl.dataset.beatIndex, 10);
      const sIdx = parseInt(sl.dataset.subIndex, 10);
      sl.classList.toggle("active-sub", bIdx === beatIndex && sIdx === subIndex);
    });
  }, Math.max(0, timeMs));
}

function clearRhythmTapData() {
  rhythmTapHistory = [];
  metroTapTimes = [];
  const resEl = document.getElementById("rhythmAccuracyResult");
  if (resEl) {
    resEl.style.color = "#fbbf24";
    resEl.textContent = "Data cleared! Tap to test your rhythm timing & plot your live BPM!";
  }
  const statEl = document.getElementById("rhythmAccuracyStats");
  if (statEl) {
    statEl.textContent = "Timing offset: -- ms | Average error: -- ms";
  }
  renderRhythmBpmGraph();
}

function renderRhythmBpmGraph() {
  const targetEl = document.getElementById("rhythmGraphTargetBpm");
  if (targetEl) targetEl.textContent = `${metroBpm} BPM`;

  const stats = (window.MusicTheory && window.MusicTheory.analyzeRhythmTapHistory)
    ? window.MusicTheory.analyzeRhythmTapHistory(rhythmTapHistory, metroBpm, 24)
    : {
        tapCount: rhythmTapHistory.length,
        validBpmCount: 0,
        targetBpm: metroBpm,
        currentBpm: null,
        averageBpm: null,
        bpmDelta: null,
        avgBpmError: null,
        avgOffsetMs: null,
        stabilityScore: null,
        statusLabel: "Tap to start plotting your BPM!",
        points: []
      };

  const liveEl = document.getElementById("rhythmGraphLiveBpm");
  if (liveEl) {
    if (stats.currentBpm !== null) {
      const sign = stats.bpmDelta >= 0 ? "+" : "";
      liveEl.textContent = `${stats.currentBpm} (${sign}${stats.bpmDelta})`;
      liveEl.style.color = Math.abs(stats.bpmDelta) <= 3 ? "#10b981" : (Math.abs(stats.bpmDelta) <= 7 ? "#38bdf8" : "#f59e0b");
    } else {
      liveEl.textContent = "-- BPM";
      liveEl.style.color = "#94a3b8";
    }
  }

  const avgEl = document.getElementById("rhythmGraphAvgBpm");
  if (avgEl) {
    avgEl.textContent = stats.averageBpm !== null ? `${stats.averageBpm} BPM` : "-- BPM";
  }

  const stabEl = document.getElementById("rhythmGraphStability");
  if (stabEl) {
    stabEl.textContent = stats.stabilityScore !== null ? `${stats.stabilityScore}%` : "--%";
    if (stats.stabilityScore !== null) {
      stabEl.style.color = stats.stabilityScore >= 88 ? "#10b981" : (stats.stabilityScore >= 72 ? "#38bdf8" : "#f59e0b");
    } else {
      stabEl.style.color = "#c084fc";
    }
  }

  const countEl = document.getElementById("rhythmGraphTapCount");
  if (countEl) countEl.textContent = String(stats.tapCount);

  const badgeEl = document.getElementById("rhythmGraphStatusBadge");
  if (badgeEl) {
    badgeEl.textContent = stats.statusLabel;
    if (stats.bpmDelta === null) badgeEl.style.color = "#38bdf8";
    else if (Math.abs(stats.bpmDelta) <= 3) badgeEl.style.color = "#10b981";
    else if (Math.abs(stats.bpmDelta) <= 7) badgeEl.style.color = "#38bdf8";
    else badgeEl.style.color = "#f59e0b";
  }

  const svg = document.getElementById("rhythmBpmGraphSvg");
  if (!svg) return;
  svg.innerHTML = "";

  const W = 720;
  const H = 210;
  const padL = 56;
  const padR = 24;
  const padT = 18;
  const padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // Determine Y-axis BPM range centered on metroBpm
  let maxDev = 22;
  stats.points.forEach(pt => {
    const d = Math.abs(pt.instantBpm - metroBpm);
    if (d + 4 > maxDev) maxDev = Math.min(60, Math.ceil(d + 4));
  });
  const minBpm = metroBpm - maxDev;
  const maxBpm = metroBpm + maxDev;

  const bpmToY = (bpmVal) => {
    const clamped = Math.max(minBpm, Math.min(maxBpm, bpmVal));
    const norm = (clamped - minBpm) / (maxBpm - minBpm);
    return padT + plotH - norm * plotH;
  };

  // 1. Shaded Good Zone (±7 BPM) & Locked-In Zone (±3 BPM)
  const goodTopY = bpmToY(metroBpm + 7);
  const goodBotY = bpmToY(metroBpm - 7);
  const goodRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  goodRect.setAttribute("x", padL);
  goodRect.setAttribute("y", goodTopY);
  goodRect.setAttribute("width", plotW);
  goodRect.setAttribute("height", Math.max(2, goodBotY - goodTopY));
  goodRect.setAttribute("fill", "rgba(56, 189, 248, 0.06)");
  svg.appendChild(goodRect);

  const lockTopY = bpmToY(metroBpm + 3);
  const lockBotY = bpmToY(metroBpm - 3);
  const lockRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  lockRect.setAttribute("x", padL);
  lockRect.setAttribute("y", lockTopY);
  lockRect.setAttribute("width", plotW);
  lockRect.setAttribute("height", Math.max(2, lockBotY - lockTopY));
  lockRect.setAttribute("fill", "rgba(16, 185, 129, 0.13)");
  svg.appendChild(lockRect);

  // 2. Horizontal Grid Lines & Y-Axis Labels
  const stepBpm = maxDev > 30 ? 20 : 10;
  const tickOffsets = [-stepBpm * 2, -stepBpm, 0, stepBpm, stepBpm * 2];
  tickOffsets.forEach(off => {
    const val = metroBpm + off;
    if (val < minBpm || val > maxBpm) return;
    const y = bpmToY(val);
    const isTarget = (off === 0);

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", padL);
    line.setAttribute("y1", y);
    line.setAttribute("x2", W - padR);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", isTarget ? "#10b981" : "#1e293b");
    line.setAttribute("stroke-width", isTarget ? "1.8" : "1");
    if (isTarget) line.setAttribute("stroke-dasharray", "6 4");
    svg.appendChild(line);

    const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    lbl.setAttribute("x", padL - 8);
    lbl.setAttribute("y", y + 4);
    lbl.setAttribute("text-anchor", "end");
    lbl.setAttribute("font-size", isTarget ? "11" : "10");
    lbl.setAttribute("font-weight", isTarget ? "800" : "600");
    lbl.setAttribute("font-family", "ui-monospace, monospace");
    lbl.setAttribute("fill", isTarget ? "#10b981" : "#64748b");
    lbl.textContent = `${val}`;
    svg.appendChild(lbl);
  });

  // 3. Empty state message if fewer than 1 plotted BPM point
  const pts = stats.points;
  if (!pts || pts.length === 0) {
    const emptyTxt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    emptyTxt.setAttribute("x", padL + plotW / 2);
    emptyTxt.setAttribute("y", padT + plotH / 2 - 6);
    emptyTxt.setAttribute("text-anchor", "middle");
    emptyTxt.setAttribute("font-size", "12.5");
    emptyTxt.setAttribute("font-weight", "700");
    emptyTxt.setAttribute("fill", "#94a3b8");
    emptyTxt.textContent = stats.tapCount === 1
      ? "1st tap logged — tap the next beat to plot your BPM!"
      : `Target Line: ${metroBpm} BPM — Tap along (Spacebar / Button / Piano Key) to graph your tempo!`;
    svg.appendChild(emptyTxt);
    return;
  }

  // 4. Compute X/Y coordinates for each point
  const maxSlots = Math.max(8, pts.length);
  const coords = pts.map((pt, i) => {
    const x = pts.length === 1
      ? padL + plotW / 2
      : padL + (i / (maxSlots - 1)) * plotW;
    const y = bpmToY(pt.instantBpm);
    return { x, y, pt };
  });

  // 5. Connect trend line
  if (coords.length >= 2) {
    const polyPoints = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.setAttribute("points", polyPoints);
    polyline.setAttribute("fill", "none");
    polyline.setAttribute("stroke", "#38bdf8");
    polyline.setAttribute("stroke-width", "2.4");
    polyline.setAttribute("stroke-linecap", "round");
    polyline.setAttribute("stroke-linejoin", "round");
    svg.appendChild(polyline);
  }

  // 6. Draw tap nodes & latest BPM badge
  coords.forEach((c, idx) => {
    let color = "#10b981";
    if (c.pt.zone === "good") color = "#38bdf8";
    else if (c.pt.zone === "rushing") color = "#f59e0b";
    else if (c.pt.zone === "dragging") color = "#fb7185";

    const isLast = (idx === coords.length - 1);
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", c.x);
    circle.setAttribute("cy", c.y);
    circle.setAttribute("r", isLast ? "6" : "4.2");
    circle.setAttribute("fill", color);
    circle.setAttribute("stroke", "#070b14");
    circle.setAttribute("stroke-width", "1.6");

    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    const sign = c.pt.bpmDiff >= 0 ? "+" : "";
    title.textContent = `Beat #${c.pt.stepNumber}: ${c.pt.instantBpm} BPM (${sign}${c.pt.bpmDiff} vs ${c.pt.targetBpm} BPM)`;
    circle.appendChild(title);
    svg.appendChild(circle);

    if (isLast) {
      const valLbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
      const labelY = c.y > padT + 22 ? c.y - 10 : c.y + 18;
      valLbl.setAttribute("x", Math.min(W - padR - 36, Math.max(padL + 36, c.x)));
      valLbl.setAttribute("y", labelY);
      valLbl.setAttribute("text-anchor", "middle");
      valLbl.setAttribute("font-size", "11");
      valLbl.setAttribute("font-weight", "800");
      valLbl.setAttribute("font-family", "ui-monospace, monospace");
      valLbl.setAttribute("fill", color);
      valLbl.textContent = `${c.pt.instantBpm} BPM (${sign}${c.pt.bpmDiff})`;
      svg.appendChild(valLbl);
    }
  });
}

function handleTapTempo() {
  const now = performance.now();
  metroTapTimes.push(now);
  if (metroTapTimes.length > 5) metroTapTimes.shift();

  if (metroTapTimes.length >= 2) {
    const intervals = [];
    for (let i = 1; i < metroTapTimes.length; i++) {
      intervals.push(metroTapTimes[i] - metroTapTimes[i - 1]);
    }
    const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const calcBpm = Math.round(60000 / avgMs);
    if (calcBpm >= 40 && calcBpm <= 240) {
      metroBpm = calcBpm;
      updateMetroBpmDisplay();
    }
  }
}

function registerRhythmTap() {
  const now = performance.now();
  const calc = (window.MusicTheory && window.MusicTheory.calculateMetronomeIntervals)
    ? window.MusicTheory.calculateMetronomeIntervals(metroBpm, metroTimeSig, metroSubdivision)
    : { tickIntervalSec: (60 / metroBpm) / metroSubdivision };
  const beatMs = calc.tickIntervalSec * 1000;
  const delta = now - lastBeatPerfTime;
  const offset = delta > beatMs / 2 ? delta - beatMs : delta;
  const absOffset = Math.abs(offset);

  // Compute instantaneous BPM from previous tap if within 150ms–2500ms
  let instantBpm = null;
  if (rhythmTapHistory.length > 0) {
    const prevTap = rhythmTapHistory[rhythmTapHistory.length - 1];
    const dt = now - prevTap.timestamp;
    if (dt >= 150 && dt <= 2500) {
      // Normalize to quarter-note / main beat BPM if subdivision > 1
      instantBpm = (60000 / dt) / (metroSubdivision > 1 ? metroSubdivision : 1);
    }
  }

  rhythmTapHistory.push({
    timestamp: now,
    instantBpm,
    targetBpm: metroBpm,
    offsetMs: metroIsPlaying ? offset : null
  });
  if (rhythmTapHistory.length > 60) {
    rhythmTapHistory.shift();
  }

  const resEl = document.getElementById("rhythmAccuracyResult");
  const statEl = document.getElementById("rhythmAccuracyStats");

  if (metroIsPlaying) {
    if (absOffset < 35) {
      resEl.innerHTML = `<span style="color:#10b981;">PERFECT! ⭐ (${offset > 0 ? '+' : ''}${Math.round(offset)} ms)</span>`;
    } else if (absOffset < 75) {
      resEl.innerHTML = `<span style="color:#38bdf8;">GOOD! 👍 (${offset > 0 ? '+' : ''}${Math.round(offset)} ms)</span>`;
    } else {
      const desc = offset > 0 ? "LATE ⏳" : "EARLY ⚡";
      resEl.innerHTML = `<span style="color:#f59e0b;">${desc} (${offset > 0 ? '+' : ''}${Math.round(offset)} ms)</span>`;
    }
  } else if (instantBpm !== null) {
    const diff = Math.round((instantBpm - metroBpm) * 10) / 10;
    const sign = diff >= 0 ? "+" : "";
    const col = Math.abs(diff) <= 3 ? "#10b981" : (Math.abs(diff) <= 7 ? "#38bdf8" : "#f59e0b");
    resEl.innerHTML = `<span style="color:${col};">Your Tempo: ${Math.round(instantBpm * 10) / 10} BPM (${sign}${diff} vs Target ${metroBpm} BPM)</span>`;
  } else {
    resEl.innerHTML = `<span style="color:#38bdf8;">First beat logged — keep tapping to measure your BPM!</span>`;
  }

  const stats = (window.MusicTheory && window.MusicTheory.analyzeRhythmTapHistory)
    ? window.MusicTheory.analyzeRhythmTapHistory(rhythmTapHistory, metroBpm, 24)
    : null;
  const avgErrStr = (stats && stats.avgOffsetMs !== null) ? `${stats.avgOffsetMs} ms` : "-- ms";
  const curOffStr = metroIsPlaying ? `${Math.round(offset)} ms` : "-- ms (Free Tap)";
  statEl.textContent = `Target beat interval: ${Math.round(beatMs)} ms | Timing offset: ${curOffStr} | Average error: ${avgErrStr}`;

  renderRhythmBpmGraph();
}

// 6. THEORY LESSONS & CIRCLE OF FIFTHS ENGINE
function renderCircleOfFifthsSvg() {
  const svg = document.getElementById("circleFifthsSvg");
  if (!svg || !window.MusicTheory) return;
  svg.innerHTML = "";

  const keys = window.MusicTheory.CIRCLE_OF_FIFTHS;
  const numKeys = keys.length;
  const angleStep = (2 * Math.PI) / numKeys;
  const outerR = 150;
  const innerR = 85;

  keys.forEach((k, idx) => {
    const angle = idx * angleStep - Math.PI / 2;
    const nextAngle = angle + angleStep;

    const x1 = outerR * Math.cos(angle);
    const y1 = outerR * Math.sin(angle);
    const x2 = outerR * Math.cos(nextAngle);
    const y2 = outerR * Math.sin(nextAngle);
    const x3 = innerR * Math.cos(nextAngle);
    const y3 = innerR * Math.sin(nextAngle);
    const x4 = innerR * Math.cos(angle);
    const y4 = innerR * Math.sin(angle);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const d = `M ${x4} ${y4} L ${x1} ${y1} A ${outerR} ${outerR} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 0 0 ${x4} ${y4} Z`;
    path.setAttribute("d", d);
    path.setAttribute("fill", idx % 2 === 0 ? "#1e293b" : "#0f172a");
    path.setAttribute("stroke", "#334155");
    path.setAttribute("stroke-width", "1.5");
    path.style.cursor = "pointer";
    path.style.transition = "fill 0.15s";

    path.addEventListener("mouseenter", () => path.setAttribute("fill", "#0284c7"));
    path.addEventListener("mouseleave", () => path.setAttribute("fill", idx % 2 === 0 ? "#1e293b" : "#0f172a"));
    path.addEventListener("click", () => selectCircleKey(k));

    svg.appendChild(path);

    // Text Major Key
    const midAngle = angle + angleStep / 2;
    const textR = (outerR + innerR) / 2 + 6;
    const tx = textR * Math.cos(midAngle);
    const ty = textR * Math.sin(midAngle);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", tx);
    text.setAttribute("y", ty + 4);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "#f8fafc");
    text.setAttribute("font-weight", "800");
    text.setAttribute("font-size", "14");
    text.textContent = k.key;
    text.style.pointerEvents = "none";
    svg.appendChild(text);

    // Minor Key text inside
    const minR = innerR - 22;
    const mx = minR * Math.cos(midAngle);
    const my = minR * Math.sin(midAngle);
    const mtext = document.createElementNS("http://www.w3.org/2000/svg", "text");
    mtext.setAttribute("x", mx);
    mtext.setAttribute("y", my + 4);
    mtext.setAttribute("text-anchor", "middle");
    mtext.setAttribute("fill", "#94a3b8");
    mtext.setAttribute("font-size", "10");
    mtext.setAttribute("font-weight", "600");
    mtext.textContent = k.relativeMinor;
    mtext.style.pointerEvents = "none";
    svg.appendChild(mtext);
  });

  // Center Hub
  const hub = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  hub.setAttribute("cx", "0");
  hub.setAttribute("cy", "0");
  hub.setAttribute("r", innerR - 35);
  hub.setAttribute("fill", "#090e1a");
  hub.setAttribute("stroke", "#38bdf8");
  hub.setAttribute("stroke-width", "2");
  svg.appendChild(hub);

  const hubText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  hubText.setAttribute("x", "0");
  hubText.setAttribute("y", "4");
  hubText.setAttribute("text-anchor", "middle");
  hubText.setAttribute("fill", "#38bdf8");
  hubText.setAttribute("font-weight", "800");
  hubText.setAttribute("font-size", "11");
  hubText.textContent = "5ths Wheel";
  svg.appendChild(hubText);

  if (keys.length > 0 && !svg.dataset.initializedKey) {
    svg.dataset.initializedKey = "true";
    selectCircleKey(keys[0]);
  }
}

function selectCircleKey(keyData) {
  if (!keyData) return;
  document.getElementById("circleKeyTitle").textContent = `Key of ${keyData.key} Major`;
  document.getElementById("circleRelativeMinor").innerHTML = `Relative Minor: <strong>${keyData.relativeMinor}</strong>`;
  const accText = keyData.sharps > 0 ? `${keyData.sharps} Sharp${keyData.sharps > 1 ? 's' : ''} (${keyData.accidentalsList.join(', ')})` : (keyData.flats > 0 ? `${keyData.flats} Flat${keyData.flats > 1 ? 's' : ''} (${keyData.accidentalsList.join(', ')})` : "Natural (No sharps or flats)");
  document.getElementById("circleAccidentals").innerHTML = `Key Signature: <strong>${accText}</strong>`;

  // Render Engraved Key Signature Staff & Rule
  if (window.MusicTheory && window.MusicTheory.getKeySignatureStaffInfo) {
    const sigInfo = window.MusicTheory.getKeySignatureStaffInfo(keyData.key);
    renderCircleKeySignatureSvg(sigInfo);
    const ruleEl = document.getElementById("circleKeyRuleText");
    if (ruleEl && sigInfo) {
      ruleEl.innerHTML = `💡 <strong>Reading Rule:</strong> ${sigInfo.ruleText}<br><span style="color:#94a3b8;">${sigInfo.tipText}</span>`;
    }
  }

  // Render 7 Diatonic Chords strip
  if (window.MusicTheory && window.MusicTheory.generateDiatonicChordFamily) {
    const family = window.MusicTheory.generateDiatonicChordFamily(keyData.key);
    renderCircleDiatonicChords(family);
  }

  const expBtn = document.getElementById("circleExploreScaleBtn");
  if (expBtn) {
    expBtn.onclick = () => {
      const scaleTab = document.querySelector(`.mode-nav-btn[data-mode="scales"]`);
      if (scaleTab) scaleTab.click();
      const btnSubScales = document.getElementById("btnSubmodeScales");
      if (btnSubScales) btnSubScales.click();
      const tonicTarget = keyData.key === "Gb" ? "F#" : keyData.key;
      const tonicBtn = document.querySelector(`#tonicSelectorRow .tonic-btn[data-tonic="${tonicTarget}"]`);
      if (tonicBtn) tonicBtn.click();
    };
  }
}

function renderCircleKeySignatureSvg(sigInfo) {
  const svg = document.getElementById("circleKeySigSvg");
  if (!svg || !sigInfo) return;
  svg.innerHTML = "";

  const width = 260;
  const staffTop = 18;
  const spacing = 10;
  const staffBottom = staffTop + 4 * spacing;

  for (let i = 0; i < 5; i++) {
    const y = staffTop + i * spacing;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", "14");
    line.setAttribute("y1", y);
    line.setAttribute("x2", width - 14);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", "#64748b");
    line.setAttribute("stroke-width", "1.2");
    svg.appendChild(line);
  }

  const clef = document.createElementNS("http://www.w3.org/2000/svg", "text");
  clef.setAttribute("x", "20");
  clef.setAttribute("y", staffBottom - 2);
  clef.setAttribute("font-size", "42");
  clef.setAttribute("fill", "#0f172a");
  clef.setAttribute("class", "clef-text");
  clef.textContent = "𝄞";
  svg.appendChild(clef);

  if (!sigInfo.symbols || sigInfo.symbols.length === 0) {
    const natLbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    natLbl.setAttribute("x", "145");
    natLbl.setAttribute("y", staffTop + 25);
    natLbl.setAttribute("font-size", "11");
    natLbl.setAttribute("font-weight", "700");
    natLbl.setAttribute("text-anchor", "middle");
    natLbl.setAttribute("fill", "#475569");
    natLbl.textContent = "♮ All Natural (White Keys)";
    svg.appendChild(natLbl);
    return;
  }

  sigInfo.symbols.forEach((sym, idx) => {
    const cx = 66 + idx * 22;
    const cy = staffBottom - (sym.trebleStep - 2) * (spacing / 2);
    const acc = document.createElementNS("http://www.w3.org/2000/svg", "text");
    acc.setAttribute("x", cx);
    acc.setAttribute("y", cy + 5);
    acc.setAttribute("font-size", "19");
    acc.setAttribute("font-weight", "700");
    acc.setAttribute("fill", sym.symbol === "♯" ? "#0284c7" : "#7c3aed");
    acc.textContent = sym.symbol;
    svg.appendChild(acc);
  });
}

function renderCircleDiatonicChords(family) {
  const grid = document.getElementById("circleDiatonicChordsGrid");
  if (!grid || !family || !family.chords) return;
  grid.innerHTML = "";

  family.chords.forEach(ch => {
    const card = document.createElement("div");
    card.className = "diatonic-chord-card";
    card.title = `Click to play ${ch.chordName} (${ch.pitches.join(" - ")})`;
    card.innerHTML = `
      <span class="dc-roman">${ch.roman}</span>
      <span class="dc-symbol">${ch.symbol}</span>
      <span class="dc-role">${ch.functionRole.split(" ")[0]}</span>
    `;
    card.addEventListener("click", () => {
      initAudio();
      document.querySelectorAll(".piano-key").forEach(k => k.classList.remove("active-rh", "active-lh", "active-dyad"));
      (ch.pitches || []).forEach((p, idx) => {
        playTone(window.MusicTheory.pitchToFreq(p), 0.75);
        highlightPlaybackKey(p, idx === 0 ? "rh" : "dyad", 850);
      });
    });
    grid.appendChild(card);
  });
}

// 7. INTERACTIVE BEGINNER PIANO & THEORY BOOTCAMP
function initBeginnerBootcamp() {
  try {
    const saved = JSON.parse(localStorage.getItem("piano_bootcamp_progress") || "[]");
    if (Array.isArray(saved)) saved.forEach(id => bootcampCompletedIds.add(id));
  } catch (e) {}

  document.getElementById("bootcampDemoBtn")?.addEventListener("click", playBootcampDemo);
  document.getElementById("bootcampStartTaskBtn")?.addEventListener("click", toggleBootcampTask);

  renderBootcampModule();
}

function renderBootcampModule() {
  if (!window.MusicTheory || !window.MusicTheory.BEGINNER_BOOTCAMP_MODULES) return;
  const modules = window.MusicTheory.BEGINNER_BOOTCAMP_MODULES;
  const mod = modules[currentBootcampModuleIdx] || modules[0];
  if (!mod) return;

  const isDone = bootcampCompletedIds.has(mod.id);
  const badge = document.getElementById("bootcampProgressBadge");
  if (badge) {
    badge.textContent = `${bootcampCompletedIds.size} / ${modules.length} Modules Mastered`;
  }

  const tabsRow = document.getElementById("bootcampModuleTabs");
  if (tabsRow) {
    tabsRow.innerHTML = "";
    modules.forEach((m, idx) => {
      const mDone = bootcampCompletedIds.has(m.id);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `bootcamp-tab-btn ${idx === currentBootcampModuleIdx ? "active" : ""} ${mDone ? "completed" : ""}`;
      btn.textContent = `${mDone ? "✓ " : ""}${m.number}. ${m.title.split(":")[0]}`;
      btn.addEventListener("click", () => {
        if (isBootcampTaskActive) toggleBootcampTask();
        currentBootcampModuleIdx = idx;
        renderBootcampModule();
      });
      tabsRow.appendChild(btn);
    });
  }

  const modBadgeEl = document.getElementById("bootcampModBadge");
  if (modBadgeEl) modBadgeEl.textContent = `Module ${mod.number} · ${mod.category || mod.badge || ""}`;

  const modStatusEl = document.getElementById("bootcampModStatus");
  if (modStatusEl) {
    modStatusEl.textContent = isDone ? "✅ Completed" : "In Progress";
    modStatusEl.style.color = isDone ? "#34d399" : "#94a3b8";
  }

  const modTitleEl = document.getElementById("bootcampModTitle");
  if (modTitleEl) modTitleEl.textContent = mod.title;

  const modSubtitleEl = document.getElementById("bootcampModSubtitle");
  if (modSubtitleEl) modSubtitleEl.textContent = mod.subtitle || "";

  const modSummaryEl = document.getElementById("bootcampModSummary");
  if (modSummaryEl) modSummaryEl.textContent = mod.summary || mod.theorySummary || "";

  const takeawaysList = document.getElementById("bootcampModTakeaways");
  if (takeawaysList) {
    takeawaysList.innerHTML = "";
    (mod.steps || mod.keyTakeaways || []).forEach(s => {
      const li = document.createElement("li");
      li.textContent = s;
      takeawaysList.appendChild(li);
    });
  }

  const recSongsContainer = document.getElementById("bootcampRecSongs");
  if (recSongsContainer) {
    recSongsContainer.innerHTML = "";
    (mod.recommendedSongs || []).forEach(songId => {
      const found = songDatabase.find(s => s.id === songId);
      if (!found) return;
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "dna-chord-chip";
      chip.textContent = `🎵 ${found.title}`;
      chip.addEventListener("click", () => {
        const repTab = document.querySelector('.mode-nav-btn[data-mode="repertoire"]');
        if (repTab) repTab.click();
        loadSong(found);
      });
      recSongsContainer.appendChild(chip);
    });
  }

  const targets = (mod.interactiveTask && mod.interactiveTask.targetNotes) ? mod.interactiveTask.targetNotes : [];
  const stepProgEl = document.getElementById("bootcampStepProgress");
  if (stepProgEl) {
    stepProgEl.textContent = `Note ${Math.min(bootcampFulfilledIndex + 1, Math.max(1, targets.length))} / ${targets.length}`;
  }

  const goalPrompt = document.getElementById("bootcampTaskPrompt");
  if (goalPrompt && mod.interactiveTask) {
    goalPrompt.textContent = mod.interactiveTask.prompt;
  }

  const notesRow = document.getElementById("bootcampStepList");
  if (notesRow) {
    notesRow.innerHTML = "";
    targets.forEach((pitch, idx) => {
      const chip = document.createElement("span");
      chip.className = `bootcamp-target-note ${idx < bootcampFulfilledIndex ? "done" : ""}`;
      chip.id = `bootcamp_target_${idx}`;
      chip.textContent = pitch;
      chip.style.cursor = "pointer";
      chip.title = "Click to audition this note";
      chip.addEventListener("click", () => {
        initAudio();
        playTone(window.MusicTheory.pitchToFreq(pitch), 0.45);
        highlightPlaybackKey(pitch, "rh", 450);
      });
      notesRow.appendChild(chip);
    });
  }

  const feedback = document.getElementById("bootcampLiveFeedback");
  if (feedback && !isBootcampTaskActive) {
    feedback.textContent = isDone
      ? `✅ Module completed! Click "Start Interactive Task" to practice again or advance to the next lesson.`
      : `Click "Start Interactive Task" (or press keys below) to complete this lesson!`;
    feedback.style.color = isDone ? "#34d399" : "#38bdf8";
  }
}

function playBootcampDemo() {
  if (!window.MusicTheory || !window.MusicTheory.BEGINNER_BOOTCAMP_MODULES) return;
  const mod = window.MusicTheory.BEGINNER_BOOTCAMP_MODULES[currentBootcampModuleIdx];
  if (!mod || !mod.interactiveTask) return;
  initAudio();

  const targets = mod.interactiveTask.targetNotes || [];
  let delay = 0;
  targets.forEach(p => {
    setTimeout(() => {
      playTone(window.MusicTheory.pitchToFreq(p), 0.42);
      highlightPlaybackKey(p, "rh", 380);
    }, delay);
    delay += 380;
  });
}

function toggleBootcampTask() {
  isBootcampTaskActive = !isBootcampTaskActive;
  bootcampFulfilledIndex = 0;
  const btn = document.getElementById("bootcampStartTaskBtn");
  if (btn) btn.textContent = isBootcampTaskActive ? "■ Stop Task" : "🎯 Try On Keyboard";

  const mod = window.MusicTheory?.BEGINNER_BOOTCAMP_MODULES?.[currentBootcampModuleIdx];
  renderBootcampModule();

  if (isBootcampTaskActive && mod) {
    const firstPitch = mod.interactiveTask.targetNotes[0];
    const feedback = document.getElementById("bootcampLiveFeedback");
    if (feedback) {
      feedback.style.color = "#fbbf24";
      feedback.innerHTML = `🎹 <strong>Live Task Active:</strong> Play <strong>${firstPitch}</strong> on the piano keyboard below!`;
    }
    highlightPlaybackKey(firstPitch, "rh", 1200);
  }
}

function verifyBootcampNoteInput(pitchName) {
  if (!isBootcampTaskActive || !window.MusicTheory) return;
  const modules = window.MusicTheory.BEGINNER_BOOTCAMP_MODULES;
  const mod = modules[currentBootcampModuleIdx];
  if (!mod || !mod.interactiveTask) return;

  const targets = mod.interactiveTask.targetNotes || [];
  const expectedPitch = targets[bootcampFulfilledIndex];
  if (!expectedPitch) return;

  playTone(window.MusicTheory.pitchToFreq(pitchName), 0.35);
  const isMatch = (pitchName === expectedPitch) || window.MusicTheory.areEnharmonicEquivalent(pitchName, expectedPitch);
  const feedback = document.getElementById("bootcampLiveFeedback");

  if (isMatch) {
    const chip = document.getElementById(`bootcamp_target_${bootcampFulfilledIndex}`);
    if (chip) chip.classList.add("done");
    bootcampFulfilledIndex++;

    if (bootcampFulfilledIndex >= targets.length) {
      bootcampCompletedIds.add(mod.id);
      try {
        localStorage.setItem("piano_bootcamp_progress", JSON.stringify(Array.from(bootcampCompletedIds)));
      } catch (e) {}
      isBootcampTaskActive = false;
      const btn = document.getElementById("bootcampStartTaskBtn");
      if (btn) btn.textContent = "🎯 Try On Keyboard";
      renderBootcampModule();
      if (feedback) {
        feedback.style.color = "#34d399";
        feedback.innerHTML = `🎉 <strong>${mod.interactiveTask.successMessage}</strong>`;
      }
    } else {
      const nextPitch = targets[bootcampFulfilledIndex];
      if (feedback) {
        feedback.style.color = "#38bdf8";
        feedback.innerHTML = `✅ Great! Now play <strong>${nextPitch}</strong> (${bootcampFulfilledIndex}/${targets.length})!`;
      }
      highlightPlaybackKey(nextPitch, "rh", 900);
    }
  } else if (feedback) {
    feedback.style.color = "#f87171";
    feedback.innerHTML = `❌ You played <strong>${pitchName}</strong> — look for <strong>${expectedPitch}</strong> on the keyboard!`;
  }
}

function initInteractiveTheoryCards() {
  // 1. Notes / Interval demo buttons
  document.querySelectorAll(".interactive-theory-btn[data-demo-notes]").forEach(btn => {
    btn.addEventListener("click", () => {
      const raw = btn.dataset.demoNotes || "";
      const notes = raw.split(",").map(s => s.trim()).filter(Boolean);
      if (!notes.length || !window.MusicTheory) return;
      initAudio();
      let delay = 0;
      notes.forEach((p, idx) => {
        setTimeout(() => {
          playTone(window.MusicTheory.pitchToFreq(p), 0.45);
          highlightPlaybackKey(p, idx === 0 ? "rh" : "dyad", 450);
        }, delay);
        delay += 380;
      });
    });
  });

  // 2. Chord quality / inversion demo buttons
  document.querySelectorAll(".interactive-theory-btn[data-demo-chord]").forEach(btn => {
    btn.addEventListener("click", () => {
      const parts = (btn.dataset.demoChord || "").split(":");
      if (parts.length < 2 || !window.MusicTheory) return;
      const root = parts[0];
      const type = parts[1];
      const inv = parseInt(parts[2] || "0", 10);
      const chord = window.MusicTheory.generateChord(root, type, 4, inv);
      if (!chord) return;
      initAudio();
      chord.pitches.forEach((p, idx) => {
        playTone(window.MusicTheory.pitchToFreq(p), 0.85);
        highlightPlaybackKey(p, idx === 0 ? "rh" : "dyad", 850);
      });
    });
  });

  // 3. Rhythm value demo buttons
  document.querySelectorAll(".interactive-theory-btn[data-demo-rhythm]").forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.demoRhythm;
      if (!window.MusicTheory) return;
      initAudio();
      const beatMs = 600; // 100 BPM = 600ms per beat
      // Play 4 reference metronome clicks
      for (let b = 0; b < 4; b++) {
        setTimeout(() => {
          if (audioCtx && window.MusicTheory.synthesizeMetronomeClick) {
            window.MusicTheory.synthesizeMetronomeClick(audioCtx, masterGainNode || audioCtx.destination, audioCtx.currentTime, b === 0 ? "downbeat" : "beat", currentMetroSound, 0.7);
          }
        }, b * beatMs);
      }
      // Play note pattern over the 4 beats
      const schedules = {
        whole: [{ offset: 0, dur: 2.2 }],
        half: [{ offset: 0, dur: 1.05 }, { offset: 2 * beatMs, dur: 1.05 }],
        quarter: [0, 1, 2, 3].map(i => ({ offset: i * beatMs, dur: 0.48 })),
        eighth: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map(i => ({ offset: i * beatMs, dur: 0.22 }))
      };
      (schedules[type] || schedules.quarter).forEach(ev => {
        setTimeout(() => {
          playTone(window.MusicTheory.pitchToFreq("C4"), ev.dur);
          highlightPlaybackKey("C4", "rh", ev.dur * 900);
        }, ev.offset);
      });
    });
  });
}
