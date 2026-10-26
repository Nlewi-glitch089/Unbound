import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* =====================================================================
   1. CUBE DATA
   Each face has its own local axes: X = right, Y = up, Z = outward normal.
   ===================================================================== */
const FACES = {
  U: { X: [1, 0, 0],  Y: [0, 0, -1], Z: [0, 1, 0],  color: '#f4f4f0' },
  D: { X: [1, 0, 0],  Y: [0, 0, 1],  Z: [0, -1, 0], color: '#ffd500' },
  F: { X: [1, 0, 0],  Y: [0, 1, 0],  Z: [0, 0, 1],  color: '#009b48' },
  B: { X: [-1, 0, 0], Y: [0, 1, 0],  Z: [0, 0, -1], color: '#0046ad' },
  L: { X: [0, 0, 1],  Y: [0, 1, 0],  Z: [-1, 0, 0], color: '#ff5800' },
  R: { X: [0, 0, -1], Y: [0, 1, 0],  Z: [1, 0, 0],  color: '#c41e3a' },
};

const PALETTES = [
  { name: 'Neon',      colors: ['#39ff14', '#ff2bd6', '#00e5ff', '#fff01f', '#ff6b00', '#8a2bff', '#00ffa3'] },
  { name: 'Pastel',    colors: ['#fbe7c6', '#b4f8c8', '#a0e7e5', '#ffaebc', '#cdb4db', '#ffd6a5', '#caffbf'] },
  { name: 'Sunset',    colors: ['#ffcd74', '#ff9e5e', '#ff6f61', '#e84a7a', '#a23b9a', '#5b2a86'] },
  { name: 'Cyberpunk', colors: ['#fcee0a', '#00f0ff', '#ff003c', '#711c91', '#ea00d9', '#0abdc6', '#133e7c'] },
  { name: 'Candy',     colors: ['#ff8fab', '#ffb3c6', '#a2d2ff', '#bde0fe', '#cdb4db', '#fdffb6', '#9bf6ff'] },
];

const SPACING = 1.02;       // distance between cubie centers
const CUBIE = 0.96;         // cubie size
const TILE = 0.9;           // tile backing size
const TILE_DEPTH = 0.07;
const STICKER = 0.8;
const TILE_OFFSET = CUBIE / 2 + TILE_DEPTH / 2 + 0.004; // cubie center → tile center
const DEG = Math.PI / 180;

const QUIPS = {
  mix: ['Shaken, not solved.', 'A little crooked. On purpose.', 'Your cube is having a moment.', 'That one tile is judging you.'],
  break: ['Oops. All pieces.', 'Gravity filed a complaint.', 'The cube needed some space.', 'Nobody tell Ernő Rubik.'],
  color: ['Fresh paint, same chaos.', 'Colors? Optional.', 'Now in extra loud.', 'Taste the geometry.'],
  undo: ['Rewound one bad idea.', 'Time travel successful.'],
  reset: ['Back to boring. For now.', 'Reality restored. Reluctantly.'],
  twist: ['Twisted.', 'That tile has opinions now.', 'Off the grid.', 'Nice angle.'],
};
const LEVELS = [
  { at: 0, text: 'Suspiciously Normal' },
  { at: 0.25, text: "Something's Off" },
  { at: 0.5, text: 'Geometry Is Concerned' },
  { at: 0.75, text: 'The Cube Has Left Reality' },
  { at: 0.985, text: 'PHYSICS HAS LEFT THE CHAT' },
];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (amp) => (Math.random() * 2 - 1) * amp;
const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

/* =====================================================================
   2. THREE.JS SETUP
   ===================================================================== */
const stage = document.getElementById('stage');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
} catch (err) {
  stage.innerHTML = '<p class="error">This browser could not start WebGL, which the 3D cube needs. Try another browser or turn on hardware acceleration.</p>';
  throw err;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
camera.position.set(7.2, 5.4, 9.0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minDistance = 4;
controls.maxDistance = 26;
controls.autoRotate = true;           // drift until the visitor takes over
controls.autoRotateSpeed = 0.7;
controls.addEventListener('start', () => (controls.autoRotate = false));

scene.add(new THREE.AmbientLight(0xffffff, 0.35));
scene.add(new THREE.HemisphereLight(0xd6e4ff, 0x1b1030, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.7);
sun.position.set(6, 10, 7);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.bias = -0.0004;
Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30 });
scene.add(sun);
const purple = new THREE.PointLight(0x8a5cff, 30);
purple.position.set(-6, -2, -5);
scene.add(purple);
const cyan = new THREE.PointLight(0x00d9ff, 18);
cyan.position.set(6, -3, 4);
scene.add(cyan);

// Soft shadow on an invisible floor.
const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.35 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -3.2;
floor.receiveShadow = true;
scene.add(floor);

// Floating dust for atmosphere.
const dustGeo = new THREE.BufferGeometry();
const dustPts = new Float32Array(70 * 3).map((_, i) => rand(i % 3 === 1 ? 5 : 8));
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPts, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xa8c8ff, size: 0.05, transparent: true, opacity: 0.55 }));
scene.add(dust);

