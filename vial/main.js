import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

// ══════════════════════════════════════════
// ── LOADING SCREEN ──
// ══════════════════════════════════════════

const loadingEl = document.createElement('div')
loadingEl.id = 'vial-loading'
loadingEl.innerHTML = '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#44ffcc;margin-right:8px;vertical-align:middle;animation:pulse 1s infinite alternate;"></span>loading'
Object.assign(loadingEl.style, {
  position: 'fixed', inset: '0', zIndex: '9999',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: '#020404',
  color: 'rgba(255,255,255,0.2)',
  fontFamily: 'system-ui,sans-serif',
  fontSize: '11px',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  transition: 'opacity 0.8s',
})
const styleSheet = document.createElement('style')
styleSheet.textContent = `
@view-transition { navigation: auto; }
::view-transition-old(root),
::view-transition-new(root) { animation-duration: 0.4s; }
@keyframes pulse { from { opacity:0.3; } to { opacity:1; } }
#vial-loading.fade { opacity:0; pointer-events:none; }
`
document.head.appendChild(styleSheet)
document.body.appendChild(loadingEl)

// ══════════════════════════════════════════
// ── CONFIGURATION ──
// ══════════════════════════════════════════

const CONFIG = {
  rotationSpeed: 0.12,
  autoRotate: true,

  vialHeight: 3.0,
  vialTopRadius: 0.55,
  vialBotRadius: 0.48,
  vialNeckRadius: 0.22,
  vialNeckHeight: 0.5,
  vialSegments: 48,

  glassTransmission: 0.92,
  glassThickness: 0.08,
  glassRoughness: 0.03,
  glassIOR: 1.52,

  liquidLevel: 0.5,
  liquidColor: 0x1a9e8f,
  liquidOpacity: 0.85,

  helixTurns: 3,
  helixRadius: 0.24,
  helixHeight: 1.4,
  helixSegments: 128,
  helixTubeRadius: 0.028,
  helixColor: 0x66ffdd,

  cameraDistance: 5.5,
  cameraHeight: 0.8,

  // Liquid physics
  sloshDamping: 0.92,
  sloshSpring: 0.08,
  sloshMaxTilt: 0.35
}

// ══════════════════════════════════════════
// ── SCENE SETUP ──
// ══════════════════════════════════════════

const container = document.getElementById('canvas-container')
const scene = new THREE.Scene()

// Deep gradient background — dark navy to near-black, more atmospheric
const bgCanvas = document.createElement('canvas')
bgCanvas.width = 512; bgCanvas.height = 512
const bgCtx = bgCanvas.getContext('2d')
const grad = bgCtx.createRadialGradient(256, 200, 50, 256, 256, 450)
grad.addColorStop(0, '#0a1a1a')
grad.addColorStop(0.4, '#050d0d')
grad.addColorStop(1, '#020404')
bgCtx.fillStyle = grad
bgCtx.fillRect(0, 0, 512, 512)
scene.background = new THREE.CanvasTexture(bgCanvas)

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, CONFIG.cameraHeight, CONFIG.cameraDistance)

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.9
container.appendChild(renderer.domElement)

// Environment map — brighter for realistic reflections
const pmrem = new THREE.PMREMGenerator(renderer)
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
pmrem.dispose()

// ══════════════════════════════════════════
// ── TECH BADGE ──
// ══════════════════════════════════════════

const badge = document.createElement('div')
badge.textContent = 'Three.js · Custom Shader · Web Audio API'
Object.assign(badge.style, {
  position: 'fixed', bottom: '36px', left: '36px', zIndex: '100',
  fontFamily: 'system-ui,sans-serif', fontSize: '9px',
  letterSpacing: '0.08em', color: 'rgba(255,255,255,0.12)',
  opacity: '0', transition: 'opacity 0.6s ease',
})
document.body.appendChild(badge)
requestAnimationFrame(() => { badge.style.opacity = '1' })

// ══════════════════════════════════════════
// ── ORBIT CONTROLS + BOTTLE ROTATION ──
// ══════════════════════════════════════════

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.06
controls.autoRotate = false
controls.autoRotateSpeed = 2.0
controls.minDistance = 3
controls.maxDistance = 10
controls.enablePan = false
controls.target.set(0, 0, 0)

// Idle auto-orbit — engages after 2.5s of no interaction
let sceneIdleTime = 0
const IDLE_ORBIT_DELAY = 2.5
const onUserInteraction = () => {
  controls.autoRotate = false
  sceneIdleTime = 0
}
renderer.domElement.addEventListener('pointerdown', onUserInteraction)
renderer.domElement.addEventListener('pointerup', () => {
  // On pointerup after orbit interaction, reset timer
  sceneIdleTime = 0
})

// Bottle rotation state
const bottleRot = {
  velY: 0.15,
  velX: 0,
  damping: 0.99,
  autoSpeed: 0.3
}

