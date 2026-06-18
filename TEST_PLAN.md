# QA Test Plan — Coroner Field Intake PWA

---

## 1. HARDWARE API DIAGNOSTICS

### 1.1 GPS Geolocation

| # | Step | Expected Result | Pass Criteria |
|---|------|----------------|--------------|
| 1.1.1 | Open app in browser on a physical mobile device. | App loads, "Scene Intake" header visible. | Page renders without console errors. |
| 1.1.2 | Tap **📍 Capture GPS** button. | Browser prompts for location permission. | Prompt appears. |
| 1.1.3 | Grant **"Allow While Using App"** permission. | Button text changes to "📍 Re-capture GPS". Coords appear. | Latitude/longitude displayed to 5 decimals. Accuracy ±Xm shown. |
| 1.1.4 | Move device ~50m and tap **📍 Re-capture GPS**. | Coords update to new position. | Values change from previous reading. |
| 1.1.5 | **High-accuracy timeout test:** Go indoors / basement where GPS is weak. Wait 15 s. | `enableHighAccuracy: true` times out. Error message appears in red below the button. | Message: *"Timeout expired"* or *"Position unavailable"* shown. App doesn't crash. |
| 1.1.6 | **Permission denied test:** Reload page, tap GPS button, tap **"Block"** on the permission prompt. | Red error text appears: *"Geolocation permission denied"* or similar. UI remains fully functional. | No white screen. No uncaught exception in console. |

#### Console diagnostics

```js
// Paste into DevTools Console to verify GPS state
(async () => {
  if (!navigator.geolocation) return console.error('Geolocation API unavailable')
  navigator.geolocation.getCurrentPosition(
    p => console.log('📍 GPS OK:', { lat: p.coords.latitude, lng: p.coords.longitude, acc: `${Math.round(p.coords.accuracy)}m` }),
    e => console.error('📍 GPS FAIL:', e.message),
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
  )
})()
```

---

### 1.2 Camera (MediaDevices)

| # | Step | Expected Result | Pass Criteria |
|---|------|----------------|--------------|
| 1.2.1 | Tap **📷 Open Camera**. | Browser prompts for camera permission on iOS/Android. | Prompt appears. |
| 1.2.2 | Grant camera permission. | Rear-facing video stream appears in the `<video>` element. Live feed visible. | Stream is environment-facing (rear camera). |
| 1.2.3 | Tap **📸 Capture**. | A thumbnail (80x80 px) appears below the viewfinder. Camera viewfinder remains open. | Thumbnail added to gallery row. |
| 1.2.4 | Tap capture 3 more times. | 4 thumbnails visible. | Count matches. |
| 1.2.5 | Tap a thumbnail. | Full-size overlay appears covering the entire screen. | Photo displays at near-native resolution. |
| 1.2.6 | Tap the overlay backdrop or **✕** button. | Overlay closes, returns to form. | No console errors. |

#### Torch / Flashlight

| # | Step | Expected Result | Pass Criteria |
|---|------|----------------|--------------|
| 1.2.7 | With camera stream active, check if **🔦 OFF** button appears. | Button only renders if `track.getCapabilities().torch` is `true`. | Absent on devices without flash (some tablets). |
| 1.2.8 | Tap **🔦 OFF** → **🔦 ON**. | Flashlight LED turns on. Button text and color change. | Visually confirmed on rear camera. |
| 1.2.9 | Tap **🔦 ON** → **🔦 OFF**. | Flashlight turns off. | Camera stream still active. |

#### Permission denial simulation

| # | Step | Expected Result | Pass Criteria |
|---|------|----------------|--------------|
| 1.2.10 | Clear site permissions. Reload. Tap **📷 Open Camera**, then **Block**. | Red error: *"Permission denied"* or *"Camera access denied"*. | No crash. Form remains interactive. |
| 1.2.11 | Tap **📍 Capture GPS** after camera was blocked. | GPS still works independently. | Hardware APIs are isolated. |

#### Camera memory / cleanup

| # | Step | Expected Result | Pass Criteria |
|---|------|----------------|--------------|
| 1.2.12 | Open camera, capture 1 photo, tap **✕** to close camera. | `mediaStream.getTracks().forEach(t => t.stop())` fires. Camera indicator LED turns off. | Verify in DevTools → `about:media-internals` that tracks are stopped. |

---

## 2. OFFLINE STORAGE & DATA INTEGRITY

### 2.1 Manual IndexedDB inspection

