# Piano Practice Lab — Educational Enhancement Tracking

## Project Progress Tracking

- [x] **Milestone 1: Music Theory & Educational Core Engine (`theory.js`)**
  - [x] Scale generator (Major, Minor, Pentatonic, Blues) across all 12 keys
  - [x] Interval calculation & pitch comparison utilities
  - [x] Chord recognition & inversion formulas
  - [x] Sight-reading drill flashcard generator
  - [x] Node.js automated test harness (`tests/test_education.js`)

- [x] **Milestone 2: New Practice & Educational Modes UI**
  - [x] Top Mode Navigation Deck (Songs, Sight-Reading, Ear Training, Scales & Theory, Rhythm Studio, Theory Lessons)
  - [x] Sight-Reading Speed Drill Mode (Flashcards on SVG staff, timer, accuracy score, streak counter)
  - [x] Ear Training & Interval Master Mode (Pitch matching, interval recognition, major/minor triads)
  - [x] Scales, Chords & Theory Studio (Scale explorer, fingering highlights, staff rendering, interactive practice)
  - [x] Rhythm & Metronome Workshop (Interactive visual metronome, tap tempo, rhythm tapping accuracy drill)
  - [x] Theory Lessons & Interactive Circle of Fifths Reference Drawer

- [x] **Milestone 3: Song Practice Enhancements**
  - [x] A-B Measure Looping & Section Practice with Tempo Ramp (+5 BPM)
  - [x] Performance evaluation & star ratings (⭐ / ⭐⭐ / ⭐⭐⭐) with LocalStorage stats

- [x] **Milestone 4: Pedagogical Song Repertoire Expansion in `songs.js`**
  - [x] Für Elise, Bach Minuet in G, Pachelbel Canon in D, Gymnopédie No. 1
  - [x] Hanon Exercise No. 1, Scarborough Fair, Amazing Grace, Greensleeves

- [x] **Milestone 5: Verification, Testing & Git Commit Chunking**
  - [x] Automated test suite verification (`tests/test_education.js` 100% pass)
  - [x] Clean git commit chunking recommendations for user approval

- [x] **Milestone 6: Bass Clef & Left-Hand Multi-Measure Rendering Alignment Fix**
  - [x] Measure-aware score timeline engine: parse RH and LH measures independently and align note onsets accurately
  - [x] Multi-system geometry fix: correct `bassTopY` calculation for LH solo mode (`systemTopY + 12`) to prevent row stacking at Y=0
  - [x] Proper Grand Staff note alignment: synchronize beat-matched RH/LH notes at identical X coordinates without measure bleeding
  - [x] Left-hand chords/dyads support (e.g., Gymnopédie No. 1): split multiple pitches, render distinct noteheads, and stack cheat labels
  - [x] Full ledger line coverage: draw ledger lines below bass staff (E2, C2) and above treble staff (A5, C6)
  - [x] Synchronized Practice Engine & Preview Playback: ensure Wait-For-Me mode and audio player step through actual musical onsets
  - [x] Automated verification test suite for score model alignment across all repertoire (`tests/test_score_engine.js` 100% pass)

- [x] **Milestone 7: Note Attack/Release Lifecycle & Consecutive-Note Polyphonic Disambiguation**
  - [x] Multi-note onset fulfillment engine (`stepFulfilledPitches`): require all concurrent notes in 2-hand mode to be satisfied before advancing
  - [x] Attack-consumption gate: ensure single strikes are consumed once and cannot bleed into consecutive identical notes (e.g. C4 followed by C4)
  - [x] Note-Down & Note-Up lifecycle tracking: record key down/up timestamps across MIDI and on-screen keyboard
  - [x] Hold duration measurement & rhythm feedback: compute real-time held beats vs target beats and display accuracy
  - [x] Visual partial chord progress: display checkmarked notes on the HUD target badge as hands land
  - [x] Automated verification test suite for consecutive notes, 2-hand landing, and duration calculation (`tests/test_score_engine.js` Tests 6–8 100% pass)

