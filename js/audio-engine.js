// ============================================================================
// WEB AUDIO ROUTING, MULTI-TIMBRE SYNTHESIZER & HARDWARE OUTPUT ENGINE
// ============================================================================

function getVoiceAudioDestination(voiceRole = "center") {
  if (!audioCtx) initAudio();
  if (!audioCtx) return null;
  const role = String(voiceRole || "center").toLowerCase();
  if (role === "lh" || role === "bass") {
    return lhVoiceBus || masterGainNode || audioCtx.destination;
  }
  if (role === "rh" || role === "dyad" || role === "treble" || role === "harmony") {
    return rhVoiceBus || masterGainNode || audioCtx.destination;
  }
  return masterGainNode || audioCtx.destination;
}

function setupWebAudioChannelRouter() {
  if (!audioCtx || !masterGainNode) return;
  try {
    // Disconnect previous router nodes if rebuilding
    try { masterGainNode.disconnect(); } catch (e) {}
    if (masterChannelSplitter) { try { masterChannelSplitter.disconnect(); } catch (e) {} }
    if (audioChannelMerger) { try { audioChannelMerger.disconnect(); } catch (e) {} }
    channelRouteNodes.forEach(pair => {
      try { pair.leftGain.disconnect(); } catch (e) {}
      try { pair.rightGain.disconnect(); } catch (e) {}
    });
    channelRouteNodes = [];

    const maxHwCh = Math.max(2, Math.min(32, (audioCtx.destination && audioCtx.destination.maxChannelCount) ? audioCtx.destination.maxChannelCount : 2));
    const routing = (window.MusicTheory && window.MusicTheory.computeAudioChannelGains)
      ? window.MusicTheory.computeAudioChannelGains(selectedAudioChannelMode, maxHwCh, "center")
      : { activeChannelCount: 2, leftBusGains: [1, 0], rightBusGains: [0, 1] };

    const targetMergerChannels = Math.max(2, Math.min(maxHwCh, routing.activeChannelCount || 2));

    // Configure hardware destination channel count for multi-channel interfaces
    if (audioCtx.destination) {
      try {
        audioCtx.destination.channelCount = targetMergerChannels;
        audioCtx.destination.channelCountMode = "explicit";
        audioCtx.destination.channelInterpretation = targetMergerChannels > 2 ? "discrete" : "speakers";
      } catch (e) {}
    }

    // Configure masterGainNode as 2-channel stereo bus so L/R hand panners and mono oscillators preserve stereo image
    try {
      masterGainNode.channelCount = 2;
      masterGainNode.channelCountMode = "explicit";
      masterGainNode.channelInterpretation = "speakers";
    } catch (e) {}

    // Create Left-Hand and Right-Hand stereo panner buses feeding masterGainNode
    if (!lhVoiceBus && typeof audioCtx.createStereoPanner === "function") {
      lhVoiceBus = audioCtx.createStereoPanner();
      lhVoiceBus.connect(masterGainNode);
    } else if (!lhVoiceBus) {
      lhVoiceBus = audioCtx.createGain();
      lhVoiceBus.connect(masterGainNode);
    }

    if (!rhVoiceBus && typeof audioCtx.createStereoPanner === "function") {
      rhVoiceBus = audioCtx.createStereoPanner();
      rhVoiceBus.connect(masterGainNode);
    } else if (!rhVoiceBus) {
      rhVoiceBus = audioCtx.createGain();
      rhVoiceBus.connect(masterGainNode);
    }

    if (typeof audioCtx.createChannelSplitter === "function" && typeof audioCtx.createChannelMerger === "function") {
      masterChannelSplitter = audioCtx.createChannelSplitter(2);
      audioChannelMerger = audioCtx.createChannelMerger(targetMergerChannels);
      masterGainNode.connect(masterChannelSplitter);

      for (let ch = 0; ch < targetMergerChannels; ch++) {
        const leftGain = audioCtx.createGain();
        const rightGain = audioCtx.createGain();
        leftGain.gain.value = 0;
        rightGain.gain.value = 0;
        masterChannelSplitter.connect(leftGain, 0);
        masterChannelSplitter.connect(rightGain, 1);
        leftGain.connect(audioChannelMerger, 0, ch);
        rightGain.connect(audioChannelMerger, 0, ch);
        channelRouteNodes.push({ leftGain, rightGain });
      }

      const finalDest = (isUsingMediaStreamBridge && mediaStreamDestNode) ? mediaStreamDestNode : audioCtx.destination;
      audioChannelMerger.connect(finalDest);
    } else {
      const finalDest = (isUsingMediaStreamBridge && mediaStreamDestNode) ? mediaStreamDestNode : audioCtx.destination;
      masterGainNode.connect(finalDest);
    }

    applyAudioChannelGainsMatrix();
  } catch (err) {
    console.warn("setupWebAudioChannelRouter fallback to direct destination:", err);
    try {
      masterGainNode.connect(audioCtx.destination);
    } catch (e) {}
  }
}