// Drag-to-rotate (position-based — bottle follows finger exactly)
let isDragging = false
let lastPointer = { x: 0, y: 0 }
let pointerDownTime = 0
let pointerDownPos = { x: 0, y: 0 }
let dragIntensity = 0

renderer.domElement.addEventListener('pointerdown', (e) => {
  isDragging = true
  lastPointer.x = e.clientX
  lastPointer.y = e.clientY
  pointerDownTime = performance.now()
  pointerDownPos.x = e.clientX
  pointerDownPos.y = e.clientY
  // Trigger ripple at drag start
  rippleTime = 0
  const adjustedFill = (fillLevel - 0.5) * bottleHeight
  rippleCenter.copy(lagUp).multiplyScalar(adjustedFill)
})

renderer.domElement.addEventListener('pointermove', (e) => {
  if (!isDragging) return
  const dx = e.clientX - lastPointer.x
  const dy = e.clientY - lastPointer.y
  // Direct rotation — no momentum accumulation
  _euler.set(dy * 0.006, dx * 0.008, 0, 'XYZ')
  _deltaQ.setFromEuler(_euler)
  bottleQuat.multiply(_deltaQ)
  bottleQuat.normalize()
  bottleGroup.quaternion.copy(bottleQuat)
  lastPointer.x = e.clientX
  lastPointer.y = e.clientY
  // Track drag movement for audio (velocities are zeroed)
  dragIntensity = Math.min(dragIntensity + (Math.abs(dx) + Math.abs(dy)) * 0.003, 1.0)
  // Zero velocity so bottle stays put when drag ends
    bottleRot.velX = 0
    bottleRot.velY = 0
})

function onPointerUp(e) {
  isDragging = false
  // Tap detection: quick click with minimal movement → stop all spin
  const dt = performance.now() - pointerDownTime
  const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y)
  if (dt < 300 && dist < 10) {
    bottleRot.velX = 0
    bottleRot.velY = 0
  }
}
renderer.domElement.addEventListener('pointerup', onPointerUp)
renderer.domElement.addEventListener('pointerleave', () => { isDragging = false })

renderer.domElement.addEventListener('dblclick', () => {
  bottleRot.velY = bottleRot.velY > 0.2 ? 0 : bottleRot.autoSpeed
  bottleRot.velX = 0
  rippleTime = 0
  const adjustedFill = (fillLevel - 0.5) * bottleHeight
  rippleCenter.copy(lagUp).multiplyScalar(adjustedFill)
})

// S / Escape → stop
document.addEventListener('keydown', (e) => {
  if (e.key === 's' || e.key === 'S' || e.key === 'Escape') {
    bottleRot.velX = 0
    bottleRot.velY = 0
  }
})

// ══════════════════════════════════════════
// ── HUD CONTROLS (glass-morphism) ──
// ══════════════════════════════════════════

let fillLevel = CONFIG.liquidLevel

const hud = document.createElement('div')
Object.assign(hud.style, {
  position: 'fixed', bottom: '36px', right: '36px', zIndex: '100',
  background: 'rgba(8,16,20,0.65)',
  backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '14px', padding: '18px 22px',
  minWidth: '200px',
  display: 'flex', flexDirection: 'column', gap: '12px',
  fontFamily: 'system-ui,-apple-system,sans-serif',
  opacity: '0', transform: 'translateY(12px)',
  transition: 'opacity 0.6s ease, transform 0.6s ease',
})

// Top row: audio toggle + title + fill percentage
const topRow = document.createElement('div')
Object.assign(topRow.style, {
  display: 'flex', alignItems: 'center', gap: '10px',
})

const audioBtn = document.createElement('button')
audioBtn.innerHTML = '🔊'
audioBtn.title = 'Toggle sound'
Object.assign(audioBtn.style, {
  width: '28px', height: '28px', borderRadius: '50%',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(0,0,0,0.25)',
  color: '#fff', fontSize: '12px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.2s', flexShrink: '0',
})
audioBtn.addEventListener('click', () => {
  audioEnabled = !audioEnabled
  audioBtn.innerHTML = audioEnabled ? '🔊' : '🔇'
  audioBtn.style.borderColor = audioEnabled ? 'rgba(255,255,255,0.12)' : 'rgba(255,80,80,0.3)'
  if (audioEnabled && !audioNodes) initAudio()
  if (audioNodes) {
    audioNodes.waterGain.gain.value = 0
    audioNodes.rumbleGain.gain.value = 0
    audioNodes.glassGain.gain.value = 0
    audioNodes.windGain.gain.value = 0
  }
})

const hudTitle = document.createElement('span')
hudTitle.textContent = 'PEPTIDE VIAL'
Object.assign(hudTitle.style, {
  fontSize: '9px', letterSpacing: '0.3em', fontWeight: '600',
  color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', flex: '1',
})

const sliderVal = document.createElement('span')
sliderVal.textContent = Math.round(fillLevel * 100) + '%'
Object.assign(sliderVal.style, {
  fontSize: '12px', fontWeight: '500', fontVariantNumeric: 'tabular-nums',
  color: 'rgba(68,255,204,0.7)', minWidth: '28px', textAlign: 'right',
})

