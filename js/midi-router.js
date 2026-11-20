// ============================================================================
// WEB MIDI INPUT/OUTPUT ROUTING & 16-CHANNEL ACTIVITY MONITOR
// ============================================================================

function initMidiOutputRouting() {
  const select = document.getElementById("midiOutputSelect");
  const testMidiBtn = document.getElementById("testMidiOutputBtn");
  try {
    const saved = localStorage.getItem("piano_midi_output_device");
    if (saved) selectedMidiOutputId = saved;
  } catch (e) {}

  if (select) {
    select.addEventListener("change", (e) => {
      setMidiOutputDevice(e.target.value);
    });
  }

  if (testMidiBtn) {
    testMidiBtn.addEventListener("click", () => {
      playTestMidiOutputChime();
    });
  }
}

function playTestMidiOutputChime() {
  const chSelect = document.getElementById("midiChannelSelect");
  const chMode = chSelect ? chSelect.value : "1";
  const isSplit = (chMode === "split");
  const testNotes = isSplit
    ? [
        { midi: 48, pitch: "C3", delay: 0, dur: 320, role: "lh" },
        { midi: 60, pitch: "C4", delay: 160, dur: 320, role: "rh" },
        { midi: 64, pitch: "E4", delay: 300, dur: 360, role: "dyad" },
        { midi: 67, pitch: "G4", delay: 440, dur: 450, role: "rh" }
      ]
    : [
        { midi: 60, pitch: "C4", delay: 0, dur: 280, role: "rh" },
        { midi: 64, pitch: "E4", delay: 130, dur: 320, role: "rh" },
        { midi: 67, pitch: "G4", delay: 260, dur: 420, role: "rh" }
      ];

  testNotes.forEach(n => {
    setTimeout(() => {
      sendMidiOutputNoteOn(n.midi, 92, n.role);
      if (isSynthAudioEnabled()) {
        playTone(440 * Math.pow(2, (n.midi - 69) / 12), n.dur / 1000, 92, n.role);
      }
      highlightPlaybackKey(n.pitch, n.role === "lh" ? "lh" : "rh", n.dur);
      setTimeout(() => {
        sendMidiOutputNoteOff(n.midi, n.role);
      }, n.dur);
    }, n.delay);
  });
}

function updateMidiOutputDeviceList() {
  const select = document.getElementById("midiOutputSelect");
  if (!select) return;

  select.innerHTML = "";

  const noneOpt = document.createElement("option");
  noneOpt.value = "none";
  noneOpt.textContent = "None (Mute MIDI Output)";
  select.appendChild(noneOpt);

  if (!midiAccess || !midiAccess.outputs) {
    select.value = "none";
    selectedMidiOutput = null;
    return;
  }

  const outputs = Array.from(midiAccess.outputs.values());
  outputs.forEach((output, index) => {
    const opt = document.createElement("option");
    opt.value = output.id;
    let label = `${output.name || "MIDI Port " + (index + 1)} (${output.manufacturer || "Generic"})`;
    if (label.length > 38) {
      label = label.substring(0, 36) + "…";
    }
    opt.textContent = label;
    select.appendChild(opt);
  });

  const matchesSelection = outputs.some(o => o.id === selectedMidiOutputId);
  if (matchesSelection) {
    select.value = selectedMidiOutputId;
  } else if (outputs.length > 0 && (!selectedMidiOutputId || selectedMidiOutputId === "none")) {
    // Keep "none" unless user selects an output port or had one saved
    select.value = "none";
    selectedMidiOutputId = "none";
  } else {
    select.value = "none";
    selectedMidiOutputId = "none";
  }

  setMidiOutputDevice(select.value);
}

