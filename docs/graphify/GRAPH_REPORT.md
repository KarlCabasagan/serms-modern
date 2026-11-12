# Graph Report - src  (2026-11-13)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 141 nodes · 469 edges · 8 communities (6 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- ui.tsx
- App.tsx
- App
- AppShell.tsx
- types.ts
- format.ts
- electron.d.ts

## God Nodes (most connected - your core abstractions)
1. `App()` - 29 edges
2. `fullName()` - 25 edges
3. `formatMoney()` - 19 edges
4. `Badge()` - 18 edges
5. `Student` - 16 edges
6. `PageHeader()` - 15 edges
7. `EmptyState()` - 13 edges
8. `Modal()` - 13 edges
9. `Cashier()` - 13 edges
10. `StudentWorkspace()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `NavItem` --references--> `NavKey`  [EXTRACTED]
  components/AppShell.tsx → types.ts
- `CommandPaletteProps` --references--> `NavKey`  [EXTRACTED]
  components/CommandPalette.tsx → types.ts
- `Seed` --references--> `Student`  [EXTRACTED]
  data/mock.ts → types.ts
- `Academics()` --calls--> `PageHeader()`  [EXTRACTED]
  screens/Academics.tsx → components/AppShell.tsx
- `Cashier()` --calls--> `PageHeader()`  [EXTRACTED]
  screens/Cashier.tsx → components/AppShell.tsx

## Import Cycles
- None detected.

## Communities (8 total, 2 thin omitted)

### Community 0 - "ui.tsx"
Cohesion: 0.17
Nodes (18): PageHeader(), programs, StudentDialog(), Badge(), badgeTone, EmptyState(), InfoStrip(), Modal() (+10 more)

### Community 1 - "App.tsx"
Cohesion: 0.11
Nodes (23): activities, cashiers, catalog, computeAssessment(), enrollments, faculty, offerings, payments (+15 more)

### Community 2 - "App"
Cohesion: 0.13
Nodes (17): App(), addStudent(), changeRole(), navigate(), notify(), recordPayment(), canAccess(), CommandPalette() (+9 more)

### Community 3 - "AppShell.tsx"
Cohesion: 0.13
Nodes (13): accessByRole, AppShell(), navGroups, NavItem, navLabels, userForRole, Avatar(), Toast() (+5 more)

### Community 4 - "types.ts"
Cohesion: 0.19
Nodes (13): CommandPaletteProps, pageItems, GradeRow, Seed, AcademicTab, Activity, Enrollment, FacultyMember (+5 more)

### Community 5 - "format.ts"
Cohesion: 0.28
Nodes (11): ReceiptDialog(), formatCompactMoney(), formatDate(), formatDateShort(), formatMoney(), greeting(), peso, shortName() (+3 more)

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `App()` connect `App` to `ui.tsx`, `App.tsx`, `AppShell.tsx`, `format.ts`, `main.tsx`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11375661375661375 - nodes in this community are weakly interconnected._
- **Why does `fullName()` connect `App` to `ui.tsx`, `App.tsx`, `types.ts`, `format.ts`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `App` be split into smaller, more focused modules?**
  _Cohesion score 0.13405797101449277 - nodes in this community are weakly interconnected._
- **Why does `StudentWorkspace()` connect `App` to `ui.tsx`, `App.tsx`, `format.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Should `AppShell.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1286549707602339 - nodes in this community are weakly interconnected._