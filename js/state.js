// ============================================================================
// SHARED GLOBAL APPLICATION STATE & CORE THEORY IMPORTS
// ============================================================================

// Song Database initialization (from songs.js with fallback)
const starterFallbackDatabase = (typeof window.songDatabase !== "undefined" && Array.isArray(window.songDatabase) && window.songDatabase.length > 0)
  ? window.songDatabase
  : [
      {
        id: "ode-to-joy",
        title: "Ode to Joy",
        instrument: "grand_piano",
        category: "C 5-Finger",
        tempo: 104,
        timeSig: "4/4",
        rh: "E4:1 E4:1 F4:1 G4:1 | G4:1 F4:1 E4:1 D4:1 | C4:1 C4:1 D4:1 E4:1 | D4:1.5 C4:0.5 C4:2",
        rhF: "3 3 4 5 | 5 4 3 2 | 1 1 2 3 | 2 1 1",
        lh: "C3:2 C3:2 | G2:2 G2:2 | C3:2 G2:2 | G2:2 C3:2",
        lhF: "5 5 | 1 1 | 5 1 | 1 5",
        dyads: "C4+E4:1 C4+E4:1 D4+F4:1 E4+G4:1 | E4+G4:1 D4+F4:1 C4+E4:1 G3+D4:1 | C4+E4:1 C4+E4:1 G3+D4:1 C4+E4:1 | G3+D4:1.5 C4+E4:0.5 C4+E4:2",
        dyadsF: "1+3 1+3 2+4 3+5 | 3+5 2+4 1+3 1+2 | 1+3 1+3 1+2 1+3 | 1+2 1+3 1+3",
        tip: "Beethoven's 9th Symphony theme: Keep both hands level and drop arm weight evenly into downbeats."
      }
    ];

let songDatabase = window.songDatabase || starterFallbackDatabase;

// Pedagogical Curriculum Level Configuration (8 Progressive Levels)
const curriculumLevels = {
  1: {
    name: "Level 1: Root Primer",
    briefing: "<strong>Lesson 1: Root Primer</strong> — Learn single melody notes on the right hand (𝄞). Keep fingers arched over the 5-finger C position (Thumb on Middle C). The cheat sheet letters and finger numbers guide each note without colliding with lines.",
    config: { rh: true, lh: false, dyads: false, cheat: true, fingers: true, filter: "C 5-Finger", lhStyle: "roots" }
  },
  2: {
    name: "Level 2: Skips & Sight Reading",
    briefing: "<strong>Lesson 2: Skips & Reading</strong> — Train reading melodic skips of a 3rd (e.g., C to E, G down to E). We turn off the crutch labels so you build real staff sight-reading intuition.",
    config: { rh: true, lh: false, dyads: false, cheat: false, fingers: true, filter: "C 5-Finger", lhStyle: "roots" }
  },
  3: {
    name: "Level 3: Harmonic Dyads & Intervals",
    briefing: "<strong>Lesson 3: Harmonic Dyads & Intervals</strong> — Master simultaneous multi-note harmonies! Choose your harmony interval (Thirds, Fifths, Sixths, Octaves, or Triads) using the Level selector. You can keep Left Hand active to practice 2-hand harmony coordination simultaneously.",
    config: { rh: true, lh: false, dyads: true, cheat: true, fingers: true, filter: "Harmonic / Dyads", harmonyType: "thirds", lhStyle: "roots" }
  },
  4: {
    name: "Level 4: Left-Hand Bass Clef Foundation",
    briefing: "<strong>Lesson 4: Bass Clef Foundation (𝄢)</strong> — Focus on the left hand reading the F clef. Master single root bass anchors (C3, G2, F2) or customize your accompaniment using the LH Style selector (Single Roots, Open 5ths, Octaves, Triads).",
    config: { rh: false, lh: true, dyads: false, cheat: true, fingers: true, filter: "all", lhStyle: "roots" }
  },
  5: {
    name: "Level 5: 2-Hand Coordination",
    briefing: "<strong>Lesson 5: 2-Hand Coordination</strong> — Coordinate hands playing simultaneously: Left Hand (𝄢) holds bass roots (or full chords/5ths) while Right Hand (𝄞) plays melodies. Watch the stacked measure bars sync up.",
    config: { rh: true, lh: true, dyads: false, cheat: true, fingers: true, filter: "all", lhStyle: "roots" }
  },
  6: {
    name: "Level 6: Extended Scales & Velocity",
    briefing: "<strong>Lesson 6: Extended Scales</strong> — Break out of the static 5-finger position! Practice thumb-under crossings, octave arpeggio sweeps, and Hanon finger dexterity exercises.",
    config: { rh: true, lh: true, dyads: false, cheat: false, fingers: true, filter: "Extended Scale", lhStyle: "song" }
  },
  7: {
    name: "Level 7: Minor & Modal Exploration",
    briefing: "<strong>Lesson 7: Minor & Modal</strong> — Explore rich tonalities: Aeolian natural minor, Dorian modes, and blues scales (e.g. Gymnopédie, Scarborough Fair, Greensleeves). Both Left Hand and Harmonies are fully active for grand staff polyphony.",
    config: { rh: true, lh: true, dyads: true, cheat: false, fingers: true, filter: "Minor / Modal", harmonyType: "song", lhStyle: "song" }
  },
  8: {
    name: "Level 8: Classical Master Repertoire",
    briefing: "<strong>Lesson 8: Classical Fluency</strong> — The pinnacle: Performance-ready classical masterpieces (Für Elise, Bach Minuet in G, Canon in D) at brisk concert tempo with both hands active on grand staff harmony without crutches.",
    config: { rh: true, lh: true, dyads: true, cheat: false, fingers: false, filter: "Classical Mastery", harmonyType: "song", lhStyle: "song" }
  }
};

