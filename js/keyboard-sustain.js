// ============================================================================
// 3D PIANO KEYBOARD, CHEAT SHEET MODAL & GUITAR-HERO SUSTAIN STAGE
// ============================================================================

function populateStartKeySelect() {
  const select = document.getElementById("startKeySelect");
  if (!select) return;
  select.innerHTML = "";
  for (let m = 21; m <= 84; m++) {
    const pitch = midiNumberToPitch(m);
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m === 60 ? `${pitch} (Mid C)` : pitch;
    select.appendChild(opt);
  }
}

function updateKeyboardControlsUI() {
  const presetSelect = document.getElementById("keyboardPresetSelect");
  const keyCountInput = document.getElementById("keyCountInput");
  const startKeySelect = document.getElementById("startKeySelect");

  if (keyCountInput) keyCountInput.value = currentKeyCount;
  if (startKeySelect) startKeySelect.value = currentStartMidi;

  if (presetSelect) {
    const match = KEYBOARD_PRESETS.find(p => p.count === currentKeyCount && p.startMidi === currentStartMidi);
    presetSelect.value = match ? match.id : "custom";
  }

  try {
    localStorage.setItem("piano_key_count", currentKeyCount.toString());
    localStorage.setItem("piano_start_midi", currentStartMidi.toString());
  } catch (err) {}
}

function buildPianoKeyboard() {
  const keyboard = document.getElementById("pianoKeyboard");
  if (!keyboard) return;
  keyboard.innerHTML = "";

  const minMidi = Math.max(21, Math.min(108, currentStartMidi));
  const count = Math.max(12, Math.min(88, currentKeyCount));
  const maxMidi = Math.min(108, minMidi + count - 1);
  const actualCount = maxMidi - minMidi + 1;

  const startPitch = midiNumberToPitch(minMidi);
  const endPitch = midiNumberToPitch(maxMidi);

  const rangeBadge = document.getElementById("rangeBadge");
  if (rangeBadge) {
    rangeBadge.textContent = `${startPitch} – ${endPitch} (${actualCount} Keys)`;
  }

  function bindKeyListeners(keyEl, noteId) {
    const onDown = (e) => {
      if (e.cancelable && e.type === "touchstart") e.preventDefault();
      e.stopPropagation();
      keyEl.classList.add("active-live");
      const midiNum = (window.MusicTheory && window.MusicTheory.pitchToMidi) ? window.MusicTheory.pitchToMidi(noteId) : getPitchMidiNumber(noteId);
      if (isSynthAudioEnabled() || (typeof selectedMidiOutput !== "undefined" && selectedMidiOutput)) {
        startLiveTone(midiNum, 90);
      }
      handleNoteDown(noteId, "mouse", { noteNumber: midiNum });
    };
    const onUp = (e) => {
      e.stopPropagation();
      keyEl.classList.remove("active-live");
      const midiNum = (window.MusicTheory && window.MusicTheory.pitchToMidi) ? window.MusicTheory.pitchToMidi(noteId) : getPitchMidiNumber(noteId);
      stopLiveTone(midiNum);
      handleNoteUp(noteId, { noteNumber: midiNum });
    };

    keyEl.addEventListener("mousedown", onDown);
    keyEl.addEventListener("mouseup", onUp);
    keyEl.addEventListener("mouseleave", onUp);
    keyEl.addEventListener("touchstart", onDown, { passive: false });
    keyEl.addEventListener("touchend", onUp);
    keyEl.addEventListener("touchcancel", onUp);
  }

  const showCheatColors = isCheatSheetColorsEnabled();

  // If the first key is black, provide an invisible leading white anchor
  const isStartBlack = [1, 3, 6, 8, 10].includes(minMidi % 12);
  if (isStartBlack) {
    const dummyKey = document.createElement("div");
    dummyKey.className = "piano-key white leading-dummy";
    dummyKey.style.cssText = "width:22px; visibility:hidden; pointer-events:none; border:none; background:transparent; box-shadow:none;";

    const blackKeyId = midiNumberToPitch(minMidi);
    const blackKey = document.createElement("div");
    blackKey.className = "piano-key black";
    blackKey.dataset.note = blackKeyId;
    const bLetter = blackKeyId.replace(/[0-9]/g, "");
    const bColor = (window.MusicTheory && window.MusicTheory.getCheatSheetNoteColor) ? window.MusicTheory.getCheatSheetNoteColor(blackKeyId) : "#94a3b8";
    blackKey.innerHTML = `<span class="black-key-label" style="color: ${showCheatColors ? bColor : '#94a3b8'};">${bLetter}</span>`;
    blackKey.title = blackKeyId;
    bindKeyListeners(blackKey, blackKeyId);
    dummyKey.appendChild(blackKey);
    keyboard.appendChild(dummyKey);
  }

  for (let m = minMidi; m <= maxMidi; m++) {
    const semi = m % 12;
    const isBlack = [1, 3, 6, 8, 10].includes(semi);
    if (isBlack) continue; // black keys are appended inside their preceding white key

    const whiteKeyId = midiNumberToPitch(m);
    const whiteKey = document.createElement("div");
    whiteKey.className = "piano-key white" + (whiteKeyId === "C4" ? " is-middle-c" : "");
    whiteKey.dataset.note = whiteKeyId;

    const wLetter = whiteKeyId.replace(/[0-9]/g, "");
    const wOct = whiteKeyId.replace(/[^0-9]/g, "");
    const wColor = (window.MusicTheory && window.MusicTheory.getCheatSheetNoteColor) ? window.MusicTheory.getCheatSheetNoteColor(whiteKeyId) : "#64748b";
    const wStaff = (window.MusicTheory && window.MusicTheory.getCheatSheetStaffInfo) ? window.MusicTheory.getCheatSheetStaffInfo(whiteKeyId) : null;

    whiteKey.innerHTML = `
      <div class="piano-key-cheat-label" style="color: ${showCheatColors ? wColor : '#64748b'};">
        <span class="key-letter">${wLetter}</span><span class="key-oct">${wOct}</span>
      </div>
    `;
    if (wStaff) {
      whiteKey.title = `${whiteKeyId}: ${wStaff.staffPosition} (${wStaff.mnemonic})`;
    }
    bindKeyListeners(whiteKey, whiteKeyId);

    const nextMidi = m + 1;
    const nextSemi = nextMidi % 12;
    const isNextBlack = [1, 3, 6, 8, 10].includes(nextSemi);
    if (isNextBlack && nextMidi <= maxMidi) {
      const blackKeyId = midiNumberToPitch(nextMidi);
      const blackKey = document.createElement("div");
      blackKey.className = "piano-key black";
      blackKey.dataset.note = blackKeyId;
      const bLetter = blackKeyId.replace(/[0-9]/g, "");
      const bColor = (window.MusicTheory && window.MusicTheory.getCheatSheetNoteColor) ? window.MusicTheory.getCheatSheetNoteColor(blackKeyId) : "#94a3b8";
      blackKey.innerHTML = `<span class="black-key-label" style="color: ${showCheatColors ? bColor : '#94a3b8'};">${bLetter}</span>`;
      blackKey.title = blackKeyId;
      bindKeyListeners(blackKey, blackKeyId);
      whiteKey.appendChild(blackKey);
    }

    keyboard.appendChild(whiteKey);
  }
}