// Everything that shakes when reality breaks lives under `root`.
const root = new THREE.Group();
scene.add(root);

/* =====================================================================
   3. BUILD THE CUBE
   27 dark cubies form the core. 54 tiles sit on the outside. Each tile is
   its own THREE.Group placed at the tile's center, so that group IS the
   tile's pivot: rotating it never touches a neighbor.
   ===================================================================== */
const geo = {
  cubie: new RoundedBoxGeometry(CUBIE, CUBIE, CUBIE, 3, 0.07),
  backing: new RoundedBoxGeometry(TILE, TILE, TILE_DEPTH, 2, 0.03),
  sticker: new RoundedBoxGeometry(STICKER, STICKER, 0.024, 2, 0.011),
};
const coreMat = new THREE.MeshStandardMaterial({ color: 0x0b0b10, roughness: 0.6, metalness: 0.25 });
const backingMat = new THREE.MeshStandardMaterial({ color: 0x0e0e13, roughness: 0.5, metalness: 0.2 });
const frameMat = new THREE.MeshBasicMaterial({ color: 0x3df0ff, toneMapped: false });

for (let x = -1; x <= 1; x++)
  for (let y = -1; y <= 1; y++)
    for (let z = -1; z <= 1; z++) {
      const c = new THREE.Mesh(geo.cubie, coreMat);
      c.position.set(x * SPACING, y * SPACING, z * SPACING);
      c.castShadow = c.receiveShadow = true;
      root.add(c);
    }

/** Cyan selection frame: four thin bars around the tile. */
function makeFrame() {
  const g = new THREE.Group();
  const out = TILE / 2 + 0.04, w = 0.05, len = out * 2 + w, z = TILE_DEPTH / 2 + 0.02;
  for (const [px, py, sx, sy] of [[0, out, len, w], [0, -out, len, w], [out, 0, w, len], [-out, 0, w, len]]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, 0.03), frameMat);
    bar.position.set(px, py, z);
    bar.raycast = () => {};
    g.add(bar);
  }
  g.visible = false;
  return g;
}

/**
 * A tile's state is two things on top of its fixed home pose:
 *   q   – its own rotation (quaternion, any angle), applied around its center
 *   pos – how far it has moved from home, in world units
 */
const tiles = [];
const pickables = [];
for (const [face, f] of Object.entries(FACES)) {
  const X = v3(f.X), Y = v3(f.Y), Z = v3(f.Z);
  const homeQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z));
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 3; col++) {
      const cubie = Z.clone().add(X.clone().multiplyScalar(col - 1)).add(Y.clone().multiplyScalar(1 - row));
      const home = cubie.multiplyScalar(SPACING).add(Z.clone().multiplyScalar(TILE_OFFSET));

      const group = new THREE.Group();
      const back = new THREE.Mesh(geo.backing, backingMat);
      const mat = new THREE.MeshStandardMaterial({ color: f.color, roughness: 0.3, metalness: 0.02, emissive: f.color, emissiveIntensity: 0.06 });
      const sticker = new THREE.Mesh(geo.sticker, mat);
      sticker.position.z = TILE_DEPTH / 2 + 0.004;
      back.castShadow = back.receiveShadow = sticker.castShadow = true;
      const frame = makeFrame();
      group.add(back, sticker, frame);
      root.add(group);

      const tile = {
        id: `${face}-${row}-${col}`,
        home, homeQ, normal: Z.clone(),
        originalColor: f.color, color: f.color,
        q: new THREE.Quaternion(), pos: new THREE.Vector3(),
        group, mat, frame,
      };
      back.userData.tile = sticker.userData.tile = tile;
      pickables.push(back, sticker);
      tiles.push(tile);
    }
}

function setColor(t, color) {
  t.color = color;
  t.mat.color.set(color);
  t.mat.emissive.set(color);
}