- [x] **Milestone 8: Universal Master Volume Control for All Site Audio Output**
  - [x] Web Audio master pipeline architecture: insert `masterGainNode` directly upstream of `audioCtx.destination`
  - [x] Comprehensive audio node routing: connect `playTone` (notes/chords/preview/drills), `startLiveTone` (MIDI synth), and `scheduleMetroClick` (metronome) into `masterGainNode`
  - [x] Global header master volume deck: slider (0%–100%), mute/unmute quick toggle, dynamic speaker icon (🔇/🔉/🔊), and percentage badge
  - [x] Repertoire transport bar volume control: synchronized slider alongside tempo/loop controls
  - [x] Reactive state synchronization & LocalStorage persistence (`piano_master_volume`)
  - [x] Perceptual logarithmic/quadratic audio taper curve (`Math.pow(vol, 2)`) with real-time active oscillator updates
  - [x] Synthesizer audio gating (`isSynthAudioEnabled`): prevent duplicate audit beeps on MIDI input and mute all synth audio when "Synth Audio" is unchecked
  - [x] Automated verification test suite for volume gain scaling, mute toggle, and clamping (`tests/test_score_engine.js` Test 9 100% pass)

- [x] **Milestone 9: Auto Play Preview Polyphonic Independent Voice Sustaining**
  - [x] Independent voice audio duration: compute sound durations using each voice's actual note duration (`step.rh.beats`, `step.lh.beats`, `step.dyad.beats`) instead of step onset delta
  - [x] Independent key lifecycle & illumination: isolate `.active-rh`, `.active-lh`, and `.active-dyad` so voice transitions (e.g. RH quarter notes) never clear sustained notes in the other hand (e.g. LH whole notes)
  - [x] Enharmonic keyboard element lookup: resolve flat/sharp canonical pitch names (`findPianoKeyElement`)
  - [x] Dynamic multi-voice chord pill tracking: maintain `activeVoiceNotes` map and update `setChordPillDisplay` on every onset and note-off
  - [x] Measure boundary & piece end synchronization: calculate `stepBeats` using measure boundaries and schedule `stopPlayback` after `maxPieceDurationMs`
  - [x] Automated verification test suite for polyphonic independent voice sustaining (`tests/test_score_engine.js` Test 10 100% pass)

- [x] **Milestone 10: Customizable Visualizer Key Count & Starting Offset Engine**
  - [x] Generalized mathematical keyboard generation algorithm (`buildPianoKeyboard(startMidi, keyCount)`)
  - [x] Seamless chromatic white & black key DOM layout with Middle C marker
  - [x] Keyboard size selector with popular hardware presets (88, 76, 73, 61, 49, 37, 32, 25 keys) + custom count input
  - [x] Far-left starting note/offset selector with semitone and octave shift controls
  - [x] Middle C centering button & auto-scroll viewport centering
  - [x] Settings persistence in LocalStorage (`piano_key_count`, `piano_start_midi`)
  - [x] Automated verification test suite for custom layouts and presets (`tests/test_score_engine.js` Test 11 100% pass)

- [x] **Milestone 11: Real-Time MIDI Channel Activity Monitor & Interactive Channel Selector**
  - [x] Real-time per-channel incoming telemetry across all 16 MIDI channels ($1..16$)
  - [x] Pre-filter telemetry recording: inspect channel before filter gating so unselected active channels are identified
  - [x] Interactive custom channel dropdown with 16-channel live signal grid & Omni banner
  - [x] Polyphonic note lifecycle & clean return to `IDLE`: track held notes per channel, extinguishes LED and resets badge to `IDLE` 200ms after all notes are released (no lingering `ACTIVE` badge)
  - [x] Device change & rescan reset: automatically reset all 16 channels, Omni, and global indicators to `IDLE` on device selection change, MIDI device list updates, or manual rescan
  - [x] One-click MIDI device rescan button (`🔄` `#refreshMidiDevicesBtn`) to refresh port list and reset channel activity
  - [x] Click-to-select channel switching with persistent synced `<select id="midiChannelSelect">`
  - [x] Outside click and Escape key dismissal
  - [x] Automated verification test suite for channel decoding, clean IDLE transition, and device reset (`tests/test_score_engine.js` Test 12 100% pass)