function onKeyboardLayoutChanged() {
  if (typeof updateKeyboardRangeWarning === "function") updateKeyboardRangeWarning();
  if (typeof renderFilterPills === "function") renderFilterPills();
  if (typeof applyCatalogFilters === "function") applyCatalogFilters();
  if (typeof updateFilterHeaderBadges === "function") updateFilterHeaderBadges();
}

function shiftKeyboardStart(delta) {
  const maxStart = 108 - currentKeyCount + 1;
  const newStart = Math.max(21, Math.min(maxStart, currentStartMidi + delta));
  if (newStart !== currentStartMidi) {
    currentStartMidi = newStart;
    updateKeyboardControlsUI();
    buildPianoKeyboard();
    onKeyboardLayoutChanged();
  }
}

function centerMiddleCView(smooth = true) {
  const midC = document.querySelector(".piano-key.is-middle-c");
  if (midC) {
    midC.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "nearest", inline: "center" });
  }
}

function initKeyboardControls() {
  // Restore persisted preferences
  try {
    const savedCount = localStorage.getItem("piano_key_count");
    if (savedCount) {
      const parsed = parseInt(savedCount, 10);
      if (!isNaN(parsed) && parsed >= 12 && parsed <= 88) currentKeyCount = parsed;
    }
    const savedStart = localStorage.getItem("piano_start_midi");
    if (savedStart) {
      const parsed = parseInt(savedStart, 10);
      if (!isNaN(parsed) && parsed >= 21 && parsed <= 84) currentStartMidi = parsed;
    }
  } catch (err) {}

  populateStartKeySelect();
  updateKeyboardControlsUI();
  buildPianoKeyboard();

  const presetSelect = document.getElementById("keyboardPresetSelect");
  if (presetSelect) {
    presetSelect.addEventListener("change", (e) => {
      const val = e.target.value;
      const found = KEYBOARD_PRESETS.find(p => p.id === val);
      if (found) {
        currentKeyCount = found.count;
        currentStartMidi = found.startMidi;
        updateKeyboardControlsUI();
        buildPianoKeyboard();
        onKeyboardLayoutChanged();
        if (currentKeyCount > 37) {
          setTimeout(() => centerMiddleCView(false), 50);
        }
      }
    });
  }

  const keyCountInput = document.getElementById("keyCountInput");
  if (keyCountInput) {
    keyCountInput.addEventListener("change", (e) => {
      let count = parseInt(e.target.value, 10);
      if (isNaN(count)) count = 37;
      count = Math.max(12, Math.min(88, count));
      currentKeyCount = count;
      if (currentStartMidi + currentKeyCount - 1 > 108) {
        currentStartMidi = Math.max(21, 108 - currentKeyCount + 1);
      }
      updateKeyboardControlsUI();
      buildPianoKeyboard();
      onKeyboardLayoutChanged();
    });
  }

  const startKeySelect = document.getElementById("startKeySelect");
  if (startKeySelect) {
    startKeySelect.addEventListener("change", (e) => {
      let startMidi = parseInt(e.target.value, 10);
      if (isNaN(startMidi)) startMidi = 36;
      currentStartMidi = startMidi;
      if (currentStartMidi + currentKeyCount - 1 > 108) {
        currentKeyCount = 108 - currentStartMidi + 1;
      }
      updateKeyboardControlsUI();
      buildPianoKeyboard();
      onKeyboardLayoutChanged();
    });
  }

  const shiftKeyD = document.getElementById("shiftKeyDownBtn");
  if (shiftKeyD) shiftKeyD.addEventListener("click", () => shiftKeyboardStart(-1));

  const shiftKeyU = document.getElementById("shiftKeyUpBtn");
  if (shiftKeyU) shiftKeyU.addEventListener("click", () => shiftKeyboardStart(1));

  const shiftOctD = document.getElementById("shiftKeyDownOctBtn");
  if (shiftOctD) shiftOctD.addEventListener("click", () => shiftKeyboardStart(-12));

  const shiftOctU = document.getElementById("shiftKeyUpOctBtn");
  if (shiftOctU) shiftOctU.addEventListener("click", () => shiftKeyboardStart(12));

  const centerMidCBtn = document.getElementById("centerMidCBtn");
  if (centerMidCBtn) centerMidCBtn.addEventListener("click", () => centerMiddleCView(true));

  // Restore cheat sheet colors preference
  try {
    const savedColors = localStorage.getItem("piano_cheat_sheet_colors");
    const toggleColors = document.getElementById("toggleCheatSheetColors");
    if (toggleColors && savedColors !== null) {
      toggleColors.checked = (savedColors === "true");
    }
  } catch (err) {}

  const toggleColors = document.getElementById("toggleCheatSheetColors");
  if (toggleColors) {
    toggleColors.addEventListener("change", () => {
      try {
        localStorage.setItem("piano_cheat_sheet_colors", toggleColors.checked ? "true" : "false");
      } catch(e) {}
      buildPianoKeyboard();
      if (currentSong && typeof renderSheetMusicScore === "function") {
        renderSheetMusicScore();
      }
    });
  }

  const openCheatBtn = document.getElementById("openCheatSheetBtn");
  if (openCheatBtn) {
    openCheatBtn.addEventListener("click", () => openCheatSheetModal("C4"));
  }
  const theoryCheatBtn = document.getElementById("theoryOpenCheatSheetBtn");
  if (theoryCheatBtn) {
    theoryCheatBtn.addEventListener("click", () => openCheatSheetModal("C4"));
  }

  const closeCheatModalBtn = document.getElementById("csCloseModalBtn");
  if (closeCheatModalBtn) {
    closeCheatModalBtn.addEventListener("click", closeCheatSheetModal);
  }
  const cheatModalBackdrop = document.getElementById("cheatSheetModal");
  if (cheatModalBackdrop) {
    cheatModalBackdrop.addEventListener("click", (e) => {
      if (e.target === cheatModalBackdrop) closeCheatSheetModal();
    });
  }
  const playScaleBtn = document.getElementById("csPlayScaleBtn");
  if (playScaleBtn) {
    playScaleBtn.addEventListener("click", playCheatSheetScaleSequence);
  }
  const playActiveNoteBtn = document.getElementById("csPlayActiveNoteBtn");
  if (playActiveNoteBtn) {
    playActiveNoteBtn.addEventListener("click", () => {
      selectCheatSheetNote(currentCheatSheetSelectedPitch, true);
    });
  }

  // Auto-center Middle C on initial load if keyboard is wide
  if (currentKeyCount > 37) {
    setTimeout(() => centerMiddleCView(false), 100);
  }
}

