# AGENTS.md

## Project Overview

3D interactive fidget spinner built with **Vite** + **Three.js** (vanilla JavaScript, ES modules).
Realistic physics-based spinner with 8 popular designs, singing bowl audio, drag-to-spin interaction,
3D carousel type selector, dark/light theme, speed effects, and stats tracking.

All application code lives in a single monolithic `main.js` file (~1300 lines, pure functional style, no classes).

## Build & Dev Commands

```bash
npm run dev      # Start dev server (port 5173, binds 0.0.0.0, opens browser)
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

No linting, testing, or type-checking is configured.

## Project Structure

```
index.html        # Minimal entry HTML (spinner-container + empty ui-root div)
main.js           # All application code (~1300 lines: scene, physics, interaction, audio, UI)
vite.config.js    # Vite config (port 5173, host 0.0.0.0)
public/           # Static assets (favicon, icons)
```

## Code Style

### Language & Modules
- Pure JavaScript (no TypeScript), ES module syntax (`import`/`export`)
- `"type": "module"` in package.json
- Three.js addons imported via `three/addons/...` paths
- Purely functional approach — no ES6 classes

### Imports
```js
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
```
Always import from `three` (the package), never from `three/src/`.

### Formatting
- 2-space indentation (note: `vite.config.js` uses 4-space)
- Single quotes for strings
- No semicolons (ASMI style)
- Trailing commas in multi-line objects/arrays
- Blank lines between logical sections

### Naming
- `camelCase` for variables, functions
- `UPPER_SNAKE_CASE` for constants (`SPINNER_TYPES`, `THEMES`, `DRAG_LINEAR`, `MAX_SPEED`)
- Colors as hex integers: `0xffd700`, `0xeef2f8`
- `const` for all non-mutable bindings; `let` only for mutable state

### Section Comments
Use box-drawing style section dividers:
```js
// ══════════════════════════════════════════
// ── SECTION NAME ──
// ══════════════════════════════════════════
```

### DOM & UI
- Vanilla DOM API: `document.createElement`, `getElementById`, `addEventListener`
- CSS injected via `document.createElement('style')` in `createUI()` (CSS-in-JS pattern)
- UI built entirely dynamically — `index.html` contains only container divs
- UI uses class-based styling (`.hud-panel`, `.hud-btn`, `.carousel-card`, `.stat-row`, etc.)

### Materials
- `makeMat(cfg)` → `MeshStandardMaterial` with configurable metalness/roughness/emissive
- Each spinner type in `SPINNER_TYPES` has `body`, `bearing`, `balls`, `cap`, `accent` material configs
- Geometries created inline, disposed in `clearSpinner()` via `traverse()`
- `emissiveParts` array tracks materials that should pulse glow

### Animation
- `requestAnimationFrame` with `performance.now()` delta time
- Frame-rate independent drag physics: `dragForce = linear * v + quad * v²`
- Wobble via sine/cosine on rotation.x/z proportional to speed
- Speed rings (soft torus) fade in with speed
- Emissive pulse: breathing sine wave × speed factor

## Key Patterns

### Spinner Types (8 generators)
`SPINNER_TYPES` array defines configs. Each has: `name`, `emoji`, `desc`, material configs, `arms` count, `floor` (light/dark), `chord` (audio freq).
`GENERATORS` array maps to creation functions:
- **Classic** — 3 tapered arms, spherical weights, chrome blue
- **Tri** — 3 arms, heavy cylindrical weights, silver chrome
- **Bar** — 2-arm dumbbell, copper accents, gunmetal
- **Torqbar** — 2 asymmetric arms (long + short), rose gold accents
- **Hex** — hexagonal body, 6 small weights, green + gold
- **Kong** — ring spinner with 6 holes, red + orange
- **Infinity** — two figure-8 tube loops, chrome grey + cobalt
- **Valkyrie** — 3 stealth angular arms, octahedron weights, black + blue

All share signature: `function createXxx(type)` → adds meshes to `spinnerGroup`.

### Physics (Realistic Drag Model)
Combined linear + quadratic drag: `dragForce = DRAG_LINEAR * v + DRAG_QUAD * v² * |v|`
Applied each frame: `velocity -= dragForce * dt`
Snaps to zero below `STOP_THRESHOLD` (0.08 rad/s).
Space key adds fixed boost (`SPACE_BOOST` = 25 rad/s per tap, repeated taps to accelerate).
Drag-to-spin via raycaster on z=0 plane, angle delta → torque (`TORQUE_SCALE`).
Quick click (<250ms, <12px) applies instant boost. OrbitControls enabled for scene dragging.

### Interaction
- **Drag on spinner** → spins it (raycasts against spinnerGroup mesh)
- **Drag on scene** → orbits camera (OrbitControls)
- **Space** → tap to add speed (+25 rad/s per tap)
- **S / Escape** → stop
- **← →** → switch spinner type
- **3D carousel ring** → drag to spin, click to select type

### Theme System
`THEMES` object with `light` and `dark` configs covering: scene colors, fog, lighting (5 lights),
ground, grid, sky gradient, UI panel styles, button styles, text colors.
`applyTheme(name)` updates all scene and UI references. Each spinner type has `floor: { light, dark }`.

### Audio (Singing Bowl)
4 sine oscillators at chord frequencies (per-type), connected to masterGain.
White noise → bandpass filter for gentle wind sound.
Random pentatonic chimes triggered by speed (exponential decay envelope).
`setTargetAtTime` for all gain/frequency ramping. Audio initialized on first toggle.

### Stats
RPM from `angularVelocity * 9.549`. Spin timer tracks duration above 0.5 rad/s.
Best spin and total spins persisted to `localStorage`.

## Dependencies

- `three` ^0.183.2 — 3D rendering
- `vite` ^8.0.1 (dev) — build tool
- `@types/three` ^0.183.1 (dev) — type hints for IDE support

## WSL / Networking

Dev server binds to `0.0.0.0` so it's accessible from Windows browser.
Use `http://<WSL_IP>:5173` or configure `networkingMode=mirrored` in WSL.