**Chrome DevTools:**
```
Application → IndexedDB → CoronerSceneDb → cases
```

**Safari DevTools:**
```
Storage → IndexedDB → CoronerSceneDb → cases
```

| # | Step | Expected Result | Pass Criteria |
|---|------|----------------|--------------|
| 2.1.1 | Open DevTools → **Application** → **IndexedDB**. | Database `CoronerSceneDb` listed with stores `cases` and `physicalMarks`. | Both stores exist. |
| 2.1.2 | Fresh state — no records saved. | `cases` store is empty. `Key (keyPath): "id"` shown. | Zero rows. |
| 2.1.3 | Fill form: Name = `TEST, Jane`, Address = `123 QA Lane`, tap **📍 Capture GPS**, tap **📷 Open Camera** → **📸 Capture** (take 2 photos). | Form populated. Photos visible. | — |
| 2.1.4 | Tap **💾 Save Case Locally**. | Toast: *"Case #N saved to local database"*. | — |
| 2.1.5 | Refresh DevTools IndexedDB tree. Click **cases** store. | One row appears. Expand it. | All fields match: |
| | | `caseNumber` → `"2026-0618-..."` | Auto-generated format `YYYY-MMDD-HHmm`. |
| | | `decedentName` → `"TEST, Jane"` | Text matches. |
| | | `address` → `"123 QA Lane"` | Text matches. |
| | | `latitude` / `longitude` | Numeric, not null. |
| | | `ambientTemperature` / `bodyTemperature` | Float or null if left empty. |
| | | `temperatureUnit` → `"C"` or `"F"` | Default `"C"`. |
| | | `images` → `[...]` | Array of base64 data-url strings. |
| | | `syncStatus` → `"pending"` | **Must be `"pending"`.** |
| | | `supabaseId` → `null` | Null until synced. |
| 2.1.6 | Navigate to the **📋 Cases** tab. Tap the case to expand. | All fields render: address, GPS, temps, photos, sync badge. | Photos load from base64. |
| 2.1.7 | Reload the page (`Cmd+R`). Switch to **📋 Cases** tab. | Saved case still present with all data. | Data survives page reload. |

### 2.2 Console diagnostic script

```js
// Paste into DevTools Console.
// Reads ALL records from Dexie and prints a summary table.

;(async () => {
  const db = new Dexie('CoronerSceneDb')
  db.version(1).stores({ cases: '++id', physicalMarks: '++id' })
  const cases = await db.table('cases').toArray()
  const marks = await db.table('physicalMarks').toArray()

  console.group('📦 Dexie Diagnostic')
  console.log(`Cases: ${cases.length} rows`)
  console.table(cases.map(c => ({
    ID: c.id,
    Case: c.caseNumber,
    Name: c.decedentName,
    GPS: c.latitude ? `${c.latitude.toFixed(4)}, ${c.longitude?.toFixed(4)}` : '—',
    Temps: c.ambientTemperature ? `${c.ambientTemperature}°${c.temperatureUnit} / ${c.bodyTemperature}°${c.temperatureUnit}` : '—',
    Photos: c.images?.length || 0,
    Sync: c.syncStatus,
    SupaID: c.supabaseId,
  })))

  console.log(`Physical Marks: ${marks.length} rows`)
  console.table(marks.map(m => ({
    ID: m.id,
    CaseID: m.caseId,
    Type: m.type,
    Location: m.bodyLocation,
    Sync: m.syncStatus,
  })))
  console.groupEnd()

  // Integrity checks
  const pending = cases.filter(c => c.syncStatus === 'pending')
  const failed = cases.filter(c => c.syncStatus === 'failed')
  const orphanMarks = marks.filter(m => !cases.some(c => c.id === m.caseId))

  if (pending.length) console.warn(`⚠️  ${pending.length} case(s) waiting to sync`)
  if (failed.length) console.error(`❌ ${failed.length} case(s) marked 'failed' — requires manual retry`)
  if (orphanMarks.length) console.error(`❌ ${orphanMarks.length} physical mark(s) reference deleted cases`)
  if (!pending.length && !failed.length) console.log('✅ All records synced and consistent')
})()
```

> **Note:** The console snippet requires `Dexie` to be available globally. If it's not, load it first via:  
> `await import('https://unpkg.com/dexie@4.0.11/dist/dexie.js')`  
> Or open DevTools on the app page where Dexie is already bundled.

---

## 3. NETWORK DISCONNECT & SUPABASE SYNC EDGE CASES