// INTERACTIVE PIANO NOTES CHEAT SHEET VISUALIZER
function renderCheatSheetSvg() {
  const svg = document.getElementById("cheatSheetSvg");
  if (!svg || !window.MusicTheory) return;
  svg.innerHTML = "";

  const notes = window.MusicTheory.CHEAT_SHEET_NOTES_RANGE;
  if (!notes || notes.length === 0) return;

  const keyW = 44;
  const keyH = 120;
  const kbY = 32;
  const startX = 56;

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <filter id="csKeyGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#f59e0b" flood-opacity="0.8"/>
    </filter>
    <filter id="csNoteGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#ffffff" flood-opacity="0.9"/>
    </filter>
  `;
  svg.appendChild(defs);

  // Title at Top Center
  const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
  title.setAttribute("x", "540");
  title.setAttribute("y", "24");
  title.setAttribute("text-anchor", "middle");
  title.setAttribute("font-size", "18");
  title.setAttribute("font-weight", "900");
  title.setAttribute("fill", "#f8fafc");
  title.setAttribute("letter-spacing", "4");
  title.textContent = "PIANO NOTES";
  svg.appendChild(title);

  // Keyboard Container Group
  const kbGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  kbGroup.setAttribute("class", "cs-keyboard-group");

  // White keys
  notes.forEach((noteInfo, idx) => {
    const kx = startX + idx * keyW;
    const kwGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    kwGroup.setAttribute("class", `cs-svg-key cs-key-white cs-key-${noteInfo.pitch}`);
    kwGroup.setAttribute("data-pitch", noteInfo.pitch);

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", kx);
    rect.setAttribute("y", kbY);
    rect.setAttribute("width", keyW);
    rect.setAttribute("height", keyH);
    rect.setAttribute("rx", "3");
    rect.setAttribute("fill", "#ffffff");
    rect.setAttribute("stroke", "#0f172a");
    rect.setAttribute("stroke-width", "1.5");
    kwGroup.appendChild(rect);

    // Letter label at bottom of white key
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", kx + keyW / 2);
    label.setAttribute("y", kbY + keyH - 12);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "15");
    label.setAttribute("font-weight", "900");
    label.setAttribute("fill", noteInfo.color);
    label.setAttribute("pointer-events", "none");
    label.textContent = noteInfo.letter;
    kwGroup.appendChild(label);

    // Middle C label
    if (noteInfo.isMiddleC) {
      const midLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      midLabel.setAttribute("x", kx + keyW / 2);
      midLabel.setAttribute("y", kbY + 36);
      midLabel.setAttribute("text-anchor", "middle");
      midLabel.setAttribute("font-size", "7.5");
      midLabel.setAttribute("font-weight", "900");
      midLabel.setAttribute("fill", "#ef4444");
      midLabel.setAttribute("transform", `rotate(-90 ${kx + keyW / 2} ${kbY + 36})`);
      midLabel.setAttribute("pointer-events", "none");
      midLabel.textContent = "MIDDLE C";
      kwGroup.appendChild(midLabel);
    }

    kwGroup.addEventListener("click", () => selectCheatSheetNote(noteInfo.pitch));
    kbGroup.appendChild(kwGroup);
  });

  // Black keys
  const blackKeyWidth = 24;
  const blackKeyHeight = 74;
  const blackOffsets = [
    { idx: 0, pitch: "G#2" },
    { idx: 1, pitch: "A#2" },
    { idx: 3, pitch: "C#3" },
    { idx: 4, pitch: "D#3" },
    { idx: 6, pitch: "F#3" },
    { idx: 7, pitch: "G#3" },
    { idx: 8, pitch: "A#3" },
    { idx: 10, pitch: "C#4" },
    { idx: 11, pitch: "D#4" },
    { idx: 13, pitch: "F#4" },
    { idx: 14, pitch: "G#4" },
    { idx: 15, pitch: "A#4" },
    { idx: 17, pitch: "C#5" },
    { idx: 18, pitch: "D#5" },
    { idx: 20, pitch: "F#5" }
  ];

  blackOffsets.forEach(bo => {
    const bx = startX + (bo.idx + 1) * keyW - blackKeyWidth / 2;
    const bGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    bGroup.setAttribute("class", `cs-svg-key cs-key-black cs-key-${bo.pitch.replace('#', 's')}`);
    bGroup.setAttribute("data-pitch", bo.pitch);

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", bx);
    rect.setAttribute("y", kbY);
    rect.setAttribute("width", blackKeyWidth);
    rect.setAttribute("height", blackKeyHeight);
    rect.setAttribute("rx", "2");
    rect.setAttribute("fill", "#1e293b");
    rect.setAttribute("stroke", "#020617");
    rect.setAttribute("stroke-width", "1.5");
    bGroup.appendChild(rect);

    bGroup.addEventListener("click", () => selectCheatSheetNote(bo.pitch));
    kbGroup.appendChild(bGroup);
  });

  svg.appendChild(kbGroup);

  // Middle C Header Label in Center between Staves
  const midCKeyIdx = 10; // C4
  const midCX = startX + midCKeyIdx * keyW + keyW / 2;

  const midText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  midText.setAttribute("x", midCX);
  midText.setAttribute("y", "182");
  midText.setAttribute("text-anchor", "middle");
  midText.setAttribute("font-size", "11");
  midText.setAttribute("font-weight", "900");
  midText.setAttribute("fill", "#f8fafc");
  midText.setAttribute("letter-spacing", "2");
  midText.textContent = "MIDDLE";
  svg.appendChild(midText);

  const midCText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  midCText.setAttribute("x", midCX);
  midCText.setAttribute("y", "198");
  midCText.setAttribute("text-anchor", "middle");
  midCText.setAttribute("font-size", "14");
  midCText.setAttribute("font-weight", "900");
  midCText.setAttribute("fill", "#ef4444");
  midCText.textContent = "C";
  svg.appendChild(midCText);

  // Staves Group
  const stavesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  stavesGroup.setAttribute("class", "cs-staves-group");

  const staffLeftX = 40;
  const staffRightX = 1040;

  // Treble Clef 5 Lines (y: 228 to 292, spacing 16px)
  const trebleLineYs = [228, 244, 260, 276, 292];
  trebleLineYs.forEach(ly => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", staffLeftX);
    line.setAttribute("x2", staffRightX);
    line.setAttribute("y1", ly);
    line.setAttribute("y2", ly);
    line.setAttribute("stroke", "#475569");
    line.setAttribute("stroke-width", "1.2");
    stavesGroup.appendChild(line);
  });

  // Treble Clef Glyph
  const tClef = document.createElementNS("http://www.w3.org/2000/svg", "text");
  tClef.setAttribute("x", "52");
  tClef.setAttribute("y", "288");
  tClef.setAttribute("font-size", "52");
  tClef.setAttribute("fill", "#f8fafc");
  tClef.setAttribute("class", "clef-text");
  tClef.setAttribute("pointer-events", "none");
  tClef.textContent = "𝄞";
  stavesGroup.appendChild(tClef);

  // Bass Clef 5 Lines (y: 450 to 514, spacing 16px)
  const bassLineYs = [450, 466, 482, 498, 514];
  bassLineYs.forEach(ly => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", staffLeftX);
    line.setAttribute("x2", staffRightX);
    line.setAttribute("y1", ly);
    line.setAttribute("y2", ly);
    line.setAttribute("stroke", "#475569");
    line.setAttribute("stroke-width", "1.2");
    stavesGroup.appendChild(line);
  });

  // Bass Clef Glyph
  const bClef = document.createElementNS("http://www.w3.org/2000/svg", "text");
  bClef.setAttribute("x", "52");
  bClef.setAttribute("y", "484");
  bClef.setAttribute("font-size", "42");
  bClef.setAttribute("fill", "#f8fafc");
  bClef.setAttribute("class", "clef-text");
  bClef.setAttribute("pointer-events", "none");
  bClef.textContent = "𝄢";
  stavesGroup.appendChild(bClef);

  svg.appendChild(stavesGroup);

  // Ledger Lines between Staves
  const ledgerGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  ledgerGroup.setAttribute("class", "cs-ledger-group");

  function drawLedger(cx, cy) {
    const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
    l.setAttribute("x1", cx - 16);
    l.setAttribute("x2", cx + 16);
    l.setAttribute("y1", cy);
    l.setAttribute("y2", cy);
    l.setAttribute("stroke", "#64748b");
    l.setAttribute("stroke-width", "1.5");
    ledgerGroup.appendChild(l);
  }

  // Treble ledger line 1 (Middle C below treble: y = 308)
  drawLedger(midCX, 308);
  // Treble ledger line 2 (A3 below treble: y = 324)
  const a3X = startX + 8 * keyW + keyW / 2;
  drawLedger(a3X, 324);
  // Treble ledger line 1 across B3 space
  const b3X = startX + 9 * keyW + keyW / 2;
  drawLedger(b3X, 308);

  // Bass ledger line 1 (Middle C above bass: y = 434)
  drawLedger(midCX, 434);
  // Bass ledger line 2 (E4 above bass: y = 418)
  const e4X = startX + 12 * keyW + keyW / 2;
  drawLedger(e4X, 418);
  // Bass ledger line 1 across D4 space
  const d4X = startX + 11 * keyW + keyW / 2;
  drawLedger(d4X, 434);
  // Bass ledger line 2 across F4 space
  const f4X = startX + 13 * keyW + keyW / 2;
  drawLedger(f4X, 418);

  svg.appendChild(ledgerGroup);

  // Dotted Vertical Guidelines Group
  const guideGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  guideGroup.setAttribute("class", "cs-guidelines-group");

  const notePositions = {
    'G2': [{ y: 514, clef: 'bass' }],
    'A2': [{ y: 506, clef: 'bass' }],
    'B2': [{ y: 498, clef: 'bass' }],
    'C3': [{ y: 490, clef: 'bass' }],
    'D3': [{ y: 482, clef: 'bass' }],
    'E3': [{ y: 474, clef: 'bass' }],
    'F3': [{ y: 466, clef: 'bass' }],
    'G3': [{ y: 458, clef: 'bass' }],
    'A3': [{ y: 450, clef: 'bass' }, { y: 324, clef: 'treble' }],
    'B3': [{ y: 442, clef: 'bass' }, { y: 316, clef: 'treble' }],
    'C4': [{ y: 434, clef: 'bass' }, { y: 308, clef: 'treble' }],
    'D4': [{ y: 426, clef: 'bass' }, { y: 300, clef: 'treble' }],
    'E4': [{ y: 418, clef: 'bass' }, { y: 292, clef: 'treble' }],
    'F4': [{ y: 410, clef: 'bass' }, { y: 284, clef: 'treble' }],
    'G4': [{ y: 276, clef: 'treble' }],
    'A4': [{ y: 268, clef: 'treble' }],
    'B4': [{ y: 260, clef: 'treble' }],
    'C5': [{ y: 252, clef: 'treble' }],
    'D5': [{ y: 244, clef: 'treble' }],
    'E5': [{ y: 236, clef: 'treble' }],
    'F5': [{ y: 228, clef: 'treble' }],
    'G5': [{ y: 220, clef: 'treble' }]
  };

  // Draw Guidelines
  notes.forEach((noteInfo, idx) => {
    const kx = startX + idx * keyW + keyW / 2;
    const targets = notePositions[noteInfo.pitch] || [];
    const maxY = Math.max(...targets.map(t => t.y), kbY + keyH + 40);

    const guide = document.createElementNS("http://www.w3.org/2000/svg", "line");
    guide.setAttribute("class", `cs-guideline cs-guide-${noteInfo.pitch}`);
    guide.setAttribute("x1", kx);
    guide.setAttribute("x2", kx);
    guide.setAttribute("y1", kbY + keyH);
    guide.setAttribute("y2", maxY + 14);
    guide.setAttribute("stroke", noteInfo.color);
    guide.setAttribute("stroke-dasharray", noteInfo.isMiddleC ? "4,3" : "3,3");
    guide.setAttribute("stroke-width", noteInfo.isMiddleC ? "2.5" : "1.5");
    guide.setAttribute("opacity", noteInfo.isMiddleC ? "1.0" : "0.75");
    guideGroup.appendChild(guide);
  });

  svg.appendChild(guideGroup);

  // Noteheads Group
  const noteheadGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  noteheadGroup.setAttribute("class", "cs-noteheads-group");

  notes.forEach((noteInfo, idx) => {
    const kx = startX + idx * keyW + keyW / 2;
    const targets = notePositions[noteInfo.pitch] || [];

    targets.forEach(tgt => {
      const nhGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      nhGroup.setAttribute("class", `cs-notehead cs-nh-${noteInfo.pitch}`);
      nhGroup.setAttribute("data-pitch", noteInfo.pitch);

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", kx);
      circle.setAttribute("cy", tgt.y);
      circle.setAttribute("r", "10");
      circle.setAttribute("fill", noteInfo.color);
      circle.setAttribute("stroke", "#ffffff");
      circle.setAttribute("stroke-width", "1.6");
      nhGroup.appendChild(circle);

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", kx);
      text.setAttribute("y", tgt.y);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "central");
      text.setAttribute("font-size", "10.5");
      text.setAttribute("font-weight", "900");
      text.setAttribute("fill", "#ffffff");
      text.setAttribute("pointer-events", "none");
      text.textContent = noteInfo.letter;
      nhGroup.appendChild(text);

      nhGroup.addEventListener("click", () => selectCheatSheetNote(noteInfo.pitch));
      noteheadGroup.appendChild(nhGroup);
    });
  });

  svg.appendChild(noteheadGroup);
  isCheatSheetSvgRendered = true;
}

function selectCheatSheetNote(pitch, playSound = true) {
  if (!pitch || !window.MusicTheory) return;
  currentCheatSheetSelectedPitch = pitch;

  const staffInfo = window.MusicTheory.getCheatSheetStaffInfo(pitch);
  if (!staffInfo) return;

  // Update Inspector Badges
  const badge = document.getElementById("csActiveBadge");
  if (badge) {
    badge.textContent = staffInfo.letter;
    badge.style.background = staffInfo.color;
    badge.style.boxShadow = `0 0 16px ${staffInfo.color}88`;
  }

  const pitchEl = document.getElementById("csActivePitch");
  if (pitchEl) {
    pitchEl.textContent = `${staffInfo.pitch} ${staffInfo.isMiddleC ? '(Middle C)' : ''}`;
  }

  const freqEl = document.getElementById("csActiveFreq");
  if (freqEl) {
    freqEl.textContent = `${staffInfo.freq.toFixed(2)} Hz`;
  }

  const posEl = document.getElementById("csActivePos");
  if (posEl) {
    posEl.textContent = staffInfo.staffPosition;
    posEl.style.color = staffInfo.color;
  }

  const mnemEl = document.getElementById("csActiveMnemonic");
  if (mnemEl) {
    mnemEl.innerHTML = `Mnemonic: <strong>${staffInfo.mnemonic}</strong>`;
  }

  // Visual Highlighting on SVG
  document.querySelectorAll(".cs-svg-key").forEach(k => k.classList.remove("is-active"));
  document.querySelectorAll(`.cs-key-${pitch.replace('#', 's')}`).forEach(k => k.classList.add("is-active"));

  document.querySelectorAll(".cs-notehead").forEach(n => n.classList.remove("is-active"));
  document.querySelectorAll(`.cs-nh-${pitch.replace('#', 's')}`).forEach(n => n.classList.add("is-active"));

  document.querySelectorAll(".cs-guideline").forEach(g => g.classList.remove("is-active"));
  document.querySelectorAll(`.cs-guide-${pitch.replace('#', 's')}`).forEach(g => g.classList.add("is-active"));

  // Play Sound & trigger Live Sustain stage
  const midiNum = window.MusicTheory.pitchToMidi(pitch);
  if (playSound) {
    if (isSynthAudioEnabled()) initAudio();
    const freq = window.MusicTheory.pitchToFreq(pitch);
    if (freq) playTone(freq, 0.7, 90, (midiNum && midiNum < 60) ? "lh" : "rh");
  }

  if (midiNum) {
    createSustainLane(midiNum, pitch);
    setTimeout(() => removeSustainLane(midiNum), 750);
  }
}

function openCheatSheetModal(initialPitch = "C4") {
  const modal = document.getElementById("cheatSheetModal");
  if (!modal) return;
  modal.classList.add("is-open");

  if (!isCheatSheetSvgRendered) {
    renderCheatSheetSvg();
  }
  selectCheatSheetNote(initialPitch, false);
}

function closeCheatSheetModal() {
  const modal = document.getElementById("cheatSheetModal");
  if (!modal) return;
  modal.classList.remove("is-open");
}

function playCheatSheetScaleSequence() {
  if (isCheatSheetScalePlaying) return;
  isCheatSheetScalePlaying = true;

  const btn = document.getElementById("csPlayScaleBtn");
  if (btn) btn.textContent = "⏹ Playing...";

  const notes = window.MusicTheory.CHEAT_SHEET_NOTES_RANGE.map(n => n.pitch);
  let idx = 0;

  const stepTimer = setInterval(() => {
    if (idx >= notes.length) {
      clearInterval(stepTimer);
      isCheatSheetScalePlaying = false;
      if (btn) btn.textContent = "▶ Play Range (G2–G5)";
      return;
    }
    selectCheatSheetNote(notes[idx], true);
    idx++;
  }, 350);
}

function playSingleNoteAudit(noteStr, hand = "rh", playSound = true) {
  const freq = getNoteFreq(noteStr);
  if (freq && playSound) playTone(freq, 0.4, 90, hand);
  highlightPlaybackKey(noteStr, hand, 400);
}

function highlightPlaybackKey(noteStr, hand, durationMs = 350) {
  if (!noteStr || noteStr === "-") return;
  const tokens = noteStr.split("+");
  tokens.forEach(t => {
    let clean = t.trim();
    if (!clean.match(/[1-7]/)) {
      clean += (hand === "lh" ? "2" : "4");
    }
    const keyEl = findPianoKeyElement(clean, hand === "lh" ? 2 : 4);
    if (keyEl) {
      const activeClass = hand === "dyad" ? "active-dyad" : (hand === "lh" ? "active-lh" : "active-rh");
      keyEl.classList.add(activeClass);
      setTimeout(() => {
        keyEl.classList.remove(activeClass);
      }, durationMs);
    }
  });
}

// Live Sustain Lane Factory (Tinted with pianoNotesCheatSheet.png Note Colors & Staff Positions)
function createSustainLane(noteNumber, pitchName) {
  if (!noteNumber || !pitchName) return;
  if (activeHeldMidiNotes.has(noteNumber)) return;

  const showCheatColors = isCheatSheetColorsEnabled();
  const color = (showCheatColors && window.MusicTheory && window.MusicTheory.getCheatSheetNoteColor) 
    ? window.MusicTheory.getCheatSheetNoteColor(pitchName) 
    : "#fbbf24";
  const staffInfo = (window.MusicTheory && window.MusicTheory.getCheatSheetStaffInfo) 
    ? window.MusicTheory.getCheatSheetStaffInfo(pitchName) 
    : null;

  const lane = document.createElement("div");
  lane.className = "sustain-lane";
  lane.id = `lane_${noteNumber}`;
  lane.style.borderLeft = `3px solid ${color}`;

  const staffText = staffInfo ? staffInfo.staffPosition : `#${noteNumber}`;
  const isMidC = (pitchName === "C4");

  lane.innerHTML = `
    <div class="lane-badge">
      <span class="lane-pitch" style="color: ${color}; text-shadow: 0 0 10px ${color}88;">${pitchName}</span>
      <span class="lane-staff-badge ${isMidC ? 'is-mid-c' : ''}" style="border: 1px solid ${color}66; color: ${color}; background: ${color}15;">${staffText}</span>
      <span class="lane-midi-num">#${noteNumber}</span>
    </div>
    <div class="lane-rail-track">
      <div class="rail-ticks">
        <div class="rail-tick" style="left: 25%;"><span class="rail-tick-label">1b</span></div>
        <div class="rail-tick" style="left: 50%;"><span class="rail-tick-label">2b</span></div>
        <div class="rail-tick" style="left: 75%;"><span class="rail-tick-label">3b</span></div>
      </div>
      <div class="lane-rail-fill" style="background: linear-gradient(90deg, ${color}33 0%, ${color}aa 60%, ${color} 100%); box-shadow: 0 0 14px ${color}88;">
        <div class="rail-spark-head" style="box-shadow: 0 0 10px #ffffff, 0 0 16px ${color};"></div>
      </div>
    </div>
    <div class="lane-stats">0.00s • 0.00 beats</div>
  `;

  const container = document.getElementById("sustainLanesContainer");
  const placeholder = document.getElementById("emptyPlaceholder");
  if (placeholder) placeholder.style.display = "none";
  if (container) container.appendChild(lane);

  activeHeldMidiNotes.set(noteNumber, {
    num: noteNumber,
    pitch: pitchName,
    startTime: performance.now(),
    element: lane,
    fillEl: lane.querySelector(".lane-rail-fill"),
    statsEl: lane.querySelector(".lane-stats")
  });

  const countEl = document.getElementById("activeCount");
  if (countEl) countEl.textContent = activeHeldMidiNotes.size;

  if (activeHeldMidiNotes.size === 1) requestAnimationFrame(updateSustainRailsLoop);
  updateActiveChordRecognizer();
}

