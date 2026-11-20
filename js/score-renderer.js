// ============================================================================
// MULTI-SYSTEM SVG GRAND STAFF RENDERER & POST-SONG PERFORMANCE REVIEW
// ============================================================================

function renderSheetMusicScore() {
  if (!currentSong) return;
  const svg = document.getElementById("scoreSvg");
  if (!svg) return;
  svg.innerHTML = "";

  const showRH = document.getElementById("toggleRH").checked;
  const showLH = document.getElementById("toggleLH").checked;
  const showDyads = document.getElementById("toggleDyads").checked;
  const showCheat = document.getElementById("toggleCheat").checked;
  const showFingers = document.getElementById("toggleFingers").checked;

  document.getElementById("sheetPieceTitle").textContent = currentSong.title;

  if (!currentSongMeasures || currentSongMeasures.length === 0) {
    parseSongSteps();
  }
  const measures = currentSongMeasures;
  const renderedNotes = [];

  // Multi-System Geometry: 2 measures per system row for maximum readability
  const measuresPerSystem = 2;
  const scoreWidth = 920;
  const leftMargin = 74;
  const rightMargin = 26;
  const availableMeasureWidth = (scoreWidth - leftMargin - rightMargin) / measuresPerSystem;

  const staffLineSpacing = 10;
  const isGrandStaff = ((showRH || showDyads) && showLH);
  const systemHeight = isGrandStaff ? 275 : 160;

  const numSystems = Math.ceil(measures.length / measuresPerSystem);
  const totalSvgHeight = numSystems * systemHeight + 60;

  svg.setAttribute("width", scoreWidth);
  svg.setAttribute("height", totalSvgHeight);

  // Build Systems
  for (let s = 0; s < numSystems; s++) {
    const systemTopY = 30 + s * systemHeight;
    const trebleTopY = (showRH || showDyads) ? (systemTopY + 12) : 0;
    const trebleBottomY = trebleTopY + 4 * staffLineSpacing; // y = trebleTopY + 40
    const bassTopY = isGrandStaff ? (trebleBottomY + 80) : (showLH ? (systemTopY + 12) : 0);
    const bassBottomY = bassTopY + 4 * staffLineSpacing;

    // Draw Staff Lines for this system
    function draw5(topY) {
      for (let l = 0; l < 5; l++) {
        const y = topY + l * staffLineSpacing;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", leftMargin - 46);
        line.setAttribute("y1", y);
        line.setAttribute("x2", scoreWidth - rightMargin);
        line.setAttribute("y2", y);
        line.setAttribute("class", "staff-line");
        svg.appendChild(line);
      }
    }

    if (showRH || showDyads) draw5(trebleTopY);
    if (showLH) draw5(bassTopY);

    // Clefs on Every System Row
    if (showRH || showDyads) {
      const tClef = document.createElementNS("http://www.w3.org/2000/svg", "text");
      tClef.setAttribute("x", leftMargin - 42);
      tClef.setAttribute("y", trebleBottomY - 4);
      tClef.setAttribute("font-size", "44");
      tClef.setAttribute("class", "clef-text");
      tClef.textContent = "𝄞";
      svg.appendChild(tClef);
    }

    if (showLH) {
      const bClef = document.createElementNS("http://www.w3.org/2000/svg", "text");
      bClef.setAttribute("x", leftMargin - 40);
      bClef.setAttribute("y", bassTopY + 26);
      bClef.setAttribute("font-size", "34");
      bClef.setAttribute("class", "clef-text");
      bClef.textContent = "𝄢";
      svg.appendChild(bClef);
    }

    // Time Signature on Line 1 only
    if (s === 0) {
      if (showRH || showDyads) {
        const timeSig = document.createElementNS("http://www.w3.org/2000/svg", "text");
        timeSig.setAttribute("x", leftMargin + 8);
        timeSig.setAttribute("y", trebleTopY + 24);
        timeSig.setAttribute("class", "time-sig-text");
        timeSig.textContent = currentSong.timeSig || "4/4";
        svg.appendChild(timeSig);
      }
      if (showLH) {
        const timeSigB = document.createElementNS("http://www.w3.org/2000/svg", "text");
        timeSigB.setAttribute("x", leftMargin + 8);
        timeSigB.setAttribute("y", bassTopY + 24);
        timeSigB.setAttribute("class", "time-sig-text");
        timeSigB.textContent = currentSong.timeSig || "4/4";
        svg.appendChild(timeSigB);
      }
    }

    // Left System Bar Line & Bracket
    const startY = (showRH || showDyads) ? trebleTopY : bassTopY;
    const endY = showLH ? bassBottomY : trebleBottomY;
    const initBar = document.createElementNS("http://www.w3.org/2000/svg", "line");
    initBar.setAttribute("x1", leftMargin - 46);
    initBar.setAttribute("y1", startY);
    initBar.setAttribute("x2", leftMargin - 46);
    initBar.setAttribute("y2", endY);
    initBar.setAttribute("class", "bar-line");
    svg.appendChild(initBar);

    // Measures in this row
    const systemMeasures = measures.slice(s * measuresPerSystem, (s + 1) * measuresPerSystem);

    systemMeasures.forEach((mObj, mInRowIdx) => {
      const measureStartX = leftMargin + 28 + (mInRowIdx * availableMeasureWidth);
      const measureEndX = measureStartX + availableMeasureWidth - 28;
      const globalMeasureNum = s * measuresPerSystem + mInRowIdx + 1;

      // Visual A-B Loop Highlight Band (behind staff & notes)
      const loopBand = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      loopBand.setAttribute("x", measureStartX - 6);
      loopBand.setAttribute("y", startY - 12);
      loopBand.setAttribute("width", Math.max(20, (measureEndX - measureStartX) + 8));
      loopBand.setAttribute("height", Math.max(40, (endY - startY) + 24));
      loopBand.setAttribute("class", "measure-loop-band");
      loopBand.dataset.measure = String(globalMeasureNum);
      svg.appendChild(loopBand);

      // Clickable Measure Number (Seek to Measure)
      const mNum = document.createElementNS("http://www.w3.org/2000/svg", "text");
      mNum.setAttribute("x", measureStartX - 6);
      mNum.setAttribute("y", startY - 7);
      mNum.setAttribute("id", `measure_num_${globalMeasureNum}`);
      const hasMistake = (typeof sessionMistakeMeasures !== "undefined" && sessionMistakeMeasures.has(globalMeasureNum));
      mNum.setAttribute("class", `measure-number is-clickable${hasMistake ? " has-mistake" : ""}`);
      mNum.dataset.measure = String(globalMeasureNum);
      mNum.textContent = `${globalMeasureNum}`;
      const mTitle = document.createElementNS("http://www.w3.org/2000/svg", "title");
      mTitle.textContent = hasMistake
        ? `⚠️ Errors occurred in Measure ${globalMeasureNum} (Click to jump here)`
        : `Click to jump to Measure ${globalMeasureNum}`;
      mNum.appendChild(mTitle);
      mNum.addEventListener("click", () => {
        if (typeof seekPlaybackToMeasure === "function") {
          seekPlaybackToMeasure(globalMeasureNum);
        }
      });
      svg.appendChild(mNum);

      // Measure End Bar Line
      const bLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      bLine.setAttribute("x1", measureEndX);
      bLine.setAttribute("y1", startY);
      bLine.setAttribute("x2", measureEndX);
      bLine.setAttribute("y2", endY);
      bLine.setAttribute("class", "bar-line");
      svg.appendChild(bLine);

      // Distribute onsets inside the measure with beat-proportional spacing
      const noteCount = mObj.length;
      let measureBeats = 4;
      if (currentSong && currentSong.timeSig) {
        const [numStr, denStr] = currentSong.timeSig.split("/");
        const num = parseFloat(numStr) || 4;
        const den = parseFloat(denStr) || 4;
        measureBeats = num * (4 / den);
      }
      const maxItemBeat = mObj.reduce((maxB, it) => Math.max(maxB, (it.startBeat || 0) + (it.beats || 1)), 0);
      const totalMeasureBeats = Math.max(measureBeats, maxItemBeat || 1);
      const availableInnerX = availableMeasureWidth - 56;

      // Harmonic Roman Numeral Analysis on Beat 0 of Measure
      if ((showRH || showDyads) && mObj.length > 0) {
        const firstItem = mObj[0];
        const chordPitches = [];
        if (firstItem.dyad && firstItem.dyad.pitch && firstItem.dyad.pitch !== "-") {
          firstItem.dyad.pitch.split("+").filter(p => p !== "-").forEach(p => chordPitches.push(p));
        } else if (firstItem.rh && firstItem.rh.pitch && firstItem.rh.pitch !== "-") {
          firstItem.rh.pitch.split("+").filter(p => p !== "-").forEach(p => chordPitches.push(p));
        }
        if (firstItem.lh && firstItem.lh.pitch && firstItem.lh.pitch !== "-") {
          firstItem.lh.pitch.split("+").filter(p => p !== "-").forEach(p => chordPitches.push(p));
        }

        if (chordPitches.length > 0) {
          const activeNotes = chordPitches.map(p => ({
            num: getPitchMidiNumber(p) || 60,
            pitch: p
          }));
          const chordInfo = identifyActiveChord(activeNotes);
          if (chordInfo && chordInfo.name) {
            const romanNumeral = getRomanNumeralAnalysis(chordInfo, currentSong);
            const badgeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            badgeGroup.setAttribute("class", "harmonic-badge-group");

            const badgeBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            badgeBg.setAttribute("x", measureStartX + 8);
            badgeBg.setAttribute("y", startY - 22);
            badgeBg.setAttribute("height", "15");
            badgeBg.setAttribute("rx", "4");
            badgeBg.setAttribute("fill", "rgba(56, 189, 248, 0.12)");
            badgeBg.setAttribute("stroke", "rgba(56, 189, 248, 0.35)");
            badgeBg.setAttribute("stroke-width", "0.8");

            const badgeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            badgeText.setAttribute("x", measureStartX + 12);
            badgeText.setAttribute("y", startY - 11);
            badgeText.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
            badgeText.setAttribute("font-size", "9.5");
            badgeText.setAttribute("font-weight", "700");
            badgeText.setAttribute("fill", "#38bdf8");
            badgeText.textContent = romanNumeral ? `${chordInfo.name} (${romanNumeral})` : chordInfo.name;

            const textWidth = badgeText.textContent.length * 5.6 + 8;
            badgeBg.setAttribute("width", Math.max(30, textWidth));

            badgeGroup.appendChild(badgeBg);
            badgeGroup.appendChild(badgeText);
            svg.appendChild(badgeGroup);
          }
        }
      }

      mObj.forEach((item, nIdx) => {
        const beatVal = (typeof item.startBeat === "number" && !isNaN(item.startBeat))
          ? item.startBeat
          : (nIdx * (totalMeasureBeats / Math.max(1, noteCount)));
        const beatFraction = Math.max(0, Math.min(1, beatVal / totalMeasureBeats));
        const cx = measureStartX + 18 + beatFraction * availableInnerX;

        const noteGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        noteGroup.setAttribute("class", "note-group");
        noteGroup.setAttribute("id", `staff_note_${item.stepIndex}`);
        noteGroup.dataset.step = item.stepIndex;

        // Click listener on score (seeks playhead whether stopped, paused, or playing)
        noteGroup.addEventListener("click", () => {
          if (typeof seekPlaybackToStep === "function") {
            seekPlaybackToStep(item.stepIndex, { audition: true });
          } else {
            currentPracticeStep = item.stepIndex;
            highlightActiveScoreNote(currentPracticeStep);
            if (item.expectedPitches && item.expectedPitches.length > 0) {
              item.expectedPitches.forEach(p => playSingleNoteAudit(p));
              const auditNotes = item.expectedPitches.map(pitchStr => ({
                pitch: pitchStr,
                num: getPitchMidiNumber(pitchStr) ?? 60
              }));
              setChordPillDisplay(auditNotes);
            }
          }
        });

        // 1. Render Treble / Dyad Notes
        if (showDyads && item.dyad) {
          if (item.dyad.pitch === "-") {
            renderNoteheadOnly(noteGroup, "-", item.dyad.beats, cx, trebleBottomY, 2);
          } else {
            const pitches = item.dyad.pitch.split("+").filter(p => p !== "-");
            const sortedPitches = [...pitches].sort((a, b) => (getDiatonicStep(a) || 0) - (getDiatonicStep(b) || 0));
            pitches.forEach(p => {
              const info = renderNoteheadOnly(noteGroup, p, item.dyad.beats, cx, trebleBottomY, 2);
              if (info) {
                let isChordTop = undefined;
                if (pitches.length > 1) {
                  isChordTop = (p === sortedPitches[sortedPitches.length - 1]);
                }
                renderedNotes.push({
                  stepIndex: item.stepIndex,
                  systemIdx: s,
                  pitch: p,
                  hand: "treble",
                  tied: !!item.dyad.tied,
                  cx: info.cx,
                  cy: info.cy,
                  step: info.step,
                  stemUp: info.stemUp,
                  isChordTop
                });
              }
            });
            const actualPitches = pitches.filter(p => p !== "-");
            const startYCheat = trebleBottomY + 38;
            const lineSpacing = 13.5;
            const sorted = [...actualPitches].sort((a, b) => (getDiatonicStep(b) || 0) - (getDiatonicStep(a) || 0));
            if (showCheat && actualPitches.length > 0) {
              sorted.forEach((p, pIdx) => {
                const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
                label.setAttribute("x", cx);
                label.setAttribute("y", startYCheat + pIdx * lineSpacing);
                label.setAttribute("class", `cheat-text-composite ${actualPitches.length > 1 ? 'cheat-dyad' : 'cheat-single'}`);
                const pColor = (window.MusicTheory && window.MusicTheory.getCheatSheetNoteColor) ? window.MusicTheory.getCheatSheetNoteColor(p) : null;
                if (pColor && isCheatSheetColorsEnabled()) {
                  label.setAttribute("fill", pColor);
                }
                label.textContent = p.replace(/[0-9]/g, "").replace("#", "♯").replace("b", "♭");
                noteGroup.appendChild(label);
              });
            }
            if (showFingers && item.dyadF && item.dyadF !== "-") {
              const fLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
              fLabel.setAttribute("x", cx);
              fLabel.setAttribute("y", showCheat ? (startYCheat + sorted.length * lineSpacing + 2) : (trebleBottomY + 32));
              fLabel.setAttribute("class", "cheat-finger-label");
              fLabel.textContent = item.dyadF;
              noteGroup.appendChild(fLabel);
            }
          }
        } else if (showRH && item.rh) {
          if (item.rh.pitch === "-") {
            renderNoteheadOnly(noteGroup, "-", item.rh.beats, cx, trebleBottomY, 2);
          } else {
            const pitches = item.rh.pitch.split("+").filter(p => p !== "-");
            const sortedPitches = [...pitches].sort((a, b) => (getDiatonicStep(a) || 0) - (getDiatonicStep(b) || 0));
            pitches.forEach(p => {
              const info = renderNoteheadOnly(noteGroup, p, item.rh.beats, cx, trebleBottomY, 2);
              if (info) {
                let isChordTop = undefined;
                if (pitches.length > 1) {
                  isChordTop = (p === sortedPitches[sortedPitches.length - 1]);
                }
                renderedNotes.push({
                  stepIndex: item.stepIndex,
                  systemIdx: s,
                  pitch: p,
                  hand: "treble",
                  tied: !!item.rh.tied,
                  cx: info.cx,
                  cy: info.cy,
                  step: info.step,
                  stemUp: info.stemUp,
                  isChordTop
                });
              }
            });
            const actualPitches = pitches.filter(p => p !== "-");
            const startYCheat = trebleBottomY + 38;
            const lineSpacing = 13.5;
            const sorted = [...actualPitches].sort((a, b) => (getDiatonicStep(b) || 0) - (getDiatonicStep(a) || 0));
            if (showCheat && actualPitches.length > 0) {
              sorted.forEach((p, pIdx) => {
                const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
                label.setAttribute("x", cx);
                label.setAttribute("y", startYCheat + pIdx * lineSpacing);
                label.setAttribute("class", `cheat-text-composite ${actualPitches.length > 1 ? 'cheat-dyad' : 'cheat-single'}`);
                const pColor = (window.MusicTheory && window.MusicTheory.getCheatSheetNoteColor) ? window.MusicTheory.getCheatSheetNoteColor(p) : null;
                if (pColor && isCheatSheetColorsEnabled()) {
                  label.setAttribute("fill", pColor);
                }
                label.textContent = p.replace(/[0-9]/g, "").replace("#", "♯").replace("b", "♭");
                noteGroup.appendChild(label);
              });
            }
            const fNum = item.rh.f || item.rhF;
            if (showFingers && fNum && fNum !== "-") {
              const fLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
              fLabel.setAttribute("x", cx);
              fLabel.setAttribute("y", showCheat ? (startYCheat + sorted.length * lineSpacing + 2) : (trebleBottomY + 32));
              fLabel.setAttribute("class", "cheat-finger-label");
              fLabel.textContent = fNum;
              noteGroup.appendChild(fLabel);
            }
          }
        }

        // 2. Render Bass Notes
        if (showLH && item.lh) {
          if (item.lh.pitch === "-") {
            renderNoteheadOnly(noteGroup, "-", item.lh.beats, cx, bassBottomY, -10);
          } else {
            const lhPitches = item.lh.pitch.split("+").filter(p => p !== "-");
            const sortedLHPitches = [...lhPitches].sort((a, b) => (getDiatonicStep(a) || 0) - (getDiatonicStep(b) || 0));
            lhPitches.forEach(p => {
              const info = renderNoteheadOnly(noteGroup, p, item.lh.beats, cx, bassBottomY, -10);
              if (info) {
                let isChordTop = undefined;
                if (lhPitches.length > 1) {
                  isChordTop = (p === sortedLHPitches[sortedLHPitches.length - 1]);
                }
                renderedNotes.push({
                  stepIndex: item.stepIndex,
                  systemIdx: s,
                  pitch: p,
                  hand: "bass",
                  tied: !!item.lh.tied,
                  cx: info.cx,
                  cy: info.cy,
                  step: info.step,
                  stemUp: info.stemUp,
                  isChordTop
                });
              }
            });

            const actualLHPitches = lhPitches.filter(p => p !== "-");
            const startYBCheat = bassBottomY + 38;
            const lineSpacing = 13.5;
            const sortedB = [...actualLHPitches].sort((a, b) => (getDiatonicStep(b) || 0) - (getDiatonicStep(a) || 0));
            if (showCheat && actualLHPitches.length > 0) {
              sortedB.forEach((p, pIdx) => {
                const labelB = document.createElementNS("http://www.w3.org/2000/svg", "text");
                labelB.setAttribute("x", cx);
                labelB.setAttribute("y", startYBCheat + pIdx * lineSpacing);
                labelB.setAttribute("class", `cheat-text-composite ${actualLHPitches.length > 1 ? 'cheat-dyad' : 'cheat-single'}`);
                const pColor = (window.MusicTheory && window.MusicTheory.getCheatSheetNoteColor) ? window.MusicTheory.getCheatSheetNoteColor(p) : null;
                if (pColor && isCheatSheetColorsEnabled()) {
                  labelB.setAttribute("fill", pColor);
                }
                labelB.textContent = p.replace(/[0-9]/g, "").replace("#", "♯").replace("b", "♭");
                noteGroup.appendChild(labelB);
              });
            }
            const fNumB = item.lh.f || item.lhF;
            if (showFingers && fNumB && fNumB !== "-") {
              const fLabelB = document.createElementNS("http://www.w3.org/2000/svg", "text");
              fLabelB.setAttribute("x", cx);
              fLabelB.setAttribute("y", showCheat ? (startYBCheat + sortedB.length * lineSpacing + 2) : (bassBottomY + 32));
              fLabelB.setAttribute("class", "cheat-finger-label");
              fLabelB.textContent = fNumB;
              noteGroup.appendChild(fLabelB);
            }
          }
        }

        svg.appendChild(noteGroup);
      });
    });
  }

  // Render all Tie Arcs across notes
  renderedNotes.forEach(curNote => {
    if (curNote.tied) {
      const nextNote = renderedNotes.find(n =>
        n.hand === curNote.hand &&
        n.pitch === curNote.pitch &&
        n.stepIndex > curNote.stepIndex
      );
      if (nextNote) {
        renderTieArc(svg, curNote, nextNote, scoreWidth, rightMargin, leftMargin);
      }
    }
  });

  // Re-highlight active note in practice mode and refresh loop region overlays
  highlightActiveScoreNote(currentPracticeStep);
  updateScoreLoopHighlights();
}