function applyAudioChannelGainsMatrix() {
  if (!audioCtx) return;
  const maxHwCh = Math.max(2, Math.min(32, (audioCtx.destination && audioCtx.destination.maxChannelCount) ? audioCtx.destination.maxChannelCount : 2));
  const routing = (window.MusicTheory && window.MusicTheory.computeAudioChannelGains)
    ? window.MusicTheory.computeAudioChannelGains(selectedAudioChannelMode, maxHwCh, "center")
    : { channelMode: selectedAudioChannelMode, activeChannelCount: 2, leftBusGains: [1, 0], rightBusGains: [0, 1], shortLabel: "Ch 1+2" };

  const isSplit = (selectedAudioChannelMode === "split_hands");
  if (lhVoiceBus && lhVoiceBus.pan) {
    lhVoiceBus.pan.setValueAtTime(isSplit ? -1.0 : 0.0, audioCtx.currentTime);
    lhVoiceBus.pan.value = isSplit ? -1.0 : 0.0;
  }
  if (rhVoiceBus && rhVoiceBus.pan) {
    rhVoiceBus.pan.setValueAtTime(isSplit ? 1.0 : 0.0, audioCtx.currentTime);
    rhVoiceBus.pan.value = isSplit ? 1.0 : 0.0;
  }

  if (channelRouteNodes.length > 0) {
    const numMergerCh = channelRouteNodes.length;
    // Clear all channel gains first
    for (let c = 0; c < numMergerCh; c++) {
      channelRouteNodes[c].leftGain.gain.setValueAtTime(0, audioCtx.currentTime);
      channelRouteNodes[c].leftGain.gain.value = 0;
      channelRouteNodes[c].rightGain.gain.setValueAtTime(0, audioCtx.currentTime);
      channelRouteNodes[c].rightGain.gain.value = 0;
    }

    // Map requested gains onto available hardware channels (mirroring onto odd/even if hardware has fewer channels than requested)
    for (let i = 0; i < routing.leftBusGains.length; i++) {
      const lVal = routing.leftBusGains[i] || 0;
      const rVal = routing.rightBusGains[i] || 0;
      if (lVal > 0 || rVal > 0) {
        const targetIdx = i < numMergerCh ? i : (i % numMergerCh);
        const curL = channelRouteNodes[targetIdx].leftGain.gain.value || 0;
        const curR = channelRouteNodes[targetIdx].rightGain.gain.value || 0;
        const nextL = Math.min(1.0, curL + lVal);
        const nextR = Math.min(1.0, curR + rVal);
        channelRouteNodes[targetIdx].leftGain.gain.setValueAtTime(nextL, audioCtx.currentTime);
        channelRouteNodes[targetIdx].leftGain.gain.value = nextL;
        channelRouteNodes[targetIdx].rightGain.gain.setValueAtTime(nextR, audioCtx.currentTime);
        channelRouteNodes[targetIdx].rightGain.gain.value = nextR;
      }
    }
  }

  updateAudioOutputRouteBadge();
}

function updateAudioOutputRouteBadge() {
  const badge = document.getElementById("audioOutputRouteBadge");
  if (!badge) return;
  const maxHwCh = (audioCtx && audioCtx.destination && audioCtx.destination.maxChannelCount) ? audioCtx.destination.maxChannelCount : 2;
  const routing = (window.MusicTheory && window.MusicTheory.computeAudioChannelGains)
    ? window.MusicTheory.computeAudioChannelGains(selectedAudioChannelMode, maxHwCh, "center")
    : { shortLabel: "Ch 1+2", label: "Stereo (Ch 1+2)" };

  badge.textContent = routing.shortLabel || "Ch 1+2";
  const devSelect = document.getElementById("audioOutputSelect");
  const devName = (devSelect && devSelect.selectedOptions[0]) ? devSelect.selectedOptions[0].textContent : "System Default";
  badge.title = `Active Audio Sink: ${devName} • Channel Mode: ${routing.label || selectedAudioChannelMode} (${maxHwCh} HW Ch max)`;
}

function setAudioOutputChannelMode(channelMode, playConfirm = false) {
  selectedAudioChannelMode = channelMode || "stereo";
  try {
    localStorage.setItem("piano_audio_output_channel", selectedAudioChannelMode);
  } catch (e) {}

  const chSelect = document.getElementById("audioOutputChannelSelect");
  if (chSelect && chSelect.value !== selectedAudioChannelMode) {
    chSelect.value = selectedAudioChannelMode;
  }

  if (audioCtx) {
    setupWebAudioChannelRouter();
  } else {
    updateAudioOutputRouteBadge();
  }

  if (playConfirm) {
    playTestAudioChime();
  }
}

async function routeAudioViaMediaStreamBridge(sinkVal) {
  if (!audioCtx || typeof audioCtx.createMediaStreamDestination !== "function" || typeof Audio === "undefined") {
    return false;
  }
  try {
    if (!mediaStreamDestNode) {
      mediaStreamDestNode = audioCtx.createMediaStreamDestination();
    }
    if (!audioSinkBridgeElement) {
      audioSinkBridgeElement = new Audio();
      audioSinkBridgeElement.autoplay = true;
    }
    if (audioSinkBridgeElement.srcObject !== mediaStreamDestNode.stream) {
      audioSinkBridgeElement.srcObject = mediaStreamDestNode.stream;
    }
    if (typeof audioSinkBridgeElement.setSinkId === "function") {
      await audioSinkBridgeElement.setSinkId(sinkVal);
    }
    isUsingMediaStreamBridge = true;
    setupWebAudioChannelRouter();
    await audioSinkBridgeElement.play().catch(() => {});
    return true;
  } catch (err) {
    console.warn("MediaStream audio output bridge fallback failed:", err);
    isUsingMediaStreamBridge = false;
    return false;
  }
}

async function applyAudioOutputSink(deviceId) {
  if (!audioCtx) return false;
  const sinkVal = (!deviceId || deviceId === "default") ? "" : deviceId;

  if (audioCtx.state === "suspended") {
    try { await audioCtx.resume(); } catch (e) {}
  }

  // 1. Primary Web Audio API AudioContext.setSinkId
  if (typeof audioCtx.setSinkId === "function") {
    try {
      await audioCtx.setSinkId(sinkVal);
      if (isUsingMediaStreamBridge) {
        isUsingMediaStreamBridge = false;
        if (audioSinkBridgeElement) {
          try { audioSinkBridgeElement.pause(); } catch (e) {}
        }
      }
      setupWebAudioChannelRouter();
      return true;
    } catch (err) {
      console.warn("audioCtx.setSinkId failed, attempting MediaStream bridge fallback:", selectedAudioOutputId, err);
    }
  }

  // 2. Fallback HTMLAudioElement.setSinkId via MediaStreamAudioDestinationNode
  if (sinkVal === "") {
    isUsingMediaStreamBridge = false;
    if (audioSinkBridgeElement) {
      try { audioSinkBridgeElement.pause(); } catch (e) {}
    }
    setupWebAudioChannelRouter();
    return true;
  }

  return await routeAudioViaMediaStreamBridge(sinkVal);
}

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGainNode = audioCtx.createGain();
    const effectiveVol = isMasterMuted ? 0 : currentMasterVolume;
    const volScale = Math.pow(effectiveVol, 2);
    masterGainNode.gain.setValueAtTime(volScale, audioCtx.currentTime);
    masterGainNode.gain.value = volScale;
    masterGainNode.connect(audioCtx.destination);

    setupWebAudioChannelRouter();

    // Apply audio output sink if supported and configured
    if (typeof selectedAudioOutputId !== "undefined" && selectedAudioOutputId && selectedAudioOutputId !== "default") {
      if (typeof audioCtx.setSinkId === "function") {
        audioCtx.setSinkId(selectedAudioOutputId).then(() => {
          setupWebAudioChannelRouter();
        }).catch(() => {
          routeAudioViaMediaStreamBridge(selectedAudioOutputId);
        });
      } else {
        routeAudioViaMediaStreamBridge(selectedAudioOutputId);
      }
    }
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
}