function removeSustainLane(noteNumber) {
  if (!noteNumber) return;
  if (activeHeldMidiNotes.has(noteNumber)) {
    const noteData = activeHeldMidiNotes.get(noteNumber);
    if (noteData.element) {
      noteData.element.style.transition = "opacity 0.18s ease-out, transform 0.18s ease-out";
      noteData.element.style.opacity = "0";
      noteData.element.style.transform = "translateY(-4px)";
      setTimeout(() => {
        if (noteData.element && noteData.element.parentNode) {
          noteData.element.remove();
        }
      }, 180);
    }
    activeHeldMidiNotes.delete(noteNumber);
  }

  if (activeHeldMidiNotes.size === 0) {
    const placeholder = document.getElementById("emptyPlaceholder");
    if (placeholder) placeholder.style.display = "flex";
  }
  const countEl = document.getElementById("activeCount");
  if (countEl) countEl.textContent = activeHeldMidiNotes.size;
  updateActiveChordRecognizer();
}

// 60FPS Sustain Ribbon Loop
function updateSustainRailsLoop() {
  const bpm = parseInt(document.getElementById("tempoSlider").value, 10);
  const beatSec = 60 / bpm;
  const maxRangeSec = beatSec * 4;
  const now = performance.now();

  activeHeldMidiNotes.forEach(noteData => {
    const elapsedSec = (now - noteData.startTime) / 1000;
    const beats = elapsedSec / beatSec;
    const pct = Math.min(100, (elapsedSec / maxRangeSec) * 100);

    if (noteData.fillEl) noteData.fillEl.style.width = `${pct}%`;
    if (noteData.statsEl) {
      noteData.statsEl.innerHTML = `<span class="bold-sec">${elapsedSec.toFixed(2)}s</span> • <span class="bold-beats">${beats.toFixed(2)} beats</span>`;
    }
  });

  if (activeHeldMidiNotes.size > 0) {
    requestAnimationFrame(updateSustainRailsLoop);
  }
}