/** Write each tile's state into its Three.js group: home pose, then its own offset and spin. */
function applyTransforms() {
  for (const t of tiles) {
    t.group.position.copy(t.home).add(t.pos);
    t.group.quaternion.copy(t.homeQ).multiply(t.q);
  }
}

/* =====================================================================
   4. UNDO HISTORY
   ===================================================================== */
const history = [];
const snapshot = () => tiles.map((t) => ({ q: t.q.toArray(), p: t.pos.toArray(), c: t.color }));
function checkpoint() {
  history.push(snapshot());
  if (history.length > 60) history.shift();
  updateUI();
}
function restore(snap) {
  tweens.length = 0;
  snap.forEach((s, i) => {
    tiles[i].q.fromArray(s.q);
    tiles[i].pos.fromArray(s.p);
    setColor(tiles[i], s.c);
  });
  stateChanged();
}

/* =====================================================================
   5. ANIMATION (tweens)
   Every action records ONE undo step, then animates each tile from where
   it is to where it's going. A new action cancels unfinished tweens.
   ===================================================================== */
const tweens = [];
const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
const easeOut = (k) => 1 - (1 - k) ** 4;

function animateTo(targets, duration, ease = easeInOut) {
  tweens.length = 0;
  for (const [t, tg] of targets) {
    tweens.push({ t, q0: t.q.clone(), q1: tg.q, p0: t.pos.clone(), p1: tg.pos, elapsed: 0, duration, ease });
  }
}

function stepTweens(dt) {
  if (!tweens.length) return false;
  for (const tw of tweens) {
    tw.elapsed += dt;
    const k = tw.ease(Math.min(1, tw.elapsed / tw.duration));
    tw.t.q.slerpQuaternions(tw.q0, tw.q1, k);
    tw.t.pos.lerpVectors(tw.p0, tw.p1, k);
  }
  const before = tweens.length;
  for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].elapsed >= tweens[i].duration) tweens.splice(i, 1);
  if (before && !tweens.length) stateChanged(); // finished: re-check the meter, maybe celebrate
  return true;
}

const randomQuat = (amp) => new THREE.Quaternion().setFromEuler(new THREE.Euler(rand(amp) * DEG, rand(amp) * DEG, rand(amp) * DEG));

/* =====================================================================
   6. THE BUTTONS
   ===================================================================== */
function mixItUp() {
  checkpoint();
  const shuffled = [...tiles].sort(() => Math.random() - 0.5).slice(0, 22 + Math.floor(Math.random() * 14));
  animateTo(shuffled.map((t) => [t, { q: randomQuat(Math.random() < 0.3 ? 160 : 55), pos: t.pos.clone() }]), 0.9);
  say(pick(QUIPS.mix));
}

function breakReality() {
  checkpoint();
  const twist = rand(40) * DEG;
  const targets = tiles.map((t) => {
    const radial = t.home.clone().normalize();
    const dist = 0.9 + Math.random() * 2.4;
    const wobble = new THREE.Vector3(rand(0.7), rand(0.7), rand(0.7));
    // A slight swirl around the vertical axis so the explosion reads as one gesture.
    const swirl = t.home.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), twist * (t.home.y / 1.6)).sub(t.home);
    const pos = radial.multiplyScalar(dist * 0.6).add(t.normal.clone().multiplyScalar(dist * 0.7)).add(wobble).add(swirl);
    return [t, { q: randomQuat(170), pos }];
  });
  animateTo(targets, 1.6, easeOut);
  shake = 0;
  flash();
  say(pick(QUIPS.break));
}

function colorChaos() {
  checkpoint();
  const pal = pick(PALETTES);
  const only = selection.size ? selection : null;
  for (const t of tiles) if (!only || only.has(t)) setColor(t, pick(pal.colors));
  const n = selection.size;
  say(n ? `${n} tile${n > 1 ? 's' : ''} → ${pal.name}` : `${pal.name} mode. ${pick(QUIPS.color)}`);
  stateChanged();
}

function undo() {
  const prev = history.pop();
  if (!prev) return;
  restore(prev);
  say(pick(QUIPS.undo));
}

function reset() {
  const isDefault = tiles.every((t) => t.q.equals(new THREE.Quaternion()) && t.pos.lengthSq() === 0 && t.color === t.originalColor);
  if (isDefault) return;
  checkpoint();
  tiles.forEach((t) => setColor(t, t.originalColor));
  animateTo(tiles.map((t) => [t, { q: new THREE.Quaternion(), pos: new THREE.Vector3() }]), 0.8);
  clearSelection();
  say(pick(QUIPS.reset));
}

