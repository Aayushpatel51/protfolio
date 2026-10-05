import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { PROFILE, SECTIONS } from './content.js';

/* ───────────────────────── Maze ───────────────────────── */
// '#' wall  '.' dot  '1'-'5' section orbs  '-' ghost door  'G' ghost home  'P' player start  ' ' empty (row 9 wraps)
const MAZE = [
  '###################',
  '#........#........#',
  '#.##.###.#.###.##.#',
  '#1...............2#',
  '#.##.#.#####.#.##.#',
  '#....#...#...#....#',
  '####.###.#.###.####',
  '####.#.......#.####',
  '####.# ##-## #.####',
  '    .  #GGG#  .    ',
  '####.# ##### #.####',
  '####.#.......#.####',
  '####.# ##### #.####',
  '#........#........#',
  '#.##.###.#.###.##.#',
  '#3.#.....P.....#.4#',
  '##.#.#.#####.#.#.##',
  '#....#...#...#....#',
  '#.######.#.######.#',
  '#........5........#',
  '###################',
];
const W = MAZE[0].length, H = MAZE.length;
MAZE.forEach((r, i) => { if (r.length !== W) throw new Error('bad maze row ' + i); });
const tileAt = (x, y) => (y < 0 || y >= H) ? '#' : MAZE[y][((x % W) + W) % W];
const walkable = (x, y, door) => { const c = tileAt(x, y); return c === '#' ? false : c === '-' ? !!door : true; };
const wrapX = x => ((x % W) + W) % W;
const toWorld = (x, y) => new THREE.Vector3(x - (W - 1) / 2, 0, y - (H - 1) / 2);
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const DIRLIST = Object.values(DIRS);

function bfsDir(sx, sy, tx, ty) {
  if (sx === tx && sy === ty) return [0, 0];
  const key = (x, y) => y * W + x;
  const first = new Map([[key(sx, sy), null]]); // tile -> first step direction taken from start
  const q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift();
    for (const d of DIRLIST) {
      const nx = wrapX(x + d[0]), ny = y + d[1];
      if (!walkable(nx, ny, true) || first.has(key(nx, ny))) continue;
      const f = first.get(key(x, y)) || d;
      if (nx === tx && ny === ty) return f;
      first.set(key(nx, ny), f); q.push([nx, ny]);
    }
  }
  return [0, 0];
}

/* ───────────────────────── Renderer / scene ───────────────────────── */
const canvas = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05060f);
scene.fog = new THREE.FogExp2(0x05060f, 0.018);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.85, 0.55, 0.15);
composer.addPass(bloom);
composer.addPass(new OutputPass());

scene.add(new THREE.AmbientLight(0x6670ff, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 1.2); sun.position.set(6, 16, 8); scene.add(sun);
const pacLight = new THREE.PointLight(0xffd400, 12, 9, 1.6); scene.add(pacLight);

// floor + grid
const floor = new THREE.Mesh(new THREE.PlaneGeometry(W + 2, H + 2), new THREE.MeshStandardMaterial({ color: 0x080a1e, roughness: 0.9 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -0.01; scene.add(floor);
const grid = new THREE.GridHelper(120, 120, 0x1b2a7a, 0x10173f); grid.position.y = -0.4; scene.add(grid);

// stars
{
  const n = 900, p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { p[i * 3] = (Math.random() - .5) * 140; p[i * 3 + 1] = 8 + Math.random() * 40; p[i * 3 + 2] = (Math.random() - .5) * 140; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0x9fb2ff, size: 0.18, sizeAttenuation: true, fog: false })));
}

function textSprite(text, { color = '#fff', size = 64, w = 1024, h = 160, scale = 4, glow } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.font = `bold ${size}px "Courier New", monospace`; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (glow) { g.shadowColor = glow; g.shadowBlur = 24; }
  g.fillStyle = color; g.fillText(text, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, fog: false }));
  s.scale.set(scale, scale * h / w, 1); s.renderOrder = 10;
  return s;
}