function setMidiOutputDevice(deviceId) {
  if (selectedMidiOutput && deviceId !== selectedMidiOutputId) {
    sendMidiAllNotesOff();
  }

  selectedMidiOutputId = deviceId || "none";
  try {
    localStorage.setItem("piano_midi_output_device", selectedMidiOutputId);
  } catch (e) {}

  const select = document.getElementById("midiOutputSelect");
  if (select && select.value !== selectedMidiOutputId) {
    select.value = selectedMidiOutputId;
  }

  if (!midiAccess || !midiAccess.outputs || selectedMidiOutputId === "none" || !selectedMidiOutputId) {
    selectedMidiOutput = null;
    return;
  }

  selectedMidiOutput = midiAccess.outputs.get(selectedMidiOutputId) || null;
  if (selectedMidiOutput && typeof getActiveSynthInstrument === "function") {
    sendMidiOutputProgramChange(getActiveSynthInstrument());
  }
}

function sendMidiOutputProgramChange(instrumentId) {
  if (!selectedMidiOutput) return;
  const instParams = (window.MusicTheory && window.MusicTheory.getInstrumentParameters)
    ? window.MusicTheory.getInstrumentParameters(instrumentId)
    : { gmProgram: 0 };
  const prog = (instParams && typeof instParams.gmProgram === "number") ? instParams.gmProgram : 0;

  const chSelect = document.getElementById("midiChannelSelect");
  const setting = (chSelect && chSelect.value) ? chSelect.value : "all";
  const channels = (setting === "split")
    ? [1, 2, 3]
    : getActiveMidiOutputChannels("rh");

  channels.forEach(ch => {
    try {
      const msg = (window.MusicTheory && window.MusicTheory.createMidiProgramChange)
        ? window.MusicTheory.createMidiProgramChange(prog, ch)
        : [0xC0 | ((ch - 1) & 0x0F), prog];
      selectedMidiOutput.send(msg);
    } catch (err) {
      console.warn("sendMidiOutputProgramChange failed on Ch", ch, err);
    }
  });
}

function isMidiEchoLoopback() {
  if (!selectedMidiInput || !selectedMidiOutput) return false;
  if (selectedMidiInput.id && selectedMidiOutput.id && selectedMidiInput.id === selectedMidiOutput.id) {
    return true;
  }
  const inName = (selectedMidiInput.name || "").trim();
  const outName = (selectedMidiOutput.name || "").trim();
  return Boolean(inName && outName && inName === outName);
}

function getActiveMidiOutputChannels(voiceRole = "rh") {
  const chSelect = document.getElementById("midiChannelSelect");
  const setting = (chSelect && chSelect.value) ? chSelect.value : "all";
  if (window.MusicTheory && typeof window.MusicTheory.resolveMidiOutputChannels === "function") {
    return window.MusicTheory.resolveMidiOutputChannels(setting, voiceRole);
  }
  if (setting !== "all") {
    const parsed = parseInt(setting, 10);
    if (parsed >= 1 && parsed <= 16) return [parsed];
  }
  return [1];
}

function sendMidiOutputNoteOn(pitchOrMidi, velocity = 85, voiceRole = "rh") {
  const channels = getActiveMidiOutputChannels(voiceRole);
  const noteNum = (typeof pitchOrMidi === "number")
    ? pitchOrMidi
    : ((window.MusicTheory && window.MusicTheory.pitchToMidi) ? (window.MusicTheory.pitchToMidi(pitchOrMidi) ?? 60) : 60);
  const vel = Math.max(1, Math.min(127, Math.round(velocity || 85)));

  channels.forEach(ch => {
    if (typeof recordMidiChannelActivity === "function") {
      recordMidiChannelActivity(ch, 9, noteNum, vel);
    }
    if (!selectedMidiOutput) return;
    try {
      const msg = (window.MusicTheory && window.MusicTheory.createMidiNoteOn)
        ? window.MusicTheory.createMidiNoteOn(noteNum, vel, ch)
        : [0x90 | ((ch - 1) & 0x0F), noteNum, vel];
      selectedMidiOutput.send(msg);
    } catch (err) {
      console.warn("sendMidiOutputNoteOn failed on Ch", ch, err);
    }
  });
}