// Deduplicated Music Theory Core Engine from window.MusicTheory
const {
  DIATONIC_BASE,
  NOTE_OFFSETS,
  NOTE_NAMES_SHARP: NOTE_NAMES,
  getDiatonicStep,
  pitchToFreq: getNoteFreq,
  midiToPitch: midiNumberToPitch,
  pitchToMidi: getPitchMidiNumber,
  parseToken,
  getRomanNumeralAnalysis,
  buildScoreModel,
  identifyActiveChord,
  STANDARD_KEYBOARD_PRESETS,
  getSongPitchRange,
  evaluateSongKeyboardCompatibility
} = (typeof MusicTheory !== "undefined" ? MusicTheory : window.MusicTheory);

function findPianoKeyElement(pitchStr, defaultOct = 4) {
  if (!pitchStr || pitchStr === "-") return null;
  let keyEl = document.querySelector(`.piano-key[data-note="${pitchStr}"]`);
  if (keyEl) return keyEl;
  const num = getPitchMidiNumber(pitchStr, defaultOct);
  if (num !== null) {
    const canonical = midiNumberToPitch(num);
    keyEl = document.querySelector(`.piano-key[data-note="${canonical}"]`);
    if (keyEl) return keyEl;
  }
  return null;
}

function isCheatSheetColorsEnabled() {
  const toggle = document.getElementById("toggleCheatSheetColors");
  return toggle ? toggle.checked : true;
}

function setChordPillDisplay(notesArray) {
  const chordPill = document.getElementById("activeChordPill");
  if (!chordPill) return;
  if (!notesArray || notesArray.length === 0) {
    chordPill.style.display = "none";
    return;
  }
  const chordInfo = (typeof identifyActiveChord === "function") 
    ? identifyActiveChord(notesArray) 
    : (window.MusicTheory && window.MusicTheory.identifyActiveChord ? window.MusicTheory.identifyActiveChord(notesArray) : null);
  if (chordInfo) {
    chordPill.style.display = "inline-flex";
    chordPill.style.alignItems = "center";
    chordPill.style.gap = "0.45rem";

    let dotsHtml = "";
    if (notesArray.length > 1 && isCheatSheetColorsEnabled()) {
      dotsHtml = notesArray.map(n => {
        const col = (window.MusicTheory && window.MusicTheory.getCheatSheetNoteColor) 
          ? window.MusicTheory.getCheatSheetNoteColor(n.pitch) 
          : "#fbbf24";
        return `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${col}; box-shadow:0 0 6px ${col};" title="${n.pitch}"></span>`;
      }).join("");
    }

    chordPill.innerHTML = `<span>${chordInfo.name}</span> <span style="font-size:0.75rem; opacity:0.85;">(${chordInfo.type})</span> ${dotsHtml}`;
  } else {
    chordPill.style.display = "none";
  }
}

