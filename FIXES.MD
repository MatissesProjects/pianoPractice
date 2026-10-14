### Part 1: Codebase Cleanup & Bug Fixes

Before adding new capabilities, resolving a few structural bugs and data collisions across `index.html`, `songs.js`, and `theory.js` will immediately make the existing 6 modes work cohesively.

#### 1. Un-nest the Piano Keyboard & Sustain Stage from `#panelRepertoire`

* **The Bug:** Both `.piano-section` and `.sustain-stage` are currently nested inside `<div id="panelRepertoire" class="edu-view-panel active-panel">`. When you switch tabs to **Sight-Reading Drill**, **Ear Training Gym**, or **Scales & Theory Studio**, the entire keyboard and chord recognizer disappear. Worse, `#srInputHint` instructs the user to *"Answer by... pressing piano keys"*, and `updateScaleDisplay()` queries `.piano-key[data-note="..."]` to highlight scale degrees while the keyboard is hidden.


* **The Fix:** Move `.piano-section` and `.sustain-stage` outside `#panelRepertoire` (just above `<!-- Song Catalog Search & Filter -->` which remains inside `#panelRepertoire`) so the interactive keyboard, MIDI visualizer, and chord recognizer persist as a shared bottom dock across all 6 modes.



#### 2. Fix Duplicate Song IDs & Missing Category Filter Pills

* **Duplicate IDs in `songs.js`:** Four song IDs are defined twice with different arrangements: `"fur-elise"` (lines 254 and 398), `"scarborough-fair"` (lines 290 and 446), `"amazing-grace"` (lines 146 and 458), and `"greensleeves"` (lines 302 and 470). Because `loadSong()` and `#songDropdown` look up pieces via `songDatabase.find(s => s.id === e.target.value)`, the second arrangement of each piece—including the Level 8 `"Classical Mastery"` arrangement of *Für Elise*—can never be loaded. Rename the earlier primer IDs to `"fur-elise-motif"`, `"scarborough-fair-primer"`, `"amazing-grace-f"`, and `"greensleeves-primer"`.


* **Missing Filter Pill in `index.html`:** Level 8 sets `filter: "Classical Mastery"` and `songs.js` has `"Classical Mastery"` pieces, but `renderFilterPills()` hardcodes only 4 categories and omits `"Classical Mastery"`. Derive the filter pills dynamically from `songDatabase` instead:



```javascript
// Replace the hardcoded categories array in renderFilterPills() (index.html)
const uniqueCats = [...new Set(songDatabase.map(s => s.category))];
const categories = [
  { key: "all", label: `All (${songDatabase.length})` },
  ...uniqueCats.map(cat => ({
    key: cat,
    label: `${cat} (${songDatabase.filter(s => s.category === cat).length})`
  }))
];

```

#### 3. Deduplicate Music Theory Logic Between `index.html` and `theory.js`

* **The Debt:** `index.html` re-declares `DIATONIC_BASE`, `NOTE_NAMES`, `NOTE_OFFSETS`, `getDiatonicStep()`, `getNoteFreq()`, `midiNumberToPitch()`, and `getPitchMidiNumber()` inline, duplicating functions already exported on `window.MusicTheory` in `theory.js`.


* **Subtle Regex Mismatch:** `theory.js` uses `/^([A-G])([#b]?)([0-8])$/` (requiring an octave digit), whereas `index.html` uses `/^([A-G])([#b]?)([0-8])?$/` (allowing octave-less tokens with a `defaultOct` fallback). Updating `pitchToMidi(pitchStr, defaultOct = 4)` and `getDiatonicStep(pitchStr, defaultOct = 4)` in `theory.js` to accept an optional octave lets you delete ~75 lines of duplicate helpers from `index.html`.



#### 4. Fix Scale Enharmonic Collisions & Hardcoded C-Major Fingerings in `theory.js`

* **Enharmonic Staff Collisions:** `generateScale()` converts MIDI numbers back to pitch names using a simple flat/sharp array (`midiToPitch(noteMidi, useFlat)`). In scales that mix flats and sharps—like **D Harmonic Minor** (`D–E–F–G–A–B♭–C♯–D`) or **G Harmonic Minor** (`G–A–B♭–C–D–E♭–F♯–G`)—using `useFlat = false` outputs `A#4` instead of `Bb4`. Because `getDiatonicStep()` places notes on the staff strictly by their letter (`A` through `G`), `A4` and `A#4` render on the **exact same staff line**, leaving the `B` line empty.


* **Incorrect Black-Key Fingerings:** `SCALE_FORMULAS` assigns `rhFinger: [1, 2, 3, 1, 2, 3, 4, 5]` and `lhFinger: [5, 4, 3, 2, 1, 3, 2, 1]` to every root tonic. While standard for C, G, D, A, and E, this teaches the wrong fingering for **F Major** (where RH must be `1-2-3-4-1-2-3-4` to avoid putting the thumb on `B♭`) and **B♭ / E♭ / A♭ / D♭ / F♯ Major** (where thumbs must land on white keys `C` and `F`).



