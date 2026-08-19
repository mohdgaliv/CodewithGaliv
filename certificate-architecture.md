# Certificate System Architecture (Planning Doc — Not Yet Implemented)

Status: **Architecture only.** No certificate is generated or issued yet.
This document exists so the course/progress system is built in a way
that certificate support can be added later without reworking things.

## Course Flow

Learn → Practice → Quiz → Challenge → Complete Lessons → Final Assessment
→ 100% Course Completion → Certificate Eligible → Certificate Generation
→ Certificate Verification

## What certificate this is

A **CodewithGaliv Python Course Completion Certificate** — issued by
Mohd Galiv / CodewithGaliv only. It is NOT a government, university,
board, or professional accreditation credential, and must never be
presented or designed to imply that. This must stay explicit on the
certificate itself and on the verification page.

## Eligibility rule

A learner becomes certificate-eligible only when ALL of the following
are true:

- All required lessons completed
- All required quizzes/challenges completed
- Final Python assessment completed
- `completionPercentage === 100`

See `/assets/progress-schema.js` for the current stub implementation
of this rule (`isCertificateEligible()`).

## Data model (client-side, per learner, per device)

Defined in `/assets/progress-schema.js`. Tracked in `localStorage` under
key `cwg_progress_python-full-course`. This part needs no backend —
it's just the learner's own progress on their own browser.

## Certificate record (needs a backend — not yet built)

Once a learner is eligible and requests their certificate, the record
that gets created needs to live somewhere other people can look it up
from a different device. That means a backend is required at that
point — options to evaluate later:

- A small serverless function (Cloudflare Worker / Netlify Function /
  Firebase Function) + a lightweight database (Firestore, Supabase,
  or similar)
- GitHub Pages alone (static hosting) cannot do this — it cannot run
  server-side code or persist data other people can query

Planned certificate record fields:

| Field              | Notes                                          |
|---------------------|-------------------------------------------------|
| certificateId        | see ID format below                            |
| learnerName          | as entered by the learner                      |
| courseName           | "Python Programming Course"                    |
| completionDate        | ISO date                                       |
| finalScore            | from `finalAssessment.score`                   |
| issuer               | "CodewithGaliv"                                |
| verificationUrl       | see below                                      |

## Certificate ID format (proposed)

```
CWG-PY-<year>-<6-char-alphanumeric>
example: CWG-PY-2026-4F9B2C
```

Generated server-side at issuance time (not in the browser), so every
ID that exists is guaranteed to correspond to a real stored record.

## Verification flow (proposed)

```
Certificate ID
   → /verify/?certId=CWG-PY-2026-4F9B2C
   → backend looks up the ID
   → shows: learner name, course name, completion date, status (valid/not found)
```

A static scaffold for this page exists at `/verify/index.html` — right
now it only explains that verification is coming soon and does not
call any backend, since none exists yet.

## PDF generation (future)

Downloadable PDF certificate generation can be done fully client-side
(e.g. a library like jsPDF) once the visual design is ready — this
does not by itself require a backend. Only the *verification* of that
certificate by a third party requires server-stored data, as above.

## What NOT to do

- Do not generate a certificateId or a "valid" certificate purely in
  the browser with no server record — it would be unverifiable by
  anyone but the learner's own browser, which defeats the purpose of
  verification and would misrepresent the certificate as checkable
  when it isn't.
- Do not imply official/institutional accreditation in copy or design.
