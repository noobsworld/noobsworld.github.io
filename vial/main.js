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
  helixColor: 0x88ccff,

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
// ── LIQUID (animated waves, caustics, bubbles) ──
// ══════════════════════════════════════════

const liquidH = CONFIG.vialHeight * CONFIG.liquidLevel
const liquidBaseY = -CONFIG.vialHeight / 2 + 0.15
const liquidTopR = THREE.MathUtils.lerp(CONFIG.vialBotRadius, CONFIG.vialTopRadius, CONFIG.liquidLevel) * 0.92

// Custom liquid geometry with wave displacement
const LIQUID_SEGMENTS = 64
const LIQUID_RINGS = 24
const liqGeo = new THREE.CylinderGeometry(liquidTopR, CONFIG.vialBotRadius * 0.88, liquidH, LIQUID_SEGMENTS, LIQUID_RINGS, true)

// Vertex shader: animate surface waves
const liquidVertShader = `
  uniform float uTime;
  uniform float uWaveAmp;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vWaveHeight;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float dist = length(pos.xz);
    float angle = atan(pos.z, pos.x);

    // Multi-frequency surface waves (stronger near edges)
    float edgeFactor = smoothstep(0.0, 1.0, dist / 0.55);
    float wave1 = sin(angle * 3.0 + uTime * 1.2) * 0.025;
    float wave2 = sin(angle * 5.0 - uTime * 0.8 + 1.5) * 0.015;
    float wave3 = cos(angle * 2.0 + uTime * 1.7 + 0.7) * 0.01;
    float wave4 = sin(dist * 8.0 - uTime * 2.0) * 0.008;

    float totalWave = (wave1 + wave2 + wave3 + wave4) * edgeFactor * uWaveAmp;

    // Only displace top portion of liquid (surface region)
    float topFactor = smoothstep(pos.y - 0.3, pos.y + 0.1, 0.0);
    pos.y += totalWave * topFactor;

    // Subtle internal slosh
    float slosh = sin(uTime * 0.7 + angle) * 0.005 * (1.0 - topFactor);
    pos.x += slosh;

    vWaveHeight = totalWave * topFactor;
    vNormal = normalMatrix * normal;
    vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

// Fragment shader: colorful volumetric liquid with caustics
const liquidFragShader = `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vWaveHeight;

  void main() {
    // Depth-based color gradient (bottom dark, top bright)
    float depth = smoothstep(-1.5, 0.5, vWorldPos.y);
    vec3 baseColor = mix(uColor1, uColor2, depth);

    // Iridescent fresnel-like rim
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = 1.0 - max(dot(normalize(vNormal), viewDir), 0.0);
    fresnel = pow(fresnel, 2.5);
    vec3 iridescence = uColor3 * fresnel * 0.6;

    // Animated caustic pattern
    float cx = vWorldPos.x * 4.0 + uTime * 0.3;
    float cy = vWorldPos.z * 4.0 + uTime * 0.2;
    float caustic1 = sin(cx * 3.14 + cy * 2.7 + uTime) * 0.5 + 0.5;
    float caustic2 = sin(cx * 2.3 - cy * 3.5 + uTime * 1.3) * 0.5 + 0.5;
    float caustic = caustic1 * caustic2;
    caustic = pow(caustic, 3.0) * 0.35;

    // Wave highlight on surface
    float waveHighlight = smoothstep(0.01, 0.03, vWaveHeight) * 0.2;

    // Internal glow from bottom
    float bottomGlow = exp(-abs(vWorldPos.y + 1.2) * 2.0) * 0.15;

    vec3 finalColor = baseColor + iridescence + vec3(caustic) + vec3(waveHighlight) + uColor3 * bottomGlow;

    // Subtle volumetric depth fog
    float depthFog = smoothstep(-1.5, 0.5, vWorldPos.y) * 0.15;
    finalColor = mix(finalColor * 0.7, finalColor, 1.0 - depthFog);

    gl_FragColor = vec4(finalColor, uOpacity);
  }
`

const liquidMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uWaveAmp: { value: 1.0 },
    uColor1: { value: new THREE.Color(0x0a2a5c) },   // deep navy bottom
    uColor2: { value: new THREE.Color(0x2288cc) },   // bright cyan mid
    uColor3: { value: new THREE.Color(0x44eeff) },   // iridescent teal highlight
    uOpacity: { value: 0.75 }
  },
  vertexShader: liquidVertShader,
  fragmentShader: liquidFragShader,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false
})

const liquidMesh = new THREE.Mesh(liqGeo, liquidMat)
liquidMesh.position.y = liquidBaseY + liquidH / 2
scene.add(liquidMesh)

// Liquid bottom cap (solid disc)
const liquidBottomGeo = new THREE.CircleGeometry(CONFIG.vialBotRadius * 0.88, 48)
const liquidBottomMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0x0a2a5c) },
    uOpacity: { value: 0.8 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uTime;
    uniform float uOpacity;
    varying vec2 vUv;
    void main() {
      float r = length(vUv - 0.5) * 2.0;
      float glow = 1.0 - smoothstep(0.0, 1.0, r);
      float caustic = sin(vUv.x * 12.0 + uTime) * sin(vUv.y * 12.0 + uTime * 0.7) * 0.5 + 0.5;
      caustic = pow(caustic, 4.0) * 0.3;
      vec3 col = uColor * (0.6 + glow * 0.4 + caustic);
      gl_FragColor = vec4(col, uOpacity);
    }
  `,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false
})
const liquidBottom = new THREE.Mesh(liquidBottomGeo, liquidBottomMat)
liquidBottom.rotation.x = -Math.PI / 2
liquidBottom.position.y = liquidBaseY + 0.01
scene.add(liquidBottom)

