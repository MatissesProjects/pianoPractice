// ============================================================================
// SONG CATALOG, KEYBOARD RANGE FILTERING, THEORY DNA & CURRICULUM CONTROLS
// ============================================================================

function getActiveHandOptions() {
  const scopeSelect = document.getElementById("catalogKbScopeSelect");
  const scope = scopeSelect ? scopeSelect.value : keyboardFilterScope;
  if (scope === "full_song") {
    return { rh: true, lh: true, dyads: true };
  }
  const rhOn = document.getElementById("toggleRH") ? document.getElementById("toggleRH").checked : true;
  const lhOn = document.getElementById("toggleLH") ? document.getElementById("toggleLH").checked : false;
  const dyadOn = document.getElementById("toggleDyads") ? document.getElementById("toggleDyads").checked : false;
  return { rh: rhOn, lh: lhOn, dyads: dyadOn };
}

function getSongKeyboardCompatibility(song) {
  const config = { startMidi: currentStartMidi, keyCount: currentKeyCount };
  const handOpts = getActiveHandOptions();
  if (typeof evaluateSongKeyboardCompatibility === "function") {
    return evaluateSongKeyboardCompatibility(song, config, handOpts);
  }
  if (window.MusicTheory && window.MusicTheory.evaluateSongKeyboardCompatibility) {
    return window.MusicTheory.evaluateSongKeyboardCompatibility(song, config, handOpts);
  }
  return { fitsExact: true, fitsSpan: true, status: "fits", statusMessage: "Fits", range: { minPitch: "C4", maxPitch: "C4", span: 1 }, recommendedPreset: "37", recommendedPresetName: "37 Keys" };
}

function autoFitKeyboardToSong(song) {
  if (!song) return;
  const handOpts = getActiveHandOptions();
  const range = (typeof getSongPitchRange === "function")
    ? getSongPitchRange(song, handOpts)
    : (window.MusicTheory && window.MusicTheory.getSongPitchRange ? window.MusicTheory.getSongPitchRange(song, handOpts) : null);
  if (!range) return;

  const targetPreset = range.minExactPreset || { count: 88, startMidi: 21, id: "88", name: "88 Keys" };
  currentKeyCount = targetPreset.count;
  currentStartMidi = targetPreset.startMidi;
  updateKeyboardControlsUI();
  buildPianoKeyboard();
  updateKeyboardRangeWarning();
  renderFilterPills();
  applyCatalogFilters();
  if (currentKeyCount > 37) {
    setTimeout(() => centerMiddleCView(false), 50);
  }
}

function shiftKeyboardToFitSong(song) {
  if (!song) return;
  const compat = getSongKeyboardCompatibility(song);
  if (compat && compat.shiftNeeded) {
    shiftKeyboardStart(compat.shiftNeeded);
    updateKeyboardRangeWarning();
    renderFilterPills();
    applyCatalogFilters();
  }
}

function updateKeyboardRangeWarning() {
  const banner = document.getElementById("keyboardRangeWarningBanner");
  if (!banner || !currentSong) return;

  if (isKbWarningDismissedForSong) {
    banner.style.display = "none";
    return;
  }

  const compat = getSongKeyboardCompatibility(currentSong);
  const titleEl = document.getElementById("kbWarningTitle");
  const descEl = document.getElementById("kbWarningDesc");
  const autoFitBtn = document.getElementById("kbWarningAutoFitBtn");
  const shiftBtn = document.getElementById("kbWarningShiftBtn");

  if (compat.status === "exceeds") {
    banner.style.display = "flex";
    if (titleEl) titleEl.textContent = `⚠️ Song Exceeds Keyboard Size: "${currentSong.title}"`;
    if (descEl) descEl.textContent = `Requires ${compat.range.span} keys (${compat.range.minPitch} to ${compat.range.maxPitch}). Current keyboard has ${currentKeyCount} keys (${midiNumberToPitch(currentStartMidi)} to ${midiNumberToPitch(currentStartMidi + currentKeyCount - 1)}).`;
    if (autoFitBtn) {
      autoFitBtn.style.display = "inline-flex";
      autoFitBtn.textContent = `⚡ Auto-Fit to ${compat.recommendedPresetName || (compat.recommendedPreset + ' Keys')}`;
    }
    if (shiftBtn) shiftBtn.style.display = "none";
  } else if (compat.status === "shift_needed") {
    banner.style.display = "flex";
    if (titleEl) titleEl.textContent = `↔ Keyboard Shift Recommended: "${currentSong.title}"`;
    if (descEl) descEl.textContent = `Notes span ${compat.range.span} keys (${compat.range.minPitch} to ${compat.range.maxPitch}), which fits your ${currentKeyCount}-key keyboard if shifted.`;
    if (shiftBtn) {
      shiftBtn.style.display = "inline-flex";
      shiftBtn.textContent = `↔ Shift ${compat.shiftNeeded > 0 ? '+' : ''}${compat.shiftNeeded} Semitones`;
    }
    if (autoFitBtn) autoFitBtn.style.display = "none";
  } else {
    banner.style.display = "none";
  }
}