// title floating above the maze
const title = textSprite(PROFILE.name, { size: 96, glow: '#ffd400', color: '#ffd400', scale: 12 });
title.position.set(0, 3.2, -(H / 2) - 3.2); scene.add(title);
const subtitle = textSprite(PROFILE.role.toUpperCase(), { size: 40, color: '#27e8ff', glow: '#27e8ff', scale: 12, h: 100 });
subtitle.position.set(0, 1.9, -(H / 2) - 3.2); scene.add(subtitle);

// walls
const maze = new THREE.Group(); scene.add(maze);
{
  const geo = new THREE.BoxGeometry(1, 0.9, 1), edge = new THREE.EdgesGeometry(geo);
  const mat = new THREE.MeshStandardMaterial({ color: 0x10186a, emissive: 0x0a1060, emissiveIntensity: 0.9, roughness: 0.4, metalness: 0.3 });
  const lineMat = new THREE.LineBasicMaterial({ color: 0x3d6bff });
  const walls = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (MAZE[y][x] === '#') walls.push([x, y]);
  const inst = new THREE.InstancedMesh(geo, mat, walls.length);
  const m = new THREE.Matrix4();
  walls.forEach(([x, y], i) => {
    const p = toWorld(x, y); m.makeTranslation(p.x, 0.45, p.z); inst.setMatrixAt(i, m);
    const l = new THREE.LineSegments(edge, lineMat); l.position.set(p.x, 0.45, p.z); maze.add(l);
  });
  maze.add(inst);
  // ghost door
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (MAZE[y][x] === '-') {
    const d = new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 0.2), new THREE.MeshBasicMaterial({ color: 0xff4fd8 }));
    const p = toWorld(x, y); d.position.set(p.x, 0.4, p.z); maze.add(d);
  }
}

// dots
const dotList = [];
let dotMesh, dotsLeft = 0;
{
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (MAZE[y][x] === '.') dotList.push({ x, y, alive: true });
  dotMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }), dotList.length);
  scene.add(dotMesh);
}
const dotAt = new Map(dotList.map((d, i) => [d.y * W + d.x, i]));
const _m = new THREE.Matrix4();
function placeDot(i, on) {
  const d = dotList[i], p = toWorld(d.x, d.y);
  _m.makeScale(on ? 1 : 0, on ? 1 : 0, on ? 1 : 0).setPosition(p.x, 0.3, p.z);
  dotMesh.setMatrixAt(i, _m); dotMesh.instanceMatrix.needsUpdate = true;
}
function resetDots() { dotList.forEach((d, i) => { d.alive = true; placeDot(i, true); }); dotsLeft = dotList.length; }

// section orbs
const orbs = [];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const c = MAZE[y][x];
  if (c >= '1' && c <= '5') {
    const sec = SECTIONS[+c - 1], p = toWorld(x, y);
    const g = new THREE.Group(); g.position.set(p.x, 0.55, p.z);
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), new THREE.MeshStandardMaterial({ color: sec.color, emissive: sec.color, emissiveIntensity: 1.6, flatShading: true }));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.025, 8, 40), new THREE.MeshBasicMaterial({ color: sec.color }));
    const ring2 = ring.clone(); ring2.rotation.x = Math.PI / 2;
    g.add(core, ring, ring2);
    const label = textSprite(sec.label, { size: 70, color: '#' + sec.color.toString(16).padStart(6, '0'), glow: '#' + sec.color.toString(16).padStart(6, '0'), w: 512, h: 128, scale: 2.4 });
    label.position.y = 1.1; g.add(label);
    scene.add(g);
    orbs.push({ x, y, sec, group: g, core, ring, ring2, taken: false, idx: +c - 1 });
  }
}