// LIVE SUSTAIN & CHORD RECOGNIZER ENGINE
function updateActiveChordRecognizer() {
  // Allow preview playback to control chord pill exclusively during auto playback
  if (typeof playbackTimeouts !== "undefined" && playbackTimeouts.length > 0) return;
  if (typeof transportState !== "undefined" && transportState.status === "playing") return;

  const activeNotesMap = new Map();

  // 1. Physical MIDI held keys
  if (typeof activeHeldMidiNotes !== "undefined") {
    for (const [num, noteData] of activeHeldMidiNotes) {
      activeNotesMap.set(num, { num, pitch: noteData.pitch });
    }
  }

  // 2. Ringing notes sustained by pedal (CC 64)
  if (typeof isSustainPedalDown !== "undefined" && isSustainPedalDown && typeof pedaledNotes !== "undefined") {
    for (const num of pedaledNotes) {
      if (!activeNotesMap.has(num)) {
        activeNotesMap.set(num, { num, pitch: midiNumberToPitch(num) });
      }
    }
  }

  // 3. Keys held via mouse / touch on on-screen interactive piano
  if (typeof activeHeldKeyAttacks !== "undefined") {
    for (const [pitchName, attack] of activeHeldKeyAttacks) {
      if (attack && attack.isDown) {
        const num = attack.noteNumber ?? (NOTE_OFFSETS[pitchName.replace(/[0-9]/g, "")] + (parseInt(pitchName.slice(-1), 10) + 1) * 12);
        if (!activeNotesMap.has(num)) {
          activeNotesMap.set(num, { num, pitch: pitchName });
        }
      }
    }
  }

  setChordPillDisplay(Array.from(activeNotesMap.values()));
}

// Audio & State
let audioCtx = null;
let masterGainNode = null;
let currentMasterVolume = 0.8;
let isMasterMuted = false;
let preMuteVolume = 0.8;
let playbackTimeouts = [];
let currentSong = null;
const liveOscillators = new Map();
const activeHeldMidiNotes = new Map();

// Synthesizer Timbre & Instrument State (Milestone 40)
let currentSynthInstrument = "auto";
try {
  const savedSynthInst = localStorage.getItem("piano_synth_instrument");
  if (savedSynthInst) currentSynthInstrument = savedSynthInst;
} catch (e) {}

function getActiveSynthInstrument() {
  if (currentSynthInstrument && currentSynthInstrument !== "auto") {
    return currentSynthInstrument;
  }
  if (currentSong && typeof window.MusicTheory !== "undefined" && typeof window.MusicTheory.getSongDefaultInstrument === "function") {
    return window.MusicTheory.getSongDefaultInstrument(currentSong);
  }
  return "grand_piano";
}

function updateSongInstrumentUI() {
  const effectiveId = getActiveSynthInstrument();
  const instParams = (window.MusicTheory && window.MusicTheory.getInstrumentParameters)
    ? window.MusicTheory.getInstrumentParameters(effectiveId)
    : { name: "Acoustic Grand Piano", shortName: "Grand Piano", icon: "🎹" };

  const badge = document.getElementById("currentSongInstrumentBadge");
  if (badge) {
    badge.textContent = `${instParams.icon} ${instParams.name || instParams.shortName}`;
    badge.title = `Active Synthesizer Instrument: ${instParams.name} (${currentSynthInstrument === "auto" ? "Song Default" : "Manual Override"})`;
  }

  const sel = document.getElementById("synthInstrumentSelect");
  if (sel) {
    const autoOpt = sel.querySelector('option[value="auto"]');
    if (autoOpt) {
      const defaultSongInst = (currentSong && window.MusicTheory && window.MusicTheory.getSongDefaultInstrument)
        ? window.MusicTheory.getSongDefaultInstrument(currentSong)
        : "grand_piano";
      const defParams = (window.MusicTheory && window.MusicTheory.getInstrumentParameters)
        ? window.MusicTheory.getInstrumentParameters(defaultSongInst)
        : { shortName: "Grand Piano" };
      autoOpt.textContent = `✨ Auto (${defParams.shortName || "Default"})`;
    }
    if (sel.value !== currentSynthInstrument) {
      sel.value = currentSynthInstrument;
    }
  }
}

function setSynthInstrument(instId, playPreview = false) {
  currentSynthInstrument = instId || "auto";
  try {
    localStorage.setItem("piano_synth_instrument", currentSynthInstrument);
  } catch (e) {}

  updateSongInstrumentUI();

  if (playPreview && isSynthAudioEnabled()) {
    initAudio();
    const effective = getActiveSynthInstrument();
    playTone(523.25, 0.45, 95, "rh", effective);
  }
}

