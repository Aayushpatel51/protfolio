// ✏️ EDIT THIS FILE to make the studio yours. Placeholder copy is marked TODO.

export const SITE = {
  studio: 'NirmaanLab',              // wordmark in the header
  company: 'Vidurtech Solutions Pvt. Ltd.', // legal entity, shown in the footer
  descriptor: 'Independent design & 3D studio',
  email: 'patelaayush965@gmail.com',
  github: 'https://github.com/aayushpatel51',
  linkedin: '',                      // TODO: add your LinkedIn URL (leave '' to hide)
  instagram: '',                     // TODO: optional
  location: 'India',                 // TODO: city, country
  timezone: 'Asia/Kolkata',          // TODO: your IANA timezone, for the live local clock
  availability: 'Booking projects for Q1 2027', // TODO: or '' to hide
};

// Selected work. Leave PROJECTS empty ([]) until you have case studies: the site then shows a
// "coming soon" section instead. When you add one, set `href` to its page and `hue` (0–360) to tint its tile.
export const PROJECTS = [
  // { title: 'Project name', kind: 'Brand · 3D · Web', year: '2027', hue: 18, line: 'One sentence on the idea and the result.', href: 'https://…' },
];

// Shown while PROJECTS is empty. Edit freely.
export const COMING_SOON = {
  heading: 'First projects, <em>coming soon.</em>',
  intro: 'The studio is new and the first case studies are being built right now. Want yours to be one of them?',
  tiles: [
    { title: 'In the studio',  kind: 'Case study · in progress', hue: 18 },
    { title: 'Your project?',  kind: 'Brand · Interface · 3D',   hue: 172 },
    { title: 'Coming soon',    kind: 'Motion · Creative code',   hue: 268 },
  ],
};

// Services index. Hover a row and the world reacts.
export const SERVICES = [
  { name: 'Brand identity',   line: 'Strategy, naming, visual systems and voice with a point of view.',          items: ['Positioning', 'Logo & identity', 'Guidelines'] },
  { name: 'Interface design', line: 'Websites and products that look beautiful and are easy to use.',            items: ['Web & app design', 'Design systems', 'Prototyping'] },
  { name: '3D & motion',      line: 'Real-time worlds, shaders and animation that give things a pulse.',         items: ['WebGL / Three.js', 'Motion design', 'Art direction'] },
  { name: 'Creative code',    line: 'Generative systems, particles, physics and play.',                          items: ['Interactive installs', 'Generative visuals', 'Prototypes'] },
  { name: 'Engineering',      line: 'Fast, accessible, production-grade builds. It has to ship.',                items: ['Front-end', 'Performance', 'CMS & launch'] },
];
