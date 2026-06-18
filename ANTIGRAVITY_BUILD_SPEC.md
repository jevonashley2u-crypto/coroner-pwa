# Antigravity Build Spec — Coroner Field Intake PWA

## Overview

Offline-first PWA for coroners to capture scene evidence. Built for mobile field use.

## Directory Structure

```
src/
  main.jsx              Entry point
  App.jsx               Root component — routing, sync bar, offline banner
  App.css               App layout styles
  index.css             Theme variables, reset
  pages/
    SceneIntakePage.jsx  Case intake form (camera, GPS, temps, notes)
    SceneIntakePage.css
    CasesListPage.jsx    Searchable case list with edit/delete
    CasesListPage.css
  modules/
    CameraModule.jsx     Reusable camera with flash, capture, thumbnail strip
    CameraModule.css
  services/
    DatabaseService.js   Dexie CRUD operations
    SyncService.js       Supabase sync with retry
    SearchService.js     Full-text search across case fields
```

## 18 Production-Ready Files

| # | File | Purpose |
|---|------|---------|
| 1 | index.html | App shell with meta tags |
| 2 | src/main.jsx | React entry |
| 3 | package.json | Dependencies |
| 4 | vite.config.js | Vite + PWA config |
| 5 | src/App.jsx | Main routing + sync |
| 6 | src/App.css | App layout |
| 7 | src/index.css | Theme + reset |
| 8 | src/pages/SceneIntakePage.jsx | Intake form |
| 9 | src/pages/SceneIntakePage.css | Intake styles |
| 10 | src/pages/CasesListPage.jsx | Case list |
| 11 | src/pages/CasesListPage.css | List styles |
| 12 | src/modules/CameraModule.jsx | Camera system |
| 13 | src/modules/CameraModule.css | Camera styles |
| 14 | src/services/DatabaseService.js | Dexie storage |
| 15 | src/services/SyncService.js | Supabase sync |
| 16 | src/services/SearchService.js | Full-text search |
| 17 | README.md | Setup guide |
| 18 | ANTIGRAVITY_BUILD_SPEC.md | This file |

## Key Design Decisions

- Plain JSX (no TypeScript) for rapid iteration
- Single-file services, no class wrappers
- Dexie schema: `cases` and `physicalMarks` tables with `syncStatus` index
- SyncService uses supabase-js directly, skips when offline
- CameraModule is self-contained with its own start/stop lifecycle
- All touch targets >= 44px for gloved use
- Dark theme for low-light field conditions
