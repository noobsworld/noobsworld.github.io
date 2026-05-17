# 3D Playground

A collection of interactive 3D web experiences built with Three.js, WebGL, and modern web technologies.

🌐 **Live Demo:** [noobsworld.github.io](https://noobsworld.github.io)

## Projects

| Project | Description | Status |
|---------|-------------|--------|
| [🌀 Fidget Spinner 3D](/spinner/) | Realistic physics-based spinner with 14 designs, singing bowl audio, drag-to-spin, SSAO, and dark/light themes | ✅ Live |
| [🧪 Peptide Vial 3D](/vial/) | Dark HUD-style glass vial with liquid simulation, peptide chain, and Web Audio | ✅ Live |
| 🎨 3D Paint | Draw and sculpt in 3D space | 🚧 Coming Soon |
| 🌍 Globe Visualizer | Interactive 3D globe with data visualization | 🚧 Coming Soon |
| 🎵 Audio Visualizer | Real-time 3D audio visualization | 🚧 Coming Soon |
| 🏗️ Physics Sandbox | Drop, stack, and interact with 3D objects | 🚧 Coming Soon |
| ✨ Particle Galaxy | GPU-accelerated particle systems | 🚧 Coming Soon |

---

## Fidget Spinner 3D

A realistic 3D fidget spinner simulator with 14 designs.

![Three.js](https://img.shields.io/badge/three.js-0.183-green) ![Vite](https://img.shields.io/badge/vite-8.0-blue)

### Features

- **14 popular spinner designs** — Classic, Tri, Bar, Torqbar, Hex, Kong, Infinity, Valkyrie, Ninja Star, Double Deck, Compass, Gear, Skull, Pokeball

---

## Peptide Vial 3D

A dark HUD-style glass vial with interactive liquid simulation.

![Three.js](https://img.shields.io/badge/three.js-0.183-green) ![Vite](https://img.shields.io/badge/vite-8.0-blue)

### Features

- **Physically-based glass** — transmission, refraction, and caustic-style lighting
- **Interactive liquid** — animated waves with orbital color transitions (cyan/pink/purple/gold)
- **Drag to rotate** — quaternion-based, position-following, no gimbal lock
- **Tap to stop** — quick tap halts all rotation, triggers ripple effect
- **Auto-orbit camera** — activates after 2.5s of idle
- **Singing bowl audio** — frequency-shifting ambient tones tied to rotation speed
- **Peptide chain** — helical backbone with residue spheres and ribbon overlay
- **HUD panel** — frosted glass UI with audio toggle and fill level slider
- **Entrance animation** — bottle rises from below with glass fade-in
- **Particle system** — 120 ambient floating particles with cyan glow

### Controls

| Input | Action |
|-------|--------|
| **Drag vial** | Position-based rotation (follows cursor/finger) |
| **Tap** | Stop rotation + ripple effect |
| **S / Escape** | Stop |
| **Fill slider** | Adjust liquid level |
- **Realistic physics** — combined linear + quadratic drag model, framerate-independent
- **Drag to spin** — raycast-based interaction with flick velocity tracking
- **Singing bowl audio** — per-type chords, wind ambience, random pentatonic chimes
- **3D carousel selector** — drag-to-spin ring to browse types
- **Dark / Light themes** — full scene reactivity (lighting, fog, ground, UI)
- **Speed effects** — glow rings, particles, emissive pulse, bloom scaling
- **SSAO** — screen-space ambient occlusion for depth-based shadows
- **Contact shadows** — 4K shadow maps with optimized mobile quality
- **Stats tracking** — RPM, spin timer, best spin, total spins (localStorage)
- **Mobile support** — touch controls, flick-to-spin, responsive UI, adaptive quality

### Controls

| Input | Action |
|-------|--------|
| **Space** | Tap to spin (+25 rad/s per tap) |
| **S / Escape** | Stop |
| **← →** | Switch spinner type |
| **Drag spinner** | Flick to spin |
| **Drag scene** | Orbit camera |
| **Scroll** | Zoom |

### Development

```bash
npm install
npm run dev       # Dev server at localhost:5173
npm run build     # Production build → dist/
npm run preview   # Preview production build
```

### Tech Stack

- **Three.js** — 3D rendering, post-processing (bloom, SSAO)
- **Vite** — multi-page dev server and build tool
- **Web Audio API** — singing bowl synthesis
- Vanilla JavaScript, no frameworks

### Project Structure

```
index.html              Homepage (project showcase)
spinner/
  index.html            Spinner entry point
  main.js               All application code (~2022 lines)
vial/
  index.html            Vial entry point
  main.js               All application code (~1091 lines)
homepage/
  main.js               Homepage 3D background and card previews (~393 lines)
vite.config.js          Multi-page build config (main, spinner, vial)
public/                 Static assets (favicon)
```
