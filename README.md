# 3D Playground

A collection of interactive 3D web experiences built with Three.js, WebGL, and modern web technologies.

🌐 **Live Demo:** [noobsworld.github.io](https://noobsworld.github.io)

## Projects

| Project | Description | Status |
|---------|-------------|--------|
| [🌀 Fidget Spinner 3D](/spinner/) | Realistic physics-based spinner with 13 designs, singing bowl audio, drag-to-spin, SSAO, and dark/light themes | ✅ Live |
| 🎨 3D Paint | Draw and sculpt in 3D space | 🚧 Coming Soon |
| 🌍 Globe Visualizer | Interactive 3D globe with data visualization | 🚧 Coming Soon |
| 🎵 Audio Visualizer | Real-time 3D audio visualization | 🚧 Coming Soon |
| 🏗️ Physics Sandbox | Drop, stack, and interact with 3D objects | 🚧 Coming Soon |
| ✨ Particle Galaxy | GPU-accelerated particle systems | 🚧 Coming Soon |

---

## Fidget Spinner 3D

A realistic 3D fidget spinner simulator — the first project in this collection.

![Three.js](https://img.shields.io/badge/three.js-0.183-green) ![Vite](https://img.shields.io/badge/vite-8.0-blue)

### Features

- **13 popular spinner designs** — Classic, Tri, Bar, Torqbar, Hex, Kong, Infinity, Valkyrie, Ninja Star, Double Deck, Compass, Gear, Skull
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
  main.js               All application code (~1900 lines)
vite.config.js          Multi-page build config
public/                 Static assets (favicon)
```