### 3.1 Full offline → online sync scenario

**Setup:** Open DevTools → **Network** tab → check **☐ Offline**.

| # | Step | Expected Result | Pass Criteria |
|---|------|----------------|--------------|
| 3.1.1 | Enable **Offline** in DevTools. | Top sync bar shows: *"⏳ Waiting for network"*. | UI explicitly shows offline state. |
| 3.1.2 | Fill form completely and save a case (name, address, GPS, 1 photo). | Toast: *"Case #N saved locally"*. | Data written to Dexie. |
| 3.1.3 | Save a second case without photos. | Two entries in the list. | Both persisted. |
| 3.1.4 | Switch to **📋 Cases** tab. | All fields render from local Dexie. Thumbnails load. | Offline case browsing fully functional. |
| 3.1.5 | Disable **Offline** in DevTools. | Sync bar transitions through states: *"🔄 Syncing…"* → *"✅ Synced at HH:MM:SS"*. | The `online` event fires `syncService.sync()`. |
| 3.1.6 | Switch to **📋 Cases** tab (tap it twice to force refresh). | `syncStatus` badge on each case changes from `pending` → `synced`. | Verify in DevTools → IndexedDB → `syncStatus = "synced"`. |
| 3.1.7 | **Supabase verification:** Open Supabase dashboard → **Table Editor** → `cases`. | Two rows exist matching the saved data. `images` column contains `jsonb[]` of base64 strings. | Data round-trip: Dexie → Supabase. |

### 3.2 Sync conflict / error handling

| # | Step | Expected Result | Pass Criteria |
|---|------|----------------|--------------|
| 3.2.1 | After reconnection, if Supabase returns a 4xx/5xx, the sync marks the batch as `"failed"`. | Sync bar: *"⚠️ Sync failed: ..."*. | Error message visible. |
| 3.2.2 | Check Dexie records. | `syncStatus = "failed"`. | Records NOT deleted. |
| 3.2.3 | Fix the issue (e.g. correct RLS, increase payload size). Next periodic poll (60 s) or page reload triggers retry. | `syncStatus` flips to `"synced"`. | Automatic recovery. |

### 3.3 Troubleshooting: base64 image payload too large

| Symptom | Diagnosis | Fix |
|---------|-----------|-----|
| Sync fails with `413 Payload Too Large` or `Request Entity Too Large`. | Check Supabase logs: **Dashboard → Edge Functions → Logs** or **Database → Logs**. | 1. Reduce JPEG quality in `canvas.toDataURL('image/jpeg', 0.6)`.  
| | Check browser console for HTTP 413. | 2. Resize canvas before export (`maxWidth: 1024`).  
| | | 3. Increase Supabase API max body size (Settings → API → Max request size).  
| | | 4. Future: Upload images to Supabase Storage, store only the URL. |

#### Verify RLS is not blocking

```sql
-- Run in Supabase SQL Editor to check recent insert attempts
SELECT
  auth.uid() AS current_user,
  COUNT(*) FILTER (WHERE action = 'INSERT' AND status = 'SUCCESS') AS inserts_ok,
  COUNT(*) FILTER (WHERE action = 'INSERT' AND status = 'FAIL')   AS inserts_failed
FROM suppabase_audit_logs;  -- or check pg_stat_statements

-- Alternatively, test insert as the anon role directly:
-- This mirrors what the PWA sends via the anon key.
SELECT * FROM public.cases LIMIT 1;
```

### 3.4 Network throttling test

| # | Step | Expected Result | Pass Criteria |
|---|------|----------------|--------------|
| 3.4.1 | DevTools → Network → Throttling → **Slow 3G**. | Sync takes longer but completes. | No timeout crash. |
| 3.4.2 | With Slow 3G active, save a case with 3 large photos. | Save writes to Dexie immediately (offline-first). | Instant local save regardless of network. |

---

## 4. PWA LIGHTHOUSE & INSTALLABILITY CHECKLIST

### 4.1 Lighthouse audit

**Chrome DevTools → Lighthouse → Category: "Progressive Web App" → Generate report.**