function setMasterVolume(val) {
  currentMasterVolume = Math.max(0, Math.min(1, parseFloat(val)));
  if (currentMasterVolume > 0 && isMasterMuted) {
    isMasterMuted = false;
  }
  initAudio();
  const effectiveVol = isMasterMuted ? 0 : currentMasterVolume;
  const volScale = Math.pow(effectiveVol, 2);
  if (masterGainNode && audioCtx) {
    masterGainNode.gain.cancelScheduledValues(0);
    masterGainNode.gain.setValueAtTime(volScale, audioCtx.currentTime);
    masterGainNode.gain.value = volScale;
  }
  // Dynamically update any active held notes in real time
  liveOscillators.forEach(voice => {
    if (voice.gain && voice.gain.gain) {
      voice.gain.gain.cancelScheduledValues(0);
      voice.gain.gain.setValueAtTime(0.2 * volScale, audioCtx.currentTime);
      voice.gain.gain.value = 0.2 * volScale;
    }
  });
  updateVolumeUI();
  try {
    localStorage.setItem("piano_master_volume", currentMasterVolume.toString());
  } catch(e) {}
}

function toggleMasterMute() {
  initAudio();
  if (isMasterMuted) {
    isMasterMuted = false;
    currentMasterVolume = preMuteVolume > 0 ? preMuteVolume : 0.8;
  } else {
    isMasterMuted = true;
    preMuteVolume = currentMasterVolume > 0 ? currentMasterVolume : 0.8;
  }
  const effectiveVol = isMasterMuted ? 0 : currentMasterVolume;
  const volScale = Math.pow(effectiveVol, 2);
  if (masterGainNode && audioCtx) {
    masterGainNode.gain.cancelScheduledValues(0);
    masterGainNode.gain.setValueAtTime(volScale, audioCtx.currentTime);
    masterGainNode.gain.value = volScale;
  }
  liveOscillators.forEach(voice => {
    if (voice.gain && voice.gain.gain) {
      voice.gain.gain.cancelScheduledValues(0);
      voice.gain.gain.setValueAtTime(0.2 * volScale, audioCtx.currentTime);
      voice.gain.gain.value = 0.2 * volScale;
    }
  });
  updateVolumeUI();
}

function updateVolumeUI() {
  const effectiveVol = isMasterMuted ? 0 : currentMasterVolume;
  const pct = Math.round(effectiveVol * 100);

  document.querySelectorAll(".master-volume-slider").forEach(el => {
    el.value = effectiveVol;
  });

  document.querySelectorAll(".master-volume-text").forEach(el => {
    el.textContent = `${pct}%`;
  });

  const icon = isMasterMuted || pct === 0 ? "🔇" : (pct < 50 ? "🔉" : "🔊");
  document.querySelectorAll(".master-volume-icon").forEach(el => {
    el.textContent = icon;
    el.title = isMasterMuted ? "Unmute Audio Output" : "Mute Audio Output";
  });
}

function initMasterVolume() {
  try {
    const saved = localStorage.getItem("piano_master_volume");
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed)) currentMasterVolume = Math.max(0, Math.min(1, parsed));
    }
  } catch(e) {}
  updateVolumeUI();

  document.querySelectorAll(".master-volume-slider").forEach(slider => {
    slider.addEventListener("input", (e) => {
      setMasterVolume(e.target.value);
    });
    slider.addEventListener("change", (e) => {
      setMasterVolume(e.target.value);
    });
  });

  document.querySelectorAll(".volume-mute-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      toggleMasterMute();
    });
  });

  // Synth Audio Mute Toggle listener
  const synthToggle = document.getElementById("midiSoundToggle");
  if (synthToggle) {
    synthToggle.addEventListener("change", (e) => {
      if (!e.target.checked) {
        // Immediately cut off any ringing synthesizer oscillators
        liveOscillators.forEach((voice, noteNum) => {
          stopLiveTone(noteNum, true);
        });
        pedaledNotes.clear();
        isSustainPedalDown = false;
      }
      const labelSpan = synthToggle.parentElement?.querySelector("span");
      if (labelSpan) {
        labelSpan.textContent = e.target.checked ? "🔊 Synth Audio" : "🔇 Synth Audio";
      }
    });
  }
}

// HARDWARE AUDIO OUTPUT ROUTING (setSinkId & MediaStream Bridge)
async function initAudioOutputRouting() {
  const select = document.getElementById("audioOutputSelect");
  const channelSelect = document.getElementById("audioOutputChannelSelect");
  const refreshBtn = document.getElementById("refreshAudioDevicesBtn");
  const pickerBtn = document.getElementById("openAudioPickerBtn");
  const testBtn = document.getElementById("testAudioOutputBtn");

  try {
    const saved = localStorage.getItem("piano_audio_output_device");
    if (saved) selectedAudioOutputId = saved;
    const savedCh = localStorage.getItem("piano_audio_output_channel");
    if (savedCh) selectedAudioChannelMode = savedCh;
  } catch (e) {}

  if (channelSelect) {
    channelSelect.value = selectedAudioChannelMode;
    channelSelect.addEventListener("change", (e) => {
      initAudio();
      setAudioOutputChannelMode(e.target.value, true);
    });
  }

  if (select) {
    select.addEventListener("change", async (e) => {
      await setAudioOutputDevice(e.target.value, true);
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      if (cachedAudioOutputs.length <= 1) {
        await requestAudioOutputAccess();
      } else {
        await updateAudioOutputDeviceList(true);
      }
    });
  }

  if (pickerBtn) {
    pickerBtn.addEventListener("click", async () => {
      await openNativeAudioOutputPicker();
    });
  }

  if (testBtn) {
    testBtn.addEventListener("click", () => {
      playTestAudioChime();
    });
  }

  if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
    navigator.mediaDevices.addEventListener("devicechange", () => {
      updateAudioOutputDeviceList(false);
    });
  }

  await updateAudioOutputDeviceList(false);
  updateAudioOutputRouteBadge();
}