/* =====================================================================
   7. TWIST ANYTHING (mouse + touch)
   Press a tile and drag: it spins like a trackball around its own center.
   Dragging sideways turns it around the camera's up axis, dragging
   vertically around the camera's right axis. A press without movement
   picks the tile for COLOR CHAOS. Dragging empty space orbits the camera.
   ===================================================================== */
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const selection = new Set();
let hovered = null;

function tileAt(clientX, clientY) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(pickables, false)[0];
  return hit ? hit.object.userData.tile : null;
}

function toggleSelect(t) {
  if (selection.has(t)) selection.delete(t);
  else selection.add(t);
  t.frame.visible = selection.has(t);
  updateUI();
}
function clearSelection() {
  selection.forEach((t) => (t.frame.visible = false));
  selection.clear();
  updateUI();
}

const DRAG_THRESHOLD = 4;  // px before a press becomes a twist
const DRAG_SPEED = 0.011;  // radians per px

// Capture phase on the container runs before OrbitControls sees the event,
// so we can switch the camera off while a tile is being twisted.
stage.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  const t = tileAt(e.clientX, e.clientY);
  const x0 = e.clientX, y0 = e.clientY;

  if (!t) {
    // Background: OrbitControls handles the drag. A plain tap clears the picks.
    const up = (ev) => {
      window.removeEventListener('pointerup', up);
      if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < DRAG_THRESHOLD) clearSelection();
    };
    window.addEventListener('pointerup', up);
    return;
  }

  controls.enabled = false;
  // Cancel any running animation on this tile so the twist starts from what you see.
  for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].t === t) tweens.splice(i, 1);
  const startQ = t.homeQ.clone().multiply(t.q);              // tile's world orientation
  const invHome = t.homeQ.clone().invert();
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).normalize();
  const upAxis = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1).normalize();
  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion();
  let began = false;
  stage.className = 'grabbing';

  const move = (ev) => {
    const dx = ev.clientX - x0, dy = ev.clientY - y0;
    if (!began && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!began) { began = true; checkpoint(); }
    qa.setFromAxisAngle(upAxis, dx * DRAG_SPEED);
    qb.setFromAxisAngle(right, dy * DRAG_SPEED);
    const world = qa.multiply(qb).multiply(startQ);
    t.q.copy(invHome).multiply(world);                       // back to the tile's own frame
    t.mat.emissiveIntensity = 0.35;
    stateChanged(false);
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    controls.enabled = true;
    stage.className = '';
    t.mat.emissiveIntensity = 0.06;
    if (began) {
      stateChanged();
      if (Math.random() < 0.35) say(pick(QUIPS.twist));
    } else toggleSelect(t);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}, { capture: true });

// Hover glow on desktop.
stage.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || e.buttons) return;
  const t = tileAt(e.clientX, e.clientY);
  if (t === hovered) return;
  if (hovered) hovered.mat.emissiveIntensity = 0.06;
  hovered = t;
  if (t) t.mat.emissiveIntensity = 0.18;
  stage.className = t ? 'grab' : '';
});

/* =====================================================================
   8. WEIRDNESS METER
   Measured from the arrangement itself, never from button presses. Each
   tile scores by its true rotation angle (360° counts as normal) and its
   distance from home. Under 8° or 0.1 units counts as nothing, so tiny
   fidgets can't pump it. Rotation alone tops out at 90%.
   ===================================================================== */
function weirdness() {
  let sum = 0;
  for (const t of tiles) {
    const angle = (2 * Math.acos(Math.min(1, Math.abs(t.q.w)))) / DEG; // 0..180
    const disp = t.pos.length();
    const rot = angle < 8 ? 0 : Math.min(1, (angle - 8) / 70);
    const move = disp < 0.1 ? 0 : Math.min(1, (disp - 0.1) / 1.6);
    sum += Math.min(1, rot * 0.9 + move);
  }
  return sum / tiles.length;
}

/* =====================================================================
   9. UI + EFFECTS
   ===================================================================== */
const $ = (id) => document.getElementById(id);
let lastPct = -1;
let armed = true;

