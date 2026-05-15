import * as THREE from 'three'

// ══════════════════════════════════════════
// ── CONFIGURATION ──
// ══════════════════════════════════════════

const CONFIG = {
  // Rotation
  rotationSpeed: 0.08,           // Radians per second (~8s per rotation)

  // Vial dimensions
  vialHeight: 3.2,
  vialTopRadius: 0.55,
  vialBotRadius: 0.45,
  vialNeckRadius: 0.22,
  vialNeckHeight: 0.6,
  vialSegments: 32,

  // Glass material
  glassColor: 0xffffff,
  glassTransmission: 0.95,
  glassThickness: 0.05,
  glassRoughness: 0.05,
  glassIOR: 1.52,               // Index of refraction for glass
  glassClearcoat: 1.0,
  glassClearcoatRoughness: 0.05,

  // Liquid
  liquidLevel: 0.65,             // Fill percentage (0-1)
  liquidColor: 0x88ccff,
  liquidOpacity: 0.6,

  // Peptide helix
  helixTurns: 3,
  helixRadius: 0.22,
  helixHeight: 1.6,
  helixSegments: 128,
  helixTubeRadius: 0.025,
  helixColor: 0xaaddff,

  // Lighting
  ambientIntensity: 0.3,
  dirIntensity: 0.8,
  rimIntensity: 0.4,

  // Camera
  cameraDistance: 6,
  cameraHeight: 0.5
}

// ══════════════════════════════════════════
// ── SCENE SETUP ──
// ══════════════════════════════════════════

const container = document.getElementById('canvas-container')
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x0c0c0c)

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, CONFIG.cameraHeight, CONFIG.cameraDistance)
camera.lookAt(0, 0, 0)

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2
container.appendChild(renderer.domElement)

// ══════════════════════════════════════════
// ── LIGHTING (minimal, dark HUD style) ──
// ══════════════════════════════════════════

const ambientLight = new THREE.AmbientLight(0x404050, CONFIG.ambientIntensity)
scene.add(ambientLight)

const dirLight = new THREE.DirectionalLight(0xffffff, CONFIG.dirIntensity)
dirLight.position.set(3, 5, 4)
scene.add(dirLight)

const rimLight = new THREE.DirectionalLight(0x88aacc, CONFIG.rimIntensity)
rimLight.position.set(-4, 2, -3)
scene.add(rimLight)

// ══════════════════════════════════════════
// ── GLASS VIAL ──
// ══════════════════════════════════════════

function createVialProfile() {
  const points = []
  const h = CONFIG.vialHeight
  const topR = CONFIG.vialTopRadius
  const botR = CONFIG.vialBotRadius
  const neckR = CONFIG.vialNeckRadius
  const neckH = CONFIG.vialNeckHeight

  // Bottom curve (rounded)
  for (let i = 0; i <= 8; i++) {
    const t = i / 8
    const y = -h / 2 + t * 0.3
    const r = botR * Math.sin(t * Math.PI * 0.5) + 0.02
    points.push(new THREE.Vector2(r, y))
  }

  // Body (slightly tapered)
  for (let i = 0; i <= 16; i++) {
    const t = i / 16
    const y = -h / 2 + 0.3 + t * (h - neckH - 0.6)
    const r = THREE.MathUtils.lerp(botR + 0.02, topR, t)
    points.push(new THREE.Vector2(r, y))
  }

  // Shoulder taper to neck
  for (let i = 0; i <= 8; i++) {
    const t = i / 8
    const y = h / 2 - neckH + t * 0.2
    const r = THREE.MathUtils.lerp(topR, neckR, t)
    points.push(new THREE.Vector2(r, y))
  }

  // Neck
  for (let i = 0; i <= 8; i++) {
    const t = i / 8
    const y = h / 2 - neckH + 0.2 + t * (neckH - 0.2)
    const r = neckR
    points.push(new THREE.Vector2(r, y))
  }

  // Rim (slight flare)
  for (let i = 0; i <= 4; i++) {
    const t = i / 4
    const y = h / 2 + t * 0.08
    const r = neckR + t * 0.06
    points.push(new THREE.Vector2(r, y))
  }

  return points
}

const vialProfile = createVialProfile()
const vialGeo = new THREE.LatheGeometry(vialProfile, CONFIG.vialSegments)

