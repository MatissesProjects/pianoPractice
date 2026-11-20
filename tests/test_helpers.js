const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const ROOT_DIR = path.join(__dirname, "..");

/**
 * Loads index.html, linked local stylesheets (styles.css), and classic js/*.js modules
 * in exact script load order, with line endings normalized to \n.
 */
function loadProjectSources() {
  const htmlPath = path.join(ROOT_DIR, "index.html");
  const html = fs.readFileSync(htmlPath, "utf8").replace(/\r\n/g, "\n");

  // Discover local CSS stylesheets
  const cssFiles = {};
  const cssPaths = [];
  for (const m of html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi)) {
    const rel = m[1];
    if (!/^https?:\/\//i.test(rel)) {
      const full = path.join(ROOT_DIR, rel);
      if (fs.existsSync(full)) {
        cssPaths.push(rel);
        cssFiles[rel] = fs.readFileSync(full, "utf8").replace(/\r\n/g, "\n");
      }
    }
  }
  const css = cssPaths.map(p => cssFiles[p]).join("\n");

  // Discover classic <script src="..."> modules in exact HTML load order
  const allScriptPaths = [];
  const scriptPaths = [];
  const scripts = {};
  for (const m of html.matchAll(/<script\b([^>]*)src=["']([^"']+)["']([^>]*)><\/script>/gi)) {
    const attrs = (m[1] + " " + m[3]).toLowerCase();
    const rel = m[2];
    allScriptPaths.push(rel);
    if (rel.startsWith("js/") && !attrs.includes("type=\"module\"")) {
      const full = path.join(ROOT_DIR, rel);
      if (fs.existsSync(full)) {
        scriptPaths.push(rel);
        scripts[rel] = fs.readFileSync(full, "utf8").replace(/\r\n/g, "\n");
      }
    }
  }

  const combinedScript = scriptPaths.map(p => `// === ${p} ===\n${scripts[p]}`).join("\n");
  const allSource = `${html}\n${css}\n${combinedScript}`;

  return {
    html,
    css,
    cssPaths,
    cssFiles,
    allScriptPaths,
    scriptPaths,
    scripts,
    combinedScript,
    allSource
  };
}

/**
 * Compiles each js/*.js module individually and all modules combined via Node vm.Script
 * to catch syntax errors and cross-module duplicate declarations.
 */
function assertValidProjectScripts(label = "modular scripts") {
  const { scriptPaths, scripts, combinedScript } = loadProjectSources();
  assert.ok(scriptPaths.length > 0, `Expected js/*.js modules for ${label}`);

  scriptPaths.forEach(p => {
    assert.doesNotThrow(() => {
      new vm.Script(scripts[p], { filename: p });
    }, `${p} must be syntactically valid (${label})`);
  });

  assert.doesNotThrow(() => {
    new vm.Script(combinedScript, { filename: "combined-app.js" });
  }, `Combined app scripts must be valid and free of redeclarations (${label})`);
}

/**
 * Verifies zero duplicate HTML element IDs in index.html and confirms every static
 * document.getElementById("...") across all js/*.js modules resolves to an HTML ID.
 */
function assertDomIdIntegrity() {
  const { html, combinedScript } = loadProjectSources();
  const idMatches = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  const seen = new Set();
  const dupIds = [];
  idMatches.forEach(id => {
    if (seen.has(id)) dupIds.push(id);
    seen.add(id);
  });
  assert.deepStrictEqual(dupIds, [], `index.html must not contain duplicate IDs (found: ${dupIds.join(", ")})`);

  const queriedStaticIds = [...combinedScript.matchAll(/document\.getElementById\("([^"$]+)"\)/g)].map(m => m[1]);
  const missingIds = [...new Set(queriedStaticIds.filter(id => !seen.has(id)))];
  assert.deepStrictEqual(missingIds, [], `All static document.getElementById() calls must match existing HTML IDs (missing: ${missingIds.join(", ")})`);
}

module.exports = {
  ROOT_DIR,
  loadProjectSources,
  assertValidProjectScripts,
  assertDomIdIntegrity
};