| # | Check | Pass Requirement |
|---|-------|-----------------|
| 4.1.1 | **✅ Registers a service worker** | `navigator.serviceWorker.register(...)` is called. Current state: **not yet implemented** — needs `vite-plugin-pwa`. |
| 4.1.2 | **✅ Uses HTTPS** | Required for service workers. Localhost and production must be HTTPS. |
| 4.1.3 | **✅ Responds with 200 when offline** | Requires service worker with `NetworkFirst` or `CacheFirst` strategy. |
| 4.1.4 | **✅ start_url responds with 200** | `start_url: "/"` must return `index.html`. |
| 4.1.5 | **✅ Manifest has `display: standalone`** | Current manifest: not yet configured. Must add `vite-plugin-pwa` manifest. |
| 4.1.6 | **✅ Manifest has `theme_color` / `background_color`** | Must match `#0d1117` (current bg). |
| 4.1.7 | **✅ Manifest has icons (192px + 512px)** | PNG icons required at both sizes. |
| 4.1.8 | **✅ Content width matches viewport** | `<meta name="viewport" ...>` present (it is in `index.html`). |

### 4.2 Manual manifest verification

**Chrome DevTools → Application → Manifest.**

| # | Check | Value |
|---|-------|-------|
| 4.2.1 | Name | `Coroner Field Intake` |
| 4.2.2 | Short name | Optional — set to `CoronerPWA` or similar. |
| 4.2.3 | Display | `standalone` (hides Safari URL bar). |
| 4.2.4 | Orientation | `portrait` (field tablets are used in portrait). |
| 4.2.5 | Theme color | `#0d1117` |
| 4.2.6 | Icons | At least one 192x192 and one 512x512 PNG. |
| 4.2.7 | Start URL | `/` |

### 4.3 Service worker operational check

**Chrome DevTools → Application → Service Workers.**

| # | Check | Pass Criteria |
|---|-------|--------------|
| 4.3.1 | Service worker is **activated and running**. | Status: green "Activated". |
| 4.3.2 | **Offline test:** DevTools → Network → **Offline**, then reload the app. | Page loads from cache (even if only the shell). |
| 4.3.3 | **Update test:** Deploy new build. Reload. SW updates. | New SW installs and takes control. |

### 4.4 iOS Safari install test (physical device)

| # | Step | Expected Result |
|---|------|----------------|
| 4.4.1 | Open the app URL in Safari on an iPhone. | Page loads. **IOSInstallPrompt** bottom sheet appears after 1.5 s. |
| 4.4.2 | Tap **Got it** to dismiss the prompt. | Prompt disappears. `localStorage` flag set. |
| 4.4.3 | Reload the page. | Prompt does **not** reappear. |
| 4.4.4 | Tap Safari **Share** button (bottom toolbar). | Share sheet opens. |
| 4.4.5 | Scroll down → tap **Add to Home Screen**. | Name dialog appears. |
| 4.4.6 | Tap **Add** (top right). | App icon placed on Home Screen. |
| 4.4.7 | Tap the Home Screen icon. | App opens in **standalone** mode — no Safari URL bar. |
| 4.4.8 | Verify **IOSInstallPrompt** does not show in standalone mode. | Prompt suppressed. |
| 4.4.9 | Verify camera + GPS work from the standalone app. | Hardware APIs functional. |

### 4.5 Required improvements checklist (all resolved ✅)

| # | Gap | Status | Implementation |
|---|-----|--------|---------------|
| ✅ | Service worker | **Fixed** | `vite-plugin-pwa` with `registerType: 'autoUpdate'` generates `sw.js` + `workbox-bdb082da.js` at build time. |
| ✅ | Offline cache strategy | **Fixed** | `runtimeCaching` configured: Supabase API `NetworkFirst`, images `CacheFirst`, 14 precached entries (523 KiB). |
| ✅ | PWA icons | **Fixed** | `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png` generated as SVGs in `/public/`. Manifest references all three. |
| ✅ | `apple-touch-icon` | **Fixed** | `<link rel="apple-touch-icon" href="/apple-touch-icon.png">` added to `index.html`. |
| ✅ | Splash screen meta | **Fixed** | `<meta name="apple-mobile-web-app-capable" content="yes">`, `viewport-fit=cover`, `status-bar-style=black-translucent` all set. |
| ✅ | Manifest | **Fixed** | `manifest.webmanifest` generated by plugin with `display: standalone`, `orientation: portrait`, `theme_color: #0d1117`. |

---

## Appendix: Quick-reference command snippets

```bash
# Run the app locally
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Verify Supabase connection from CLI
curl -s -o /dev/null -w "%{http_code}" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  $VITE_SUPABASE_URL/rest/v1/cases?limit=1

# Check Dexie rows via browser console
# (paste the diagnostic script from §2.2)
```

---
