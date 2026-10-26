/**
 * theory.js - Educational Music Theory, Scales, Intervals, and Drill Engine
 * Compatible with both browser environments (window.MusicTheory) and Node.js.
 */

(function (root, factory) {
  const exp = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = exp;
  }
  if (root) {
    root.MusicTheory = exp;
  }
})(typeof self !== "undefined" ? self : (typeof global !== "undefined" ? global : this), function () {

  const NOTE_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const NOTE_NAMES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

  const NOTE_OFFSETS = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11
  };

  const INTERVAL_NAMES = {
    0: "Unison",
    1: "Minor 2nd (Half Step)",
    2: "Major 2nd (Whole Step)",
    3: "Minor 3rd",
    4: "Major 3rd",
    5: "Perfect 4th",
    6: "Tritone (Dim 5th / Aug 4th)",
    7: "Perfect 5th",
    8: "Minor 6th",
    9: "Major 6th",
    10: "Minor 7th",
    11: "Major 7th",
    12: "Octave"
  };

  const INTERVAL_PEDAGOGY = {
    0: { semitones: 0, name: "Unison", shortName: "P1", consonance: "Perfect Consonance", feeling: "Identical pitch anchor", songAsc: "Same Note Repeated (One Note Samba)", songDesc: "Same Note Repeated", mnemonicAsc: "Same Note Repeated (One Note Samba)", mnemonicDesc: "Same Note Repeated", example: ["C4", "C4"] },
    1: { semitones: 1, name: "Minor 2nd (Half Step)", shortName: "m2", consonance: "Sharp Dissonance", feeling: "Tense, suspenseful, adjacent keys", songAsc: "Jaws Theme / Pink Panther", songDesc: "Für Elise (Opening E–D♯)", mnemonicAsc: "Jaws Theme / Pink Panther", mnemonicDesc: "Für Elise (Opening E–D♯)", example: ["E4", "F4"] },
    2: { semitones: 2, name: "Major 2nd (Whole Step)", shortName: "M2", consonance: "Mild Dissonance", feeling: "Stepping forward along a scale", songAsc: "Happy Birthday / Silent Night", songDesc: "Mary Had a Little Lamb (E–D)", mnemonicAsc: "Happy Birthday / Silent Night", mnemonicDesc: "Mary Had a Little Lamb (E–D)", example: ["C4", "D4"] },
    3: { semitones: 3, name: "Minor 3rd", shortName: "m3", consonance: "Imperfect Consonance", feeling: "Melancholic, soulful, minor triad core", songAsc: "Greensleeves / Brahms Lullaby", songDesc: "Hey Jude (Opening)", mnemonicAsc: "Greensleeves / Brahms Lullaby", mnemonicDesc: "Hey Jude (Opening)", example: ["A4", "C5"] },
    4: { semitones: 4, name: "Major 3rd", shortName: "M3", consonance: "Imperfect Consonance", feeling: "Bright, warm, joyful major triad core", songAsc: "When the Saints Go Marching In / Oh When the Saints", songDesc: "Swing Low, Sweet Chariot / Beethoven 5th", mnemonicAsc: "When the Saints Go Marching In / Oh When the Saints", mnemonicDesc: "Swing Low, Sweet Chariot / Beethoven 5th", example: ["C4", "E4"] },
    5: { semitones: 5, name: "Perfect 4th", shortName: "P4", consonance: "Perfect Consonance", feeling: "Heraldic, open, suspended anticipation", songAsc: "Here Comes the Bride / Amazing Grace", songDesc: "O Come, All Ye Faithful", mnemonicAsc: "Here Comes the Bride / Amazing Grace", mnemonicDesc: "O Come, All Ye Faithful", example: ["C4", "F4"] },
    6: { semitones: 6, name: "Tritone (Dim 5th / Aug 4th)", shortName: "TT", consonance: "Restless Dissonance", feeling: "Unstable, dramatic, splits octave in half", songAsc: "The Simpsons / Maria (West Side Story)", songDesc: "YYZ (Rush)", mnemonicAsc: "The Simpsons / Maria (West Side Story)", mnemonicDesc: "YYZ (Rush)", example: ["C4", "F#4"] },
    7: { semitones: 7, name: "Perfect 5th", shortName: "P5", consonance: "Perfect Consonance", feeling: "Powerful, heroic, rock-solid harmonic pillar", songAsc: "Twinkle, Twinkle, Little Star / Star Wars Theme", songDesc: "Flintstones Theme", mnemonicAsc: "Twinkle, Twinkle, Little Star / Star Wars Theme", mnemonicDesc: "Flintstones Theme", example: ["C4", "G4"] },
    8: { semitones: 8, name: "Minor 6th", shortName: "m6", consonance: "Imperfect Consonance", feeling: "Bittersweet, romantic, yearning leap", songAsc: "The Entertainer (Main Leap)", songDesc: "Love Story Theme", mnemonicAsc: "The Entertainer (Main Leap)", mnemonicDesc: "Love Story Theme", example: ["E4", "C5"] },
    9: { semitones: 9, name: "Major 6th", shortName: "M6", consonance: "Imperfect Consonance", feeling: "Lyrical, pastoral, open warmth", songAsc: "My Bonnie Lies Over the Ocean / NBC Chimes", songDesc: "Nobody Knows the Trouble I've Seen", mnemonicAsc: "My Bonnie Lies Over the Ocean / NBC Chimes", mnemonicDesc: "Nobody Knows the Trouble I've Seen", example: ["C4", "A4"] },
    10: { semitones: 10, name: "Minor 7th", shortName: "m7", consonance: "Mild Dissonance", feeling: "Bluesy, jazzy dominant tension", songAsc: "Star Trek Original Theme / Somewhere", songDesc: "Watermelon Man", mnemonicAsc: "Star Trek Original Theme / Somewhere", mnemonicDesc: "Watermelon Man", example: ["C4", "Bb4"] },
    11: { semitones: 11, name: "Major 7th", shortName: "M7", consonance: "Sharp Dissonance", feeling: "Dreamy jazz shimmer pulling up to the octave", songAsc: "Take On Me (Chorus Leap)", songDesc: "I Love You (Cole Porter)", mnemonicAsc: "Take On Me (Chorus Leap)", mnemonicDesc: "I Love You (Cole Porter)", example: ["C4", "B4"] },
    12: { semitones: 12, name: "Octave", shortName: "P8", consonance: "Perfect Consonance", feeling: "Complete register doubling, soaring fullness", songAsc: "Somewhere Over the Rainbow", songDesc: "Singing in the Rain", mnemonicAsc: "Somewhere Over the Rainbow", mnemonicDesc: "Singing in the Rain", example: ["C4", "C5"] }
  };

  const SCALE_FORMULAS = {
    major: {
      name: "Major (Ionian)",
      intervals: [0, 2, 4, 5, 7, 9, 11, 12],
      stepFormula: "W - W - H - W - W - W - H",
      degrees: ["1", "2", "3", "4", "5", "6", "7", "8"],
      solfege: ["Do", "Re", "Mi", "Fa", "Sol", "La", "Ti", "Do"],
      harmonicRoles: ["Tonic (Home)", "Supertonic", "Mediant", "Subdominant", "Dominant", "Submediant", "Leading Tone", "Octave Tonic"],
      description: "Bright and uplifting; the bedrock foundation of Western music harmony. Built with Whole steps except between degrees 3–4 (Mi–Fa) and 7–8 (Ti–Do).",
      rhFinger: [1, 2, 3, 1, 2, 3, 4, 5],
      lhFinger: [5, 4, 3, 2, 1, 3, 2, 1]
    },
    natural_minor: {
      name: "Natural Minor (Aeolian)",
      intervals: [0, 2, 3, 5, 7, 8, 10, 12],
      stepFormula: "W - H - W - W - H - W - W",
      degrees: ["1", "2", "♭3", "4", "5", "♭6", "♭7", "8"],
      solfege: ["Do", "Re", "Me", "Fa", "Sol", "Le", "Te", "Do"],
      harmonicRoles: ["Tonic (Home)", "Supertonic", "Minor Mediant", "Subdominant", "Dominant", "Submediant", "Subtonic", "Octave Tonic"],
      description: "Somber, melancholic, and introspective mood. Lowering the 3rd, 6th, and 7th degrees creates dark emotional depth.",
      rhFinger: [1, 2, 3, 1, 2, 3, 4, 5],
      lhFinger: [5, 4, 3, 2, 1, 3, 2, 1]
    },
    harmonic_minor: {
      name: "Harmonic Minor",
      intervals: [0, 2, 3, 5, 7, 8, 11, 12],
      stepFormula: "W - H - W - W - H - W+H - H",
      degrees: ["1", "2", "♭3", "4", "5", "♭6", "7", "8"],
      solfege: ["Do", "Re", "Me", "Fa", "Sol", "Le", "Ti", "Do"],
      harmonicRoles: ["Tonic (Home)", "Supertonic", "Minor Mediant", "Subdominant", "Dominant", "Submediant", "Leading Tone (Raised 7th)", "Octave Tonic"],
      description: "Distinctive 1.5-step (3 semitones) skip between ♭6 and natural 7, creating a strong Leading Tone that pulls into the minor tonic.",
      rhFinger: [1, 2, 3, 1, 2, 3, 4, 5],
      lhFinger: [5, 4, 3, 2, 1, 3, 2, 1]
    },
    major_pentatonic: {
      name: "Major Pentatonic",
      intervals: [0, 2, 4, 7, 9, 12],
      stepFormula: "W - W - m3 - W - m3",
      degrees: ["1", "2", "3", "5", "6", "8"],
      solfege: ["Do", "Re", "Mi", "Sol", "La", "Do"],
      harmonicRoles: ["Tonic", "Supertonic", "Mediant", "Dominant", "Submediant", "Octave"],
      description: "5-note scale omitting the tense half-steps (degrees 4 and 7); impossible to play a 'wrong' note—folk, gospel, and country staple.",
      rhFinger: [1, 2, 3, 1, 2, 3],
      lhFinger: [5, 4, 3, 2, 1, 1]
    },
    minor_pentatonic: {
      name: "Minor Pentatonic",
      intervals: [0, 3, 5, 7, 10, 12],
      stepFormula: "m3 - W - W - m3 - W",
      degrees: ["1", "♭3", "4", "5", "♭7", "8"],
      solfege: ["Do", "Me", "Fa", "Sol", "Te", "Do"],
      harmonicRoles: ["Tonic", "Minor 3rd", "Subdominant", "Dominant", "Flat 7th", "Octave"],
      description: "Essential rock, blues, and pop improvisation framework using 5 soulful notes.",
      rhFinger: [1, 2, 3, 4, 5, 5],
      lhFinger: [5, 4, 3, 2, 1, 1]
    },
    blues: {
      name: "Blues Scale",
      intervals: [0, 3, 5, 6, 7, 10, 12],
      stepFormula: "m3 - W - H - H - m3 - W",
      degrees: ["1", "♭3", "4", "♭5", "5", "♭7", "8"],
      solfege: ["Do", "Me", "Fa", "Fi/Se", "Sol", "Te", "Do"],
      harmonicRoles: ["Tonic", "Minor 3rd", "Subdominant", "Blue Note (♭5)", "Dominant", "Flat 7th", "Octave"],
      description: "Minor pentatonic injected with the expressive chromatic 'blue note' (♭5 / tritone) for soulful tension and release.",
      rhFinger: [1, 2, 3, 4, 1, 2, 3],
      lhFinger: [5, 4, 3, 2, 1, 3, 1]
    },
    dorian: {
      name: "Dorian Mode",
      intervals: [0, 2, 3, 5, 7, 9, 10, 12],
      stepFormula: "W - H - W - W - W - H - W",
      degrees: ["1", "2", "♭3", "4", "5", "6", "♭7", "8"],
      solfege: ["Do", "Re", "Me", "Fa", "Sol", "La", "Te", "Do"],
      harmonicRoles: ["Tonic", "Supertonic", "Minor 3rd", "Subdominant", "Dominant", "Raised 6th (Dorian Color)", "Subtonic", "Octave"],
      description: "Minor scale with a bright raised 6th degree; hallmark of Scarborough Fair, Celtic folk, funk, and modal jazz.",
      rhFinger: [1, 2, 3, 1, 2, 3, 4, 5],
      lhFinger: [5, 4, 3, 2, 1, 3, 2, 1]
    },
    mixolydian: {
      name: "Mixolydian Mode",
      intervals: [0, 2, 4, 5, 7, 9, 10, 12],
      stepFormula: "W - W - H - W - W - H - W",
      degrees: ["1", "2", "3", "4", "5", "6", "♭7", "8"],
      solfege: ["Do", "Re", "Mi", "Fa", "Sol", "La", "Te", "Do"],
      harmonicRoles: ["Tonic", "Supertonic", "Major 3rd", "Subdominant", "Dominant", "Submediant", "Bluesy Flat 7th", "Octave"],
      description: "Major scale with a lowered ♭7th degree; staple of classic rock, blues-rock, and upbeat folk tunes.",
      rhFinger: [1, 2, 3, 1, 2, 3, 4, 5],
      lhFinger: [5, 4, 3, 2, 1, 3, 2, 1]
    }
  };

  const CHORD_TYPES = {
    "major": { name: "Major Triad", intervals: [0, 4, 7], symbol: "", recipe: "Root (0) + Major 3rd (+4 st) + Perfect 5th (+7 st)", stepMath: "4 half-steps + 3 half-steps", mood: "Bright, happy, confident, and resolved", rhFingers: [[1, 3, 5], [1, 2, 5], [1, 3, 5]], lhFingers: [[5, 3, 1], [5, 3, 1], [5, 2, 1]] },
    "minor": { name: "Minor Triad", intervals: [0, 3, 7], symbol: "m", recipe: "Root (0) + Minor 3rd (+3 st) + Perfect 5th (+7 st)", stepMath: "3 half-steps + 4 half-steps", mood: "Thoughtful, melancholic, and emotional", rhFingers: [[1, 3, 5], [1, 2, 5], [1, 3, 5]], lhFingers: [[5, 3, 1], [5, 3, 1], [5, 2, 1]] },
    "diminished": { name: "Diminished Triad", intervals: [0, 3, 6], symbol: "dim", recipe: "Root (0) + Minor 3rd (+3 st) + Diminished 5th (+6 st)", stepMath: "3 half-steps + 3 half-steps (stacked minor 3rds)", mood: "Suspenseful, unstable leading-tone tension", rhFingers: [[1, 3, 5], [1, 2, 5], [1, 3, 5]], lhFingers: [[5, 3, 1], [5, 3, 1], [5, 2, 1]] },
    "augmented": { name: "Augmented Triad", intervals: [0, 4, 8], symbol: "aug", recipe: "Root (0) + Major 3rd (+4 st) + Augmented 5th (+8 st)", stepMath: "4 half-steps + 4 half-steps (stacked major 3rds)", mood: "Dreamlike, mysterious, floating", rhFingers: [[1, 3, 5], [1, 2, 5], [1, 3, 5]], lhFingers: [[5, 3, 1], [5, 3, 1], [5, 2, 1]] },
    "sus4": { name: "Suspended 4th", intervals: [0, 5, 7], symbol: "sus4", recipe: "Root (0) + Perfect 4th (+5 st) + Perfect 5th (+7 st)", stepMath: "5 half-steps + 2 half-steps (replaces 3rd with 4th)", mood: "Open, floating, wants to resolve down to the 3rd", rhFingers: [[1, 4, 5], [1, 2, 5], [1, 3, 5]], lhFingers: [[5, 2, 1], [5, 3, 1], [5, 2, 1]] },
    "sus2": { name: "Suspended 2nd", intervals: [0, 2, 7], symbol: "sus2", recipe: "Root (0) + Major 2nd (+2 st) + Perfect 5th (+7 st)", stepMath: "2 half-steps + 5 half-steps (replaces 3rd with 2nd)", mood: "Modern, airy, cinematic openness", rhFingers: [[1, 2, 5], [1, 4, 5], [1, 2, 5]], lhFingers: [[5, 4, 1], [5, 2, 1], [5, 3, 1]] },
    "dom7": { name: "Dominant 7th", intervals: [0, 4, 7, 10], symbol: "7", recipe: "Major Triad (0, 4, 7) + Minor 7th (+10 st)", stepMath: "4 + 3 + 3 half-steps", mood: "Bluesy & classical V7 magnet pulling strongly home to I", rhFingers: [[1, 2, 3, 5], [1, 2, 4, 5], [1, 2, 3, 5], [1, 2, 4, 5]], lhFingers: [[5, 3, 2, 1], [5, 3, 2, 1], [5, 3, 2, 1], [5, 4, 2, 1]] },
    "maj7": { name: "Major 7th", intervals: [0, 4, 7, 11], symbol: "maj7", recipe: "Major Triad (0, 4, 7) + Major 7th (+11 st)", stepMath: "4 + 3 + 4 half-steps", mood: "Lush, warm, jazz & lo-fi sophistication", rhFingers: [[1, 2, 3, 5], [1, 2, 4, 5], [1, 2, 3, 5], [1, 2, 4, 5]], lhFingers: [[5, 3, 2, 1], [5, 3, 2, 1], [5, 3, 2, 1], [5, 4, 2, 1]] },
    "min7": { name: "Minor 7th", intervals: [0, 3, 7, 10], symbol: "m7", recipe: "Minor Triad (0, 3, 7) + Minor 7th (+10 st)", stepMath: "3 + 4 + 3 half-steps", mood: "Smooth, soulful, R&B and jazz ii7 staple", rhFingers: [[1, 2, 3, 5], [1, 2, 4, 5], [1, 2, 3, 5], [1, 2, 4, 5]], lhFingers: [[5, 3, 2, 1], [5, 3, 2, 1], [5, 3, 2, 1], [5, 4, 2, 1]] }
  };

  // Diatonic letter steps for staff geometry
  const DIATONIC_BASE = { 'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6 };
  const DIATONIC_LETTERS = ["C", "D", "E", "F", "G", "A", "B"];

  // Conservatory Authentic 12-Key Standard Fingerings (RH: 1=Thumb..5=Pinky, LH: 5=Pinky..1=Thumb)
  const MAJOR_SCALE_FINGERINGS = {
    "C":  { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
    "G":  { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
    "D":  { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
    "A":  { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
    "E":  { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
    "B":  { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [4, 3, 2, 1, 4, 3, 2, 1] },
    "F#": { rh: [2, 3, 4, 1, 2, 3, 1, 2], lh: [4, 3, 2, 1, 3, 2, 1, 4] },
    "Gb": { rh: [2, 3, 4, 1, 2, 3, 1, 2], lh: [4, 3, 2, 1, 3, 2, 1, 4] },
    "Db": { rh: [2, 3, 1, 2, 3, 4, 1, 2], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
    "C#": { rh: [2, 3, 1, 2, 3, 4, 1, 2], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
    "Ab": { rh: [3, 4, 1, 2, 3, 1, 2, 3], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
    "G#": { rh: [3, 4, 1, 2, 3, 1, 2, 3], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
    "Eb": { rh: [3, 1, 2, 3, 4, 1, 2, 3], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
    "D#": { rh: [3, 1, 2, 3, 4, 1, 2, 3], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
    "Bb": { rh: [4, 1, 2, 3, 1, 2, 3, 4], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
    "A#": { rh: [4, 1, 2, 3, 1, 2, 3, 4], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
    "F":  { rh: [1, 2, 3, 4, 1, 2, 3, 4], lh: [5, 4, 3, 2, 1, 3, 2, 1] }
  };

  const MINOR_SCALE_FINGERINGS = {
    "C":  { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
    "G":  { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
    "D":  { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
    "A":  { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
    "E":  { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [5, 4, 3, 2, 1, 3, 2, 1] },
    "B":  { rh: [1, 2, 3, 1, 2, 3, 4, 5], lh: [4, 3, 2, 1, 4, 3, 2, 1] },
    "F#": { rh: [2, 3, 1, 2, 3, 1, 2, 3], lh: [4, 3, 2, 1, 3, 2, 1, 4] },
    "Gb": { rh: [2, 3, 1, 2, 3, 1, 2, 3], lh: [4, 3, 2, 1, 3, 2, 1, 4] },
    "Db": { rh: [3, 4, 1, 2, 3, 1, 2, 3], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
    "C#": { rh: [3, 4, 1, 2, 3, 1, 2, 3], lh: [3, 2, 1, 4, 3, 2, 1, 3] },
    "Ab": { rh: [3, 4, 1, 2, 3, 1, 2, 3], lh: [3, 2, 1, 3, 2, 1, 4, 3] },
    "G#": { rh: [3, 4, 1, 2, 3, 1, 2, 3], lh: [3, 2, 1, 3, 2, 1, 4, 3] },
    "Eb": { rh: [2, 1, 2, 3, 4, 1, 2, 3], lh: [2, 1, 4, 3, 2, 1, 3, 2] },
    "D#": { rh: [2, 1, 2, 3, 4, 1, 2, 3], lh: [2, 1, 4, 3, 2, 1, 3, 2] },
    "Bb": { rh: [2, 1, 2, 3, 1, 2, 3, 4], lh: [2, 1, 3, 2, 1, 4, 3, 2] },
    "A#": { rh: [2, 1, 2, 3, 1, 2, 3, 4], lh: [2, 1, 3, 2, 1, 4, 3, 2] },
    "F":  { rh: [1, 2, 3, 4, 1, 2, 3, 4], lh: [5, 4, 3, 2, 1, 3, 2, 1] }
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

  function pitchToMidi(pitchStr, defaultOct = 4) {
    if (!pitchStr || pitchStr === "-") return null;
    const clean = pitchStr.trim();
    const match = clean.match(/^([A-G])([#b]?)([0-8])?$/);
    if (!match) return null;
    const letter = match[1];
    const acc = match[2] || "";
    const oct = match[3] !== undefined ? parseInt(match[3], 10) : defaultOct;
    const key = letter + acc;
    const semi = NOTE_OFFSETS[key];
    if (semi === undefined) return null;
    return (oct + 1) * 12 + semi;
  }

  function midiToPitch(midiNum, useFlat = false) {
    if (typeof midiNum !== "number" || isNaN(midiNum) || midiNum < 12 || midiNum > 127) return null;
    const oct = Math.floor(midiNum / 12) - 1;
    const semi = midiNum % 12;
    const names = useFlat ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP;
    return `${names[semi]}${oct}`;
  }

  function midiToFreq(midiNum) {
    if (typeof midiNum !== "number" || isNaN(midiNum)) return 0;
    return 440 * Math.pow(2, (midiNum - 69) / 12);
  }

  function pitchToFreq(pitchStr, defaultOct = 4) {
    const midi = pitchToMidi(pitchStr, defaultOct);
    return midi !== null ? midiToFreq(midi) : null;
  }

  function getDiatonicStep(pitchStr, defaultOct = 4) {
    if (!pitchStr || pitchStr === "-") return null;
    const clean = pitchStr.trim();
    const match = clean.match(/^([A-G])([#b]?)([0-8])?$/);
    if (!match) return null;
    const letter = match[1];
    const oct = match[3] !== undefined ? parseInt(match[3], 10) : defaultOct;
    return (oct - 4) * 7 + DIATONIC_BASE[letter];
  }

  function areEnharmonicEquivalent(pitchA, pitchB) {
    const midiA = pitchToMidi(pitchA);
    const midiB = pitchToMidi(pitchB);
    return midiA !== null && midiB !== null && midiA === midiB;
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

    const rhArr = keyFingers ? keyFingers.rh : formula.rhFinger;
    const lhArr = keyFingers ? keyFingers.lh : formula.lhFinger;

    const notes = formula.intervals.map((interval, idx) => {
      const noteMidi = baseMidi + interval;
      let pitch;
      if (isHeptatonic && rootLetterIdx !== -1) {
        const targetLetter = DIATONIC_LETTERS[(rootLetterIdx + idx) % 7];
        pitch = spellPitchOnLetter(noteMidi, targetLetter);
      } else {
        pitch = midiToPitch(noteMidi, useFlat);
      }

      const rhF = rhArr[idx] || 1;
      const lhF = lhArr[idx] || 5;
      const prevRhF = idx > 0 ? (rhArr[idx - 1] || 1) : null;
      const prevLhF = idx > 0 ? (lhArr[idx - 1] || 5) : null;

      let rhTransition = null;
      if (idx > 0 && idx < formula.intervals.length - 1 && rhF === 1 && prevRhF > 1) {
        rhTransition = `Thumb Tuck (1 under ${prevRhF})`;
      } else if (idx > 0 && rhF > 1 && prevRhF === 1 && (rhF - prevRhF > 1)) {
        rhTransition = `Finger Cross (${rhF} over 1)`;
      }

      let lhTransition = null;
      if (idx > 0 && idx < formula.intervals.length - 1 && prevLhF === 1 && lhF > 1) {
        lhTransition = `Finger Cross (${lhF} over 1)`;
      } else if (idx > 0 && lhF === 1 && prevLhF > 2) {
        lhTransition = `Thumb Tuck (1 under ${prevLhF})`;
      }

      return {
        step: idx + 1,
        degree: (formula.degrees && formula.degrees[idx]) ? formula.degrees[idx] : String(idx + 1),
        solfege: (formula.solfege && formula.solfege[idx]) ? formula.solfege[idx] : "",
        harmonicRole: (formula.harmonicRoles && formula.harmonicRoles[idx]) ? formula.harmonicRoles[idx] : "",
        semitonesFromRoot: interval,
        midi: noteMidi,
        pitch: pitch,
        freq: midiToFreq(noteMidi),
        rhFinger: rhF,
        lhFinger: lhF,
        rhTransition: rhTransition,
        lhTransition: lhTransition
      };
    });

    return {
      root: rootPitch,
      scaleType: scaleType,
      name: `${rootPitch} ${formula.name}`,
      stepFormula: formula.stepFormula || "W - W - H - W - W - W - H",
      description: formula.description,
      notes: notes
    };
  }

  function getScalePedagogyInfo(rootPitch = "C", scaleType = "major", octave = 4) {
    const scale = generateScale(rootPitch, scaleType, octave);
    if (!scale) return null;
    const rhTucks = scale.notes.filter(n => n.rhTransition).map(n => ({ pitch: n.pitch, step: n.step, label: n.rhTransition }));
    const lhCrosses = scale.notes.filter(n => n.lhTransition).map(n => ({ pitch: n.pitch, step: n.step, label: n.lhTransition }));
    return {
      ...scale,
      rhTransitions: rhTucks,
      lhTransitions: lhCrosses,
      thumbTucksRH: rhTucks,
      fingerCrossesLH: lhCrosses
    };
  }

  function generateChord(rootPitch, chordType = "major", octave = 4, inversion = 0) {
    const rootSemi = NOTE_OFFSETS[rootPitch];
    if (rootSemi === undefined) return null;
    const typeDef = CHORD_TYPES[chordType] || CHORD_TYPES.major;

    const baseMidi = (octave + 1) * 12 + rootSemi;
    const useFlat = rootPitch.includes("b") || ["F", "Bb", "Eb", "Ab", "Db"].includes(rootPitch);

    let midiNotes = typeDef.intervals.map(intVal => baseMidi + intVal);

    // Apply inversion: shift bottom notes up an octave
    for (let inv = 0; inv < inversion && inv < midiNotes.length; inv++) {
      midiNotes[inv] += 12;
    }
    midiNotes.sort((a, b) => a - b);

    const pitchArray = midiNotes.map(m => midiToPitch(m, useFlat));

    let invLabel = "Root Position";
    if (inversion === 1) invLabel = "1st Inversion";
    if (inversion === 2) invLabel = "2nd Inversion";
    if (inversion === 3) invLabel = "3rd Inversion";

    const invIdx = Math.min(inversion, (typeDef.rhFingers ? typeDef.rhFingers.length - 1 : 0));
    const rhFingers = typeDef.rhFingers ? typeDef.rhFingers[invIdx] : [1, 3, 5];
    const lhFingers = typeDef.lhFingers ? typeDef.lhFingers[invIdx] : [5, 3, 1];

    return {
      root: rootPitch,
      chordType: chordType,
      typeName: typeDef.name,
      symbol: `${rootPitch}${typeDef.symbol}`,
      fullName: `${rootPitch}${typeDef.symbol} (${invLabel})`,
      inversion: inversion,
      inversionLabel: invLabel,
      midiNotes: midiNotes,
      pitches: pitchArray,
      freqs: midiNotes.map(midiToFreq),
      intervals: typeDef.intervals,
      recipe: typeDef.recipe || "",
      stepMath: typeDef.stepMath || "",
      mood: typeDef.mood || "",
      rhFingers: rhFingers,
      lhFingers: lhFingers
    };
  }

  function getChordConstructionRecipe(rootPitch = "C", chordType = "major", octaveOrInv = 4, invOrOctave = 0) {
    const isThirdArgOctave = octaveOrInv >= 3 && invOrOctave <= 3;
    const octave = isThirdArgOctave ? octaveOrInv : invOrOctave;
    const inversion = isThirdArgOctave ? invOrOctave : octaveOrInv;

    const chord = generateChord(rootPitch, chordType, octave, inversion);
    if (!chord) return null;
    const lhBassOct = (NOTE_OFFSETS[rootPitch] || 0) < 5 ? 3 : 2;
    const lhBassPitch = `${rootPitch}${lhBassOct}`;
    const roleLabelsByType = {
      major: ["Root (1)", "Major 3rd (3)", "Perfect 5th (5)"],
      minor: ["Root (1)", "Minor 3rd (♭3)", "Perfect 5th (5)"],
      diminished: ["Root (1)", "Minor 3rd (♭3)", "Dim 5th (♭5)"],
      augmented: ["Root (1)", "Major 3rd (3)", "Aug 5th (♯5)"],
      sus2: ["Root (1)", "Major 2nd (2)", "Perfect 5th (5)"],
      sus4: ["Root (1)", "Perfect 4th (4)", "Perfect 5th (5)"],
      dom7: ["Root (1)", "Major 3rd (3)", "Perfect 5th (5)", "Minor 7th (♭7)"],
      maj7: ["Root (1)", "Major 3rd (3)", "Perfect 5th (5)", "Major 7th (7)"],
      min7: ["Root (1)", "Minor 3rd (♭3)", "Perfect 5th (5)", "Minor 7th (♭7)"]
    };
    const baseRoles = roleLabelsByType[chordType] || roleLabelsByType.major;

    const intervalBreakdown = chord.intervals.map(semi => {
      const ped = INTERVAL_PEDAGOGY[semi % 12] || { name: `${semi} st`, shortName: `${semi}st` };
      return { semitones: semi, name: ped.name, shortName: ped.shortName };
    });

    const tones = chord.pitches.map((pitch, idx) => {
      const origIdx = (idx + inversion) % chord.intervals.length;
      const semi = chord.intervals[origIdx];
      const ped = INTERVAL_PEDAGOGY[semi % 12] || { name: `${semi} st`, shortName: `${semi}st` };
      return {
        roleLabel: baseRoles[origIdx] || `Tone ${idx + 1}`,
        pitch,
        midi: chord.midiNotes[idx],
        freq: chord.freqs[idx],
        semitonesFromRoot: semi,
        intervalName: ped.name,
        rhFinger: chord.rhFingers[idx] || 1,
        lhFinger: chord.lhFingers[idx] || 5
      };
    });

    return {
      ...chord,
      lhBassPitch,
      lhBassMidi: pitchToMidi(lhBassPitch),
      lhBassFreq: pitchToFreq(lhBassPitch),
      intervalBreakdown,
      tones,
      semitoneFormula: chord.intervals.join(" – ")
    };
  }

  function getInterval(pitch1, pitch2) {
    const m1 = pitchToMidi(pitch1);
    const m2 = pitchToMidi(pitch2);
    if (m1 === null || m2 === null) return null;
    const semitones = Math.abs(m2 - m1);
    let name = INTERVAL_NAMES[semitones];
    if (!name) {
      const mod = semitones % 12;
      if (mod === 0) {
        name = `${Math.floor(semitones / 12)} Octaves`;
      } else {
        name = INTERVAL_NAMES[mod] ? `${INTERVAL_NAMES[mod]} (+${Math.floor(semitones / 12)} oct)` : `${semitones} semitones`;
      }
    }
    return {
      semitones: semitones,
      name: name,
      octaves: Math.floor(semitones / 12)
    };
  }

  // Sight Reading Flashcard Generator
  const FLASHCARD_PRESETS = {
    treble_basic: {
      name: "Treble Clef Primer (C4 – G5)",
      clef: "treble",
      pitches: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5"]
    },
    bass_basic: {
      name: "Bass Clef Primer (C3 – C4)",
      clef: "bass",
      pitches: ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4"]
    },
    grand_staff: {
      name: "Grand Staff (Bass & Treble)",
      clef: "grand",
      pitches: ["F2", "G2", "A2", "B2", "C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5"]
    },
    accidentals: {
      name: "Black Keys & Accidentals (♯ / ♭)",
      clef: "treble",
      pitches: ["C#4", "D#4", "F#4", "G#4", "A#4", "Db4", "Eb4", "Gb4", "Ab4", "Bb4", "C#5", "D#5", "F#5"]
    },
    ledger_lines: {
      name: "Ledger Line Master (High & Low Extremes)",
      clef: "grand",
      pitches: ["C2", "D2", "E2", "F2", "A5", "B5", "C6", "D6"]
    }
  };

  // ==========================================
  // ADAPTIVE SPACED-REPETITION SYSTEM (SRS)
  // ==========================================
  const SRS_STORAGE_KEY = "piano_srs_stats";

  function getSRSStorage() {
    if (typeof localStorage === "undefined") return {};
    try {
      const data = localStorage.getItem(SRS_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  function saveSRSStorage(data) {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function recordSRSAttempt(pitchOrId, isCorrect, responseTimeMs = 1500) {
    if (!pitchOrId) return;
    const stats = getSRSStorage();
    const cur = stats[pitchOrId] || { attempts: 0, errors: 0, correct: 0, avgResponseMs: 1500, streak: 0 };
    cur.attempts++;
    if (isCorrect) {
      cur.correct++;
      cur.streak++;
    } else {
      cur.errors++;
      cur.streak = 0;
    }
    const cleanTime = Math.max(200, Math.min(10000, responseTimeMs));
    cur.avgResponseMs = Math.round(cur.avgResponseMs * 0.65 + cleanTime * 0.35);
    stats[pitchOrId] = cur;
    saveSRSStorage(stats);
    return cur;
  }

  function getSRSItemStats(pitchOrId) {
    const stats = getSRSStorage();
    return stats[pitchOrId] || { attempts: 0, errors: 0, correct: 0, avgResponseMs: 1500, streak: 0 };
  }

  function getAllSRSStats() {
    return getSRSStorage();
  }

  function clearSRSStats() {
    if (typeof localStorage !== "undefined") {
      try { localStorage.removeItem(SRS_STORAGE_KEY); } catch (e) {}
    }
  }

  function getSRSMasteryLevel(pitchOrId) {
    const item = getSRSItemStats(pitchOrId);
    if (!item || item.attempts < 2) return "new"; // Not enough data
    const errorRate = item.errors / item.attempts;
    if (errorRate <= 0.15 && item.avgResponseMs < 1400 && item.streak >= 2) return "mastered";
    if (errorRate > 0.35 || item.avgResponseMs > 2000) return "needs_practice";
    return "learning";
  }

  function getRandomFlashcard(presetKey = "treble_basic", excludePitch = null, useSRS = true) {
    const preset = FLASHCARD_PRESETS[presetKey] || FLASHCARD_PRESETS.treble_basic;
    let pool = [...preset.pitches];
    if (excludePitch && pool.length > 1) {
      pool = pool.filter(p => p !== excludePitch);
    }

    let targetPitch;
    if (useSRS && pool.length > 1) {
      // Weight selection so difficult notes (needs_practice) appear 3.5x more often
      const weights = pool.map(pitch => {
        const mastery = getSRSMasteryLevel(pitch);
        if (mastery === "needs_practice") return 3.5;
        if (mastery === "new") return 2.2;
        if (mastery === "learning") return 1.8;
        return 1.0; // mastered
      });
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      let randVal = Math.random() * totalWeight;
      for (let i = 0; i < pool.length; i++) {
        randVal -= weights[i];
        if (randVal <= 0) {
          targetPitch = pool[i];
          break;
        }
      }
      if (!targetPitch) targetPitch = pool[pool.length - 1];
    } else {
      const randomIndex = Math.floor(Math.random() * pool.length);
      targetPitch = pool[randomIndex];
    }

    const midi = pitchToMidi(targetPitch);

    let clef = preset.clef;
    if (clef === "grand") {
      // Notes >= C4 drawn in treble, notes < C4 drawn in bass
      clef = midi >= 60 ? "treble" : "bass";
    }

    // Determine distractor multiple-choice options
    const allNoteLetters = ["C", "D", "E", "F", "G", "A", "B"];
    const targetLetter = targetPitch.replace(/[0-9]/g, "");
    const distractors = allNoteLetters
      .filter(l => l !== targetLetter)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const options = [targetLetter, ...distractors].sort(() => 0.5 - Math.random());

    return {
      pitch: targetPitch,
      noteLetter: targetLetter,
      clef: clef,
      midi: midi,
      freq: midiToFreq(midi),
      diatonicStep: getDiatonicStep(targetPitch),
      options: options,
      presetName: preset.name,
      srsMastery: getSRSMasteryLevel(targetPitch),
      srsStats: getSRSItemStats(targetPitch)
    };
  }

  function pickSRSWeightedItem(items, getKeyFn, useSRS = true) {
    if (!items || items.length === 0) return null;
    if (!useSRS || items.length === 1) {
      return items[Math.floor(Math.random() * items.length)];
    }
    const weights = items.map(item => {
      const key = getKeyFn(item);
      const mastery = getSRSMasteryLevel(key);
      if (mastery === "needs_practice") return 3.5;
      if (mastery === "new") return 2.2;
      if (mastery === "learning") return 1.8;
      return 1.0; // mastered
    });
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let randVal = Math.random() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      randVal -= weights[i];
      if (randVal <= 0) {
        return items[i];
      }
    }
    return items[items.length - 1];
  }

  // Ear Training Quiz Generator (with Adaptive Spaced-Repetition weighting)
  function generateEarTrainingChallenge(type = "pitch_match", useSRS = true) {
    if (type === "pitch_match") {
      const pitches = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
      const target = pickSRSWeightedItem(pitches, p => p, useSRS);
      return {
        type: "pitch_match",
        prompt: "Listen to the note and play it back!",
        targetPitch: target,
        midi: pitchToMidi(target),
        freq: pitchToFreq(target),
        srsKey: target,
        srsMastery: getSRSMasteryLevel(target),
        srsStats: getSRSItemStats(target)
      };
    } else if (type === "interval_recognition") {
      const rootPitches = ["C4", "D4", "E4", "F4", "G4"];
      const testIntervals = [
        { semitones: 2, label: "Major 2nd" },
        { semitones: 4, label: "Major 3rd" },
        { semitones: 5, label: "Perfect 4th" },
        { semitones: 7, label: "Perfect 5th" },
        { semitones: 12, label: "Octave" }
      ];
      const root = rootPitches[Math.floor(Math.random() * rootPitches.length)];
      const chosenInterval = pickSRSWeightedItem(testIntervals, i => i.label, useSRS);
      const rootMidi = pitchToMidi(root);
      const targetMidi = rootMidi + chosenInterval.semitones;

      const distractors = testIntervals
        .filter(i => i.label !== chosenInterval.label)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(i => i.label);

      const options = [chosenInterval.label, ...distractors].sort(() => 0.5 - Math.random());
      const ped = INTERVAL_PEDAGOGY[chosenInterval.semitones] || {};

      return {
        type: "interval_recognition",
        prompt: "Listen to the two notes. Which interval is it?",
        rootPitch: root,
        rootMidi: rootMidi,
        targetPitch: midiToPitch(targetMidi),
        targetMidi: targetMidi,
        semitones: chosenInterval.semitones,
        correctInterval: chosenInterval.label,
        mnemonicAsc: ped.songAsc || "",
        mnemonicDesc: ped.songDesc || "",
        feeling: ped.feeling || "",
        consonance: ped.consonance || "",
        options: options,
        srsKey: chosenInterval.label,
        srsMastery: getSRSMasteryLevel(chosenInterval.label),
        srsStats: getSRSItemStats(chosenInterval.label)
      };
    } else if (type === "chord_quality") {
      const roots = ["C4", "D4", "E4", "F4", "G4", "A4"];
      const qualities = ["major", "minor"];
      const root = roots[Math.floor(Math.random() * roots.length)];
      const quality = pickSRSWeightedItem(qualities, q => q === "major" ? "Major Triad" : "Minor Triad", useSRS);
      const srsKey = quality === "major" ? "Major Triad" : "Minor Triad";
      const chord = generateChord(root.replace("4", ""), quality, 4);

      return {
        type: "chord_quality",
        prompt: "Listen to the triad. Is it Major or Minor?",
        chord: chord,
        correctQuality: srsKey,
        options: ["Major Triad", "Minor Triad"],
        srsKey: srsKey,
        srsMastery: getSRSMasteryLevel(srsKey),
        srsStats: getSRSItemStats(srsKey)
      };
    }
  }

  // Circle of Fifths Key Signatures Reference
  const CIRCLE_OF_FIFTHS = [
    { key: "C", sharps: 0, flats: 0, relativeMinor: "Am", accidentalsList: [] },
    { key: "G", sharps: 1, flats: 0, relativeMinor: "Em", accidentalsList: ["F#"] },
    { key: "D", sharps: 2, flats: 0, relativeMinor: "Bm", accidentalsList: ["F#", "C#"] },
    { key: "A", sharps: 3, flats: 0, relativeMinor: "F#m", accidentalsList: ["F#", "C#", "G#"] },
    { key: "E", sharps: 4, flats: 0, relativeMinor: "C#m", accidentalsList: ["F#", "C#", "G#", "D#"] },
    { key: "B", sharps: 5, flats: 0, relativeMinor: "G#m", accidentalsList: ["F#", "C#", "G#", "D#", "A#"] },
    { key: "F#", sharps: 6, flats: 0, relativeMinor: "D#m", accidentalsList: ["F#", "C#", "G#", "D#", "A#", "E#"] },
    { key: "Db", sharps: 0, flats: 5, relativeMinor: "Bbm", accidentalsList: ["Bb", "Eb", "Ab", "Db", "Gb"] },
    { key: "Ab", sharps: 0, flats: 4, relativeMinor: "Fm", accidentalsList: ["Bb", "Eb", "Ab", "Db"] },
    { key: "Eb", sharps: 0, flats: 3, relativeMinor: "Cm", accidentalsList: ["Bb", "Eb", "Ab"] },
    { key: "Bb", sharps: 0, flats: 2, relativeMinor: "Gm", accidentalsList: ["Bb", "Eb"] },
    { key: "F", sharps: 0, flats: 1, relativeMinor: "Dm", accidentalsList: ["Bb"] }
  ];

  // Multi-Level Harmony Generation Engine
  function diatonicStepToPitch(step, accidentalMap = {}) {
    if (typeof step !== "number" || isNaN(step)) return null;
    const base = ((step % 7) + 7) % 7;
    const oct = Math.floor(step / 7) + 4;
    const letter = DIATONIC_LETTERS[base];
    const acc = accidentalMap[letter] || "";
    return `${letter}${acc}${oct}`;
  }

  function detectKeyAccidentals(song) {
    const map = {};
    if (!song) return map;
    const allNotes = ((song.rh || "") + " " + (song.lh || "")).match(/[A-G][#b]?[0-8]/g) || [];
    allNotes.forEach(n => {
      const m = n.match(/^([A-G])([#b]?)/);
      if (m && m[2]) {
        map[m[1]] = m[2];
      }
    });
    return map;
  }

  function harmonizePitch(pitchStr, harmonyType = "thirds", accidentalMap = {}) {
    if (!pitchStr || pitchStr === "-") return "-";
    const subPitches = pitchStr.split("+").filter(p => p !== "-");
    if (subPitches.length === 0) return "-";
    const root = subPitches[0];
    const step = getDiatonicStep(root);
    if (step === null) return pitchStr;

    let harmPitches = [root];

    if (harmonyType === "thirds") {
      const p3 = diatonicStepToPitch(step + 2, accidentalMap);
      harmPitches = [root, p3];
    } else if (harmonyType === "thirds_below") {
      const p3b = diatonicStepToPitch(step - 2, accidentalMap);
      harmPitches = [p3b, root];
    } else if (harmonyType === "fifths") {
      const p5 = diatonicStepToPitch(step + 4, accidentalMap);
      harmPitches = [root, p5];
    } else if (harmonyType === "sixths") {
      const p6 = diatonicStepToPitch(step + 5, accidentalMap);
      harmPitches = [root, p6];
    } else if (harmonyType === "octaves") {
      const p8 = diatonicStepToPitch(step + 7, accidentalMap);
      harmPitches = [root, p8];
    } else if (harmonyType === "triads") {
      const p3 = diatonicStepToPitch(step + 2, accidentalMap);
      const p5 = diatonicStepToPitch(step + 4, accidentalMap);
      harmPitches = [root, p3, p5];
    }

    const valid = harmPitches.filter(Boolean);
    const sorted = [...new Set(valid)].sort((a, b) => {
      const mA = pitchToMidi(a) ?? 0;
      const mB = pitchToMidi(b) ?? 0;
      return mA - mB;
    });

    return sorted.join("+");
  }

  function harmonizeToken(tokenStr, harmonyType = "thirds", accidentalMap = {}, fingerStr = "1") {
    if (!tokenStr || tokenStr === "-" || tokenStr === "|") return { token: tokenStr, finger: "-" };
    const parts = tokenStr.split(":");
    const pitch = parts[0];
    const beatsPart = parts[1] ? `:${parts[1]}` : "";
    if (pitch === "-") return { token: `-${beatsPart}`, finger: "-" };

    const harmonizedPitch = harmonizePitch(pitch, harmonyType, accidentalMap);

    let finger = "1+3";
    if (harmonyType === "fifths" || harmonyType === "sixths" || harmonyType === "octaves") {
      finger = "1+5";
    } else if (harmonyType === "triads") {
      finger = "1+3+5";
    }

    return {
      token: `${harmonizedPitch}${beatsPart}`,
      finger: finger
    };
  }

  function generateSongHarmonies(song, harmonyType = "thirds") {
    if (!song) return { dyads: "", dyadsF: "" };
    if (harmonyType === "song" && song.dyads) {
      return { dyads: song.dyads, dyadsF: song.dyadsF || "" };
    }

    const accMap = detectKeyAccidentals(song);
    const rhMeasures = (song.rh || "").split("|").map(m => m.trim().split(/\s+/).filter(Boolean));
    const rhFMeasures = (song.rhF || "").split("|").map(m => m.trim().split(/\s+/).filter(Boolean));

    const dyadMeasures = [];
    const dyadFMeasures = [];

    rhMeasures.forEach((measureTokens, mIdx) => {
      const fTokens = rhFMeasures[mIdx] || [];
      const mDyad = [];
      const mDyadF = [];

      measureTokens.forEach((tok, tIdx) => {
        const res = harmonizeToken(tok, harmonyType, accMap, fTokens[tIdx]);
        mDyad.push(res.token);
        mDyadF.push(res.finger);
      });

      dyadMeasures.push(mDyad.join(" "));
      dyadFMeasures.push(mDyadF.join(" "));
    });

    return {
      dyads: dyadMeasures.join(" | "),
      dyadsF: dyadFMeasures.join(" | ")
    };
  }

  // ==========================================
  // LEFT-HAND ACCOMPANIMENT & HARMONY ENGINE
  // ==========================================
  const LH_ACCOMPANIMENT_STYLES = [
    { id: "song", label: "Song Arrangement (Default)", description: "Play the authentic left-hand bass arrangement as written in repertoire." },
    { id: "roots", label: "Single Roots (1-Note Primer)", description: "Simplifies chords to single root notes with finger 5. Ideal for Level 1/2 beginners." },
    { id: "fifths", label: "Open 5ths (Root + 5th)", description: "Rich, resonant open-fifth power chords (1-5) for rock, pop, and classical." },
    { id: "octaves", label: "Bass Octaves (8ves)", description: "Powerful acoustic bass octaves (1-8) providing orchestral weight and anchor." },
    { id: "triads", label: "Full Triads (1-3-5)", description: "Diatonic root-position triads (1-3-5) for rich harmonic accompaniment." },
    { id: "thirds", label: "Thirds (3rds Above)", description: "Warm harmonic dyad intervals of a third (1-3) above the bass root." }
  ];

  function extractBassRoot(pitchStr) {
    if (!pitchStr || pitchStr === "-") return "-";
    const subPitches = pitchStr.split("+").filter(p => p !== "-");
    if (subPitches.length === 0) return "-";
    if (subPitches.length === 1) return subPitches[0];

    const sorted = [...subPitches].sort((a, b) => {
      const mA = pitchToMidi(a) ?? 0;
      const mB = pitchToMidi(b) ?? 0;
      return mA - mB;
    });
    return sorted[0];
  }

  function transformLeftHandPitch(pitchStr, lhStyle = "song", accidentalMap = {}) {
    if (!pitchStr || pitchStr === "-") return "-";
    if (lhStyle === "song") return pitchStr;

    const root = extractBassRoot(pitchStr);
    if (root === "-") return "-";
    if (lhStyle === "roots") return root;

    const step = getDiatonicStep(root);
    if (step === null) return root;

    let resultPitches = [root];

    if (lhStyle === "fifths") {
      const p5 = diatonicStepToPitch(step + 4, accidentalMap);
      resultPitches = [root, p5];
    } else if (lhStyle === "octaves") {
      const p8 = diatonicStepToPitch(step + 7, accidentalMap);
      resultPitches = [root, p8];
    } else if (lhStyle === "triads") {
      const p3 = diatonicStepToPitch(step + 2, accidentalMap);
      const p5 = diatonicStepToPitch(step + 4, accidentalMap);
      resultPitches = [root, p3, p5];
    } else if (lhStyle === "thirds") {
      const p3 = diatonicStepToPitch(step + 2, accidentalMap);
      resultPitches = [root, p3];
    }

    const valid = resultPitches.filter(Boolean);
    const sorted = [...new Set(valid)].sort((a, b) => {
      const mA = pitchToMidi(a) ?? 0;
      const mB = pitchToMidi(b) ?? 0;
      return mA - mB;
    });

    return sorted.join("+");
  }

  function transformLeftHandToken(tokenStr, lhStyle = "song", accidentalMap = {}, fingerStr = "5") {
    if (!tokenStr || tokenStr === "-" || tokenStr === "|") return { token: tokenStr, finger: "-" };
    if (lhStyle === "song") return { token: tokenStr, finger: fingerStr };

    const tied = tokenStr.includes("~");
    const clean = tokenStr.replace(/~/g, "");
    const parts = clean.split(":");
    const pitch = parts[0];
    const beatsPart = parts[1] ? `:${parts[1]}` : "";
    if (pitch === "-") return { token: `-${beatsPart}${tied ? "~" : ""}`, finger: "-" };

    const transformedPitch = transformLeftHandPitch(pitch, lhStyle, accidentalMap);

    let finger = "5";
    if (lhStyle === "fifths" || lhStyle === "octaves") {
      finger = "5+1";
    } else if (lhStyle === "triads") {
      finger = "5+3+1";
    } else if (lhStyle === "thirds") {
      finger = "5+3";
    }

    return {
      token: `${transformedPitch}${beatsPart}${tied ? "~" : ""}`,
      finger: finger
    };
  }

  function generateLeftHandAccompaniment(song, lhStyle = "song") {
    if (!song) return { lh: "", lhF: "" };
    if (lhStyle === "song") {
      return { lh: song.lh || "", lhF: song.lhF || "" };
    }

    const accMap = detectKeyAccidentals(song);
    let lhSource = song.lh || "";
    let lhFSource = song.lhF || "";

    // If song has no LH at all, synthesize baseline from RH
    if (!lhSource.trim() && song.rh) {
      const rhM = (song.rh || "").split("|").map(m => m.trim().split(/\s+/).filter(Boolean));
      const synthM = [];
      const synthFM = [];
      let expBeats = 4;
      if (song.timeSig) {
        const [n, d] = song.timeSig.split("/");
        expBeats = (parseFloat(n) || 4) * (4 / (parseFloat(d) || 4));
      }
      rhM.forEach(measureTokens => {
        const firstMelody = measureTokens.find(t => !t.startsWith("-"));
        let bassPitch = "C3";
        if (firstMelody) {
          const rawP = firstMelody.split(":")[0].split("+")[0];
          const m = rawP.match(/^([A-G])([#b]?)([0-8])?$/);
          if (m) {
            bassPitch = `${m[1]}${m[2] || ""}3`;
          }
        }
        synthM.push(`${bassPitch}:${expBeats}`);
        synthFM.push("5");
      });
      lhSource = synthM.join(" | ");
      lhFSource = synthFM.join(" | ");
    }

    const lhMeasures = lhSource.split("|").map(m => m.trim().split(/\s+/).filter(Boolean));
    const lhFMeasures = lhFSource.split("|").map(m => m.trim().split(/\s+/).filter(Boolean));

    const outMeasures = [];
    const outFMeasures = [];

    lhMeasures.forEach((measureTokens, mIdx) => {
      const fTokens = lhFMeasures[mIdx] || [];
      const mLH = [];
      const mLHF = [];

      measureTokens.forEach((tok, tIdx) => {
        const res = transformLeftHandToken(tok, lhStyle, accMap, fTokens[tIdx] || "5");
        mLH.push(res.token);
        mLHF.push(res.finger);
      });

      outMeasures.push(mLH.join(" "));
      outFMeasures.push(mLHF.join(" "));
    });

    return {
      lh: outMeasures.join(" | "),
      lhF: outFMeasures.join(" | ")
    };
  }

  // ==========================================
  // CHORD PROGRESSIONS & VOICE-LEADING GYM
  // ==========================================
  const PROGRESSION_TEMPLATES = {
    pop_anthem: {
      id: "pop_anthem",
      name: "Pop Anthem (I – V – vi – IV)",
      numerals: ["I", "V", "vi", "IV"],
      description: "The most iconic progression in modern pop and rock (100+ global hit songs)."
    },
    jazz_turnaround: {
      id: "jazz_turnaround",
      name: "Jazz Turnaround (ii7 – V7 – Imaj7)",
      numerals: ["ii7", "V7", "Imaj7"],
      description: "The fundamental harmonic engine of standard jazz repertoire."
    },
    classical_cadence: {
      id: "classical_cadence",
      name: "Classical Cadence (I – IV – I64 – V7 – I)",
      numerals: ["I", "IV", "I64", "V7", "I"],
      description: "Standard conservatory voice-leading cadence with cadential 6/4 tonic resolution."
    },
    andalusian: {
      id: "andalusian",
      name: "Andalusian Cadence (i – VII – VI – V)",
      numerals: ["i", "VII", "VI", "V"],
      description: "Descending flamenco and dramatic classical minor cadence."
    },
    doo_wop: {
      id: "doo_wop",
      name: "50s Doo-Wop (I – vi – IV – V)",
      numerals: ["I", "vi", "IV", "V"],
      description: "Timeless 1950s rock, rhythm & blues, and soul progression."
    }
  };

  // Convert key root and Roman numeral into detailed chord data
  function getNumeralChordInfo(keyRoot = "C", numeral = "I") {
    const isMinorKey = keyRoot.endsWith("m") || ["Am", "Dm", "Em"].includes(keyRoot);
    const cleanKey = keyRoot.replace(/m$/, "");
    const tonicSemi = NOTE_OFFSETS[cleanKey] ?? 0;
    const useFlat = cleanKey.includes("b") || ["F", "Bb", "Eb", "Ab", "Db"].includes(cleanKey);

    const majorScaleOffsets = [0, 2, 4, 5, 7, 9, 11];
    const naturalMinorScaleOffsets = [0, 2, 3, 5, 7, 8, 10];
    const scaleOffsets = isMinorKey ? naturalMinorScaleOffsets : majorScaleOffsets;

    let degree = 0; // 0-based scale degree
    let chordType = "major";
    let is64 = false;

    switch (numeral) {
      case "I": degree = 0; chordType = "major"; break;
      case "i": degree = 0; chordType = "minor"; break;
      case "ii": degree = 1; chordType = "minor"; break;
      case "ii7": degree = 1; chordType = "m7"; break;
      case "iii": degree = 2; chordType = "minor"; break;
      case "IV": degree = 3; chordType = "major"; break;
      case "iv": degree = 3; chordType = "minor"; break;
      case "V": degree = 4; chordType = "major"; break;
      case "V7": degree = 4; chordType = "7"; break;
      case "vi": degree = 5; chordType = "minor"; break;
      case "VI": degree = 5; chordType = "major"; break;
      case "VII": degree = 6; chordType = "major"; break;
      case "vii°": degree = 6; chordType = "dim"; break;
      case "Imaj7": degree = 0; chordType = "maj7"; break;
      case "I64": degree = 0; chordType = "major"; is64 = true; break;
      default: degree = 0; chordType = "major";
    }

    const rootSemi = (tonicSemi + scaleOffsets[degree]) % 12;
    const rootName = useFlat ? NOTE_NAMES_FLAT[rootSemi] : NOTE_NAMES_SHARP[rootSemi];

    let intervals = [0, 4, 7];
    if (chordType === "minor") intervals = [0, 3, 7];
    else if (chordType === "dim") intervals = [0, 3, 6];
    else if (chordType === "7") intervals = [0, 4, 7, 10];
    else if (chordType === "maj7") intervals = [0, 4, 7, 11];
    else if (chordType === "m7") intervals = [0, 3, 7, 10];

    // LH Bass pitch: normally root in octave 2 or 3; for I64 bass is 5th of triad
    const bassDegreeOffset = is64 ? scaleOffsets[(degree + 4) % 7] : scaleOffsets[degree];
    const bassSemi = (tonicSemi + bassDegreeOffset) % 12;
    const bassName = (useFlat ? NOTE_NAMES_FLAT[bassSemi] : NOTE_NAMES_SHARP[bassSemi]) + (bassSemi < 5 ? "3" : "2");

    const chordPitchClasses = intervals.map(int => (rootSemi + int) % 12);

    return {
      numeral,
      keyRoot,
      rootName,
      chordType,
      chordName: `${rootName}${chordType === 'minor' ? 'm' : chordType === '7' ? '7' : chordType === 'maj7' ? 'maj7' : chordType === 'm7' ? 'm7' : chordType === 'dim' ? 'dim' : ''}${is64 ? ' (6/4)' : ''}`,
      rootSemi,
      intervals,
      pitchClasses: chordPitchClasses,
      lhBassPitch: bassName,
      is64
    };
  }

  // Voice-Leading Optimizer: Minimizes total semitone finger displacement between successive chords
  function optimizeProgressionVoiceLeading(keyRoot = "C", progressionKey = "pop_anthem") {
    const template = PROGRESSION_TEMPLATES[progressionKey] || PROGRESSION_TEMPLATES.pop_anthem;
    const chords = template.numerals.map(num => getNumeralChordInfo(keyRoot, num));

    const voicedSteps = [];
    let prevVoicingMidis = null;

    for (let cIdx = 0; cIdx < chords.length; cIdx++) {
      const chord = chords[cIdx];

      if (cIdx === 0) {
        // Initial chord: close root position centered in octave 4 (MIDI 60-68)
        let rootMidi = 60 + ((chord.rootSemi - (60 % 12) + 12) % 12);
        if (rootMidi > 67) rootMidi -= 12;
        const rhMidis = chord.intervals.map(int => rootMidi + int);
        prevVoicingMidis = rhMidis;

        const useFlat = keyRoot.includes("b") || ["F", "Bb", "Eb", "Ab"].includes(keyRoot);
        const rhPitches = rhMidis.map(m => midiToPitch(m, useFlat));

        voicedSteps.push({
          index: cIdx,
          numeral: chord.numeral,
          chordName: chord.chordName,
          lhPitch: chord.lhBassPitch,
          lhMidi: pitchToMidi(chord.lhBassPitch),
          rhMidis: rhMidis,
          rhPitches: rhPitches,
          voicingName: "Root Position",
          semitoneMovement: 0,
          description: template.description
        });
      } else {
        // Evaluate candidate voicings across inversions and octaves (MIDI 53 to 84)
        const candidateVoicings = [];
        const numVoices = chord.intervals.length;

        for (let oct = 3; oct <= 5; oct++) {
          const baseRoot = (oct + 1) * 12 + chord.rootSemi;
          for (let inv = 0; inv < numVoices; inv++) {
            const rawMidis = chord.intervals.map((int, i) => {
              const noteM = baseRoot + int;
              return i < inv ? noteM + 12 : noteM;
            }).sort((a, b) => a - b);

            if (rawMidis[0] >= 53 && rawMidis[rawMidis.length - 1] <= 84) {
              candidateVoicings.push({
                midis: rawMidis,
                inversionName: inv === 0 ? "Root Position" : inv === 1 ? "1st Inversion" : inv === 2 ? "2nd Inversion" : "3rd Inversion"
              });
            }
          }
        }

        // Minimize distance metric: sum |curr[i] - prev[i]|
        let bestCandidate = candidateVoicings[0] || { midis: prevVoicingMidis, inversionName: "Root Position" };
        let minCost = Infinity;

        candidateVoicings.forEach(cand => {
          let cost = 0;
          const len = Math.min(cand.midis.length, prevVoicingMidis.length);
          for (let v = 0; v < len; v++) {
            cost += Math.abs(cand.midis[v] - prevVoicingMidis[v]);
          }
          if (cand.midis.length !== prevVoicingMidis.length) {
            cost += Math.abs(cand.midis.length - prevVoicingMidis.length) * 4;
          }
          // Slight penalty for moving too far from middle C range (MIDI 65)
          const avgPitch = cand.midis.reduce((s, m) => s + m, 0) / cand.midis.length;
          cost += Math.abs(avgPitch - 65) * 0.25;

          if (cost < minCost) {
            minCost = cost;
            bestCandidate = cand;
          }
        });

        const useFlat = keyRoot.includes("b") || ["F", "Bb", "Eb", "Ab"].includes(keyRoot);
        const rhPitches = bestCandidate.midis.map(m => midiToPitch(m, useFlat));

        voicedSteps.push({
          index: cIdx,
          numeral: chord.numeral,
          chordName: chord.chordName,
          lhPitch: chord.lhBassPitch,
          lhMidi: pitchToMidi(chord.lhBassPitch),
          rhMidis: bestCandidate.midis,
          rhPitches: rhPitches,
          voicingName: bestCandidate.inversionName,
          semitoneMovement: Math.round(minCost),
          description: template.description
        });

        prevVoicingMidis = bestCandidate.midis;
      }
    }

    return {
      progressionId: progressionKey,
      progressionName: template.name,
      description: template.description,
      key: keyRoot,
      steps: voicedSteps,
      totalMovement: voicedSteps.reduce((sum, s) => sum + s.semitoneMovement, 0)
    };
  }

  // REAL-TIME POLYPHONIC CHORD RECOGNITION ENGINE
  function identifyActiveChord(activeNotesArray) {
    if (!activeNotesArray || activeNotesArray.length === 0) return null;

    // Normalize input to array of { num: number, pitch: string }
    const normalizedNotes = activeNotesArray.map(item => {
      if (typeof item === "string") {
        const num = pitchToMidi(item);
        return { num, pitch: item };
      }
      if (item && typeof item.num === "number") {
        return { num: item.num, pitch: item.pitch || midiToPitch(item.num) };
      }
      return null;
    }).filter(Boolean);

    if (normalizedNotes.length === 0) return null;
    if (normalizedNotes.length === 1) {
      const rootName = NOTE_NAMES_SHARP[normalizedNotes[0].num % 12];
      return { name: normalizedNotes[0].pitch, type: "Single Pitch", root: rootName };
    }

    const sorted = [...normalizedNotes].sort((a, b) => a.num - b.num);
    const bassPc = sorted[0].num % 12;
    const bassName = NOTE_NAMES_SHARP[bassPc];
    const uniquePitchClasses = [...new Set(sorted.map(n => n.num % 12))];

    // 1. Octaves & Unisons (all notes share same pitch class)
    if (uniquePitchClasses.length === 1) {
      const rootName = NOTE_NAMES_SHARP[uniquePitchClasses[0]];
      return { name: `${rootName} Octave`, type: "Octave / Unison", root: rootName };
    }

    // 2. Dyads & 2-Pitch-Class Combinations
    if (uniquePitchClasses.length === 2) {
      const p1 = sorted[0].num % 12;
      const p2 = sorted.find(n => (n.num % 12) !== p1).num % 12;
      const diff = (p2 - p1 + 12) % 12;

      if (diff === 7) {
        return { name: `${NOTE_NAMES_SHARP[p1]}5`, type: "Power Chord", root: NOTE_NAMES_SHARP[p1] };
      }
      if (diff === 5) {
        return { name: `${NOTE_NAMES_SHARP[p2]}5 / ${NOTE_NAMES_SHARP[p1]}`, type: "Inverted 5th", root: NOTE_NAMES_SHARP[p2] };
      }

      const intervalNames = {
        1: "Minor 2nd", 2: "Major 2nd", 3: "Minor 3rd", 4: "Major 3rd",
        5: "Perfect 4th", 6: "Tritone", 7: "Perfect 5th",
        8: "Minor 6th", 9: "Major 6th", 10: "Minor 7th", 11: "Major 7th"
      };
      const chordName = `${NOTE_NAMES_SHARP[p1]} + ${NOTE_NAMES_SHARP[p2]}`;
      return { name: chordName, type: intervalNames[diff] || "Dyad", root: NOTE_NAMES_SHARP[p1] };
    }

    // 3. Triads, 7ths, 9ths, Shells & Inversions
    const chordDefinitions = [
      // Standard Triads
      { sig: "0,4,7", nameSuffix: "Major", type: "Major Triad" },
      { sig: "0,3,7", nameSuffix: "Minor", type: "Minor Triad" },
      { sig: "0,3,6", nameSuffix: "Diminished", type: "Dim Triad" },
      { sig: "0,4,8", nameSuffix: "Augmented", type: "Aug Triad" },
      { sig: "0,5,7", nameSuffix: "sus4", type: "Suspended 4th" },
      { sig: "0,2,7", nameSuffix: "sus2", type: "Suspended 2nd" },

      // 7th Chords
      { sig: "0,4,7,11", nameSuffix: "maj7", type: "Major 7th" },
      { sig: "0,4,7,10", nameSuffix: "7", type: "Dominant 7th" },
      { sig: "0,3,7,10", nameSuffix: "m7", type: "Minor 7th" },
      { sig: "0,3,6,10", nameSuffix: "m7b5", type: "Half-Diminished 7th" },
      { sig: "0,3,6,9", nameSuffix: "dim7", type: "Diminished 7th" },
      { sig: "0,3,7,11", nameSuffix: "m(maj7)", type: "Minor-Major 7th" },
      { sig: "0,4,8,10", nameSuffix: "aug7", type: "Augmented 7th" },
      { sig: "0,2,7,10", nameSuffix: "7sus4", type: "Suspended 7th" },

      // 6th Chords
      { sig: "0,4,7,9", nameSuffix: "6", type: "6th Chord" },
      { sig: "0,3,7,9", nameSuffix: "m6", type: "Minor 6th" },

      // Added tone chords
      { sig: "0,2,4,7", nameSuffix: "add9", type: "Add9 Chord" },
      { sig: "0,2,3,7", nameSuffix: "m(add9)", type: "Minor Add9" },

      // Shell Voicings (No 5th)
      { sig: "0,4,10", nameSuffix: "7 (no 5th)", type: "Dominant 7th Shell" },
      { sig: "0,4,11", nameSuffix: "maj7 (no 5th)", type: "Major 7th Shell" },
      { sig: "0,3,10", nameSuffix: "m7 (no 5th)", type: "Minor 7th Shell" },

      // Extended 9ths
      { sig: "0,2,4,7,10", nameSuffix: "9", type: "Dominant 9th" },
      { sig: "0,2,4,7,11", nameSuffix: "maj9", type: "Major 9th" },
      { sig: "0,2,3,7,10", nameSuffix: "m9", type: "Minor 9th" }
    ];

    const matches = [];

    for (let r of uniquePitchClasses) {
      const rootName = NOTE_NAMES_SHARP[r];
      const intervals = uniquePitchClasses.map(pc => (pc - r + 12) % 12).sort((a, b) => a - b);
      const sig = intervals.join(",");

      for (const def of chordDefinitions) {
        if (sig === def.sig) {
          const isRootPosition = (bassPc === r);
          const separator = /^[0-9]|^(maj|m[0-9]|sus|dim|aug|add)/.test(def.nameSuffix) ? "" : " ";
          let chordName = `${rootName}${separator}${def.nameSuffix}`.trim();
          let chordType = def.type;

          if (!isRootPosition) {
            chordName = `${chordName} / ${bassName}`;
            const bassInterval = (bassPc - r + 12) % 12;
            if (bassInterval === 3 || bassInterval === 4) {
              chordType = "1st Inversion";
            } else if (bassInterval === 6 || bassInterval === 7 || bassInterval === 8) {
              chordType = "2nd Inversion";
            } else if (bassInterval === 9 || bassInterval === 10 || bassInterval === 11) {
              chordType = "3rd Inversion";
            } else {
              chordType = "Slash Chord";
            }
          }

          matches.push({
            root: r,
            rootName,
            isRootPosition,
            name: chordName,
            type: chordType,
            def
          });
        }
      }
    }

    if (matches.length > 0) {
      // Prioritize root-position match where bass matches candidate root
      const rootPosMatch = matches.find(m => m.isRootPosition);
      if (rootPosMatch) {
        return { name: rootPosMatch.name, type: rootPosMatch.type, root: rootPosMatch.rootName };
      }
      return { name: matches[0].name, type: matches[0].type, root: matches[0].rootName };
    }

    const pitchPills = sorted.map(n => n.pitch).join(" + ");
    return { name: pitchPills, type: "Multi-Note Cluster", root: bassName };
  }

  // STANDARD KEYBOARD HARDWARE PRESETS
  const STANDARD_KEYBOARD_PRESETS = [
    { id: "88", name: "88 Keys (Full Grand: A0 – C8)", count: 88, startMidi: 21, endMidi: 108 },
    { id: "76", name: "76 Keys (Stage: E1 – G7)", count: 76, startMidi: 28, endMidi: 103 },
    { id: "73", name: "73 Keys (Stage: E1 – E7)", count: 73, startMidi: 28, endMidi: 100 },
    { id: "61", name: "61 Keys (Standard: C2 – C7)", count: 61, startMidi: 36, endMidi: 96 },
    { id: "49", name: "49 Keys (Studio: C2 – C6)", count: 49, startMidi: 36, endMidi: 84 },
    { id: "37", name: "37 Keys (Default: C2 – C5)", count: 37, startMidi: 36, endMidi: 72 },
    { id: "32", name: "32 Keys (Mini Synth: F2 – C5)", count: 32, startMidi: 41, endMidi: 72 },
    { id: "25", name: "25 Keys (Mini: C3 – C5)", count: 25, startMidi: 48, endMidi: 72 }
  ];

  function extractTokensPitches(voiceStr) {
    if (!voiceStr) return [];
    const tokens = voiceStr.split("|").join(" ").split(/\s+/).filter(Boolean);
    const pitches = [];
    for (const t of tokens) {
      const clean = t.replace(/~/g, "");
      const [pitchPart] = clean.split(":");
      if (!pitchPart || pitchPart === "-") continue;
      const subNotes = pitchPart.split("+").filter(p => p && p !== "-");
      pitches.push(...subNotes);
    }
    return pitches;
  }

  function getRangeFromMidis(midiArray) {
    if (!midiArray || midiArray.length === 0) {
      return { minMidi: null, maxMidi: null, minPitch: null, maxPitch: null, span: 0, count: 0 };
    }
    const minMidi = Math.min(...midiArray);
    const maxMidi = Math.max(...midiArray);
    return {
      minMidi,
      maxMidi,
      minPitch: midiToPitch(minMidi),
      maxPitch: midiToPitch(maxMidi),
      span: maxMidi - minMidi + 1,
      count: midiArray.length
    };
  }

  function getSongPitchRange(song, options = { rh: true, lh: true, dyads: true }) {
    if (!song) return { minMidi: 60, maxMidi: 60, minPitch: "C4", maxPitch: "C4", span: 1 };
    
    const rhPitches = extractTokensPitches(song.rh);
    const lhPitches = extractTokensPitches(song.lh);
    const dyadPitches = extractTokensPitches(song.dyads);

    const rhMidis = rhPitches.map(p => pitchToMidi(p)).filter(m => m !== null);
    const lhMidis = lhPitches.map(p => pitchToMidi(p)).filter(m => m !== null);
    const dyadMidis = dyadPitches.map(p => pitchToMidi(p)).filter(m => m !== null);

    const rhRange = getRangeFromMidis(rhMidis);
    const lhRange = getRangeFromMidis(lhMidis);
    const dyadRange = getRangeFromMidis(dyadMidis);

    const allMidis = [...rhMidis, ...lhMidis, ...dyadMidis];
    const totalRange = getRangeFromMidis(allMidis);

    const effectiveMidis = [];
    if (options.rh !== false) effectiveMidis.push(...rhMidis);
    if (options.lh !== false) effectiveMidis.push(...lhMidis);
    if (options.dyads !== false) effectiveMidis.push(...dyadMidis);

    const selectedMidis = effectiveMidis.length > 0 ? effectiveMidis : allMidis;
    const effectiveRange = getRangeFromMidis(selectedMidis);

    const presetsAscending = [...STANDARD_KEYBOARD_PRESETS].sort((a, b) => a.count - b.count);
    const minSpanPreset = presetsAscending.find(p => p.count >= effectiveRange.span) || STANDARD_KEYBOARD_PRESETS[0];
    const minExactPreset = presetsAscending.find(p => p.startMidi <= effectiveRange.minMidi && p.endMidi >= effectiveRange.maxMidi) || STANDARD_KEYBOARD_PRESETS[0];

    return {
      minMidi: effectiveRange.minMidi,
      maxMidi: effectiveRange.maxMidi,
      minPitch: effectiveRange.minPitch,
      maxPitch: effectiveRange.maxPitch,
      span: effectiveRange.span,
      rh: rhRange,
      lh: lhRange,
      dyads: dyadRange,
      total: totalRange,
      minSpanPreset,
      minExactPreset
    };
  }

  function evaluateSongKeyboardCompatibility(song, keyboardConfig = {}, options = { rh: true, lh: true, dyads: true }) {
    const startMidi = typeof keyboardConfig.startMidi === "number" ? keyboardConfig.startMidi : 36;
    const keyCount = typeof keyboardConfig.keyCount === "number" ? keyboardConfig.keyCount : 37;
    const endMidi = startMidi + keyCount - 1;

    const range = getSongPitchRange(song, options);
    if (range.minMidi === null) {
      return {
        fitsExact: true,
        fitsSpan: true,
        status: "fits",
        statusMessage: "Fits keyboard",
        notesBelow: 0,
        notesAbove: 0,
        shiftNeeded: 0,
        range,
        recommendedPreset: "37"
      };
    }

    const fitsExact = (range.minMidi >= startMidi && range.maxMidi <= endMidi);
    const fitsSpan = (range.span <= keyCount);
    const notesBelow = Math.max(0, startMidi - range.minMidi);
    const notesAbove = Math.max(0, range.maxMidi - endMidi);

    let shiftNeeded = 0;
    if (fitsSpan && !fitsExact) {
      if (range.minMidi < startMidi) {
        shiftNeeded = range.minMidi - startMidi;
      } else if (range.maxMidi > endMidi) {
        shiftNeeded = range.maxMidi - endMidi;
      }
    }

    let status = "fits";
    let statusMessage = `Fits ${keyCount}-Key keyboard (${range.minPitch} – ${range.maxPitch})`;

    if (!fitsExact) {
      if (fitsSpan) {
        status = "shift_needed";
        const octaves = Math.round(shiftNeeded / 12);
        const octStr = Math.abs(octaves) >= 1 ? ` (${octaves > 0 ? '+' : ''}${octaves} oct)` : "";
        statusMessage = `Fits with shift: ${shiftNeeded > 0 ? '+' : ''}${shiftNeeded} semitones${octStr}`;
      } else {
        status = "exceeds";
        statusMessage = `Exceeds ${keyCount}-Key keyboard: needs ${range.span} keys (${range.minPitch} – ${range.maxPitch})`;
      }
    }

    return {
      fitsExact,
      fitsSpan,
      status,
      statusMessage,
      notesBelow,
      notesAbove,
      shiftNeeded,
      range,
      recommendedPreset: range.minExactPreset ? range.minExactPreset.id : "88",
      recommendedPresetName: range.minExactPreset ? range.minExactPreset.name : "88 Keys"
    };
  }

  // ==========================================
  // PIANO NOTES CHEAT SHEET ENGINE & DATA MODEL
  // Based on pianoNotesCheatSheet.png
  // ==========================================
  const CHEAT_SHEET_NOTE_COLORS = {
    'C': '#ef4444', // Vibrant Red (Middle C prominent)
    'D': '#8b5cf6', // Purple / Violet
    'E': '#1e40af', // Navy / Deep Indigo
    'F': '#0284c7', // Bright Sky Blue / Cyan
    'G': '#14b8a6', // Seafoam / Mint Teal
    'A': '#f97316', // Warm Orange / Peach
    'B': '#10b981'  // Emerald Green
  };

  const CHEAT_SHEET_ACCIDENTAL_COLORS = {
    'C#': '#dc2626', 'Db': '#dc2626',
    'D#': '#7c3aed', 'Eb': '#7c3aed',
    'F#': '#0284c7', 'Gb': '#0284c7',
    'G#': '#0d9488', 'Ab': '#0d9488',
    'A#': '#ea580c', 'Bb': '#ea580c'
  };

  function getCheatSheetNoteColor(pitchStr) {
    if (!pitchStr || pitchStr === "-") return "#64748b";
    const clean = pitchStr.trim().replace(/[0-9]/g, "");
    if (CHEAT_SHEET_ACCIDENTAL_COLORS[clean]) {
      return CHEAT_SHEET_ACCIDENTAL_COLORS[clean];
    }
    const letter = clean.charAt(0).toUpperCase();
    return CHEAT_SHEET_NOTE_COLORS[letter] || "#64748b";
  }

  // Grand staff & mnemonic definitions from pianoNotesCheatSheet.png
  const CHEAT_SHEET_STAFF_MAP = {
    'G2': { clef: 'bass', role: 'line', index: 1, posText: 'Bass Clef • Line 1', mnemonic: 'Good (Line 1)' },
    'A2': { clef: 'bass', role: 'space', index: 1, posText: 'Bass Clef • Space 1', mnemonic: 'All (Space 1)' },
    'B2': { clef: 'bass', role: 'line', index: 2, posText: 'Bass Clef • Line 2', mnemonic: 'Boys (Line 2)' },
    'C3': { clef: 'bass', role: 'space', index: 2, posText: 'Bass Clef • Space 2', mnemonic: 'Cows (Space 2)' },
    'D3': { clef: 'bass', role: 'line', index: 3, posText: 'Bass Clef • Line 3', mnemonic: 'Do (Line 3)' },
    'E3': { clef: 'bass', role: 'space', index: 3, posText: 'Bass Clef • Space 3', mnemonic: 'Eat (Space 3)' },
    'F3': { clef: 'bass', role: 'line', index: 4, posText: 'Bass Clef • Line 4 (F Clef Line)', mnemonic: 'Fine (Line 4)' },
    'G3': { clef: 'bass', role: 'space', index: 4, posText: 'Bass Clef • Space 4', mnemonic: 'Grass (Space 4)' },
    'A3': { clef: 'bass', role: 'line', index: 5, posText: 'Bass Clef • Line 5 (Top line)', mnemonic: 'Always (Line 5)', altClef: 'treble', altRole: 'ledger', altPosText: 'Treble • 2nd Ledger Line Below' },
    'B3': { clef: 'bass', role: 'space_above', index: 5, posText: 'Bass Clef • Space Above Line 5', mnemonic: 'Above Staff', altClef: 'treble', altRole: 'space_below_ledger', altPosText: 'Treble • Space Below Middle C' },
    'C4': { clef: 'grand-bridge', role: 'ledger', index: 0, isMiddleC: true, posText: '⭐ MIDDLE C • Center Bridge Ledger Line', mnemonic: 'Middle C (Central Ledger Line)' },
    'D4': { clef: 'treble', role: 'space_below', index: 1, posText: 'Treble Clef • Space Below Line 1', mnemonic: 'Below Staff', altClef: 'bass', altRole: 'space_above_ledger', altPosText: 'Bass • Space Above Middle C' },
    'E4': { clef: 'treble', role: 'line', index: 1, posText: 'Treble Clef • Line 1 (Bottom line)', mnemonic: 'Every (Line 1)', altClef: 'bass', altRole: 'ledger', altPosText: 'Bass • 2nd Ledger Line Above' },
    'F4': { clef: 'treble', role: 'space', index: 1, posText: 'Treble Clef • Space 1', mnemonic: 'F (FACE Space 1)' },
    'G4': { clef: 'treble', role: 'line', index: 2, posText: 'Treble Clef • Line 2 (G Clef Line)', mnemonic: 'Good (Line 2)' },
    'A4': { clef: 'treble', role: 'space', index: 2, posText: 'Treble Clef • Space 2', mnemonic: 'A (FACE Space 2)' },
    'B4': { clef: 'treble', role: 'line', index: 3, posText: 'Treble Clef • Line 3', mnemonic: 'Boy (Line 3)' },
    'C5': { clef: 'treble', role: 'space', index: 3, posText: 'Treble Clef • Space 3', mnemonic: 'C (FACE Space 3)' },
    'D5': { clef: 'treble', role: 'line', index: 4, posText: 'Treble Clef • Line 4', mnemonic: 'Does (Line 4)' },
    'E5': { clef: 'treble', role: 'space', index: 4, posText: 'Treble Clef • Space 4', mnemonic: 'E (FACE Space 4)' },
    'F5': { clef: 'treble', role: 'line', index: 5, posText: 'Treble Clef • Line 5 (Top line)', mnemonic: 'Fine (Line 5)' },
    'G5': { clef: 'treble', role: 'space_above', index: 5, posText: 'Treble Clef • Space Above Line 5', mnemonic: 'Above Staff' }
  };

  function getCheatSheetStaffInfo(pitchStr) {
    if (!pitchStr || pitchStr === "-") return null;
    const clean = pitchStr.trim();
    const letter = clean.charAt(0).toUpperCase();
    const octMatch = clean.match(/[0-9]/);
    const oct = octMatch ? parseInt(octMatch[0], 10) : 4;
    const isMidC = (clean === "C4");
    const color = getCheatSheetNoteColor(clean);
    const midi = pitchToMidi(clean);
    const freq = midiToFreq(midi);

    const baseInfo = CHEAT_SHEET_STAFF_MAP[clean];
    if (baseInfo) {
      return {
        pitch: clean,
        letter,
        octave: oct,
        color,
        midi,
        freq,
        isMiddleC: isMidC,
        clef: baseInfo.clef,
        staffRole: baseInfo.role,
        staffIndex: baseInfo.index,
        staffPosition: baseInfo.posText,
        mnemonic: baseInfo.mnemonic,
        altClef: baseInfo.altClef || null,
        altRole: baseInfo.altRole || null,
        altPosText: baseInfo.altPosText || null
      };
    }

    // Extrapolate for pitches outside the standard 22-note range
    const clef = (midi >= 60) ? "treble" : "bass";
    return {
      pitch: clean,
      letter,
      octave: oct,
      color,
      midi,
      freq,
      isMiddleC: isMidC,
      clef: clef,
      staffRole: 'extended',
      staffIndex: 0,
      staffPosition: `${clef === "treble" ? "High Treble" : "Low Bass"} • Octave ${oct}`,
      mnemonic: `${letter} in Octave ${oct}`,
      altClef: null,
      altRole: null,
      altPosText: null
    };
  }

  // Canonical 22 diatonic white keys from pianoNotesCheatSheet.png (G2 to G5)
  const CHEAT_SHEET_NOTES_RANGE = [
    "G2", "A2", "B2", "C3", "D3", "E3", "F3", "G3", "A3", "B3",
    "C4",
    "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5"
  ].map(p => getCheatSheetStaffInfo(p));

  // ==========================================
  // METRONOME & TIME SIGNATURE EQUAL DIVISIONS ENGINE
  // ==========================================

  const TIME_SIGNATURE_NAMES = {
    "4/4": "4/4 (Common Time)",
    "3/4": "3/4 (Waltz Time)",
    "2/4": "2/4 (March Time)",
    "6/8": "6/8 (Compound Duple)",
    "3/8": "3/8 (Compound Single)",
    "5/4": "5/4 (Odd Meter)",
    "7/8": "7/8 (Complex Meter)",
    "9/8": "9/8 (Compound Triple)",
    "12/8": "12/8 (Compound Quadruple)"
  };

  /**
   * Parse a time signature string (e.g. "4/4", "3/4", "6/8", or integer 4).
   * Computes numerator, denominator, beat unit in quarter notes, and compound status.
   */
  function parseTimeSignature(timeSigStr) {
    if (!timeSigStr) timeSigStr = "4/4";
    let num = 4;
    let den = 4;

    if (typeof timeSigStr === "number") {
      num = timeSigStr;
      den = 4;
    } else {
      const parts = String(timeSigStr).trim().split("/");
      num = parseInt(parts[0], 10) || 4;
      den = parts[1] ? (parseInt(parts[1], 10) || 4) : 4;
    }

    const timeSig = `${num}/${den}`;
    const beatUnitBeats = 4 / den; // quarter note duration equivalency
    const measureQuarterBeats = num * beatUnitBeats;
    const isCompound = (den === 8 || den === 16) && (num % 3 === 0 && num > 3);
    const compoundBeats = isCompound ? num / 3 : num;
    const name = TIME_SIGNATURE_NAMES[timeSig] || `${timeSig} Time`;

    return {
      numerator: num,
      denominator: den,
      timeSig,
      name,
      beatUnitBeats,
      measureQuarterBeats,
      isCompound,
      compoundBeats
    };
  }

  /**
   * Calculate sample-accurate equal divisions for metronome ticks across any time signature.
   * @param {number} bpm - Beats per minute (quarter notes per minute)
   * @param {string|number} timeSigStr - Time signature (e.g. "4/4", "3/4", "6/8")
   * @param {number} subdivision - Equal divisions per beat (1 = quarter/beat unit, 2 = eighths, 3 = triplets, 4 = sixteenths)
   */
  function calculateMetronomeIntervals(bpm, timeSigStr = "4/4", subdivision = 1) {
    const validBpm = Math.max(20, Math.min(300, parseInt(bpm, 10) || 96));
    const validSubdiv = Math.max(1, Math.min(8, parseInt(subdivision, 10) || 1));
    const ts = parseTimeSignature(timeSigStr);

    // Duration of 1 beat unit in seconds (e.g. at 120 BPM: quarter=0.5s, eighth=0.25s)
    const beatIntervalSec = (60.0 / validBpm) * ts.beatUnitBeats;
    // Exactly equal division interval
    const tickIntervalSec = beatIntervalSec / validSubdiv;
    const tickIntervalMs = tickIntervalSec * 1000;
    const ticksPerMeasure = ts.numerator * validSubdiv;
    const measureDurationSec = beatIntervalSec * ts.numerator;

    return {
      bpm: validBpm,
      timeSig: ts.timeSig,
      numerator: ts.numerator,
      denominator: ts.denominator,
      beatUnitBeats: ts.beatUnitBeats,
      subdivision: validSubdiv,
      ticksPerMeasure,
      beatIntervalSec,
      tickIntervalSec,
      tickIntervalMs,
      measureDurationSec,
      isCompound: ts.isCompound
    };
  }

  /**
   * Returns musical accent hierarchy, frequency and volume for a specific tick in a measure.
   * Ensures distinct auditory cues for downbeat, secondary strong beats, regular beats, and equal subdivisions.
   */
  function getMetronomeTickProfile(tickIndex, ticksPerMeasure, timeSigStr = "4/4", subdivision = 1) {
    const validSubdiv = Math.max(1, parseInt(subdivision, 10) || 1);
    const ts = parseTimeSignature(timeSigStr);
    const modTick = ((tickIndex % ticksPerMeasure) + ticksPerMeasure) % ticksPerMeasure;
    const isDownbeat = modTick === 0;
    const isBeatOnset = modTick % validSubdiv === 0;
    const beatIndex = Math.floor(modTick / validSubdiv); // 0-indexed beat (0..num-1)
    const beatNumber = beatIndex + 1; // 1-indexed

    let accentType = "beat";
    let freq = 640;
    let volume = 0.6;

    if (isDownbeat) {
      accentType = "downbeat";
      freq = 1200;
      volume = 1.0;
    } else if (isBeatOnset) {
      // Check secondary accents in common meters
      let isSecondary = false;
      if (ts.numerator === 4 && beatIndex === 2) {
        // Beat 3 in 4/4
        isSecondary = true;
      } else if (ts.numerator === 6 && beatIndex === 3) {
        // Beat 4 in 6/8
        isSecondary = true;
      } else if (ts.numerator === 12 && (beatIndex === 3 || beatIndex === 6 || beatIndex === 9)) {
        // Beats 4, 7, 10 in 12/8
        isSecondary = true;
      } else if (ts.numerator === 9 && (beatIndex === 3 || beatIndex === 6)) {
        // Beats 4, 7 in 9/8
        isSecondary = true;
      }

      if (isSecondary) {
        accentType = "secondary";
        freq = 900;
        volume = 0.75;
      } else {
        accentType = "beat";
        freq = 640;
        volume = 0.6;
      }
    } else {
      accentType = "subdivision";
      freq = 420;
      volume = 0.35;
    }

    return {
      tickIndex: modTick,
      beatNumber,
      beatIndex,
      isDownbeat,
      isBeatOnset,
      isSubdivision: !isBeatOnset,
      accentType,
      freq,
      volume
    };
  }

  const METRONOME_SOUND_PRESETS = [
    { id: "woodblock", label: "🪵 Wood Block", description: "Hollow resonant woodblock percussion (Default)" },
    { id: "mechanical", label: "⏱️ Mechanical Tick", description: "Classic pendulum wooden cabinet metronome" },
    { id: "digital", label: "⚡ Digital Beep", description: "Modern electronic precision sine beep" },
    { id: "cowbell", label: "🔔 Cowbell / Agogô", description: "Metallic dual-mode percussion bell" },
    { id: "stick", label: "🥁 Rimshot / Sticks", description: "Acoustic drumstick cross-stick click" }
  ];

  /**
   * Returns synthesis parameters for a given metronome sound and accent hierarchy.
   */
  function getMetronomeSoundParameters(soundId = "woodblock", accentType = "beat") {
    const sId = (soundId || "woodblock").toLowerCase();
    const isDownbeat = (accentType === "downbeat");
    const isSecondary = (accentType === "secondary");
    const isSub = (accentType === "subdivision");

    switch (sId) {
      case "mechanical":
        if (isDownbeat) {
          return { clickFreq: 3800, clickDur: 0.005, clickGain: 0.32, thumpFreq: 320, thumpDur: 0.024, thumpGain: 0.40 };
        } else if (isSecondary) {
          return { clickFreq: 3400, clickDur: 0.004, clickGain: 0.22, thumpFreq: 280, thumpDur: 0.020, thumpGain: 0.28 };
        } else if (isSub) {
          return { clickFreq: 2800, clickDur: 0.003, clickGain: 0.12, thumpFreq: 200, thumpDur: 0.014, thumpGain: 0.16 };
        }
        return { clickFreq: 3200, clickDur: 0.004, clickGain: 0.18, thumpFreq: 240, thumpDur: 0.018, thumpGain: 0.24 };

      case "digital":
        if (isDownbeat) {
          return { freq: 1600, gain: 0.38, dur: 0.042 };
        } else if (isSecondary) {
          return { freq: 1050, gain: 0.28, dur: 0.035 };
        } else if (isSub) {
          return { freq: 520, gain: 0.16, dur: 0.025 };
        }
        return { freq: 800, gain: 0.24, dur: 0.032 };

      case "cowbell":
        if (isDownbeat) {
          return { freq1: 800, freq2: 1240, filterFreq: 1000, filterQ: 6.0, gain: 0.40, dur: 0.080 };
        } else if (isSecondary) {
          return { freq1: 650, freq2: 1000, filterFreq: 850, filterQ: 6.0, gain: 0.30, dur: 0.070 };
        } else if (isSub) {
          return { freq1: 420, freq2: 650, filterFreq: 600, filterQ: 5.0, gain: 0.16, dur: 0.050 };
        }
        return { freq1: 540, freq2: 840, filterFreq: 750, filterQ: 5.5, gain: 0.26, dur: 0.065 };

      case "stick":
        if (isDownbeat) {
          return { freq1: 2400, freq2: 1800, filterFreq: 2200, filterQ: 4.0, gain: 0.42, dur: 0.022 };
        } else if (isSecondary) {
          return { freq1: 2100, freq2: 1600, filterFreq: 1900, filterQ: 4.0, gain: 0.30, dur: 0.018 };
        } else if (isSub) {
          return { freq1: 1500, freq2: 1200, filterFreq: 1400, filterQ: 3.5, gain: 0.16, dur: 0.014 };
        }
        return { freq1: 1900, freq2: 1450, filterFreq: 1750, filterQ: 4.0, gain: 0.26, dur: 0.016 };

      case "woodblock":
      default:
        if (isDownbeat) {
          return { freq1: 1220, freq2: 1928, filterFreq: 1320, filterQ: 5.5, gain: 0.46, dur: 0.052 };
        } else if (isSecondary) {
          return { freq1: 980, freq2: 1550, filterFreq: 1060, filterQ: 5.5, gain: 0.36, dur: 0.046 };
        } else if (isSub) {
          return { freq1: 640, freq2: 1010, filterFreq: 700, filterQ: 5.0, gain: 0.20, dur: 0.035 };
        }
        return { freq1: 860, freq2: 1360, filterFreq: 930, filterQ: 5.5, gain: 0.30, dur: 0.042 };
    }
  }

  /**
   * Synthesizes authentic metronome clicks across sound presets (Wood Block, Mechanical, Digital, Cowbell, Stick).
   * Fully scheduled in Web Audio API.
   */
  function synthesizeMetronomeClick(audioCtx, destinationNode, time, accentType = "beat", soundId = "woodblock", volScale = 1.0) {
    if (!audioCtx) return null;
    const dest = destinationNode || audioCtx.destination;
    const t = (typeof time === "number" && !isNaN(time)) ? time : audioCtx.currentTime;
    const sId = (soundId || "woodblock").toLowerCase();
    const effectiveVol = Math.max(0, Math.min(1, parseFloat(volScale) || 0));
    if (effectiveVol <= 0.0001) return null;

    const params = getMetronomeSoundParameters(sId, accentType);

    if (sId === "mechanical") {
      const oscClick = audioCtx.createOscillator();
      const clickGain = audioCtx.createGain();
      const clickFilter = audioCtx.createBiquadFilter();

      clickFilter.type = "bandpass";
      clickFilter.frequency.setValueAtTime(params.clickFreq, t);
      clickFilter.Q.setValueAtTime(4.0, t);

      oscClick.type = "triangle";
      oscClick.frequency.setValueAtTime(params.clickFreq, t);

      const targetClickPeak = params.clickGain * effectiveVol;
      clickGain.gain.setValueAtTime(targetClickPeak, t);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, t + params.clickDur);

      oscClick.connect(clickGain);
      clickGain.connect(clickFilter);
      clickFilter.connect(dest);
      oscClick.start(t);
      oscClick.stop(t + params.clickDur + 0.005);

      const oscThump = audioCtx.createOscillator();
      const thumpGain = audioCtx.createGain();

      oscThump.type = "sine";
      oscThump.frequency.setValueAtTime(params.thumpFreq * 1.15, t);
      oscThump.frequency.exponentialRampToValueAtTime(params.thumpFreq, t + 0.008);

      const targetThumpPeak = params.thumpGain * effectiveVol;
      thumpGain.gain.setValueAtTime(targetThumpPeak, t);
      thumpGain.gain.exponentialRampToValueAtTime(0.0001, t + params.thumpDur);

      oscThump.connect(thumpGain);
      thumpGain.connect(dest);
      oscThump.start(t);
      oscThump.stop(t + params.thumpDur + 0.005);

      return { soundId: sId, accentType, time: t, nodes: [oscClick, oscThump] };
    }

    if (sId === "digital") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(params.freq, t);

      const targetPeak = params.gain * effectiveVol;
      gain.gain.setValueAtTime(targetPeak, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + params.dur);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + params.dur + 0.005);

      return { soundId: sId, accentType, time: t, nodes: [osc] };
    }

    // Default: Wood Block, Cowbell, or Stick (dual-mode resonant percussion)
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    const gain2 = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(params.filterFreq, t);
    filter.Q.setValueAtTime(params.filterQ, t);

    if (sId === "woodblock") {
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(params.freq1 * 1.25, t);
      osc1.frequency.exponentialRampToValueAtTime(params.freq1, t + 0.007);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(params.freq2 * 1.05, t);
      osc2.frequency.exponentialRampToValueAtTime(params.freq2, t + 0.010);
    } else if (sId === "cowbell") {
      osc1.type = "square";
      osc1.frequency.setValueAtTime(params.freq1, t);

      osc2.type = "square";
      osc2.frequency.setValueAtTime(params.freq2, t);
    } else {
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(params.freq1, t);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(params.freq2, t);
    }

    const peak1 = params.gain * effectiveVol;
    gain1.gain.setValueAtTime(peak1, t);
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + params.dur);

    const peak2 = params.gain * 0.45 * effectiveVol;
    gain2.gain.setValueAtTime(peak2, t);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + params.dur * 0.65);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(filter);
    gain2.connect(filter);
    filter.connect(dest);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + params.dur + 0.01);
    osc2.stop(t + params.dur + 0.01);

    return { soundId: sId, accentType, time: t, nodes: [osc1, osc2] };
  }

  /**
   * Generates dynamic count-in array matching the authentic meter of the time signature.
   */
  function getTimeSignatureCountIn(timeSigStr = "4/4", bpm = 96) {
    const ts = parseTimeSignature(timeSigStr);
    const countBeats = [];
    // Count from ts.numerator down to 1, then GO! (num 0)
    for (let b = ts.numerator; b >= 1; b--) {
      const isDownbeat = (b === ts.numerator);
      countBeats.push({
        num: b,
        freq: isDownbeat ? 880 : 440,
        label: String(b)
      });
    }
    countBeats.push({
      num: 0,
      freq: 1046.5,
      label: "GO! 🔥"
    });

    const beatMs = (60 / bpm) * ts.beatUnitBeats * 1000;
    return {
      countBeats,
      beatMs,
      totalCountInMs: (countBeats.length - 1) * beatMs
    };
  }

  // ==========================================
  // OUTPUT DEVICE & MIDI MESSAGE UTILITIES
  // ==========================================

  /**
   * Format standard 3-byte MIDI channel voice message.
   * @param {number} cmd - Command nibble (8 = Note Off, 9 = Note On, 11 = CC)
   * @param {number} data1 - Note number or controller index (0-127)
   * @param {number} data2 - Velocity or controller value (0-127)
   * @param {number} channel - 1-indexed MIDI channel (1-16)
   */
  function formatMidiMessage(cmd, data1, data2, channel = 1) {
    const validCh = Math.max(1, Math.min(16, parseInt(channel, 10) || 1));
    const status = ((cmd & 0x0F) << 4) | ((validCh - 1) & 0x0F);
    const d1 = Math.max(0, Math.min(127, Math.round(data1 || 0)));
    const d2 = Math.max(0, Math.min(127, Math.round(data2 || 0)));
    return [status, d1, d2];
  }

  /**
   * Generates a MIDI Note On message for an output device.
   */
  function createMidiNoteOn(pitchOrMidi, velocity = 80, channel = 1) {
    let noteNum = 60;
    if (typeof pitchOrMidi === "number") {
      noteNum = pitchOrMidi;
    } else if (typeof pitchOrMidi === "string") {
      const parsed = pitchToMidi(pitchOrMidi);
      if (parsed !== null) noteNum = parsed;
    }
    return formatMidiMessage(9, noteNum, velocity, channel);
  }

  /**
   * Generates a MIDI Note Off message for an output device.
   */
  function createMidiNoteOff(pitchOrMidi, channel = 1) {
    let noteNum = 60;
    if (typeof pitchOrMidi === "number") {
      noteNum = pitchOrMidi;
    } else if (typeof pitchOrMidi === "string") {
      const parsed = pitchToMidi(pitchOrMidi);
      if (parsed !== null) noteNum = parsed;
    }
    return formatMidiMessage(8, noteNum, 0, channel);
  }

  /**
   * Generates a MIDI Control Change (e.g. CC 64 Sustain Pedal).
   */
  function createMidiCC(controllerNumber, value, channel = 1) {
    return formatMidiMessage(11, controllerNumber, value, channel);
  }

  /**
   * Classifies an audio device label and deviceId into categories and icons.
   */
  function classifyAudioDevice(label = "", deviceId = "") {
    const l = (label || "").toLowerCase();
    const id = (deviceId || "").toLowerCase();

    if (id === "default" && (!l || l.includes("default"))) {
      return { type: "default", icon: "💻", category: "Default System Output" };
    }
    if (id === "communications" || l.includes("communications")) {
      return { type: "communications", icon: "📞", category: "Communications Device" };
    }
    if (/headphone|headset|earphone|airpod|buds|wh-1000|bose|iem|front.*headphone/i.test(l)) {
      return { type: "headphones", icon: "🎧", category: "Headphones / Headset" };
    }
    if (/hdmi|displayport|nvidia|amd|tv|monitor|screen|ultrawide|lg tv|samsung/i.test(l)) {
      return { type: "display", icon: "🖥️", category: "Monitor / TV / HDMI" };
    }
    if (/focusrite|scarlett|motu|steinberg|behringer|rode|yamaha|komplete|apollo|audio interface|dac|usb audio|sound card/i.test(l)) {
      return { type: "interface", icon: "🎛️", category: "Audio Interface / USB DAC" };
    }
    if (/cable|virtual|voicemeeter|vb-audio|obs|blackhole|virtual-audio|stereo mix/i.test(l)) {
      return { type: "virtual", icon: "🔀", category: "Virtual Cable / Routing" };
    }
    if (/spdif|optical|digital/i.test(l)) {
      return { type: "digital", icon: "⚡", category: "Digital / Optical S/PDIF" };
    }
    if (/speaker|lautsprecher|haut-parleur|realtek/i.test(l)) {
      return { type: "speakers", icon: "🔊", category: "Speakers / Line Out" };
    }
    return { type: "audio", icon: "🔊", category: "Audio Output Device" };
  }

  /**
   * Filters and formats an array of MediaDeviceInfo for audio output destinations.
   */
  function filterAudioOutputDevices(devices) {
    if (!Array.isArray(devices)) return [];
    return devices
      .filter(d => d.kind === "audiooutput")
      .map((d, idx) => {
        const deviceId = d.deviceId || "";
        const rawLabel = d.label || "";
        const fallback = (deviceId === "default" ? "System Default Output" : `Audio Output ${idx + 1}`);
        const label = rawLabel || fallback;
        const info = classifyAudioDevice(label, deviceId);
        return {
          deviceId,
          groupId: d.groupId || "",
          label,
          type: info.type,
          icon: info.icon,
          category: info.category
        };
      });
  }

  /**
   * Parses a score token string (e.g. "C4+E4:2~") into pitch, beats, and tied flag.
   */
  function parseToken(tokenStr) {
    if (!tokenStr || tokenStr === "|") return { pitch: tokenStr, beats: 0, tied: false };
    const tied = tokenStr.includes("~");
    const clean = tokenStr.replace(/~/g, "");
    const parts = clean.split(":");
    const pitch = parts[0];
    const beats = parts[1] ? parseFloat(parts[1]) : 1.0;
    return { pitch, beats, tied };
  }

  /**
   * Computes functional Roman numeral analysis (e.g. "I", "IV", "V7", "vi") for a chord within a song's key.
   */
  function getRomanNumeralAnalysis(chordInfo, song) {
    if (!chordInfo || !chordInfo.name || !song) return null;
    let tonic = "C";
    if (song.category && song.category.includes("C 5-Finger")) tonic = "C";
    else if (song.id === "canon-in-d") tonic = "D";
    else if (song.id === "bach-minuet-g" || (song.rh && song.rh.includes("F#4") && !song.rh.includes("C#5"))) tonic = "G";
    else if (song.id && (song.id.includes("scarborough-fair") || song.id === "gymnopedie-no-1")) tonic = "D";
    else if (song.id && (song.id.includes("fur-elise") || song.id.includes("greensleeves"))) tonic = "A";
    else if (song.id && song.id.includes("amazing-grace-f")) tonic = "F";
    else {
      const firstBass = song.lh ? song.lh.match(/([A-G][#b]?)/) : null;
      if (firstBass) tonic = firstBass[1];
      else {
        const firstMel = song.rh ? song.rh.match(/([A-G][#b]?)/) : null;
        if (firstMel) tonic = firstMel[1];
      }
    }

    const tonicSemi = NOTE_OFFSETS[tonic] ?? 0;
    const rootMatch = chordInfo.name.match(/^([A-G][#b]?)/);
    if (!rootMatch) return null;
    const chordRoot = rootMatch[1];
    const chordSemi = NOTE_OFFSETS[chordRoot];
    if (chordSemi === undefined) return null;

    const diff = (chordSemi - tonicSemi + 12) % 12;
    const isMinor = chordInfo.name.includes("Minor") || chordInfo.name.includes("m7") || chordInfo.type === "Minor Triad";

    const majorNumerals = {
      0: "I", 1: "♭II", 2: "ii", 3: "♭III", 4: "iii", 5: "IV",
      6: "♯IV", 7: "V", 8: "♭VI", 9: "vi", 10: "♭VII", 11: "vii°"
    };

    let base = majorNumerals[diff] || "I";
    if (isMinor) base = base.toLowerCase();
    else if (chordInfo.type === "Major Triad") base = base.toUpperCase();

    if (chordInfo.name.includes("7")) base += "7";
    return base;
  }

  /**
   * Builds a synchronized multi-measure score model & step timeline from a song definition.
   */
  function buildScoreModel(song, showRH, showLH, showDyads, harmonyType = "song", lhStyle = "song") {
    if (!song) return { measures: [], steps: [] };

    let dyadSource = song.dyads || "";
    let dyadFSource = song.dyadsF || "";

    if (showDyads && harmonyType && harmonyType !== "song") {
      const gen = generateSongHarmonies(song, harmonyType);
      dyadSource = gen.dyads;
      dyadFSource = gen.dyadsF;
    }

    let lhSource = song.lh || "";
    let lhFSource = song.lhF || "";

    if (showLH && lhStyle && lhStyle !== "song") {
      const genLH = generateLeftHandAccompaniment(song, lhStyle);
      lhSource = genLH.lh;
      lhFSource = genLH.lhF;
    }

    const rhM = (song.rh || "").split("|").map(m => m.trim().split(/\s+/).filter(Boolean));
    const lhM = (lhSource || "").split("|").map(m => m.trim().split(/\s+/).filter(Boolean));
    const dyadM = (dyadSource || "").split("|").map(m => m.trim().split(/\s+/).filter(Boolean));
    const rhFM = (song.rhF || "").split("|").map(m => m.trim().split(/\s+/).filter(Boolean));
    const lhFM = (lhFSource || "").split("|").map(m => m.trim().split(/\s+/).filter(Boolean));
    const dyadFM = (dyadFSource || "").split("|").map(m => m.trim().split(/\s+/).filter(Boolean));

    let expMeasureBeats = 4;
    if (song.timeSig) {
      const [numStr, denStr] = song.timeSig.split("/");
      const num = parseFloat(numStr) || 4;
      const den = parseFloat(denStr) || 4;
      expMeasureBeats = num * (4 / den);
    }

    const totalMeasures = Math.max(rhM.length, lhM.length, dyadM.length);
    const measures = [];
    const steps = [];
    let stepGlobalIdx = 0;

    for (let m = 0; m < totalMeasures; m++) {
      const mRH = [...(rhM[m] || [])];
      const mLH = [...(lhM[m] || [])];
      const mDyad = [...(dyadM[m] || [])];
      const mRHF = rhFM[m] || [];
      const mLHF = lhFM[m] || [];
      const mDyadF = dyadFM[m] || [];

      const measureItems = [];

      if (showDyads && showLH) {
        let dyadBeat = 0;
        const dyadEvents = mDyad.map((t, k) => {
          const p = parseToken(t);
          const ev = { ...p, f: mDyadF[k] || "", startBeat: dyadBeat };
          dyadBeat += p.beats;
          return ev;
        });

        let lhBeat = 0;
        const lhEvents = mLH.map((t, k) => {
          const p = parseToken(t);
          const ev = { ...p, f: mLHF[k] || "", startBeat: lhBeat };
          lhBeat += p.beats;
          return ev;
        });

        const isPickupDyadM0 = (m === 0 && dyadBeat < expMeasureBeats - 0.01 && lhBeat < expMeasureBeats - 0.01);
        if (dyadEvents.length === 0 && lhEvents.length > 0) {
          dyadEvents.push({ pitch: "-", beats: expMeasureBeats, f: "", startBeat: 0 });
        } else if (dyadEvents.length > 0 && dyadBeat < expMeasureBeats - 0.01 && !isPickupDyadM0) {
          dyadEvents.push({ pitch: "-", beats: expMeasureBeats - dyadBeat, f: "", startBeat: dyadBeat });
        }
        if (lhEvents.length === 0 && dyadEvents.length > 0) {
          lhEvents.push({ pitch: "-", beats: expMeasureBeats, f: "", startBeat: 0 });
        } else if (lhEvents.length > 0 && lhBeat < expMeasureBeats - 0.01 && !isPickupDyadM0) {
          lhEvents.push({ pitch: "-", beats: expMeasureBeats - lhBeat, f: "", startBeat: lhBeat });
        }

        const onsets = Array.from(new Set([
          ...dyadEvents.map(e => e.startBeat),
          ...lhEvents.map(e => e.startBeat)
        ])).sort((a, b) => a - b);

        onsets.forEach((b, k) => {
          const dyadEv = dyadEvents.find(e => Math.abs(e.startBeat - b) < 0.001) || null;
          const lhEv = lhEvents.find(e => Math.abs(e.startBeat - b) < 0.001) || null;
          const expectedList = [];
          if (dyadEv && dyadEv.pitch && dyadEv.pitch !== "-") {
            dyadEv.pitch.split("+").filter(p => p !== "-").forEach(p => expectedList.push(p));
          }
          if (lhEv && lhEv.pitch && lhEv.pitch !== "-") {
            lhEv.pitch.split("+").filter(p => p !== "-").forEach(p => expectedList.push(p));
          }
          const expected = Array.from(new Set(expectedList));

          const nextB = onsets[k + 1];
          const maxMB = Math.max(
            ...dyadEvents.map(e => e.startBeat + e.beats),
            ...lhEvents.map(e => e.startBeat + e.beats),
            0
          );
          const stepBeats = nextB !== undefined ? (nextB - b) : (maxMB > b ? (maxMB - b) : Math.max(dyadEv ? dyadEv.beats : 1, lhEv ? lhEv.beats : 1));

          const item = {
            stepIndex: stepGlobalIdx,
            index: stepGlobalIdx,
            measure: m + 1,
            startBeat: b,
            dyad: dyadEv,
            dyadF: dyadEv ? dyadEv.f : "",
            lh: lhEv,
            lhF: lhEv ? lhEv.f : "",
            expectedPitches: expected,
            displayLabel: expected.length > 0 ? expected.join(" + ") : "REST",
            beats: stepBeats
          };
          measureItems.push(item);
          steps.push(item);
          stepGlobalIdx++;
        });
      } else if (showDyads && !showLH) {
        if (mDyad.length === 0) {
          mDyad.push(`-:${expMeasureBeats}`);
        }
        let dyadBeat = 0;
        mDyad.forEach((t, k) => {
          const parsed = parseToken(t);
          const expected = parsed.pitch.split("+").filter(p => p !== "-");
          const item = {
            stepIndex: stepGlobalIdx,
            index: stepGlobalIdx,
            measure: m + 1,
            startBeat: dyadBeat,
            dyad: parsed,
            dyadF: mDyadF[k] || "",
            expectedPitches: expected,
            displayLabel: expected.length > 0 ? expected.join(" + ") : "REST",
            beats: parsed.beats
          };
          dyadBeat += parsed.beats;
          measureItems.push(item);
          steps.push(item);
          stepGlobalIdx++;
        });
      } else if (showRH && !showLH) {
        if (mRH.length === 0) {
          mRH.push(`-:${expMeasureBeats}`);
        }
        let rhBeat = 0;
        mRH.forEach((t, k) => {
          const parsed = parseToken(t);
          const expected = parsed.pitch.split("+").filter(p => p !== "-");
          const item = {
            stepIndex: stepGlobalIdx,
            index: stepGlobalIdx,
            measure: m + 1,
            startBeat: rhBeat,
            rh: parsed,
            rhF: mRHF[k] || "",
            expectedPitches: expected,
            displayLabel: expected.length > 0 ? expected.join(" + ") : "REST",
            beats: parsed.beats
          };
          rhBeat += parsed.beats;
          measureItems.push(item);
          steps.push(item);
          stepGlobalIdx++;
        });
      } else if (showLH && !showRH) {
        if (mLH.length === 0) {
          mLH.push(`-:${expMeasureBeats}`);
        }
        let lhBeat = 0;
        mLH.forEach((t, k) => {
          const parsed = parseToken(t);
          const expected = parsed.pitch.split("+").filter(p => p !== "-");
          const item = {
            stepIndex: stepGlobalIdx,
            index: stepGlobalIdx,
            measure: m + 1,
            startBeat: lhBeat,
            lh: parsed,
            lhF: mLHF[k] || "",
            expectedPitches: expected,
            displayLabel: expected.length > 0 ? expected.join(" + ") : "REST",
            beats: parsed.beats
          };
          lhBeat += parsed.beats;
          measureItems.push(item);
          steps.push(item);
          stepGlobalIdx++;
        });
      } else if (showRH && showLH) {
        let rhBeat = 0;
        const rhEvents = mRH.map((t, k) => {
          const p = parseToken(t);
          const ev = { ...p, f: mRHF[k] || "", startBeat: rhBeat };
          rhBeat += p.beats;
          return ev;
        });

        let lhBeat = 0;
        const lhEvents = mLH.map((t, k) => {
          const p = parseToken(t);
          const ev = { ...p, f: mLHF[k] || "", startBeat: lhBeat };
          lhBeat += p.beats;
          return ev;
        });

        const isPickupM0 = (m === 0 && rhBeat < expMeasureBeats - 0.01 && lhBeat < expMeasureBeats - 0.01);
        if (rhEvents.length === 0 && lhEvents.length > 0) {
          rhEvents.push({ pitch: "-", beats: expMeasureBeats, f: "", startBeat: 0 });
        } else if (rhEvents.length > 0 && rhBeat < expMeasureBeats - 0.01 && !isPickupM0) {
          rhEvents.push({ pitch: "-", beats: expMeasureBeats - rhBeat, f: "", startBeat: rhBeat });
        }
        if (lhEvents.length === 0 && rhEvents.length > 0) {
          lhEvents.push({ pitch: "-", beats: expMeasureBeats, f: "", startBeat: 0 });
        } else if (lhEvents.length > 0 && lhBeat < expMeasureBeats - 0.01 && !isPickupM0) {
          lhEvents.push({ pitch: "-", beats: expMeasureBeats - lhBeat, f: "", startBeat: lhBeat });
        }

        const onsets = Array.from(new Set([
          ...rhEvents.map(e => e.startBeat),
          ...lhEvents.map(e => e.startBeat)
        ])).sort((a, b) => a - b);

        onsets.forEach((b, k) => {
          const rhEv = rhEvents.find(e => Math.abs(e.startBeat - b) < 0.001) || null;
          const lhEv = lhEvents.find(e => Math.abs(e.startBeat - b) < 0.001) || null;
          const expectedList = [];
          if (rhEv && rhEv.pitch && rhEv.pitch !== "-") {
            rhEv.pitch.split("+").filter(p => p !== "-").forEach(p => expectedList.push(p));
          }
          if (lhEv && lhEv.pitch && lhEv.pitch !== "-") {
            lhEv.pitch.split("+").filter(p => p !== "-").forEach(p => expectedList.push(p));
          }
          const expected = Array.from(new Set(expectedList));

          const nextB = onsets[k + 1];
          const maxMB = Math.max(
            ...rhEvents.map(e => e.startBeat + e.beats),
            ...lhEvents.map(e => e.startBeat + e.beats),
            0
          );
          const stepBeats = nextB !== undefined ? (nextB - b) : (maxMB > b ? (maxMB - b) : Math.max(rhEv ? rhEv.beats : 1, lhEv ? lhEv.beats : 1));

          const item = {
            stepIndex: stepGlobalIdx,
            index: stepGlobalIdx,
            measure: m + 1,
            startBeat: b,
            rh: rhEv,
            rhF: rhEv ? rhEv.f : "",
            lh: lhEv,
            lhF: lhEv ? lhEv.f : "",
            expectedPitches: expected,
            displayLabel: expected.length > 0 ? expected.join(" + ") : "REST",
            beats: stepBeats
          };
          measureItems.push(item);
          steps.push(item);
          stepGlobalIdx++;
        });
      }

      measures.push(measureItems);
    }

    // Cross-step tie detection
    for (let sIdx = 1; sIdx < steps.length; sIdx++) {
      const prev = steps[sIdx - 1];
      const cur = steps[sIdx];
      const prevTied = (prev.dyad && prev.dyad.tied) || (prev.rh && prev.rh.tied) || (prev.lh && prev.lh.tied);
      if (prevTied && prev.expectedPitches && cur.expectedPitches) {
        const hasOverlap = cur.expectedPitches.some(p => prev.expectedPitches.includes(p));
        if (hasOverlap) {
          cur.tiedFromPrev = true;
        }
      }
    }

    return { measures, steps };
  }

  // ==========================================
  // DEEP MUSIC THEORY & BEGINNER PEDAGOGY ENGINE (MILESTONE 36)
  // ==========================================

  /**
   * Generates all 7 diatonic chords (I - ii - iii - IV - V - vi - vii° in Major,
   * or i - ii° - III - iv - V - VI - VII in Minor) with spelled pitches and harmonic functions.
   */
  function generateDiatonicChordFamily(keyStr = "C") {
    const clean = (keyStr || "C").trim();
    const isMinorKey = clean.endsWith("m") && clean.length > 1;
    const rootName = isMinorKey ? clean.slice(0, -1) : clean;
    const scaleType = isMinorKey ? "natural_minor" : "major";
    const scale = generateScale(rootName, scaleType, 4);
    if (!scale) return null;

    const majorDefs = [
      { degree: 1, numeral: "I", quality: "major", suffix: "", fnGroup: "Tonic (Home)", role: "Home base; stable, grounded, where the piece begins and resolves." },
      { degree: 2, numeral: "ii", quality: "minor", suffix: "m", fnGroup: "Subdominant (Pre-Dominant)", role: "Smooth stepping stone that leads naturally into the V chord." },
      { degree: 3, numeral: "iii", quality: "minor", suffix: "m", fnGroup: "Tonic Prolongation", role: "Warm, reflective bridge sharing two notes with I and V." },
      { degree: 4, numeral: "IV", quality: "major", suffix: "", fnGroup: "Subdominant (Departure)", role: "Open, uplifting harmonic lift moving away from home." },
      { degree: 5, numeral: "V", quality: "major", suffix: "", fnGroup: "Dominant (Tension → I)", role: "Magnetic harmonic tension that pulls strongly back home to I." },
      { degree: 6, numeral: "vi", quality: "minor", suffix: "m", fnGroup: "Tonic / Relative Minor", role: "The Relative Minor twin! Shares the exact same key signature as I." },
      { degree: 7, numeral: "vii°", quality: "diminished", suffix: "dim", fnGroup: "Dominant (Leading Tone)", role: "Restless diminished triad built on Ti, urgently resolving up to Do (I)." }
    ];

    const minorDefs = [
      { degree: 1, numeral: "i", quality: "minor", suffix: "m", fnGroup: "Tonic (Minor Home)", role: "Somber, expressive minor home base." },
      { degree: 2, numeral: "ii°", quality: "diminished", suffix: "dim", fnGroup: "Subdominant (Pre-Dominant)", role: "Tense minor pre-dominant preparing the V chord." },
      { degree: 3, numeral: "III", quality: "major", suffix: "", fnGroup: "Relative Major", role: "Bright Relative Major oasis sharing the same key signature." },
      { degree: 4, numeral: "iv", quality: "minor", suffix: "m", fnGroup: "Subdominant (Deep Emotion)", role: "Rich, melancholic departure chord." },
      { degree: 5, numeral: "V", quality: "major", suffix: "", fnGroup: "Dominant (Harmonic Pull)", role: "Classical raised leading-tone dominant pulling back to i." },
      { degree: 6, numeral: "VI", quality: "major", suffix: "", fnGroup: "Submediant (Heroic Lift)", role: "Cinematic, warm major chord (central to the Andalusian cadence)." },
      { degree: 7, numeral: "VII", quality: "major", suffix: "", fnGroup: "Subtonic", role: "Bold rock & folk step below the minor tonic." }
    ];

    const defs = isMinorKey ? minorDefs : majorDefs;
    const scaleNotes = scale.notes.slice(0, 7); // 7 diatonic degrees

    const chords = defs.map((d, idx) => {
      const degNote = scaleNotes[idx];
      const degRoot = degNote.pitch.replace(/[0-9]/g, "");
      const chordObj = generateChord(degRoot, d.quality, 4, 0);
      const lhOct = (NOTE_OFFSETS[degRoot] || 0) < 5 ? 3 : 2;
      const lhPitch = `${degRoot}${lhOct}`;
      const rhPitches = chordObj ? chordObj.pitches : [degNote.pitch];

      return {
        degree: d.degree,
        numeral: d.numeral,
        roman: d.numeral,
        root: degRoot,
        quality: d.quality,
        symbol: `${degRoot}${d.suffix}`,
        chordName: `${degRoot} ${d.quality.charAt(0).toUpperCase() + d.quality.slice(1)}`,
        functionGroup: d.fnGroup,
        functionRole: d.fnGroup,
        roleDescription: d.role,
        lhPitch,
        rhPitches,
        pitches: rhPitches,
        allPitches: [lhPitch, ...rhPitches]
      };
    });

    return {
      key: clean,
      root: rootName,
      isMinor: isMinorKey,
      scaleName: scale.name,
      chords
    };
  }

  /**
   * Returns standard conservatory staff coordinates for engraving key signatures
   * (up to 7 sharps F-C-G-D-A-E-B or 7 flats B-E-A-D-G-C-F) on Treble & Bass clefs.
   */
  function getKeySignatureStaffInfo(keyStr = "C") {
    const clean = (keyStr || "C").trim().replace(/m$/, "");
    const circleEntry = CIRCLE_OF_FIFTHS.find(k => k.key === clean || k.relativeMinor === keyStr) || CIRCLE_OF_FIFTHS[0];

    // Standard conservatory staff placement pitches for key signatures
    const SHARP_TREBLE_PITCHES = ["F#5", "C#5", "G#5", "D#5", "A#4", "E#5", "B#4"];
    const SHARP_BASS_PITCHES   = ["F#3", "C#3", "G#3", "D#3", "A#2", "E#3", "B#2"];
    const FLAT_TREBLE_PITCHES  = ["Bb4", "Eb5", "Ab4", "Db5", "Gb4", "Cb5", "Fb4"];
    const FLAT_BASS_PITCHES    = ["Bb2", "Eb3", "Ab2", "Db3", "Gb2", "Cb3", "Fb2"];

    const count = circleEntry.sharps > 0 ? circleEntry.sharps : circleEntry.flats;
    const accType = circleEntry.sharps > 0 ? "sharps" : (circleEntry.flats > 0 ? "flats" : "natural");
    const glyph = accType === "sharps" ? "♯" : (accType === "flats" ? "♭" : "♮");

    const treblePitches = accType === "sharps"
      ? SHARP_TREBLE_PITCHES.slice(0, count)
      : (accType === "flats" ? FLAT_TREBLE_PITCHES.slice(0, count) : []);
    const bassPitches = accType === "sharps"
      ? SHARP_BASS_PITCHES.slice(0, count)
      : (accType === "flats" ? FLAT_BASS_PITCHES.slice(0, count) : []);

    let readingRule = "No sharps or flats! All diatonic notes are white keys (C Major / A Minor).";
    if (accType === "sharps") {
      const lastSharp = circleEntry.accidentalsList[circleEntry.accidentalsList.length - 1];
      readingRule = `Sharp Key Rule: The last sharp is ${lastSharp} (Leading Tone Ti). Raise ${lastSharp} by 1 half-step to find ${circleEntry.key} Major! (Order of Sharps: Father Charles Goes Down And Ends Battle).`;
    } else if (accType === "flats") {
      if (count === 1) {
        readingRule = "Flat Key Rule: 1 Flat (B♭) is always F Major (or D Minor).";
      } else {
        const secondToLast = circleEntry.accidentalsList[circleEntry.accidentalsList.length - 2];
        readingRule = `Flat Key Rule: The second-to-last flat in the signature (${secondToLast}) names the Major key (${circleEntry.key} Major)! (Order of Flats: Battle Ends And Down Goes Charles' Father).`;
      }
    }

    const symbols = treblePitches.map((tp, idx) => ({
      note: circleEntry.accidentalsList[idx] || tp.replace(/[0-9]/g, ""),
      pitch: tp,
      symbol: glyph,
      trebleStep: getDiatonicStep(tp) || 6,
      bassStep: getDiatonicStep(bassPitches[idx]) || -6
    }));

    return {
      key: circleEntry.key,
      relativeMinor: circleEntry.relativeMinor,
      accidentalType: accType,
      glyph,
      count,
      accidentalsList: circleEntry.accidentalsList,
      treblePitches,
      bassPitches,
      symbols,
      readingRule,
      ruleText: readingRule,
      tipText: "Every note on these staff lines/spaces (in any octave) is played sharp or flat automatically unless cancelled by a natural (♮)."
    };
  }

  /**
   * 7-Module Interactive Beginner Piano & Music Theory Bootcamp Curriculum.
   * Each module includes theory concepts, visual takeaways, and a live interactive keyboard task.
   */
  const BEGINNER_BOOTCAMP_MODULES = [
    {
      id: "module-1-geography",
      number: 1,
      title: "Keyboard Geography: The 2 & 3 Black Key Map",
      subtitle: "Never get lost on the piano again",
      badge: "🗺️ Orientation",
      theorySummary: "The piano keyboard looks huge, but it is just a repeating 12-note pattern! Black keys are grouped in alternating sets of 2 Black Keys ('Chopsticks') and 3 Black Keys ('Fork'). The white key immediately to the left of any 2 black keys is ALWAYS C. The white key immediately to the left of any 3 black keys is ALWAYS F.",
      keyTakeaways: [
        "Find the 2 Black Keys in the center of your keyboard → the white key to their left is Middle C (C4).",
        "Find the 3 Black Keys → the white key to their left is F (F4).",
        "Moving right goes UP in pitch; moving left goes DOWN in pitch."
      ],
      taskPrompt: "Interactive Task: Play Low C (C3), then Middle C (C4), then F4, then High C (C5) on the keyboard!",
      targetSequence: [
        { pitches: ["C3"], label: "Low C (C3)", hint: "Left of the 2 black keys in the bass octave" },
        { pitches: ["C4"], label: "Middle C (C4)", hint: "Center anchor! Left of the middle 2 black keys" },
        { pitches: ["F4"], label: "Treble F (F4)", hint: "Left of the 3 black keys above Middle C" },
        { pitches: ["C5"], label: "High C (C5)", hint: "One octave above Middle C" }
      ],
      recommendedSongs: ["ode-to-joy", "hot-cross-buns", "mary-had-a-little-lamb"]
    },
    {
      id: "module-2-steps",
      number: 2,
      title: "Half Steps (Semitones) & Whole Steps (Tones)",
      subtitle: "The atomic building blocks of scales and chords",
      badge: "🧬 Intervals",
      theorySummary: "A Half Step (Semitone) is the shortest distance on the piano: from any key to its immediate neighbor (white or black) with zero keys in between. Most white keys have a black key between them, EXCEPT E–F and B–C, which are natural half steps! A Whole Step (Whole Tone) equals 2 Half Steps (skipping one key in between).",
      keyTakeaways: [
        "Sharp (♯) raises a note by 1 Half Step (e.g., F → F♯).",
        "Flat (♭) lowers a note by 1 Half Step (e.g., B → B♭).",
        "Natural Half Steps: E to F and B to C have NO black key between them!"
      ],
      taskPrompt: "Interactive Task: Play the Half Step C4 → C♯4, then the natural Half Step E4 → F4, then the Whole Step F4 → G4!",
      targetSequence: [
        { pitches: ["C4"], label: "C4", hint: "Start on Middle C" },
        { pitches: ["C#4"], label: "C♯4 (Half Step Up)", hint: "The black key immediately to the right of C4" },
        { pitches: ["E4"], label: "E4", hint: "White key to the right of the 2 black keys" },
        { pitches: ["F4"], label: "F4 (Natural Half Step!)", hint: "Notice there is NO black key between E4 and F4" },
        { pitches: ["G4"], label: "G4 (Whole Step Up)", hint: "Skips over F♯4 (2 half steps from F4)" }
      ],
      recommendedSongs: ["fur-elise-motif", "pink-panther", "jaws-theme"]
    },
    {
      id: "module-3-landmarks",
      number: 3,
      title: "The Grand Staff Landmark System",
      subtitle: "Read sheet music 5x faster without counting from the bottom",
      badge: "🎼 Sight-Reading",
      theorySummary: "Beginners often struggle because they count every staff line from the bottom ('Every Good Boy...'). Professional pianists use the Landmark System: memorize 3 anchor guideposts and read all other notes by how far they step or skip from the nearest landmark! The 3 anchors are: Bass F (F3) between the two dots of the Bass Clef (𝄢), Middle C (C4) on the center ledger line, and Treble G (G4) inside the curl of the Treble G-Clef (𝄞).",
      keyTakeaways: [
        "𝄢 Bass F (F3): Sits on Line 4 right between the two dots of the F-Clef.",
        "⭐ Middle C (C4): Floats on its own short ledger line between the two staves.",
        "𝄞 Treble G (G4): Sits on Line 2 right inside the spiral crosshair of the G-Clef."
      ],
      taskPrompt: "Interactive Task: Lock in the 3 Grand Staff Landmarks in order: Bass F (F3) → Middle C (C4) → Treble G (G4)!",
      targetSequence: [
        { pitches: ["F3"], label: "Bass Landmark F3", hint: "Bass Clef Line 4 (between the 𝄢 dots)" },
        { pitches: ["C4"], label: "Bridge Landmark Middle C4", hint: "Center ledger line between staves" },
        { pitches: ["G4"], label: "Treble Landmark G4", hint: "Treble Clef Line 2 (inside the 𝄞 curl)" }
      ],
      recommendedSongs: ["au-clair-de-la-lune", "lightly-row", "twinkle-twinkle"]
    },
    {
      id: "module-4-major-scale",
      number: 4,
      title: "The Major Scale Recipe (W-W-H-W-W-W-H) & Thumb Tuck",
      subtitle: "How 8 notes fit smoothly under 5 fingers",
      badge: "🖐️ Technique",
      theorySummary: "Every Major scale follows the exact same step formula: Whole – Whole – Half – Whole – Whole – Whole – Half. In C Major, this lands entirely on the white keys (because E–F and B–C are already natural half steps!). To play 8 notes with only 5 fingers, play fingers 1 – 2 – 3 (C – D – E), then smoothly tuck your Thumb (1) under your middle finger to land on F, finishing 1 – 2 – 3 – 4 – 5!",
      keyTakeaways: [
        "Formula: W – W – H – W – W – W – H.",
        "Right Hand Fingering: 1 – 2 – 3 – [Thumb Tuck 1] – 2 – 3 – 4 – 5.",
        "Keep your wrist level when tucking your thumb—don't pop your elbow out!"
      ],
      taskPrompt: "Interactive Task: Play the C Major Scale ascending from C4 to C5, using the Thumb Tuck on F4!",
      targetSequence: [
        { pitches: ["C4"], label: "C4 (RH Finger 1 - Thumb)", hint: "Degree 1 (Do)" },
        { pitches: ["D4"], label: "D4 (RH Finger 2)", hint: "Degree 2 (Re) — Whole step" },
        { pitches: ["E4"], label: "E4 (RH Finger 3)", hint: "Degree 3 (Mi) — Whole step" },
        { pitches: ["F4"], label: "F4 (🔄 THUMB TUCK 1!)", hint: "Degree 4 (Fa) — Half step! Tuck thumb under Finger 3" },
        { pitches: ["G4"], label: "G4 (RH Finger 2)", hint: "Degree 5 (Sol) — Whole step" },
        { pitches: ["A4"], label: "A4 (RH Finger 3)", hint: "Degree 6 (La) — Whole step" },
        { pitches: ["B4"], label: "B4 (RH Finger 4)", hint: "Degree 7 (Ti) — Whole step" },
        { pitches: ["C5"], label: "C5 (RH Finger 5 - Pinky)", hint: "Degree 8 (High Do) — Half step!" }
      ],
      recommendedSongs: ["joy-to-the-world", "scales-warmup-c", "minuet-in-g"]
    },
    {
      id: "module-5-intervals",
      number: 5,
      title: "Harmonic Intervals: 2nds (Steps), 3rds (Skips) & 5ths",
      subtitle: "Reading two notes at once by geometric shape",
      badge: "📐 Harmony",
      theorySummary: "On sheet music, you don't need to read every note in a chord individually—read the shape! A 2nd (Step) moves from a Line to the adjacent Space. A 3rd (Skip) moves from Line-to-Line or Space-to-Space. A 5th skips over one line/space to land two lines/spaces higher (forming a rock-solid open frame under fingers 1 and 5).",
      keyTakeaways: [
        "Major 2nd (C4+D4): Line-to-Space neighbor step.",
        "Major 3rd (C4+E4): Line-to-Line skip (4 half-steps) — sweet & bright.",
        "Perfect 5th (C4+G4): Double skip (7 half-steps) — played with Fingers 1 and 5."
      ],
      taskPrompt: "Interactive Task: Play the Major 3rd dyad (C4 + E4), then the Perfect 5th dyad (C4 + G4)!",
      targetSequence: [
        { pitches: ["C4", "E4"], label: "Major 3rd Dyad (C4 + E4)", hint: "Press C4 (Thumb 1) and E4 (Middle 3) together" },
        { pitches: ["D4", "F4"], label: "Minor 3rd Dyad (D4 + F4)", hint: "Press D4 (Finger 2) and F4 (Finger 4) together" },
        { pitches: ["C4", "G4"], label: "Perfect 5th Power Dyad (C4 + G4)", hint: "Press C4 (Thumb 1) and G4 (Pinky 5) together" }
      ],
      recommendedSongs: ["ode-to-joy", "lean-on-me", "heart-and-soul"]
    },
    {
      id: "module-6-triads",
      number: 6,
      title: "Building Major & Minor Triads (The 4+3 vs 3+4 Rule)",
      subtitle: "How 1 half-step changes happiness into melancholy",
      badge: "🎹 Chords",
      theorySummary: "A Triad is a 3-note chord built by stacking every other scale note (1 – 3 – 5, looking like a 'Snowman' on the staff). The outer shell (Root 1 and Fifth 5) is a Perfect 5th (7 half-steps) in BOTH Major and Minor chords! The middle note (the 3rd) controls the emotion: 4 half-steps from the root creates a bright Major Triad (4 + 3), while 3 half-steps creates a soulful Minor Triad (3 + 4).",
      keyTakeaways: [
        "Major Triad Recipe: Root + 4 half-steps (Major 3rd) + 3 half-steps (Perfect 5th).",
        "Minor Triad Recipe: Lower the middle note by 1 half-step! (Root + 3 + 4).",
        "Standard Fingering: RH 1 – 3 – 5 | LH 5 – 3 – 1."
      ],
      taskPrompt: "Interactive Task: Play a C Major Triad (C4+E4+G4), transform it into C Minor (C4+E♭4+G4), then play A Minor (A3+C4+E4)!",
      targetSequence: [
        { pitches: ["C4", "E4", "G4"], label: "C Major Triad (C4 + E4 + G4)", hint: "Bright 4+3 recipe: Thumb on C4, Middle on E4, Pinky on G4" },
        { pitches: ["C4", "Eb4", "G4"], label: "C Minor Triad (C4 + E♭4 + G4)", hint: "Lower the middle note E4 to the black key E♭4!" },
        { pitches: ["A3", "C4", "E4"], label: "A Minor Triad (A3 + C4 + E4)", hint: "All white keys starting on A3 — naturally forms the 3+4 minor recipe!" }
      ],
      recommendedSongs: ["greensleeves-primer", "scarborough-fair-primer", "house-of-the-rising-sun"]
    },
    {
      id: "module-7-cadences",
      number: 7,
      title: "Functional Harmony & The I – IV – V – I Cadence",
      subtitle: "How chords tell a story of Home, Adventure, and Return",
      badge: "🏛️ Progression",
      theorySummary: "In any key, three primary chords carry the entire harmonic story: the Tonic (I) is Home & Rest; the Subdominant (IV) is Adventure & Lift; and the Dominant (V) is Magnetic Tension that wants to resolve back to I. Instead of jumping your whole hand across the keyboard, use Inversions (re-ordering the notes of IV and V) so your fingers barely move!",
      keyTakeaways: [
        "I (C Major: C–E–G): Home base.",
        "IV in 2nd Inversion (F Major: C–F–A): Keep thumb anchored on C4 and move fingers 3 & 5 up 1 key!",
        "V in 1st Inversion (G Major: B–D–G): Step thumb down to B3 while Pinky stays anchored on G4!"
      ],
      taskPrompt: "Interactive Task: Play the smooth voice-led I → IV → V → I cadence in C Major!",
      targetSequence: [
        { pitches: ["C4", "E4", "G4"], label: "I — C Major (Root Position: C4+E4+G4)", hint: "Home base: C4 + E4 + G4" },
        { pitches: ["C4", "F4", "A4"], label: "IV — F Major (2nd Inversion: C4+F4+A4)", hint: "Keep thumb on C4, play F4 + A4 above it!" },
        { pitches: ["B3", "D4", "G4"], label: "V — G Major (1st Inversion: B3+D4+G4)", hint: "Step thumb 1 key left to B3, play D4 + G4!" },
        { pitches: ["C4", "E4", "G4"], label: "I — C Major (Resolved Home: C4+E4+G4)", hint: "Return smoothly home to C4 + E4 + G4!" }
      ],
      recommendedSongs: ["lean-on-me", "when-the-saints", "canon-in-d"]
    }
  ].map(m => ({
    ...m,
    category: m.badge,
    summary: m.theorySummary,
    steps: m.keyTakeaways,
    interactiveTask: {
      prompt: m.taskPrompt,
      targetNotes: m.targetSequence.flatMap(t => t.pitches),
      successMessage: `Module ${m.number} Mastered! ${m.subtitle}`
    }
  }));

  /**
   * Automatically inspects any repertoire song and extracts its Music Theory DNA
   * (Key Signature, Scale Warmup, Hand Range Landmarks, Meter, and Primary Chords).
   */
  function analyzeSongTheoryDNA(song, handOptions = null) {
    if (!song) return null;

    let tonic = "C";
    let isMinor = false;
    const keyAccs = detectKeyAccidentals(song);

    if (song.category && song.category.includes("C 5-Finger")) {
      tonic = "C";
    } else if (song.id === "canon-in-d") {
      tonic = "D";
    } else if (song.id === "bach-minuet-g" || (song.rh && song.rh.includes("F#4") && !song.rh.includes("C#5"))) {
      tonic = "G";
    } else if (song.id && (song.id.includes("scarborough-fair") || song.id === "gymnopedie-no-1")) {
      tonic = "D";
      isMinor = song.id.includes("scarborough");
    } else if (song.id && (song.id.includes("fur-elise") || song.id.includes("greensleeves") || song.id.includes("house-of-the-rising-sun"))) {
      tonic = "A";
      isMinor = true;
    } else if (song.id && song.id.includes("amazing-grace-f")) {
      tonic = "F";
    } else {
      if (keyAccs["B"] === "b" && !keyAccs["E"]) tonic = "F";
      else if (keyAccs["F"] === "#" && !keyAccs["C"]) tonic = "G";
      else if (keyAccs["F"] === "#" && keyAccs["C"] === "#") tonic = "D";
    }

    const scaleType = isMinor ? "natural_minor" : "major";
    const keyLabel = `${tonic} ${isMinor ? "Minor" : "Major"}`;
    const keySigInfo = getKeySignatureStaffInfo(isMinor ? `${tonic}m` : tonic);
    const scaleObj = generateScale(tonic, scaleType, 4);
    const warmupPitches = scaleObj ? scaleObj.notes.slice(0, 5).map(n => n.pitch) : ["C4", "D4", "E4", "F4", "G4"];
    const fullScalePitches = scaleObj ? scaleObj.notes.map(n => n.pitch) : ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];

    // Extract clean diatonic harmonic chords across measures from Left-Hand bass roots
    const rootModel = buildScoreModel(song, true, true, false, "song", "roots");
    const seenChords = new Map();

    if (rootModel && rootModel.measures) {
      rootModel.measures.forEach(m => {
        if (!m || m.length === 0) return;
        const beat0 = m[0];
        if (!beat0) return;
        let triadPitches = [];
        if (beat0.lh && beat0.lh.pitch && beat0.lh.pitch !== "-") {
          const lhRoot = beat0.lh.pitch.split("+")[0];
          const triadStr = transformLeftHandPitch(lhRoot, "triads", keyAccs);
          triadPitches = triadStr.split("+").filter(Boolean);
        }
        if (triadPitches.length >= 3) {
          const info = identifyActiveChord(triadPitches);
          if (info && info.name && (info.type.includes("Triad") || info.type.includes("7th"))) {
            const numeral = getRomanNumeralAnalysis(info, song) || "";
            const keyId = info.root || info.name.split(" ")[0];
            if (keyId && !seenChords.has(keyId) && seenChords.size < 5) {
              const isMin = info.name.includes("Minor") || info.type.includes("Minor");
              const isDim = info.name.includes("Diminished") || info.type.includes("Dim");
              const gen = generateChord(keyId, isDim ? "diminished" : (isMin ? "minor" : "major"), 4, 0);
              const sym = `${keyId}${isDim ? "dim" : (isMin ? "m" : "")}`;
              const num = numeral || "I";
              seenChords.set(keyId, {
                symbol: sym,
                name: info.name,
                numeral: num,
                label: `${num} (${sym})`,
                pitches: gen ? gen.pitches : triadPitches
              });
            }
          }
        }
      });
    }

    if (seenChords.size === 0) {
      const fam = generateDiatonicChordFamily(isMinor ? `${tonic}m` : tonic);
      if (fam && fam.chords) {
        [fam.chords[0], fam.chords[3], fam.chords[4]].forEach(c => {
          if (c) {
            seenChords.set(c.symbol, {
              symbol: c.symbol,
              name: c.chordName,
              numeral: c.numeral,
              label: `${c.numeral} (${c.symbol})`,
              pitches: c.rhPitches
            });
          }
        });
      }
    }

    const rangeOpts = handOptions
      ? { rh: handOptions.rh !== false, lh: Boolean(handOptions.lh), dyads: Boolean(handOptions.dyads) }
      : { rh: true, lh: true, dyads: false };
    const activeModel = buildScoreModel(
      song,
      rangeOpts.rh,
      rangeOpts.lh,
      rangeOpts.dyads,
      (handOptions && handOptions.harmonyType) || "song",
      (handOptions && handOptions.lhStyle) || "roots"
    );
    const activeMidis = [];
    let playableStepCount = 0;
    if (activeModel && Array.isArray(activeModel.steps)) {
      activeModel.steps.forEach(s => {
        if (s.expectedPitches && s.expectedPitches.length > 0) {
          playableStepCount++;
          s.expectedPitches.forEach(p => {
            const m = pitchToMidi(p);
            if (m !== null) activeMidis.push(m);
          });
        }
      });
    }
    const range = activeMidis.length > 0 ? getRangeFromMidis(activeMidis) : getSongPitchRange(song, rangeOpts);
    const timeSig = parseTimeSignature(song.timeSig || "4/4");
    const accSummary = keySigInfo.count === 0
      ? "All Natural"
      : `${keySigInfo.count} ${keySigInfo.accidentalType === "sharps" ? "♯" : "♭"} (${keySigInfo.accidentalsList.join(", ")})`;

    return {
      songId: song.id,
      title: song.title,
      keyLabel,
      keySignature: keyLabel,
      accidentalSummary: accSummary,
      tonic,
      isMinor,
      scaleType,
      keySigInfo,
      timeSig,
      timeSignature: `${timeSig.numerator}/${timeSig.denominator}`,
      beatsPerMeasure: timeSig.numerator,
      range,
      handSpanSummary: `${range.minPitch || "C4"} – ${range.maxPitch || "G4"} (${range.span || 8} keys)`,
      totalNotes: playableStepCount || range.count || fullScalePitches.length,
      warmupScale: scaleObj,
      warmupPitches,
      fullScalePitches,
      primaryChords: Array.from(seenChords.values())
    };
  }

  return {
    NOTE_NAMES_SHARP,
    NOTE_NAMES_FLAT,
    NOTE_OFFSETS,
    DIATONIC_BASE,
    DIATONIC_LETTERS,
    MAJOR_SCALE_FINGERINGS,
    MINOR_SCALE_FINGERINGS,
    INTERVAL_NAMES,
    INTERVAL_PEDAGOGY,
    SCALE_FORMULAS,
    CHORD_TYPES,
    CIRCLE_OF_FIFTHS,
    FLASHCARD_PRESETS,
    PROGRESSION_TEMPLATES,
    BEGINNER_BOOTCAMP_MODULES,
    spellPitchOnLetter,
    pitchToMidi,
    midiToPitch,
    midiToFreq,
    pitchToFreq,
    getDiatonicStep,
    diatonicStepToPitch,
    areEnharmonicEquivalent,
    generateScale,
    getScalePedagogyInfo,
    generateChord,
    getChordConstructionRecipe,
    generateDiatonicChordFamily,
    getKeySignatureStaffInfo,
    analyzeSongTheoryDNA,
    getInterval,
    getRandomFlashcard,
    generateEarTrainingChallenge,
    detectKeyAccidentals,
    harmonizePitch,
    harmonizeToken,
    generateSongHarmonies,
    LH_ACCOMPANIMENT_STYLES,
    extractBassRoot,
    transformLeftHandPitch,
    transformLeftHandToken,
    generateLeftHandAccompaniment,
    parseToken,
    getRomanNumeralAnalysis,
    buildScoreModel,
    recordSRSAttempt,
    getSRSItemStats,
    getAllSRSStats,
    clearSRSStats,
    getSRSMasteryLevel,
    getNumeralChordInfo,
    optimizeProgressionVoiceLeading,
    identifyActiveChord,
    STANDARD_KEYBOARD_PRESETS,
    getSongPitchRange,
    evaluateSongKeyboardCompatibility,
    CHEAT_SHEET_NOTE_COLORS,
    CHEAT_SHEET_ACCIDENTAL_COLORS,
    getCheatSheetNoteColor,
    CHEAT_SHEET_STAFF_MAP,
    getCheatSheetStaffInfo,
    CHEAT_SHEET_NOTES_RANGE,
    TIME_SIGNATURE_NAMES,
    parseTimeSignature,
    calculateMetronomeIntervals,
    getMetronomeTickProfile,
    getTimeSignatureCountIn,
    formatMidiMessage,
    createMidiNoteOn,
    createMidiNoteOff,
    createMidiCC,
    filterAudioOutputDevices,
    classifyAudioDevice,
    METRONOME_SOUND_PRESETS,
    getMetronomeSoundParameters,
    synthesizeMetronomeClick
  };
});

