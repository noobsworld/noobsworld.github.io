# Fidget Spinner 3D

A realistic 3D fidget spinner simulator built with Three.js and Vite.

![Three.js](https://img.shields.io/badge/three.js-0.183-green) ![Vite](https://img.shields.io/badge/vite-8.0-blue)

## Features

- **8 popular spinner designs** — Classic, Tri, Bar, Torqbar, Hex, Kong, Infinity, Valkyrie
- **Realistic physics** — combined linear + quadratic drag model, framerate-independent
- **Drag to spin** — raycast-based interaction, separate from camera orbit
- **Singing bowl audio** — per-type chords, wind ambience, random pentatonic chimes
- **3D carousel selector** — drag-to-spin ring to browse types
- **Dark / Light themes** — full scene reactivity (lighting, fog, ground, UI)
- **Speed effects** — glow rings, particles, emissive pulse, bloom scaling
- **Stats tracking** — RPM, spin timer, best spin, total spins (localStorage)

## Controls

| Input | Action |
|-------|--------|
| **Space** | Tap to spin (+25 rad/s per tap) |
| **S / Escape** | Stop |
| **← →** | Switch spinner type |
| **Drag spinner** | Flick to spin |
| **Drag scene** | Orbit camera |
| **Scroll** | Zoom |

## Development

```bash
npm install
npm run dev       # Dev server at localhost:5173
npm run build     # Production build → dist/
npm run preview   # Preview production build
```

## Tech Stack

- **Three.js** — 3D rendering, post-processing (bloom)
- **Vite** — dev server and build tool
- **Web Audio API** — singing bowl synthesis
- Vanilla JavaScript, no frameworks

## Project Structure

```
index.html      Entry point
main.js         All application code (~1300 lines)
vite.config.js  Build config
public/         Static assets (favicon)
```
