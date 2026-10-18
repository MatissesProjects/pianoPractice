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
  - [x] "Lean on Me" Note Durations & Chords Corrected (User Request):
    - Restored complete melody notes with accurate half & quarter lengths:
      - RH: Half note C, quarter C, quarter D, quarter E, quarter C+F, half note C+F (`C4:2 C4:1 D4:1 | E4:1 C4+F4:1 C4+F4:2 | C4+F4:2 C4+F4:1 E4:1 | D4:1 C4:1 C4:2 ...`)
      - LH: Matching rhythmic root walk-up/walk-down (`C3:2 C3:1 D3:1 | E3:1 F3:1 F3:2 | F3:2 F3:1 E3:1 | D3:1 C3:1 C3:2 ...`)
      - Dyads: Gospel thirds & fourths (`C4+E4:2 C4+E4:1 D4+F4:1 | E4+G4:1 C4+F4:1 C4+F4:2 ...`)
    - Updated in both `songs.js` and `starterFallbackDatabase` in `index.html`
  - [x] Full Repertoire Duration Audit (All 56 songs in `songDatabase`):
    - Audited every measure across all 56 songs against their time signature beats
    - Fixed 20 songs with rhythm mismatches (`when-the-saints`, `going-home`, `morning-mood`, `smoke-on-the-water`, `hallelujah`, `pink-panther`, `row-row-boat`, `greensleeves`, `fur-elise`, etc.)
    - Verified 0 remaining measure duration discrepancies across the entire database
  - [x] Comprehensive Automated Test Suite (`tests/test_score_engine.js` Test 20: Tests 20.1–20.4 verifying SVG rest vector geometry, measure rest padding, Lean on Me note lengths & chords, and full repertoire duration audit; Test 13: Multi-level harmony alignment)

- [x] **Milestone 20: Full 24-Measure "Lean on Me" Sheet Music Transcription, SVG Tie Arcs, 16th Note Engine, & Practice Holding**
  - [x] **Full 24-Measure Transcription (`image.png`)**: Transcribed Bill Withers' *Lean on Me* (4/4 time, Tempo 80) across all 5 systems and 24 measures:
    - Verse 1 (Measures 1–8): RH half note C4, eighths C-D-E leading into tied syncopated dyad `F4+A4:0.5~`; LH open fifth/octave chords `C3+G3+C4` and `F2+C3+F3` tied across barlines; G7 cadence (`G2+F3+B3`).
    - Chorus (Measures 8–15): High-octave "Lean on me" melody (`E5:0.5 D5:0.5 C5:0.5~`), syncopated ties across barlines, and steady harmonic support.
    - Bridge (Measures 15–24): Staccato quarter chords in LH ("Call on me brother"), syncopated 16th (`0.25`) and dotted eighth (`0.75`) rhythms in RH, chromatic turnaround and final resolution.
    - 1-to-1 matching fingerings across all 24 measures in `songs.js` and `starterFallbackDatabase` in `index.html`.
  - [x] **SVG Tie Arc Rendering Engine**:
    - Added `~` tie syntax support to token parsing (`parseToken`), returning `{ pitch, beats, tied }`.
    - Added `.note-tie-arc` SVG styling (`fill: none; stroke: var(--paper-ink); stroke-width: 1.8; stroke-linecap: round; pointer-events: none;`).
    - Implemented `renderTieArc(svg, n1, n2, scoreWidth, rightMargin, leftMargin)` to render quadratic bezier curves (`M ... Q ...`) curving away from stems, with automatic outgoing/incoming arc splitting across system line breaks.
  - [x] **16th-Note Double Flags & Dotted Notehead Rendering**:
    - Extended `renderNoteheadOnly` with dual SVG flag paths for 16th notes (`beats === 0.25`) and rhythm dots for dotted eighth notes (`beats === 0.75`).
  - [x] **Wait-For-Me Practice Holding Engine**:
    - Cross-step tie detection in `buildScoreModel` marks `tiedFromPrev = true` on successor notes.
    - `highlightActiveScoreNote` checks `activeHeldKeyAttacks` and sustain pedal (`pedaledNotes`) for held tied pitches, pre-fulfilling them to avoid requiring unmusical key restrikes, displaying `🔗 Tied note held!` feedback, and auto-advancing after duration.
  - [x] **Full Repertoire Rhythm Audit**:
    - Verified all 56 songs in `songDatabase` maintain exact beat totals per measure (0 duration discrepancies).
  - [x] **Comprehensive Automated Test Suite**:
    - Updated Test 13 and Test 20 in `tests/test_score_engine.js`.
    - Added Test 21 asserting 24 measures, tie token parsing, cross-step tie detection, 16th/dotted eighth rhythms, and SVG tie arc quadratic bezier path calculations.
    - All 21 tests in `tests/test_score_engine.js` and all 13 tests in `tests/test_education.js` passing with 100% success.