- [x] **Milestone 12: Dual-Hand Harmony Practice & Multi-Level Harmony Engine**
  - [x] Multi-level harmony generator (`theory.js`): Algorithmic generation for diatonic 3rds (above & below), 5ths, 6ths, octaves, and full triads with key-signature accidental awareness and fingerings
  - [x] Simultaneous Left-Hand + Harmony Grand Staff alignment (`buildScoreModel`): Synchronize harmony treble events (`mDyad`) and bass clef events (`mLH`) on beat timeline without suppressing left hand
  - [x] Dual-hand harmony sheet music score rendering (`renderSheetMusicScore`): Grand staff geometry, staves, bass clef, cheat sheet, and fingerings when both Harmonies and Left Hand are active
  - [x] Dual-voice independent playback engine (`startPlayback`): Independent voice triggering, sustaining, and polyphonic chord pill updates for simultaneous dyad/triad treble and left-hand bass
  - [x] Real-time practice mode note fulfillment (`handleNoteDown` & HUD): Support partial chord progression and simultaneous 2-hand fulfillment with multi-note harmonies and bass anchors
  - [x] Interactive UI Harmony Level / Interval selector: Dropdown control in Hand & Score Toggles bar (Song Arrangement, Thirds Above, Thirds Below, Fifths, Sixths, Octaves, Triads) with LocalStorage persistence
  - [x] Pedagogical lesson pathway & level update: Harmonize Level 3, Level 7, and Level 8 curriculum configs with interactive harmony selector
  - [x] Comprehensive automated test suite (`tests/test_score_engine.js` Test 13): Verify dual-hand harmony alignment, all harmony interval levels, grand staff rendering, and playback across repertoire

- [x] **Milestone 13: Core Structural Cleanup & Essential Bug Fixes (`FIXES.MD` Part 1)**
  - [x] Un-nest `.piano-section` & `.sustain-stage` from `#panelRepertoire` as shared persistent dock across all 6 modes
  - [x] Rename duplicate song IDs in `songs.js` (`fur-elise-motif`, `scarborough-fair-primer`, `amazing-grace-f`, `greensleeves-primer`)
  - [x] Make `renderFilterPills()` dynamic from `songDatabase` (exposing "Classical Mastery" and all categories)
  - [x] Deduplicate music theory functions in `index.html` by bridging to `theory.js` with optional-octave regex
  - [x] Fix scale enharmonic collisions via diatonic letter speller (`spellPitchOnLetter`)
  - [x] Add authentic 12-key standard conservatory fingerings (`MAJOR_SCALE_FINGERINGS` & `MINOR_SCALE_FINGERINGS`)

- [x] **Milestone 14: Instrument Synthesis & Expressive MIDI Input (`FIXES.MD` Part 2.1 & 2.2)**
  - [x] Upgrade synthesizer to velocity-sensitive dual-oscillator electric piano timbre with hammer-attack filter envelope
  - [x] Implement MIDI CC 64 Sustain Pedal support with smooth voice decay on pedal release

- [x] **Milestone 15: Score Rendering Enhancements & Harmonic Analysis (`FIXES.MD` Part 2.3)**
  - [x] Beat-proportional horizontal spacing across all measures in `renderSheetMusicScore`
  - [x] Rhythmic rest glyph rendering (`𝄽`, `𝄻`, `𝄾`) on staves
  - [x] Harmonic Roman Numeral analysis badge on Beat 0 of each measure

- [x] **Milestone 16: Voice-Leading Gym, Rhythm Flow Mode, & Adaptive SRS (`FIXES.MD` Part 2.4, 2.5, 2.6)**
  - [x] Chord Progressions & Voice-Leading Gym in Scales/Theory Studio with smooth inversion solver and interactive check
  - [x] 🥁 Tempo Flow Mode: Metronome-synced auto playhead in Repertoire Lab with timing window grading (±45ms / ±95ms)
  - [x] Adaptive Spaced-Repetition System (SRS) for Sight-Reading & Ear Training with latency/error weighting and mastery indicators

- [x] **Milestone 17: Real-Time Polyphonic Chord Recognizer & Inversion Engine (`#activeChordPill`)**
  - [x] Root Cause Resolution: Removed clobbering line in `playSingleNoteAudit` that overwrote `setChordPillDisplay([{ num, pitch }])` with 1 single note on every key strike
  - [x] Unified Sounding Note Aggregator (`updateActiveChordRecognizer`): Seamlessly aggregates active held MIDI notes, CC 64 sustained pedaled notes, and on-screen mouse/touch keys
  - [x] Comprehensive Chord & Inversion Theory Engine (`theory.js`):
    - [x] Octaves & unisons across registers (e.g. C3 + C4 -> `C Octave`)
    - [x] Power chords & inverted 5ths (e.g. C3 + G3 -> `C5`, G3 + C4 -> `C5 / G`)
    - [x] Triads & Inversion Naming: Root position, 1st Inversion (`C Major / E`), 2nd Inversion (`C Major / G`)
    - [x] 7th Chords & 3rd Inversions (`G7 / F`), maj7, m7, dim7, half-diminished (m7♭5)
    - [x] Piano/Jazz shell voicings without 5th (`C7 (no 5th)`, `Cmaj7 (no 5th)`, `Cm7 (no 5th)`)
    - [x] Extended 9th chords (`C9`, `Cmaj9`, `Cm9`)
  - [x] Lifecycle Event Integration: Note-on, note-off, CC 64 sustain pedal toggle, and score click preview
  - [x] Comprehensive automated test suite (`tests/test_score_engine.js` Test 18: Tests 18.1–18.10 verifying all chord types, inversions, and non-clobbering lifecycles)

