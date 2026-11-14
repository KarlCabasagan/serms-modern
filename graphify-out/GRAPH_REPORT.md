# Graph Report - SERMS-Modern  (2026-11-14)

## Corpus Check
- 43 files · ~30,828 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 1, .cmd 1, .ini 1)

## Summary
- 395 nodes · 902 edges · 18 communities (17 shown, 1 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dfd4959c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Student Workspace & Documents
- Cashier & Dashboard UI
- Pages Deploy Workflow
- Screens & UI Primitives
- Live Data Architecture
- App State & Mock Data
- Electron PostgreSQL Bridge
- 0.2.0
- TypeScript Configuration
- CI Build Workflow
- React Entry & Theme
- Electron Builder Config
- Package Manifest
- Electron Preload & Dev
- Vite Build Tooling
- NPM Scripts
- Playwright Smoke Tests

## God Nodes (most connected - your core abstractions)
1. `App()` - 37 edges
2. `fullName()` - 33 edges
3. `lucide-react` - 22 edges
4. `react` - 22 edges
5. `formatMoney()` - 22 edges
6. `Student` - 22 edges
7. `Badge()` - 20 edges
8. `Modal()` - 19 edges
9. `PageHeader()` - 17 edges
10. `StudentWorkspace()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Safety and Secret-Handling Notes` --semantically_similar_to--> `Live Data Risks`  [INFERRED] [semantically similar]
  README.md → docs/LIVE-DATA.md
- `Live PostgreSQL Bridge via srgb.ini` --implements--> `electron/main.cjs and electron/live.cjs Bridge`  [INFERRED]
  README.md → docs/LIVE-DATA.md
- `Live PostgreSQL Bridge via srgb.ini` --references--> `srgb.ini Configuration`  [INFERRED]
  README.md → docs/LIVE-DATA.md
- `Write Mapping: Grade, Payment, Assessment, COR` --rationale_for--> `Product Principles`  [INFERRED]
  docs/LIVE-DATA.md → PRODUCT.md
- `Seed` --references--> `Student`  [EXTRACTED]
  src/data/mock.ts → src/types.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **SERMS Modern Design Intent** — product_student_centered_workspace, product_product_principles, product_visual_direction, product_user_roles [INFERRED 0.75]
- **Confirmation-Gated Grade Write Path** — docs_live_data_electron_bridge, docs_live_data_registration_table, docs_live_data_authoritative_routines, docs_live_data_write_mapping [INFERRED 0.85]
- **Synthetic-Data Prototype Phase Boundary** — product_phase_scope, readme_prototype_coverage, readme_parity_gap, readme_static_demo [INFERRED 0.85]

## Communities (18 total, 1 thin omitted)

### Community 0 - "Student Workspace & Documents"
Cohesion: 0.12
Nodes (23): CommandPaletteProps, DocumentKind, DocumentPreview(), titles, LiveClassGradeDialog(), Row, LiveGradeDialog(), Row (+15 more)

### Community 1 - "Cashier & Dashboard UI"
Cohesion: 0.11
Nodes (33): App(), addStudent(), applyLive(), changeRole(), exitLive(), liveLogin(), loadAssessmentFor(), loadLive() (+25 more)

### Community 2 - "Pages Deploy Workflow"
Cohesion: 0.07
Nodes (31): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+23 more)

### Community 3 - "Screens & UI Primitives"
Cohesion: 0.11
Nodes (30): lucide-react, react, accessByRole, AppShell(), navGroups, NavItem, navLabels, PageHeader() (+22 more)

### Community 4 - "Live Data Architecture"
Cohesion: 0.12
Nodes (18): Authoritative Database Functions and Triggers, electron/main.cjs and electron/live.cjs Bridge, window.serms Live API (connect / refresh / disconnect), Live Record Read Queries, Rave Reports Print Layouts, srgb.registration Grade Write, Schema Inventory: 110 Tables, 205 Routines, srgb.ini Configuration (+10 more)

### Community 5 - "App State & Mock Data"
Cohesion: 0.07
Nodes (34): activities, cashiers, catalog, computeAssessment(), currentTerm, demoFacultyProfile, enrollments, faculty (+26 more)

### Community 6 - "Electron PostgreSQL Bridge"
Cohesion: 0.10
Nodes (23): assessmentLinesFor(), bootstrap(), { BufferReader }, { Client }, configureClientEncoding(), connect(), createClient(), decodeText() (+15 more)

### Community 7 - "0.2.0"
Cohesion: 0.33
Nodes (5): 0.2.0, Added, Changed, Changelog, Fixed

### Community 8 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 9 - "CI Build Workflow"
Cohesion: 0.12
Nodes (16): runs-on, steps, jobs, build, name, on, pull_request, push (+8 more)

### Community 10 - "React Entry & Theme"
Cohesion: 0.13
Nodes (12): dependencies, @fontsource-variable/inter@^5.3.0, @fontsource-variable/newsreader@^5.3.0, lucide-react@^0.468.0, pg-protocol@^1.16.1, react@^19.1.1, react-dom@^19.1.1, @fontsource-variable/inter (+4 more)

### Community 11 - "Electron Builder Config"
Cohesion: 0.13
Nodes (15): build, appId, directories, extraResources, files, nsis, productName, win (+7 more)

### Community 12 - "Package Manifest"
Cohesion: 0.11
Nodes (22): author, description, devDependencies, concurrently@^9.2.1, electron-builder@^26.0.12, @types/pg@^8.23.1, @types/react@^19.1.10, @types/react-dom@^19.1.7 (+14 more)

### Community 14 - "Electron Preload & Dev"
Cohesion: 0.25
Nodes (6): { contextBridge, ipcRenderer }, electron@^45.3.1, electron, child, electron, { spawn }

### Community 15 - "Vite Build Tooling"
Cohesion: 0.25
Nodes (5): vite@^8.3.8, @vitejs/plugin-react@^5.0.4, vite, @vitejs/plugin-react, child

### Community 16 - "NPM Scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, electron:build, electron:dev, electron:installer, preview, test:smoke

### Community 17 - "Playwright Smoke Tests"
Cohesion: 0.29
Nodes (5): playwright-core@^1.65.0, playwright-core, errors, rosterSearch, screens

## Knowledge Gaps
- **2 isolated node(s):** `St. Peter's College`, `Static GitHub Pages Demo`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 156 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Screens & UI Primitives` to `Student Workspace & Documents`, `Cashier & Dashboard UI`, `App State & Mock Data`, `React Entry & Theme`, `Package Manifest`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **What connects `St. Peter's College`, `Static GitHub Pages Demo` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Student Workspace & Documents` be split into smaller, more focused modules?**
  _Cohesion score 0.1166429587482219 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `Screens & UI Primitives` to `Student Workspace & Documents`, `Cashier & Dashboard UI`, `App State & Mock Data`, `React Entry & Theme`, `Package Manifest`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Should `Cashier & Dashboard UI` be split into smaller, more focused modules?**
  _Cohesion score 0.11313131313131314 - nodes in this community are weakly interconnected._
- **Why does `App()` connect `Cashier & Dashboard UI` to `Student Workspace & Documents`, `React Entry & Theme`, `Screens & UI Primitives`, `App State & Mock Data`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `Pages Deploy Workflow` be split into smaller, more focused modules?**
  _Cohesion score 0.06653225806451613 - nodes in this community are weakly interconnected._