- [x] **Milestone 21: Sheet Music Viewport Auto-Scroll Stabilization & Anti-Bounce Engine**
  - [x] **Eliminated Chromium SVG `scrollIntoView` Bug (Issue 828439)**:
    - Removed all invocations of `targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })` on SVG `<g>` elements in both practice mode (`highlightActiveScoreNote`) and song playback (`playCurrentSong`).
    - Fixed root cause where Blink's `ScrollRectToVisible` on layout-less SVG child elements scrolled the root `<svg>` to `scrollTop = 0` before applying element offsets, which caused the viewport to bounce up to the top before scrolling down to the target note.
    - Prevented outer window viewport scrolling (`window.scrollY`), isolating sheet music scrolling strictly within `#sheetMusicSection`.
  - [x] **Removed CSS `scroll-behavior: smooth`**:
    - Removed `scroll-behavior: smooth` from `.sheet-music-container` in `<style>` to prevent dual-animator conflicts between CSS smooth scrolling and programmatic `.scrollTo()`, enabling instant resets without 500ms lag.
  - [x] **Engineered Non-Bouncing `autoScrollScoreToNote` Function**:
    - Calculates absolute vertical coordinate in the container's scroll canvas: `noteAbsoluteY = container.scrollTop + relativeTop + (targetRect.height / 2)`.
    - Defines a reading comfort zone (`padTop = 60px`, `padBottom = 80px`). If the active note is already comfortably visible, it performs **zero** scroll requests, preventing jank on successive notes within the same system.
    - Positions notes comfortably around 38% down the container viewport (`desiredScrollTop = Math.max(0, noteAbsoluteY - containerH * 0.38)`).
    - Features a mid-scroll animation guard: rapid note strikes (e.g. eighth/16th notes within 400ms) targeting the same system do not cancel or stutter in-flight animations.
  - [x] **Clean Instant Resets**:
    - `loadSong()`, `#hudRestartBtn`, and song completion loop cleanly reset `scoreContainer.scrollTop = 0` and clear scroll target debounce trackers.
  - [x] **Comprehensive Automated Test Suite**:
    - Added Test 22 to `tests/test_score_engine.js` asserting removal of SVG `scrollIntoView`, removal of CSS `scroll-behavior: smooth`, comfort zone no-op checks, positive forward scroll target calculations, animation guard debouncing, and instant reset wiring.
    - All 22 tests in `tests/test_score_engine.js` and all 13 tests in `tests/test_education.js` passing with 100% success.

- [x] **Milestone 22: Authentic Sheet Music Rest Rendering in When the Saints Go Marching In and Repertoire**
  - [x] **Diagnosed Missing Rest Rendering**:
    - Identified that `renderSheetMusicScore()` in `index.html` executed `const pitches = item.rh.pitch.split("+").filter(p => p !== "-");` (and for dyads and LH), which completely stripped out rest tokens (`"-"`) into empty arrays `[]`.
    - As a result, `renderNoteheadOnly` was never invoked for rests, leaving staves completely blank where quarter rests, eighth rests, and whole rests should have been displayed.
  - [x] **Implemented Explicit Rest Dispatching**:
    - Added explicit `if (item.dyad.pitch === "-")`, `if (item.rh.pitch === "-")`, and `if (item.lh.pitch === "-")` checks in `renderSheetMusicScore()` that directly invoke `renderNoteheadOnly(noteGroup, "-", beats, cx, bottomStaffY, refDiatonicStep)`.
    - Restores authentic SVG vector glyphs (`.rest-glyph` and `.rest-rect`) for quarter rests (e.g. M1, M3, M5, M9, M11 in *When the Saints Go Marching In*), eighth rests (e.g. M9 in *Lean on Me*), and whole-measure rests across the 14 repertoire songs with explicit rests.
  - [x] **Cheat Badge & Tie Cleanliness**:
    - Preserved cheat badge skipping and tie arc filtering so letter labels, finger numbers, and tie curves are never erroneously attached to rests.
  - [x] **Comprehensive Automated Test Suite**:
    - Added Test 23 to `tests/test_score_engine.js` asserting explicit rest tokens, grand staff rest-note coexistence in *When the Saints Go Marching In*, source code rest dispatch verification across Treble, Bass, and Dyads, and Lean on Me eighth rest rendering.
    - All 23 tests in `tests/test_score_engine.js` and all 13 tests in `tests/test_education.js` passing with 100% success.