topRow.appendChild(audioBtn)
topRow.appendChild(hudTitle)
topRow.appendChild(sliderVal)

// Fill slider
const sliderInput = document.createElement('input')
sliderInput.type = 'range'
sliderInput.min = '0.1'
sliderInput.max = '0.85'
sliderInput.step = '0.01'
sliderInput.value = String(fillLevel)
Object.assign(sliderInput.style, {
  width: '100%', height: '2px', appearance: 'none',
  background: 'rgba(255,255,255,0.08)',
  borderRadius: '1px', outline: 'none', cursor: 'pointer',
  accentColor: '#44ffcc',
})
sliderInput.addEventListener('input', () => {
  fillLevel = parseFloat(sliderInput.value)
  sliderVal.textContent = Math.round(fillLevel * 100) + '%'
})

// Interaction hints
const hints = document.createElement('div')
hints.textContent = 'Drag to tilt · Double-click to spin · S to stop'
Object.assign(hints.style, {
  fontSize: '9px', letterSpacing: '0.05em',
  color: 'rgba(255,255,255,0.18)', lineHeight: '1.4',
})

hud.appendChild(topRow)
hud.appendChild(sliderInput)
hud.appendChild(hints)
document.body.appendChild(hud)

// Fade in HUD on next frame
requestAnimationFrame(() => {
  hud.style.opacity = '1'
  hud.style.transform = 'translateY(0)'
})

// ══════════════════════════════════════════
// ── LIGHTING (color theory: analogous cool + split-complementary warm) ──
// ══════════════════════════════════════════

// Base ambient — very subtle cool fill
scene.add(new THREE.AmbientLight(0x0a1515, 0.2))

// Key light — cool cyan-white, main illumination
const keyLight = new THREE.DirectionalLight(0xaaffff, 1.2)
keyLight.position.set(3, 5, 4)
scene.add(keyLight)

// Fill light — soft cyan-green, prevents harsh shadows
const fillLight = new THREE.DirectionalLight(0x44aaaa, 0.4)
fillLight.position.set(-4, 2, 3)
scene.add(fillLight)

// Rim/back light — cyan, creates edge separation
const rimLight = new THREE.DirectionalLight(0x33ddcc, 0.6)
rimLight.position.set(0, 1, -5)
scene.add(rimLight)

// Accent 1 — soft amber warmth contrast against cyan
const amberLight = new THREE.PointLight(0xff8844, 0.8, 12)
amberLight.position.set(2, 1, 3)
scene.add(amberLight)

// Accent 2 — muted cyan highlight
const cyanLight = new THREE.PointLight(0x44ffcc, 0.5, 10)
cyanLight.position.set(-2, -1, -2)
scene.add(cyanLight)

// Bottom fill — deep teal
const bottomFill = new THREE.PointLight(0x116655, 0.4, 8)
bottomFill.position.set(0, -4, 2)
scene.add(bottomFill)

// ══════════════════════════════════════════
// ── BOTTLE GROUP (everything that rotates together) ──
// ══════════════════════════════════════════

const bottleGroup = new THREE.Group()
scene.add(bottleGroup)

// ══════════════════════════════════════════
// ── GROUND GLOW RING ──
// ══════════════════════════════════════════

const glowRing = new THREE.Mesh(
  new THREE.RingGeometry(0.6, 1.4, 64),
  new THREE.MeshBasicMaterial({
    color: 0x1a9e8f, transparent: true, opacity: 0.06,
    side: THREE.DoubleSide, depthWrite: false,
  })
)
glowRing.rotation.x = -Math.PI / 2
glowRing.position.y = -CONFIG.vialHeight / 2 - 0.02
scene.add(glowRing)

const glowInner = new THREE.Mesh(
  new THREE.CircleGeometry(0.5, 32),
  new THREE.MeshBasicMaterial({
    color: 0x1a9e8f, transparent: true, opacity: 0.04,
    side: THREE.DoubleSide, depthWrite: false,
  })
)
glowInner.rotation.x = -Math.PI / 2
glowInner.position.y = -CONFIG.vialHeight / 2 - 0.01
scene.add(glowInner)

// ══════════════════════════════════════════
// ── AMBIENT PARTICLES ──
// ══════════════════════════════════════════

const PARTICLE_COUNT = 120
const pPos = new Float32Array(PARTICLE_COUNT * 3)
const pSizes = new Float32Array(PARTICLE_COUNT)
for (let i = 0; i < PARTICLE_COUNT; i++) {
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  const r = 1.5 + Math.random() * 3.5
  pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
  pPos[i * 3 + 1] = (Math.random() - 0.5) * 5
  pPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
  pSizes[i] = 0.008 + Math.random() * 0.02
}
const pGeo = new THREE.BufferGeometry()
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
pGeo.setAttribute('size', new THREE.BufferAttribute(pSizes, 1))
const pMat = new THREE.PointsMaterial({
  color: 0x44ffcc, size: 0.015, transparent: true, opacity: 0.1,
  blending: THREE.AdditiveBlending, depthWrite: false,
  sizeAttenuation: true,
})
const particles = new THREE.Points(pGeo, pMat)
scene.add(particles)