const glassMat = new THREE.MeshPhysicalMaterial({
  color: CONFIG.glassColor,
  transmission: CONFIG.glassTransmission,
  thickness: CONFIG.glassThickness,
  roughness: CONFIG.glassRoughness,
  ior: CONFIG.glassIOR,
  clearcoat: CONFIG.glassClearcoat,
  clearcoatRoughness: CONFIG.glassClearcoatRoughness,
  transparent: true,
  opacity: 0.35,
  side: THREE.DoubleSide,
  envMapIntensity: 0.5
})

const vialMesh = new THREE.Mesh(vialGeo, glassMat)
scene.add(vialMesh)

// ══════════════════════════════════════════
// ── CONTOUR / EDGE LINES ──
// ══════════════════════════════════════════

const edgesGeo = new THREE.EdgesGeometry(vialGeo, 15)
const edgesMat = new THREE.LineBasicMaterial({ color: 0x334455, transparent: true, opacity: 0.3 })
const vialEdges = new THREE.LineSegments(edgesGeo, edgesMat)
scene.add(vialEdges)

// Horizontal contour rings
const contourCount = 8
for (let i = 0; i < contourCount; i++) {
  const t = (i + 1) / (contourCount + 1)
  const y = -CONFIG.vialHeight / 2 + t * CONFIG.vialHeight
  const r = THREE.MathUtils.lerp(CONFIG.vialBotRadius, CONFIG.vialTopRadius, t) * 1.01
  const ringGeo = new THREE.TorusGeometry(r, 0.003, 4, 64)
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x223344, transparent: true, opacity: 0.2 })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.rotation.x = Math.PI / 2
  ring.position.y = y
  scene.add(ring)
}

// ══════════════════════════════════════════
// ── CAP ──
// ══════════════════════════════════════════

const capGeo = new THREE.CylinderGeometry(0.28, 0.26, 0.25, 32)
const capMat = new THREE.MeshPhysicalMaterial({
  color: 0x1a1a2e,
  metalness: 0.8,
  roughness: 0.3,
  clearcoat: 0.5
})
const capMesh = new THREE.Mesh(capGeo, capMat)
capMesh.position.y = CONFIG.vialHeight / 2 + 0.08
scene.add(capMesh)

// Cap edge
const capEdges = new THREE.LineSegments(
  new THREE.EdgesGeometry(capGeo),
  new THREE.LineBasicMaterial({ color: 0x334455, transparent: true, opacity: 0.4 })
)
capEdges.position.copy(capMesh.position)
scene.add(capEdges)

// ══════════════════════════════════════════
// ── LIQUID ──
// ══════════════════════════════════════════

const liquidH = CONFIG.vialHeight * CONFIG.liquidLevel
const liquidY = -CONFIG.vialHeight / 2 + liquidH / 2 + 0.1
const liquidTopR = THREE.MathUtils.lerp(CONFIG.vialBotRadius, CONFIG.vialTopRadius, CONFIG.liquidLevel) * 0.92

const liquidGeo = new THREE.CylinderGeometry(liquidTopR, CONFIG.vialBotRadius * 0.9, liquidH, 32)
const liquidMat = new THREE.MeshPhysicalMaterial({
  color: CONFIG.liquidColor,
  transparent: true,
  opacity: CONFIG.liquidOpacity,
  roughness: 0.1,
  transmission: 0.3,
  thickness: 0.1,
  ior: 1.33
})
const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat)
liquidMesh.position.y = liquidY
scene.add(liquidMesh)

// Meniscus (curved liquid surface)
const meniscusGeo = new THREE.SphereGeometry(liquidTopR, 32, 8, 0, Math.PI * 2, 0, Math.PI * 0.3)
const meniscusMat = new THREE.MeshPhysicalMaterial({
  color: CONFIG.liquidColor,
  transparent: true,
  opacity: 0.5,
  roughness: 0.05,
  transmission: 0.4,
  thickness: 0.05,
  side: THREE.DoubleSide
})
const meniscusMesh = new THREE.Mesh(meniscusGeo, meniscusMat)
meniscusMesh.position.y = liquidY + liquidH / 2 - 0.02
meniscusMesh.rotation.x = Math.PI
scene.add(meniscusMesh)

