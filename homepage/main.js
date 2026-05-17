import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

// ══════════════════════════════════════════
// ── HERO 3D BACKGROUND ──
// ══════════════════════════════════════════

const hero = document.querySelector('.hero')
const heroWrapper = document.createElement('div')
heroWrapper.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:-1;opacity:0.35;'
hero.insertBefore(heroWrapper, hero.firstChild)

const heroRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
heroRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
heroWrapper.appendChild(heroRenderer.domElement)

const heroScene = new THREE.Scene()
const heroCamera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
heroCamera.position.z = 12

const heroSize = () => {
  const w = hero.offsetWidth
  const h = hero.offsetHeight
  heroRenderer.setSize(w, h)
  heroCamera.aspect = w / h
  heroCamera.updateProjectionMatrix()
}
heroSize()

// Floating geometry
const shapes = []
const shapeGeos = [
  new THREE.IcosahedronGeometry(0.6, 1),
  new THREE.TorusKnotGeometry(0.5, 0.2, 48, 12),
  new THREE.OctahedronGeometry(0.55),
  new THREE.TorusGeometry(0.5, 0.18, 24, 48),
  new THREE.DodecahedronGeometry(0.5),
]

const palette = [0x4a9eff, 0x00ffcc, 0x6688ff, 0x44ddff, 0x8888ff]
for (let i = 0; i < 20; i++) {
  const geo = shapeGeos[i % shapeGeos.length]
  const mat = new THREE.MeshStandardMaterial({
    color: palette[i % palette.length],
    emissive: palette[i % palette.length],
    emissiveIntensity: 0.15,
    metalness: 0.3,
    roughness: 0.4,
    transparent: true,
    opacity: 0.5 + Math.random() * 0.3,
  })
  const mesh = new THREE.Mesh(geo, mat)
  const angle = Math.random() * Math.PI * 2
  const radius = 3 + Math.random() * 5
  mesh.position.set(
    Math.cos(angle) * radius,
    (Math.random() - 0.5) * 6,
    (Math.random() - 0.5) * 6 - 2
  )
  mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6)
  mesh.userData = {
    rotSpeed: { x: (Math.random() - 0.5) * 0.01, y: (Math.random() - 0.5) * 0.01, z: (Math.random() - 0.5) * 0.01 },
    floatSpeed: 0.3 + Math.random() * 0.5,
    floatOffset: Math.random() * 6,
    baseY: mesh.position.y,
  }
  heroScene.add(mesh)
  shapes.push(mesh)

  // Wireframe overlay
  const wireMat = new THREE.MeshBasicMaterial({
    color: palette[i % palette.length],
    wireframe: true,
    transparent: true,
    opacity: 0.15,
  })
  const wire = new THREE.Mesh(geo.clone(), wireMat)
  wire.position.copy(mesh.position)
  wire.rotation.copy(mesh.rotation)
  wire.scale.multiplyScalar(1.02)
  wire.userData = mesh.userData
  heroScene.add(wire)
  shapes.push(wire)
}

// Particles
const particleCount = 800
const positions = new Float32Array(particleCount * 3)
const colors = new Float32Array(particleCount * 3)
for (let i = 0; i < particleCount; i++) {
  const i3 = i * 3
  positions[i3] = (Math.random() - 0.5) * 20
  positions[i3 + 1] = (Math.random() - 0.5) * 12
  positions[i3 + 2] = (Math.random() - 0.5) * 15 - 3
  const c = new THREE.Color(palette[i % palette.length])
  colors[i3] = c.r
  colors[i3 + 1] = c.g
  colors[i3 + 2] = c.b
}
const particleGeo = new THREE.BufferGeometry()
particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
const particleMat = new THREE.PointsMaterial({
  size: 0.04,
  vertexColors: true,
  transparent: true,
  opacity: 0.6,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
})
const particles = new THREE.Points(particleGeo, particleMat)
heroScene.add(particles)