function updateScoreLoopHighlights() {
  const loop = (typeof getActiveLoopBounds === "function")
    ? getActiveLoopBounds()
    : { active: false, startMeasure: 1, endMeasure: 1 };

  document.querySelectorAll(".measure-loop-band").forEach(band => {
    const m = parseInt(band.dataset.measure, 10);
    const inLoop = Boolean(loop.active && !isNaN(m) && m >= loop.startMeasure && m <= loop.endMeasure);
    band.classList.toggle("is-looped", inLoop);
  });

  document.querySelectorAll(".measure-number").forEach(mEl => {
    const m = parseInt(mEl.dataset.measure || (mEl.id || "").replace("measure_num_", ""), 10);
    const inLoop = Boolean(loop.active && !isNaN(m) && m >= loop.startMeasure && m <= loop.endMeasure);
    mEl.classList.toggle("is-in-loop", inLoop);
  });
}

function renderTieArc(svg, n1, n2, scoreWidth, rightMargin, leftMargin) {
  let curveUp = false;
  if (typeof n1.isChordTop === "boolean") {
    curveUp = n1.isChordTop;
  } else {
    curveUp = !n1.stemUp;
  }

  const ySign = curveUp ? -1 : 1;
  const yOffset = ySign * 7;

  if (n1.systemIdx === n2.systemIdx) {
    // Same system row tie arc
    const x1 = n1.cx + 5;
    const x2 = n2.cx - 5;
    const y1 = n1.cy + yOffset;
    const y2 = n2.cy + yOffset;
    const midX = (x1 + x2) / 2;
    const span = Math.max(10, x2 - x1);
    const curveDepth = ySign * Math.min(18, Math.max(8, span * 0.12));
    const midY = (y1 + y2) / 2 + curveDepth;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`);
    path.setAttribute("class", "note-tie-arc");
    svg.appendChild(path);
  } else {
    // Cross-system row tie across line break
    const x1 = n1.cx + 5;
    const x2 = scoreWidth - rightMargin;
    const y1 = n1.cy + yOffset;
    const midX1 = (x1 + x2) / 2;
    const curveDepth1 = ySign * 10;
    const midY1 = y1 + curveDepth1;

    const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path1.setAttribute("d", `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${midX1.toFixed(1)} ${midY1.toFixed(1)} ${x2.toFixed(1)} ${y1.toFixed(1)}`);
    path1.setAttribute("class", "note-tie-arc");
    svg.appendChild(path1);

    const inStartX = leftMargin + 18;
    const inEndX = n2.cx - 5;
    const y2 = n2.cy + yOffset;
    const midX2 = (inStartX + inEndX) / 2;
    const curveDepth2 = ySign * 10;
    const midY2 = y2 + curveDepth2;

    const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path2.setAttribute("d", `M ${inStartX.toFixed(1)} ${y2.toFixed(1)} Q ${midX2.toFixed(1)} ${midY2.toFixed(1)} ${inEndX.toFixed(1)} ${y2.toFixed(1)}`);
    path2.setAttribute("class", "note-tie-arc");
    svg.appendChild(path2);
  }
}

function renderNoteheadOnly(group, pitchStr, beats, cx, bottomStaffY, refDiatonicStep) {
  if (!pitchStr) return;
  if (pitchStr === "-") {
    const cy = bottomStaffY - 20; // Center line (Line 3) of staff
    if (beats >= 3.5) {
      // Whole Rest: filled rectangle hanging downward from Line 4
      const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      r.setAttribute("x", cx - 7);
      r.setAttribute("y", bottomStaffY - 30);
      r.setAttribute("width", 14);
      r.setAttribute("height", 5);
      r.setAttribute("rx", "0.5");
      r.setAttribute("class", "rest-rect");
      group.appendChild(r);
    } else if (beats >= 1.75) {
      // Half Rest: filled rectangle sitting on top of Line 3
      const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      r.setAttribute("x", cx - 7);
      r.setAttribute("y", bottomStaffY - 25);
      r.setAttribute("width", 14);
      r.setAttribute("height", 5);
      r.setAttribute("rx", "0.5");
      r.setAttribute("class", "rest-rect");
      group.appendChild(r);
      if (beats >= 2.75) {
        // Dotted Half Rest
        const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        dot.setAttribute("cx", cx + 12);
        dot.setAttribute("cy", bottomStaffY - 22.5);
        dot.setAttribute("r", "2.2");
        dot.setAttribute("class", "rest-rect");
        group.appendChild(dot);
      }
    } else if (beats >= 0.85) {
      // Classical engraved SMuFL restQuarter glyph
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const d = `M ${(cx + 3.2).toFixed(1)} ${(cy - 13.0).toFixed(1)} ` +
        `C ${(cx + 2.4).toFixed(1)} ${(cy - 13.8).toFixed(1)} ${(cx - 1.2).toFixed(1)} ${(cy - 12.5).toFixed(1)} ${(cx - 3.2).toFixed(1)} ${(cy - 9.0).toFixed(1)} ` +
        `C ${(cx - 3.8).toFixed(1)} ${(cy - 7.2).toFixed(1)} ${(cx - 3.0).toFixed(1)} ${(cy - 5.5).toFixed(1)} ${(cx - 1.0).toFixed(1)} ${(cy - 2.8).toFixed(1)} ` +
        `L ${(cx + 3.4).toFixed(1)} ${(cy + 1.6).toFixed(1)} ` +
        `C ${(cx + 3.6).toFixed(1)} ${(cy + 3.2).toFixed(1)} ${(cx + 1.2).toFixed(1)} ${(cy + 5.6).toFixed(1)} ${(cx - 2.8).toFixed(1)} ${(cy + 7.4).toFixed(1)} ` +
        `C ${(cx - 4.8).toFixed(1)} ${(cy + 8.5).toFixed(1)} ${(cx - 4.6).toFixed(1)} ${(cy + 11.0).toFixed(1)} ${(cx - 2.0).toFixed(1)} ${(cy + 13.0).toFixed(1)} ` +
        `C ${(cx + 0.2).toFixed(1)} ${(cy + 14.5).toFixed(1)} ${(cx + 2.5).toFixed(1)} ${(cy + 13.8).toFixed(1)} ${(cx + 3.4).toFixed(1)} ${(cy + 11.2).toFixed(1)} ` +
        `C ${(cx + 3.6).toFixed(1)} ${(cy + 10.4).toFixed(1)} ${(cx + 2.8).toFixed(1)} ${(cy + 10.0).toFixed(1)} ${(cx + 2.2).toFixed(1)} ${(cy + 10.6).toFixed(1)} ` +
        `C ${(cx + 1.5).toFixed(1)} ${(cy + 12.2).toFixed(1)} ${(cx - 0.2).toFixed(1)} ${(cy + 12.5).toFixed(1)} ${(cx - 1.5).toFixed(1)} ${(cy + 11.2).toFixed(1)} ` +
        `C ${(cx - 2.8).toFixed(1)} ${(cy + 10.0).toFixed(1)} ${(cx - 2.6).toFixed(1)} ${(cy + 8.4).toFixed(1)} ${(cx - 0.2).toFixed(1)} ${(cy + 6.6).toFixed(1)} ` +
        `C ${(cx + 1.4).toFixed(1)} ${(cy + 5.2).toFixed(1)} ${(cx + 1.8).toFixed(1)} ${(cy + 3.6).toFixed(1)} ${(cx + 1.2).toFixed(1)} ${(cy + 2.0).toFixed(1)} ` +
        `L ${(cx - 2.8).toFixed(1)} ${(cy - 3.6).toFixed(1)} ` +
        `C ${(cx - 3.8).toFixed(1)} ${(cy - 5.2).toFixed(1)} ${(cx - 3.0).toFixed(1)} ${(cy - 7.4).toFixed(1)} ${(cx - 1.5).toFixed(1)} ${(cy - 9.0).toFixed(1)} ` +
        `C ${(cx - 0.2).toFixed(1)} ${(cy - 10.5).toFixed(1)} ${(cx + 2.2).toFixed(1)} ${(cy - 11.5).toFixed(1)} ${(cx + 3.2).toFixed(1)} ${(cy - 13.0).toFixed(1)} Z`;
      path.setAttribute("d", d);
      path.setAttribute("class", "rest-glyph");
      group.appendChild(path);
      if (beats >= 1.4) {
        const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        dot.setAttribute("cx", cx + 8);
        dot.setAttribute("cy", cy + 5);
        dot.setAttribute("r", "2.2");
        dot.setAttribute("class", "rest-rect");
        group.appendChild(dot);
      }
    } else {
      // Eighth Rest: standard vector path
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const d = `M ${cx + 2.5} ${cy - 7} ` +
        `C ${cx} ${cy - 9} ${cx - 4} ${cy - 8.5} ${cx - 5.5} ${cy - 6} ` +
        `C ${cx - 6.5} ${cy - 4} ${cx - 5} ${cy - 2} ${cx - 3} ${cy - 2.5} ` +
        `C ${cx - 1.5} ${cy - 3} ${cx - 2} ${cy - 5} ${cx - 3.5} ${cy - 5.5} ` +
        `C ${cx - 4} ${cy - 5.7} ${cx - 3.5} ${cy - 7} ${cx - 0.5} ${cy - 6.5} ` +
        `L ${cx + 2} ${cy - 5.5} ` +
        `L ${cx - 3} ${cy + 9} ` +
        `L ${cx - 1} ${cy + 9} ` +
        `L ${cx + 3.5} ${cy - 6.5} Z`;
      path.setAttribute("d", d);
      path.setAttribute("class", "rest-glyph");
      group.appendChild(path);
      if (beats >= 0.7) {
        const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        dot.setAttribute("cx", cx + 7);
        dot.setAttribute("cy", cy - 4);
        dot.setAttribute("r", "2.0");
        dot.setAttribute("class", "rest-rect");
        group.appendChild(dot);
      }
    }
    return;
  }
  const step = getDiatonicStep(pitchStr);
  if (step === null) return;

  const halfStepPx = 5;
  const cy = bottomStaffY - (step - refDiatonicStep) * halfStepPx;

  if (pitchStr.includes("#")) {
    const sharp = document.createElementNS("http://www.w3.org/2000/svg", "text");
    sharp.setAttribute("x", cx - 14);
    sharp.setAttribute("y", cy + 5);
    sharp.setAttribute("class", "accidental-symbol");
    sharp.textContent = "♯";
    group.appendChild(sharp);
  } else if (pitchStr.includes("b")) {
    const flat = document.createElementNS("http://www.w3.org/2000/svg", "text");
    flat.setAttribute("x", cx - 13);
    flat.setAttribute("y", cy + 4);
    flat.setAttribute("class", "accidental-symbol");
    flat.textContent = "♭";
    group.appendChild(flat);
  }

  // Ledger lines (Treble: ref=2, Bass: ref=-10)
  if (refDiatonicStep === 2 && step <= 0) { // Below Treble Staff (Middle C, etc.)
    for (let s = 0; s >= step; s -= 2) {
      const lY = bottomStaffY - (s - refDiatonicStep) * halfStepPx;
      const lLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      lLine.setAttribute("x1", cx - 11);
      lLine.setAttribute("y1", lY);
      lLine.setAttribute("x2", cx + 11);
      lLine.setAttribute("y2", lY);
      lLine.setAttribute("class", "ledger-line");
      group.appendChild(lLine);
    }
  } else if (refDiatonicStep === 2 && step >= 12) { // Above Treble Staff
    for (let s = 12; s <= step; s += 2) {
      const lY = bottomStaffY - (s - refDiatonicStep) * halfStepPx;
      const lLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      lLine.setAttribute("x1", cx - 11);
      lLine.setAttribute("y1", lY);
      lLine.setAttribute("x2", cx + 11);
      lLine.setAttribute("y2", lY);
      lLine.setAttribute("class", "ledger-line");
      group.appendChild(lLine);
    }
  } else if (refDiatonicStep === -10 && step >= 0) { // Above Bass Staff (Middle C, etc.)
    for (let s = 0; s <= step; s += 2) {
      const lY = bottomStaffY - (s - refDiatonicStep) * halfStepPx;
      const lLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      lLine.setAttribute("x1", cx - 11);
      lLine.setAttribute("y1", lY);
      lLine.setAttribute("x2", cx + 11);
      lLine.setAttribute("y2", lY);
      lLine.setAttribute("class", "ledger-line");
      group.appendChild(lLine);
    }
  } else if (refDiatonicStep === -10 && step <= -12) { // Below Bass Staff (E2, C2, etc.)
    for (let s = -12; s >= step; s -= 2) {
      const lY = bottomStaffY - (s - refDiatonicStep) * halfStepPx;
      const lLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      lLine.setAttribute("x1", cx - 11);
      lLine.setAttribute("y1", lY);
      lLine.setAttribute("x2", cx + 11);
      lLine.setAttribute("y2", lY);
      lLine.setAttribute("class", "ledger-line");
      group.appendChild(lLine);
    }
  }

  const isHollow = (beats >= 2);
  const head = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
  head.setAttribute("cx", cx);
  head.setAttribute("cy", cy);
  head.setAttribute("rx", "5.8");
  head.setAttribute("ry", "4.2");
  head.setAttribute("transform", `rotate(-20, ${cx}, ${cy})`);
  head.setAttribute("class", isHollow ? "notehead-hollow" : "notehead");
  group.appendChild(head);

  if (beats < 4) {
    const stem = document.createElementNS("http://www.w3.org/2000/svg", "line");
    const stemUp = (step < (refDiatonicStep + 4));
    if (stemUp) {
      stem.setAttribute("x1", cx + 5.2);
      stem.setAttribute("y1", cy - 1);
      stem.setAttribute("x2", cx + 5.2);
      stem.setAttribute("y2", cy - 28);
    } else {
      stem.setAttribute("x1", cx - 5.2);
      stem.setAttribute("y1", cy + 1);
      stem.setAttribute("x2", cx - 5.2);
      stem.setAttribute("y2", cy + 28);
    }
    stem.setAttribute("class", "notestem");
    group.appendChild(stem);

    if (beats <= 0.28) {
      const flag1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const flag2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      if (stemUp) {
        flag1.setAttribute("d", `M ${cx + 5.2} ${cy - 28} Q ${cx + 12} ${cy - 22} ${cx + 12} ${cy - 14}`);
        flag2.setAttribute("d", `M ${cx + 5.2} ${cy - 22} Q ${cx + 12} ${cy - 16} ${cx + 12} ${cy - 8}`);
      } else {
        flag1.setAttribute("d", `M ${cx - 5.2} ${cy + 28} Q ${cx + 2} ${cy + 22} ${cx + 2} ${cy + 14}`);
        flag2.setAttribute("d", `M ${cx - 5.2} ${cy + 22} Q ${cx + 2} ${cy + 16} ${cx + 2} ${cy + 8}`);
      }
      flag1.setAttribute("fill", "none");
      flag1.setAttribute("stroke", "currentColor");
      flag1.setAttribute("stroke-width", "1.6");
      flag2.setAttribute("fill", "none");
      flag2.setAttribute("stroke", "currentColor");
      flag2.setAttribute("stroke-width", "1.6");
      group.appendChild(flag1);
      group.appendChild(flag2);
    } else if (beats > 0.28 && beats <= 0.78) {
      const flag = document.createElementNS("http://www.w3.org/2000/svg", "path");
      if (stemUp) flag.setAttribute("d", `M ${cx + 5.2} ${cy - 28} Q ${cx + 12} ${cy - 22} ${cx + 12} ${cy - 14}`);
      else flag.setAttribute("d", `M ${cx - 5.2} ${cy + 28} Q ${cx + 2} ${cy + 22} ${cx + 2} ${cy + 14}`);
      flag.setAttribute("fill", "none");
      flag.setAttribute("stroke", "currentColor");
      flag.setAttribute("stroke-width", "1.6");
      group.appendChild(flag);

      if (beats >= 0.30 && beats <= 0.36) {
        const tri = document.createElementNS("http://www.w3.org/2000/svg", "text");
        tri.setAttribute("x", stemUp ? (cx + 5) : (cx - 5));
        tri.setAttribute("y", stemUp ? (cy - 31) : (cy + 37));
        tri.setAttribute("class", "triplet-marker");
        tri.textContent = "3";
        group.appendChild(tri);
      }
    }
  }

  if (Math.abs(beats - 0.75) < 0.05 || Math.abs(beats - 1.5) < 0.05 || Math.abs(beats - 3.0) < 0.05) {
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", cx + 9);
    dot.setAttribute("cy", cy - 1);
    dot.setAttribute("r", "2");
    dot.setAttribute("fill", "currentColor");
    group.appendChild(dot);
  }

  const stemUp = (step < (refDiatonicStep + 4));
  return { cx, cy, step, stemUp };
}

// VIEWPORT AUTO-SCROLL & SCORE HIGHLIGHTING
function autoScrollScoreToNote(targetEl, smooth = true) {
  if (!targetEl) return;
  const container = document.getElementById("sheetMusicSection");
  if (!container) return;

  const targetRect = targetEl.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  // If container or target has no layout (e.g. hidden), return
  if (containerRect.height === 0 || targetRect.height === 0) return;

  const relativeTop = targetRect.top - containerRect.top;
  const relativeBottom = targetRect.bottom - containerRect.top;
  const containerH = container.clientHeight;

  // Reading comfort zone: if note is already comfortably visible, do not scroll
  const padTop = 60;
  const padBottom = 80;

  if (relativeTop >= padTop && relativeBottom <= (containerH - padBottom)) {
    return;
  }

  // Calculate absolute vertical coordinate in the container's scroll canvas
  const noteAbsoluteY = container.scrollTop + relativeTop + (targetRect.height / 2);

  // Position note comfortably around 38% down the container viewport
  const desiredScrollTop = Math.max(0, Math.round(noteAbsoluteY - (containerH * 0.38)));

  const now = performance.now();
  // Mid-scroll animation guard: if already smoothly animating towards this target, do not interrupt
  if (smooth && lastScoreScrollTarget !== null && (now - lastScoreScrollTime < 400)) {
    if (Math.abs(lastScoreScrollTarget - desiredScrollTop) < 60) {
      return;
    }
  }

  if (Math.abs(container.scrollTop - desiredScrollTop) < 6) {
    return;
  }

  lastScoreScrollTarget = desiredScrollTop;
  lastScoreScrollTime = now;

  // Direct container scroll (never touches window.scrollY, never triggers Chromium SVG scrollIntoView bug)
  container.scrollTo({
    top: desiredScrollTop,
    behavior: smooth ? "smooth" : "auto"
  });
}

function highlightActiveScoreNote(stepIdx, autoScroll = true) {
  if (typeof clearWaitPracticeTimer === "function") clearWaitPracticeTimer();
  stepFulfilledPitches.clear();
  document.querySelectorAll(".note-group").forEach(g => g.classList.remove("active-target", "error-target"));
  const targetEl = document.getElementById(`staff_note_${stepIdx}`);

  if (targetEl) {
    targetEl.classList.add("active-target");
    
    // Anti-bounce direct container follow-scroll
    if (autoScroll) {
      autoScrollScoreToNote(targetEl, true);
    }
  }

  // Update HUD
  const step = songNoteSteps[stepIdx];
  const progressText = document.getElementById("hudProgressText");

  if (step) {
    // Only carry over pitches that are genuinely tied in their voice from the prior step
    if (step.tiedFromPrev && isWaitPracticeMode && Array.isArray(step.tiedPitches) && step.tiedPitches.length > 0) {
      step.tiedPitches.forEach(p => {
        const isHeld = (typeof isPitchActivelySustained === "function")
          ? isPitchActivelySustained(p)
          : (typeof activeHeldKeyAttacks !== "undefined" && activeHeldKeyAttacks.has(getCanonicalMidiNumber ? getCanonicalMidiNumber(p) : p));
        if (isHeld) {
          stepFulfilledPitches.add(p);
        }
      });
    }

    updateTargetBadgeDisplay(step, stepFulfilledPitches);
    if (typeof updateKeyboardTargetHighlights === "function") {
      updateKeyboardTargetHighlights(step, stepFulfilledPitches);
    }
    progressText.textContent = `Note: ${stepIdx + 1} / ${songNoteSteps.length} (Meas ${step.measure})`;
    if (typeof transportState !== "undefined" && transportState.status === "stopped") {
      transportState.currentStepIndex = Math.max(0, Math.min(Math.max(0, songNoteSteps.length - 1), stepIdx));
      if (typeof updateTransportUI === "function") updateTransportUI();
    }

    // If next non-tied repeated pitch is still physically held down, coach student to lift & re-press
    if (isWaitPracticeMode && !isSongFinished && stepIdx > 0 && Array.isArray(step.expectedPitches) && step.expectedPitches.length > 0) {
      const heldRepressPitches = step.expectedPitches.filter(p =>
        !stepFulfilledPitches.has(p) &&
        typeof isPitchActivelyHeld === "function" &&
        isPitchActivelyHeld(p)
      );
      if (heldRepressPitches.length > 0) {
        const feedbackText = document.getElementById("hudFeedbackText");
        if (feedbackText) {
          const repressNote = `🔁 Lift & re-press ${heldRepressPitches.join(" + ")}`;
          if (feedbackText.dataset.baseText) {
            feedbackText.textContent = `${feedbackText.dataset.baseText} • ${repressNote}`;
          } else {
            feedbackText.style.color = "#fbbf24";
            feedbackText.textContent = `${repressNote}!`;
          }
        }
      }
    }

    if (step.tiedFromPrev && isWaitPracticeMode && step.expectedPitches && step.expectedPitches.length > 0) {
      const isFullyFulfilled = (stepFulfilledPitches.size >= step.expectedPitches.length);
      if (isFullyFulfilled) {
        const feedbackText = document.getElementById("hudFeedbackText");
        if (feedbackText) {
          feedbackText.style.color = "#34d399";
          const tieMsg = `🔗 Tied note — hold ${step.expectedPitches.join(" + ")} (${step.beats || 1}b)...`;
          feedbackText.dataset.baseText = tieMsg;
          feedbackText.textContent = tieMsg;
        }
        const tempo = (typeof getCurrentTempoBpm === "function") ? getCurrentTempoBpm() : (currentSong ? (currentSong.tempo || 90) : 90);
        const tieHoldDurationMs = Math.max(250, (step.beats || 1) * (60000 / tempo));
        const tiedCheckList = Array.isArray(step.tiedPitches) ? [...step.tiedPitches] : [...step.expectedPitches];
        waitPracticeStepTimerId = setTimeout(() => {
          waitPracticeStepTimerId = null;
          if (currentPracticeStep === stepIdx && isWaitPracticeMode && !isSongFinished) {
            const stillSustained = tiedCheckList.every(p =>
              typeof isPitchActivelySustained === "function" ? isPitchActivelySustained(p) : true
            );
            if (stillSustained) {
              advancePracticeStep();
            }
          }
        }, tieHoldDurationMs);
        return;
      }
    }

    if ((!step.expectedPitches || step.expectedPitches.length === 0) && isWaitPracticeMode) {
      const feedbackText = document.getElementById("hudFeedbackText");
      const nextStep = songNoteSteps[stepIdx + 1];
      const nextLabel = (nextStep && nextStep.expectedPitches && nextStep.expectedPitches.length > 0)
        ? nextStep.expectedPitches.join(" + ")
        : "first note";

      if (stepIdx === 0 && !isPracticeSessionStarted) {
        // Opening pickup rest: Do NOT auto-advance with a silent 500ms timer on page load!
        // Keep the rest highlighted in amber with a clear count-in prompt
        if (feedbackText) {
          feedbackText.style.color = "#f59e0b";
          feedbackText.textContent = `𝄽 Count in: play ${nextLabel} to begin!`;
          delete feedbackText.dataset.baseText;
        }
        return;
      }

      if (feedbackText) {
        feedbackText.style.color = "#f59e0b";
        feedbackText.textContent = `𝄽 Rest: pause for ${step.beats || 1} beat${(step.beats || 1) === 1 ? '' : 's'}...`;
        delete feedbackText.dataset.baseText;
      }

      const tempo = (typeof getCurrentTempoBpm === "function") ? getCurrentTempoBpm() : (currentSong ? (currentSong.tempo || 90) : 90);
      const restDurationMs = Math.max(250, (step.beats || 1) * (60000 / tempo));
      waitPracticeStepTimerId = setTimeout(() => {
        waitPracticeStepTimerId = null;
        if (currentPracticeStep === stepIdx && isWaitPracticeMode && !isSongFinished) {
          advancePracticeStep();
        }
      }, restDurationMs);
    }
  } else {
    const targetBadge = document.getElementById("hudTargetBadge");
    if (targetBadge) targetBadge.textContent = "DONE! 🎉";
    document.getElementById("hudFeedbackText").textContent = "Magnificent! Piece completed!";
    if (typeof updateKeyboardTargetHighlights === "function") {
      updateKeyboardTargetHighlights(null);
    }
  }
}

// POST-SONG PERFORMANCE REVIEW MODAL & TELEMETRY
function playVictoryFanfare() {
  if (!isSynthAudioEnabled() || typeof audioCtx === "undefined" || !audioCtx) return;
  // Arpeggiated celebratory C major fanfare
  const notes = [
    { freq: 523.25, time: 0, dur: 0.18 },     // C5
    { freq: 659.25, time: 0.14, dur: 0.18 },   // E5
    { freq: 783.99, time: 0.28, dur: 0.22 },   // G5
    { freq: 1046.50, time: 0.44, dur: 0.65 }   // C6
  ];
  notes.forEach(n => {
    setTimeout(() => {
      if (isSynthAudioEnabled()) playTone(n.freq, n.dur);
    }, n.time * 1000);
  });
}

function annotateScoreMistakeMeasures(mistakeMeasures) {
  document.querySelectorAll(".measure-number").forEach(el => {
    el.classList.remove("has-mistake");
  });
  if (!mistakeMeasures) return;
  mistakeMeasures.forEach(mNum => {
    const mEl = document.getElementById(`measure_num_${mNum}`);
    if (mEl) {
      mEl.classList.add("has-mistake");
      mEl.setAttribute("title", `⚠️ Errors occurred in Measure ${mNum}`);
    }
  });
}

function completeSongPerformance(accuracy, mode = "wait", flowStats = null) {
  isSongFinished = true;
  isPracticeSessionStarted = false;
  if (!sessionEndTime) sessionEndTime = performance.now();

  const durationSec = (sessionStartTime > 0 && sessionEndTime > sessionStartTime)
    ? Math.max(1, Math.round((sessionEndTime - sessionStartTime) / 1000))
    : Math.max(1, Math.round((songNoteSteps.length * 60) / (currentSong ? currentSong.tempo || 90 : 90)));

  let stars = "⭐";
  if (accuracy >= 92) stars = "⭐⭐⭐";
  else if (accuracy >= 78) stars = "⭐⭐";

  let letterGrade = "D";
  let gradeClass = "grade-d";
  let verdict = "Needs more practice. Try slowing the tempo down and looping difficult measures!";
  if (accuracy >= 98) {
    letterGrade = "S";
    gradeClass = "grade-s";
    verdict = "Virtually flawless mastery! Superb finger control and note accuracy.";
  } else if (accuracy >= 90) {
    letterGrade = "A";
    gradeClass = "grade-a";
    verdict = "Outstanding performance! Great phrasing and fluid hand execution.";
  } else if (accuracy >= 80) {
    letterGrade = "B";
    gradeClass = "grade-b";
    verdict = "Solid playing! A few minor slips — loop the problem measures to lock it down.";
  } else if (accuracy >= 70) {
    letterGrade = "C";
    gradeClass = "grade-c";
    verdict = "Passable run. Focus on trouble measures with A-B loop before speeding up.";
  }

  // Check previous best
  let prevBestAcc = null;
  try {
    const prev = localStorage.getItem(`piano_mastery_${currentSong ? currentSong.id : 'piece'}`);
    if (prev) {
      const parsed = JSON.parse(prev);
      if (typeof parsed.accuracy === "number") prevBestAcc = parsed.accuracy;
    }
  } catch (e) {}

  const totalCorrect = (mode === "tempo-flow" && flowStats) ? (flowStats.perfect + flowStats.good) : practiceStats.correct;
  const totalAttempts = (mode === "tempo-flow" && flowStats) ? flowStats.total : practiceStats.attempts;

  lastSongPerformance = {
    songId: currentSong ? currentSong.id : "piece",
    songTitle: currentSong ? currentSong.title : "Piece",
    category: currentSong ? currentSong.category : "Repertoire",
    level: (typeof activeCurriculumLevel !== "undefined" && activeCurriculumLevel) ? `Level ${activeCurriculumLevel}` : "Custom",
    accuracy,
    letterGrade,
    gradeClass,
    stars,
    verdict,
    correct: totalCorrect,
    attempts: totalAttempts,
    totalNotes: songNoteSteps ? songNoteSteps.filter(s => s.expectedPitches && s.expectedPitches.length > 0).length : totalAttempts,
    peakStreak: Math.max(sessionBestStreak, sessionCurrentStreak),
    durationSec,
    bpm: (typeof getCurrentTempoBpm === "function") ? getCurrentTempoBpm() : (currentSong ? currentSong.tempo : 96),
    prevBestAcc,
    mode,
    flowStats,
    mistakeMeasures: Array.from(sessionMistakeMeasures).sort((a, b) => a - b),
    mistakeNotes: [...sessionMistakeNotes],
    date: new Date().toLocaleDateString()
  };

  // Persist mastery
  try {
    localStorage.setItem(`piano_mastery_${currentSong ? currentSong.id : 'piece'}`, JSON.stringify({
      stars,
      accuracy,
      letterGrade,
      peakStreak: lastSongPerformance.peakStreak,
      date: lastSongPerformance.date
    }));
  } catch (e) {}

  // Mark celebratory final notehead on staff
  document.querySelectorAll(".note-group").forEach(g => g.classList.remove("active-target"));
  if (songNoteSteps && songNoteSteps.length > 0) {
    const lastEl = document.getElementById(`staff_note_${songNoteSteps.length - 1}`);
    if (lastEl) lastEl.classList.add("completed-target");
  }

  // Annotate mistake measures on the sheet music
  annotateScoreMistakeMeasures(sessionMistakeMeasures);

  // Play victory chime
  playVictoryFanfare();

  // Update HUD status & reveal persistent Review Results buttons
  const feedbackText = document.getElementById("hudFeedbackText");
  if (feedbackText) {
    feedbackText.innerHTML = `🎉 <strong>Piece Finished (${accuracy}% • Grade ${letterGrade})!</strong> Review results or replay when ready.`;
    feedbackText.style.color = "#34d399";
  }
  const targetBadge = document.getElementById("hudTargetBadge");
  if (targetBadge) {
    targetBadge.innerHTML = `<span style="color:#34d399; font-weight:900;">DONE! 🏆</span>`;
  }
  const openReviewBtn = document.getElementById("openReviewBtn");
  if (openReviewBtn) openReviewBtn.style.display = "inline-flex";
  const hudReviewBtn = document.getElementById("hudReviewResultsBtn");
  if (hudReviewBtn) hudReviewBtn.style.display = "inline-flex";

  // Display comprehensive review modal
  showSongReviewModal();
}

function showSongReviewModal() {
  if (!lastSongPerformance) return;
  const modal = document.getElementById("songReviewModal");
  if (!modal) return;

  const p = lastSongPerformance;

  // Title & Subtitle
  const titleEl = document.getElementById("reviewModalTitle");
  if (titleEl) titleEl.textContent = `${p.songTitle} Complete!`;
  const subEl = document.getElementById("reviewModalSubtitle");
  if (subEl) {
    const modeLabel = p.mode === "tempo-flow" ? "🥁 Tempo Flow Mode" : "🎯 Wait-for-Me Practice";
    subEl.textContent = `${p.songTitle} • ${p.category} (${p.level}) • ${modeLabel}`;
  }

  // Hero Grade & Stars
  const gradeBadge = document.getElementById("reviewGradeBadge");
  if (gradeBadge) {
    gradeBadge.textContent = p.letterGrade;
    gradeBadge.className = `review-grade-badge ${p.gradeClass}`;
  }
  const starsBanner = document.getElementById("reviewStarsBanner");
  if (starsBanner) starsBanner.textContent = p.stars;

  const accVal = document.getElementById("reviewAccuracyPct");
  if (accVal) accVal.textContent = `${p.accuracy}%`;

  const verdictEl = document.getElementById("reviewPedagogicalVerdict");
  if (verdictEl) verdictEl.textContent = p.verdict;

  // Metric 1: Note Precision
  const notesRatio = document.getElementById("reviewNotesRatio");
  if (notesRatio) notesRatio.textContent = `${p.correct} / ${Math.max(p.attempts, p.correct)}`;
  const missCount = document.getElementById("reviewMissCount");
  if (missCount) {
    const misses = Math.max(0, p.attempts - p.correct);
    missCount.textContent = misses === 0 ? "0 Misses • 100% clean" : `${misses} Missed Strike${misses > 1 ? 's' : ''}`;
  }

  // Metric 2: Streak & Cleanliness
  const peakStreak = document.getElementById("reviewPeakStreak");
  if (peakStreak) peakStreak.textContent = `${p.peakStreak} Notes`;
  const cleanliness = document.getElementById("reviewCleanliness");
  if (cleanliness) {
    cleanliness.textContent = p.mistakeMeasures.length === 0 ? "Flawless uninterrupted run" : `${p.mistakeMeasures.length} trouble measure${p.mistakeMeasures.length > 1 ? 's' : ''}`;
  }

  // Metric 3: Rhythm & Timing
  const timingMain = document.getElementById("reviewTimingMain");
  const timingSub = document.getElementById("reviewTimingSub");
  if (p.mode === "tempo-flow" && p.flowStats) {
    if (timingMain) timingMain.textContent = `${p.flowStats.perfect} Perfect`;
    if (timingSub) timingSub.textContent = `✨ ${p.flowStats.good} Good • ⚠️ ${p.flowStats.lateOrEarly} Late/Early • ❌ ${p.flowStats.missed} Miss`;
  } else {
    if (timingMain) timingMain.textContent = p.accuracy >= 90 ? "Precise Rhythm" : "Good Control";
    const totalHolds = sessionRhythmCounts.flawless + sessionRhythmCounts.shortTap + sessionRhythmCounts.other;
    if (timingSub) {
      timingSub.textContent = totalHolds > 0
        ? `${sessionRhythmCounts.flawless} Flawless Hold${sessionRhythmCounts.flawless !== 1 ? 's' : ''} • ${sessionRhythmCounts.shortTap} Staccato`
        : "Standard Wait-for-Me pacing";
    }
  }

  // Metric 4: Time & Tempo
  const timeDur = document.getElementById("reviewTimeDuration");
  if (timeDur) {
    const mins = Math.floor(p.durationSec / 60);
    const secs = p.durationSec % 60;
    timeDur.textContent = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }
  const tempoAndBest = document.getElementById("reviewTempoAndBest");
  if (tempoAndBest) {
    const bestStr = (p.prevBestAcc !== null && p.prevBestAcc !== undefined) ? `Best: ${Math.max(p.prevBestAcc, p.accuracy)}%` : `First Logged Run`;
    tempoAndBest.textContent = `Played @ ${p.bpm} BPM • ${bestStr}`;
  }

  // Problem Measures Diagnostic
  const diagPanel = document.getElementById("reviewDiagnosticPanel");
  const diagTitle = document.getElementById("diagnosticTitle");
  const diagDesc = document.getElementById("diagnosticDesc");
  const loopMistakesBtn = document.getElementById("reviewLoopMistakesBtn");

  if (p.mistakeMeasures.length > 0) {
    if (diagPanel) diagPanel.style.display = "flex";
    if (diagTitle) diagTitle.textContent = `Difficult Measures: Measure ${p.mistakeMeasures.join(", ")}`;
    if (diagDesc) diagDesc.textContent = `Errors detected in ${p.mistakeMeasures.length} measure${p.mistakeMeasures.length > 1 ? 's' : ''}. Loop them to build muscle memory!`;
    if (loopMistakesBtn) {
      loopMistakesBtn.style.display = "inline-flex";
      const minM = Math.min(...p.mistakeMeasures);
      const maxM = Math.max(...p.mistakeMeasures);
      loopMistakesBtn.textContent = `🔁 Loop Measures ${minM}–${maxM}`;
    }
  } else {
    if (diagPanel) diagPanel.style.display = "flex";
    if (diagTitle) diagTitle.textContent = "🌟 Flawless Mastery!";
    if (diagDesc) diagDesc.textContent = "Zero mistakes across the entire piece. You played every note with complete confidence.";
    if (loopMistakesBtn) loopMistakesBtn.style.display = "none";
  }

  modal.classList.add("is-open");
  modal.style.display = "flex";
}

function closeSongReviewModal() {
  const modal = document.getElementById("songReviewModal");
  if (modal) {
    modal.classList.remove("is-open");
    modal.style.display = "none";
  }
}

function replaySongPractice() {
  if (typeof stopPlayback === "function") {
    stopPlayback(false);
  }
  closeSongReviewModal();
  isSongFinished = false;
  isPracticeSessionStarted = false;
  sessionStartTime = 0;
  sessionEndTime = 0;
  sessionCurrentStreak = 0;
  sessionBestStreak = 0;
  sessionMistakeMeasures.clear();
  sessionMistakeNotes = [];
  sessionRhythmCounts = { flawless: 0, shortTap: 0, other: 0 };
  practiceStats = { correct: 0, attempts: 0, cleanLoop: true };
  currentPracticeStep = 0;
  if (typeof transportState !== "undefined") {
    transportState.currentStepIndex = 0;
  }

  // Clear completed highlights
  document.querySelectorAll(".note-group").forEach(g => g.classList.remove("completed-target", "active-target", "error-target"));
  annotateScoreMistakeMeasures(null);

  const scoreContainer = document.getElementById("sheetMusicSection");
  if (scoreContainer) {
    scoreContainer.scrollTo({ top: 0, behavior: "smooth" });
  }
  lastScoreScrollTarget = 0;
  lastScoreScrollTime = 0;

  highlightActiveScoreNote(0, false);
  updateScoreLoopHighlights();
  if (typeof updateTransportUI === "function") {
    updateTransportUI();
  }
  const firstStep = songNoteSteps[0];
  const nextLabel = (firstStep && firstStep.expectedPitches && firstStep.expectedPitches.length > 0)
    ? firstStep.expectedPitches.join(" + ")
    : (songNoteSteps[1] ? songNoteSteps[1].expectedPitches.join(" + ") : "first note");
  const feedbackText = document.getElementById("hudFeedbackText");
  if (feedbackText) {
    feedbackText.style.color = "#38bdf8";
    feedbackText.textContent = `Piece restarted! Play ${nextLabel} to begin...`;
  }
}

function loopProblemMeasures() {
  if (!lastSongPerformance || !lastSongPerformance.mistakeMeasures || lastSongPerformance.mistakeMeasures.length === 0) {
    closeSongReviewModal();
    return;
  }
  const minM = Math.min(...lastSongPerformance.mistakeMeasures);
  const maxM = Math.max(...lastSongPerformance.mistakeMeasures);

  const startInput = document.getElementById("loopStartMeasure");
  const endInput = document.getElementById("loopEndMeasure");
  const loopToggle = document.getElementById("toggleLoopSection");

  if (startInput) startInput.value = minM;
  if (endInput) endInput.value = maxM;
  if (loopToggle) loopToggle.checked = true;

  closeSongReviewModal();
  isSongFinished = false;
  isPracticeSessionStarted = false;

  // Jump directly to the first step of minM
  const targetStep = songNoteSteps.find(s => s.measure >= minM) || songNoteSteps[0];
  currentPracticeStep = targetStep ? targetStep.index : 0;
  if (typeof transportState !== "undefined") {
    transportState.currentStepIndex = currentPracticeStep;
  }
  highlightActiveScoreNote(currentPracticeStep, true);
  updateScoreLoopHighlights();
  if (typeof updateTransportUI === "function") {
    updateTransportUI();
  }

  const feedbackText = document.getElementById("hudFeedbackText");
  if (feedbackText) {
    feedbackText.style.color = "#fbbf24";
    feedbackText.textContent = `🔁 Focused practice on Measures ${minM}–${maxM}. Play target note to begin!`;
  }
}

function advanceToNextSong() {
  closeSongReviewModal();
  if (!currentSong) return;

  const curLevel = (typeof activeCurriculumLevel !== "undefined" && activeCurriculumLevel && curriculumLevels[activeCurriculumLevel])
    ? curriculumLevels[activeCurriculumLevel]
    : null;
  let candidateSongs = songDatabase;
  if (curLevel && curLevel.config && curLevel.config.filter) {
    candidateSongs = songDatabase.filter(s => s.category === curLevel.config.filter);
  }
  if (!candidateSongs || candidateSongs.length === 0) candidateSongs = songDatabase;

  const curIdx = candidateSongs.findIndex(s => s.id === currentSong.id);
  const nextIdx = (curIdx >= 0 && curIdx < candidateSongs.length - 1) ? curIdx + 1 : 0;
  const nextSong = candidateSongs[nextIdx];
  if (nextSong) {
    loadSong(nextSong);
  }
}

function openLastReview() {
  if (!lastSongPerformance) {
    try {
      const saved = localStorage.getItem(`piano_mastery_${currentSong ? currentSong.id : 'piece'}`);
      if (saved) {
        const p = JSON.parse(saved);
        completeSongPerformance(p.accuracy || 100, "wait");
        return;
      }
    } catch (e) {}
    const feedback = document.getElementById("hudFeedbackText");
    if (feedback) feedback.textContent = "Finish playing this piece to see performance results!";
    return;
  }
  showSongReviewModal();
}

function showPerformanceToast(accuracy, songTitle) {
  const toast = document.getElementById("perfToast");
  if (!toast) return;
  const starsEl = document.getElementById("perfStars");
  const titleEl = document.getElementById("perfTitle");
  const bodyEl = document.getElementById("perfBody");

  let stars = "⭐";
  if (accuracy >= 92) stars = "⭐⭐⭐";
  else if (accuracy >= 78) stars = "⭐⭐";

  if (starsEl) starsEl.textContent = stars;
  if (titleEl) titleEl.textContent = `${songTitle} Complete!`;
  if (bodyEl) bodyEl.textContent = `Mastery: ${accuracy}% accuracy (${practiceStats.correct} / ${practiceStats.attempts} total notes played)`;
  toast.style.display = "block";

  try {
    localStorage.setItem(`piano_mastery_${currentSong ? currentSong.id : 'piece'}`, JSON.stringify({
      stars, accuracy, date: new Date().toLocaleDateString()
    }));
  } catch (e) {}

  setTimeout(() => { if (toast) toast.style.display = "none"; }, 5500);
}

function initReviewModalControls() {
  document.getElementById("perfCloseBtn")?.addEventListener("click", () => {
    const toast = document.getElementById("perfToast");
    if (toast) toast.style.display = "none";
  });
  document.getElementById("hudRestartBtn")?.addEventListener("click", () => {
    replaySongPractice();
  });
  document.getElementById("hudReviewResultsBtn")?.addEventListener("click", () => {
    openLastReview();
  });
  document.getElementById("openReviewBtn")?.addEventListener("click", () => {
    openLastReview();
  });
  document.getElementById("closeReviewModalBtn")?.addEventListener("click", () => {
    closeSongReviewModal();
  });
  document.getElementById("reviewInspectScoreBtn")?.addEventListener("click", () => {
    closeSongReviewModal();
  });
  document.getElementById("reviewReplayBtn")?.addEventListener("click", () => {
    replaySongPractice();
  });
  document.getElementById("reviewLoopMistakesBtn")?.addEventListener("click", () => {
    loopProblemMeasures();
  });
  document.getElementById("reviewNextSongBtn")?.addEventListener("click", () => {
    advanceToNextSong();
  });
  document.getElementById("songReviewModal")?.addEventListener("click", (e) => {
    if (e.target.id === "songReviewModal") {
      closeSongReviewModal();
    }
  });
}
