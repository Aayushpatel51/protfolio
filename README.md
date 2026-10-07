# Aayush Patel — a world, not a website

A scroll-driven 3D story: **Idea → Story → World → Interaction → Emotion → Memory**
(design + 3D + motion + creative code + engineering). No build step, no framework — Three.js is vendored in `vendor/`.

One GPU particle cloud morphs through every chapter: a spark (Idea) → a twisting ribbon (Story) → terrain (World) →
a torus knot (Interaction) → a galaxy (Memory). The cursor pushes particles, clicks send shockwaves, hovering work
or disciplines makes the world react, and in the final chapter visitors can leave a star that the site remembers
(localStorage), along with a visit counter.

## Run
    python3 -m http.server 8000   # then open http://localhost:8000

ES modules need a server (file:// won't work). Works on GitHub Pages as-is.

## Make it yours
- `content.js` — email/links, projects, disciplines (placeholders marked `TODO`)
- `index.html` — headline and story copy for each chapter
- `world.js` — `PALETTE` (colours per chapter), `POSES` (where the shape sits), `SHAPES` (the 5 forms)
- `styles.css` — type, spacing, layout

Respects `prefers-reduced-motion`, degrades to a text-only page if WebGL is unavailable, and lowers particle count on phones.

## Extra
`/quest` — the earlier Pac-Man style portfolio game.
