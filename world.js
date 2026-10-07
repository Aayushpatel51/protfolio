import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* One cloud of particles that *becomes* each chapter:
   Idea (spark) → Story (twisting ribbon) → World (terrain) → Interaction (knot) → Memory (galaxy). */

const PALETTE = [
  ['#ff7a3c', '#ffd9a0'],
  ['#ff5f8a', '#ffb36b'],
  ['#3fe0b8', '#7aa2ff'],
  ['#8f7bff', '#ff6fd0'],
  ['#ffcf8a', '#ff6a5a'],
].map(p => p.map(c => new THREE.Color(c)));

// Where the cloud sits for each chapter (desktop). x flips so it never fights the text.
const POSES = [
  { x: 2.7,  y: 0.1,  s: 1.0,  rx: 0.2,  ry: 0,    rz: 0,    spin: 0.10 },
  { x: -2.6, y: 0,    s: 0.62, rx: 0.3,  ry: 0.3,  rz: 0.25, spin: 0.05 },
  { x: -2.2, y: -0.6, s: 0.78, rx: -1.0, ry: 0,    rz: 0.15, spin: 0.04 },
  { x: 2.7,  y: 0,    s: 0.85, rx: 0.4,  ry: 0.2,  rz: 0,    spin: 0.18 },
  { x: 0,    y: 0.2,  s: 0.95, rx: -1.15, ry: 0,   rz: 0,    spin: 0.05 },
];

const DIM = [0.9, 0.85, 0.5, 0.85, 0.7];
const rnd = Math.random;
const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) * 0.9;

const SHAPES = [
  // 0 · idea — a dense spark with a faint halo
  (v) => {
    if (rnd() < 0.14) { const r = 2.2 + rnd() * 3.2, a = rnd() * 6.283, b = Math.acos(2 * rnd() - 1); return v.set(r * Math.sin(b) * Math.cos(a), r * Math.sin(b) * Math.sin(a), r * Math.cos(b)); }
    const r = 1.35 * Math.cbrt(rnd()), a = rnd() * 6.283, b = Math.acos(2 * rnd() - 1);
    return v.set(r * Math.sin(b) * Math.cos(a), r * Math.sin(b) * Math.sin(a), r * Math.cos(b));
  },
  // 1 · story — a twisting ribbon, like film running through a hand
  (v) => {
    const x = (rnd() * 2 - 1) * 6.4, w = (rnd() * 2 - 1), a = x * 0.85;
    return v.set(x, Math.sin(x * 0.45) * 0.9 + Math.sin(a) * w * 1.15 + gauss() * 0.04, Math.cos(a) * w * 1.15 + gauss() * 0.04);
  },
  // 2 · world — rolling terrain seen from above
  (v) => {
    const x = (rnd() * 2 - 1) * 7, z = (rnd() * 2 - 1) * 4.6;
    const h = 0.9 * Math.sin(x * 0.6) * Math.cos(z * 0.7) + 0.45 * Math.sin(x * 1.5 + z * 1.2) + 0.2 * Math.sin(x * 3.1 - z * 2.3);
    return v.set(x, h, z);
  },
  // 3 · interaction — a (2,3) torus knot with orbiting dust
  (v) => {
    if (rnd() < 0.16) { const r = 3 + rnd() * 2.5, a = rnd() * 6.283; return v.set(Math.cos(a) * r, gauss() * 0.9, Math.sin(a) * r); }
    const t = rnd() * 6.283, r = 2 + Math.cos(3 * t);
    return v.set(r * Math.cos(2 * t) * 0.95 + gauss() * 0.11, r * Math.sin(2 * t) * 0.95 + gauss() * 0.11, Math.sin(3 * t) * 1.1 + gauss() * 0.11);
  },
  // 4 · memory — a galaxy
  (v) => {
    if (rnd() < 0.18) return v.set(gauss() * 0.9, gauss() * 0.5, gauss() * 0.9);
    const arm = Math.floor(rnd() * 3), r = Math.pow(rnd(), 0.62) * 6.8;
    const a = arm * 2.094 + r * 0.85 + gauss() * (0.55 / (r * 0.25 + 0.6));
    return v.set(Math.cos(a) * r, gauss() * 0.22 * (1 - r / 9), Math.sin(a) * r);
  },
];