function sendMidiOutputNoteOff(pitchOrMidi, voiceRole = "rh") {
  const channels = getActiveMidiOutputChannels(voiceRole);
  const noteNum = (typeof pitchOrMidi === "number")
    ? pitchOrMidi
    : ((window.MusicTheory && window.MusicTheory.pitchToMidi) ? (window.MusicTheory.pitchToMidi(pitchOrMidi) ?? 60) : 60);

  channels.forEach(ch => {
    if (typeof recordMidiChannelActivity === "function") {
      recordMidiChannelActivity(ch, 8, noteNum, 0);
    }
    if (!selectedMidiOutput) return;
    try {
      const msg = (window.MusicTheory && window.MusicTheory.createMidiNoteOff)
        ? window.MusicTheory.createMidiNoteOff(noteNum, ch)
        : [0x80 | ((ch - 1) & 0x0F), noteNum, 0];
      selectedMidiOutput.send(msg);
    } catch (err) {
      console.warn("sendMidiOutputNoteOff failed on Ch", ch, err);
    }
  });
}

function sendMidiOutputSustain(isDown) {
  const chSelect = document.getElementById("midiChannelSelect");
  const setting = (chSelect && chSelect.value) ? chSelect.value : "all";
  const channels = (setting === "split")
    ? [1, 2, 3]
    : getActiveMidiOutputChannels("rh");
  const val = isDown ? 127 : 0;

  channels.forEach(ch => {
    if (typeof recordMidiChannelActivity === "function") {
      recordMidiChannelActivity(ch, 11, 64, val);
    }
    if (!selectedMidiOutput) return;
    try {
      const msg = (window.MusicTheory && window.MusicTheory.createMidiCC)
        ? window.MusicTheory.createMidiCC(64, val, ch)
        : [0xB0 | ((ch - 1) & 0x0F), 64, val];
      selectedMidiOutput.send(msg);
    } catch (err) {
      console.warn("sendMidiOutputSustain failed on Ch", ch, err);
    }
  });
}

function sendMidiAllNotesOff() {
  if (!selectedMidiOutput) return;
  try {
    for (let ch = 1; ch <= 16; ch++) {
      const statusByte = 0xB0 | ((ch - 1) & 0x0F);
      selectedMidiOutput.send([statusByte, 120, 0]); // All Sound Off
      selectedMidiOutput.send([statusByte, 123, 0]); // All Notes Off
      selectedMidiOutput.send([statusByte, 64, 0]);  // Sustain Off
    }
  } catch (err) {
    console.warn("sendMidiAllNotesOff failed:", err);
  }
}

// REAL-TIME MIDI CHANNEL ACTIVITY MONITOR & INTERACTIVE SELECTOR
function recordMidiChannelActivity(channel, cmd, noteNumber, velocity) {
  if (channel < 1 || channel > 16) return;
  const now = performance.now();
  const st = midiChannelActivity[channel];
  if (!st) return;

  st.lastActiveTime = now;
  st.totalMessages++;

  if (cmd === 9 && velocity > 0) {
    // Note On
    if (noteNumber !== undefined) {
      st.heldNotes.add(noteNumber);
    }
    st.isActive = true;
    if (st.timerId) clearTimeout(st.timerId);
    // Safety decay fallback in case device disconnects or drops Note Off
    st.timerId = setTimeout(() => {
      st.heldNotes.clear();
      st.isActive = false;
      renderMidiChannelActivity();
    }, 3000);
  } else if (cmd === 8 || (cmd === 9 && velocity === 0)) {
    // Note Off
    if (noteNumber !== undefined) {
      st.heldNotes.delete(noteNumber);
    }
    if (st.heldNotes.size === 0) {
      if (st.timerId) clearTimeout(st.timerId);
      // Return to IDLE 200ms after all notes on this channel are released
      st.timerId = setTimeout(() => {
        st.isActive = false;
        renderMidiChannelActivity();
      }, 200);
    }
  } else {
    // CC, Pitch Bend, Program Change, etc.
    st.isActive = true;
    if (st.timerId) clearTimeout(st.timerId);
    st.timerId = setTimeout(() => {
      if (st.heldNotes.size === 0) {
        st.isActive = false;
        renderMidiChannelActivity();
      }
    }, 300);
  }

  // Flash global button LED while receiving data
  const globalLed = document.getElementById("midiChannelGlobalLed");
  if (globalLed) {
    globalLed.classList.add("live-signal");
    if (globalMidiLedTimer) clearTimeout(globalMidiLedTimer);
    globalMidiLedTimer = setTimeout(() => {
      const anyActive = Object.values(midiChannelActivity).some(s => s.isActive);
      if (!anyActive && globalLed) {
        globalLed.classList.remove("live-signal");
      }
    }, 250);
  }

  renderMidiChannelActivity();
}