- [x] **Milestone 23: Authentic Classical Rest Glyphs, Collision-Free Spacing & Rest Timing Engine**
  - [x] **Classical SMuFL Quarter Rest Vector Outline**:
    - Eliminated the awkward looping tadpole bulb at the base of the quarter rest path in `renderNoteheadOnly()`.
    - Replaced with classical engraved SMuFL `restQuarter` vector path featuring a space-4 top hook, solid diagonal slanting body across line 3, space-2 left belly, and open upward-curving tapered crescent tail in space 1.
  - [x] **Collision-Free Clef, Time Signature & Barline Clearance**:
    - Increased `leftMargin` to 74px and shifted `tClef` to `leftMargin - 42` (x=32) and `bClef` to `leftMargin - 40` (x=34).
    - Centered `timeSig` at `leftMargin + 8` (x=82), guaranteeing a 1px gap from the clef's rightmost edge (x=65).
    - Positioned `measureStartX` for measure 1 at `leftMargin + 28` (x=102) with first note onset at `cx = 120`, providing 15px of clear air past the time signature's right boundary (x=98) and completely eliminating glyph overlap.
  - [x] **Active-Target & Error-Target Rest CSS Styling**:
    - Added `.note-group.active-target .rest-glyph, .note-group.active-target .rest-rect` in `<style>` with `#f59e0b` fill and amber drop shadow so active rests illuminate clearly.
    - Added matching `.note-group.error-target` red highlight rules for rests.
    - Enhanced `updateTargetBadgeDisplay()` to display amber-themed `𝄽 REST (${beatVal}b)`.
  - [x] **Precision Rest Timing Engine in Wait-for-Me Practice Mode**:
    - Added `isPracticeSessionStarted` state variable to guard Step 0 pickup rests: on initial song load or restart, the rest stays illuminated in amber without prematurely auto-advancing, displaying `𝄽 Count in: play [first note] to begin!`.
    - Implemented seamless rest pass-through in `checkAndPlayNoteOn()`: striking the first playable note during a rest fulfills the rest transition cleanly without buzzing an error.
    - Implemented mid-song note-to-rest rhythmic duration holding: when fulfilling a note followed by a rest (e.g. `G4:4` in M2 of *When the Saints Go Marching In*), the prior note stays fulfilled for its full musical beats (`note.beats * (60000 / tempo)`) before advancing to the rest, and the rest then holds for its full duration before advancing to the next note.
  - [x] **Comprehensive Automated Test Suite**:
    - Added Test 24 to `tests/test_score_engine.js` asserting classical quarter rest SMuFL geometry, clef/time-signature/measure-1 boundary clearance, active rest CSS styling, pickup rest count-in guard, and note-to-rest duration holding calculations.
    - All 24 tests in `tests/test_score_engine.js` and all 13 tests in `tests/test_education.js` passing with 100% success.

- [x] **Milestone 24: Keyboard Size Song Allowance & Range Filtering Engine**
  - [x] **Core Musical Range Engine in `theory.js` (`getSongPitchRange`, `evaluateSongKeyboardCompatibility`)**:
    - Algorithmic MIDI pitch extraction across voices (`rh`, `lh`, `dyads`), disregarding rests and ties.
    - Computes `minMidi`, `maxMidi`, `minPitch`, `maxPitch`, total pitch span, and hand-specific ranges (`rh`, `lh`, `dyads`).
    - Evaluates exact range fit (`fitsExact`), span fit (`fitsSpan`), semitone shift delta (`shiftNeeded`), out-of-bounds notes below/above, and minimum standard preset recommendations.
    - Exports `STANDARD_KEYBOARD_PRESETS` (88, 76, 73, 61, 49, 37, 32, 25 keys).
  - [x] **Catalog Repertoire Allowance / Disallowance & Visual Range Badges**:
    - Compact range pill on every catalog card: `Range: C4–G4 (8k)`.
    - Real-time compatibility tags: `✓ Fits 37k` (emerald), `↔ Shift (+5)` (sky), and `🚫 Needs 49k` (rose).
    - When filtered or out of range, cards receive `.disallowed-song` styling with dashed borders, opacity reduction, and a 1-click `⚡ Auto-Fit (49k) & Load` action.
    - Added dedicated `🎹 Fits My Keyboard (${count})` quick filter pill in `#filterPillsContainer`.
    - Added toolbar in `.catalog-header` with `🎹 Filter to Keyboard` toggle, Scope selector (`Active Hands Only` vs `Full Arrangement`), and live playable count badge (`${playableCount} / 56 Playable`).
  - [x] **Song Dropdown (`#songDropdown`) Synchronization & Gating**:
    - When "Filter to Keyboard" is active, song dropdown excludes out-of-range pieces or displays only playable repertoire.
    - When unfiltered, out-of-range options are tagged with `[⚠️ Needs 49k]`.
  - [x] **Interactive Out-of-Range Warning & 1-Click Auto-Fit Keyboard Assist**:
    - Non-intrusive banner (`#keyboardRangeWarningBanner`) above `#sheetMusicSection` when an out-of-range song is loaded or when keyboard shrinks.
    - Features `⚡ Auto-Fit Keyboard` (auto-expands to recommended preset), `↔ Shift to Fit` (adjusts start note), and `✕ Dismiss`.
  - [x] **Reactive State Updates & LocalStorage Persistence**:
    - Synchronized toggles across dock (`#kbDockFilterCheckbox`) and catalog (`#catalogKbFilterToggle`).
    - Re-evaluates filter pills, cards, dropdown, and warning banner whenever keyboard preset, key count, start note, or hand toggles (RH/LH/Dyads) change (`onKeyboardLayoutChanged`).
    - Persists preferences `piano_filter_by_keyboard` and `piano_keyboard_filter_scope` in `localStorage`.
  - [x] **Comprehensive Automated Verification Test Suite (`tests/test_score_engine.js` Test 25)**:
    - Tests 25.1–25.6 verifying module exports, pitch range calculations, preset evaluations across 25/37/49/88 keys, DOM elements, CSS rules, auto-fit logic, and data attributes.
    - All 25 score engine tests and all 13 education tests passing with 100% success.

