# Graph Report - SERMS-Modern  (2026-11-13)

## Corpus Check
- Corpus is ~27,677 words - fits in a single context window. You may not need a graph.

## Summary
- 369 nodes · 829 edges · 19 communities (18 shown, 1 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.86)
- Token cost: AST extraction free; semantic subagent usage not reported

## Community Hubs (Navigation)
- Student Workspace & Documents
- Cashier & Dashboard UI
- Pages Deploy Workflow
- Screens & UI Primitives
- Live Data Architecture
- App State & Mock Data
- Electron PostgreSQL Bridge
- Application Shell & Flows
- TypeScript Configuration
- CI Build Workflow
- React Entry & Theme
- Electron Builder Config
- Package Manifest
- Dev Dependencies
- Electron Preload & Dev
- Vite Build Tooling
- NPM Scripts
- Playwright Smoke Tests

## God Nodes (most connected - your core abstractions)
1. `App()` - 35 edges
2. `fullName()` - 33 edges
3. `formatMoney()` - 22 edges
4. `Student` - 22 edges
5. `lucide-react` - 21 edges
6. `react` - 21 edges
7. `Modal()` - 19 edges
8. `Badge()` - 18 edges
9. `StudentWorkspace()` - 17 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Safety and Secret-Handling Notes` --semantically_similar_to--> `Live Data Risks`  [INFERRED] [semantically similar]
  README.md → docs/LIVE-DATA.md
- `Write Mapping: Grade, Payment, Assessment, COR` --rationale_for--> `Product Principles`  [INFERRED]
  docs/LIVE-DATA.md → PRODUCT.md
- `Live PostgreSQL Bridge via srgb.ini` --implements--> `electron/main.cjs and electron/live.cjs Bridge`  [INFERRED]
  README.md → docs/LIVE-DATA.md
- `Live PostgreSQL Bridge via srgb.ini` --references--> `srgb.ini Configuration`  [INFERRED]
  README.md → docs/LIVE-DATA.md
- `Seed` --references--> `Student`  [EXTRACTED]
  src/data/mock.ts → src/types.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Confirmation-Gated Grade Write Path** — docs_live_data_electron_bridge, docs_live_data_registration_table, docs_live_data_authoritative_routines, docs_live_data_write_mapping [INFERRED 0.85]
- **SERMS Modern Design Intent** — product_student_centered_workspace, product_product_principles, product_visual_direction, product_user_roles [INFERRED 0.75]
- **Synthetic-Data Prototype Phase Boundary** — product_phase_scope, readme_prototype_coverage, readme_parity_gap, readme_static_demo [INFERRED 0.85]

## Communities (19 total, 1 thin omitted)

### Community 0 - "Student Workspace & Documents"
Cohesion: 0.10
Nodes (30): lucide-react, DocumentKind, DocumentPreview(), titles, LiveClassGradeDialog(), Row, LiveGradeDialog(), Row (+22 more)

### Community 1 - "Cashier & Dashboard UI"
Cohesion: 0.12
Nodes (22): accessByRole, navGroups, NavItem, navLabels, userForRole, CommandPalette(), onKeyDown(), select() (+14 more)

### Community 2 - "Pages Deploy Workflow"
Cohesion: 0.07
Nodes (31): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+23 more)

### Community 3 - "Screens & UI Primitives"
Cohesion: 0.15
Nodes (21): PageHeader(), GradeRow, GradeSheetDialog(), chooseSubject(), Avatar(), Badge(), badgeTone, EmptyState() (+13 more)

### Community 4 - "Live Data Architecture"
Cohesion: 0.12
Nodes (18): Authoritative Database Functions and Triggers, electron/main.cjs and electron/live.cjs Bridge, window.serms Live API (connect / refresh / disconnect), Live Record Read Queries, Rave Reports Print Layouts, srgb.registration Grade Write, Schema Inventory: 110 Tables, 205 Routines, srgb.ini Configuration (+10 more)

### Community 5 - "App State & Mock Data"
Cohesion: 0.11
Nodes (22): activities, cashiers, catalog, computeAssessment(), currentTerm, enrollments, faculty, offerings (+14 more)

### Community 6 - "Electron PostgreSQL Bridge"
Cohesion: 0.12
Nodes (15): bootstrap(), { Client }, connect(), createClient(), isoDate(), num(), semesterLabel(), trim() (+7 more)

### Community 7 - "Application Shell & Flows"
Cohesion: 0.14
Nodes (17): App(), addStudent(), applyLive(), changeRole(), exitLive(), liveLogin(), loadLive(), navigate() (+9 more)

### Community 8 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 9 - "CI Build Workflow"
Cohesion: 0.12
Nodes (16): runs-on, steps, jobs, build, name, on, pull_request, push (+8 more)

### Community 10 - "React Entry & Theme"
Cohesion: 0.15
Nodes (11): dependencies, @fontsource-variable/inter@^5.3.0, @fontsource-variable/newsreader@^5.3.0, lucide-react@^0.468.0, react@^19.1.1, react-dom@^19.1.1, @fontsource-variable/inter, @fontsource-variable/newsreader (+3 more)

### Community 11 - "Electron Builder Config"
Cohesion: 0.13
Nodes (15): build, appId, directories, extraResources, files, nsis, productName, win (+7 more)

### Community 12 - "Package Manifest"
Cohesion: 0.17
Nodes (11): author, description, electron-builder@^26.0.12, @types/react-dom@^19.1.7, main, name, private, type (+3 more)

### Community 13 - "Dev Dependencies"
Cohesion: 0.18
Nodes (11): devDependencies, concurrently@^9.2.1, @types/pg@^8.23.1, @types/react@^19.1.10, typescript@^5.9.3, wait-on@^8.0.4, concurrently, @types/pg (+3 more)

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
Cohesion: 0.33
Nodes (4): playwright-core@^1.65.0, playwright-core, errors, screens

## Knowledge Gaps
- **2 isolated node(s):** `St. Peter's College`, `Static GitHub Pages Demo`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 152 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `React Entry & Theme` to `Student Workspace & Documents`, `Cashier & Dashboard UI`, `Screens & UI Primitives`, `App State & Mock Data`, `Package Manifest`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **What connects `St. Peter's College`, `Static GitHub Pages Demo` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Student Workspace & Documents` be split into smaller, more focused modules?**
  _Cohesion score 0.09898242368177614 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `Student Workspace & Documents` to `Cashier & Dashboard UI`, `Screens & UI Primitives`, `App State & Mock Data`, `React Entry & Theme`, `Package Manifest`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Should `Cashier & Dashboard UI` be split into smaller, more focused modules?**
  _Cohesion score 0.11942959001782531 - nodes in this community are weakly interconnected._
- **Why does `pg` connect `Electron PostgreSQL Bridge` to `Package Manifest`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `Pages Deploy Workflow` be split into smaller, more focused modules?**
  _Cohesion score 0.06653225806451613 - nodes in this community are weakly interconnected._