function renderMidiChannelActivity() {
  let anyChannelActive = false;

  for (let c = 1; c <= 16; c++) {
    const st = midiChannelActivity[c];
    const led = document.getElementById(`chLed_${c}`);
    const btn = document.getElementById(`chOpt_${c}`);
    const badge = document.getElementById(`chBadge_${c}`);

    if (st.isActive) {
      anyChannelActive = true;
      if (led) {
        led.classList.add("live-signal");
        led.classList.remove("recent-signal");
      }
      if (btn) btn.classList.add("channel-signal-pulse");
      if (badge) {
        badge.className = "ch-badge live";
        badge.textContent = "LIVE";
      }
    } else {
      // Clean return to IDLE when done (no lingering ACTIVE status)
      if (led) {
        led.classList.remove("live-signal", "recent-signal");
      }
      if (btn) btn.classList.remove("channel-signal-pulse");
      if (badge) {
        badge.className = "ch-badge";
        badge.textContent = "IDLE";
      }
    }
  }

  // Update Omni, Split, and Broadcast options
  const omniLed = document.getElementById("chLed_all");
  const omniBadge = document.getElementById("chBadge_all");
  const omniBtn = document.getElementById("chOpt_all");
  const splitLed = document.getElementById("chLed_split");
  const splitBadge = document.getElementById("chBadge_split");
  const splitBtn = document.getElementById("chOpt_split");
  const omniOutLed = document.getElementById("chLed_omni_out");
  const omniOutBadge = document.getElementById("chBadge_omni_out");
  const omniOutBtn = document.getElementById("chOpt_omni_out");

  const splitActive = (midiChannelActivity[1]?.isActive || midiChannelActivity[2]?.isActive || midiChannelActivity[3]?.isActive);

  if (anyChannelActive) {
    if (omniLed) {
      omniLed.classList.add("live-signal");
      omniLed.classList.remove("recent-signal");
    }
    if (omniBtn) omniBtn.classList.add("channel-signal-pulse");
    if (omniBadge) {
      omniBadge.className = "ch-badge live";
      omniBadge.textContent = "LIVE";
    }
    if (omniOutLed) omniOutLed.classList.add("live-signal");
    if (omniOutBtn) omniOutBtn.classList.add("channel-signal-pulse");
    if (omniOutBadge) {
      omniOutBadge.className = "ch-badge live";
      omniOutBadge.textContent = "LIVE";
    }
  } else {
    if (omniLed) omniLed.classList.remove("live-signal", "recent-signal");
    if (omniBtn) omniBtn.classList.remove("channel-signal-pulse");
    if (omniBadge) {
      omniBadge.className = "ch-badge";
      omniBadge.textContent = "OMNI";
    }
    if (omniOutLed) omniOutLed.classList.remove("live-signal");
    if (omniOutBtn) omniOutBtn.classList.remove("channel-signal-pulse");
    if (omniOutBadge) {
      omniOutBadge.className = "ch-badge";
      omniOutBadge.textContent = "1–16";
    }
  }

  if (splitActive) {
    if (splitLed) splitLed.classList.add("live-signal");
    if (splitBtn) splitBtn.classList.add("channel-signal-pulse");
    if (splitBadge) {
      splitBadge.className = "ch-badge live";
      splitBadge.textContent = "LIVE";
    }
  } else {
    if (splitLed) splitLed.classList.remove("live-signal");
    if (splitBtn) splitBtn.classList.remove("channel-signal-pulse");
    if (splitBadge) {
      splitBadge.className = "ch-badge";
      splitBadge.textContent = "CH 1+2";
    }
  }

  // Sync native select option texts
  const nativeSelect = document.getElementById("midiChannelSelect");
  if (nativeSelect) {
    Array.from(nativeSelect.options).forEach(opt => {
      if (opt.value === "all") {
        opt.textContent = anyChannelActive ? "All Channels (Omni) 🟢 LIVE" : "All Channels (Omni)";
      } else if (opt.value === "split") {
        opt.textContent = splitActive ? "Split Hands (RH→Ch1 / LH→Ch2) 🟢 LIVE" : "Split Hands (RH→Ch1 / LH→Ch2)";
      } else if (opt.value === "omni_out") {
        opt.textContent = anyChannelActive ? "Broadcast All 16 Ch (1–16) 🟢 LIVE" : "Broadcast All 16 Ch (1–16)";
      } else {
        const ch = parseInt(opt.value, 10);
        const st = midiChannelActivity[ch];
        if (st && st.isActive) {
          opt.textContent = `Channel ${ch} 🟢 LIVE`;
        } else {
          opt.textContent = `Channel ${ch}`;
        }
      }
    });
  }

  // Turn off trigger button LED if all channels are idle
  const globalLed = document.getElementById("midiChannelGlobalLed");
  if (globalLed && !anyChannelActive) {
    globalLed.classList.remove("live-signal");
  }
}

