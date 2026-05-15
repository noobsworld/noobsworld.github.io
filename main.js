import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

// ══════════════════════════════════════════
// ── THEME CONFIGS ──
// ══════════════════════════════════════════

const THEMES = {
  light: {
    sceneBg: 0xfff8e8, sceneFog: 0xffe8d0,
    ambientColor: 0xffffff, ambientIntensity: 0.7,  // Increased for better HDRI integration
    dirColor: 0xfff5e8, dirIntensity: 2.2,        // Increased directional light
    fillColor: 0xe0eeff, fillIntensity: 0.7,      // Increased fill light
    rimColor: 0xffe8d0, rimIntensity: 0.6,        // Increased rim light for edge definition
    bottomColor: 0xd0e0ff, bottomIntensity: 0.4,  // Increased bottom light
    hemiSky: 0xb0d0f0, hemiGround: 0xf0e0d0, hemiIntensity: 0.7, // Increased hemisphere light
    groundColor: 0xe8e0d8, gridColor1: 0xd8dce8, gridColor2: 0xe4e8f0, gridOpacity: 0.25,
    skyTop: '#e8d8c0', skyMid: '#f0e0d0', skyBot: '#fff8e8',
    panelBg: 'rgba(255,255,255,0.65)', panelBorder: 'rgba(255,255,255,0.5)',
    panelShadow: '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)',
    textPrimary: '#2a3a5e', textSecondary: '#8899aa', textMuted: '#999',
    btnBg: 'rgba(255,255,255,0.5)', btnBorder: 'rgba(0,0,0,0.06)',
    btnHover: 'rgba(255,255,255,0.8)', btnText: '#3a3a4a',
    hintColor: 'rgba(0,0,0,0.15)', dividerColor: 'rgba(0,0,0,0.05)',
    wheelItemBg: 'rgba(255,255,255,0.4)',
    wheelItemActiveBg: 'rgba(255,255,255,0.85)', wheelItemBorder: 'rgba(0,0,0,0.05)',
    wheelItemActiveBorder: 'rgba(80,140,200,0.3)',
    particleColor: 0xa8c0d8, speedLineColor: 0x8ab0d0
  },
  dark: {
    sceneBg: 0x0a0a14, sceneFog: 0x0a0a14,
    ambientColor: 0x334466, ambientIntensity: 0.4,
    dirColor: 0xffeedd, dirIntensity: 1.2,
    fillColor: 0x4466aa, fillIntensity: 0.3,
    rimColor: 0xffcc88, rimIntensity: 0.25,
    bottomColor: 0x223344, bottomIntensity: 0.15,
    hemiSky: 0x223355, hemiGround: 0x111118, hemiIntensity: 0.3,
    groundColor: 0x12121a, gridColor1: 0x1a1a28, gridColor2: 0x141420, gridOpacity: 0.15,
    skyTop: '#080810', skyMid: '#0c0c18', skyBot: '#0a0a14',
    panelBg: 'rgba(20,20,35,0.75)', panelBorder: 'rgba(255,255,255,0.08)',
    panelShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
    textPrimary: '#c8d0e0', textSecondary: '#667788', textMuted: '#556',
    btnBg: 'rgba(255,255,255,0.06)', btnBorder: 'rgba(255,255,255,0.1)',
    btnHover: 'rgba(255,255,255,0.12)', btnText: '#c0c8d8',
    hintColor: 'rgba(255,255,255,0.12)', dividerColor: 'rgba(255,255,255,0.06)',
    wheelItemBg: 'rgba(255,255,255,0.05)',
    wheelItemActiveBg: 'rgba(255,255,255,0.12)', wheelItemBorder: 'rgba(255,255,255,0.08)',
    wheelItemActiveBorder: 'rgba(100,160,220,0.4)',
    particleColor: 0x4466aa, speedLineColor: 0x334488
  }
}

let isDarkTheme = false

// ══════════════════════════════════════════
// ── SPINNER TYPE DEFINITIONS ──
// ══════════════════════════════════════════

const SPINNER_TYPES = [
  {
    name: 'Classic', emoji: '\u{1F504}', desc: 'The original 3-arm spinner',
    body: { color: 0xd0dae6, metalness: 0.95, roughness: 0.06, emissive: 0x102040, emissiveIntensity: 0.04 },
    bearing: { color: 0x6088b0, metalness: 1.0, roughness: 0.1 },
    balls: { color: 0x90b8d8, metalness: 1.0, roughness: 0.04 },
    cap: { color: 0xe0ecf8, metalness: 0.95, roughness: 0.08 },
    accent: { color: 0x3088cc, metalness: 0.9, roughness: 0.12 },
    arms: 3, floor: { light: 0xe4eaf0, dark: 0x141828 },
    chord: [146.83, 220.00, 293.66, 349.23]
  },
  {
    name: 'Tri', emoji: '\u{25B2}', desc: 'Heavy-weighted 3-arm steel',
    body: { color: 0xc0c0c8, metalness: 0.98, roughness: 0.04, emissive: 0x101018, emissiveIntensity: 0.03 },
    bearing: { color: 0x707880, metalness: 1.0, roughness: 0.08 },
    balls: { color: 0xa0a8b0, metalness: 1.0, roughness: 0.04 },
    cap: { color: 0xe8e8f0, metalness: 0.98, roughness: 0.06 },
    accent: { color: 0x8888a0, metalness: 0.95, roughness: 0.1 },
    arms: 3, floor: { light: 0xe0e2e8, dark: 0x121218 },
    chord: [155.56, 233.08, 311.13, 369.99]
  },
  {
    name: 'Bar', emoji: '\u{2501}', desc: 'Sleek 2-arm dumbbell',
    body: { color: 0x2a2a32, metalness: 0.4, roughness: 0.7, emissive: 0x080808, emissiveIntensity: 0.02 },
    bearing: { color: 0x404048, metalness: 0.6, roughness: 0.5 },
    balls: { color: 0xb87333, metalness: 0.9, roughness: 0.12 },
    cap: { color: 0xb87333, metalness: 0.85, roughness: 0.15 },
    accent: { color: 0xb87333, metalness: 0.88, roughness: 0.12 },
    arms: 2, floor: { light: 0xd8d8dc, dark: 0x101014 },
    chord: [116.54, 174.61, 233.08, 277.18]
  },
  {
    name: 'Torqbar', emoji: '\u{2699}', desc: 'Asymmetric precision design',
    body: { color: 0x3a3a42, metalness: 0.5, roughness: 0.55, emissive: 0x100808, emissiveIntensity: 0.05 },
    bearing: { color: 0x505058, metalness: 0.7, roughness: 0.3 },
    balls: { color: 0xc8a080, metalness: 0.85, roughness: 0.12 },
    cap: { color: 0xc8a080, metalness: 0.8, roughness: 0.18 },
    accent: { color: 0xb89070, metalness: 0.82, roughness: 0.15 },
    arms: 2, floor: { light: 0xdcd8d4, dark: 0x12100e },
    chord: [130.81, 196.00, 261.63, 311.13]
  },
  {
    name: 'Hex', emoji: '\u{2B22}', desc: 'Hexagonal body with 6 weights',
    body: { color: 0x40d080, metalness: 0.78, roughness: 0.14, emissive: 0x082818, emissiveIntensity: 0.08 },
    bearing: { color: 0x2a9060, metalness: 0.85, roughness: 0.12 },
    balls: { color: 0x50d890, metalness: 0.9, roughness: 0.08 },
    cap: { color: 0xf0c840, metalness: 0.75, roughness: 0.15 },
    accent: { color: 0xf0c840, metalness: 0.78, roughness: 0.12 },
    arms: 6, floor: { light: 0xd8ece2, dark: 0x0e1a14 },
    chord: [174.61, 261.63, 349.23, 415.30]
  },
  {
    name: 'Kong', emoji: '\u{25EF}', desc: 'Circular ring spinner',
    body: { color: 0xcc4444, metalness: 0.85, roughness: 0.1, emissive: 0x280808, emissiveIntensity: 0.08 },
    bearing: { color: 0x993333, metalness: 0.9, roughness: 0.12 },
    balls: { color: 0xdd6666, metalness: 0.92, roughness: 0.08 },
    cap: { color: 0xff8888, metalness: 0.8, roughness: 0.12 },
    accent: { color: 0xffaa44, metalness: 0.82, roughness: 0.1 },
    arms: 0, floor: { light: 0xeee0dc, dark: 0x180e0c },
    chord: [123.47, 185.00, 246.94, 293.66]
  },
  {
    name: 'Infinity', emoji: '\u{221E}', desc: 'Figure-8 loop design',
    body: { color: 0x8888a0, metalness: 0.9, roughness: 0.08, emissive: 0x101020, emissiveIntensity: 0.06 },
    bearing: { color: 0x606078, metalness: 0.92, roughness: 0.1 },
    balls: { color: 0x9898b0, metalness: 0.95, roughness: 0.06 },
    cap: { color: 0xc0c0d8, metalness: 0.9, roughness: 0.08 },
    accent: { color: 0x7088cc, metalness: 0.88, roughness: 0.1 },
    arms: 0, floor: { light: 0xe0e0e8, dark: 0x101018 },
    chord: [110.00, 164.81, 220.00, 261.63]
  },
  {
    name: 'Valkyrie', emoji: '\u{2694}', desc: 'Stealth 3-arm fighter',
    body: { color: 0x1a1a28, metalness: 0.35, roughness: 0.75, emissive: 0x040818, emissiveIntensity: 0.06 },
    bearing: { color: 0x2a2a38, metalness: 0.5, roughness: 0.5 },
    balls: { color: 0x4080c0, metalness: 0.85, roughness: 0.12 },
    cap: { color: 0x4080c0, metalness: 0.8, roughness: 0.15 },
    accent: { color: 0x3060a0, metalness: 0.75, roughness: 0.18 },
    arms: 3, floor: { light: 0xd4d8e0, dark: 0x0c0c14 },
    chord: [138.59, 207.65, 277.18, 329.63]
  },
  {
    name: 'Ninja Star', emoji: '\u{2728}', desc: 'Sharp 4-point shuriken',
    body: { color: 0x404050, metalness: 0.92, roughness: 0.08, emissive: 0x080818, emissiveIntensity: 0.04 },
    bearing: { color: 0x606070, metalness: 0.95, roughness: 0.1 },
    balls: { color: 0x808090, metalness: 0.95, roughness: 0.06 },
    cap: { color: 0xa0a0b0, metalness: 0.9, roughness: 0.1 },
    accent: { color: 0xcc4444, metalness: 0.85, roughness: 0.12 },
    arms: 4, floor: { light: 0xd8d8e0, dark: 0x101018 },
    chord: [155.56, 233.08, 311.13, 369.99]
  },
  {
    name: 'Double Deck', emoji: '\u{2261}', desc: 'Two-tier stacked design',
    body: { color: 0x8866aa, metalness: 0.82, roughness: 0.14, emissive: 0x180828, emissiveIntensity: 0.08 },
    bearing: { color: 0x664488, metalness: 0.85, roughness: 0.15 },
    balls: { color: 0x9977bb, metalness: 0.88, roughness: 0.1 },
    cap: { color: 0xddaa44, metalness: 0.78, roughness: 0.15 },
    accent: { color: 0xddaa44, metalness: 0.8, roughness: 0.12 },
    arms: 3, floor: { light: 0xe0dce8, dark: 0x120e18 },
    chord: [146.83, 220.00, 293.66, 349.23]
  },
  {
    name: 'Compass', emoji: '\u{2666}', desc: 'Cardinal direction points',
    body: { color: 0xc8a870, metalness: 0.88, roughness: 0.1, emissive: 0x201808, emissiveIntensity: 0.06 },
    bearing: { color: 0xa08050, metalness: 0.9, roughness: 0.12 },
    balls: { color: 0xd0b880, metalness: 0.92, roughness: 0.08 },
    cap: { color: 0xe8d8a0, metalness: 0.85, roughness: 0.1 },
    accent: { color: 0xcc3333, metalness: 0.82, roughness: 0.15 },
    arms: 4, floor: { light: 0xe8e4d8, dark: 0x14120e },
    chord: [130.81, 196.00, 261.63, 311.13]
  },
  {
    name: 'Gear', emoji: '\u{2699}', desc: 'Mechanical gear teeth design',
    body: { color: 0x707078, metalness: 0.95, roughness: 0.08, emissive: 0x080808, emissiveIntensity: 0.03 },
    bearing: { color: 0x505058, metalness: 0.98, roughness: 0.06 },
    balls: { color: 0x909098, metalness: 0.98, roughness: 0.04 },
    cap: { color: 0xb0b0b8, metalness: 0.95, roughness: 0.08 },
    accent: { color: 0xe0a030, metalness: 0.85, roughness: 0.12 },
    arms: 0, floor: { light: 0xdcdcdc, dark: 0x101014 },
    chord: [116.54, 174.61, 233.08, 277.18]
  },
  {
    name: 'Skull', emoji: '\u{2620}', desc: 'Edgy skull hub design',
    body: { color: 0xd0d0d0, metalness: 0.6, roughness: 0.3, emissive: 0x101010, emissiveIntensity: 0.05 },
    bearing: { color: 0x888890, metalness: 0.7, roughness: 0.25 },
    balls: { color: 0xaaaaaa, metalness: 0.8, roughness: 0.15 },
    cap: { color: 0xe0e0e0, metalness: 0.5, roughness: 0.35 },
    accent: { color: 0x222222, metalness: 0.4, roughness: 0.6 },
    arms: 3, floor: { light: 0xd8d8dc, dark: 0x0e0e12 },
    chord: [123.47, 185.00, 246.94, 293.66]
  },
  {
    name: 'Pokeball', emoji: '\u{26AA}', desc: '3-arm spinner with spinning Pokeballs',
    body: { color: 0xcc2222, metalness: 0.7, roughness: 0.15, emissive: 0x440000, emissiveIntensity: 0.06 },
    bearing: { color: 0x222222, metalness: 0.8, roughness: 0.1 },
    balls: { color: 0xeeeeee, metalness: 0.5, roughness: 0.2 },
    cap: { color: 0xffffff, metalness: 0.6, roughness: 0.15 },
    accent: { color: 0x111111, metalness: 0.3, roughness: 0.6 },
    arms: 3, floor: { light: 0xf0e8e8, dark: 0x140e0e },
    chord: [130.81, 196.00, 261.63, 311.13]
  }
]

