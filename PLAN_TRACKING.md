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
  - [x] Real-time LED signal pulses & dynamic badges (`LIVE`, `ACTIVE`, `IDLE`) when open
  - [x] Click-to-select channel switching with persistent synced `<select id="midiChannelSelect">`
  - [x] Outside click and Escape key dismissal
  - [x] Automated verification test suite for multi-channel decoding and activity tracking (`tests/test_score_engine.js` Test 12 100% pass)