const VERT = /* glsl */`
uniform float uT, uP, uPx, uSize, uIntro, uPulse, uFlow, uDim, uMouseOn;
uniform vec3 uMouse, uColA, uColB;
uniform vec4 uShock;
attribute vec3 a1, a2, a3, a4;
attribute vec4 aR;
varying vec3 vC;
varying float vA;
float sm(float x){ x = clamp(x, 0., 1.); return x*x*(3.-2.*x); }
void main(){
  vec3 p = position;
  float tr = 0.;
  float k;
  k = sm((uP-0.)*1.6 - aR.z*.6); p = mix(p, a1, k); tr += 4.*k*(1.-k);
  k = sm((uP-1.)*1.6 - aR.z*.6); p = mix(p, a2, k); tr += 4.*k*(1.-k);
  k = sm((uP-2.)*1.6 - aR.z*.6); p = mix(p, a3, k); tr += 4.*k*(1.-k);
  k = sm((uP-3.)*1.6 - aR.z*.6); p = mix(p, a4, k); tr += 4.*k*(1.-k);

  float ph = aR.w * 6.283;
  p += vec3(sin(p.y*1.3 + uT*.7 + ph), sin(p.z*1.1 + uT*.8 + ph), sin(p.x*1.2 + uT*.6 + ph)) * uFlow * (.35 + tr*2.2);

  float ie = clamp(uIntro*1.5 - aR.w*.5, 0., 1.);
  ie = 1. - pow(1. - ie, 3.);
  p *= ie;

  vec4 wp = modelMatrix * vec4(p, 1.);
  float heat = 0.;

  vec3 d = wp.xyz - uMouse;
  float push = exp(-dot(d,d) / 2.2) * uMouseOn;
  vec3 dn = normalize(d + vec3(1e-4));
  wp.xyz += dn * push * 1.5 * (.4 + aR.x) + cross(vec3(0.,0.,1.), dn) * push * .7;

  float age = uT - uShock.w;
  if (age > 0. && age < 3.2) {
    vec3 e = wp.xyz - uShock.xyz;
    float dist = length(e);
    float ring = exp(-pow((dist - age*5.5)*1.1, 2.)) * (1. - age/3.2);
    wp.xyz += normalize(e + vec3(1e-4)) * ring * 1.6;
    heat += ring;
  }

  vec4 mv = viewMatrix * wp;
  gl_Position = projectionMatrix * mv;
  float sz = uSize * uPx * (.45 + aR.x*1.2) * (1. + heat*2.2 + push*1.6 + uPulse*.7);
  gl_PointSize = sz * (9. / -mv.z) * ie;

  vC = mix(uColA, uColB, aR.y) * (1. + heat*1.6 + push*1.2 + uPulse*.5);
  vA = uDim * (.6 + .4*sin(uT*1.5 + ph*3.));
}`;

const FRAG = /* glsl */`
varying vec3 vC; varying float vA;
void main(){
  float d = length(gl_PointCoord - .5);
  if (d > .5) discard;
  float a = pow(1. - d*2., 2.);
  gl_FragColor = vec4(vC, a * vA);
}`;