---

### Part 2: Drop-In Upgrades to Push Learning Further

#### 1. Diatonic Scale Speller & Authentic 12-Key Fingering Engine (`theory.js`)

Replace `generateScale()` in `theory.js` with a degree-aware speller and a key-specific fingering dictionary so that 7-note scales always step cleanly across consecutive staff lines/spaces and display conservatory-standard fingerings:

```javascript
// Add to theory.js inside the factory function
const MAJOR_SCALE_FINGERINGS = {
  "C":  { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] },
  "G":  { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] },
  "D":  { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] },
  "A":  { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] },
  "E":  { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] },
  "B":  { rh: [1,2,3,1,2,3,4,5], lh: [4,3,2,1,4,3,2,1] },
  "F#": { rh: [2,3,4,1,2,3,1,2], lh: [4,3,2,1,3,2,1,4] },
  "Db": { rh: [2,3,1,2,3,4,1,2], lh: [3,2,1,4,3,2,1,3] },
  "Ab": { rh: [3,4,1,2,3,1,2,3], lh: [3,2,1,4,3,2,1,3] },
  "Eb": { rh: [3,1,2,3,4,1,2,3], lh: [3,2,1,4,3,2,1,3] },
  "Bb": { rh: [4,1,2,3,1,2,3,4], lh: [3,2,1,4,3,2,1,3] },
  "F":  { rh: [1,2,3,4,1,2,3,4], lh: [5,4,3,2,1,3,2,1] }
};

const MINOR_SCALE_FINGERINGS = {
  "C":  { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] },
  "G":  { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] },
  "D":  { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] },
  "A":  { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] },
  "E":  { rh: [1,2,3,1,2,3,4,5], lh: [5,4,3,2,1,3,2,1] },
  "B":  { rh: [1,2,3,1,2,3,4,5], lh: [4,3,2,1,4,3,2,1] },
  "F#": { rh: [2,3,1,2,3,1,2,3], lh: [4,3,2,1,3,2,1,4] },
  "Db": { rh: [3,4,1,2,3,1,2,3], lh: [3,2,1,4,3,2,1,3] },
  "Ab": { rh: [3,4,1,2,3,1,2,3], lh: [3,2,1,3,2,1,4,3] },
  "Eb": { rh: [2,1,2,3,4,1,2,3], lh: [2,1,4,3,2,1,3,2] },
  "Bb": { rh: [2,1,2,3,1,2,3,4], lh: [2,1,3,2,1,4,3,2] },
  "F":  { rh: [1,2,3,4,1,2,3,4], lh: [5,4,3,2,1,3,2,1] }
};

function spellPitchOnLetter(targetMidi, targetLetter) {
  const naturalSemi = NOTE_OFFSETS[targetLetter];
  for (let oct = 0; oct <= 8; oct++) {
    const baseMidi = (oct + 1) * 12 + naturalSemi;
    const diff = targetMidi - baseMidi;
    if (Math.abs(diff) <= 2) {
      const acc = diff === 1 ? "#" : diff === -1 ? "b" : diff === 2 ? "##" : diff === -2 ? "bb" : "";
      return `${targetLetter}${acc}${oct}`;
    }
  }
  return midiToPitch(targetMidi, false);
}

function generateScale(rootPitch, scaleType = "major", octave = 4) {
  const rootSemi = NOTE_OFFSETS[rootPitch];
  if (rootSemi === undefined) return null;
  const formula = SCALE_FORMULAS[scaleType] || SCALE_FORMULAS.major;
  const baseMidi = (octave + 1) * 12 + rootSemi;
  const useFlat = rootPitch.includes("b") || ["F", "Bb", "Eb", "Ab", "Db"].includes(rootPitch);

  const isHeptatonic = formula.intervals.length === 8; // 7 degrees + octave
  const rootLetter = rootPitch.charAt(0);
  const rootLetterIdx = DIATONIC_LETTERS.indexOf(rootLetter);

  const isMinorFamily = ["natural_minor", "harmonic_minor", "dorian"].includes(scaleType);
  const keyFingers = isHeptatonic
    ? (isMinorFamily ? MINOR_SCALE_FINGERINGS[rootPitch] : MAJOR_SCALE_FINGERINGS[rootPitch])
    : null;

  const notes = formula.intervals.map((interval, idx) => {
    const noteMidi = baseMidi + interval;
    let pitch;
    if (isHeptatonic && rootLetterIdx !== -1) {
      const targetLetter = DIATONIC_LETTERS[(rootLetterIdx + idx) % 7];
      pitch = spellPitchOnLetter(noteMidi, targetLetter);
    } else {
      pitch = midiToPitch(noteMidi, useFlat);
    }
    return {
      step: idx + 1,
      midi: noteMidi,
      pitch: pitch,
      freq: midiToFreq(noteMidi),
      rhFinger: keyFingers ? keyFingers.rh[idx] : (formula.rhFinger[idx] || 1),
      lhFinger: keyFingers ? keyFingers.lh[idx] : (formula.lhFinger[idx] || 5)
    };
  });

  return {
    root: rootPitch,
    scaleType: scaleType,
    name: `${rootPitch} ${formula.name}`,
    description: formula.description,
    notes: notes
  };
}

```