async function requestAudioOutputAccess() {
  let unlockedViaMic = false;
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      unlockedViaMic = true;
    }
  } catch (err) {
    console.info("Audio device access request (getUserMedia):", err.message || err);
  }

  // If getUserMedia failed (e.g. desktop PC without microphone) and selectAudioOutput is available, invoke native picker
  if (!unlockedViaMic && navigator.mediaDevices && typeof navigator.mediaDevices.selectAudioOutput === "function") {
    try {
      const device = await navigator.mediaDevices.selectAudioOutput();
      if (device && device.deviceId) {
        authorizedAudioDevicesMap.set(device.deviceId, device);
        selectedAudioOutputId = device.deviceId;
      }
    } catch (pickerErr) {
      if (pickerErr.name !== "AbortError") {
        console.info("selectAudioOutput fallback:", pickerErr.message || pickerErr);
      }
    }
  }

  await updateAudioOutputDeviceList(true);
}

async function openNativeAudioOutputPicker() {
  if (navigator.mediaDevices && typeof navigator.mediaDevices.selectAudioOutput === "function") {
    try {
      const device = await navigator.mediaDevices.selectAudioOutput();
      if (device && device.deviceId) {
        authorizedAudioDevicesMap.set(device.deviceId, device);
        selectedAudioOutputId = device.deviceId;
        await updateAudioOutputDeviceList(true);
        await setAudioOutputDevice(device.deviceId, true);
        return;
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.warn("selectAudioOutput encountered error:", err);
      }
    }
  } else {
    await requestAudioOutputAccess();
  }
}

function playTestAudioChime() {
  try {
    if (typeof initAudio === "function") initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === "suspended") audioCtx.resume();
    const now = audioCtx.currentTime;
    const isSplit = (selectedAudioChannelMode === "split_hands");
    const notes = isSplit
      ? [
          { freq: 261.63, midi: 48, time: 0, dur: 0.30, role: "lh" },
          { freq: 523.25, midi: 72, time: 0.16, dur: 0.30, role: "rh" },
          { freq: 659.25, midi: 76, time: 0.30, dur: 0.35, role: "rh" },
          { freq: 783.99, midi: 79, time: 0.44, dur: 0.45, role: "rh" }
        ]
      : [
          { freq: 523.25, midi: 72, time: 0, dur: 0.28, role: "center" },
          { freq: 659.25, midi: 76, time: 0.12, dur: 0.32, role: "center" },
          { freq: 783.99, midi: 79, time: 0.24, dur: 0.45, role: "center" }
        ];
    const effectiveVol = (typeof isMasterMuted !== "undefined" && isMasterMuted) ? 0 : (typeof currentMasterVolume !== "undefined" ? currentMasterVolume : 0.8);
    const vol = 0.22 * Math.pow(effectiveVol, 2);
    notes.forEach(n => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(n.freq, now + n.time);
      gain.gain.setValueAtTime(0, now + n.time);
      gain.gain.linearRampToValueAtTime(vol, now + n.time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.time + n.dur);
      osc.connect(gain);
      const destNode = (typeof getVoiceAudioDestination === "function")
        ? getVoiceAudioDestination(n.role)
        : ((typeof masterGainNode !== "undefined" && masterGainNode) ? masterGainNode : audioCtx.destination);
      gain.connect(destNode);
      osc.start(now + n.time);
      osc.stop(now + n.time + n.dur);

      if (typeof sendMidiOutputNoteOn === "function" && selectedMidiOutput) {
        setTimeout(() => {
          sendMidiOutputNoteOn(n.midi, 88, n.role === "center" ? "rh" : n.role);
          setTimeout(() => sendMidiOutputNoteOff(n.midi, n.role === "center" ? "rh" : n.role), n.dur * 900);
        }, n.time * 1000);
      }
    });
  } catch (err) {
    console.warn("Unable to play test audio chime:", err);
  }
}

async function updateAudioOutputDeviceList(isManual = false) {
  const select = document.getElementById("audioOutputSelect");
  const labelEl = document.getElementById("audioOutputLabel");
  const controlEl = document.getElementById("audioOutputControl");
  if (!select) return;

  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    select.innerHTML = '<option value="default">Default Audio Device</option>';
    return;
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const extraDevices = Array.from(authorizedAudioDevicesMap.values());
    const outputs = (window.MusicTheory && window.MusicTheory.filterAudioOutputDevices)
      ? window.MusicTheory.filterAudioOutputDevices(devices, extraDevices)
      : devices.filter(d => d.kind === "audiooutput").map((d, i) => {
          const devId = d.deviceId || "default";
          const label = d.label || (devId === "default" ? "System Default Output" : `Audio Output ${i + 1}`);
          const info = (window.MusicTheory && window.MusicTheory.classifyAudioDevice)
            ? window.MusicTheory.classifyAudioDevice(label, devId)
            : { type: "speakers", icon: "🔊", category: "Audio Output Device" };
          return {
            deviceId: devId,
            groupId: d.groupId || "",
            label,
            type: info.type,
            icon: info.icon,
            category: info.category
          };
        });

    cachedAudioOutputs = outputs;
    select.innerHTML = "";

    // Deduplicate devices by deviceId
    const seenIds = new Set();
    const uniqueOutputs = [];

    // Ensure default option is present
    const hasDefault = outputs.some(d => d.deviceId === "default" || d.deviceId === "");
    if (!hasDefault) {
      uniqueOutputs.push({
        deviceId: "default",
        label: "System Default Output",
        type: "default",
        icon: "💻",
        category: "Default System Output"
      });
      seenIds.add("default");
      seenIds.add("");
    }

    outputs.forEach(device => {
      const devId = device.deviceId || "default";
      if (!seenIds.has(devId)) {
        seenIds.add(devId);
        uniqueOutputs.push(device);
      }
    });

    uniqueOutputs.forEach((device, index) => {
      const opt = document.createElement("option");
      opt.value = device.deviceId || "default";
      const icon = device.icon || "🔊";
      let label = device.label || (device.deviceId === "default" ? "System Default Output" : `Audio Output ${index + 1}`);

      if (device.deviceId === "default") {
        const cleanName = label.replace(/^default\s*-\s*/i, "");
        opt.textContent = `💻 Default: ${cleanName || "System Output"}`;
      } else if (device.deviceId === "communications") {
        const cleanName = label.replace(/^communications\s*-\s*/i, "");
        opt.textContent = `📞 Comm: ${cleanName || "Communications Device"}`;
      } else {
        if (label.length > 65) {
          label = label.substring(0, 62) + "…";
        }
        opt.textContent = `${icon} ${label}`;
      }
      select.appendChild(opt);
    });

    // Add discovery / picker actions in an optgroup
    const optGroupActions = document.createElement("optgroup");
    optGroupActions.label = "─── Output Discovery ───";

    const discoverOpt = document.createElement("option");
    discoverOpt.value = "__discover__";
    discoverOpt.textContent = "🔍 Discover / Scan All Outputs (11+ on PC)...";
    optGroupActions.appendChild(discoverOpt);

    if (navigator.mediaDevices && typeof navigator.mediaDevices.selectAudioOutput === "function") {
      const pickerOpt = document.createElement("option");
      pickerOpt.value = "__system_picker__";
      pickerOpt.textContent = "✨ Open System Output Picker...";
      optGroupActions.appendChild(pickerOpt);
    }
    select.appendChild(optGroupActions);

    // Update count badge on header label & tooltip
    const outputCount = uniqueOutputs.length;
    if (labelEl) {
      labelEl.textContent = outputCount > 1 ? `Audio Output (${outputCount}):` : "Audio Output:";
    }
    if (controlEl) {
      controlEl.title = `Audio Output: ${outputCount} device${outputCount === 1 ? '' : 's'} discovered on this PC (Headphones, Speakers, Audio Interface)`;
    }

    // Restore selected value
    const matchesSelection = Array.from(select.options).some(o => o.value === selectedAudioOutputId && o.value !== "__discover__" && o.value !== "__system_picker__");
    if (matchesSelection) {
      select.value = selectedAudioOutputId;
    } else {
      select.value = "default";
      selectedAudioOutputId = "default";
    }

    await setAudioOutputDevice(selectedAudioOutputId, isManual);
  } catch (err) {
    console.warn("Unable to enumerate audio output devices:", err);
  }
}