// Configurable Keyboard Visualizer Range & Offset
let currentStartMidi = 36; // C2 (MIDI 36) default
let currentKeyCount = 37;  // 37 keys (C2 – C5) default

// WAIT-FOR-ME INTERACTIVE PRACTICE STATE
let isWaitPracticeMode = true;
let currentPracticeStep = 0;
let isPracticeSessionStarted = false; // Tracks whether student has begun active playing session (guards step 0 count-in rest)
let songNoteSteps = []; // Parsed sequence of steps { rh, lh, dyad, expectedPitches: [] }
let currentSongMeasures = []; // Parsed sequence of measures with beat-aligned onset items
let currentPlaybackTimeline = null; // Cumulative beat timeline & measure start index maps

// Dynamic Step-Chained Playback Transport State (Milestone 42)
const transportState = {
  status: "stopped", // "stopped" | "counting_in" | "playing" | "paused"
  currentStepIndex: 0,
  stepStartPerfMs: 0,
  currentStepBeats: 1,
  lastStepBpm: 96,
  stepTimerId: null,
  countInTimers: [],
  rafId: null,
  activeVoiceNotes: new Map(),
  voiceOffTimeouts: new Map(),
  loopPassCount: 0,
  countInBars: 0,
  activeSpeedPct: 100
};
try {
  const savedCountIn = parseInt(localStorage.getItem("piano_count_in_bars"), 10);
  if (!isNaN(savedCountIn) && savedCountIn >= 0 && savedCountIn <= 2) {
    transportState.countInBars = savedCountIn;
  }
} catch (e) {}
let stepFulfilledPitches = new Set(); // Tracks satisfied pitches within current active practice step
const activeHeldKeyAttacks = new Map(); // pitch -> { downTime, attackId, isDown, consumedStepIndex }
let attackCounter = 0;

function isSynthAudioEnabled() {
  const toggle = document.getElementById("midiSoundToggle");
  return toggle ? toggle.checked : true;
}

// Multi-Channel Web Audio Router & Hardware Audio Output State
// Multi-Channel Web Audio Router & MediaStream Sink Fallback Bridge State
let selectedAudioChannelMode = "stereo";
let lhVoiceBus = null;
let rhVoiceBus = null;
let masterChannelSplitter = null;
let audioChannelMerger = null;
let channelRouteNodes = [];
let mediaStreamDestNode = null;
let audioSinkBridgeElement = null;
let isUsingMediaStreamBridge = false;
const authorizedAudioDevicesMap = new Map();
let selectedAudioOutputId = "default";
let cachedAudioOutputs = [];

// MIDI Hardware & 16-Channel Telemetry State
let midiAccess = null;
let selectedMidiInput = null;
let selectedMidiOutput = null;
let selectedMidiOutputId = "none";
const midiChannelActivity = {};
for (let c = 1; c <= 16; c++) {
  midiChannelActivity[c] = {
    lastActiveTime: 0,
    totalMessages: 0,
    isActive: false,
    timerId: null,
    heldNotes: new Set()
  };
}
let globalMidiLedTimer = null;

// Sustain Pedal State
let isSustainPedalDown = false;
const pedaledNotes = new Set(); // MIDI note numbers kept ringing by pedal

// Preview Voices Tracker (allows immediate clean cutoff on Pause/Stop/Seek)
const activePreviewVoices = new Set();

// Score Scroll Stabilization & Performance Review Telemetry
let lastScoreScrollTarget = null;
let lastScoreScrollTime = 0;
let activeCurriculumLevel = 1;
// WAIT-FOR-ME INTERACTIVE PRACTICE ENGINE & PERFORMANCE SCORING
let practiceStats = {
  correct: 0,
  attempts: 0,
  cleanLoop: true
};
let lastSongPerformance = null;
let sessionStartTime = 0;
let sessionEndTime = 0;
let sessionCurrentStreak = 0;
let sessionBestStreak = 0;
let sessionMistakeMeasures = new Set();
let sessionMistakeNotes = [];
let sessionRhythmCounts = { flawless: 0, shortTap: 0, other: 0 };
let isSongFinished = false;

