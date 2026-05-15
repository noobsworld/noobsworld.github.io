import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

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

  liquidLevel: 0.6,
  liquidColor: 0x44aaff,
  liquidOpacity: 0.55,

  helixTurns: 3,
  helixRadius: 0.24,
  helixHeight: 1.4,
  helixSegments: 128,
  helixTubeRadius: 0.028,

  cameraDistance: 5.5,
  cameraHeight: 0.8
}

// ══════════════════════════════════════════
// ── SCENE SETUP ──
// ══════════════════════════════════════════

const container = document.getElementById('canvas-container')
const scene = new THREE.Scene()

// Deep gradient background — dark navy to near-black
const bgCanvas = document.createElement('canvas')
bgCanvas.width = 512; bgCanvas.height = 512
const bgCtx = bgCanvas.getContext('2d')
const grad = bgCtx.createRadialGradient(256, 180, 30, 256, 256, 420)
grad.addColorStop(0, '#141e30')
grad.addColorStop(0.5, '#0d1220')
grad.addColorStop(1, '#060810')
bgCtx.fillStyle = grad
bgCtx.fillRect(0, 0, 512, 512)
scene.background = new THREE.CanvasTexture(bgCanvas)

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, CONFIG.cameraHeight, CONFIG.cameraDistance)

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.3
container.appendChild(renderer.domElement)

// Environment map
const pmrem = new THREE.PMREMGenerator(renderer)
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
pmrem.dispose()

// ══════════════════════════════════════════
// ── ORBIT CONTROLS ──
// ══════════════════════════════════════════

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.06
controls.autoRotate = true
controls.autoRotateSpeed = 0.8
controls.minDistance = 3
controls.maxDistance = 10
controls.enablePan = false
controls.target.set(0, 0, 0)

renderer.domElement.addEventListener('dblclick', () => {
  controls.autoRotate = !controls.autoRotate
})

// ══════════════════════════════════════════
// ── LIGHTING (color theory: analogous cool + split-complementary warm) ──
// ══════════════════════════════════════════

// Base ambient — very subtle cool fill
scene.add(new THREE.AmbientLight(0x1a2233, 0.5))

// Key light — cool white (6500K feel), main illumination
const keyLight = new THREE.DirectionalLight(0xe8f0ff, 1.8)
keyLight.position.set(3, 5, 4)
scene.add(keyLight)

// Fill light — soft teal (analogous to blue), prevents harsh shadows
const fillLight = new THREE.DirectionalLight(0x88bbcc, 0.6)
fillLight.position.set(-4, 2, 3)
scene.add(fillLight)

// Rim/back light — deep blue, creates edge separation
const rimLight = new THREE.DirectionalLight(0x3355aa, 0.8)
rimLight.position.set(0, 1, -5)
scene.add(rimLight)

// Accent 1 — soft amber (split-complement to blue), warmth contrast
const amberLight = new THREE.PointLight(0xffaa55, 1.5, 12)
amberLight.position.set(2, 1, 3)
scene.add(amberLight)

// Accent 2 — muted cyan (analogous), subtle cool highlight
const cyanLight = new THREE.PointLight(0x44cccc, 0.8, 10)
cyanLight.position.set(-2, -1, -2)
scene.add(cyanLight)

// Bottom fill — deep indigo, prevents bottom from going pure black
const bottomFill = new THREE.PointLight(0x223366, 0.6, 8)
bottomFill.position.set(0, -4, 2)
scene.add(bottomFill)

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
  color: 0xffffff,
  transmission: CONFIG.glassTransmission,
  thickness: CONFIG.glassThickness,
  roughness: CONFIG.glassRoughness,
  ior: CONFIG.glassIOR,
  clearcoat: 1.0,
  clearcoatRoughness: 0.02,
  transparent: true,
  opacity: 0.25,
  side: THREE.DoubleSide,
  envMapIntensity: 1.2
})
const vialMesh = new THREE.Mesh(vialGeo, glassMat)
scene.add(vialMesh)

// Edge wireframe
const vialEdges = new THREE.LineSegments(
  new THREE.EdgesGeometry(vialGeo, 15),
  new THREE.LineBasicMaterial({ color: 0x556677, transparent: true, opacity: 0.3 })
)
scene.add(vialEdges)

// Contour rings
for (let i = 0; i < 10; i++) {
  const t = (i + 1) / 11
  const y = -CONFIG.vialHeight / 2 + t * CONFIG.vialHeight
  const r = THREE.MathUtils.lerp(CONFIG.vialBotRadius, CONFIG.vialTopRadius, t) * 1.015
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(r, 0.004, 4, 64),
    new THREE.MeshBasicMaterial({ color: 0x445566, transparent: true, opacity: 0.2 })
  )
  ring.rotation.x = Math.PI / 2
  ring.position.y = y
  scene.add(ring)
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
scene.add(capMesh)