async function setAudioOutputDevice(deviceId, isUserAction = true) {
  if (deviceId === "__discover__") {
    await requestAudioOutputAccess();
    return;
  }
  if (deviceId === "__system_picker__") {
    await openNativeAudioOutputPicker();
    return;
  }

  selectedAudioOutputId = deviceId || "default";
  try {
    localStorage.setItem("piano_audio_output_device", selectedAudioOutputId);
  } catch (e) {}

  const select = document.getElementById("audioOutputSelect");
  if (select) {
    const hasOption = Array.from(select.options).some(o => o.value === selectedAudioOutputId);
    if (!hasOption && selectedAudioOutputId !== "default") {
      const customOpt = document.createElement("option");
      customOpt.value = selectedAudioOutputId;
      const authDev = authorizedAudioDevicesMap.get(selectedAudioOutputId);
      customOpt.textContent = `🔊 ${(authDev && authDev.label) ? authDev.label : "Selected Output Device"}`;
      select.insertBefore(customOpt, select.firstChild);
    }
    if (select.value !== selectedAudioOutputId) {
      select.value = selectedAudioOutputId;
    }
  }

  // Only initialize or resume AudioContext when triggered by user action (or if audioCtx already exists)
  if (isUserAction && !audioCtx && typeof initAudio === "function") {
    initAudio();
  }

  if (audioCtx) {
    await applyAudioOutputSink(selectedAudioOutputId);
  }

  const icon = document.getElementById("audioOutputStatusIcon");
  const selectedOpt = select ? select.selectedOptions[0] : null;
  const labelText = selectedOpt ? selectedOpt.textContent : "";
  if (icon) {
    if (window.MusicTheory && window.MusicTheory.classifyAudioDevice) {
      const info = window.MusicTheory.classifyAudioDevice(labelText, selectedAudioOutputId);
      icon.textContent = info.icon || "🔊";
    } else {
      const l = labelText.toLowerCase();
      icon.textContent = l.includes("headphone") ? "🎧" : "🔊";
    }
  }

  updateAudioOutputRouteBadge();
}

