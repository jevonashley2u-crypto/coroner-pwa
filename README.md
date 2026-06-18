# Coroner Field Intake

An offline-first progressive web app for coroners to capture scene evidence in the field.

## Features

- Offline-first: all data stored locally in IndexedDB (Dexie.js)
- Camera capture with torch/flash toggle
- GPS coordinate capture
- Temperature recording (ambient + body, C/F)
- Full-text search across cases
- Automatic sync to Supabase when online
- PWA installable on mobile home screen

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Database

The app uses Dexie.js (IndexedDB) for local storage. Supabase sync requires a `cases` table and a `physical_marks` table with matching schemas.

## Tech Stack

- React 19
- Vite 6
- Dexie.js
- Supabase
- Vite PWA Plugin