// ══════════════════════════════════════════
// ── GLASS VIAL ──
// ══════════════════════════════════════════

function createVialProfile() {
  const pts = []
  const h = CONFIG.vialHeight
  const tR = CONFIG.vialTopRadius
  const bR = CONFIG.vialBotRadius
  const nR = CONFIG.vialNeckRadius
  const nH = CONFIG.vialNeckHeight

  for (let i = 0; i <= 10; i++) {
    const t = i / 10
    pts.push(new THREE.Vector2(bR * Math.sin(t * Math.PI * 0.5) + 0.02, -h / 2 + t * 0.35))
  }
  for (let i = 0; i <= 20; i++) {
    const t = i / 20
    const y = -h / 2 + 0.35 + t * (h - nH - 0.7)
    pts.push(new THREE.Vector2(THREE.MathUtils.lerp(bR + 0.02, tR, t), y))
  }
  for (let i = 0; i <= 10; i++) {
    const t = i / 10
    const y = h / 2 - nH + t * 0.25
    pts.push(new THREE.Vector2(THREE.MathUtils.lerp(tR, nR, t), y))
  }
  for (let i = 0; i <= 10; i++) {
    const t = i / 10
    pts.push(new THREE.Vector2(nR, h / 2 - nH + 0.25 + t * (nH - 0.25)))
  }
  for (let i = 0; i <= 6; i++) {
    const t = i / 6
    pts.push(new THREE.Vector2(nR + t * 0.08, h / 2 + t * 0.1))
  }
  return pts
}

const vialGeo = new THREE.LatheGeometry(createVialProfile(), CONFIG.vialSegments)
const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0xaaccee,
  transparent: true,
  opacity: 0.12,
  roughness: 0.15,
  metalness: 0.0,
  clearcoat: 0.0,
  side: THREE.DoubleSide,
  envMapIntensity: 0.0,
  specularIntensity: 0.0,
})
const vialMesh = new THREE.Mesh(vialGeo, glassMat)
vialMesh.renderOrder = 1
bottleGroup.add(vialMesh)

// Edge wireframe
const vialEdges = new THREE.LineSegments(
  new THREE.EdgesGeometry(vialGeo, 15),
  new THREE.LineBasicMaterial({ color: 0x33aa99, transparent: true, opacity: 0.2 })
)
bottleGroup.add(vialEdges)

// Contour rings
for (let i = 0; i < 10; i++) {
  const t = (i + 1) / 11
  const y = -CONFIG.vialHeight / 2 + t * CONFIG.vialHeight
  const r = THREE.MathUtils.lerp(CONFIG.vialBotRadius, CONFIG.vialTopRadius, t) * 1.015
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(r, 0.004, 4, 64),
    new THREE.MeshBasicMaterial({ color: 0x338877, transparent: true, opacity: 0.15 })
  )
  ring.rotation.x = Math.PI / 2
  ring.position.y = y
  bottleGroup.add(ring)
}

// ══════════════════════════════════════════
// ── CAP ──
// ══════════════════════════════════════════

const capGeo = new THREE.CylinderGeometry(0.3, 0.27, 0.28, 32)
const capMat = new THREE.MeshPhysicalMaterial({
  color: 0x2a2a3e, metalness: 0.8, roughness: 0.2, clearcoat: 0.7
})
const capMesh = new THREE.Mesh(capGeo, capMat)
capMesh.position.y = CONFIG.vialHeight / 2 + 0.1
bottleGroup.add(capMesh)

const capEdges = new THREE.LineSegments(
  new THREE.EdgesGeometry(capGeo),
  new THREE.LineBasicMaterial({ color: 0x556677, transparent: true, opacity: 0.4 })
)
capEdges.position.y = capMesh.position.y
bottleGroup.add(capEdges)

// ══════════════════════════════════════════
// ── LIQUID (lagUp vector physics + surface mesh + ripples) ──
// ══════════════════════════════════════════

const bottleHeight = CONFIG.vialHeight