// UNIFIED MULTI-INSTRUMENT WEB AUDIO SYNTHESIZER (11 AUTHENTIC TIMBRES)
function synthesizeTimbre(freq, duration = 0.35, velocity = 90, voiceRole = "rh", isLive = false, instrumentOverride = null) {
  if (!freq) return null;
  const effectiveVol = isMasterMuted ? 0 : currentMasterVolume;
  if (effectiveVol <= 0.0001) return null;

  initAudio();
  if (typeof audioCtx === "undefined" || !audioCtx) return null;
  const now = audioCtx.currentTime;
  const instId = instrumentOverride || getActiveSynthInstrument();
  const instParams = (window.MusicTheory && window.MusicTheory.getInstrumentParameters)
    ? window.MusicTheory.getInstrumentParameters(instId)
    : {
        attackSec: 0.005,
        decaySec: 2.5,
        sustainLevel: 0.45,
        releaseSec: 0.28,
        velocitySensitivity: 1.0,
        filterType: "lowpass",
        filterMultiplier: 4.5
      };

  const velSens = typeof instParams.velocitySensitivity === "number" ? instParams.velocitySensitivity : 1.0;
  const rawVelNorm = Math.max(0.15, Math.min(1.0, velocity / 127));
  const velNorm = (1 - velSens) * 0.9 + velSens * rawVelNorm;
  const volScale = Math.pow(effectiveVol, 2) * velNorm;

  const destNode = (typeof getVoiceAudioDestination === "function")
    ? getVoiceAudioDestination(voiceRole)
    : (masterGainNode || audioCtx.destination);

  const voiceGain = audioCtx.createGain();
  voiceGain.connect(destNode);

  const filter = audioCtx.createBiquadFilter();
  filter.connect(voiceGain);

  const oscillators = [];
  let lfoNode = null;
  let peakGain = 0.25 * volScale;
  let sustainGain = peakGain * (instParams.sustainLevel !== undefined ? instParams.sustainLevel : 0.5);

  const dur = Math.max(0.08, duration || 0.35);

  switch (instId) {
    case "electric_piano": {
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(freq * (2.6 + velNorm * 3.5), now);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.8, now + Math.max(0.2, dur));

      const osc1 = audioCtx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(freq, now);

      const osc2 = audioCtx.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(freq * 2, now); // Bell tine overtone

      const g2 = audioCtx.createGain();
      g2.gain.setValueAtTime(0.30 * velNorm, now);
      g2.gain.exponentialRampToValueAtTime(0.008, now + Math.max(0.1, dur * 0.6));

      osc1.connect(filter);
      osc2.connect(g2);
      g2.connect(filter);
      oscillators.push(osc1, osc2);

      peakGain = 0.25 * volScale;
      sustainGain = peakGain * 0.55;
      break;
    }

    case "harpsichord": {
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(Math.min(12000, freq * 7.0), now);
      filter.Q.setValueAtTime(1.8, now);

      const osc1 = audioCtx.createOscillator();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(freq, now);

      const osc2 = audioCtx.createOscillator();
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(freq * 2 * Math.pow(2, 3 / 1200), now); // Octave + 3 cents

      const g2 = audioCtx.createGain();
      g2.gain.setValueAtTime(0.28, now);

      osc1.connect(filter);
      osc2.connect(g2);
      g2.connect(filter);
      oscillators.push(osc1, osc2);

      peakGain = 0.20 * volScale;
      sustainGain = peakGain * 0.15;
      break;
    }

    case "church_organ": {
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(Math.min(10000, freq * 4.5), now);

      const osc1 = audioCtx.createOscillator(); // 8' principal
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(freq, now);

      const osc2 = audioCtx.createOscillator(); // 4' octave
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freq * 2 * Math.pow(2, 2 / 1200), now);

      const osc3 = audioCtx.createOscillator(); // 16' sub-bass
      osc3.type = "triangle";
      osc3.frequency.setValueAtTime(freq * 0.5, now);

      const osc4 = audioCtx.createOscillator(); // 2 2/3' quint
      osc4.type = "sine";
      osc4.frequency.setValueAtTime(freq * 3, now);

      const g2 = audioCtx.createGain(); g2.gain.setValueAtTime(0.35, now);
      const g3 = audioCtx.createGain(); g3.gain.setValueAtTime(0.32, now);
      const g4 = audioCtx.createGain(); g4.gain.setValueAtTime(0.15, now);

      osc1.connect(filter);
      osc2.connect(g2); g2.connect(filter);
      osc3.connect(g3); g3.connect(filter);
      osc4.connect(g4); g4.connect(filter);
      oscillators.push(osc1, osc2, osc3, osc4);

      peakGain = 0.22 * volScale;
      sustainGain = peakGain * 1.0;
      break;
    }

    case "rock_organ": {
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(Math.min(9000, freq * 5.5), now);

      const osc1 = audioCtx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(freq, now);

      const osc2 = audioCtx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freq * 2, now);

      const osc3 = audioCtx.createOscillator();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(freq * 4, now);

      const oscClick = audioCtx.createOscillator();
      oscClick.type = "sine";
      oscClick.frequency.setValueAtTime(freq * 3, now);

      const g2 = audioCtx.createGain(); g2.gain.setValueAtTime(0.35, now);
      const g3 = audioCtx.createGain(); g3.gain.setValueAtTime(0.20, now);
      const gClick = audioCtx.createGain();
      gClick.gain.setValueAtTime(0.65 * velNorm, now);
      gClick.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc1.connect(filter);
      osc2.connect(g2); g2.connect(filter);
      osc3.connect(g3); g3.connect(filter);
      oscClick.connect(gClick); gClick.connect(filter);
      oscillators.push(osc1, osc2, osc3, oscClick);

      peakGain = 0.22 * volScale;
      sustainGain = peakGain * 0.95;
      break;
    }

    case "celesta": {
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(Math.min(10000, Math.max(800, freq * 2.2)), now);
      filter.Q.setValueAtTime(0.8, now);

      const osc1 = audioCtx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(freq, now);

      const osc2 = audioCtx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freq * 2.756, now);

      const osc3 = audioCtx.createOscillator();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(freq * 5.404, now);

      const g2 = audioCtx.createGain();
      g2.gain.setValueAtTime(0.42 * velNorm, now);
      g2.gain.exponentialRampToValueAtTime(0.002, now + 0.45);

      const g3 = audioCtx.createGain();
      g3.gain.setValueAtTime(0.22 * velNorm, now);
      g3.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc1.connect(filter);
      osc2.connect(g2); g2.connect(filter);
      osc3.connect(g3); g3.connect(filter);
      oscillators.push(osc1, osc2, osc3);

      peakGain = 0.24 * volScale;
      sustainGain = peakGain * 0.20;
      break;
    }

    case "acoustic_guitar": {
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(freq * 5.5, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.3, now + 0.07);

      const osc1 = audioCtx.createOscillator();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(freq, now);

      const osc2 = audioCtx.createOscillator();
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(freq, now);

      const g2 = audioCtx.createGain();
      g2.gain.setValueAtTime(0.35 * velNorm, now);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc1.connect(filter);
      osc2.connect(g2); g2.connect(filter);
      oscillators.push(osc1, osc2);

      peakGain = 0.24 * volScale;
      sustainGain = peakGain * 0.25;
      break;
    }

    case "chiptune": {
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(14000, now);

      const osc1 = audioCtx.createOscillator();
      osc1.type = "square";
      osc1.frequency.setValueAtTime(freq * 1.08, now);
      osc1.frequency.exponentialRampToValueAtTime(freq, now + 0.018);

      osc1.connect(filter);
      oscillators.push(osc1);

      peakGain = 0.18 * volScale;
      sustainGain = peakGain * 0.85;
      break;
    }

    case "strings_synth": {
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(Math.min(9000, freq * 3.2), now);
      filter.Q.setValueAtTime(1.5, now);

      const osc1 = audioCtx.createOscillator();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(freq * Math.pow(2, -6 / 1200), now); // -6 cents

      const osc2 = audioCtx.createOscillator();
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(freq * Math.pow(2, 6 / 1200), now); // +6 cents

      const osc3 = audioCtx.createOscillator();
      osc3.type = "triangle";
      osc3.frequency.setValueAtTime(freq, now);

      const g1 = audioCtx.createGain(); g1.gain.setValueAtTime(0.40, now);
      const g2 = audioCtx.createGain(); g2.gain.setValueAtTime(0.40, now);
      const g3 = audioCtx.createGain(); g3.gain.setValueAtTime(0.30, now);

      osc1.connect(g1); g1.connect(filter);
      osc2.connect(g2); g2.connect(filter);
      osc3.connect(g3); g3.connect(filter);
      oscillators.push(osc1, osc2, osc3);

      peakGain = 0.22 * volScale;
      sustainGain = peakGain * 0.85;
      break;
    }

    case "vibraphone": {
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(Math.min(10000, freq * 4.0), now);

      const osc1 = audioCtx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(freq, now);

      const osc2 = audioCtx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freq * 4, now); // Metallic strike ping

      const g2 = audioCtx.createGain();
      g2.gain.setValueAtTime(0.35 * velNorm, now);
      g2.gain.exponentialRampToValueAtTime(0.002, now + 0.08);

      // Motor tremolo modulation (5.5 Hz)
      const tremoloOsc = audioCtx.createOscillator();
      tremoloOsc.frequency.setValueAtTime(5.5, now);
      const tremoloGain = audioCtx.createGain();
      tremoloGain.gain.setValueAtTime(0.04, now);
      tremoloOsc.connect(tremoloGain);
      tremoloGain.connect(voiceGain.gain);

      osc1.connect(filter);
      osc2.connect(g2); g2.connect(filter);
      oscillators.push(osc1, osc2);
      lfoNode = tremoloOsc;

      peakGain = 0.24 * volScale;
      sustainGain = peakGain * 0.35;
      break;
    }

    case "honky_tonk": {
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(Math.min(11000, freq * 5.2), now);

      const osc1 = audioCtx.createOscillator();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(freq, now);

      const osc2 = audioCtx.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(freq * Math.pow(2, 8 / 1200), now); // +8 cents

      const osc3 = audioCtx.createOscillator();
      osc3.type = "sawtooth";
      osc3.frequency.setValueAtTime(freq * Math.pow(2, -7 / 1200), now); // -7 cents

      const oscClick = audioCtx.createOscillator();
      oscClick.type = "sine";
      oscClick.frequency.setValueAtTime(freq * 4.5, now);

      const g2 = audioCtx.createGain(); g2.gain.setValueAtTime(0.35, now);
      const g3 = audioCtx.createGain(); g3.gain.setValueAtTime(0.25, now);
      const gClick = audioCtx.createGain();
      gClick.gain.setValueAtTime(0.30 * velNorm, now);
      gClick.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      osc1.connect(filter);
      osc2.connect(g2); g2.connect(filter);
      osc3.connect(g3); g3.connect(filter);
      oscClick.connect(gClick); gClick.connect(filter);
      oscillators.push(osc1, osc2, osc3, oscClick);

      peakGain = 0.24 * volScale;
      sustainGain = peakGain * 0.40;
      break;
    }

    case "grand_piano":
    default: {
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(freq * (2.8 + velNorm * 4.5), now);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.6, now + Math.max(0.2, dur * 0.7));

      const osc1 = audioCtx.createOscillator();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(freq, now);

      const osc2 = audioCtx.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(freq * Math.pow(2, 2 / 1200), now); // +2 cents

      const osc3 = audioCtx.createOscillator();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(freq * 2, now); // 2nd harmonic hammer

      const g2 = audioCtx.createGain();
      g2.gain.setValueAtTime(0.35, now);

      const g3 = audioCtx.createGain();
      g3.gain.setValueAtTime(0.25 * velNorm, now);
      g3.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc1.connect(filter);
      osc2.connect(g2); g2.connect(filter);
      osc3.connect(g3); g3.connect(filter);
      oscillators.push(osc1, osc2, osc3);

      peakGain = 0.26 * volScale;
      sustainGain = peakGain * 0.45;
      break;
    }
  }

  const attackSec = instParams.attackSec || 0.005;
  const decaySec = instParams.decaySec || 2.2;
  const releaseSec = instParams.releaseSec || 0.25;

  if (!isLive) {
    // One-shot scheduled note playback
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.linearRampToValueAtTime(peakGain, now + attackSec);
    const midTime = now + attackSec + Math.max(0.04, (dur - attackSec) * 0.5);
    voiceGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, sustainGain), midTime);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + dur + releaseSec);

    oscillators.forEach(osc => {
      osc.start(now);
      osc.stop(now + dur + releaseSec + 0.03);
    });
    if (lfoNode) {
      lfoNode.start(now);
      try { lfoNode.stop(now + dur + releaseSec + 0.03); } catch (e) {}
    }
  } else {
    // Live keyboard / MIDI performance
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.linearRampToValueAtTime(peakGain, now + attackSec);
    voiceGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, sustainGain), now + attackSec + 0.35);
    if (decaySec > 0 && decaySec < 8) {
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + attackSec + 0.35 + decaySec);
    }
    oscillators.forEach(osc => osc.start(now));
    if (lfoNode) lfoNode.start(now);
  }

  const voiceHandle = {
    osc: oscillators[0],
    osc2: oscillators[1] || null,
    oscillators,
    gain: voiceGain,
    filter,
    lfoNode,
    voiceRole,
    instId,
    releaseSec
  };

  if (!isLive) {
    activePreviewVoices.add(voiceHandle);
    if (oscillators[0]) {
      oscillators[0].onended = () => {
        activePreviewVoices.delete(voiceHandle);
      };
    }
  }

  return voiceHandle;
}