function updateFilterHeaderBadges() {
  const currentConfig = { startMidi: currentStartMidi, keyCount: currentKeyCount };
  const handOpts = getActiveHandOptions();
  const playableCount = songDatabase.filter(s => {
    const c = evaluateSongKeyboardCompatibility(s, currentConfig, handOpts);
    return c.fitsExact;
  }).length;

  const badge = document.getElementById("keyboardFilterStatsBadge");
  if (badge) {
    badge.textContent = `${playableCount} / ${songDatabase.length} Playable (${currentKeyCount} Keys)`;
  }

  const dockLabel = document.getElementById("kbDockFilterLabel");
  if (dockLabel) {
    dockLabel.textContent = `🎹 Fit Keyboard (${playableCount}/${songDatabase.length})`;
  }

  const toggleCheckbox = document.getElementById("catalogKbFilterToggle");
  if (toggleCheckbox) toggleCheckbox.checked = filterByKeyboard;

  const dockCheckbox = document.getElementById("kbDockFilterCheckbox");
  if (dockCheckbox) dockCheckbox.checked = filterByKeyboard;

  const scopeSelect = document.getElementById("catalogKbScopeSelect");
  if (scopeSelect) scopeSelect.value = keyboardFilterScope;
}

function handleFilterByKeyboardToggle(checked) {
  filterByKeyboard = checked;
  try {
    localStorage.setItem("piano_filter_by_keyboard", filterByKeyboard.toString());
  } catch (err) {}
  const c1 = document.getElementById("catalogKbFilterToggle");
  const c2 = document.getElementById("kbDockFilterCheckbox");
  if (c1) c1.checked = filterByKeyboard;
  if (c2) c2.checked = filterByKeyboard;
  renderFilterPills();
  applyCatalogFilters();
}

// Dropdown Population & Filter Pills
function populateDropdown(songsToUse = songDatabase) {
  const select = document.getElementById("songDropdown");
  if (!select) return;
  select.innerHTML = "";

  const currentConfig = { startMidi: currentStartMidi, keyCount: currentKeyCount };
  const handOpts = getActiveHandOptions();

  // If filterByKeyboard is active, only show compatible songs
  const songsAllowed = filterByKeyboard
    ? songsToUse.filter(s => evaluateSongKeyboardCompatibility(s, currentConfig, handOpts).fitsExact)
    : songsToUse;

  const categories = [...new Set(songDatabase.map(s => s.category))];
  categories.forEach(cat => {
    const matching = songsAllowed.filter(s => s.category === cat);
    if (matching.length > 0) {
      const group = document.createElement("optgroup");
      group.label = `${cat} (${matching.length})`;
      matching.forEach(song => {
        const opt = document.createElement("option");
        opt.value = song.id;
        const compat = evaluateSongKeyboardCompatibility(song, currentConfig, handOpts);
        const tag = (!filterByKeyboard && compat.status === "exceeds") ? ` [⚠️ Needs ${compat.recommendedPreset}k]` : "";
        opt.textContent = `${song.title}${tag}`;
        group.appendChild(opt);
      });
      select.appendChild(group);
    }
  });

  if (currentSong && songsAllowed.some(s => s.id === currentSong.id)) {
    select.value = currentSong.id;
  } else if (songsAllowed.length > 0) {
    select.value = songsAllowed[0].id;
  }
}