/* ───────────────────────── Characters ───────────────────────── */
function makePac() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xffd400, emissive: 0xffa000, emissiveIntensity: 0.7, side: THREE.DoubleSide });
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.4, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  const bot = new THREE.Mesh(new THREE.SphereGeometry(0.4, 28, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: 0x111111 }));
  eye.position.set(0.17, 0.26, 0.2); const eye2 = eye.clone(); eye2.position.x = -0.17;
  top.add(eye, eye2);
  g.add(top, bot); g.userData = { top, bot };
  g.position.y = 0.45; return g;
}
const pac = makePac(); scene.add(pac);

const GHOST_COLORS = [0xff3b3b, 0xff9ad5, 0x36e6ff, 0xffa63b];
function makeGhost(color) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 });
  const body = new THREE.Group();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), bodyMat); dome.position.y = 0.05;
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.38, 20, 1, true), bodyMat); skirt.position.y = -0.14;
  skirt.material.side = THREE.DoubleSide;
  body.add(dome, skirt);
  for (let i = 0; i < 4; i++) { // wavy feet
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), bodyMat);
    const a = i / 4 * Math.PI * 2 + Math.PI / 4; f.position.set(Math.cos(a) * .27, -.33, Math.sin(a) * .27); body.add(f);
  }
  const eyes = new THREE.Group();
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    const pu = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: 0x101040 }));
    pu.position.z = 0.07; e.add(pu); e.position.set(s * 0.15, 0.1, 0.28); eyes.add(e);
  }
  g.add(body, eyes); g.userData = { body, bodyMat, color, eyes };
  g.position.y = 0.55; return g;
}

/* ───────────────────────── Movement ───────────────────────── */
class Mover {
  constructor(x, y) { this.home = [x, y]; this.reset(); }
  reset() { [this.fx, this.fy] = this.home; this.dx = 0; this.dy = 0; this.t = 0; this.ldx = 0; this.ldy = 0; }
  get tile() { return [wrapX(this.fx + (this.t >= .5 ? this.dx : 0)), this.fy + (this.t >= .5 ? this.dy : 0)]; }
  pos() { const x = this.fx + this.dx * this.t, y = this.fy + this.dy * this.t; return [((x % W) + W) % W, y]; }
  advance(dt, speed, choose) {
    let move = speed * dt;
    while (move > 1e-6) {
      if (this.t === 0 && !this.dx && !this.dy) { choose(this); if (!this.dx && !this.dy) return; }
      const need = 1 - this.t;
      if (move < need) { this.t += move; return; }
      move -= need;
      this.fx = wrapX(this.fx + this.dx); this.fy += this.dy; this.t = 0;
      this.ldx = this.dx; this.ldy = this.dy; this.dx = this.dy = 0;
      this.onArrive && this.onArrive();
      choose(this);
      if (!this.dx && !this.dy) return;
    }
  }
}

const player = new Mover(...(() => { for (let y = 0; y < H; y++) { const x = MAZE[y].indexOf('P'); if (x >= 0) return [x, y]; } })());
let want = [0, 0];
player.onArrive = () => eatAt(player.fx, player.fy);
const playerChoose = m => {
  const [wx, wy] = want;
  if ((wx || wy) && walkable(m.fx + wx, m.fy + wy)) { m.dx = wx; m.dy = wy; }
  else if ((m.ldx || m.ldy) && walkable(m.fx + m.ldx, m.fy + m.ldy)) { m.dx = m.ldx; m.dy = m.ldy; }
};

const homes = []; MAZE.forEach((r, y) => [...r].forEach((c, x) => c === 'G' && homes.push([x, y])));
const CORNERS = [[W - 2, 1], [1, 1], [W - 2, H - 2], [1, H - 2]];
const ghosts = homes.map((h, i) => {
  const mesh = makeGhost(GHOST_COLORS[i]); scene.add(mesh);
  const g = new Mover(...h); g.mesh = mesh; g.idx = i; g.releaseAt = [0.5, 3, 7][i] ?? 10; g.state = 'house'; g.afraid = false;
  g.onArrive = () => {
    if (g.state === 'leave' && g.fx === 9 && g.fy === 7) g.state = 'roam';
    if (g.state === 'eaten' && g.fx === 9 && g.fy === 9) { g.state = 'leave'; g.afraid = false; }
  };
  return g;
});
const doorTile = [9, 7];