/**
 * Cleanly fades out and stops all ringing one-shot/preview voices (on Pause/Stop/Seek).
 */
function stopAllPreviewVoices() {
  if (!audioCtx || activePreviewVoices.size === 0) {
    activePreviewVoices.clear();
    return;
  }
  const now = audioCtx.currentTime;
  const rel = 0.03;
  activePreviewVoices.forEach(voice => {
    try {
      if (voice.gain && voice.gain.gain) {
        voice.gain.gain.cancelScheduledValues(now);
        const curG = Math.max(0.0001, voice.gain.gain.value || 0.05);
        voice.gain.gain.setValueAtTime(curG, now);
        voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + rel);
      }
      if (Array.isArray(voice.oscillators)) {
        voice.oscillators.forEach(osc => {
          try { osc.stop(now + rel + 0.015); } catch (e) {}
        });
      }
      if (voice.lfoNode) {
        try { voice.lfoNode.stop(now + rel + 0.015); } catch (e) {}
      }
    } catch (e) {}
  });
  activePreviewVoices.clear();
}

/**
 * Triggers a one-shot note via MIDI Output (if connected) and delegates Web Audio synthesis
 * to synthesizeTimbre().
 */
function playTone(freq, duration = 0.35, velocity = 90) {
  if (!freq) return null;
  const midiNum = Math.round(69 + 12 * Math.log2(freq / 440));
  const voiceRole = arguments.length > 3 && arguments[3] ? arguments[3] : (midiNum < 60 ? "lh" : "rh");
  const instOverride = arguments.length > 4 ? arguments[4] : null;

  if (typeof sendMidiOutputNoteOn === "function" && typeof selectedMidiOutput !== "undefined" && selectedMidiOutput) {
    if (midiNum >= 0 && midiNum <= 127) {
      sendMidiOutputNoteOn(midiNum, velocity, voiceRole);
      setTimeout(() => {
        if (typeof sendMidiOutputNoteOff === "function") sendMidiOutputNoteOff(midiNum, voiceRole);
      }, duration * 1000);
    }
  }

  if (!isSynthAudioEnabled()) return null;
  const effectiveVol = isMasterMuted ? 0 : currentMasterVolume;
  if (effectiveVol <= 0.0001) return null;

  return synthesizeTimbre(freq, duration, velocity, voiceRole, false, instOverride);
}