// ══════════════════════════════════════════
// ── CONFIG ──
// ══════════════════════════════════════════

const DRAG_LINEAR = 0.4
const DRAG_QUAD = 0.004
const STOP_THRESHOLD = 0.08
const SPACE_BOOST = 25
const MAX_SPEED = 150
const TORQUE_SCALE = 25
const WOBBLE = 0.025

// ══════════════════════════════════════════
// ── STATE ──
// ══════════════════════════════════════════

let currentTypeIdx = 0
let angularVelocity = 0
let totalRotation = 0
let isDraggingSpinner = false
let soundEnabled = false
let currentRPM = 0
let spinStartTime = 0
let spinTimerActive = false
let longestSpin = parseFloat(localStorage.getItem('fidgetMaxSpin') || '0')
let totalSpins = parseInt(localStorage.getItem('fidgetTotalSpins') || '0', 10)

let lastAngle = 0
let dragStartPos = null
let dragStartTime = 0
let lastFrameTime = performance.now()

let audioCtx = null
let bowlOscs = []
let bowlGains = []
let windNode = null
let windGain = null
let windFilter = null
let masterGain = null
let lastChimeTime = 0

let pokeballSpinners = []

// ══════════════════════════════════════════
// ── SCENE SETUP ──
// ══════════════════════════════════════════

const scene = new THREE.Scene()
// Set initial background based on isDarkTheme
scene.background = new THREE.Color(isDarkTheme ? THEMES.dark.sceneBg : THEMES.light.sceneBg)
scene.fog = new THREE.FogExp2(isDarkTheme ? THEMES.dark.sceneFog : THEMES.light.sceneFog, 0.008)

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 5, 10)

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.5
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

// Mobile detection
const isMobile = /Mobi|Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent)

// Reduce shadow quality on mobile for performance
if (isMobile) {
  dirLight.shadow.mapSize.set(1024, 1024)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
}

document.getElementById('spinner-container').appendChild(renderer.domElement)

// ══════════════════════════════════════════
// ── ENVIRONMENT MAP (HDRI-like reflections) ──
// ══════════════════════════════════════════

// Environment setup with theme-based intensity for better visibility
const pmremGenerator = new THREE.PMREMGenerator(renderer)
pmremGenerator.compileEquirectangularShader()
// Use different environment intensity for light vs dark themes
const envIntensity = isDarkTheme ? 0.06 : 0.12  // Higher intensity in light mode
const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), envIntensity).texture
scene.environment = envTexture
// Note: toneMappingExposure will be set in applyTheme()

// ══════════════════════════════════════════
// ── POST-PROCESSING ──
// ══════════════════════════════════════════

const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))

// SSAO - Screen Space Ambient Occlusion for depth-based shadows
const ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight)
ssaoPass.kernelRadius = 16
ssaoPass.minDistance = 0.005
ssaoPass.maxDistance = 0.1
ssaoPass.output = SSAOPass.OUTPUT.Default
composer.addPass(ssaoPass)

// Bloom
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight), 0.25, 0.5, 0.88
)
composer.addPass(bloomPass)


const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.08
controls.enablePan = false
controls.minDistance = 4
controls.maxDistance = 20
controls.maxPolarAngle = Math.PI * 0.52
controls.minPolarAngle = Math.PI * 0.08
controls.target.set(0, 0, 0)

// ══════════════════════════════════════════
// ── LIGHTING (references for theme switching) ──
// ══════════════════════════════════════════

const ambientLight = new THREE.AmbientLight(0xffffff, 0.55)
scene.add(ambientLight)

const dirLight = new THREE.DirectionalLight(0xfff5e8, 1.8)
dirLight.position.set(5, 12, 7)
dirLight.castShadow = true
// Enhanced shadow settings for sharper contact shadows
dirLight.shadow.mapSize.set(4096, 4096)  // Higher resolution
dirLight.shadow.camera.near = 0.1
dirLight.shadow.camera.far = 50
dirLight.shadow.camera.left = -8
dirLight.shadow.camera.right = 8
dirLight.shadow.camera.top = 8
dirLight.shadow.camera.bottom = -8
dirLight.shadow.bias = -0.0001  // Less bias for sharper shadows
dirLight.shadow.radius = 1  // Softer shadow edges
scene.add(dirLight)

const fillLight = new THREE.DirectionalLight(0xe0eeff, 0.5)
fillLight.position.set(-6, 6, -5)
scene.add(fillLight)

const rimLight = new THREE.DirectionalLight(0xffe8d0, 0.4)
rimLight.position.set(0, 3, -8)
scene.add(rimLight)

const bottomLight = new THREE.DirectionalLight(0xd0e0ff, 0.25)
bottomLight.position.set(0, -5, 3)
scene.add(bottomLight)

const hemiLight = new THREE.HemisphereLight(0xb0d0f0, 0xf0e0d0, 0.5)
scene.add(hemiLight)

// ══════════════════════════════════════════
// ── ENVIRONMENT ──
// ══════════════════════════════════════════

const skyCanvas = document.createElement('canvas')
skyCanvas.width = 512; skyCanvas.height = 512
const skyCtx = skyCanvas.getContext('2d')

function updateSkyTexture(top, mid, bot) {
  const grad = skyCtx.createLinearGradient(0, 0, 0, 512)
  grad.addColorStop(0, top)
  grad.addColorStop(0.35, mid)
  grad.addColorStop(1, bot)
  skyCtx.fillStyle = grad
  skyCtx.fillRect(0, 0, 512, 512)
  skyTex.needsUpdate = true
}

const skyTex = new THREE.CanvasTexture(skyCanvas)
updateSkyTexture(THEMES.light.skyTop, THEMES.light.skyMid, THEMES.light.skyBot)
const skyMesh = new THREE.Mesh(
  new THREE.SphereGeometry(50, 32, 32),
  new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false })
)
scene.add(skyMesh)

const groundMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f4, roughness: 0.95, metalness: 0 })
const ground = new THREE.Mesh(new THREE.CircleGeometry(25, 64), groundMat)
ground.rotation.x = -Math.PI / 2
ground.position.y = -0.55
ground.receiveShadow = true
scene.add(ground)

const shadowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 12),
  new THREE.ShadowMaterial({ opacity: 0.25, color: 0x000000 })
)
shadowPlane.rotation.x = -Math.PI / 2
shadowPlane.position.y = -0.54
shadowPlane.receiveShadow = true
scene.add(shadowPlane)

const grid = new THREE.GridHelper(16, 16, 0xd8dce8, 0xe4e8f0)
grid.position.y = -0.53
grid.material.opacity = 0.25
grid.material.transparent = true
scene.add(grid)

