# Live data wiring

Status: **connection test, live student data, live assessment fee lines, and confirmation-gated grade writes implemented. Payment and assessment writes are still read-only.**

## What the original does

- Reads `srgb.ini` next to the executable / working folder:
  - `pghostname`, `pgport`, `pgdbname`
  - `photohost` for student photos
- Connects to PostgreSQL through `libpq`/ADO.
- Grade entry is **not** a separate upload service. The old grade-sheet dataset updates `srgb.registration` directly, e.g.:

```sql
UPDATE registration
SET prelim1 = :prelim1,
    prelim2 = :prelim2,
    prelim3 = :prelim3,
    prelim4 = :prelim4,
    grade = :grade,
    remarks = :remarks,
    absences_excused = :absences_excused,
    absences_unexcused = :absences_unexcused
WHERE sy = :sy AND sem = :sem AND studid = :studid AND subjcode = :subjcode;
```

- There is a second legacy updater for the final grade:

```sql
UPDATE registration SET grade = :grade, gcompl = :gcompl
WHERE sy = :sy AND sem = :sem AND studid = :studid AND subjcode = :subjcode;
```

This is why the feature only works on the school network: it is a direct database write, not a file upload.

## Schema inventory (from the 2020 dump)

- 110 tables across `srgb`, `pis`, `ngas`, `fis`, `payroll`, `public`.
- 185 routines in `srgb` (205 including `public` and other schemas).
- Key tables:
  - `srgb.student`, `srgb.semstudent`, `srgb.registration`
  - `srgb.subject`, `srgb.semsubject`
  - `srgb.ass_header`, `srgb.ass_details`, `srgb.assessment`
  - `srgb.payment`, `srgb.collection_header`, `srgb.collection_details`
  - `srgb.semester`, `srgb.program`, `srgb.department`, `srgb.college`
  - `pis.employee`, `srgb.faculty`, `srgb.faculty_username`
- Key functions/triggers that must stay authoritative:
  - `srgb.registration_b4transaction()` — prerequisite, duplicate, lock checks.
  - `srgb.create_assessment()` / `srgb.delete_assessment()`.
  - `srgb.compute_gpa()`, `srgb.compute_gpa_all()`.
  - `srgb.get_payment_schedule_spc()`, `srgb.get_partial_assessment_spc()`.
  - `srgb.get_next_orno()`.
  - `srgb.semstudent_b4transaction()`, `srgb.semstudent_stamp()`.
  - `srgb.collection_header_get_orno()`, collection triggers.

## Implemented bridge

`electron/main.cjs` + `electron/live.cjs`:

- Reads `srgb.ini` from the executable folder, `resources`, the SERMS parent folder, or the working directory.
- Exposes `window.serms.appInfo()`.
- Exposes `window.serms.testDatabase({ username, password })`.
- The login form uses `window.serms.live.connect()` for a real school-account sign-in; **Open demo** stays synthetic.
- Opens a `pg` client with a 7-second timeout, verifies `current_user`, `current_database()`, and the server version.
- Performs a read-only check against `srgb.semester`, `srgb.student`, and `srgb.semstudent`, and reports the current term plus student/enrolled counts.
- Exposes `window.serms.live.connect()` / `refresh()` / `disconnect()`.
- The live preview reads: current term, students + program/department/college, `get_balance_perstudent`, `compute_gpa_all` (wrapped in a session-local safe function), `get_assessment_summary_persem`, COR rows from `srgb.registration`, and term payments.
- Live mode exposes Overview, Students, and a read-only Cashier. Payment posting and student edits are hidden.
- **Grade entry** is available from a live student’s Grades tab. It writes the four raw components
  (`prelim1`–`prelim4`) and remarks to `srgb.registration` after an explicit confirmation. The
  existing database trigger computes the cumulative grade.
- **Class grade entry** writes the whole selected section in one confirmed transaction, using the
  same `sy, sem, studid, subjcode` key.
- The grade writes are transactional and reject the save if any row no longer matches.
- The live assessment total is read from `get_assessment_summary_persem`, and fee lines are read
  from `srgb.ass_details` joined to `srgb.fees`. If a student has no detail rows, the live UI says
  so instead of showing the demo breakdown.
- Never stores the password in the renderer or on disk.

`src/screens/Administration.tsx` — **Test connection** and **Open live records** dialog.

## Next mapping (must be validated on a test copy)

### Read

1. Active term:
   ```sql
   SELECT sy, sem FROM srgb.semester WHERE current ORDER BY sy DESC, sem DESC LIMIT 1;
   ```
2. Student list:
   - `srgb.student` joined to `srgb.semstudent` and `srgb.program`.
   - Use `studfullname`, `studid`, `studmajor`, `studlevel`, `registered`.
3. Enrollment / COR:
   - `srgb.registration` joined to `srgb.subject`.
   - Schedule from `srgb.semsubject_schedule` / `srgb.lec`.
4. Assessment:
   - `srgb.ass_header` + `srgb.ass_details`.
5. Payments:
   - `srgb.payment` + `srgb.collection_header` / `srgb.collection_details`.
6. Grades:
   - `srgb.registration.prelim1..4`, `grade`, `gcompl`, `remarks`.

### Write

Do not invent write flows. Match the original transaction boundaries:

- **Grade save** — implemented in `electron/live.cjs`: update the four `prelim1..4` components and
  remarks; the database trigger computes the cumulative grade. Both a single student and a whole
  class section were validated against the local schema.
- **Payment** — use the same OR-number allocation and `payment` / `collection_*` inserts as the cashier form; keep one transaction.
- **Assessment** — call `srgb.create_assessment()` / `srgb.delete_assessment()` rather than computing fees in TypeScript.
- **COR add/drop** — insert/delete `srgb.registration`; let `registration_b4transaction()` enforce prerequisites, duplicates, and locks.

### Print

The old forms are Rave Reports 5 and the `.rav` files in the SERMS root. Printable COR, assessment, OR, TOR, and CHED forms should be reproduced from the same data. Phase 0 intentionally does not print.

## Risks

- `srgb.registration.prelim`, `midterm`, `final` exist alongside `prelim1..4`; the old grade-sheet mapping must be confirmed before any write.
- Payment/OR allocation is transactional and audit-sensitive.
- Report layouts are operationally important.
- The database is only reachable on the school network.
- The 2020 dump is old; the live schema may have changed.
- Student photos use an FTP store with credentials embedded in the old binary; do not carry that secret forward.
