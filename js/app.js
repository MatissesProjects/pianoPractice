// ============================================================================
// PIANO PRACTICE LAB — APPLICATION BOOTSTRAP
// ============================================================================

initKeyboardControls();
initSustainPedalControl();
initReviewModalControls();
initCatalogAndLayerControls();
initPracticeAndTransportControls();
renderFilterPills();
populateDropdown(songDatabase);
loadSong(songDatabase[0]);
renderCatalog(songDatabase);
updateLayerToggleClasses();
initMidiChannelPicker();
initWebMIDI();
initAudioOutputRouting();
initMidiOutputRouting();
initMasterVolume();
initRepertoireMetronome();

// Initialize educational modules
initModeNavigation();
initSightReadingModule();
initEarTrainingModule();
initScalesModule();
initRhythmModule();
initBeginnerBootcamp();
initInteractiveTheoryCards();
renderCircleOfFifthsSvg();