const STAR_VERT = /* glsl */`
uniform float uT, uPx, uOpacity; attribute float aBirth; attribute float aSeed; varying float vA;
void main(){
  vec4 mv = viewMatrix * modelMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mv;
  float born = clamp((uT - aBirth) * 1.2, 0., 1.);
  float flash = exp(-max(uT - aBirth, 0.) * 1.8);
  gl_PointSize = (9. + 28.*flash) * uPx * (9. / -mv.z) * born;
  vA = uOpacity * (.75 + .25*sin(uT*2. + aSeed*20.)) * born;
}`;
const STAR_FRAG = /* glsl */`
uniform vec3 uCol; varying float vA;
void main(){
  vec2 c = gl_PointCoord - .5; float d = length(c);
  float core = smoothstep(.12, 0., d);
  float glow = pow(max(1. - d*2., 0.), 2.5);
  float cross = max(smoothstep(.035, 0., abs(c.x)), smoothstep(.035, 0., abs(c.y))) * smoothstep(.5, 0., d);
  float a = clamp(core + glow*.6 + cross*.7, 0., 1.);
  gl_FragColor = vec4(uCol * (.8 + core), a * vA);
}`;

export function createWorld(canvas, { reduced = false, onAccent = () => {} } = {}) {
  const coarse = matchMedia('(pointer:coarse)').matches;
  const small = Math.min(innerWidth, innerHeight) < 620;
  const N = small ? 9000 : coarse ? 14000 : 26000;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  const dpr = Math.min(devicePixelRatio || 1, small ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x08070c, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  /* particles */
  const geo = new THREE.BufferGeometry();
  const bufs = SHAPES.map(() => new Float32Array(N * 3));
  const tmp = new THREE.Vector3(), R = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    SHAPES.forEach((fn, s) => { fn(tmp); bufs[s].set([tmp.x, tmp.y, tmp.z], i * 3); });
    R.set([rnd(), rnd(), rnd(), rnd()], i * 4);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(bufs[0], 3));
  for (let s = 1; s < 5; s++) geo.setAttribute('a' + s, new THREE.BufferAttribute(bufs[s], 3));
  geo.setAttribute('aR', new THREE.BufferAttribute(R, 4));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 50);

  const U = {
    uT: { value: 0 }, uP: { value: 0 }, uPx: { value: dpr }, uSize: { value: small ? 2.8 : 2.2 },
    uIntro: { value: reduced ? 1 : 0 }, uPulse: { value: 0 }, uFlow: { value: reduced ? 0.03 : 0.12 },
    uDim: { value: small ? 0.7 : 1 }, uMouse: { value: new THREE.Vector3(99, 99, 0) }, uMouseOn: { value: 0 },
    uShock: { value: new THREE.Vector4(0, 0, 0, -99) },
    uColA: { value: PALETTE[0][0].clone() }, uColB: { value: PALETTE[0][1].clone() },
  };
  const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: U, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
  const cloud = new THREE.Points(geo, mat);
  cloud.frustumCulled = false;
  scene.add(cloud);

  /* memory stars (persistent, drawn in world space) */
  const MAXS = 80;
  const sPos = new Float32Array(MAXS * 3), sBirth = new Float32Array(MAXS).fill(1e9), sSeed = new Float32Array(MAXS);
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  sGeo.setAttribute('aBirth', new THREE.BufferAttribute(sBirth, 1));
  sGeo.setAttribute('aSeed', new THREE.BufferAttribute(sSeed, 1));
  sGeo.setDrawRange(0, 0);
  const SU = { uT: U.uT, uPx: U.uPx, uOpacity: { value: 0 }, uCol: { value: new THREE.Color('#fff3d6') } };
  const stars = new THREE.Points(sGeo, new THREE.ShaderMaterial({ vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, uniforms: SU, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }));
  stars.frustumCulled = false;
  scene.add(stars);
  let starCount = 0;

  /* post */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), small ? 0.45 : 0.55, 0.7, 0.05);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    composer.setPixelRatio(dpr); composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  /* state */
  let target = 0, prog = 0, intro = 0, pulse = 0;
  const ndc = new THREE.Vector2(0, 0), ndcS = new THREE.Vector2(0, 0);
  let mouseActive = false;
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3();
  const colA = new THREE.Color(), colB = new THREE.Color();
  const clock = new THREE.Clock();
  let lastAccent = '';

  const toWorld = (nx, ny, out) => { camera.updateMatrixWorld(); ray.setFromCamera({ x: nx, y: ny }, camera); return ray.ray.intersectPlane(plane, out); };

  const api = {
    setProgress(p) { target = p; },
    setPointer(nx, ny, active = true) { ndc.set(nx, ny); mouseActive = active; },
    shock(nx = ndc.x, ny = ndc.y) { if (toWorld(nx, ny, hit)) U.uShock.value.set(hit.x, hit.y, 0, U.uT.value); },
    pulse(v = 1) { pulse = Math.max(pulse, v); },
    addStar(nx, ny, birth = true, save = null) {
      if (!toWorld(nx, ny, hit)) return null;
      const i = starCount % MAXS;
      sPos.set([hit.x, hit.y, 0], i * 3);
      sBirth[i] = birth ? U.uT.value : -10; sSeed[i] = rnd();
      starCount++;
      sGeo.setDrawRange(0, Math.min(starCount, MAXS));
      for (const a of ['position', 'aBirth', 'aSeed']) sGeo.attributes[a].needsUpdate = true;
      return { x: nx, y: ny };
    },
    clearStars() { starCount = 0; sGeo.setDrawRange(0, 0); },
    get ready() { return intro >= 1; },
  };

  const lerp = (a, b, t) => a + (b - a) * t;
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = (U.uT.value += dt);
    intro = Math.min(1, intro + dt / 2.4);
    if (!reduced) U.uIntro.value = intro;

    prog += (target - prog) * (1 - Math.exp(-dt * 3.2));
    U.uP.value = prog;

    const i = Math.min(3, Math.floor(prog)), f = prog - i;
    const e = f * f * (3 - 2 * f);
    const A = POSES[i], B = POSES[i + 1] || POSES[i];
    const aspect = camera.aspect;
    const fit = THREE.MathUtils.clamp(aspect / 1.6, 0.42, 1);
    const narrow = aspect < 0.95;
    const g = (k) => lerp(A[k], B[k], e);
    cloud.position.set(narrow ? 0 : g('x') * Math.min(1, aspect / 1.6 + 0.2), narrow ? 1.6 + g('y') * 0.4 : g('y'), 0);
    cloud.scale.setScalar(g('s') * fit * (narrow ? 1.05 : 1));
    cloud.rotation.set(g('rx'), g('ry') + t * lerp(A.spin, B.spin, e), g('rz'));

    // colour journey
    const ci = Math.min(3, Math.floor(prog)), cf = prog - ci, ce = cf * cf * (3 - 2 * cf);
    colA.copy(PALETTE[ci][0]).lerp(PALETTE[ci + 1][0], ce);
    colB.copy(PALETTE[ci][1]).lerp(PALETTE[ci + 1][1], ce);
    U.uDim.value = (small ? 0.9 : 1) * lerp(DIM[i], DIM[i + 1] ?? DIM[i], e);
    U.uColA.value.copy(colA); U.uColB.value.copy(colB);
    const hex = '#' + colA.getHexString();
    if (hex !== lastAccent) { lastAccent = hex; onAccent(hex); }

    // pointer
    ndcS.lerp(ndc, 1 - Math.exp(-dt * 10));
    if (toWorld(ndcS.x, ndcS.y, hit)) U.uMouse.value.copy(hit);
    U.uMouseOn.value += ((mouseActive ? 1 : 0) - U.uMouseOn.value) * (1 - Math.exp(-dt * 6));

    camera.position.x += (ndc.x * 0.45 - camera.position.x) * (1 - Math.exp(-dt * 2));
    camera.position.y += (ndc.y * 0.3 - camera.position.y) * (1 - Math.exp(-dt * 2));
    camera.lookAt(0, 0, 0);

    pulse *= Math.exp(-dt * 3);
    U.uPulse.value = pulse;
    SU.uOpacity.value = THREE.MathUtils.clamp((prog - 3.2) * 1.25, 0, 1);
    bloom.strength = (small ? 0.45 : 0.55) + pulse * 0.6;

    composer.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return api;
}