---

#### 2. Upgrade the Synth from a Raw Sine Wave to a Velocity-Sensitive Electric Piano + Sustain Pedal (`CC 64`)

Right now, `playTone()` and `startLiveTone()` in `index.html` generate a single `sine` oscillator at fixed amplitude (`0.2 * volScale`), ignoring MIDI velocity (`data2`) and sustain pedal messages (`cmd === 11, data1 === 64`).

Adding harmonic overtones, a hammer-attack filter envelope, velocity scaling, and `CC 64` sustain pedal handling makes playing through a MIDI controller feel like a real instrument:

```javascript
// 1. Add sustain pedal state in index.html
let isSustainPedalDown = false;
const pedaledNotes = new Set(); // MIDI note numbers kept ringing by pedal

// 2. Upgrade startLiveTone(noteNumber, velocity = 100) for warm piano timbre
function startLiveTone(noteNumber, velocity = 100) {
  if (!isSynthAudioEnabled()) return;
  if (liveOscillators.has(noteNumber)) {
    stopLiveTone(noteNumber, true); // Re-strike cleanly if pedaled
  }
  const effectiveVol = isMasterMuted ? 0 : currentMasterVolume;
  if (effectiveVol <= 0.0001) return;

  initAudio();
  const now = audioCtx.currentTime;
  const freq = 440 * Math.pow(2, (noteNumber - 69) / 12);
  const velNorm = Math.max(0.15, Math.min(1, velocity / 127));
  const volScale = Math.pow(effectiveVol, 2) * velNorm;

  const voiceGain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  // Brighter filter cutoff on harder key strikes
  filter.frequency.setValueAtTime(freq * (2.5 + velNorm * 6), now);
  filter.frequency.exponentialRampToValueAtTime(freq * 1.8, now + 1.2);

  // Fundamental (triangle) + 2nd harmonic (sine) + 3rd harmonic (gentle tine)
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const g2 = audioCtx.createGain();

  osc1.type = "triangle";
  osc1.frequency.setValueAtTime(freq, now);

  osc2.type = "sine";
  osc2.frequency.setValueAtTime(freq * 2, now);
  g2.gain.setValueAtTime(0.28 * velNorm, now);
  g2.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

  const peak = 0.25 * volScale;
  voiceGain.gain.setValueAtTime(0.0001, now);
  voiceGain.gain.linearRampToValueAtTime(peak, now + 0.008); // Crisp hammer attack
  voiceGain.gain.exponentialRampToValueAtTime(peak * 0.45, now + 0.4); // Natural piano decay
  voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 4.5);

  osc1.connect(filter);
  osc2.connect(g2);
  g2.connect(filter);
  filter.connect(voiceGain);
  voiceGain.connect(masterGainNode || audioCtx.destination);

  osc1.start(now);
  osc2.start(now);

  liveOscillators.set(noteNumber, { osc: osc1, osc2, gain: voiceGain });
}

function stopLiveTone(noteNumber, forceImmediate = false) {
  if (isSustainPedalDown && !forceImmediate) {
    pedaledNotes.add(noteNumber);
    return;
  }
  const voice = liveOscillators.get(noteNumber);
  if (!voice) return;
  const now = audioCtx.currentTime;
  voice.gain.gain.cancelScheduledValues(now);
  voice.gain.gain.setValueAtTime(voice.gain.gain.value || 0.05, now);
  voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
  voice.osc.stop(now + 0.07);
  if (voice.osc2) voice.osc2.stop(now + 0.07);
  liveOscillators.delete(noteNumber);
}

// 3. Inside handleIncomingMIDIMessage(event), add CC 64 handling:
if (cmd === 11 && data1 === 64) {
  isSustainPedalDown = (velocity >= 64);
  if (!isSustainPedalDown) {
    pedaledNotes.forEach(num => {
      if (!activeHeldMidiNotes.has(num)) stopLiveTone(num, true);
    });
    pedaledNotes.clear();
  }
  return;
}

```

---

#### 3. Upgrade Score Rendering: Proportional Beat Spacing, Rests, & Roman Numeral Analysis

In `renderSheetMusicScore()`:

1. **Beat-Proportional Horizontal Spacing:** Currently, notes in a measure are spaced by array index (`const noteStepX = (availableMeasureWidth - 45) / Math.max(1, noteCount);`). If Measure 4 has two half notes (`E4:2 D4:2`) and Measure 3 has four quarter notes (`C4:1 C4:1 D4:1 E4:1`), their horizontal spacing doesn't reflect beat position. By recording `startBeat` on every item in `buildScoreModel()` and computing `cx = measureStartX + 18 + (item.startBeat / totalMeasureBeats) * (availableMeasureWidth - 48)`, quarter, half, and eighth notes align proportionally across both clefs.


2. **Render Rests (`-`):** Currently `renderNoteheadOnly()` returns early if `pitchStr === "-"`. Adding an SVG rest glyph branch when `pitchStr === "-"` (`𝄽` for 1 beat, `𝄻` for 2–4 beats, `𝄾` for 0.5 beats) makes rhythmic rests visible on the staff.


3. **Harmonic Roman Numeral Overlay:** Since you already have `identifyActiveChord()` in `index.html`, you can compute the combined pitches of `item.rh`, `item.lh`, and `item.dyad` on Beat 0 of each measure and render a harmonic analysis badge (e.g., `C (I)`, `F (IV)`, `G7 (V7)`, `Am (vi)`) above the treble staff so you learn **functional harmony** while sight-reading repertoire.



---

#### 4. Add a "Chord Progressions & Voice-Leading Gym" Mode

Right now, **Theory & Circle of 5ths** is mostly static reference text, and **Scales & Theory Studio** only drills linear 1-octave scales. To truly bridge music theory and piano playing, add a **Progression & Voice-Leading Trainer** inside the Scales/Theory studio:

* **How it works:**
1. Select a key (e.g., `C Major`, `G Major`, `A Minor`) and a classic progression:
* **Pop Anthem:** `I – V – vi – IV`
* **Jazz Turnaround:** `ii7 – V7 – Imaj7`
* **Classical Cadence:** `I – IV – I6/4 – V7 – I`
* **Andalusian Cadence:** `i – VII – VI – V`


2. **Voice-Leading Optimizer:** Instead of jumping whole root-position block chords up and down the keyboard, compute the inversion (`0`, `1st`, `2nd`) that minimizes total semitone finger movement from the previous chord:

$$\text{Cost}(C_{\text{prev}}, C_{\text{next}}) = \sum_{i=1}^{k} \left\vert{} \text{midi}(C_{\text{prev}}[i]) - \text{midi}(C_{\text{next}}[i]) \right\vert{}$$


3. **Interactive Check:** Highlight the LH bass root in green and the RH inverted triad in blue/purple on the staff and keyboard, advancing through the cadence as you play each voiced chord via MIDI.



---

#### 5. Add a "Rhythm Flow" Mode (Metronome-Synced Playhead)

Currently, Repertoire Lab has two extremes:

* **Wait-for-Me Mode**: Waits indefinitely for the right pitch, which is great for initial note-finding but allows pausing between notes without building a steady internal pulse.


* **Auto Play Preview**: Plays the song automatically via `setTimeout`, without grading your input.



Adding a third mode—**🥁 Tempo Flow Mode**—provides the missing link:

* Give a 4-beat audible metronome count-in.
* Advance `currentPracticeStep` automatically on the beat schedule (`step.beats * (60 / bpm)`).
* Grade each MIDI key-down against the expected step's timestamp window (`±45ms = Perfect`, `±95ms = Good`, `>95ms = Late/Miss`) and tally a rhythmic accuracy score alongside pitch accuracy.

---

#### 6. Adaptive Spaced-Repetition (SRS) for Sight-Reading & Ear Training

In `theory.js`, `getRandomFlashcard()` and `generateEarTrainingChallenge()` pick items uniformly at random (`Math.floor(Math.random() * pool.length)`).

* **Upgrade:** Track a lightweight `localStorage` mastery profile keyed by pitch/interval:
```javascript
// Structure in localStorage ("piano_srs_stats")
{
  "F2": { attempts: 12, errors: 5, avgResponseMs: 2450 },
  "C4": { attempts: 20, errors: 0, avgResponseMs: 620 }
}

```


* Measure the elapsed time (`performance.now() - cardShownTime`) on each flashcard in `verifySightReadingInput()`.


* Weight `getRandomFlashcard()` so notes with high error rates or slow recognition times (`> 1800ms`) are drawn **3x more frequently** than mastered notes, and color-code the notes on the staff from cool blue (fast/mastered) to amber/red (needs practice).

Would you like to start by refactoring the DOM layout and fixing the `songs.js` / `theory.js` scale-spelling and fingering bugs, or dive straight into building the **Chord Progression & Voice-Leading Trainer**?
