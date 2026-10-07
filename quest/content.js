// ✏️ EDIT THIS FILE to make the portfolio yours. Everything shown in the game comes from here.
// The `html` fields accept plain HTML.

export const PROFILE = {
  name: 'AAYUSH PATEL',
  role: 'Software Developer · Creative Coder',
  github: 'https://github.com/aayushpatel51',
  email: 'patelaayush965@gmail.com',
};

// Order matters: orb 1..5 on the maze are these sections in order.
export const SECTIONS = [
  {
    id: 'about', label: 'ABOUT', color: 0xffd400,
    title: 'About Me',
    html: `<p>Hi, I'm <b>Aayush</b> — a developer who loves building fast, playful and well-crafted things for the web.
    I enjoy turning ideas into interactive experiences, from clean back-end APIs to 3D front-ends.</p>
    <p>Replace this text with a short story about who you are, what drives you, and what you're looking for next.</p>`,
  },
  {
    id: 'skills', label: 'SKILLS', color: 0x27e8ff,
    title: 'Skills',
    html: `<p>
      <span class="tag">JavaScript</span><span class="tag">TypeScript</span><span class="tag">React</span>
      <span class="tag">Three.js</span><span class="tag">Node.js</span><span class="tag">Python</span>
      <span class="tag">HTML / CSS</span><span class="tag">SQL</span><span class="tag">Git</span><span class="tag">REST APIs</span>
    </p><p>Swap these tags for the tools and technologies you actually use.</p>`,
  },
  {
    id: 'projects', label: 'PROJECTS', color: 0xff4fd8,
    title: 'Projects',
    html: `
      <div class="proj"><b>Project One</b><br>One-line description of what it does and the tech behind it. <a href="#">Live</a> · <a href="#">Code</a></div>
      <div class="proj"><b>Project Two</b><br>What problem it solves and the impact it had. <a href="#">Live</a> · <a href="#">Code</a></div>
      <div class="proj"><b>Project Three</b><br>Something you're proud of. <a href="#">Live</a> · <a href="#">Code</a></div>`,
  },
  {
    id: 'experience', label: 'EXPERIENCE', color: 0x7dff6a,
    title: 'Experience & Education',
    html: `
      <div class="proj"><b>Role / Company</b> <span style="color:var(--dim)">· 20XX – Present</span><br>What you built and achieved.</div>
      <div class="proj"><b>Previous Role / Company</b> <span style="color:var(--dim)">· 20XX – 20XX</span><br>Key responsibilities and results.</div>
      <div class="proj"><b>Degree / University</b> <span style="color:var(--dim)">· 20XX</span><br>Focus area, honours, notable coursework.</div>`,
  },
  {
    id: 'contact', label: 'CONTACT', color: 0xff8a2a,
    title: 'Contact',
    html: `<p>Want to work together or just say hi?</p>
      <p>📧 <a href="mailto:${'patelaayush965@gmail.com'}">patelaayush965@gmail.com</a><br>
      🐙 <a href="https://github.com/aayushpatel51" target="_blank" rel="noopener">github.com/aayushpatel51</a></p>`,
  },
];