function loadSong(song) {
  if (typeof clearWaitPracticeTimer === "function") clearWaitPracticeTimer();
  stopPlayback(false);
  currentSong = song;
  currentPracticeStep = 0;
  if (typeof transportState !== "undefined") {
    transportState.currentStepIndex = 0;
    transportState.loopPassCount = 0;
    transportState.activeSpeedPct = 100;
  }
  isPracticeSessionStarted = false;
  isKbWarningDismissedForSong = false;
  const scoreContainer = document.getElementById("sheetMusicSection");
  if (scoreContainer) scoreContainer.scrollTop = 0;
  lastScoreScrollTarget = 0;
  lastScoreScrollTime = 0;
  document.getElementById("songDropdown").value = song.id;
  document.getElementById("tempoSlider").value = song.tempo;
  document.getElementById("tempoText").textContent = `Tempo: ${song.tempo} BPM`;
  document.querySelectorAll(".speed-pct-btn").forEach(btn => {
    btn.classList.toggle("active", parseInt(btn.dataset.pct, 10) === 100);
  });

  parseSongSteps();
  renderSheetMusicScore();
  highlightActiveCard();
  updateKeyboardRangeWarning();
  renderSongTheoryDnaBar(song);
  if (typeof applyAutoSongInstrument === "function") {
    applyAutoSongInstrument(song);
  } else {
    updateSongInstrumentUI();
  }
  if (typeof updateTransportUI === "function") updateTransportUI();
}