/**
 * Shared audio click scheduler used by both Rhythm Workshop and Repertoire Metronome.
 */
function triggerMetronomeClickAudio(time, profile, fallbackPeak = 0.35, fallbackDur = 0.045) {
  const effectiveVol = isMasterMuted ? 0 : currentMasterVolume;
  if (effectiveVol <= 0.0001 || !audioCtx) return;

  if (window.MusicTheory && window.MusicTheory.synthesizeMetronomeClick) {
    window.MusicTheory.synthesizeMetronomeClick(audioCtx, masterGainNode || audioCtx.destination, time, profile.accentType, currentMetroSound, effectiveVol);
    return;
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.setValueAtTime(profile.freq, time);
  const volScale = Math.pow(effectiveVol, 2);
  const weight = profile.volume !== undefined ? profile.volume : (profile.isDownbeat ? 1.0 : 0.6);
  const targetPeak = fallbackPeak * volScale * weight;

  gain.gain.setValueAtTime(targetPeak, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + fallbackDur);

  osc.connect(gain);
  gain.connect(masterGainNode || audioCtx.destination);
  osc.start(time);
  osc.stop(time + fallbackDur);
}

function updateSustainPedalUI() {
  const badge = document.getElementById("sustainPedalBadge");
  if (!badge) return;
  badge.textContent = isSustainPedalDown ? "🦶 Damper: ON" : "🦶 Damper: OFF";
  badge.style.color = isSustainPedalDown ? "#34d399" : "var(--text-muted)";
  badge.style.borderColor = isSustainPedalDown ? "#10b981" : "var(--border)";
}

function initSustainPedalControl() {
  document.getElementById("sustainPedalBadge")?.addEventListener("click", () => {
    isSustainPedalDown = !isSustainPedalDown;
    if (typeof sendMidiOutputSustain === "function") {
      sendMidiOutputSustain(isSustainPedalDown);
    }
    if (!isSustainPedalDown) {
      pedaledNotes.forEach(num => {
        if (!activeHeldMidiNotes.has(num)) stopLiveTone(num, true);
      });
      pedaledNotes.clear();
    }
    updateSustainPedalUI();
    updateActiveChordRecognizer();
  });
  updateSustainPedalUI();
}

function startLiveTone(noteNumber, velocity = 100) {
  const voiceRole = arguments.length > 2 && arguments[2] ? arguments[2] : (noteNumber < 60 ? "lh" : "rh");
  const instOverride = arguments.length > 3 ? arguments[3] : null;

  if (typeof sendMidiOutputNoteOn === "function") {
    sendMidiOutputNoteOn(noteNumber, velocity, voiceRole);
  }
  if (!isSynthAudioEnabled()) return;
  if (liveOscillators.has(noteNumber)) {
    stopLiveTone(noteNumber, true); // Re-strike cleanly if pedaled
  }

  const freq = 440 * Math.pow(2, (noteNumber - 69) / 12);
  const voice = synthesizeTimbre(freq, 0, velocity, voiceRole, true, instOverride);
  if (voice) {
    liveOscillators.set(noteNumber, voice);
  }
}

function stopLiveTone(noteNumber, forceImmediate = false) {
  const existingVoice = liveOscillators.get(noteNumber);
  const voiceRole = existingVoice && existingVoice.voiceRole ? existingVoice.voiceRole : (noteNumber < 60 ? "lh" : "rh");
  if (typeof sendMidiOutputNoteOff === "function") {
    sendMidiOutputNoteOff(noteNumber, voiceRole);
  }
  if (isSustainPedalDown && !forceImmediate) {
    pedaledNotes.add(noteNumber);
    return;
  }
  const voice = liveOscillators.get(noteNumber);
  if (!voice) return;
  const now = audioCtx.currentTime;
  const rel = forceImmediate ? 0.03 : Math.min(0.5, voice.releaseSec || 0.2);

  if (voice.gain && voice.gain.gain) {
    voice.gain.gain.cancelScheduledValues(now);
    const curG = Math.max(0.0001, voice.gain.gain.value || 0.05);
    voice.gain.gain.setValueAtTime(curG, now);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + rel);
  }
  if (Array.isArray(voice.oscillators)) {
    voice.oscillators.forEach(osc => {
      try { osc.stop(now + rel + 0.02); } catch (e) {}
    });
  } else if (voice.osc) {
    try { voice.osc.stop(now + rel + 0.02); } catch (e) {}
    if (voice.osc2) try { voice.osc2.stop(now + rel + 0.02); } catch (e) {}
  }
  if (voice.lfoNode) {
    try { voice.lfoNode.stop(now + rel + 0.02); } catch (e) {}
  }
  liveOscillators.delete(noteNumber);
}
