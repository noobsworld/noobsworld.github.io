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

// Gradient background
const bgCanvas = document.createElement('canvas')
bgCanvas.width = 512; bgCanvas.height = 512
const bgCtx = bgCanvas.getContext('2d')
const grad = bgCtx.createRadialGradient(256, 200, 50, 256, 256, 400)
grad.addColorStop(0, '#1a2235')
grad.addColorStop(0.4, '#0f1520')
grad.addColorStop(1, '#080810')
bgCtx.fillStyle = grad
bgCtx.fillRect(0, 0, 512, 512)
const bgTexture = new THREE.CanvasTexture(bgCanvas)
scene.background = bgTexture

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, CONFIG.cameraHeight, CONFIG.cameraDistance)

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.6
container.appendChild(renderer.domElement)

// Environment map
const pmrem = new THREE.PMREMGenerator(renderer)
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.06).texture
pmrem.dispose()

// ══════════════════════════════════════════
// ── ORBIT CONTROLS ──
// ══════════════════════════════════════════

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.06
controls.autoRotate = CONFIG.autoRotate
controls.autoRotateSpeed = 1.0
controls.minDistance = 3
controls.maxDistance = 10
controls.enablePan = false
controls.target.set(0, 0, 0)

renderer.domElement.addEventListener('dblclick', () => {
  controls.autoRotate = !controls.autoRotate
})

// ══════════════════════════════════════════
// ── LIGHTING (rich, multi-source) ──
// ══════════════════════════════════════════

scene.add(new THREE.AmbientLight(0x405070, 0.8))

const keyLight = new THREE.DirectionalLight(0xffffff, 2.5)
keyLight.position.set(4, 6, 5)
scene.add(keyLight)

const fillLight = new THREE.DirectionalLight(0x88aacc, 1.2)
fillLight.position.set(-5, 3, 2)
scene.add(fillLight)

const rimLight = new THREE.DirectionalLight(0x6699cc, 1.5)
rimLight.position.set(0, 2, -6)
scene.add(rimLight)

// Colored accent lights
const accent1 = new THREE.PointLight(0x4488ff, 5, 15)
accent1.position.set(3, 2, 3)
scene.add(accent1)

const accent2 = new THREE.PointLight(0x8844ff, 3, 12)
accent2.position.set(-3, 0, -2)
scene.add(accent2)

const bottomGlow = new THREE.PointLight(0x2266aa, 4, 10)
bottomGlow.position.set(0, -4, 2)
scene.add(bottomGlow)

// ══════════════════════════════════════════
// ── BACKGROUND GLOW SPHERE ──
// ══════════════════════════════════════════

const glowSphere = new THREE.Mesh(
  new THREE.SphereGeometry(4, 32, 32),
  new THREE.MeshBasicMaterial({
    color: 0x1a3355,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide
  })
)
glowSphere.position.set(0, 0, -2)
scene.add(glowSphere)

// ══════════════════════════════════════════
// ── GROUND GRID ──
// ══════════════════════════════════════════

const gridHelper = new THREE.GridHelper(20, 40, 0x1a2233, 0x0f1520)
gridHelper.position.y = -2.5
gridHelper.material.transparent = true
gridHelper.material.opacity = 0.3
scene.add(gridHelper)

// Ground plane with subtle reflection
const groundGeo = new THREE.PlaneGeometry(30, 30)
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x0a0f18,
  roughness: 0.6,
  metalness: 0.3,
  transparent: true,
  opacity: 0.5
})
const ground = new THREE.Mesh(groundGeo, groundMat)
ground.rotation.x = -Math.PI / 2
ground.position.y = -2.49
scene.add(ground)

// ══════════════════════════════════════════
// ── FLOATING PARTICLES ──
// ══════════════════════════════════════════

const particleCount = 200
const pGeo = new THREE.BufferGeometry()
const pPositions = new Float32Array(particleCount * 3)
const pSizes = new Float32Array(particleCount)

for (let i = 0; i < particleCount; i++) {
  pPositions[i * 3] = (Math.random() - 0.5) * 12
  pPositions[i * 3 + 1] = (Math.random() - 0.5) * 8
  pPositions[i * 3 + 2] = (Math.random() - 0.5) * 10
  pSizes[i] = Math.random() * 3 + 1
}

pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3))
pGeo.setAttribute('size', new THREE.BufferAttribute(pSizes, 1))

const pMat = new THREE.PointsMaterial({
  color: 0x6699cc,
  size: 0.04,
  transparent: true,
  opacity: 0.4,
  sizeAttenuation: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false
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

  // Helix pulse
  helixMesh.material.emissiveIntensity = 0.4 + Math.sin(t * 1.5) * 0.2

  // Particles drift
  const positions = particles.geometry.attributes.position.array
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3 + 1] += Math.sin(t * 0.3 + i) * 0.001
    positions[i * 3] += Math.cos(t * 0.2 + i * 0.5) * 0.0005
  }
  particles.geometry.attributes.position.needsUpdate = true

  // Accent lights pulse
  accent1.intensity = 4 + Math.sin(t * 0.8) * 1.5
  accent2.intensity = 2.5 + Math.cos(t * 0.6) * 1

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
