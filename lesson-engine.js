/* ============================================
   lesson-engine.js
   Generic Learn -> Practice -> Quiz -> Challenge ->
   Complete logic, reused by every lesson page.
   Depends on progress-schema.js being loaded first
   (both are plain scripts, so their top-level
   functions/consts are globally available here).
   ============================================ */

(function () {
  const lessonRoot = document.querySelector('[data-lesson-id]');
  if (!lessonRoot) return; // not a lesson page

  const lessonId = lessonRoot.getAttribute('data-lesson-id');
  const quizId = lessonId + '-quiz';
  const challengeId = lessonId + '-challenge';
  const levelKey = lessonRoot.getAttribute('data-level');

  const quizQuestions = Array.from(document.querySelectorAll('.quiz-question'));
  const correctness = new Map(); // questionIndex -> true/false

  let challengeAttempted = false;

  const completeBtn = document.getElementById('markCompleteBtn');
  const completeStatus = document.getElementById('completeStatus');
  const quizScoreSummary = document.getElementById('quizScoreSummary');
  const challengeTextarea = document.getElementById('challengeAnswer');
  const challengeAttemptBtn = document.getElementById('markChallengeBtn');
  const challengeStatus = document.getElementById('challengeStatus');

  function allQuizCorrect() {
    if (quizQuestions.length === 0) return true;
    return quizQuestions.every((_, i) => correctness.get(i) === true);
  }

  function updateCompleteButtonState() {
    const ready = allQuizCorrect() && challengeAttempted;
    if (completeBtn) completeBtn.disabled = !ready;
  }

  function updateQuizScoreSummary() {
    if (!quizScoreSummary) return;
    const total = quizQuestions.length;
    const correct = Array.from(correctness.values()).filter(Boolean).length;
    quizScoreSummary.textContent = `Score: ${correct} / ${total} correct`;
  }

  quizQuestions.forEach((q, index) => {
    const options = Array.from(q.querySelectorAll('.quiz-option'));
    const feedback = q.querySelector('.quiz-feedback');

    options.forEach(opt => {
      opt.addEventListener('click', () => {
        const isCorrect = opt.getAttribute('data-correct') === 'true';

        options.forEach(o => o.classList.remove('selected-correct', 'selected-incorrect'));
        opt.classList.add(isCorrect ? 'selected-correct' : 'selected-incorrect');

        if (feedback) {
          feedback.textContent = isCorrect
            ? 'Sahi jawab! ✓'
            : 'Galat jawab, dobara try karo.';
          feedback.className = 'quiz-feedback ' + (isCorrect ? 'correct' : 'incorrect');
        }

        correctness.set(index, isCorrect);
        updateQuizScoreSummary();
        updateCompleteButtonState();
      });
    });
  });

  if (challengeAttemptBtn) {
    challengeAttemptBtn.addEventListener('click', () => {
      const value = (challengeTextarea && challengeTextarea.value.trim()) || '';
      if (value.length < 10) {
        if (challengeStatus) {
          challengeStatus.textContent = 'Pehle apna solution likho (kam se kam kuch lines).';
          challengeStatus.className = 'complete-status';
        }
        return;
      }
      challengeAttempted = true;
      if (challengeStatus) {
        challengeStatus.textContent = 'Challenge attempted ✓ — real code execution Phase 6 me aayega.';
        challengeStatus.className = 'complete-status done';
      }
      updateCompleteButtonState();
    });
  }

  /**
   * Public hook for challenge-engine.js (Phase 6 Pyodide editor).
   * This is the ONLY other path that can flip challengeAttempted —
   * it still requires the editor to have actually validated the
   * user's code output, so the existing guard (quiz correct AND
   * challenge attempted, before Mark Complete unlocks) is preserved
   * unchanged.
   */
  window.CWGLessonAPI = {
    markChallengePassed: function (message) {
      challengeAttempted = true;
      if (challengeStatus) {
        challengeStatus.textContent = message || 'Challenge passed ✓';
        challengeStatus.className = 'complete-status done';
      }
      updateCompleteButtonState();
    },
    markChallengeFailed: function (message) {
      if (challengeStatus) {
        challengeStatus.textContent = message || 'Challenge abhi pass nahi hua — dubara try karo.';
        challengeStatus.className = 'complete-status';
      }
    }
  };

  if (completeBtn) {
    completeBtn.addEventListener('click', () => {
      if (completeBtn.disabled) return;

      const progress = loadProgress();
      const now = new Date().toISOString();

      progress.lessons[lessonId] = { completed: true, completedAt: now };
      const total = quizQuestions.length;
      const correct = Array.from(correctness.values()).filter(Boolean).length;
      progress.quizzes[quizId] = {
        completed: true,
        score: total === 0 ? null : Math.round((correct / total) * 100),
        completedAt: now
      };
      progress.challenges[challengeId] = { completed: true, completedAt: now };

      recalculateCompletion(progress);
      saveProgress(progress);

      completeBtn.disabled = true;
      completeBtn.textContent = 'Lesson Completed ✓';
      if (completeStatus) {
        completeStatus.textContent = 'Great job! Progress saved on this device.';
        completeStatus.className = 'complete-status done';
      }
    });
  }

  // Reflect already-completed state on page load
  const existingProgress = loadProgress();
  if (existingProgress.lessons[lessonId] && existingProgress.lessons[lessonId].completed) {
    if (completeBtn) {
      completeBtn.disabled = true;
      completeBtn.textContent = 'Lesson Completed ✓';
    }
    if (completeStatus) {
      completeStatus.textContent = 'You already completed this lesson on this device.';
      completeStatus.className = 'complete-status done';
    }
  } else {
    updateCompleteButtonState();
  }
})();