function applyTheme(themeName) {
   const t = THEMES[themeName]
   isDarkTheme = themeName === 'dark'

   // Use the theme's background and fog colors
   scene.background.setHex(t.sceneBg)
   scene.fog.color.setHex(t.sceneFog)

   // CRITICAL FIX: Disable environment map in light mode to prevent whiteout
   // In dark mode, use environment for nice reflections
   renderer.toneMappingExposure = isDarkTheme ? 1.0 : 1.2
   
   if (isDarkTheme) {
     // Dark mode: enable environment for reflections
     scene.environment = envTexture
   } else {
     // Light mode: disable environment to prevent metallic washout
     scene.environment = null
   }
   
   // Update all materials
   scene.traverse(obj => {
     if (obj.isMesh && obj.material) {
       obj.material.needsUpdate = true
     }
   })
   scene.fog.density = isDarkTheme ? 0.008 : 0.012

   ambientLight.color.setHex(t.ambientColor)
   ambientLight.intensity = t.ambientIntensity

   dirLight.color.setHex(t.dirColor)
   dirLight.intensity = t.dirIntensity

   fillLight.color.setHex(t.fillColor)
   fillLight.intensity = t.fillIntensity

   rimLight.color.setHex(t.rimColor)
   rimLight.intensity = t.rimIntensity

   bottomLight.color.setHex(t.bottomColor)
   bottomLight.intensity = t.bottomIntensity

   hemiLight.color.setHex(t.hemiSky)
   hemiLight.groundColor.setHex(t.hemiGround)
   hemiLight.intensity = t.hemiIntensity

   ground.material.color.setHex(t.groundColor)
   grid.material.color.setHex(t.gridColor1)
   grid.material.opacity = t.gridOpacity

   updateSkyTexture(t.skyTop, t.skyMid, t.skyBot)

   // Update floor from current spinner type
   const type = SPINNER_TYPES[currentTypeIdx]
   ground.material.color.setHex(isDarkTheme ? type.floor.dark : type.floor.light)

   // Update particles and speed lines
   pMat.color.setHex(t.particleColor)
   speedLines.children.forEach(ring => ring.material.color.setHex(t.speedLineColor))

   // Update UI theme
   updateUITheme(t)
}

// ══════════════════════════════════════════
// ── MATERIAL HELPERS ──
// ══════════════════════════════════════════

let currentEnvIntensity = 1
function makeMat(cfg) {
  return new THREE.MeshStandardMaterial({
    color: cfg.color,
    metalness: cfg.metalness ?? 0.8,
    roughness: cfg.roughness ?? 0.2,
    emissive: cfg.emissive || 0x000000,
    emissiveIntensity: cfg.emissiveIntensity || 0.15,
    envMap: scene.environment,
    envMapIntensity: currentEnvIntensity,
    side: THREE.DoubleSide
  })
}

// ══════════════════════════════════════════
// ── SPINNER GROUP ──
// ══════════════════════════════════════════

const spinnerGroup = new THREE.Group()
scene.add(spinnerGroup)

let bodyMats = []
let emissiveParts = []

function clearSpinner() {
  spinnerGroup.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose()
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
      else obj.material.dispose()
    }
  })
  while (spinnerGroup.children.length > 0) spinnerGroup.remove(spinnerGroup.children[0])
  bodyMats = []
  emissiveParts = []
}

// ══════════════════════════════════════════
// ── BEARING ──
// ══════════════════════════════════════════

function createBearing(type) {
  const group = new THREE.Group()
  const bMat = makeMat(type.bearing)
  const ballMat = makeMat(type.balls)
  const capM = makeMat(type.cap)
  bodyMats.push(bMat, capM)
  emissiveParts.push(capM)

  group.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, 0.38, 48), bMat), { castShadow: true }))

  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.04, 8, 48), bMat)
  innerRing.rotation.x = Math.PI / 2; innerRing.position.y = 0.19
  group.add(innerRing)

  const topRing = new THREE.Mesh(new THREE.TorusGeometry(0.97, 0.035, 12, 48), ballMat)
  topRing.rotation.x = Math.PI / 2; topRing.position.y = 0.19
  group.add(topRing)

  const botRing = topRing.clone(); botRing.position.y = -0.19
  group.add(botRing)

  const midRing = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.02, 8, 48), ballMat)
  midRing.rotation.x = Math.PI / 2
  group.add(midRing)

  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2
    const ball = Object.assign(new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), ballMat), { castShadow: true })
    ball.position.set(Math.cos(a) * 0.92, 0, Math.sin(a) * 0.92)
    group.add(ball)
  }

  const cap = Object.assign(
    new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), capM),
    { castShadow: true }
  )
  cap.position.y = 0.19; group.add(cap)

  const capRim = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.022, 8, 32), ballMat)
  capRim.rotation.x = Math.PI / 2; capRim.position.y = 0.19
  group.add(capRim)

  const capDot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), ballMat)
  capDot.position.y = 0.4; group.add(capDot)

  return group
}

// ══════════════════════════════════════════
// ── SPINNER GENERATORS ──
// ══════════════════════════════════════════

function addDecoRing(group, r, tube, color, y) {
  const mat = typeof color === 'number'
    ? new THREE.MeshStandardMaterial({ color, metalness: 0.9, roughness: 0.1 })
    : color
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 48), mat)
  ring.rotation.x = Math.PI / 2; ring.position.y = y
  group.add(ring)
  if (typeof color !== 'number') bodyMats.push(mat)
  return ring
}

function createClassic(type) {
  const mat = makeMat(type.body), accent = makeMat(type.accent), detail = makeMat(type.bearing)
  bodyMats.push(mat, accent, detail); emissiveParts.push(mat, accent)

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.08, 48), mat)
  hub.position.y = 0.1; hub.castShadow = true; spinnerGroup.add(hub)
  spinnerGroup.add(createBearing(type))

  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group(), aL = 2.8, aW = 0.38, aT = 0.11, wR = 0.44

    const aGeo = new THREE.BoxGeometry(aL, aT, aW)
    const p = aGeo.attributes.position
    for (let v = 0; v < p.count; v++) { const t2 = 1.0 - (p.getX(v) / aL + 0.5) * 0.35; p.setZ(v, p.getZ(v) * t2) }
    p.needsUpdate = true; aGeo.computeVertexNormals()
    const arm = new THREE.Mesh(aGeo, mat); arm.position.set(aL / 2 + 0.5, 0, 0); arm.castShadow = true; g.add(arm)

    const st = new THREE.Mesh(new THREE.BoxGeometry(aL * 0.8, aT + 0.005, aW * 0.25), accent)
    st.position.set(aL / 2 + 0.5, aT / 2 + 0.002, 0); g.add(st)

    const w = new THREE.Mesh(new THREE.SphereGeometry(wR, 32, 32), mat)
    w.position.set(aL + 0.5, 0, 0); w.castShadow = true; g.add(w)

    const wr = new THREE.Mesh(new THREE.TorusGeometry(wR + 0.02, 0.02, 8, 24), detail)
    wr.position.set(aL + 0.5, 0, 0); wr.rotation.x = Math.PI / 2; g.add(wr)

    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), accent)
    dot.position.set(aL + 0.5, wR + 0.02, 0); g.add(dot)

    const mr = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.015, 8, 16), detail)
    mr.position.set(aL * 0.5 + 0.5, 0, 0); mr.rotation.x = Math.PI / 2; g.add(mr)

    g.rotation.z = (i / 3) * Math.PI * 2; spinnerGroup.add(g)
  }
}

function createTri(type) {
  const mat = makeMat(type.body), accent = makeMat(type.accent), detail = makeMat(type.bearing)
  bodyMats.push(mat, accent, detail); emissiveParts.push(mat, accent)

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.1, 48), mat)
  hub.position.y = 0.1; hub.castShadow = true; spinnerGroup.add(hub)
  spinnerGroup.add(createBearing(type))

  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group(), aL = 2.6, aW = 0.42, aT = 0.13, wR = 0.5

    const arm = new THREE.Mesh(new THREE.BoxGeometry(aL, aT, aW), mat)
    arm.position.set(aL / 2 + 0.55, 0, 0); arm.castShadow = true; g.add(arm)

    for (let s = -1; s <= 1; s += 2) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(aL * 0.85, aT + 0.005, 0.04), accent)
      st.position.set(aL / 2 + 0.55, aT / 2 + 0.002, s * aW * 0.3); g.add(st)
    }

    const w = new THREE.Mesh(new THREE.CylinderGeometry(wR, wR, aT * 2.5, 32), mat)
    w.position.set(aL + 0.55, 0, 0); w.castShadow = true; g.add(w)

    for (let r = 0; r < 3; r++) {
      const rr = wR - r * 0.08
      const wr = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.018, 8, 32), detail)
      wr.position.set(aL + 0.55, 0, 0); wr.rotation.x = Math.PI / 2; g.add(wr)
    }

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(wR * 0.5, wR * 0.5, 0.02, 24), accent)
    cap.position.set(aL + 0.55, aT * 1.25 + 0.01, 0); g.add(cap)

    g.rotation.z = (i / 3) * Math.PI * 2; spinnerGroup.add(g)
  }
}

function createBar(type) {
  const mat = makeMat(type.body), accent = makeMat(type.accent), detail = makeMat(type.bearing)
  bodyMats.push(mat, accent, detail); emissiveParts.push(mat, accent)

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.14, 32), mat)
  hub.position.y = 0.1; hub.castShadow = true; spinnerGroup.add(hub)
  spinnerGroup.add(createBearing(type))

  for (let i = 0; i < 2; i++) {
    const g = new THREE.Group(), aL = 3.2, aW = 0.35, aT = 0.12, wR = 0.48

    const aGeo = new THREE.BoxGeometry(aL, aT, aW)
    const p = aGeo.attributes.position
    for (let v = 0; v < p.count; v++) { const t2 = 1.0 - (p.getX(v) / aL + 0.5) * 0.2; p.setZ(v, p.getZ(v) * t2) }
    p.needsUpdate = true; aGeo.computeVertexNormals()
    const arm = new THREE.Mesh(aGeo, mat); arm.position.set(aL / 2 + 0.45, 0, 0); arm.castShadow = true; g.add(arm)

    const st = new THREE.Mesh(new THREE.BoxGeometry(aL * 0.9, aT + 0.006, aW * 0.2), accent)
    st.position.set(aL / 2 + 0.45, aT / 2 + 0.003, 0); g.add(st)

    const w = new THREE.Mesh(new THREE.CylinderGeometry(wR, wR * 0.95, 0.35, 32), mat)
    w.position.set(aL + 0.45, 0, 0); w.castShadow = true; g.add(w)

    for (const yy of [0.12, -0.12]) {
      const wr = new THREE.Mesh(new THREE.TorusGeometry(wR + 0.01, 0.022, 8, 32), accent)
      wr.position.set(aL + 0.45, yy, 0); wr.rotation.x = Math.PI / 2; g.add(wr)
    }

    const cd = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), accent)
    cd.position.set(aL + 0.45, 0.2, 0); g.add(cd)

    const mr = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.015, 8, 16), detail)
    mr.position.set(aL * 0.45 + 0.45, 0, 0); mr.rotation.x = Math.PI / 2; g.add(mr)

    g.rotation.z = i * Math.PI; spinnerGroup.add(g)
  }
}

