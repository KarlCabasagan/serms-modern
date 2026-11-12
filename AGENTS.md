# AGENTS.md

Instructions for any agent working in this repo. Read this before changing anything.

## Git

- Commit small. A change that works gets its own commit, however tiny. Do not hoard a
  session's work into one big commit at the end.
- "Working" means you ran it: the tests, the build, or the program itself. Claiming success
  without running the check is not a commit, it is a guess.
- Stage only the files you changed. Never `git add -A` or `git commit -a` — that sweeps up
  whatever the human had in progress.
- One logical change per commit. No secrets, no vendored binaries.

### Commit messages

```
<type>(<scope>): <summary>
```

Match the history already in this repo: `feat(tracker): ...`, `chore(graphify): ...`.

- `type` is one of `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`.
- `scope` is the thing touched — `hud`, `calibrate`, `config`, `tracker`, `deps`, `agents`.
  Not `misc`, not `general`.
- The summary is imperative and specific: `feat(hud): clamp eval bar to ±10 pawns` beats
  `fix: eval bar bug`.
- Keep the first line under 72 characters. No trailing period.
- Add a body only when the reason is not obvious from the diff. The body explains why,
  never what — the diff already says what.
- If a commit undoes or replaces an earlier one, name what it replaces:
  `chore(deps): drop unused numpy 1.x pin`.

## Graphify

- The graph is committed here. It lives in `graphify-out/`, tracked like source.
- Do not regenerate it per commit. Once per batch: after the last verified change, run
  `/graphify update` and commit the result as that batch's final commit:
  `chore(graphify): sync architecture graph with <what changed>`
- Trigger on staleness, not on "am I done": if nothing changed since
  `graphify-out/manifest.json`, there is nothing to sync — skip it.
- It never blocks the answer. One line in the summary, then move on.
- If you cannot tell whether the batch is over, ask — do not assume "last".
