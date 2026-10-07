import { SITE, PROJECTS, DISCIPLINES } from './content.js';
import { createWorld } from './world.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
const NAMES = ['Idea', 'Story', 'World', 'Interaction', 'Memory'];
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ───────── render content ───────── */
$('#projects').innerHTML = PROJECTS.map((p, i) => `
  <li style="--d:${0.25 + i * 0.1}s"><a href="${esc(p.href)}" data-hover="${i}">
    <span class="p-n">0${i + 1}</span><span class="p-t">${esc(p.title)}</span><span class="p-y">${esc(p.year)}</span>
    <span class="p-d">${esc(p.line)}</span>
    <span class="p-tags">${p.tags.map(t => `<span>${esc(t)}</span>`).join('')}</span>
  </a></li>`).join('');
$('#disc').innerHTML = DISCIPLINES.map((d, i) => `
  <li style="--d:${0.3 + i * 0.09}s" data-hover="${i}"><b>${esc(d.name)}</b><span>${esc(d.line)}</span></li>`).join('');
$('#mailBtn').href = `mailto:${SITE.email}`;
$('#links').innerHTML = [
  `<a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a>`,
  SITE.github && `<a href="${esc(SITE.github)}" target="_blank" rel="noopener">GitHub ↗</a>`,
  SITE.linkedin && `<a href="${esc(SITE.linkedin)}" target="_blank" rel="noopener">LinkedIn ↗</a>`,
].filter(Boolean).join('');
$('#yr').textContent = new Date().getFullYear();

// split display headings into words for the mask-reveal
$$('[data-split]').forEach(h => {
  let i = 0;
  const walk = (node, out) => {
    node.childNodes.forEach(n => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(w => {
          if (!w) return;
          if (/^\s+$/.test(w)) return out.append(' ');
          const s = document.createElement('span'); s.className = 'w';
          s.innerHTML = `<span style="--d:${0.15 + i++ * 0.07}s">${esc(w)}</span>`;
          out.append(s);
        });
      } else if (n.nodeType === 1) {
        const c = n.cloneNode(false); walk(n, c); out.append(c);
      }
    });
    return out;
  };
  const wrap = walk(h, document.createElement('div'));
  h.replaceChildren(...wrap.childNodes);
  h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
});
$$('.col').forEach(c => $$('.rv', c).forEach((el, i) => el.style.setProperty('--d', `${0.35 + i * 0.12}s`)));

/* ───────── 3D world ───────── */
let world = null;
try {
  world = createWorld($('#stage'), {
    reduced,
    onAccent: hex => document.documentElement.style.setProperty('--a', hex),
  });
} catch (err) {
  console.warn('WebGL unavailable — showing the text-only story.', err);
  document.body.classList.add('no-gl');
}

/* ───────── scroll → chapter progress ───────── */
const chapters = $$('.chapter');
let tops = [];
const measure = () => { tops = chapters.map(c => c.offsetTop); tops.push(document.documentElement.scrollHeight); };
function chapterProgress() {
  const y = scrollY + innerHeight * 0.5;
  let i = 0;
  for (let k = 0; k < chapters.length; k++) if (y >= tops[k]) i = k;
  if (i >= chapters.length - 1) return chapters.length - 1;
  const frac = (y - tops[i]) / (tops[i + 1] - tops[i]);
  const m = Math.min(Math.max((frac - 0.62) / 0.38, 0), 1);
  return i + m;
}
let active = -1;
function onScroll() {
  const p = chapterProgress();
  world?.setProgress(p);
  const idx = Math.round(p);
  if (idx !== active) {
    active = idx;
    $$('.rail button').forEach((b, i) => b.classList.toggle('on', i === idx));
    $('#chNum').textContent = '0' + (idx + 1);
    $('#chName').textContent = NAMES[idx];
  }
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => { measure(); onScroll(); });
addEventListener('load', () => { measure(); onScroll(); });
if (document.fonts?.ready) document.fonts.ready.then(() => { measure(); onScroll(); });
measure(); onScroll();