function createTorqbar(type) {
  const mat = makeMat(type.body), accent = makeMat(type.accent), detail = makeMat(type.bearing)
  bodyMats.push(mat, accent, detail); emissiveParts.push(mat, accent)

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.12, 32), mat)
  hub.position.y = 0.1; hub.castShadow = true; spinnerGroup.add(hub)
  spinnerGroup.add(createBearing(type))

  const cfgs = [{ len: 3.0, w: 0.32, t: 0.11, wR: 0.42, angle: 0 }, { len: 2.0, w: 0.28, t: 0.1, wR: 0.36, angle: Math.PI }]

  cfgs.forEach(cfg => {
    const g = new THREE.Group()
    const arm = new THREE.Mesh(new THREE.BoxGeometry(cfg.len, cfg.t, cfg.w), mat)
    arm.position.set(cfg.len / 2 + 0.4, 0, 0); arm.castShadow = true; g.add(arm)

    const st = new THREE.Mesh(new THREE.BoxGeometry(cfg.len * 0.85, cfg.t + 0.005, cfg.w * 0.22), accent)
    st.position.set(cfg.len / 2 + 0.4, cfg.t / 2 + 0.002, 0); g.add(st)

    const w = new THREE.Mesh(new THREE.SphereGeometry(cfg.wR, 24, 24), mat)
    w.position.set(cfg.len + 0.4, 0, 0); w.castShadow = true; g.add(w)

    const wr = new THREE.Mesh(new THREE.TorusGeometry(cfg.wR + 0.01, 0.018, 8, 24), accent)
    wr.position.set(cfg.len + 0.4, 0, 0); wr.rotation.x = Math.PI / 2; g.add(wr)

    g.rotation.z = cfg.angle; spinnerGroup.add(g)
  })
}

function createHex(type) {
  const mat = makeMat(type.body), accent = makeMat(type.accent), detail = makeMat(type.bearing)
  bodyMats.push(mat, accent, detail); emissiveParts.push(mat, accent)

  spinnerGroup.add(createBearing(type))

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.08, 6), mat)
  hub.position.y = 0.1; hub.castShadow = true; spinnerGroup.add(hub)
  addDecoRing(spinnerGroup, 1.3, 0.025, type.accent.color, 0.1)

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2, g = new THREE.Group(), aL = 1.4, wR = 0.28

    const arm = new THREE.Mesh(new THREE.BoxGeometry(aL, 0.08, 0.2), i % 2 === 0 ? mat : accent)
    arm.position.set(aL / 2 + 1.0, 0, 0); arm.castShadow = true; g.add(arm)

    const w = new THREE.Mesh(new THREE.SphereGeometry(wR, 20, 20), mat)
    w.position.set(aL + 1.0, 0, 0); w.castShadow = true; g.add(w)

    const wr = new THREE.Mesh(new THREE.TorusGeometry(wR + 0.01, 0.015, 8, 20), accent)
    wr.position.set(aL + 1.0, 0, 0); wr.rotation.x = Math.PI / 2; g.add(wr)

    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), i % 2 === 0 ? accent : mat)
    dot.position.set(aL + 1.0, wR + 0.02, 0); g.add(dot)

    g.rotation.z = angle; spinnerGroup.add(g)
  }
  addDecoRing(spinnerGroup, 2.6, 0.02, type.accent.color, 0.08)
}

function createKong(type) {
  const mat = makeMat(type.body), accent = makeMat(type.accent), detail = makeMat(type.bearing)
  bodyMats.push(mat, accent, detail); emissiveParts.push(mat, accent)

  spinnerGroup.add(createBearing(type))

  const ringR = 2.0, ringTube = 0.45

  const ring = new THREE.Mesh(new THREE.TorusGeometry(ringR, ringTube, 20, 48), mat)
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.1; ring.castShadow = true; spinnerGroup.add(ring)

  const topR = new THREE.Mesh(new THREE.TorusGeometry(ringR, ringTube + 0.02, 8, 48), accent)
  topR.rotation.x = Math.PI / 2; topR.position.y = 0.1 + ringTube * 0.5; spinnerGroup.add(topR)

  const botR = topR.clone(); botR.position.y = 0.1 - ringTube * 0.5; spinnerGroup.add(botR)

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const hole = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 12, 20), detail)
    hole.position.set(Math.cos(a) * ringR, 0.1, Math.sin(a) * ringR); hole.rotation.x = Math.PI / 2; spinnerGroup.add(hole)

    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), accent)
    dot.position.set(Math.cos(a) * (ringR + 0.22), 0.1, Math.sin(a) * (ringR + 0.22)); spinnerGroup.add(dot)
  }

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 8
    spinnerGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(Math.cos(a) * 1.1, 0.1, Math.sin(a) * 1.1),
        new THREE.Vector3(Math.cos(a) * (ringR - ringTube * 0.4), 0.1, Math.sin(a) * (ringR - ringTube * 0.4))
      ]),
      new THREE.LineBasicMaterial({ color: type.accent.color, transparent: true, opacity: 0.35 })
    ))
  }
}

// ── Infinity: figure-8 tube loops ──

function createInfinity(type) {
  const mat = makeMat(type.body), accent = makeMat(type.accent), detail = makeMat(type.bearing), capM = makeMat(type.cap)
  bodyMats.push(mat, accent, detail, capM); emissiveParts.push(mat, accent, capM)

  spinnerGroup.add(createBearing(type))

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 32), mat)
  hub.position.y = 0.1; hub.castShadow = true; spinnerGroup.add(hub)

  // Two figure-8 loops
  for (let fig = 0; fig < 2; fig++) {
    const pts = []
    for (let j = 0; j <= 80; j++) {
      const t = (j / 80) * Math.PI * 2
      const r = 1.6 * (2 + Math.cos(2 * t))
      const x = r * Math.cos(t + fig * Math.PI) / 3
      const z = r * Math.sin(t) / 3
      pts.push(new THREE.Vector3(x, 0.1, z))
    }
    const curve = new THREE.CatmullRomCurve3(pts, true)
    const tubeMat = fig === 0 ? mat : accent
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 100, 0.08, 12, true), tubeMat)
    tube.castShadow = true; spinnerGroup.add(tube)

    // Thin accent line
    const thin = new THREE.Mesh(new THREE.TubeGeometry(curve, 100, 0.03, 8, true), fig === 0 ? accent : detail)
    thin.position.y = 0.03; spinnerGroup.add(thin)
  }

  // Center crossing ring
  addDecoRing(spinnerGroup, 0.3, 0.02, type.accent.color, 0.14)

  // Center dot
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), capM)
  dot.position.y = 0.16; spinnerGroup.add(dot)

  // Outer boundary ring
  addDecoRing(spinnerGroup, 2.0, 0.015, type.bearing.color, 0.08)
}

// ── Valkyrie: 3 stealth arms with angular design ──

function createValkyrie(type) {
  const mat = makeMat(type.body), accent = makeMat(type.accent), detail = makeMat(type.bearing), capM = makeMat(type.cap)
  bodyMats.push(mat, accent, detail, capM); emissiveParts.push(mat, accent, capM)

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.1, 48), mat)
  hub.position.y = 0.1; hub.castShadow = true; spinnerGroup.add(hub)
  spinnerGroup.add(createBearing(type))

  // Hub ring
  addDecoRing(spinnerGroup, 0.95, 0.02, type.accent.color, 0.12)

  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group(), aL = 2.4, aW = 0.3, aT = 0.09, wR = 0.35

    // Angular arm with sharp taper
    const aGeo = new THREE.BoxGeometry(aL, aT, aW)
    const p = aGeo.attributes.position
    for (let v = 0; v < p.count; v++) {
      const x = p.getX(v)
      const taper = 1.0 - (x / aL + 0.5) * 0.6
      p.setZ(v, p.getZ(v) * Math.max(taper, 0.3))
      p.setY(v, p.getY(v) * (1.0 - (x / aL + 0.5) * 0.3))
    }
    p.needsUpdate = true; aGeo.computeVertexNormals()
    const arm = new THREE.Mesh(aGeo, mat); arm.position.set(aL / 2 + 0.5, 0, 0); arm.castShadow = true; g.add(arm)

    // Blue LED accent stripe
    const st = new THREE.Mesh(new THREE.BoxGeometry(aL * 0.9, aT + 0.008, 0.03), accent)
    st.position.set(aL / 2 + 0.5, aT / 2 + 0.004, 0); g.add(st)

    // Bottom accent stripe
    const st2 = st.clone(); st2.position.y = -aT / 2 - 0.004; g.add(st2)

    // Angular weight (octahedron)
    const w = new THREE.Mesh(new THREE.OctahedronGeometry(wR, 0), mat)
    w.position.set(aL + 0.5, 0, 0); w.scale.set(1, 0.5, 0.8); w.castShadow = true; g.add(w)

    // Blue accent cap on weight
    const wCap = new THREE.Mesh(new THREE.OctahedronGeometry(wR * 0.4, 0), capM)
    wCap.position.set(aL + 0.5, wR * 0.3, 0); g.add(wCap)

    // Weight ring
    const wr = new THREE.Mesh(new THREE.TorusGeometry(wR * 0.7, 0.015, 8, 24), accent)
    wr.position.set(aL + 0.5, 0, 0); wr.rotation.x = Math.PI / 2; g.add(wr)

    // Mid-arm accent ring
    const mr = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 8, 16), accent)
    mr.position.set(aL * 0.5 + 0.5, 0, 0); mr.rotation.x = Math.PI / 2; g.add(mr)

    g.rotation.z = (i / 3) * Math.PI * 2; spinnerGroup.add(g)
  }
}

// ── Ninja Star: 4 sharp points with beveled edges ──

function createNinjaStar(type) {
  const mat = makeMat(type.body), accent = makeMat(type.accent), detail = makeMat(type.bearing), capM = makeMat(type.cap)
  bodyMats.push(mat, accent, detail, capM); emissiveParts.push(mat, accent)

  spinnerGroup.add(createBearing(type))

  for (let i = 0; i < 4; i++) {
    const g = new THREE.Group()
    const angle = (i / 4) * Math.PI * 2

    // Main point (sharp tapered triangle)
    const pGeo = new THREE.BoxGeometry(2.5, 0.08, 0.5)
    const p = pGeo.attributes.position
    for (let v = 0; v < p.count; v++) {
      const x = p.getX(v)
      const taper = Math.max(1.0 - (x / 2.5 + 0.5) * 0.85, 0.1)
      p.setZ(v, p.getZ(v) * taper)
    }
    p.needsUpdate = true; pGeo.computeVertexNormals()
    const point = new THREE.Mesh(pGeo, mat)
    point.position.set(1.2, 0, 0); point.castShadow = true; g.add(point)

    // Accent stripe along point
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.01, 0.08), accent)
    stripe.position.set(1.2, 0.045, 0); g.add(stripe)

    // Red tip
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), accent)
    tip.position.set(2.5, 0, 0); g.add(tip)

    // Hub ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 16), detail)
    ring.position.set(0.5, 0, 0); ring.rotation.x = Math.PI / 2; g.add(ring)

    g.rotation.z = angle; spinnerGroup.add(g)
  }

  // Center cap
  const centerCap = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.12, 32), capM)
  centerCap.position.y = 0.08; centerCap.castShadow = true; spinnerGroup.add(centerCap)
}