function resetMidiChannelActivity() {
  for (let c = 1; c <= 16; c++) {
    const st = midiChannelActivity[c];
    if (st.timerId) clearTimeout(st.timerId);
    if (st.heldNotes) st.heldNotes.clear();
    st.lastActiveTime = 0;
    st.totalMessages = 0;
    st.isActive = false;
    st.timerId = null;
  }
  if (globalMidiLedTimer) {
    clearTimeout(globalMidiLedTimer);
    globalMidiLedTimer = null;
  }
  const globalLed = document.getElementById("midiChannelGlobalLed");
  if (globalLed) globalLed.classList.remove("live-signal");

  renderMidiChannelActivity();
}

function initMidiChannelPicker() {
  const grid = document.getElementById("channelGridContainer");
  if (grid) {
    grid.innerHTML = "";
    for (let c = 1; c <= 16; c++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "channel-opt-btn";
      btn.id = `chOpt_${c}`;
      btn.dataset.channel = c.toString();

      btn.innerHTML = `
        <div class="opt-left">
          <span class="ch-led" id="chLed_${c}"></span>
          <span class="ch-name">Ch ${c}</span>
        </div>
        <span class="ch-badge" id="chBadge_${c}">IDLE</span>
      `;

      btn.addEventListener("click", () => {
        selectMidiChannel(c.toString());
      });

      grid.appendChild(btn);
    }
  }

  const omniBtn = document.getElementById("chOpt_all");
  if (omniBtn) {
    omniBtn.addEventListener("click", () => {
      selectMidiChannel("all");
    });
  }

  const splitBtn = document.getElementById("chOpt_split");
  if (splitBtn) {
    splitBtn.addEventListener("click", () => {
      selectMidiChannel("split");
    });
  }

  const omniOutBtn = document.getElementById("chOpt_omni_out");
  if (omniOutBtn) {
    omniOutBtn.addEventListener("click", () => {
      selectMidiChannel("omni_out");
    });
  }

  try {
    const savedCh = localStorage.getItem("piano_midi_channel");
    if (savedCh) {
      selectMidiChannel(savedCh);
    }
  } catch (e) {}

  const triggerBtn = document.getElementById("midiChannelBtn");
  const menu = document.getElementById("midiChannelMenu");

  if (triggerBtn && menu) {
    triggerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = menu.style.display !== "none";
      setMidiChannelMenuOpen(!isOpen);
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest("#midiChannelPickerGroup")) {
        setMidiChannelMenuOpen(false);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        setMidiChannelMenuOpen(false);
      }
    });
  }

  const resetBtn = document.getElementById("resetChannelActivityBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      resetMidiChannelActivity();
    });
  }
}

