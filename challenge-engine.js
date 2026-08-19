/* ============================================
   challenge-engine.js
   ------------------------------------------------
   Lazy-loaded, browser-only Python "Try Yourself"
   editor using Pyodide (WebAssembly CPython). No
   server execution, no API calls other than the
   one-time Pyodide runtime download from jsDelivr's
   CDN (triggered only when the learner taps "Load
   Python Editor" — never automatically on page load).

   Validation is declarative (see CHECK TYPES below)
   so new lessons can define new challenges by adding
   a JSON config block to the page — no JS changes
   needed. Passing a challenge calls
   window.CWGLessonAPI.markChallengePassed(), which is
   the same guarded path lesson-engine.js already uses
   — this file never touches localStorage directly and
   never marks a lesson complete itself.

   CHECK TYPES (config.checks[], all must pass):
     { type: "exact", value: "..." }
        stdout (trimmed) must exactly equal value.
     { type: "contains_all", values: [...], caseInsensitive }
        stdout must contain every string in values.
     { type: "contains_any", values: [...], caseInsensitive }
        stdout must contain at least one string.
     { type: "line_count_min", value: N }
        stdout must have at least N non-empty lines.
     { type: "regex", pattern: "...", flags: "..." }
        stdout must match the given regex.
   ============================================ */

(function () {
  const PYODIDE_VERSION = "v314.0.4";
  const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/" + PYODIDE_VERSION + "/full/pyodide.js";
  const PYODIDE_INDEX_URL = "https://cdn.jsdelivr.net/pyodide/" + PYODIDE_VERSION + "/full/";

  const challengeRoot = document.querySelector('.pyodide-challenge');
  if (!challengeRoot) return; // no interactive challenge on this page

  const configEl = document.getElementById('challengeConfig');
  let config = { starterCode: "# Code yahan likho\n", checks: [] };
  if (configEl) {
    try {
      config = JSON.parse(configEl.textContent);
    } catch (e) {
      console.error('challenge-engine: invalid challenge config JSON', e);
    }
  }

  const loaderBox = document.getElementById('editorLoader');
  const loadBtn = document.getElementById('loadEditorBtn');
  const editorWrap = document.getElementById('editorWrap');
  const editor = document.getElementById('codeEditor');
  const runBtn = document.getElementById('runCodeBtn');
  const clearBtn = document.getElementById('clearCodeBtn');
  const resetBtn = document.getElementById('resetCodeBtn');
  const outputEl = document.getElementById('codeOutput');
  const errorPanel = document.getElementById('errorPanel');
  const errorEl = document.getElementById('codeError');
  const resultMsg = document.getElementById('challengeResultMsg');

  let pyodideInstance = null;
  let pyodideLoading = false;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Script load failed: ' + src));
      document.head.appendChild(s);
    });
  }

  async function ensurePyodide() {
    if (pyodideInstance) return pyodideInstance;
    if (pyodideLoading) return null;
    pyodideLoading = true;

    loadBtn.disabled = true;
    loadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Python runtime load ho raha hai...';

    try {
      if (typeof loadPyodide === 'undefined') {
        await loadScript(PYODIDE_CDN);
      }
      pyodideInstance = await loadPyodide({ indexURL: PYODIDE_INDEX_URL });
      loaderBox.style.display = 'none';
      editorWrap.style.display = 'block';
      if (editor) editor.value = config.starterCode || '';
      return pyodideInstance;
    } catch (err) {
      loadBtn.disabled = false;
      loadBtn.innerHTML = '<i class="fas fa-rotate-right"></i> Load fail hua — Retry karo';
      console.error('challenge-engine: Pyodide load failed', err);
      return null;
    } finally {
      pyodideLoading = false;
    }
  }

  function runChecks(output) {
    const checks = config.checks || [];
    for (const check of checks) {
      if (check.type === 'exact') {
        if (output.trim() !== String(check.value).trim()) {
          return { passed: false, message: check.hint || 'Output expected result se match nahi karta. Dobara try karo.' };
        }
      } else if (check.type === 'contains_all') {
        const ci = check.caseInsensitive !== false;
        const hay = ci ? output.toLowerCase() : output;
        const ok = check.values.every(v => hay.includes(ci ? String(v).toLowerCase() : v));
        if (!ok) {
          return { passed: false, message: check.hint || 'Output me kuch required cheezein missing hain.' };
        }
      } else if (check.type === 'contains_any') {
        const ci = check.caseInsensitive !== false;
        const hay = ci ? output.toLowerCase() : output;
        const ok = check.values.some(v => hay.includes(ci ? String(v).toLowerCase() : v));
        if (!ok) {
          return { passed: false, message: check.hint || 'Output expected keywords me se koi bhi match nahi karta.' };
        }
      } else if (check.type === 'line_count_min') {
        const lines = output.split('\n').filter(l => l.trim().length > 0);
        if (lines.length < check.value) {
          return { passed: false, message: check.hint || ('Kam se kam ' + check.value + ' lines output chahiye.') };
        }
      } else if (check.type === 'regex') {
        const re = new RegExp(check.pattern, check.flags || '');
        if (!re.test(output)) {
          return { passed: false, message: check.hint || 'Output expected pattern se match nahi karta.' };
        }
      }
    }
    return { passed: true, message: 'Challenge Passed! ✓' };
  }

  if (loadBtn) {
    loadBtn.addEventListener('click', () => { ensurePyodide(); });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (editor) editor.value = '';
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (editor) editor.value = config.starterCode || '';
      if (outputEl) outputEl.textContent = '';
      if (errorPanel) errorPanel.style.display = 'none';
      if (resultMsg) {
        resultMsg.textContent = '';
        resultMsg.className = 'challenge-result';
      }
    });
  }

  if (runBtn) {
    runBtn.addEventListener('click', async () => {
      const py = pyodideInstance || await ensurePyodide();
      if (!py || !editor) return;

      runBtn.disabled = true;
      runBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';
      if (errorPanel) errorPanel.style.display = 'none';
      if (errorEl) errorEl.textContent = '';
      if (outputEl) outputEl.textContent = '';
      if (resultMsg) {
        resultMsg.textContent = '';
        resultMsg.className = 'challenge-result';
      }

      const capturedLines = [];
      py.setStdout({ batched: (msg) => capturedLines.push(msg) });
      py.setStderr({ batched: (msg) => capturedLines.push(msg) });

      try {
        await py.runPythonAsync(editor.value);
        const output = capturedLines.join('\n');
        if (outputEl) outputEl.textContent = output || '(koi output nahi — kya tumne print() use kiya?)';

        const result = runChecks(output);
        if (resultMsg) {
          resultMsg.textContent = result.message;
          resultMsg.className = 'challenge-result ' + (result.passed ? 'pass' : 'fail');
        }
        if (window.CWGLessonAPI) {
          if (result.passed) {
            window.CWGLessonAPI.markChallengePassed(result.message);
          } else {
            window.CWGLessonAPI.markChallengeFailed(result.message);
          }
        }
      } catch (err) {
        if (errorPanel) errorPanel.style.display = 'block';
        if (errorEl) errorEl.textContent = (err && err.message) ? err.message : String(err);
        if (window.CWGLessonAPI) {
          window.CWGLessonAPI.markChallengeFailed('Code me error aa raha hai — neeche error message dekho aur fix karo.');
        }
      } finally {
        runBtn.disabled = false;
        runBtn.innerHTML = '<i class="fas fa-play"></i> Run Code';
      }
    });
  }
})();