- [x] **Milestone 25: Interactive Piano Notes Cheat Sheet, Keyboard Colorization & Live Sustain Integration**
  - [x] **Music Theory Cheat Sheet Engine (`theory.js`)**:
    - [x] Diatonic note colors: C (`#ef4444` red), D (`#8b5cf6` purple), E (`#1e40af` navy), F (`#0284c7` blue), G (`#14b8a6` teal), A (`#f97316` orange), B (`#10b981` green)
    - [x] Data lookup: `getCheatSheetNoteColor`, `getCheatSheetStaffInfo`, `CHEAT_SHEET_NOTE_COLORS`, `CHEAT_SHEET_STAFF_MAP`, `CHEAT_SHEET_NOTES_RANGE`
    - [x] Staff geometry mapping: Bass clef, Treble clef, Middle C bridging, staff lines and spaces (G2 to G5 range)
  - [x] **Piano Keyboard Dock Visual Colorization (`index.html`)**:
    - [x] Note letter cheat badges on white keys in matching colors with octave indicator
    - [x] Prominent red "MIDDLE C" badge matching cheat sheet diagram
    - [x] Interactive toggle `#toggleCheatSheetColors` in keyboard controls toolbar with LocalStorage persistence
    - [x] Staff position & clef tooltips on key hover and touch
  - [x] **Live Sustain & Chord Recognizer Integration (`index.html`)**:
    - [x] Sustain lane badges tinted in note's authentic cheat sheet color
    - [x] Staff position badge added to sustain lanes (`Treble Line 2`, `Bass Space 2`, `⭐ Middle C`)
    - [x] Sustain ribbon rail fill and glowing spark head styled with note's cheat sheet color gradient
    - [x] Enable sustain lane generation from on-screen keyboard mouse clicks and touch taps
    - [x] Chord pill constituent note color indicators
  - [x] **Interactive Piano Notes Cheat Sheet Visualizer (`index.html`)**:
    - [x] Dedicated modal `#cheatSheetModal` with interactive SVG `#cheatSheetSvg` faithfully reproducing `pianoNotesCheatSheet.png`
    - [x] 22-key keyboard on top (G2 to G5), Grand Staff on bottom (Treble & Bass clefs)
    - [x] Color-coded vertical dotted guidelines connecting each piano key to its staff notehead
    - [x] Red central guideline bridging Middle C between staves
    - [x] Interactive click-to-play: clicking key or notehead plays tone, highlights guideline, updates sustain, and displays mnemonic guide
    - [x] Dock launch button `🎼 Piano Notes Cheat Sheet` and Theory Lessons link
  - [x] **Comprehensive Automated Verification Test Suite (`tests/test_score_engine.js` Test 26)**:
    - [x] Tests 26.1–26.5 verifying theory exports, color definitions, staff positions, DOM elements, sustain lane styling, mouse click sustain creation, and guidelines calculations
    - [x] All 26 score engine tests and all 13 education tests passing with 100% success.