function setMidiChannelMenuOpen(isOpen) {
  const menu = document.getElementById("midiChannelMenu");
  const triggerBtn = document.getElementById("midiChannelBtn");
  if (!menu || !triggerBtn) return;

  menu.style.display = isOpen ? "flex" : "none";
  triggerBtn.classList.toggle("is-open", isOpen);
  triggerBtn.setAttribute("aria-expanded", isOpen.toString());
}

function selectMidiChannel(val) {
  const select = document.getElementById("midiChannelSelect");
  const btnText = document.getElementById("midiChannelBtnText");

  try {
    localStorage.setItem("piano_midi_channel", val);
  } catch (e) {}

  if (select) {
    select.value = val;
    select.dispatchEvent(new Event("change"));
  }

  if (btnText) {
    if (val === "all") btnText.textContent = "All Channels (Omni)";
    else if (val === "split") btnText.textContent = "Split (RH→Ch1 / LH→Ch2)";
    else if (val === "omni_out") btnText.textContent = "All 16 Channels Out";
    else btnText.textContent = `Channel ${val}`;
  }

  const allButtons = document.querySelectorAll(".channel-opt-btn");
  allButtons.forEach(b => {
    b.classList.toggle("is-selected", b.dataset.channel === val);
  });

  setMidiChannelMenuOpen(false);
}

// WEB MIDI INPUT DISCOVERY & MESSAGE HANDLER
function initWebMIDI() {
  const midiDeviceSelect = document.getElementById("midiDeviceSelect");
  if (midiDeviceSelect) {
    midiDeviceSelect.addEventListener("change", (e) => {
      resetMidiChannelActivity();
      attachMidiListener(e.target.value);
    });
  }

  const refreshMidiDevicesBtn = document.getElementById("refreshMidiDevicesBtn");
  if (refreshMidiDevicesBtn) {
    refreshMidiDevicesBtn.addEventListener("click", () => {
      updateMidiDeviceList();
      updateMidiOutputDeviceList();
    });
  }

  const statusDot = document.getElementById("midiStatusDot");
  const statusText = document.getElementById("midiStatusText");

  if (!navigator.requestMIDIAccess) {
    statusText.textContent = "Web MIDI API not supported";
    return;
  }

  navigator.requestMIDIAccess({ sysex: false })
    .then(access => {
      midiAccess = access;
      statusDot.classList.add("connected");
      statusText.textContent = "Web MIDI: Active & Listening";
      updateMidiDeviceList();
      updateMidiOutputDeviceList();
      midiAccess.onstatechange = () => {
        updateMidiDeviceList();
        updateMidiOutputDeviceList();
      };
    })
    .catch(() => { statusText.textContent = "MIDI Permission Denied"; });
}