// Interior profile — slightly smaller than glass
function createLiquidProfile() {
  const pts = []
  const h = CONFIG.vialHeight
  const tR = CONFIG.vialTopRadius
  const bR = CONFIG.vialBotRadius
  const nR = CONFIG.vialNeckRadius
  const nH = CONFIG.vialNeckHeight
  const s = 0.03

  for (let i = 0; i <= 10; i++) {
    const t = i / 10
    pts.push(new THREE.Vector2(Math.max(0.01, bR * Math.sin(t * Math.PI * 0.5) + 0.02 - s), -h / 2 + t * 0.35))
  }
  for (let i = 0; i <= 20; i++) {
    const t = i / 20
    const y = -h / 2 + 0.35 + t * (h - nH - 0.7)
    pts.push(new THREE.Vector2(Math.max(0.01, THREE.MathUtils.lerp(bR + 0.02, tR, t) - s), y))
  }
  for (let i = 0; i <= 10; i++) {
    const t = i / 10
    const y = h / 2 - nH + t * 0.25
    pts.push(new THREE.Vector2(Math.max(0.01, THREE.MathUtils.lerp(tR, nR, t) - s), y))
  }
  for (let i = 0; i <= 10; i++) {
    const t = i / 10
    pts.push(new THREE.Vector2(Math.max(0.01, nR - s), h / 2 - nH + 0.25 + t * (nH - 0.25)))
  }
  for (let i = 0; i <= 6; i++) {
    const t = i / 6
    pts.push(new THREE.Vector2(Math.max(0.01, nR + t * 0.08 - s), h / 2 + t * 0.1))
  }
  return pts
}

const liquidGeo = new THREE.LatheGeometry(createLiquidProfile(), CONFIG.vialSegments)

// ── LIQUID BODY SHADER ──
const liquidVertShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewDirection;

  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * worldPosition;
    vViewDirection = normalize(-viewPosition.xyz);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const liquidFragShader = `
  uniform float uTime;
  uniform float uFill;
  uniform vec3 uColor;
  uniform vec3 uSurfaceColor;
  uniform vec3 uLagUp;
  uniform float uBottleHeight;
  uniform float uRippleTime;
  uniform vec3 uRippleCenter;
  uniform float uTurbulence;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewDirection;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  void main() {
    // Normalized fill: 0.5 = half full, mapped to bottle height
    float adjustedFill = (uFill - 0.5) * uBottleHeight;

    // Expanding ripple from interaction point
    float ripDist = distance(vPosition, uRippleCenter);
    float ripple = uRippleTime >= 0.0
      ? sin(ripDist * 18.0 - uRippleTime * 15.0) * exp(-uRippleTime * 4.0) * 0.06
      : 0.0;

    // Micro-turbulence from movement
    float turb = sin(vPosition.x * 12.0 + uTime * 6.0)
               * cos(vPosition.z * 12.0 + uTime * 5.0)
               * uTurbulence * 0.15;

    // Distance from surface along gravity direction (positive = above)
    float dist = dot(vPosition, uLagUp) - adjustedFill + ripple + turb;

    // Clip above surface
    if (dist > 0.0) discard;

    // Fresnel — use abs to handle back faces from clipping
    float fNdotV = abs(dot(vNormal, vViewDirection));
    float fresnel = pow(1.0 - fNdotV, 4.0);

    // Depth-based coloring — darker at bottom, brighter near surface
    float depth = smoothstep(-uBottleHeight, 0.0, dist);
    vec3 deepColor = uColor * 0.4;
    vec3 gelColor = mix(deepColor, uColor, depth);

    // Procedural bubbles rising
    float bubbles = 0.0;
    vec3 bubblePos = vPosition * 40.0;
    bubblePos.y -= uTime * 0.8;
    if (hash(floor(bubblePos)) > 0.995) {
      float bCenter = length(fract(bubblePos) - 0.5);
      bubbles = smoothstep(0.8, 1.0, sin(bCenter * 10.0));
    }
    gelColor += bubbles * 0.3;

    // Surface meniscus highlight
    float surfaceHighlight = smoothstep(-0.04, 0.0, dist);
    vec3 finalColor = mix(gelColor, uSurfaceColor, surfaceHighlight * 0.3);

    // Fresnel edge glow
    finalColor += fresnel * uColor * 0.1;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

const liquidMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uFill: { value: CONFIG.liquidLevel },
    uColor: { value: new THREE.Color(CONFIG.liquidColor) },
    uSurfaceColor: { value: new THREE.Color(0x44ccbb) },
    uLagUp: { value: new THREE.Vector3(0, 1, 0) },
    uBottleHeight: { value: bottleHeight },
    uRippleTime: { value: -1.0 },
    uRippleCenter: { value: new THREE.Vector3() },
    uTurbulence: { value: 0.0 }
  },
  vertexShader: liquidVertShader,
  fragmentShader: liquidFragShader,
  transparent: true,
  opacity: 0.85,
  side: THREE.DoubleSide,
})

const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat)
liquidMesh.renderOrder = 0
bottleGroup.add(liquidMesh)

// ── LIQUID SURFACE SHADER (separate plane oriented along lagUp) ──
const surfaceVertShader = `
  uniform vec3 uCenter;
  uniform vec3 uNormal;
  uniform float uRippleTime;
  uniform vec3 uRippleCenter;
  uniform float uTurbulence;
  uniform float uTime;

  varying vec3 vBottlePos;

  void main() {
    // Build coordinate frame from normal
    vec3 up = abs(uNormal.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
    vec3 right = normalize(cross(up, uNormal));
    vec3 forward = cross(uNormal, right);

    // Position plane at surface center, oriented along normal
    vec3 basePos = uCenter + right * position.x + forward * position.y;
    vBottlePos = basePos;

    // Ripple + turbulence displacement along normal
    float ripDist = distance(basePos, uRippleCenter);
    float ripple = uRippleTime >= 0.0
      ? sin(ripDist * 18.0 - uRippleTime * 15.0) * exp(-uRippleTime * 4.0) * 0.06
      : 0.0;
    float turb = sin(basePos.x * 12.0 + uTime * 6.0)
               * cos(basePos.z * 12.0 + uTime * 5.0)
               * uTurbulence * 0.15;

    vec3 displacedPos = basePos + uNormal * (ripple + turb - 0.005);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPos, 1.0);
  }