// Lighting
const heroAmbient = new THREE.AmbientLight(0x112244, 0.5)
heroScene.add(heroAmbient)
const heroKey = new THREE.DirectionalLight(0x4488ff, 1.5)
heroKey.position.set(2, 5, 4)
heroScene.add(heroKey)
const heroFill = new THREE.DirectionalLight(0x00ffcc, 0.5)
heroFill.position.set(-3, 2, 3)
heroScene.add(heroFill)

// Composer with bloom
const heroComposer = new EffectComposer(heroRenderer)
heroComposer.addPass(new RenderPass(heroScene, heroCamera))
const heroBloom = new UnrealBloomPass(
  new THREE.Vector2(hero.offsetWidth, hero.offsetHeight),
  0.4,
  0.5,
  0.1
)
heroComposer.addPass(heroBloom)

// Mouse tracking for parallax
let mouseX = 0
let mouseY = 0
let targetMouseX = 0
let targetMouseY = 0
document.addEventListener('mousemove', (e) => {
  const rect = hero.getBoundingClientRect()
  targetMouseX = (e.clientX / rect.width - 0.5) * 2
  targetMouseY = (e.clientY / rect.height - 0.5) * 2
})

// ══════════════════════════════════════════
// ── CARD 3D PREVIEWS ──
// ══════════════════════════════════════════

function createPreviewRenderer(container) {
  const rect = container.getBoundingClientRect()
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'width:100%;height:100%;display:block;'
  container.appendChild(canvas)
  container.querySelector('.icon')?.remove()

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(rect.width, rect.height)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(40, rect.width / rect.height, 0.1, 20)
  camera.position.set(0, 0, 5)
  camera.lookAt(0, 0, 0)

  return { renderer, scene, camera, canvas }
}

// Spinner preview
const spinnerPreviewContainer = document.querySelector('.card[href*="spinner"] .card-preview')
let spinnerPreview = null
if (spinnerPreviewContainer) {
  spinnerPreview = createPreviewRenderer(spinnerPreviewContainer)
  const s = spinnerPreview.scene
  s.add(new THREE.AmbientLight(0x446688, 0.6))
  const sl = new THREE.DirectionalLight(0xffffff, 2)
  sl.position.set(2, 4, 3)
  s.add(sl)

  const armMat = new THREE.MeshStandardMaterial({
    color: 0x4488cc,
    metalness: 0.7,
    roughness: 0.3,
    emissive: 0x224466,
    emissiveIntensity: 0.2,
  })
  const weightMat = new THREE.MeshStandardMaterial({
    color: 0x66aaff,
    metalness: 0.9,
    roughness: 0.2,
    emissive: 0x4488cc,
    emissiveIntensity: 0.3,
  })
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    metalness: 0.8,
    roughness: 0.25,
    emissive: 0x4488cc,
    emissiveIntensity: 0.15,
  })

  const spinnerGroup = new THREE.Group()
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 6), armMat)
    arm.position.set(Math.sin(angle) * 0.5, 0, Math.cos(angle) * 0.5)
    arm.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle))
    )
    spinnerGroup.add(arm)
    const weight = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.2, 12), weightMat)
    weight.position.set(Math.sin(angle) * 1.0, 0, Math.cos(angle) * 1.0)
    spinnerGroup.add(weight)
  }
  const center = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.1, 16), capMat)
  center.position.y = 0
  spinnerGroup.add(center)

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 12), capMat)
  cap.position.y = 0.075
  spinnerGroup.add(cap)

  s.add(spinnerGroup)
  spinnerPreview.group = spinnerGroup
}

