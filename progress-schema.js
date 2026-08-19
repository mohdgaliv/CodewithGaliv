/* ============================================
   progress-schema.js
   ------------------------------------------------
   Now linked from real lesson pages (Phase 5+).
   Course-wide REQUIRED_COUNTS below is intentionally
   still 0 — the full course (8 levels) is not built
   yet, so course-wide completionPercentage and
   certificate eligibility stay locked at 0/false
   until every level exists. This is deliberate: it
   prevents finishing only Level 1 from ever counting
   as "100% course complete". Per-level progress (e.g.
   "3/15 Level 1 lessons done") is tracked separately
   below via LEVELS + getLevelProgress(), which does
   NOT feed into certificate eligibility.

   What THIS file can legitimately do entirely in the
   browser (no backend needed):
     - Track one learner's own progress on their own
       device (localStorage).
     - Calculate completion % and check certificate
       eligibility for that learner, on that device.

   What THIS file CANNOT do (needs a backend later):
     - Let a third party (employer, recruiter) verify
       a certificate ID from a DIFFERENT device/browser.
       LocalStorage is private to one browser, so a
       real public verification page needs certificate
       records stored server-side (e.g. a small
       serverless function + database — Firebase,
       Supabase, Cloudflare Workers + KV, etc).
       See /docs/certificate-architecture.md.
   ============================================ */

const COURSE_ID = "python-full-course";
const STORAGE_KEY = "cwg_progress_" + COURSE_ID;

/**
 * Shape of one learner's progress record.
 * Every lesson/quiz/challenge id referenced here must
 * match an id defined later when actual lesson pages
 * are built (Phase 4+).
 */
function createEmptyProgress() {
  return {
    courseId: COURSE_ID,
    learnerName: null, // set by the learner before certificate generation
    lessons: {},        // { [lessonId]: { completed: bool, completedAt: ISOString|null } }
    quizzes: {},         // { [quizId]: { completed: bool, score: number|null, completedAt: ISOString|null } }
    challenges: {},      // { [challengeId]: { completed: bool, completedAt: ISOString|null } }
    finalAssessment: {
      completed: false,
      score: null,
      completedAt: null
    },
    xp: 0,
    completionPercentage: 0,
    certificate: {
      eligible: false,
      certificateId: null,   // assigned only at generation time, see notes below
      issuedAt: null,
      verificationUrl: null
    }
  };
}

/**
 * Total counts will be filled in once the real course
 * content (lesson/quiz/challenge ids) exists. Placeholder
 * of 0 means "not yet computable" — deliberately not
 * guessed here.
 */
const REQUIRED_COUNTS = {
  lessons: 0,
  quizzes: 0,
  challenges: 0
};

/**
 * Recalculates completionPercentage from whatever
 * REQUIRED_COUNTS is set to once real content exists.
 * Returns the progress object unchanged if counts are
 * not yet known (all zero) to avoid reporting a false 100%.
 */
function recalculateCompletion(progress) {
  const totalRequired =
    REQUIRED_COUNTS.lessons + REQUIRED_COUNTS.quizzes + REQUIRED_COUNTS.challenges;

  if (totalRequired === 0) {
    progress.completionPercentage = 0;
    return progress;
  }

  const completedLessons = Object.values(progress.lessons).filter(l => l.completed).length;
  const completedQuizzes = Object.values(progress.quizzes).filter(q => q.completed).length;
  const completedChallenges = Object.values(progress.challenges).filter(c => c.completed).length;

  const totalCompleted = completedLessons + completedQuizzes + completedChallenges;
  progress.completionPercentage = Math.round((totalCompleted / totalRequired) * 100);
  return progress;
}

/**
 * Certificate eligibility rule, per the course flow:
 * Learn -> Practice -> Quiz -> Challenge -> Complete Lessons
 * -> Final Assessment -> 100% Completion -> Certificate Eligible
 */
function isCertificateEligible(progress) {
  return (
    progress.completionPercentage === 100 &&
    progress.finalAssessment.completed === true &&
    REQUIRED_COUNTS.lessons + REQUIRED_COUNTS.quizzes + REQUIRED_COUNTS.challenges > 0
  );
}

/**
 * NOTE: intentionally not implemented yet.
 * Real certificate ID generation + issuance should happen
 * only once a backend exists to store the record (so the
 * /verify/ page can look it up from any device). Generating
 * an ID client-side only, with no server record, would be a
 * fake/unverifiable certificate — explicitly avoided per
 * project rules.
 *
 * Planned ID format (see /docs/certificate-architecture.md):
 *   CWG-PY-<year>-<6-char-alphanumeric>
 *   e.g. CWG-PY-2026-4F9B2C
 */
function generateCertificateId(progress) {
  throw new Error(
    "Not implemented: certificate generation requires a backend to store " +
    "the record for verification. See /docs/certificate-architecture.md."
  );
}

function loadProgress() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : createEmptyProgress();
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

/**
 * Registry of lesson/quiz/challenge ids per level, used only
 * for showing level-specific progress (e.g. "3/15 lessons").
 * This is separate from REQUIRED_COUNTS above and never feeds
 * certificate eligibility. Lessons not yet built as real pages
 * are still listed here (with available:false) so the level
 * progress bar reflects the true size of the level, not just
 * however many lessons currently exist as pages.
 */
const LEVELS = {
  level1: {
    id: "level1",
    name: "Python Fundamentals",
    lessons: [
      { id: "l1-01-python-kya-hai", available: true },
      { id: "l1-02-kaise-kaam-karta-hai", available: true },
      { id: "l1-03-setup-execution", available: true },
      { id: "l1-04-first-program", available: true },
      { id: "l1-05-print", available: true },
      { id: "l1-06-comments", available: true },
      { id: "l1-07-variables", available: true },
      { id: "l1-08-data-types", available: true },
      { id: "l1-09-input", available: true },
      { id: "l1-10-type-conversion", available: true },
      { id: "l1-11-arithmetic-operators", available: true },
      { id: "l1-12-comparison-operators", available: true },
      { id: "l1-13-logical-operators", available: true },
      { id: "l1-14-assignment-operators", available: true },
      { id: "l1-15-operator-precedence", available: true }
    ]
  }
};

/**
 * Returns { completed, total, percentage } for a given level,
 * counting lessons only (each lesson also requires its quiz +
 * challenge to be marked complete before the lesson itself
 * counts as completed — see lesson-engine.js).
 */
function getLevelProgress(progress, levelKey) {
  const level = LEVELS[levelKey];
  if (!level) return { completed: 0, total: 0, percentage: 0 };

  const total = level.lessons.length;
  const completed = level.lessons.filter(
    l => progress.lessons[l.id] && progress.lessons[l.id].completed
  ).length;

  return {
    completed,
    total,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100)
  };
}

/**
 * NOTE: lesson-engine.js (loaded on every lesson page) reads and
 * writes progress.lessons / progress.quizzes / progress.challenges
 * directly via loadProgress()/saveProgress()/recalculateCompletion()
 * above — that's the single source of truth for lesson completion,
 * guarded so a lesson can't be marked complete without its quiz
 * passing and its challenge being attempted. No separate mutator
 * functions are defined here to avoid two paths doing the same job.
 */