// ══════════════════════════════════════════
// ── PEPTIDE HELIX ──
// ══════════════════════════════════════════

function createHelixPath(turns, radius, height, segments) {
  const points = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const angle = t * turns * Math.PI * 2
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    const y = -height / 2 + t * height
    points.push(new THREE.Vector3(x, y, z))
  }
  return new THREE.CatmullRomCurve3(points)
}

const helixPath = createHelixPath(
  CONFIG.helixTurns,
  CONFIG.helixRadius,
  CONFIG.helixHeight,
  CONFIG.helixSegments
)

const helixGeo = new THREE.TubeGeometry(helixPath, CONFIG.helixSegments, CONFIG.helixTubeRadius, 8, false)
const helixMat = new THREE.MeshPhysicalMaterial({
  color: CONFIG.helixColor,
  emissive: 0x224466,
  emissiveIntensity: 0.3,
  metalness: 0.2,
  roughness: 0.4,
  transparent: true,
  opacity: 0.85
})
const helixMesh = new THREE.Mesh(helixGeo, helixMat)
helixMesh.position.y = -0.2
scene.add(helixMesh)

// Helix wireframe overlay
const helixWireGeo = new THREE.TubeGeometry(helixPath, CONFIG.helixSegments, CONFIG.helixTubeRadius * 1.5, 6, false)
const helixWireMat = new THREE.MeshBasicMaterial({
  color: 0x66aadd,
  wireframe: true,
  transparent: true,
  opacity: 0.15
})
const helixWireMesh = new THREE.Mesh(helixWireGeo, helixWireMat)
helixWireMesh.position.y = -0.2
scene.add(helixWireMesh)

// Side chains (small spheres along helix)
const chainCount = 12
for (let i = 0; i < chainCount; i++) {
  const t = (i + 0.5) / chainCount
  const point = helixPath.getPoint(t)
  const tangent = helixPath.getTangent(t)

  const chainGeo = new THREE.SphereGeometry(0.035, 8, 8)
  const chainMat = new THREE.MeshPhysicalMaterial({
    color: 0xaaddff,
    emissive: 0x336688,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.7
  })
  const chainMesh = new THREE.Mesh(chainGeo, chainMat)
  chainMesh.position.copy(point).add(tangent.clone().multiplyScalar(0.08))
  chainMesh.position.y -= 0.2
  scene.add(chainMesh)
}

// ══════════════════════════════════════════
// ── HUD OVERLAY ELEMENTS ──
// ══════════════════════════════════════════

// Subtle crosshair lines
const crosshairMat = new THREE.LineBasicMaterial({ color: 0x223344, transparent: true, opacity: 0.15 })

const hLineGeo = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-2.5, 0, 0), new THREE.Vector3(2.5, 0, 0)
])
const hLine = new THREE.Line(hLineGeo, crosshairMat)
scene.add(hLine)

const vLineGeo = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0, -2, 0), new THREE.Vector3(0, 2, 0)
])
const vLine = new THREE.Line(vLineGeo, crosshairMat)
scene.add(vLine)

// ══════════════════════════════════════════
// ── ANIMATION ──
// ══════════════════════════════════════════

const vialGroup = new THREE.Group()
// Add all objects to a group for rotation
[vialMesh, vialEdges, capMesh, capEdges, liquidMesh, meniscusMesh, helixMesh, helixWireMesh, hLine, vLine].forEach(obj => {
  vialGroup.add(obj.clone ? obj : obj)
})

// Actually, let's just rotate the scene objects directly
const rotatables = [vialMesh, vialEdges, capMesh, capEdges, liquidMesh, meniscusMesh, helixMesh, helixWireMesh, hLine, vLine]

function animate(time) {
  requestAnimationFrame(animate)

  const dt = time * 0.001
  const angle = dt * CONFIG.rotationSpeed

  rotatables.forEach(obj => {
    obj.rotation.y += angle
  })

  // Subtle floating motion
  const floatY = Math.sin(time * 0.0005) * 0.05
  rotatables.forEach(obj => {
    obj.position.y = (obj.position.y || 0) + (obj === vialMesh ? floatY - obj.position.y : 0)
  })

  renderer.render(scene, camera)
}

animate(0)

// ══════════════════════════════════════════
// ── RESIZE HANDLER ──
// ══════════════════════════════════════════

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