const capEdges = new THREE.LineSegments(
  new THREE.EdgesGeometry(capGeo),
  new THREE.LineBasicMaterial({ color: 0x556677, transparent: true, opacity: 0.4 })
)
capEdges.position.y = capMesh.position.y
scene.add(capEdges)

// ══════════════════════════════════════════
// ── LIQUID ──
// ══════════════════════════════════════════

const liquidH = CONFIG.vialHeight * CONFIG.liquidLevel
const liquidY = -CONFIG.vialHeight / 2 + liquidH / 2 + 0.15
const liquidTopR = THREE.MathUtils.lerp(CONFIG.vialBotRadius, CONFIG.vialTopRadius, CONFIG.liquidLevel) * 0.9

const liquidMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(liquidTopR, CONFIG.vialBotRadius * 0.88, liquidH, 32),
  new THREE.MeshPhysicalMaterial({
    color: CONFIG.liquidColor,
    transparent: true,
    opacity: CONFIG.liquidOpacity,
    roughness: 0.08,
    transmission: 0.4,
    thickness: 0.15,
    ior: 1.33,
    envMapIntensity: 0.6
  })
)
liquidMesh.position.y = liquidY
scene.add(liquidMesh)

const meniscusMesh = new THREE.Mesh(
  new THREE.SphereGeometry(liquidTopR, 32, 8, 0, Math.PI * 2, 0, Math.PI * 0.3),
  new THREE.MeshPhysicalMaterial({
    color: CONFIG.liquidColor, transparent: true, opacity: 0.5,
    roughness: 0.05, transmission: 0.5, thickness: 0.05, side: THREE.DoubleSide
  })
)
meniscusMesh.position.y = liquidY + liquidH / 2 - 0.02
meniscusMesh.rotation.x = Math.PI
scene.add(meniscusMesh)

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
    color: CONFIG.helixColor, emissive: 0x336699, emissiveIntensity: 0.5,
    metalness: 0.15, roughness: 0.35, transparent: true, opacity: 0.9
  })
)
helixMesh.position.y = -0.15
scene.add(helixMesh)

const helixWire = new THREE.Mesh(
  new THREE.TubeGeometry(helixPath, CONFIG.helixSegments, CONFIG.helixTubeRadius * 1.8, 6, false),
  new THREE.MeshBasicMaterial({ color: 0x66bbff, wireframe: true, transparent: true, opacity: 0.15 })
)
helixWire.position.y = -0.15
scene.add(helixWire)

// Side chains
const sideChains = []
for (let i = 0; i < 14; i++) {
  const t = (i + 0.5) / 14
  const pt = helixPath.getPoint(t)
  const tan = helixPath.getTangent(t)
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 8, 8),
    new THREE.MeshPhysicalMaterial({
      color: 0xaaddff, emissive: 0x447799, emissiveIntensity: 0.4,
      transparent: true, opacity: 0.8
    })
  )
  sphere.position.copy(pt).add(tan.clone().multiplyScalar(0.1))
  sphere.position.y -= 0.15
  scene.add(sphere)
  sideChains.push(sphere)
}

// ══════════════════════════════════════════
// ── HUD ELEMENTS ──
// ══════════════════════════════════════════

const hudMat = new THREE.LineBasicMaterial({ color: 0x334455, transparent: true, opacity: 0.1 })
const hLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-2.5, 0, 0), new THREE.Vector3(2.5, 0, 0)]), hudMat)
const vLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -2, 0), new THREE.Vector3(0, 2, 0)]), hudMat)
scene.add(hLine, vLine)

// ══════════════════════════════════════════
// ── ANIMATION ──
// ══════════════════════════════════════════

const all = [vialMesh, vialEdges, capMesh, capEdges, liquidMesh, meniscusMesh, helixMesh, helixWire, hLine, vLine]

function animate(time) {
  requestAnimationFrame(animate)
  const t = time * 0.001

  // Floating motion
  const floatY = Math.sin(t * 0.5) * 0.06
  all.forEach(obj => { obj.position.y = (obj.position.y || 0) + (obj === vialMesh ? floatY - obj.position.y : 0) })

  // Helix pulse — subtle breathing
  helixMesh.material.emissiveIntensity = 0.35 + Math.sin(t * 1.2) * 0.15

  // Accent lights — gentle breathing (not flashing)
  amberLight.intensity = 1.3 + Math.sin(t * 0.6) * 0.3
  cyanLight.intensity = 0.7 + Math.cos(t * 0.4) * 0.2

  controls.update()
  renderer.render(scene, camera)
}

animate(0)

// ══════════════════════════════════════════
// ── RESIZE ──
// ══════════════════════════════════════════

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