function ghostChoose(g) {
  if (g.state === 'house') return;
  const door = g.state === 'leave' || g.state === 'eaten';
  let d;
  if (door) {
    const target = g.state === 'eaten' ? [9, 9] : doorTile;
    d = bfsDir(g.fx, g.fy, ...target);
  } else {
    const opts = DIRLIST.filter(([dx, dy]) => walkable(g.fx + dx, g.fy + dy, false) && !(dx === -g.ldx && dy === -g.ldy && (g.ldx || g.ldy)));
    const all = opts.length ? opts : DIRLIST.filter(([dx, dy]) => walkable(g.fx + dx, g.fy + dy, false));
    if (g.afraid) d = all[Math.floor(Math.random() * all.length)];
    else {
      const [px, py] = player.tile; let tx = px, ty = py;
      if (modeScatter) [tx, ty] = CORNERS[g.idx % 4];
      else if (g.idx === 1) { tx = px + want[0] * 3; ty = py + want[1] * 3; }
      else if (g.idx === 2 && Math.hypot(px - g.fx, py - g.fy) > 6) { tx = px; ty = py; }
      else if (g.idx === 3 && Math.hypot(px - g.fx, py - g.fy) < 6) [tx, ty] = CORNERS[3];
      let best = Infinity; d = all[0];
      for (const c of all) { const dist = (g.fx + c[0] - tx) ** 2 + (g.fy + c[1] - ty) ** 2 + Math.random() * 0.3; if (dist < best) { best = dist; d = c; } }
    }
  }
  if (d) [g.dx, g.dy] = d;
}

/* ───────────────────────── Game state ───────────────────────── */
const $ = id => document.getElementById(id);
let state = 'menu';           // menu | play | panel | dead | over
let score = 0, lives = 3, frightT = 0, combo = 0, graceT = 0, modeT = 0, modeScatter = true, time = 0, deadT = 0;
const found = new Set();

$('heroName').textContent = PROFILE.name; $('heroRole').textContent = PROFILE.role;
const chips = $('chips');
SECTIONS.forEach(s => {
  const c = document.createElement('span'); c.className = 'chip mono'; c.textContent = s.label; c.id = 'chip-' + s.id;
  c.style.setProperty('--c', '#' + s.color.toString(16).padStart(6, '0')); chips.appendChild(c);
});
const hex = n => '#' + n.toString(16).padStart(6, '0');

function hud() {
  $('score').textContent = score; $('lives').textContent = '♥'.repeat(Math.max(lives, 0));
  SECTIONS.forEach(s => {
    const c = $('chip-' + s.id), on = found.has(s.id);
    c.classList.toggle('on', on); c.style.background = on ? hex(s.color) : ''; c.style.color = on ? '#05060f' : '';
  });
}
let toastT;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800); }

function resetActors() {
  player.reset(); want = [0, 0];
  ghosts.forEach((g, i) => { g.reset(); g.state = 'house'; g.afraid = false; g.releaseAt = time + ([0.5, 3, 7][i] ?? 10); });
  frightT = 0; combo = 0; graceT = 1.2;
}
function newGame() {
  score = 0; lives = 3; found.clear(); resetDots();
  orbs.forEach(o => { o.taken = false; o.group.visible = true; });
  resetActors(); hud(); state = 'play';
}

/* ───────────────────────── Audio ───────────────────────── */
let actx, muted = false;
function beep(f = 440, d = 0.08, type = 'square', vol = 0.05, slide = 0) {
  if (muted) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + d);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + d);
  } catch { /* audio unavailable */ }
}
let chompAlt = false;
const sfx = {
  dot() { chompAlt = !chompAlt; beep(chompAlt ? 320 : 260, 0.06); },
  orb() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.12, 'triangle', 0.07), i * 70)); },
  ghost() { beep(300, 0.25, 'sawtooth', 0.06, 700); },
  die() { beep(500, 0.9, 'sawtooth', 0.07, -440); },
  win() { [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => beep(f, 0.2, 'triangle', 0.08), i * 110)); },
};