function updateMeter() {
  const w = weirdness();
  const pct = Math.round(w * 100);
  if (pct !== lastPct) {
    lastPct = pct;
    const level = [...LEVELS].reverse().find((l) => w >= l.at);
    $('pct').textContent = pct;
    $('fill').style.width = `${Math.max(1.5, w * 100)}%`;
    $('bar').setAttribute('aria-valuenow', pct);
    $('status').textContent = level.text;
    $('status').className = `meter-status lvl-${LEVELS.indexOf(level)}`;
  }
  return w;
}

/** Call after any change. Celebrates once each time the meter settles at 100%. */
function stateChanged(settled = true) {
  const w = updateMeter();
  updateUI();
  if (!settled || tweens.length) return;
  if (w >= LEVELS[4].at && armed) { armed = false; celebrate(); }
  else if (w < 0.9) armed = true;
}

function updateUI() {
  $('btn-undo').disabled = history.length === 0;
  const n = selection.size;
  $('sel-count').textContent = n ? n : '';
  $('hint').textContent = n
    ? `${n} tile${n > 1 ? 's' : ''} picked. COLOR CHAOS paints just ${n > 1 ? 'these' : 'this one'}. Tap empty space to let go.`
    : 'Click and drag a tile to twist it. Or press BREAK REALITY and see what happens.';
}

function say(text) {
  const q = $('quip');
  q.textContent = text;
  q.classList.remove('pop');
  void q.offsetWidth; // restart the animation
  q.classList.add('pop');
}

function flash() {
  const f = document.createElement('div');
  f.className = 'flash';
  $('fx').appendChild(f);
  setTimeout(() => f.remove(), 800);
}

const CONFETTI = ['#3df0ff', '#ff2bd6', '#ffd500', '#ff5800', '#39ff14', '#8a2bff', '#ffffff', '#ff003c'];
function celebrate() {
  const box = document.createElement('div');
  box.className = 'celebrate';
  box.setAttribute('role', 'status');
  const conf = document.createElement('div');
  conf.className = 'confetti';
  for (let i = 0; i < 64; i++) {
    const p = document.createElement('i');
    const a = (i / 64) * Math.PI * 2 + Math.random() * 0.4;
    const d = 180 + Math.random() * 420;
    const s = 8 + Math.random() * 10;
    p.style.cssText = `background:${CONFETTI[i % CONFETTI.length]};width:${s}px;height:${s}px;animation-delay:${Math.random() * 0.15}s;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d * 0.7}px;--rot:${Math.random() * 900 - 450}deg`;
    conf.appendChild(p);
  }
  box.innerHTML = `<div class="banner"><strong>PHYSICS HAS LEFT THE CHAT</strong><span>You broke a cube that isn't supposed to break. Ernő would be proud. Probably.</span></div>`;
  box.prepend(conf);
  $('fx').appendChild(box);
  setTimeout(() => box.remove(), 3700);
}

$('btn-mix').addEventListener('click', mixItUp);
$('btn-break').addEventListener('click', breakReality);
$('btn-color').addEventListener('click', colorChaos);
$('btn-undo').addEventListener('click', undo);
$('btn-reset').addEventListener('click', reset);
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
  else if (e.key === 'Escape') clearSelection();
});

/* =====================================================================
   10. RESIZE + RENDER LOOP
   ===================================================================== */
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  // On tall phone screens, pull back so the whole cube fits and lift it above the buttons.
  const aspect = w / h;
  camera.position.setLength(12.7 * (aspect < 1 ? Math.min(2.1, 0.9 / aspect) : 1));
  if (aspect < 1) camera.setViewOffset(w, h, 0, h * 0.1, w, h);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

let shake = 1;
let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.2);
  last = now;
  if (stepTweens(dt)) updateMeter();
  applyTransforms();
  // Short decaying shake after BREAK REALITY.
  if (shake < 1) {
    shake = Math.min(1, shake + dt / 0.55);
    const k = (1 - shake) ** 2 * 0.12;
    root.position.set(rand(k / 2), rand(k / 2), rand(k / 2));
  } else root.position.set(0, 0, 0);
  dust.rotation.y += dt * 0.02;
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Small handle for automated testing in the browser console.
window.__cube = {
  tiles, weirdness, camera, renderer, isAnimating: () => tweens.length > 0, history,
  tileAt: (x, y) => tileAt(x, y)?.id ?? null,
  screenOf(id) {
    const t = tiles.find((x) => x.id === id);
    const p = t.group.getWorldPosition(new THREE.Vector3()).project(camera);
    const r = renderer.domElement.getBoundingClientRect();
    return [r.left + ((p.x + 1) / 2) * r.width, r.top + ((1 - p.y) / 2) * r.height];
  },
};