// ── Double Decker: two stacked tiers ──

function createDoubleDecker(type) {
  const mat = makeMat(type.body), accent = makeMat(type.accent), detail = makeMat(type.bearing), capM = makeMat(type.cap)
  bodyMats.push(mat, accent, detail, capM); emissiveParts.push(mat, accent, capM)

  spinnerGroup.add(createBearing(type))

  // Two tier levels
  for (let tier = 0; tier < 2; tier++) {
    const yOff = tier === 0 ? 0.05 : -0.25
    const sc = tier === 0 ? 1.0 : 0.8

    // Hub disc per tier
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.9 * sc, 0.9 * sc, 0.06, 32), tier === 0 ? mat : accent)
    hub.position.y = yOff; hub.castShadow = true; spinnerGroup.add(hub)

    // Arms per tier
    for (let i = 0; i < 3; i++) {
      const g = new THREE.Group()
      const aL = 2.0 * sc, aW = 0.28 * sc, wR = 0.35 * sc

      const arm = new THREE.Mesh(new THREE.BoxGeometry(aL, 0.06, aW), tier === 0 ? mat : accent)
      arm.position.set(aL / 2 + 0.5, 0, 0); arm.castShadow = true; g.add(arm)

      const w = new THREE.Mesh(new THREE.CylinderGeometry(wR, wR, 0.15, 20), detail)
      w.position.set(aL + 0.5, 0, 0); w.castShadow = true; g.add(w)

      const wr = new THREE.Mesh(new THREE.TorusGeometry(wR + 0.01, 0.015, 8, 20), accent)
      wr.position.set(aL + 0.5, 0, 0); wr.rotation.x = Math.PI / 2; g.add(wr)

      g.position.y = yOff
      g.rotation.z = (i / 3) * Math.PI * 2 + (tier * Math.PI / 3)
      spinnerGroup.add(g)
    }

    // Tier ring
    addDecoRing(spinnerGroup, 1.2 * sc, 0.015, tier === 0 ? type.accent.color : type.bearing.color, yOff)
  }

  // Gold cap
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 24), capM)
  cap.position.y = 0.12; spinnerGroup.add(cap)
}

// ── Compass: cardinal direction points with needle ──

function createCompass(type) {
  const mat = makeMat(type.body), accent = makeMat(type.accent), detail = makeMat(type.bearing), capM = makeMat(type.cap)
  bodyMats.push(mat, accent, detail, capM); emissiveParts.push(mat, accent, capM)

  spinnerGroup.add(createBearing(type))

  // Outer ring
  addDecoRing(spinnerGroup, 2.2, 0.04, type.body.color, 0.08)
  addDecoRing(spinnerGroup, 2.0, 0.02, type.accent.color, 0.1)

  // 4 cardinal points
  for (let i = 0; i < 4; i++) {
    const g = new THREE.Group()
    const isMain = i % 2 === 0 // N/S are bigger
    const aL = isMain ? 2.0 : 1.4
    const aW = isMain ? 0.35 : 0.25

    // Point (tapered)
    const pGeo = new THREE.BoxGeometry(aL, 0.07, aW)
    const p = pGeo.attributes.position
    for (let v = 0; v < p.count; v++) {
      const x = p.getX(v)
      const taper = Math.max(1.0 - (x / aL + 0.5) * 0.7, 0.15)
      p.setZ(v, p.getZ(v) * taper)
    }
    p.needsUpdate = true; pGeo.computeVertexNormals()
    const point = new THREE.Mesh(pGeo, isMain ? accent : mat)
    point.position.set(aL / 2 + 0.6, 0, 0); point.castShadow = true; g.add(point)

    // Tip diamond
    const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), isMain ? capM : detail)
    tip.position.set(aL + 0.6, 0, 0); tip.scale.set(1, 0.5, 1); g.add(tip)

    // Ring at base
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.015, 8, 16), detail)
    ring.position.set(0.6, 0, 0); ring.rotation.x = Math.PI / 2; g.add(ring)

    g.rotation.z = (i / 4) * Math.PI * 2; spinnerGroup.add(g)
  }

  // Inner rings
  addDecoRing(spinnerGroup, 0.8, 0.02, type.bearing.color, 0.1)
  addDecoRing(spinnerGroup, 0.5, 0.015, type.accent.color, 0.12)

  // Center needle (N-S)
  const needle = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), accent)
  needle.position.y = 0.15; needle.scale.set(0.5, 1.5, 0.3); spinnerGroup.add(needle)
}

// ── Gear: mechanical gear hub with teeth ──

function createGear(type) {
  const mat = makeMat(type.body), accent = makeMat(type.accent), detail = makeMat(type.bearing), capM = makeMat(type.cap)
  bodyMats.push(mat, accent, detail, capM); emissiveParts.push(mat, accent, capM)

  spinnerGroup.add(createBearing(type))

  const teeth = 16
  const gearR = 1.8
  const toothH = 0.25

  // Gear body ring
  const gearBody = new THREE.Mesh(new THREE.TorusGeometry(gearR, 0.3, 12, 48), mat)
  gearBody.rotation.x = Math.PI / 2; gearBody.position.y = 0.1; gearBody.castShadow = true
  spinnerGroup.add(gearBody)

  // Gear teeth
  for (let i = 0; i < teeth; i++) {
    const angle = (i / teeth) * Math.PI * 2
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, toothH), i % 2 === 0 ? mat : accent)
    tooth.position.set(
      Math.cos(angle) * (gearR + toothH * 0.4),
      0.1,
      Math.sin(angle) * (gearR + toothH * 0.4)
    )
    tooth.rotation.y = -angle
    tooth.castShadow = true
    spinnerGroup.add(tooth)
  }

  // Inner gear ring (smaller)
  const innerTeeth = 10
  const innerR = 1.0
  for (let i = 0; i < innerTeeth; i++) {
    const angle = (i / innerTeeth) * Math.PI * 2 + Math.PI / innerTeeth
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, 0.18), detail)
    tooth.position.set(Math.cos(angle) * (innerR + 0.08), 0.1, Math.sin(angle) * (innerR + 0.08))
    tooth.rotation.y = -angle
    spinnerGroup.add(tooth)
  }

  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(innerR, 0.15, 10, 32), accent)
  innerRing.rotation.x = Math.PI / 2; innerRing.position.y = 0.1; spinnerGroup.add(innerRing)

  // Spokes connecting inner to outer
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    spinnerGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(Math.cos(a) * 0.85, 0.1, Math.sin(a) * 0.85),
        new THREE.Vector3(Math.cos(a) * 1.5, 0.1, Math.sin(a) * 1.5)
      ]),
      new THREE.LineBasicMaterial({ color: type.bearing.color, transparent: true, opacity: 0.4 })
    ))
  }

  // Center dot
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), capM)
  dot.position.y = 0.15; spinnerGroup.add(dot)
}

// ── Skull: 3 arms with skull-themed hub ──

function createSkull(type) {
  const mat = makeMat(type.body), accent = makeMat(type.accent), detail = makeMat(type.bearing), capM = makeMat(type.cap)
  bodyMats.push(mat, accent, detail, capM); emissiveParts.push(mat, accent)

  // Large skull-like hub
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.8, 24, 24), mat)
  hub.position.y = 0.15; hub.scale.set(1, 0.8, 1); hub.castShadow = true; spinnerGroup.add(hub)

  // Eye sockets (dark spheres)
  for (let side = -1; side <= 1; side += 2) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), accent)
    eye.position.set(side * 0.25, 0.25, 0.55); spinnerGroup.add(eye)

    // Eye glow
    const eyeGlow = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), makeMat({ color: 0xff2200, metalness: 0.5, roughness: 0.3, emissive: 0xff2200, emissiveIntensity: 0.8 }))
    eyeGlow.position.set(side * 0.25, 0.25, 0.62); spinnerGroup.add(eyeGlow)
    bodyMats.push(eyeGlow.material); emissiveParts.push(eyeGlow.material)
  }

  // Jaw line
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.3), detail)
  jaw.position.set(0, 0.02, 0.55); spinnerGroup.add(jaw)

  spinnerGroup.add(createBearing(type))

  // 3 bone-like arms
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group(), aL = 2.2, wR = 0.3

    // Bone arm (cylinder with bulges)
    const segments = 5
    for (let s = 0; s < segments; s++) {
      const t = s / (segments - 1)
      const r = 0.06 + Math.sin(t * Math.PI) * 0.05
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(r, r, aL / segments, 8), mat)
      seg.position.set(t * aL + 0.8, 0, 0); seg.rotation.z = Math.PI / 2; seg.castShadow = true; g.add(seg)
    }

    // Knobby end
    const knob = new THREE.Mesh(new THREE.SphereGeometry(wR, 20, 20), mat)
    knob.position.set(aL + 0.8, 0, 0); knob.scale.set(0.8, 1, 0.6); knob.castShadow = true; g.add(knob)

    // Dark ring on knob
    const wr = new THREE.Mesh(new THREE.TorusGeometry(wR * 0.6, 0.018, 8, 20), accent)
    wr.position.set(aL + 0.8, 0, 0); wr.rotation.x = Math.PI / 2; g.add(wr)

    // Cross detail on knob
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.01, wR * 0.8), accent)
    cross.position.set(aL + 0.8, wR * 0.3, 0); g.add(cross)
    const cross2 = new THREE.Mesh(new THREE.BoxGeometry(wR * 0.8, 0.01, 0.02), accent)
    cross2.position.set(aL + 0.8, wR * 0.3, 0); g.add(cross2)

    g.rotation.z = (i / 3) * Math.PI * 2; spinnerGroup.add(g)
  }
}

// ── Pokeball: 3-arm spinner with independently spinning Pokeballs ──