/* ───────────────────────── Interactions ───────────────────────── */
function eatAt(x, y) {
  const i = dotAt.get(y * W + x);
  if (i !== undefined && dotList[i].alive) {
    dotList[i].alive = false; placeDot(i, false); score += 10; dotsLeft--; sfx.dot(); hud();
    if (dotsLeft === 0) { toast('Maze cleared! Dots restored +500'); score += 500; resetDots(); }
  }
  const o = orbs.find(o => !o.taken && o.x === x && o.y === y);
  if (o) openSection(o);
}

function openSection(o) {
  o.taken = true; o.group.visible = false; found.add(o.sec.id); score += 100;
  frightT = 8; combo = 0; ghosts.forEach(g => { if (g.state === 'roam' || g.state === 'leave') g.afraid = true; });
  sfx.orb(); hud();
  const done = found.size === SECTIONS.length;
  const card = $('panelCard');
  card.style.setProperty('--accent', hex(o.sec.color));
  card.innerHTML = `<h2 class="mono">${found.size}/${SECTIONS.length} · ${o.sec.label}</h2><h1>${o.sec.title}</h1>${o.sec.html}
    <div class="row"><button class="btn primary" id="panelClose">${done ? 'FINISH ★' : 'KEEP PLAYING ▶'}</button></div>`;
  $('panel').classList.add('show'); state = 'panel';
  $('panelClose').onclick = () => { $('panel').classList.remove('show'); graceT = 1; if (done) finish(); else state = 'play'; };
  $('panelClose').focus();
}

function finish() {
  state = 'over'; sfx.win();
  $('endCard').innerHTML = `<h1>PORTFOLIO UNLOCKED ★</h1><p class="sub mono">Final score ${score}</p>
    <p>You found every section. Thanks for playing — let's build something together.</p>
    <p>📧 <a href="mailto:${PROFILE.email}">${PROFILE.email}</a><br>🐙 <a href="${PROFILE.github}" target="_blank" rel="noopener">${PROFILE.github.replace('https://', '')}</a></p>
    <div class="row"><button class="btn primary" id="again">↻ PLAY AGAIN</button><button class="btn" id="viewAll">View everything</button></div>`;
  $('end').classList.add('show');
  $('again').onclick = () => { $('end').classList.remove('show'); newGame(); };
  $('viewAll').onclick = () => { $('end').classList.remove('show'); showPlain(); };
}

function gameOver() {
  state = 'over';
  $('endCard').innerHTML = `<h1>GAME OVER</h1><p class="sub mono">Score ${score} · Sections ${found.size}/${SECTIONS.length}</p>
    <p>The bugs got you this time. Try again — or skip straight to the plain portfolio.</p>
    <div class="row"><button class="btn primary" id="again">↻ TRY AGAIN</button><button class="btn" id="viewAll">Plain view</button></div>`;
  $('end').classList.add('show');
  $('again').onclick = () => { $('end').classList.remove('show'); newGame(); };
  $('viewAll').onclick = () => { $('end').classList.remove('show'); showPlain(); };
}

function showPlain() {
  const prev = state; if (state === 'play') state = 'panel';
  $('plainCard').innerHTML = `<h1>${PROFILE.name}</h1><p class="sub mono">${PROFILE.role}</p>` +
    SECTIONS.map(s => `<h2 style="margin-top:22px;color:${hex(s.color)}">${s.title}</h2>${s.html}`).join('') +
    `<div class="row"><button class="btn primary" id="plainClose">${prev === 'play' ? 'BACK TO GAME' : 'CLOSE'}</button></div>`;
  $('plain').classList.add('show');
  $('plainClose').onclick = () => { $('plain').classList.remove('show'); if (prev === 'play') { state = 'play'; graceT = 1; } else if (prev === 'menu') $('start').classList.add('show'); };
}