// Vial preview
const vialPreviewContainer = document.querySelector('.card[href*="vial"] .card-preview')
let vialPreview = null
if (vialPreviewContainer) {
  vialPreview = createPreviewRenderer(vialPreviewContainer)
  const s = vialPreview.scene
  s.add(new THREE.AmbientLight(0x224466, 0.5))
  const vl = new THREE.DirectionalLight(0x88ddff, 1.5)
  vl.position.set(2, 3, 3)
  s.add(vl)
  const vr = new THREE.DirectionalLight(0x44aacc, 0.6)
  vr.position.set(-2, 1, 2)
  s.add(vr)

  const vialGroup = new THREE.Group()

  // Glass tube
  const tubeMat = new THREE.MeshPhysicalMaterial({
    color: 0x88ccdd,
    transparent: true,
    opacity: 0.45,
    roughness: 0.15,
    metalness: 0.1,
    clearcoat: 0.5,
    clearcoatRoughness: 0.1,
    side: THREE.DoubleSide,
    envMapIntensity: 0.6,
    specularIntensity: 0.4,
  })
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32, 1, true),
    tubeMat
  )
  tube.renderOrder = 1
  vialGroup.add(tube)

  // Liquid
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: 0x00ffcc,
    emissive: 0x00ffcc,
    emissiveIntensity: 0.3,
    metalness: 0.1,
    roughness: 0.3,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  })
  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.42, 0.8, 24),
    liquidMat
  )
  liquid.position.y = -0.15
  liquid.renderOrder = 0
  vialGroup.add(liquid)

  // Cap
  const capMat2 = new THREE.MeshPhysicalMaterial({
    color: 0x334466,
    metalness: 0.6,
    roughness: 0.3,
  })
  const cap2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.18, 0.15, 16),
    capMat2
  )
  cap2.position.y = 0.8
  vialGroup.add(cap2)

  // Bottom rim
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.04, 8, 24),
    new THREE.MeshStandardMaterial({ color: 0x445566, metalness: 0.5, roughness: 0.4 })
  )
  rim.position.y = -0.75
  rim.rotation.x = Math.PI / 2
  vialGroup.add(rim)

  s.add(vialGroup)
  vialPreview.group = vialGroup
}

// ══════════════════════════════════════════
// ── ANIMATION ──
// ══════════════════════════════════════════

function animate(time) {
  requestAnimationFrame(animate)
  const t = time * 0.001

  // Mouse parallax smoothing
  mouseX += (targetMouseX - mouseX) * 0.05
  mouseY += (targetMouseY - mouseY) * 0.05

  // Update hero shapes
  for (const mesh of shapes) {
    const d = mesh.userData
    mesh.rotation.x += d.rotSpeed.x
    mesh.rotation.y += d.rotSpeed.y
    mesh.rotation.z += d.rotSpeed.z
    mesh.position.y = d.baseY + Math.sin(t * d.floatSpeed + d.floatOffset) * 0.5
  }

  // Particles drift
  const pos = particles.geometry.attributes.position.array
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3
    pos[i3 + 1] += Math.sin(t * 0.2 + i) * 0.0005
    if (pos[i3 + 1] > 6) pos[i3 + 1] = -6
  }
  particles.geometry.attributes.position.needsUpdate = true

  // Camera orbit via mouse
  heroCamera.position.x = Math.sin(mouseX * 0.3) * 12
  heroCamera.position.z = 12 + mouseY * 1.5
  heroCamera.lookAt(0, 0, 0)

  heroComposer.render()

  // Card previews
  if (spinnerPreview) {
    spinnerPreview.group.rotation.y += 0.02
    spinnerPreview.renderer.render(spinnerPreview.scene, spinnerPreview.camera)
  }
  if (vialPreview) {
    vialPreview.group.rotation.y += 0.015
    vialPreview.group.rotation.x = Math.sin(t * 0.3) * 0.05
    vialPreview.renderer.render(vialPreview.scene, vialPreview.camera)
  }
}

animate(0)

// ══════════════════════════════════════════
// ── RESIZE ──
// ══════════════════════════════════════════

function resizePreview(pv) {
  if (!pv) return
  const w = pv.canvas.parentElement.clientWidth
  const h = pv.canvas.parentElement.clientHeight
  if (w > 0 && h > 0) {
    pv.renderer.setSize(w, h)
    pv.camera.aspect = w / h
    pv.camera.updateProjectionMatrix()
  }
}

const resizeObserver = new ResizeObserver(() => {
  heroSize()
  heroComposer.setSize(hero.offsetWidth, hero.offsetHeight)
  heroBloom.resolution.set(hero.offsetWidth, hero.offsetHeight)
  resizePreview(spinnerPreview)
  resizePreview(vialPreview)
})
resizeObserver.observe(hero)
// Also observe body for card reflows
document.querySelectorAll('.card-preview').forEach(el => resizeObserver.observe(el))