- [x] **Milestone 18: Practice HUD Layout Stability & Target Note Badge High-Contrast Styling**
  - [x] Fixed UI Bouncing: Restricted `.practice-hud` to fixed height (`52px`), `flex-wrap: nowrap`, and `overflow: hidden`, isolating `.hud-feedback` into a middle flex column with `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`
  - [x] Dynamic Tooltip Synchronization: Added `MutationObserver` on `#hudFeedbackText` so long truncated messages reveal full details on hover
  - [x] High-Contrast Target Note Badge: Replaced clashing orange-on-orange text with dark slate background (`#0f172a`), 2px glowing orange border (`#f59e0b`), bright amber text (`#f59e0b`), and emerald green checkmarks (`#34d399`) for satisfied notes
  - [x] Rest & Accidental Support: Display `𝄽 REST` on empty pitch steps instead of blank rectangles, with authentic musical sharp glyphs (`♯`)
  - [x] Score Notehead Contrast: Fixed paper cheat text contrast in light mode (`#b45309`) and dark mode (`#fbbf24`)
  - [x] Comprehensive automated test suite (`tests/test_score_engine.js` Test 19: Tests 19.1–19.4 verifying high contrast, checkmarks, accidentals, and rests)


- [x] **Milestone 19: Sheet Music Vector Rests, Lean on Me Durations, & Repertoire Rhythm Audit**
  - [x] Authentic SVG Vector Rest Rendering: Replaced unrendered Unicode SMP musical glyphs with sharp, scalable SVG elements:
    - Whole Rest: `<rect>` hanging down from Line 4 (`y = bottomStaffY - 30`, width 14, height 5)
    - Half Rest: `<rect>` sitting on Line 3 (`y = bottomStaffY - 25`, width 14, height 5) + optional dot circle for dotted half
    - Quarter Rest: Classic SVG vector path `<path d="..." />` spanning Lines 4 to 1 + optional dot circle for dotted quarter
    - Eighth Rest: Classic SVG vector path `<path d="..." />` with hook + optional dot circle for dotted eighth
    - Theme styling: `.rest-rect` and `.rest-glyph` use `fill: var(--paper-ink, #1e293b); stroke: none;`
  - [x] Automatic Measure Rest Padding in `buildScoreModel`:
    - Incomplete measures in a voice are automatically padded to measure length with rests
    - Silent hands in a measure automatically synthesize a full-measure rest so staves are never left empty
  - [x] Rest Support in Practice Mode & HUD:
    - Clear `REST` badge without broken Unicode boxes
    - Auto-advance rest steps in wait practice mode after rest duration elapses
  - [x] "Lean on Me" Note Durations Corrected:
    - RH: Opening C is a 2-beat hollow note (`C4:2`), first F in measure 2 is a 2-beat hollow note (`F4:2`)
    - LH: Opening C is a 4-beat whole note (`C3:4`), first F in measure 2 is a 4-beat whole note (`F3:4`)
    - Dyads: Opening gospel thirds are 2-beat hollow notes (`C4+E4:2` and `F4+A4:2`)
    - Updated in both `songs.js` and `starterFallbackDatabase` in `index.html`
  - [x] Full Repertoire Duration Audit (All 56 songs in `songDatabase`):
    - Audited every measure across all 56 songs against their time signature beats
    - Fixed 20 songs with rhythm mismatches (`when-the-saints`, `going-home`, `morning-mood`, `smoke-on-the-water`, `hallelujah`, `pink-panther`, `row-row-boat`, `greensleeves`, `fur-elise`, etc.)
    - Verified 0 remaining measure duration discrepancies across the entire database
  - [x] Comprehensive Automated Test Suite (`tests/test_score_engine.js` Test 20: Tests 20.1–20.4 verifying SVG rest vector geometry, measure rest padding, Lean on Me note lengths, and full repertoire duration audit)
