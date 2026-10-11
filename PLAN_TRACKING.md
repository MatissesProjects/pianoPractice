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