// Animated surface meniscus
const meniscusGeo = new THREE.CircleGeometry(liquidTopR, 48)
const meniscusMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color(0x2288cc) },
    uColor2: { value: new THREE.Color(0x44eeff) },
    uOpacity: { value: 0.6 }
  },
  vertexShader: `
    uniform float uTime;
    varying vec2 vUv;
    varying float vWave;

    void main() {
      vUv = uv;
      vec3 pos = position;
      float dist = length(pos.xy);
      float angle = atan(pos.y, pos.x);

      // Surface wave displacement
      float w1 = sin(angle * 3.0 + uTime * 1.2) * 0.02;
      float w2 = sin(angle * 5.0 - uTime * 0.8) * 0.012;
      float w3 = cos(dist * 10.0 - uTime * 1.5) * 0.006;
      float wave = (w1 + w2 + w3) * smoothstep(0.0, 0.5, dist);

      // Meniscus curve (edges slightly higher due to surface tension)
      float meniscusCurve = pow(dist / 0.55, 2.0) * 0.02;

      pos.z = wave + meniscusCurve;
      vWave = wave;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform float uTime;
    uniform float uOpacity;
    varying vec2 vUv;
    varying float vWave;

    void main() {
      float dist = length(vUv - 0.5) * 2.0;
      vec3 base = mix(uColor2, uColor1, dist);

      // Caustic shimmer
      float c = sin(vUv.x * 15.0 + uTime * 0.8) * sin(vUv.y * 13.0 + uTime * 0.6);
      c = pow(c * 0.5 + 0.5, 4.0) * 0.25;

      // Wave highlights
      float highlight = smoothstep(0.01, 0.025, vWave) * 0.3;

      vec3 col = base + vec3(c) + vec3(highlight);

      // Edge transparency (meniscus fades at glass boundary)
      float edgeFade = 1.0 - smoothstep(0.85, 1.0, dist);

      gl_FragColor = vec4(col, uOpacity * edgeFade);
    }
  `,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false
})
const meniscusMesh = new THREE.Mesh(meniscusGeo, meniscusMat)
meniscusMesh.rotation.x = -Math.PI / 2
meniscusMesh.position.y = liquidBaseY + liquidH
scene.add(meniscusMesh)

// Rising bubbles
const BUBBLE_COUNT = 35
const bubbles = []
const bubbleGeo = new THREE.SphereGeometry(1, 12, 12)

for (let i = 0; i < BUBBLE_COUNT; i++) {
  const scale = 0.012 + Math.random() * 0.025
  const bubble = new THREE.Mesh(bubbleGeo, new THREE.MeshPhysicalMaterial({
    color: 0x88ddff,
    transparent: true,
    opacity: 0.3 + Math.random() * 0.2,
    roughness: 0.0,
    metalness: 0.0,
    transmission: 0.8,
    thickness: 0.02,
    ior: 1.33,
    envMapIntensity: 0.5,
    depthWrite: false
  }))

  const angle = Math.random() * Math.PI * 2
  const radius = Math.random() * liquidTopR * 0.7
  bubble.scale.setScalar(scale)
  bubble.position.set(
    Math.cos(angle) * radius,
    liquidBaseY + Math.random() * liquidH,
    Math.sin(angle) * radius
  )
  bubble.userData = {
    speed: 0.15 + Math.random() * 0.3,
    radius,
    angle,
    wobbleSpeed: 1.0 + Math.random() * 2.0,
    wobbleAmp: 0.01 + Math.random() * 0.02,
    baseY: bubble.position.y
  }
  scene.add(bubble)
  bubbles.push(bubble)
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

const all = [vialMesh, vialEdges, capMesh, capEdges, liquidMesh, meniscusMesh, helixMesh, helixWire, hLine, vLine, liquidBottom]

function animate(time) {
  requestAnimationFrame(animate)
  const t = time * 0.001

  // Floating motion
  const floatY = Math.sin(t * 0.5) * 0.06
  all.forEach(obj => { obj.position.y = (obj.position.y || 0) + (obj === vialMesh ? floatY - obj.position.y : 0) })

  // Liquid shader time
  liquidMat.uniforms.uTime.value = t
  liquidBottomMat.uniforms.uTime.value = t
  meniscusMat.uniforms.uTime.value = t

  // Animate bubbles rising
  for (const b of bubbles) {
    const d = b.userData
    d.angle += Math.sin(t * d.wobbleSpeed) * 0.02
    b.position.x = Math.cos(d.angle) * d.radius + Math.sin(t * d.wobbleSpeed) * d.wobbleAmp
    b.position.z = Math.sin(d.angle) * d.radius + Math.cos(t * d.wobbleSpeed * 0.7) * d.wobbleAmp
    b.position.y += d.speed * 0.016
    // Reset when reaching surface
    if (b.position.y > liquidBaseY + liquidH - 0.05) {
      b.position.y = liquidBaseY + 0.05 + Math.random() * 0.2
      d.angle = Math.random() * Math.PI * 2
      d.radius = Math.random() * liquidTopR * 0.7
    }
  }

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