function loseLife() {
  state = 'dead'; deadT = 0; sfx.die(); lives--; hud();
}

/* ───────────────────────── Input ───────────────────────── */
function setDir(name) { want = DIRS[name]; // allow instant reverse mid-tile
  if ((want[0] === -player.dx && want[1] === -player.dy) && (player.dx || player.dy) && player.t > 0) {
    player.fx = wrapX(player.fx + player.dx); player.fy += player.dy; player.dx = want[0]; player.dy = want[1]; player.t = 1 - player.t;
  }
}
const KEYS = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
addEventListener('keydown', e => {
  if (KEYS[e.code]) { if (state === 'play') setDir(KEYS[e.code]); e.preventDefault(); }
  else if (e.code === 'KeyC') cycleCam();
  else if (e.code === 'KeyM') toggleMute();
  else if (e.code === 'KeyP') { if (state === 'play') { state = 'panel'; toast('Paused — press P'); pausedByKey = true; } else if (pausedByKey && state === 'panel') { state = 'play'; pausedByKey = false; graceT = 0.6; } }
  else if (e.code === 'Escape') { if ($('plain').classList.contains('show')) $('plainClose').click(); }
});
let pausedByKey = false;
document.querySelectorAll('#dpad button').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); if (state === 'play') setDir(b.dataset.d); }));
let sx, sy;
addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
addEventListener('pointerup', e => {
  if (sx == null || state !== 'play') { sx = null; return; }
  const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
  if (Math.hypot(dx, dy) < 28) return;
  setDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
});

let camMode = 0; const CAMS = ['Overview', 'Chase', 'Top-down'];
function cycleCam() { camMode = (camMode + 1) % CAMS.length; toast('Camera: ' + CAMS[camMode]); }
function toggleMute() { muted = !muted; $('btnMute').textContent = muted ? '🔇' : '🔊'; }
$('btnCam').onclick = cycleCam; $('btnMute').onclick = toggleMute;
$('btnPlain').onclick = showPlain;
$('btnPlain2').onclick = () => { $('start').classList.remove('show'); showPlain(); };
$('btnStart').onclick = () => { $('start').classList.remove('show'); newGame(); };

/* ───────────────────────── Loop ───────────────────────── */
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

const camPos = new THREE.Vector3(0, 24, 14), camLook = new THREE.Vector3();
function updateCamera(dt, pw) {
  const portrait = camera.aspect < 0.9;
  let p, l;
  if (camMode === 0) { const k = portrait ? 1.7 : 1; p = new THREE.Vector3(0, 21 * k, 13 * k); l = new THREE.Vector3(0, 0, 1.5); }
  else if (camMode === 1) { p = new THREE.Vector3(pw.x * 0.7, 6.5, pw.z + 6.5); l = new THREE.Vector3(pw.x, 0, pw.z - 1.5); }
  else { const k = portrait ? 1.6 : 1; p = new THREE.Vector3(0, 27 * k, 0.5); l = new THREE.Vector3(0, 0, 0.5); }
  camPos.lerp(p, 1 - Math.exp(-dt * 4)); camLook.lerp(l, 1 - Math.exp(-dt * 4));
  camera.position.copy(camPos); camera.lookAt(camLook);
}