$$('[data-go]').forEach(el => el.addEventListener('click', e => {
  e.preventDefault();
  const idx = +el.dataset.go;
  scrollTo({ top: tops[idx] - (idx === 0 ? 0 : innerHeight * 0.12), behavior: reduced ? 'auto' : 'smooth' });
}));

/* ───────── reveal on view ───────── */
const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('in', e.isIntersecting)), { threshold: 0.18 });
chapters.forEach(c => io.observe(c));

/* ───────── pointer, cursor, shockwaves ───────── */
const cursor = $('#cursor');
let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
if (fine) document.body.classList.add('has-cursor');
addEventListener('pointermove', e => {
  tx = e.clientX; ty = e.clientY;
  world?.setPointer((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1, true);
}, { passive: true });
document.addEventListener('pointerleave', () => world?.setPointer(0, 0, false));
addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') world?.setPointer(0, 0, false); });
(function loop() {
  cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
  cursor.style.transform = `translate(${cx}px,${cy}px)`;
  requestAnimationFrame(loop);
})();
$$('a,button,.disc li').forEach(el => {
  el.addEventListener('pointerenter', () => cursor.classList.add('big'));
  el.addEventListener('pointerleave', () => cursor.classList.remove('big'));
});

// magnetic buttons
$$('.magnetic').forEach(el => {
  if (!fine || reduced) return;
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.28}px,${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
  });
  el.addEventListener('pointerleave', () => { el.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1)'; el.style.transform = ''; setTimeout(() => el.style.transition = '', 500); });
});

// hovering work / disciplines makes the world react
$$('[data-hover]').forEach(el => {
  el.addEventListener('pointerenter', () => { world?.pulse(1); world?.shock(0.35 * (el.dataset.hover - 2) - 0.2, 0); el.classList.add('hot'); });
  el.addEventListener('pointerleave', () => el.classList.remove('hot'));
});

/* ───────── memory: the site remembers you ───────── */
const visits = store.get('ap:visits', { n: 0, first: Date.now() });
if (!sessionStorage.getItem('ap:seen')) {
  visits.n++; store.set('ap:visits', visits);
  try { sessionStorage.setItem('ap:seen', '1'); } catch { /* ignore */ }
}
const ago = Math.floor((Date.now() - visits.first) / 864e5);
const when = new Date(visits.first).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
$('#you').innerHTML = visits.n <= 1
  ? 'You are here. <b>This is your first visit</b> — I\'ll remember it.'
  : `You were here before. <b>Visit ${visits.n}</b>, first on ${when}${ago > 0 ? ` (${ago}d ago)` : ''}.`;

let myStars = store.get('ap:stars', []);
const clearBtn = $('#clearStars');
const syncClear = () => { clearBtn.hidden = !myStars.length; };
// stars saved from earlier visits come back
if (world) myStars.forEach(s => world.addStar(s.x, s.y, false));
syncClear();

addEventListener('pointerdown', e => {
  if (e.target.closest('a,button,input,.rail,.disc,.projects')) return;
  const nx = (e.clientX / innerWidth) * 2 - 1, ny = -(e.clientY / innerHeight) * 2 + 1;
  world?.shock(nx, ny);
  world?.pulse(0.6);
  if (active === 4 && world) {
    const s = world.addStar(nx, ny, true);
    if (s) { myStars.push(s); myStars = myStars.slice(-80); store.set('ap:stars', myStars); syncClear(); }
  }
});
clearBtn.addEventListener('click', () => { myStars = []; store.set('ap:stars', []); world?.clearStars(); syncClear(); });

/* ───────── intro ───────── */
requestAnimationFrame(() => setTimeout(() => {
  document.body.classList.remove('is-loading');
  chapters[0].classList.add('in');
}, reduced ? 0 : 500));
