# Changelog

## 0.2.0

### Added

- Faculty **My Classes** workspace with assigned subjects, live class rosters, roster search, CSV export, and direct student access from the roster.
- Live faculty identity mapping through `srgb.faculty_username`, `pis.employee`, and `srgb.semsubject`.
- Faculty dashboard shortcut and role-aware command palette entries.

### Added (faculty grade grid)

- All four grading terms are shown in My Classes: Prelim, Midterm, Semi-final, Final, plus the trigger-computed Grade.
- Inline grade editing with an explicit Edit grades mode.
- Enter saves the current student and advances focus to the next student in the same term; leaving a field saves as well.

### Changed

- Live login now loads the dashboard first instead of opening the full student directory.
- Student balances, assessment totals, and GPA are aggregated in SQL rather than calling per-student functions.
- Enrollment loading no longer joins `pis.employee` for every row; instructor names are resolved from a small faculty map.
- Assessment fee lines load only when a student is opened.
- Class rosters load only when a class is selected.
- The live student directory paginates at 50 rows per page.
- Live role navigation now includes My Classes for Faculty accounts.

### Fixed

- SQL_ASCII / Latin-1 school text decoding.
- School `srgb.ini` resolution in the launcher.
- Live dashboard load reduced from roughly two minutes to about six seconds on the measured school dataset.