function update(dt) {
  time += dt;
  if (state === 'play') {
    if (graceT > 0) graceT -= dt;
    modeT += dt; if (modeT > (modeScatter ? 6 : 18)) { modeT = 0; modeScatter = !modeScatter; }
    if (frightT > 0) { frightT -= dt; if (frightT <= 0) ghosts.forEach(g => g.afraid = false); }
    if (graceT <= 0) {
      player.advance(dt, 5.4, playerChoose);
      ghosts.forEach(g => {
        if (g.state === 'house') { if (time >= g.releaseAt) g.state = 'leave'; return; }
        const sp = g.state === 'eaten' ? 10 : g.afraid ? 3.0 : (g.state === 'leave' ? 3.5 : 4.4);
        g.advance(dt, sp, ghostChoose);
      });
      const [px, py] = player.pos();
      for (const g of ghosts) {
        if (g.state === 'house' || g.state === 'eaten') continue;
        const [gx, gy] = g.pos(); let ddx = Math.abs(gx - px); ddx = Math.min(ddx, W - ddx);
        if (Math.hypot(ddx, gy - py) < 0.6) {
          if (g.afraid) { g.state = 'eaten'; g.afraid = false; combo++; const pts = 200 * 2 ** (combo - 1); score += pts; sfx.ghost(); toast('BUG SQUASHED +' + pts); hud(); }
          else { loseLife(); break; }
        }
      }
    }
  } else if (state === 'dead') {
    deadT += dt;
    if (deadT > 1.6) { if (lives <= 0) gameOver(); else { resetActors(); state = 'play'; } }
  }

  // visuals: player
  const [px, py] = player.pos(), pw = toWorld(px, py);
  pac.position.set(pw.x, 0.45 + (state === 'dead' ? 0 : Math.sin(time * 8) * 0.02), pw.z);
  const mv = player.dx || player.dy;
  const fx = mv ? player.dx : player.ldx, fz = mv ? player.dy : player.ldy;
  if (fx || fz) pac.rotation.y += angDiff(pac.rotation.y, Math.atan2(fx, fz)) * Math.min(1, dt * 18);
  const open = (state === 'dead') ? Math.min(deadT / 1.4, 1) * 1.55 : (mv ? (Math.sin(time * 18) * .5 + .5) * 0.7 : 0.15);
  pac.userData.top.rotation.x = -open; pac.userData.bot.rotation.x = open;
  pac.scale.setScalar(state === 'dead' ? Math.max(0.01, 1 - deadT / 1.6 * 0.9) : 1);
  pacLight.position.set(pw.x, 1.2, pw.z);

  // ghosts
  ghosts.forEach(g => {
    const [gx, gy] = g.pos(), w = toWorld(gx, gy), m = g.mesh, u = m.userData;
    m.position.set(w.x, 0.55 + Math.sin(time * 6 + g.idx) * 0.05, w.z);
    const eaten = g.state === 'eaten';
    u.body.visible = !eaten;
    const flash = g.afraid && frightT < 2 && Math.floor(time * 8) % 2;
    const col = g.afraid ? (flash ? 0xffffff : 0x2438ff) : u.color;
    u.bodyMat.color.setHex(col); u.bodyMat.emissive.setHex(col);
    if (g.dx || g.dy) m.rotation.y += angDiff(m.rotation.y, Math.atan2(g.dx, g.dy)) * Math.min(1, dt * 12);
  });

  // orbs
  orbs.forEach(o => {
    if (o.taken) return;
    o.core.rotation.y += dt * 1.8; o.core.rotation.x += dt * 0.9;
    o.ring.rotation.z += dt * 1.2; o.ring2.rotation.y += dt * 1.5;
    o.group.position.y = 0.6 + Math.sin(time * 2.2 + o.idx) * 0.12;
    o.core.scale.setScalar(1 + Math.sin(time * 4 + o.idx) * 0.08);
  });

  title.position.y = 3.2 + Math.sin(time * 1.2) * 0.15;
  updateCamera(dt, pw);
}
function angDiff(a, b) { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; }

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  update(dt); composer.render(); requestAnimationFrame(frame);
}
resetDots(); hud(); resetActors();
$('loading').remove();
requestAnimationFrame(frame);

// tiny hook for automated tests / debugging
window.__game = { get state() { return state; }, get score() { return score; }, player, ghosts, orbs, found, newGame, setDir, MAZE };