function createPokeball(type) {
  const mat = makeMat(type.body), accent = makeMat(type.accent), detail = makeMat(type.bearing), capM = makeMat(type.cap)
  bodyMats.push(mat, accent, detail, capM); emissiveParts.push(mat, accent)

  // Central hub
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.1, 32), mat)
  hub.position.y = 0.1; hub.castShadow = true; spinnerGroup.add(hub)
  addDecoRing(spinnerGroup, 0.7, 0.02, type.accent.color, 0.12)
  spinnerGroup.add(createBearing(type))

  // 3 arms with Pokeballs
  pokeballSpinners = []
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group()
    const angle = (i / 3) * Math.PI * 2
    const aL = 2.2, aW = 0.18, aT = 0.08

    // Arm
    const arm = new THREE.Mesh(new THREE.BoxGeometry(aL, aT, aW), mat)
    arm.position.set(aL / 2 + 0.55, 0, 0); arm.castShadow = true; g.add(arm)

    // Accent stripe on arm
    const st = new THREE.Mesh(new THREE.BoxGeometry(aL * 0.9, aT + 0.006, 0.025), accent)
    st.position.set(aL / 2 + 0.55, aT / 2 + 0.003, 0); g.add(st)

    // Pokeball group (will rotate independently)
    const pbGroup = new THREE.Group()
    const pbR = 0.38

    // Bottom white hemisphere
    const pbBot = new THREE.Mesh(
      new THREE.SphereGeometry(pbR, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      makeMat({ color: 0xf0f0f0, metalness: 0.3, roughness: 0.35 })
    )
    pbBot.position.y = -0.02; pbBot.castShadow = true; pbGroup.add(pbBot)

    // Top red hemisphere
    const pbTop = new THREE.Mesh(
      new THREE.SphereGeometry(pbR, 20, 12, 0, Math.PI * 2, -Math.PI / 2, Math.PI / 2),
      makeMat({ color: 0xdd2222, metalness: 0.75, roughness: 0.12, emissive: 0x330000, emissiveIntensity: 0.04 })
    )
    pbTop.position.y = -0.02; pbTop.castShadow = true; pbGroup.add(pbTop)
    bodyMats.push(pbTop.material); emissiveParts.push(pbTop.material)

    // Black band (torus)
    const pbBand = new THREE.Mesh(
      new THREE.TorusGeometry(pbR, 0.025, 8, 24),
      makeMat({ color: 0x1a1a1a, metalness: 0.4, roughness: 0.5 })
    )
    pbBand.rotation.x = Math.PI / 2; pbBand.position.y = -0.02; pbGroup.add(pbBand)

    // Center button (dark outer ring + white inner)
    const btnOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 16), accent)
    btnOuter.position.y = -0.02; pbGroup.add(btnOuter)

    const btnInner = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), capM)
    btnInner.position.y = -0.02; pbGroup.add(btnInner)

    // Position Pokeball at end of arm
    pbGroup.position.set(aL + 0.55, 0, 0)
    pbGroup.rotation.x = Math.PI / 2

    // Track for independent rotation
    pokeballSpinners.push({ group: pbGroup, speed: 0, inertia: 0.7 + Math.random() * 0.3 })

    g.add(pbGroup)
    g.rotation.z = angle; spinnerGroup.add(g)
  }
}

// ══════════════════════════════════════════
// ── GENERATION ──
// ══════════════════════════════════════════

const GENERATORS = [createClassic, createTri, createBar, createTorqbar, createHex, createKong, createInfinity, createValkyrie, createNinjaStar, createDoubleDecker, createCompass, createGear, createSkull, createPokeball]

function createSpinner() {
  clearSpinner()
  GENERATORS[currentTypeIdx](SPINNER_TYPES[currentTypeIdx])
  const type = SPINNER_TYPES[currentTypeIdx]
  ground.material.color.setHex(isDarkTheme ? type.floor.dark : type.floor.light)
}

// ══════════════════════════════════════════
// ── SPEED LINES ──
// ══════════════════════════════════════════

const speedLines = new THREE.Group()
scene.add(speedLines)

for (let i = 0; i < 5; i++) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.2 + i * 0.7, 0.006, 6, 64),
    new THREE.MeshBasicMaterial({ color: 0x8ab0d0, transparent: true, opacity: 0, depthWrite: false })
  )
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.02
  speedLines.add(ring)
}

// ══════════════════════════════════════════
// ── PARTICLES ──
// ══════════════════════════════════════════

const PARTICLE_COUNT = 200
const pPos = new Float32Array(PARTICLE_COUNT * 3)
const pAngles = new Float32Array(PARTICLE_COUNT)
const pRadii = new Float32Array(PARTICLE_COUNT)

for (let i = 0; i < PARTICLE_COUNT; i++) {
  pAngles[i] = Math.random() * Math.PI * 2
  pRadii[i] = 2 + Math.random() * 6
  pPos[i * 3] = Math.cos(pAngles[i]) * pRadii[i]
  pPos[i * 3 + 1] = (Math.random() - 0.5) * 2
  pPos[i * 3 + 2] = Math.sin(pAngles[i]) * pRadii[i]
}

const pGeo = new THREE.BufferGeometry()
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
const pMat = new THREE.PointsMaterial({
  color: 0xa8c0d8, size: 0.05, transparent: true, opacity: 0,
  blending: THREE.AdditiveBlending, sizeAttenuation: true, depthWrite: false
})
scene.add(new THREE.Points(pGeo, pMat))

// ══════════════════════════════════════════
// ── AUDIO (unchanged from previous) ──
// ══════════════════════════════════════════

function initAudio() {
  if (audioCtx) return
  audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  masterGain = audioCtx.createGain(); masterGain.gain.value = 0; masterGain.connect(audioCtx.destination)
  bowlOscs = []; bowlGains = []
  for (let i = 0; i < 4; i++) {
    const osc = audioCtx.createOscillator(); osc.type = 'sine'; osc.frequency.value = SPINNER_TYPES[currentTypeIdx].chord[i]
    const gain = audioCtx.createGain(); gain.gain.value = 0
    osc.connect(gain); gain.connect(masterGain); osc.start()
    bowlOscs.push(osc); bowlGains.push(gain)
  }
  const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate)
  const out = buf.getChannelData(0); for (let i = 0; i < out.length; i++) out[i] = Math.random() * 2 - 1
  windNode = audioCtx.createBufferSource(); windNode.buffer = buf; windNode.loop = true
  windFilter = audioCtx.createBiquadFilter(); windFilter.type = 'bandpass'; windFilter.frequency.value = 600; windFilter.Q.value = 0.3
  windGain = audioCtx.createGain(); windGain.gain.value = 0
  windNode.connect(windFilter); windFilter.connect(windGain); windGain.connect(masterGain); windNode.start()
}

function updateChordFrequencies() {
  if (!audioCtx) return
  const chord = SPINNER_TYPES[currentTypeIdx].chord
  for (let i = 0; i < bowlOscs.length; i++) bowlOscs[i].frequency.setTargetAtTime(chord[i], audioCtx.currentTime, 0.3)
}

function updateAudio(speed) {
  if (!audioCtx || !soundEnabled) return
  const t = audioCtx.currentTime, n = Math.abs(speed) / MAX_SPEED
  masterGain.gain.setTargetAtTime(n * 0.18, t, 0.1)
    ;[0.5, 0.25, 0.15, 0.08].forEach((v, i) => bowlGains[i].gain.setTargetAtTime(v, t, 0.15))
  windGain.gain.setTargetAtTime(n * 0.06, t, 0.1)
  windFilter.frequency.setTargetAtTime(400 + n * 800, t, 0.1)
  const now = performance.now()
  if (n > 0.15 && now - lastChimeTime > 2000 + Math.random() * 3000) { lastChimeTime = now; triggerChime(n) }
}

function triggerChime(sn) {
  if (!audioCtx || !soundEnabled) return
  const freq = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50][Math.floor(Math.random() * 6)]
  const osc = audioCtx.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq
  const gain = audioCtx.createGain(); const t = audioCtx.currentTime
  gain.gain.setValueAtTime(sn * 0.04, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 2.5)
  osc.connect(gain); gain.connect(masterGain); osc.start(t); osc.stop(t + 2.5)
}

function toggleSound() {
  soundEnabled = !soundEnabled
  if (soundEnabled) { initAudio(); if (audioCtx.state === 'suspended') audioCtx.resume(); updateChordFrequencies() }
  else if (audioCtx) masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1)
  updateSoundButton()
}

// ═══════════════════════════════════════════
// ── INTERACTION (with mobile flick support) ──
// ═══════════════════════════════════════════

const raycaster = new THREE.Raycaster()
const spinPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const intersection = new THREE.Vector3()

// Mobile flick tracking
const POINTER_HISTORY_SIZE = 8
let pointerHistory = []

function onPointerDown(event) {
  // Only respond to left button (pointerType !== 'mouse' or button === 0)
  if (event.target.tagName !== 'CANVAS') return
  if (event.button && event.button !== 0) return

  pointerHistory = []
  pointerHistory.push({ x: event.clientX, y: event.clientY, time: performance.now() })

  isDraggingSpinner = true
  dragStartPos = { x: event.clientX, y: event.clientY }
  dragStartTime = performance.now()
  controls.enabled = false
  raycaster.setFromCamera(new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  ), camera)
  if (raycaster.intersectObject(spinnerGroup, true).length > 0) {
    raycaster.ray.intersectPlane(spinPlane, intersection)
    lastAngle = Math.atan2(intersection.z, intersection.x)
    renderer.domElement.style.cursor = 'grabbing'
  }
}

function onPointerMove(event) {
  if (!isDraggingSpinner) {
    raycaster.setFromCamera(new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    ), camera)
    renderer.domElement.style.cursor = raycaster.intersectObject(spinnerGroup, true).length > 0 ? 'grab' : 'default'
    return
  }

  // Track pointer for flick velocity
  pointerHistory.push({ x: event.clientX, y: event.clientY, time: performance.now() })
  if (pointerHistory.length > POINTER_HISTORY_SIZE) {
    pointerHistory.shift()
  }

  raycaster.setFromCamera(new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  ), camera)
  raycaster.ray.intersectPlane(spinPlane, intersection)
  let delta = Math.atan2(intersection.z, intersection.x) - lastAngle
  if (delta > Math.PI) delta -= Math.PI * 2
  if (delta < -Math.PI) delta += Math.PI * 2

  // Higher velocity on mobile for natural feel
  const isTouch = event.pointerType === 'touch'
  const torqueMultiplier = isTouch ? TORQUE_SCALE * 1.5 : TORQUE_SCALE
  angularVelocity += delta * torqueMultiplier
  angularVelocity = THREE.MathUtils.clamp(angularVelocity, -MAX_SPEED, MAX_SPEED)
  lastAngle = Math.atan2(intersection.z, intersection.x)
}

function onPointerUp(event) {
  if (!isDraggingSpinner) return
  isDraggingSpinner = false
  controls.enabled = true
  renderer.domElement.style.cursor = 'default'

  const isTouch = event.pointerType === 'touch'
  const dist = Math.sqrt((event.clientX - dragStartPos.x) ** 2 + (event.clientY - dragStartPos.y) ** 2)
  const elapsed = performance.now() - dragStartTime

  // Flick detection: calculate velocity from pointer history
  if (pointerHistory.length >= 2) {
    const last = pointerHistory[pointerHistory.length - 1]
    const first = pointerHistory[0]
    const dx = last.x - first.x
    const dt = last.time - first.time
    if (dt > 0) {
      const velocity = dx / dt // pixels per ms
      // Apply flick as angular velocity (tuned for mobile feel)
      const flickForce = isTouch ? velocity * 0.8 : velocity * 0.5
      angularVelocity = THREE.MathUtils.clamp(angularVelocity + flickForce, -MAX_SPEED, MAX_SPEED)
    }
  }

  // Tap (quick click) boost - works on both desktop and mobile
  if (dist < 15 && elapsed < 250) {
    angularVelocity += SPACE_BOOST * (Math.random() > 0.5 ? 1 : -1)
    angularVelocity = THREE.MathUtils.clamp(angularVelocity, -MAX_SPEED, MAX_SPEED)
  }
}