`

const surfaceFragShader = `
  uniform vec3 uColor;
  varying vec3 vBottlePos;

  float getRadius(float y) {
    // Match our bottle interior profile precisely
    if (y < -1.0) return 0.46;
    if (y < 0.6) return mix(0.46, 0.52, (y + 1.0) / 1.6);
    return mix(0.52, 0.19, (y - 0.6) / 0.9);
  }

  void main() {
    float r = getRadius(vBottlePos.y);
    float distFromAxis = length(vBottlePos.xz);

    if (distFromAxis > r) discard;

    vec3 finalColor = mix(uColor, vec3(1.0), 0.25);

    // Edge highlight
    float edge = smoothstep(r - 0.08, r, distFromAxis);
    finalColor = mix(finalColor, vec3(1.0), edge * 0.4);

    // Center highlight
    float centerHighlight = smoothstep(r * 0.7, 0.0, distFromAxis);
    finalColor += uColor * centerHighlight * 0.2;

    // Soft edge alpha
    float edgeAlpha = smoothstep(r, r - 0.06, distFromAxis);
    gl_FragColor = vec4(finalColor, 0.95 * edgeAlpha);
  }
`

const surfaceMat = new THREE.ShaderMaterial({
  uniforms: {
    uCenter: { value: new THREE.Vector3(0, 0, 0) },
    uNormal: { value: new THREE.Vector3(0, 1, 0) },
    uRippleTime: { value: -1.0 },
    uRippleCenter: { value: new THREE.Vector3() },
    uTurbulence: { value: 0.0 },
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(CONFIG.liquidColor) }
  },
  vertexShader: surfaceVertShader,
  fragmentShader: surfaceFragShader,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false
})

const surfaceMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), surfaceMat)
surfaceMesh.renderOrder = 2
bottleGroup.add(surfaceMesh)

// ══════════════════════════════════════════
// ── LIQUID SLOSH PHYSICS (mass-spring-damper lagUp vector) ──
// ══════════════════════════════════════════

const lagUp = new THREE.Vector3(0, 1, 0)
const LIQUID_FOLLOW_SPEED = 3.0

let rippleTime = -1
let rippleCenter = new THREE.Vector3()
let turbulence = 0

function updateSloshPhysics(dt) {
  // World up direction expressed in bottle local space
  const worldUpLocal = new THREE.Vector3(0, 1, 0)
    .applyQuaternion(bottleGroup.quaternion.clone().invert())

  // Exponential follow — no oscillation, frame-rate independent
  const t = 1.0 - Math.exp(-LIQUID_FOLLOW_SPEED * dt)
  lagUp.lerp(worldUpLocal, t)
  lagUp.normalize()

  // Turbulence from bottle rotation velocity
  const movement = Math.abs(bottleRot.velX) + Math.abs(bottleRot.velY)
  const targetTurb = Math.min(movement * 0.6, 1.0)
  turbulence = THREE.MathUtils.lerp(turbulence, targetTurb, dt * 5)

  // Ripple decay
  if (rippleTime >= 0) {
    rippleTime += dt
    if (rippleTime > 2.0) rippleTime = -1
  }
}

// ══════════════════════════════════════════
// ── PEPTIDE HELIX ──
// ══════════════════════════════════════════

function createHelix(turns, radius, height, segs) {
  const pts = []
  for (let i = 0; i <= segs; i++) {
    const t = i / segs
    const a = t * turns * Math.PI * 2
    pts.push(new THREE.Vector3(Math.cos(a) * radius, -height / 2 + t * height, Math.sin(a) * radius))
  }
  return new THREE.CatmullRomCurve3(pts)
}

const helixPath = createHelix(CONFIG.helixTurns, CONFIG.helixRadius, CONFIG.helixHeight, CONFIG.helixSegments)

const helixMesh = new THREE.Mesh(
  new THREE.TubeGeometry(helixPath, CONFIG.helixSegments, CONFIG.helixTubeRadius, 8, false),
  new THREE.MeshPhysicalMaterial({
    color: CONFIG.helixColor, emissive: 0x44bbaa, emissiveIntensity: 0.5,
    metalness: 0.15, roughness: 0.35, transparent: true, opacity: 0.9
  })
)
helixMesh.position.y = -0.15
bottleGroup.add(helixMesh)

const helixWire = new THREE.Mesh(
  new THREE.TubeGeometry(helixPath, CONFIG.helixSegments, CONFIG.helixTubeRadius * 1.8, 6, false),
  new THREE.MeshBasicMaterial({ color: 0x66bbff, wireframe: true, transparent: true, opacity: 0.15 })
)
helixWire.position.y = -0.15
bottleGroup.add(helixWire)

// Side chains
const sideChains = []
for (let i = 0; i < 14; i++) {
  const t = (i + 0.5) / 14
  const pt = helixPath.getPoint(t)
  const tan = helixPath.getTangent(t)
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 8, 8),
    new THREE.MeshPhysicalMaterial({
      color: 0x88ffdd, emissive: 0x44bbaa, emissiveIntensity: 0.3,
      transparent: true, opacity: 0.8
    })
  )
  sphere.position.copy(pt).add(tan.clone().multiplyScalar(0.1))
  sphere.position.y -= 0.15
  bottleGroup.add(sphere)
  sideChains.push(sphere)
}

// ══════════════════════════════════════════
// ── POST-PROCESSING (bloom) ──
// ══════════════════════════════════════════

const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.3,   // intensity
  0.5,   // radius
  0.5    // threshold
)
composer.addPass(bloomPass)

// ══════════════════════════════════════════
// ── AUDIO (procedural water + glass sounds) ──
// ══════════════════════════════════════════

let audioCtx = null
let audioNodes = null
let audioEnabled = true

function initAudio() {
  if (audioCtx) return
  audioCtx = new AudioContext()

  // Shared noise buffer (2 seconds)
  const bufSize = audioCtx.sampleRate * 2
  const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1

  // Single noise source → 3 filter chains
  const noiseSrc = audioCtx.createBufferSource()
  noiseSrc.buffer = buf
  noiseSrc.loop = true

  // 1. Water slosh — bandpass 100–400 Hz
  const waterFilter = audioCtx.createBiquadFilter()
  waterFilter.type = 'bandpass'
  waterFilter.frequency.value = 200
  waterFilter.Q.value = 0.6
  const waterGain = audioCtx.createGain()
  waterGain.gain.value = 0
  noiseSrc.connect(waterFilter)
  waterFilter.connect(waterGain)
  waterGain.connect(audioCtx.destination)

  // 2. Water rumble — low sine 30–60 Hz
  const rumbleOsc = audioCtx.createOscillator()
  rumbleOsc.type = 'sine'
  rumbleOsc.frequency.value = 35
  const rumbleGain = audioCtx.createGain()
  rumbleGain.gain.value = 0
  rumbleOsc.connect(rumbleGain)
  rumbleGain.connect(audioCtx.destination)
  rumbleOsc.start()

  // 3. Glass resonance — bandpass 800–1200 Hz, high Q
  const glassFilter = audioCtx.createBiquadFilter()
  glassFilter.type = 'bandpass'
  glassFilter.frequency.value = 950
  glassFilter.Q.value = 4
  const glassGain = audioCtx.createGain()
  glassGain.gain.value = 0
  noiseSrc.connect(glassFilter)
  glassFilter.connect(glassGain)
  glassGain.connect(audioCtx.destination)

  // 4. Wind / air friction — highpass 2 kHz+
  const windFilter = audioCtx.createBiquadFilter()
  windFilter.type = 'highpass'
  windFilter.frequency.value = 2000
  const windGain = audioCtx.createGain()
  windGain.gain.value = 0
  noiseSrc.connect(windFilter)
  windFilter.connect(windGain)
  windGain.connect(audioCtx.destination)

  noiseSrc.start()

  audioNodes = { waterGain, waterFilter, rumbleGain, rumbleOsc, glassGain, windGain }
}

function updateAudio(dt) {
  if (!audioNodes || !audioEnabled || audioCtx.state === 'suspended') return

  // Decay drag intensity (from position-based drag where velocity is 0)
  dragIntensity *= Math.pow(0.001, dt) // decay to near-zero in ~0.5s

  const rotSpeed = Math.abs(bottleRot.velX) + Math.abs(bottleRot.velY)
  // Use whichever is higher: actual velocity or recent drag movement
  const speed = Math.max(rotSpeed, dragIntensity)
  const turb = turbulence

  // Gains tuned to be clearly audible on speakers/headphones
  const tWater = Math.min(turb * 0.35, 0.18)
  const tRumble = Math.min(speed * 0.18, 0.3)
  const tGlass = Math.min(speed * 0.1 * turb, 0.15)
  const tWind = Math.min(speed * 0.08, 0.12)

  const smooth = 1.0 - Math.exp(-6 * dt)

  const setGain = (node, target) => {
    node.gain.value += (target - node.gain.value) * smooth
  }
  setGain(audioNodes.waterGain, tWater)
  setGain(audioNodes.rumbleGain, tRumble)
  setGain(audioNodes.glassGain, tGlass)
  setGain(audioNodes.windGain, tWind)

  // Shift water filter frequency with turbulence for dynamic sound
  audioNodes.waterFilter.frequency.value = 180 + turb * 350

  // Modulate rumble pitch with current speed
  if (audioNodes.rumbleGain.gain.value > 0.001) {
    audioNodes.rumbleOsc.frequency.value = 30 + speed * 12
  }
}

// Init audio on first user interaction (browser autoplay policy)
const firstInteraction = () => {
  initAudio()
  document.removeEventListener('pointerdown', firstInteraction)
}
document.addEventListener('pointerdown', firstInteraction)

// ══════════════════════════════════════════
// ── ANIMATION ──
// ══════════════════════════════════════════

// Quaternion-based rotation — avoids gimbal lock when bottle is inverted
const bottleQuat = bottleGroup.quaternion.clone()
const _deltaQ = new THREE.Quaternion()
const _euler = new THREE.Euler()

// Entrance animation state
const entrance = { startTime: -1, duration: 1.6 }
bottleGroup.position.y = -2.2
bottleGroup.scale.setScalar(0.85)
glassMat.opacity = 0

function animate(time) {
  requestAnimationFrame(animate)
  const t = time * 0.001
  const dt = 0.016

  // ── Entrance animation ──
  if (entrance.startTime < 0) entrance.startTime = t
  const eT = Math.min((t - entrance.startTime) / entrance.duration, 1)
  const eEase = 1 - Math.pow(1 - eT, 3) // cubic ease-out
  bottleGroup.position.y = -2.2 + 2.2 * eEase
  bottleGroup.scale.setScalar(0.85 + 0.15 * eEase)
  glassMat.opacity = 0.12 * eEase

  // Hide loading screen after entrance completes
  if (eT >= 1 && !loadingEl.classList.contains('fade')) {
    loadingEl.classList.add('fade')
    setTimeout(() => { loadingEl.style.display = 'none' }, 800)
  }

  // ── Idle camera auto-orbit ──
  if (!isDragging && controls.enabled) {
    sceneIdleTime += dt
    if (sceneIdleTime > IDLE_ORBIT_DELAY && !controls.autoRotate) {
      controls.autoRotate = true
    }
  }

  // ── Bottle rotation ──
  if (!isDragging) {
    bottleRot.velY += (bottleRot.autoSpeed - bottleRot.velY) * 0.01
  }
  bottleRot.velX *= bottleRot.damping
  bottleRot.velY *= bottleRot.damping

  _euler.set(bottleRot.velX * dt * 60, bottleRot.velY * dt * 60, 0, 'XYZ')
  _deltaQ.setFromEuler(_euler)
  bottleQuat.multiply(_deltaQ)
  bottleQuat.normalize()
  bottleGroup.quaternion.copy(bottleQuat)

  // ── Ground glow pulse ──
  const glowPhase = Math.sin(t * 0.5) * 0.3 + 0.7
  glowRing.material.opacity = 0.06 * glowPhase
  glowInner.material.opacity = 0.04 * glowPhase

  // ── Ambient particles ──
  particles.rotation.y = t * 0.015
  particles.rotation.x = Math.sin(t * 0.01) * 0.02

  // ── Slosh physics ──
  updateSloshPhysics(dt)

  // ── Audio ──
  updateAudio(dt)

  // ── Shader uniforms ──
  liquidMat.uniforms.uTime.value = t
  liquidMat.uniforms.uFill.value = fillLevel
  liquidMat.uniforms.uLagUp.value.copy(lagUp)
  liquidMat.uniforms.uRippleTime.value = rippleTime
  liquidMat.uniforms.uRippleCenter.value.copy(rippleCenter)
  liquidMat.uniforms.uTurbulence.value = turbulence

  const adjustedFill = (fillLevel - 0.5) * bottleHeight
  surfaceMat.uniforms.uCenter.value.copy(lagUp).multiplyScalar(adjustedFill)
  surfaceMat.uniforms.uNormal.value.copy(lagUp)
  surfaceMat.uniforms.uTime.value = t
  surfaceMat.uniforms.uRippleTime.value = rippleTime
  surfaceMat.uniforms.uRippleCenter.value.copy(rippleCenter)
  surfaceMat.uniforms.uTurbulence.value = turbulence

  // ── Helix pulse ──
  helixMesh.material.emissiveIntensity = 0.35 + Math.sin(t * 1.2) * 0.15

  // ── Accent lights ──
  amberLight.intensity = 1.3 + Math.sin(t * 0.6) * 0.3
  cyanLight.intensity = 0.7 + Math.cos(t * 0.4) * 0.2

  controls.update()
  composer.render()
}

animate(0)

// ══════════════════════════════════════════
// ── RESIZE ──
// ══════════════════════════════════════════

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setSize(window.innerWidth, window.innerHeight)
})