// Keyboard Visualizer Presets & Cheat Sheet Modal State
// SHIFTABLE & CUSTOMIZABLE PIANO KEYBOARD ENGINE
const KEYBOARD_PRESETS = [
  { id: "88", name: "88 Keys (Full Grand: A0 – C8)", count: 88, startMidi: 21 },
  { id: "76", name: "76 Keys (Stage: E1 – G7)", count: 76, startMidi: 28 },
  { id: "73", name: "73 Keys (Stage: E1 – E7)", count: 73, startMidi: 28 },
  { id: "61", name: "61 Keys (Standard: C2 – C7)", count: 61, startMidi: 36 },
  { id: "49", name: "49 Keys (Studio: C2 – C6)", count: 49, startMidi: 36 },
  { id: "37", name: "37 Keys (Default: C2 – C5)", count: 37, startMidi: 36 },
  { id: "32", name: "32 Keys (Mini Synth: F2 – C5)", count: 32, startMidi: 41 },
  { id: "25", name: "25 Keys (Mini: C3 – C5)", count: 25, startMidi: 48 }
];
let isCheatSheetSvgRendered = false;
let currentCheatSheetSelectedPitch = "C4";
let isCheatSheetScalePlaying = false;

// Tempo Flow & Repertoire Metronome State
let isTempoFlowActive = false;
let tempoFlowTimeouts = [];
let tempoFlowStepStartTime = 0;
let tempoFlowStepFulfilled = false;
let tempoFlowStats = { total: 0, perfect: 0, good: 0, lateOrEarly: 0, missed: 0 };
let isRepertoireMetroActive = false;
let repMetroTimerId = null;
let repMetroNextTickTime = 0;
let repMetroTickIndex = 0;

// Catalog, Layer & Educational Mode State
let filterByKeyboard = false;
let keyboardFilterScope = "active_hands";
let isKbWarningDismissedForSong = false;
try {
  const savedKbFilter = localStorage.getItem("piano_filter_by_keyboard");
  if (savedKbFilter !== null) filterByKeyboard = (savedKbFilter === "true");
  const savedKbScope = localStorage.getItem("piano_keyboard_filter_scope");
  if (savedKbScope) keyboardFilterScope = savedKbScope;
} catch (err) {}
let activeCategory = "C 5-Finger";
let isDarkPaper = false;
let activeEducationalMode = "repertoire";

// Sight-Reading Drill State
let srCurrentCard = null;
let srTimerInterval = null;
let srTimeRemaining = 60;
let srStats = { correct: 0, attempts: 0, streak: 0, bestStreak: 0, solved: 0 };
let srIsRunning = false;
let srCardShownTime = performance.now();

// Ear Training Gym State
let earSubmode = "pitch_match";
let earCurrentChallenge = null;
let earChallengeShownTime = 0;
let earStats = { correct: 0, attempts: 0, streak: 0 };

// Scales, Voice-Leading & Chord Lab State
let currentTonic = "C";
let currentScaleFormula = "major";
let currentScaleHand = "rh";
let currentScaleDirection = "asc";
let currentScaleObj = null;
let currentScalePracticeSeq = [];
let isScalePracticeActive = false;
let scalePracticeStepIdx = 0;
let currentVlKey = "C";
let currentVlProg = "pop_anthem";
let currentVlData = null;
let currentVlStepIdx = 0;
let isVlPracticeActive = false;
let isVoiceLeadingActive = false;
let vlFulfilledPitches = new Set();
let isChordLabActive = false;
let currentChordLabRoot = "C";
let currentChordLabType = "major";
let currentChordLabInversion = 0;
let currentChordLabRecipe = null;
let isChordLabPracticeActive = false;
let chordLabFulfilledPitches = new Set();

// Rhythm & Precision Metronome Workshop State
let metroBpm = 96;
let metroTimeSig = "4/4";
let metroSubdivision = 1;
let metroIsPlaying = false;
let metroTimerId = null;
let metroTickIndex = 0;
let metroNextTickTime = 0;
let metroTapTimes = [];
let lastBeatPerfTime = 0;
let currentMetroSound = "woodblock";
try {
  const savedMetroSound = localStorage.getItem("piano_metro_sound");
  if (savedMetroSound) currentMetroSound = savedMetroSound;
} catch (e) {}
let rhythmTapHistory = [];

// Interactive Beginner Bootcamp State
let currentBootcampModuleIdx = 0;
let isBootcampTaskActive = false;
let bootcampFulfilledIndex = 0;
let bootcampCompletedIds = new Set();