renderer.domElement.addEventListener('pointerdown', onPointerDown)
window.addEventListener('pointermove', onPointerMove)
window.addEventListener('pointerup', onPointerUp)
renderer.domElement.style.touchAction = 'none'

// ══════════════════════════════════════════
// ── KEYBOARD ──
// ══════════════════════════════════════════

function onKeyDown(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
  switch (e.code) {
    case 'Space':
      e.preventDefault()
      if (Math.abs(angularVelocity) < 0.5) angularVelocity = SPACE_BOOST * (Math.random() > 0.5 ? 1 : -1)
      else angularVelocity += SPACE_BOOST * (angularVelocity >= 0 ? 1 : -1)
      angularVelocity = THREE.MathUtils.clamp(angularVelocity, -MAX_SPEED, MAX_SPEED)
      break
    case 'KeyS': case 'Escape': e.preventDefault(); angularVelocity = 0; break
    case 'ArrowRight': e.preventDefault(); selectType((currentTypeIdx + 1) % SPINNER_TYPES.length); break
    case 'ArrowLeft': e.preventDefault(); selectType((currentTypeIdx - 1 + SPINNER_TYPES.length) % SPINNER_TYPES.length); break
  }
}
window.addEventListener('keydown', onKeyDown)

// ══════════════════════════════════════════
// ── UI ──
// ══════════════════════════════════════════

let rpmEl, timerEl, maxSpinEl, totalSpinsEl, soundBtn, themeBtn, typeNameEl, typeDescEl
let uiStyleEl = null
let carouselRing = null
let carouselAngle = 0
let carouselDragging = false
let carouselLastX = 0
let carouselVelocity = 0

const CAROUSEL_ITEM_WIDTH = 86

function getCarouselRadius() {
  const n = SPINNER_TYPES.length
  return Math.max(250, n * CAROUSEL_ITEM_WIDTH / (2 * Math.PI))
}

function selectType(idx) {
  currentTypeIdx = idx
  createSpinner()
  updateChordFrequencies()
  typeNameEl.textContent = SPINNER_TYPES[idx].name
  typeDescEl.textContent = SPINNER_TYPES[idx].desc
  // Snap carousel to this type
  const step = 360 / SPINNER_TYPES.length
  carouselAngle = -idx * step
  updateCarousel()
}

function updateCarousel() {
  if (!carouselRing) return
  const n = SPINNER_TYPES.length
  const step = 360 / n
  const radius = getCarouselRadius()

  carouselRing.style.transform = `translateZ(-${radius}px) rotateY(${carouselAngle}deg)`

  // Update active states
  const cards = carouselRing.querySelectorAll('.carousel-card')
  // Normalize angle to find nearest
  let normAngle = (((-carouselAngle % 360) + 360) % 360)
  const activeIdx = Math.round(normAngle / step) % n

  cards.forEach((card, i) => {
    card.classList.toggle('active', i === activeIdx)
  })

  // Update type info
  if (activeIdx !== currentTypeIdx) {
    currentTypeIdx = activeIdx
    createSpinner()
    updateChordFrequencies()
    typeNameEl.textContent = SPINNER_TYPES[activeIdx].name
    typeDescEl.textContent = SPINNER_TYPES[activeIdx].desc
  }
}

function createUI() {
  uiStyleEl = document.createElement('style')
  document.head.appendChild(uiStyleEl)
  applyUIThemeStyles()

  // RPM
  const rpmPanel = document.createElement('div')
  rpmPanel.id = 'rpm-display'; rpmPanel.className = 'hud-panel'
  rpmEl = document.createElement('div'); rpmEl.id = 'rpm-value'; rpmEl.textContent = '0'
  rpmPanel.appendChild(rpmEl)
  const rpmLabel = document.createElement('div'); rpmLabel.id = 'rpm-label'; rpmLabel.textContent = 'RPM'
  rpmPanel.appendChild(rpmLabel)
  document.body.appendChild(rpmPanel)

  // Stats
  const statsEl = document.createElement('div')
  statsEl.id = 'stats-display'; statsEl.className = 'hud-panel'
  function addStatRow(label, init) {
    const row = document.createElement('div'); row.className = 'stat-row'
    const lbl = document.createElement('span'); lbl.className = 'stat-label'; lbl.textContent = label; row.appendChild(lbl)
    const val = document.createElement('span'); val.className = 'stat-value'; val.textContent = init; row.appendChild(val)
    statsEl.appendChild(row); return val
  }
  timerEl = addStatRow('Spin Time', '0.0s')
  maxSpinEl = addStatRow('Best Spin', longestSpin.toFixed(1) + 's')
  totalSpinsEl = addStatRow('Total Spins', String(totalSpins))
  document.body.appendChild(statsEl)

  // Type info
  const typeInfo = document.createElement('div'); typeInfo.id = 'type-info'
  typeNameEl = document.createElement('div'); typeNameEl.id = 'type-name'; typeNameEl.textContent = SPINNER_TYPES[0].name
  typeInfo.appendChild(typeNameEl)
  typeDescEl = document.createElement('div'); typeDescEl.id = 'type-desc'; typeDescEl.textContent = SPINNER_TYPES[0].desc
  typeInfo.appendChild(typeDescEl)
  document.body.appendChild(typeInfo)

  // ── 3D Carousel Ring ──
  const n = SPINNER_TYPES.length
  const step = 360 / n
  const radius = getCarouselRadius()

  const viewport = document.createElement('div')
  viewport.id = 'carousel-viewport'

  carouselRing = document.createElement('div')
  carouselRing.id = 'carousel-ring'
  carouselRing.style.transform = `translateZ(-${radius}px)`

  SPINNER_TYPES.forEach((type, idx) => {
    const card = document.createElement('div')
    card.className = 'carousel-card' + (idx === 0 ? ' active' : '')
    card.style.transform = `rotateY(${idx * step}deg) translateZ(${radius}px)`
    card.innerHTML = `<span class="card-emoji">${type.emoji}</span><span class="card-label">${type.name}</span>`
    card.addEventListener('click', () => selectType(idx))
    carouselRing.appendChild(card)
  })

  viewport.appendChild(carouselRing)
  document.body.appendChild(viewport)

  // Carousel drag interaction
  viewport.addEventListener('pointerdown', e => {
    carouselDragging = true
    carouselLastX = e.clientX
    carouselVelocity = 0
    viewport.style.cursor = 'grabbing'
    e.preventDefault()
  })

  window.addEventListener('pointermove', e => {
    if (!carouselDragging) return
    const dx = e.clientX - carouselLastX
    carouselVelocity = dx * 0.4
    carouselAngle += dx * 0.4
    carouselLastX = e.clientX
    updateCarousel()
  })

  window.addEventListener('pointerup', () => {
    if (!carouselDragging) return
    carouselDragging = false
    viewport.style.cursor = ''
    // Snap to nearest type
    const step2 = 360 / SPINNER_TYPES.length
    const nearest = Math.round(-carouselAngle / step2)
    carouselAngle = -nearest * step2
    updateCarousel()
  })

  // Action bar
  const action = document.createElement('div'); action.id = 'action-bar'; action.className = 'hud-panel'

  const spinBtn = document.createElement('button'); spinBtn.className = 'hud-btn'; spinBtn.textContent = 'Spin'
  spinBtn.addEventListener('click', () => {
    angularVelocity += SPACE_BOOST * (Math.random() > 0.5 ? 1 : -1)
    angularVelocity = THREE.MathUtils.clamp(angularVelocity, -MAX_SPEED, MAX_SPEED)
  })
  action.appendChild(spinBtn)

  const stopBtn = document.createElement('button'); stopBtn.className = 'hud-btn'; stopBtn.textContent = 'Stop'
  stopBtn.addEventListener('click', () => { angularVelocity = 0 })
  action.appendChild(stopBtn)

  const divH = document.createElement('div'); divH.className = 'divider-h'; action.appendChild(divH)

  themeBtn = document.createElement('button'); themeBtn.className = 'hud-btn-sm'
   themeBtn.textContent = isDarkTheme ? '\u{1F31E} Light' : '\u{1F319} Dark'; themeBtn.id = 'theme-toggle'
   themeBtn.addEventListener('click', () => {
     console.log('Theme toggle clicked, current isDarkTheme:', isDarkTheme)
     const newTheme = isDarkTheme ? 'light' : 'dark'
     console.log('Calling applyTheme with:', newTheme)
     applyTheme(newTheme)
     console.log('After applyTheme, isDarkTheme:', isDarkTheme)
     themeBtn.textContent = isDarkTheme ? '\u{1F31E} Light' : '\u{1F319} Dark'
   })
  action.appendChild(themeBtn)

  soundBtn = document.createElement('button'); soundBtn.className = 'hud-btn-sm'; soundBtn.textContent = '\u{1F3B6} Sound Off'
  soundBtn.addEventListener('click', toggleSound)
  action.appendChild(soundBtn)

  const resetBtn = document.createElement('button'); resetBtn.className = 'hud-btn-sm'; resetBtn.textContent = 'Reset Stats'
  resetBtn.addEventListener('click', () => {
    longestSpin = 0; totalSpins = 0
    localStorage.setItem('fidgetMaxSpin', '0'); localStorage.setItem('fidgetTotalSpins', '0')
    maxSpinEl.textContent = '0.0s'; totalSpinsEl.textContent = '0'
  })
  action.appendChild(resetBtn)

  document.body.appendChild(action)

  // Hint
  const hint = document.createElement('div'); hint.id = 'hint-text'
  hint.textContent = 'Space: spin \u00b7 S: stop \u00b7 \u2190\u2192: type \u00b7 Drag spinner to flick \u00b7 Drag ring to browse'
  document.body.appendChild(hint)
}

