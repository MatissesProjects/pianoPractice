# 🛠️ Piano Practice Lab — Engineering Audit & Upgrade Status (`FIXES.MD`)

> [!IMPORTANT]
> **Status: 100% Complete & Verified (Milestone 35)**
> Every item in Part 1 (Codebase Cleanup & Bug Fixes 1–4) and Part 2 (Drop-In Upgrades 1–6), along with deep codebase deduplication across `index.html`, `theory.js`, `songs.js`, and the automated test suites (`tests/test_education.js` and `tests/test_score_engine.js`), has been implemented and verified with **48/48 passing automated tests**.

---

### Part 1: Codebase Cleanup & Bug Fixes

Before adding new capabilities, resolving a few structural bugs and data collisions across `index.html`, `songs.js`, and `theory.js` will immediately make the existing 6 modes work cohesively.

#### 1. [x] Un-nest the Global MIDI Deck, Piano Keyboard & Sustain Stage from `#panelRepertoire` *(Completed)*

* **The Bug:** Both `.midi-deck`, `.piano-section`, and `.sustain-stage` were nested inside `<div id="panelRepertoire" class="edu-view-panel active-panel">`. When switching tabs to **Sight-Reading Drill**, **Ear Training Gym**, or **Scales & Theory Studio**, the MIDI device bar, keyboard, and chord recognizer disappeared.
* **The Resolution:**
  - `#globalMidiDeck` (`.midi-deck`) is placed directly beneath `<nav class="edu-mode-nav">` above `#panelRepertoire`, so MIDI Input, MIDI Output, Channel Selector, Audio Output, and Synth Audio toggle persist across all 6 modes.
  - `.piano-section` and `.sustain-stage` are un-nested outside `#panelRepertoire` as a persistent bottom dock across all 6 educational modes.

#### 2. [x] Fix Duplicate Song IDs & Missing Category Filter Pills *(Completed)*

* **Duplicate IDs in `songs.js`:** All 56 songs in `songs.js` have unique IDs (`"fur-elise-motif"` vs `"fur-elise"`, `"scarborough-fair-primer"` vs `"scarborough-fair"`, `"amazing-grace-f"` vs `"amazing-grace"`, `"greensleeves-primer"` vs `"greensleeves"`), wrapped in a universal UMD module (`window.songDatabase` + `module.exports`).
* **Dynamic Filter Pills in `index.html`:** `renderFilterPills()` dynamically derives all categories from `songDatabase`, including `"Classical Mastery"`.

#### 3. [x] Deduplicate Music Theory & Score Engine Logic Between `index.html`, `tests/test_score_engine.js`, and `theory.js` *(Completed)*

* **The Debt:** `index.html` and `tests/test_score_engine.js` previously duplicated `DIATONIC_BASE`, `NOTE_NAMES`, `NOTE_OFFSETS`, `getDiatonicStep()`, `getNoteFreq()`, `midiNumberToPitch()`, `getPitchMidiNumber()`, `parseToken()`, `getRomanNumeralAnalysis()`, and `buildScoreModel()`.
* **The Resolution:** Consolidated all music theory and score engine functions into `theory.js` (`window.MusicTheory`) and destructured them directly in `index.html` and `tests/test_score_engine.js`, eliminating ~660 lines of duplicate code.

#### 4. [x] Fix Scale Enharmonic Collisions & Hardcoded C-Major Fingerings in `theory.js` *(Completed)*

* **Enharmonic Staff Collisions & 12-Key Fingerings:** `generateScale()` uses `spellPitchOnLetter()` for degree-aware enharmonic spelling (e.g., `Bb4` and `C#5` in D Harmonic Minor) and conservatory-standard `MAJOR_SCALE_FINGERINGS` and `MINOR_SCALE_FINGERINGS` across all 12 keys.

---

### Part 2: Drop-In Upgrades to Push Learning Further

#### 1. [x] Diatonic Scale Speller & Authentic 12-Key Fingering Engine (`theory.js`) *(Completed)*

Implemented in `theory.js` (`MAJOR_SCALE_FINGERINGS`, `MINOR_SCALE_FINGERINGS`, `spellPitchOnLetter`, `generateScale`) and verified in `tests/test_education.js` (Test 11).

#### 2. [x] Upgrade the Synth from a Raw Sine Wave to a Velocity-Sensitive Electric Piano + Sustain Pedal (`CC 64`) *(Completed)*

Implemented in `index.html`:
- Both `startLiveTone(noteNumber, velocity)` and `playTone(freq, duration, velocity)` synthesize warm Electric Piano timbres using dual oscillators (`triangle` fundamental + `sine` 2nd harmonic overtone) routed through a velocity-sensitive `lowpass` BiquadFilter envelope.
- Full `CC 64` damper pedal handling (`isSustainPedalDown`, `pedaledNotes`) plus an interactive `#sustainPedalBadge` (`🦶 Damper: OFF / ON`) in `.sustain-header`.

#### 3. [x] Upgrade Score Rendering: Proportional Beat Spacing, Rests, & Roman Numeral Analysis *(Completed)*

Implemented in `theory.js` (`buildScoreModel`, `getRomanNumeralAnalysis`) and `index.html` (`renderSheetMusicScore`, SMuFL vector rest glyphs, quadratic bezier tie arcs, and functional Roman numeral badges above Beat 0).

#### 4. [x] Add a "Chord Progressions & Voice-Leading Gym" Mode *(Completed)*

Implemented in `theory.js` (`PROGRESSION_TEMPLATES`, `getNumeralChordInfo`, `optimizeProgressionVoiceLeading`) and `index.html` inside the Scales & Theory Studio, minimizing semitone finger movement across inversions.

#### 5. [x] Add a "Rhythm Flow" Mode (Metronome-Synced Playhead) *(Completed)*

Implemented in `index.html` (`#tempoFlowToggle`, `startTempoFlow`, `runTempoFlowSequence`, `evaluateTempoFlowStrike`) with dynamic time-signature count-in, automatic beat-synced playhead progression, and millisecond timing windows (`±45ms Perfect`, `±95ms Good`, `>95ms Late/Early`).

#### 6. [x] Adaptive Spaced-Repetition (SRS) for Sight-Reading & Ear Training *(Completed)*

Implemented in `theory.js` (`recordSRSAttempt`, `getSRSItemStats`, `getSRSMasteryLevel`, `pickSRSWeightedItem`, `getRandomFlashcard`, `generateEarTrainingChallenge`) and `index.html`:
- Weights both Sight-Reading flashcards and all 3 Ear Training submodes (`pitch_match`, `interval_recognition`, `chord_quality`) by `localStorage` mastery (`3.5x` weight for `needs_practice`).
- Records response latency (`performance.now()`) and displays live SRS mastery pills in both Sight-Reading (`#srSrsPill`) and Ear Training (`#earSrsPill`).