function updateMidiDeviceList() {
  const select = document.getElementById("midiDeviceSelect");
  const prevVal = select.value;
  select.innerHTML = "";

  // Cleanly reset channel activity when device list refreshes
  resetMidiChannelActivity();

  if (!midiAccess) return;

  const inputs = Array.from(midiAccess.inputs.values());
  if (inputs.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No MIDI Devices Detected";
    select.appendChild(opt);
    return;
  }

  inputs.forEach((input, index) => {
    const opt = document.createElement("option");
    opt.value = input.id;
    opt.textContent = `${input.name || "MIDI Port " + (index + 1)} (${input.manufacturer || "Generic"})`;
    select.appendChild(opt);
  });

  if (inputs.some(i => i.id === prevVal)) select.value = prevVal;
  else select.value = inputs[0].id;

  attachMidiListener(select.value);
}

function attachMidiListener(deviceId) {
  if (selectedMidiInput) selectedMidiInput.onmidimessage = null;
  // Reset channel activity & held MIDI inputs when switching to another MIDI port or device
  if (typeof clearHeldMidiInputs === "function") {
    clearHeldMidiInputs();
  }
  resetMidiChannelActivity();

  if (!midiAccess || !deviceId) {
    document.getElementById("midiStatusText").textContent = "No MIDI device selected";
    selectedMidiInput = null;
    return;
  }

  const input = midiAccess.inputs.get(deviceId);
  if (input) {
    selectedMidiInput = input;
    selectedMidiInput.onmidimessage = handleIncomingMIDIMessage;
    document.getElementById("midiStatusText").textContent = `Listening: ${input.name}`;
  }
}

function handleIncomingMIDIMessage(event) {
  const [status, data1, data2] = event.data;
  const cmd = status >> 4;
  const channel = (status & 0xF) + 1;
  const noteNumber = data1;
  const velocity = data2 !== undefined ? data2 : 0;

  // Track live incoming channel telemetry for voice messages (status < 0xF0)
  if (status < 0xF0 && channel >= 1 && channel <= 16) {
    recordMidiChannelActivity(channel, cmd, noteNumber, velocity);
  }

  const filterCh = document.getElementById("midiChannelSelect").value;
  if (filterCh !== "all" && filterCh !== "split" && filterCh !== "omni_out" && channel !== parseInt(filterCh, 10)) return;

  // Sustain Pedal Handling (CC 64)
  if (cmd === 11 && data1 === 64) {
    isSustainPedalDown = (velocity >= 64);
    if (typeof sendMidiOutputSustain === "function") {
      sendMidiOutputSustain(isSustainPedalDown);
    }
    if (!isSustainPedalDown) {
      pedaledNotes.forEach(num => {
        if (!activeHeldMidiNotes.has(num)) stopLiveTone(num, true);
      });
      pedaledNotes.clear();
      if (typeof handleTiedReleaseCheck === "function") {
        handleTiedReleaseCheck(null);
      }
    }
    updateSustainPedalUI();
    updateActiveChordRecognizer();
    return;
  }

  const pitchName = midiNumberToPitch(noteNumber);
  const skipMidiOut = isMidiEchoLoopback();

  // Note On Event
  if (cmd === 9 && velocity > 0) {
    const keyEl = document.querySelector(`.piano-key[data-note="${pitchName}"]`);
    if (keyEl) keyEl.classList.add("active-live");

    startLiveTone(noteNumber, velocity, noteNumber < 60 ? "lh" : "rh", null, skipMidiOut);

    createSustainLane(noteNumber, pitchName);

    // PRACTICE & EDUCATIONAL NOTE INPUT
    handleNoteDown(pitchName, "midi", { noteNumber, velocity, channel });
  } 
  // Note Off Event
  else if (cmd === 8 || (cmd === 9 && velocity === 0)) {
    const keyEl = document.querySelector(`.piano-key[data-note="${pitchName}"]`);
    if (keyEl) keyEl.classList.remove("active-live");

    stopLiveTone(noteNumber, false, skipMidiOut);

    removeSustainLane(noteNumber);

    handleNoteUp(pitchName, { noteNumber, channel });
  }
}