function applyUIThemeStyles() {
   const t = isDarkTheme ? THEMES.dark : THEMES.light
   // Add mobile-specific CSS for better touch feedback
   const mobileMediaQuery = `@media (pointer: coarse) {
     .hud-btn, .hud-btn-sm { padding: 14px 24px; font-size: 14px; }
     .hud-btn-sm { padding: 10px 18px; min-width: 44px; min-height: 44px; }
     #hint-text { display: none; }
     #action-bar { gap: 12px; }
     #rpm-value { font-size: 42px; }
   }`
   const isMobile = /Mobi|Android/i.test(navigator.userAgent)
   const touchStyles = `
     /* Touch feedback */
     .hud-btn, .hud-btn-sm {
       -webkit-tap-highlight-color: transparent;
       touch-action: manipulation;
       user-select: none;
       -webkit-user-drag: none;
     }
     .hud-btn:active, .hud-btn-sm:active {
       background: ${t.btnHover};
       transform: scale(0.97);
     }
   `
   uiStyleEl.textContent = `
     #ui-root { position: fixed; inset: 0; pointer-events: none; z-index: 100; }
     .hud-panel {
       position: fixed; pointer-events: auto;
       background: ${t.panelBg}; backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
       border: 1px solid ${t.panelBorder}; border-radius: 22px; color: ${t.textPrimary};
       font-family: 'Inter', system-ui, sans-serif; box-shadow: ${t.panelShadow};
     }
     .hud-btn {
       background: ${t.btnBg}; border: 1px solid ${t.btnBorder}; color: ${t.btnText};
       padding: 10px 20px; border-radius: 14px; font-family: 'Inter', system-ui, sans-serif;
       font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.25s ease;
       ${touchStyles}
     }
     .hud-btn:hover { background: ${t.btnHover}; transform: translateY(-1px); }
     .hud-btn:active { transform: translateY(0); }
     .hud-btn-sm {
       background: ${t.btnBg}; border: 1px solid ${t.btnBorder}; color: ${t.textSecondary};
       padding: 7px 14px; border-radius: 10px; font-family: 'Inter', system-ui, sans-serif;
       font-size: 11px; font-weight: 500; cursor: pointer; transition: all 0.25s ease;
       ${touchStyles}
     }
     .hud-btn-sm:hover { background: ${t.btnHover}; }
     .hud-btn-active { border-color: rgba(80,140,200,0.4); color: ${t.textPrimary}; }
     #rpm-display { position: fixed; top: 28px; left: 28px; padding: 22px 30px; }
     #rpm-value {
       font-family: 'JetBrains Mono', monospace; font-size: 52px; font-weight: 600;
       line-height: 1; color: ${t.textPrimary}; letter-spacing: -2px; transition: color 0.5s;
     }
     #rpm-label { font-size: 10px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: ${t.textMuted}; margin-top: 6px; }
     #stats-display { position: fixed; top: 28px; right: 28px; padding: 18px 24px; min-width: 170px; }
     .stat-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid ${t.dividerColor}; }
     .stat-row:last-child { border-bottom: none; }
     .stat-label { font-size: 10px; font-weight: 500; letter-spacing: 0.5px; color: ${t.textMuted}; text-transform: uppercase; }
     .stat-value { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 500; color: ${t.textPrimary}; }
     #type-info { position: fixed; bottom: 200px; left: 50%; transform: translateX(-50%); text-align: center; pointer-events: none; z-index: 110; }
     #type-name { font-size: 18px; font-weight: 600; color: ${t.textPrimary}; letter-spacing: 4px; text-transform: uppercase; }
     #type-desc { font-size: 11px; color: ${t.textSecondary}; letter-spacing: 1px; margin-top: 4px; }
     #action-bar { position: fixed; right: 28px; bottom: 28px; display: flex; flex-direction: column; gap: 8px; padding: 14px; }
     #hint-text {
       position: fixed; top: 105px; left: 50%; transform: translateX(-50%);
       font-size: 11px; letter-spacing: 1px; color: ${t.textPrimary};
       background: ${t.panelBg}; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
       border: 1px solid ${t.panelBorder}; border-radius: 12px;
       padding: 8px 20px; pointer-events: none; white-space: nowrap; font-weight: 500;
       z-index: 110; opacity: 0.8; box-shadow: ${t.panelShadow};
     }
      .divider-h { height: 1px; width: 100%; background: ${t.dividerColor}; }
      /* Mobile-specific enhancements */
      ${mobileMediaQuery}

      /* 3D Carousel Ring */
      #carousel-viewport {
        position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
        width: ${CAROUSEL_ITEM_WIDTH + 20}px; height: 90px;
        perspective: 600px; perspective-origin: 50% 50%;
        z-index: 200; cursor: grab; user-select: none;
      }
      #carousel-ring {
        width: 100%; height: 100%; position: relative;
        transform-style: preserve-3d;
        transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
      }
      #carousel-ring:active { transition: none; }
      .carousel-card {
        position: absolute; width: ${CAROUSEL_ITEM_WIDTH}px; height: 80px;
        left: 50%; top: 50%; margin-left: -${CAROUSEL_ITEM_WIDTH / 2}px; margin-top: -40px;
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
        background: ${t.wheelItemBg}; border: 1px solid ${t.wheelItemBorder};
        border-radius: 16px; backface-visibility: hidden;
        cursor: pointer; transition: background 0.3s, border-color 0.3s, box-shadow 0.3s;
      }
      .carousel-card.active {
        background: ${t.wheelItemActiveBg}; border-color: ${t.wheelItemActiveBorder};
        box-shadow: 0 4px 24px rgba(80,140,200,0.2);
      }
      .carousel-card:hover:not(.active) { border-color: ${t.wheelItemActiveBorder}; }
      .card-emoji { font-size: 26px; line-height: 1; }
      .card-label { font-size: 9px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; color: ${t.textSecondary}; }
    `
  }

function updateUITheme(t) {
  applyUIThemeStyles()
  themeBtn.textContent = isDarkTheme ? '\u{1F31E} Light' : '\u{1F319} Dark'
}

function updateSoundButton() {
  if (!soundBtn) return
  soundBtn.textContent = soundEnabled ? '\u{1F3B6} Sound On' : '\u{1F3B6} Sound Off'
  soundBtn.classList.toggle('hud-btn-active', soundEnabled)
}

function updateUI() {
  if (!rpmEl) return
  const rpm = Math.abs(angularVelocity) * 9.549
  currentRPM = rpm
  rpmEl.textContent = Math.round(rpm).toLocaleString()

  if (Math.abs(angularVelocity) > 0.5) {
    if (!spinTimerActive) { spinTimerActive = true; spinStartTime = performance.now() }
    timerEl.textContent = ((performance.now() - spinStartTime) / 1000).toFixed(1) + 's'
  } else if (spinTimerActive) {
    spinTimerActive = false
    const elapsed = (performance.now() - spinStartTime) / 1000
    timerEl.textContent = elapsed.toFixed(1) + 's'
    if (elapsed > longestSpin) { longestSpin = elapsed; localStorage.setItem('fidgetMaxSpin', longestSpin.toFixed(1)); maxSpinEl.textContent = longestSpin.toFixed(1) + 's' }
    totalSpins++; localStorage.setItem('fidgetTotalSpins', String(totalSpins)); totalSpinsEl.textContent = String(totalSpins)
  }
}

// ══════════════════════════════════════════
// ── ANIMATION ──
// ══════════════════════════════════════════

let audioUpdateTimer = 0

function animate(now) {
  requestAnimationFrame(animate)
  const dt = Math.min((now - lastFrameTime) / 1000, 0.05)
  lastFrameTime = now

  if (Math.abs(angularVelocity) > STOP_THRESHOLD) {
    angularVelocity -= (DRAG_LINEAR * angularVelocity + DRAG_QUAD * angularVelocity * Math.abs(angularVelocity)) * dt
  } else angularVelocity = 0

  totalRotation += angularVelocity * dt
  spinnerGroup.rotation.y = totalRotation

  // Update Pokeball independent rotation
  for (let i = 0; i < pokeballSpinners.length; i++) {
    const pb = pokeballSpinners[i]
    const targetSpeed = angularVelocity * 0.35
    const variation = Math.sin(now * 0.003 + i * 2.1) * 0.08
    pb.speed += (targetSpeed * pb.inertia + variation - pb.speed) * 0.08 * dt * 60
    pb.group.rotation.z += pb.speed * dt
  }

  const absVel = Math.abs(angularVelocity), speedNorm = Math.min(absVel / MAX_SPEED, 1)
  spinnerGroup.rotation.x = Math.sin(now * 0.002) * speedNorm * WOBBLE
  spinnerGroup.rotation.z = Math.cos(now * 0.0017) * speedNorm * WOBBLE

  if (emissiveParts.length > 0) {
    const pulse = speedNorm * 0.7, breathe = 0.5 + Math.sin(now * 0.002) * 0.3
    emissiveParts.forEach(m => { if (m.emissiveIntensity !== undefined) m.emissiveIntensity = 0.05 + pulse * breathe })
  }

  speedLines.children.forEach((ring, i) => {
    const target = speedNorm * 0.15 * (1 - i * 0.15)
    ring.material.opacity += (target - ring.material.opacity) * 0.05
  })

  const positions = pGeo.attributes.position.array
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    pAngles[i] += speedNorm * 0.01 * (0.3 + (i % 4) * 0.15)
    const r = pRadii[i] + Math.sin(now * 0.0008 + i) * 0.3
    positions[i * 3] = Math.cos(pAngles[i]) * r
    positions[i * 3 + 1] = Math.sin(now * 0.001 + i * 0.3) * 0.8
    positions[i * 3 + 2] = Math.sin(pAngles[i]) * r
  }
  pGeo.attributes.position.needsUpdate = true
  pMat.opacity = speedNorm * 0.2

  bloomPass.strength = 0.18 + speedNorm * 0.25
  camera.position.y += Math.sin(now * 0.0005) * 0.002

  audioUpdateTimer += dt
  if (audioUpdateTimer > 0.06) { audioUpdateTimer = 0; updateAudio(angularVelocity) }

  updateUI(); controls.update(); composer.render()
}

// ══════════════════════════════════════════
// ── INIT ──
// ══════════════════════════════════════════

createSpinner()
createUI()
// Apply initial theme
applyTheme(isDarkTheme ? 'dark' : 'light')

window.addEventListener('resize', () => {
   camera.aspect = window.innerWidth / window.innerHeight
   camera.updateProjectionMatrix()
   renderer.setSize(window.innerWidth, window.innerHeight)
   composer.setSize(window.innerWidth, window.innerHeight)
   ssaoPass.setSize(window.innerWidth, window.innerHeight)
})

document.addEventListener('visibilitychange', () => {
   if (!document.hidden) lastFrameTime = performance.now()
 })

// Handle mobile orientation change
 window.addEventListener('orientationchange', () => {
   // Allow device to settle after rotation
   setTimeout(() => {
     camera.aspect = window.innerWidth / window.innerHeight
     camera.updateProjectionMatrix()
     renderer.setSize(window.innerWidth, window.innerHeight)
     composer.setSize(window.innerWidth, window.innerHeight)
     ssaoPass.setSize(window.innerWidth, window.innerHeight)
   }, 250)
 })

requestAnimationFrame(animate)