function renderSongTheoryDnaBar(song) {
  if (!song || !window.MusicTheory || !window.MusicTheory.analyzeSongTheoryDNA) return;
  const handOpts = {
    rh: document.getElementById("toggleRH") ? document.getElementById("toggleRH").checked : true,
    lh: document.getElementById("toggleLH") ? document.getElementById("toggleLH").checked : false,
    dyads: document.getElementById("toggleDyads") ? document.getElementById("toggleDyads").checked : false,
    harmonyType: document.getElementById("harmonyTypeSelect") ? document.getElementById("harmonyTypeSelect").value : "song",
    lhStyle: document.getElementById("lhStyleSelect") ? document.getElementById("lhStyleSelect").value : "roots"
  };
  const dna = window.MusicTheory.analyzeSongTheoryDNA(song, handOpts);
  if (!dna) return;

  const keyEl = document.getElementById("dnaKeyText");
  if (keyEl) keyEl.textContent = `${dna.keySignature} (${dna.accidentalSummary})`;

  const meterEl = document.getElementById("dnaMeterText");
  if (meterEl) meterEl.textContent = `${dna.timeSignature} (${dna.beatsPerMeasure} beats/bar)`;

  const rangeEl = document.getElementById("dnaRangeText");
  if (rangeEl) rangeEl.textContent = `${dna.handSpanSummary} · ${dna.totalNotes} notes`;

  const chordsContainer = document.getElementById("dnaChordsContainer");
  if (chordsContainer) {
    chordsContainer.innerHTML = "";
    if (dna.primaryChords && dna.primaryChords.length > 0) {
      dna.primaryChords.forEach(ch => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "dna-chord-chip";
        chip.title = "Click to hear & see this chord on the piano";
        chip.textContent = `🎹 ${ch.label}`;
        chip.addEventListener("click", () => {
          initAudio();
          document.querySelectorAll(".piano-key").forEach(k => k.classList.remove("active-rh", "active-lh", "active-dyad"));
          (ch.pitches || []).forEach(p => {
            playTone(window.MusicTheory.pitchToFreq(p), 0.75);
            highlightPlaybackKey(p, "dyad", 850);
          });
        });
        chordsContainer.appendChild(chip);
      });
    } else {
      chordsContainer.innerHTML = `<span class="dna-value" style="font-size:0.78rem;">Single-Line Melody</span>`;
    }
  }

  const warmupBtn = document.getElementById("dnaPlayScaleWarmupBtn");
  if (warmupBtn) {
    warmupBtn.onclick = () => {
      if (!dna.warmupScale || !dna.warmupScale.notes) return;
      initAudio();
      let delay = 0;
      dna.warmupScale.notes.forEach(n => {
        setTimeout(() => {
          playTone(n.freq, 0.32);
          highlightPlaybackKey(n.pitch, "rh", 300);
        }, delay);
        delay += 260;
      });
    };
  }

  const bootcampBtn = document.getElementById("repLaunchBootcampBtn");
  if (bootcampBtn && !bootcampBtn.dataset.wired) {
    bootcampBtn.dataset.wired = "true";
    bootcampBtn.addEventListener("click", () => {
      const theoryNav = document.querySelector('.mode-nav-btn[data-mode="theory"]');
      if (theoryNav) theoryNav.click();
      const sec = document.getElementById("beginnerBootcampSection");
      if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

function highlightActiveCard() {
  document.querySelectorAll(".catalog-card").forEach(c => {
    if (currentSong && c.dataset.id === currentSong.id) c.classList.add("active-card");
    else c.classList.remove("active-card");
  });
}

function renderCatalog(songsToRender) {
  const grid = document.getElementById("catalogGrid");
  if (!grid) return;
  grid.innerHTML = "";

  if (songsToRender.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">No songs match your filter or keyboard size.</div>`;
    return;
  }

  const currentConfig = { startMidi: currentStartMidi, keyCount: currentKeyCount };
  const handOpts = getActiveHandOptions();

  songsToRender.forEach(song => {
    const compat = evaluateSongKeyboardCompatibility(song, currentConfig, handOpts);
    const card = document.createElement("div");
    const isDisallowed = compat.status === "exceeds";
    card.className = "catalog-card" 
      + (currentSong && song.id === currentSong.id ? " active-card" : "")
      + (isDisallowed ? " disallowed-song" : "");
    card.dataset.id = song.id;
    card.dataset.compat = compat.status;

    let compatTagHtml = "";
    if (compat.status === "fits") {
      compatTagHtml = `<span class="compat-tag compat-fits" title="Fits current ${currentKeyCount}-key keyboard">✓ Fits ${currentKeyCount}k</span>`;
    } else if (compat.status === "shift_needed") {
      compatTagHtml = `<span class="compat-tag compat-shift" title="${compat.statusMessage}">↔ Shift (${compat.shiftNeeded > 0 ? '+' : ''}${compat.shiftNeeded})</span>`;
    } else {
      compatTagHtml = `<span class="compat-tag compat-exceeds" title="${compat.statusMessage}">🚫 Needs ${compat.recommendedPreset}k</span>`;
    }

    const actionRight = isDisallowed
      ? `<span class="card-action-auto-fit" data-action="autofit" title="Auto-expand keyboard to ${compat.recommendedPreset} keys and load">⚡ Auto-Fit (${compat.recommendedPreset}k) & Load</span>`
      : `<span>Load Piece →</span>`;

    const songInstId = (window.MusicTheory && window.MusicTheory.getSongDefaultInstrument)
      ? window.MusicTheory.getSongDefaultInstrument(song)
      : (song.instrument || "grand_piano");
    const songInstParams = (window.MusicTheory && window.MusicTheory.getInstrumentParameters)
      ? window.MusicTheory.getInstrumentParameters(songInstId)
      : { icon: "🎹", shortName: "Piano" };
    const instBadgeHtml = `<span class="card-inst-badge" title="Authentic Instrument: ${songInstParams.name || songInstParams.shortName}">${songInstParams.icon} ${songInstParams.shortName}</span>`;

    card.innerHTML = `
      <div>
        <div class="card-top">
          <span class="card-title">${song.title}</span>
          <span class="card-badge">${song.category}</span>
        </div>
        <div class="card-meta-row">
          <span class="card-range-badge" title="Pitch Range">${compat.range.minPitch || 'C4'} – ${compat.range.maxPitch || 'C4'} (${compat.range.span}k)</span>
          ${compatTagHtml}
          ${instBadgeHtml}
        </div>
        <div class="card-preview">Score: ${song.rh.slice(0, 36)}...</div>
      </div>
      <div class="card-action">
        <span>Staff Notation ✓</span>
        ${actionRight}
      </div>
    `;

    card.addEventListener("click", (e) => {
      if (e.target.dataset.action === "autofit" || e.target.closest("[data-action='autofit']")) {
        autoFitKeyboardToSong(song);
        loadSong(song);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      loadSong(song);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    grid.appendChild(card);
  });
}

function renderFilterPills() {
  const container = document.getElementById("filterPillsContainer");
  if (!container) return;
  container.innerHTML = "";

  const currentConfig = { startMidi: currentStartMidi, keyCount: currentKeyCount };
  const handOpts = getActiveHandOptions();
  const compatibleCount = songDatabase.filter(s => {
    const c = evaluateSongKeyboardCompatibility(s, currentConfig, handOpts);
    return c.fitsExact;
  }).length;

  const uniqueCats = [...new Set(songDatabase.map(s => s.category).filter(Boolean))];
  const categories = [
    { key: "all", label: `All (${songDatabase.length})` },
    { key: "fits_keyboard", label: `🎹 Fits My Keyboard (${compatibleCount})` },
    ...uniqueCats.map(cat => {
      let count = songDatabase.filter(s => s.category === cat).length;
      if (filterByKeyboard) {
        count = songDatabase.filter(s => s.category === cat && evaluateSongKeyboardCompatibility(s, currentConfig, handOpts).fitsExact).length;
      }
      return {
        key: cat,
        label: `${cat} (${count})`
      };
    })
  ];

  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "catalog-filter" + (activeCategory === cat.key ? " active" : "");
    btn.dataset.filter = cat.key;
    btn.textContent = cat.label;

    btn.addEventListener("click", () => {
      activeCategory = cat.key;
      document.querySelectorAll(".catalog-filter").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      applyCatalogFilters();
    });

    container.appendChild(btn);
  });

  updateFilterHeaderBadges();
}

function applyCatalogFilters() {
  const query = document.getElementById("catalogSearch") ? document.getElementById("catalogSearch").value.toLowerCase().trim() : "";
  const currentConfig = { startMidi: currentStartMidi, keyCount: currentKeyCount };
  const handOpts = getActiveHandOptions();

  const filtered = songDatabase.filter(s => {
    const compat = evaluateSongKeyboardCompatibility(s, currentConfig, handOpts);
    const matchesKb = !filterByKeyboard || compat.fitsExact;

    let matchesCat = false;
    if (activeCategory === "all") {
      matchesCat = true;
    } else if (activeCategory === "fits_keyboard") {
      matchesCat = compat.fitsExact;
    } else {
      matchesCat = (s.category === activeCategory);
    }

    const matchesSearch = s.title.toLowerCase().includes(query) || s.rh.toLowerCase().includes(query);
    return matchesCat && matchesSearch && matchesKb;
  });

  renderCatalog(filtered);
  populateDropdown(filtered);
  updateFilterHeaderBadges();
}

function updateLayerToggleClasses() {
  if (typeof clearWaitPracticeTimer === "function") clearWaitPracticeTimer();
  if (typeof stopPlayback === "function") stopPlayback(false);
  if (typeof isTempoFlowActive !== "undefined" && isTempoFlowActive && typeof stopTempoFlow === "function") {
    stopTempoFlow();
  }

  const prevStepObj = (typeof songNoteSteps !== "undefined" && songNoteSteps[currentPracticeStep]) ? songNoteSteps[currentPracticeStep] : null;
  const prevMeasure = prevStepObj ? (prevStepObj.measure || 1) : 1;

  document.getElementById("toggleLabelRH").classList.toggle("active-rh", document.getElementById("toggleRH").checked);
  document.getElementById("toggleLabelLH").classList.toggle("active-lh", document.getElementById("toggleLH").checked);
  document.getElementById("toggleLabelDyads").classList.toggle("active-dyad", document.getElementById("toggleDyads").checked);
  document.getElementById("toggleLabelCheat").classList.toggle("active-cheat", document.getElementById("toggleCheat").checked);
  document.getElementById("toggleLabelFingers").classList.toggle("active-fingers", document.getElementById("toggleFingers").checked);
  const toggleLyricsEl = document.getElementById("toggleLyrics");
  const toggleLabelLyricsEl = document.getElementById("toggleLabelLyrics");
  if (toggleLyricsEl && toggleLabelLyricsEl) {
    toggleLabelLyricsEl.classList.toggle("active-lyrics", toggleLyricsEl.checked);
  }

  const lhWrap = document.getElementById("lhStyleSelectWrap");
  if (lhWrap) {
    lhWrap.classList.toggle("active-lh-style", document.getElementById("toggleLH").checked);
  }

  const harmWrap = document.getElementById("harmonySelectWrap");
  if (harmWrap) {
    harmWrap.classList.toggle("active-harmony", document.getElementById("toggleDyads").checked);
  }

  parseSongSteps();
  if (typeof songNoteSteps !== "undefined" && songNoteSteps.length > 0) {
    const matchedStep = songNoteSteps.find(s => (s.measure || 1) >= prevMeasure);
    currentPracticeStep = matchedStep ? matchedStep.index : 0;
  } else {
    currentPracticeStep = 0;
  }
  if (typeof transportState !== "undefined") {
    transportState.currentStepIndex = currentPracticeStep;
  }

  renderSheetMusicScore();
  if (typeof updateTransportUI === "function") updateTransportUI();
  if (currentSong) renderSongTheoryDnaBar(currentSong);
  if (typeof onKeyboardLayoutChanged === "function") {
    onKeyboardLayoutChanged();
  }
}

function initCatalogAndLayerControls() {
  const searchInput = document.getElementById("catalogSearch");
  const toggleRH = document.getElementById("toggleRH");
  const toggleLH = document.getElementById("toggleLH");
  const toggleDyads = document.getElementById("toggleDyads");
  const toggleCheat = document.getElementById("toggleCheat");
  const toggleFingers = document.getElementById("toggleFingers");
  const toggleLyrics = document.getElementById("toggleLyrics");
  const toggleLabelLyrics = document.getElementById("toggleLabelLyrics");
  const harmonyTypeSelect = document.getElementById("harmonyTypeSelect");
  const lhStyleSelect = document.getElementById("lhStyleSelect");

  if (toggleLyrics) {
    try {
      const savedLyrics = localStorage.getItem("piano_show_lyrics");
      if (savedLyrics !== null) {
        toggleLyrics.checked = (savedLyrics === "true");
      }
    } catch (err) {}
    if (toggleLabelLyrics) {
      toggleLabelLyrics.classList.toggle("active-lyrics", toggleLyrics.checked);
    }
    toggleLyrics.addEventListener("change", () => {
      try {
        localStorage.setItem("piano_show_lyrics", toggleLyrics.checked.toString());
      } catch (err) {}
      if (toggleLabelLyrics) {
        toggleLabelLyrics.classList.toggle("active-lyrics", toggleLyrics.checked);
      }
      renderSheetMusicScore();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", applyCatalogFilters);
  }
  
  const catalogKbFilterToggle = document.getElementById("catalogKbFilterToggle");
  if (catalogKbFilterToggle) {
    catalogKbFilterToggle.addEventListener("change", (e) => handleFilterByKeyboardToggle(e.target.checked));
  }
  
  const kbDockFilterCheckbox = document.getElementById("kbDockFilterCheckbox");
  if (kbDockFilterCheckbox) {
    kbDockFilterCheckbox.addEventListener("change", (e) => handleFilterByKeyboardToggle(e.target.checked));
  }
  
  const catalogKbScopeSelect = document.getElementById("catalogKbScopeSelect");
  if (catalogKbScopeSelect) {
    catalogKbScopeSelect.addEventListener("change", (e) => {
      keyboardFilterScope = e.target.value;
      try {
        localStorage.setItem("piano_keyboard_filter_scope", keyboardFilterScope);
      } catch (err) {}
      renderFilterPills();
      applyCatalogFilters();
      updateKeyboardRangeWarning();
    });
  }
  
  const kbWarningAutoFitBtn = document.getElementById("kbWarningAutoFitBtn");
  if (kbWarningAutoFitBtn) {
    kbWarningAutoFitBtn.addEventListener("click", () => autoFitKeyboardToSong(currentSong));
  }
  
  const kbWarningShiftBtn = document.getElementById("kbWarningShiftBtn");
  if (kbWarningShiftBtn) {
    kbWarningShiftBtn.addEventListener("click", () => shiftKeyboardToFitSong(currentSong));
  }
  
  const kbWarningDismissBtn = document.getElementById("kbWarningDismissBtn");
  if (kbWarningDismissBtn) {
    kbWarningDismissBtn.addEventListener("click", () => {
      isKbWarningDismissedForSong = true;
      const banner = document.getElementById("keyboardRangeWarningBanner");
      if (banner) banner.style.display = "none";
    });
  }
  
  // Curriculum Tier Listener
  document.querySelectorAll(".level-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".level-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const lvl = parseInt(btn.dataset.level, 10);
      activeCurriculumLevel = lvl;
      const data = curriculumLevels[lvl];
  
      document.getElementById("curriculumBriefing").innerHTML = data.briefing;
  
      document.getElementById("toggleRH").checked = data.config.rh;
      document.getElementById("toggleLH").checked = data.config.lh;
      document.getElementById("toggleDyads").checked = data.config.dyads;
      document.getElementById("toggleCheat").checked = data.config.cheat;
      document.getElementById("toggleFingers").checked = data.config.fingers;
      if (data.config.harmonyType && harmonyTypeSelect) {
        harmonyTypeSelect.value = data.config.harmonyType;
        localStorage.setItem("piano_harmony_type", data.config.harmonyType);
      }
      if (data.config.lhStyle) {
        const lhSel = document.getElementById("lhStyleSelect");
        if (lhSel) {
          lhSel.value = data.config.lhStyle;
          localStorage.setItem("piano_lh_style", data.config.lhStyle);
        }
      }
  
      updateLayerToggleClasses();
  
      if (data.config.filter !== "all") {
        activeCategory = data.config.filter;
        document.querySelectorAll(".catalog-filter").forEach(b => {
          b.classList.toggle("active", b.dataset.filter === activeCategory);
        });
        applyCatalogFilters();
      }
    });
  });

  if (harmonyTypeSelect) {
    const savedHarmony = localStorage.getItem("piano_harmony_type");
    if (savedHarmony && Array.from(harmonyTypeSelect.options).some(o => o.value === savedHarmony)) {
      harmonyTypeSelect.value = savedHarmony;
    }
    harmonyTypeSelect.addEventListener("change", (e) => {
      localStorage.setItem("piano_harmony_type", e.target.value);
      if (!toggleDyads.checked) {
        toggleDyads.checked = true;
      }
      updateLayerToggleClasses();
    });
  }
  
  if (lhStyleSelect) {
    const savedLhStyle = localStorage.getItem("piano_lh_style");
    const activeCurrBtn = document.querySelector(".curr-btn.active");
    const initLvl = activeCurrBtn ? parseInt(activeCurrBtn.dataset.level, 10) : 1;
    if (initLvl <= 5) {
      lhStyleSelect.value = "roots";
    } else if (savedLhStyle && Array.from(lhStyleSelect.options).some(o => o.value === savedLhStyle)) {
      lhStyleSelect.value = savedLhStyle;
    }
    lhStyleSelect.addEventListener("change", (e) => {
      localStorage.setItem("piano_lh_style", e.target.value);
      if (!toggleLH.checked) {
        toggleLH.checked = true;
      }
      updateLayerToggleClasses();
    });
  }

  [toggleRH, toggleLH, toggleDyads, toggleCheat, toggleFingers].forEach(t => {
    t.addEventListener("change", () => {
      if (!toggleRH.checked && !toggleLH.checked && !toggleDyads.checked) toggleRH.checked = true;
      updateLayerToggleClasses();
    });
  });
  
  // Paper Theme (uses shared global isDarkPaper from js/state.js)
  document.getElementById("paperThemeBtn").addEventListener("click", () => {
    isDarkPaper = !isDarkPaper;
    const sheetSec = document.getElementById("sheetMusicSection");
    sheetSec.classList.toggle("dark-theme", isDarkPaper);
    document.getElementById("paperThemeBtn").textContent = isDarkPaper ? "🎨 Paper Theme: Studio Dark" : "🎨 Paper Theme: Vintage";
    renderSheetMusicScore();
  });

  const instBadge = document.getElementById("currentSongInstrumentBadge");
  if (instBadge) {
    instBadge.addEventListener("click", () => {
      if (typeof currentSynthInstrument !== "undefined" && currentSynthInstrument !== "auto") {
        setSynthInstrument("auto", true);
      } else {
        if (typeof initAudio === "function") initAudio();
        if (typeof playTone === "function") playTone(523.25, 0.45, 95, "rh");
      }
    });
  }
  
  document.getElementById("songDropdown").addEventListener("change", (e) => {
    const found = songDatabase.find(s => s.id === e.target.value);
    if (found) loadSong(found);
  });
}
