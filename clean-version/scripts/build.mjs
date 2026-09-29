import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { profile, projects } from '../content/site.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist');
const domain = 'https://www.jordanbailey.dev';
const year = new Date().getUTCFullYear();
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icons = {
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  github: '<path d="M9 19c-4.3 1.3-4.3-2.2-6-2.7m12 5v-3.9a3.4 3.4 0 0 0-1-2.7c3.3-.4 6.7-1.6 6.7-7.3A5.7 5.7 0 0 0 19.2 3.5 5.3 5.3 0 0 0 19.1 0S17.8-.4 15 1.5a14 14 0 0 0-7 0C5.2-.4 3.9 0 3.9 0a5.3 5.3 0 0 0-.1 3.5A5.7 5.7 0 0 0 2.3 7.4c0 5.7 3.4 6.9 6.7 7.3a3.4 3.4 0 0 0-1 2.7v3.9" transform="translate(1 1) scale(.95)"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 10v7M7 7v.01M11 17v-7m0 3a3 3 0 0 1 6 0v4"/>',
  x: '<path d="M4 4h4l12 16h-4L4 4Zm16 0L4 20"/>',
  code: '<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18"/>',
  project: '<path d="M14 3h7v7m0-7L10 14m0-10H4v16h16v-6"/>',
  arrow: '<path d="m10 5-7 7 7 7M3 12h18"/>',
  play: '<path d="m8 4 12 8-12 8V4Z"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
const socials = () => `<nav class="social" aria-label="Social links">${[['Email', `mailto:${profile.email}`, 'mail'], ['GitHub', profile.github, 'github'], ['LinkedIn', profile.linkedin, 'linkedin'], ['X / Twitter', profile.twitter, 'x']].map(([label, href, symbol]) => `<a href="${href}" aria-label="${label}" title="${label}">${icon(symbol)}</a>`).join('')}</nav>`;
const projectPath = project => `/projects/jordanbailey00/${project.repo}/`;
const footer = () => `<footer class="footer"><span>© ${year} Jordan Bailey</span><a href="/writing/">Writing</a><a href="/learning/">Learning</a><a href="https://github.com/jordanbailey00/personal-site/tree/archive/space-version-2026-09-29">Original site source</a><a href="https://aereeeee.github.io/">Design inspired by Aeree Cho</a></footer>`;
const intro = `<p>Hi, I'm Jordan, a software engineer and <strong>Computer Science master's student at Georgia Tech</strong>.</p><p>I'm interested in <strong>reinforcement learning</strong>, <strong>simulations</strong>, and <strong>games</strong>. I build environments where agents can learn, and the systems that make those experiments fast, reproducible, and easy to inspect.</p><p>My work spans deterministic game engines in C, GPU-accelerated training, and interactive tools. Away from the code, I'm usually thinking about space, astrodynamics, or a good science fiction story.</p>`;
const projectLinks = (project, includeArticle = true) => `<div class="project-links">${includeArticle ? `<a href="${projectPath(project)}">${icon('project')} Project</a>` : ''}${project.demo ? `<a href="${project.demo}">${icon('play')} Play</a>` : ''}<a href="${profile.github}/${project.repo}">${icon('code')} Code</a></div>`;
const projectRows = () => `<div class="project-list">${projects.map(p => `<article class="project"><a class="project-image" href="${projectPath(p)}" aria-label="Read about ${escape(p.title)}"><img src="/assets/${p.image}" alt="${escape(p.alt)}" width="486" height="243" loading="lazy" decoding="async"></a><div><div class="project-meta"><span class="tag">${p.category}</span>${p.badge ? `<span class="badge" title="${escape(p.note)}">${p.badge}</span>` : ''}</div><h3 class="project-title"><a href="${projectPath(p)}">${p.title}</a></h3><p class="project-description">${p.description}</p>${projectLinks(p)}</div></article>`).join('')}</div>`;
function document(title, description, pathname, body) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#ffffff"><title>${escape(title)}</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${domain}${pathname}"><meta property="og:type" content="website"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${domain}${pathname}"><meta property="og:image" content="${domain}/assets/jordan.jpg"><meta name="twitter:card" content="summary"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/style.css"><link rel="preload" href="/assets/fonts/akzidenz-bold.otf" as="font" type="font/otf" crossorigin></head><body><a class="skip-link" href="#main">Skip to content</a>${body}${footer()}</body></html>\n`;
}
const pages = new Map();
pages.set('/', document('Jordan Bailey', 'Software engineer and MSCS student at Georgia Tech. Reinforcement learning, simulations, and games.', '/', `<main id="main" class="contents"><section aria-labelledby="name"><header class="top"><div class="identity"><img class="portrait" src="/assets/jordan.jpg" alt="Jordan Bailey" width="120" height="120" fetchpriority="high"><div><h1 id="name" class="name">Jordan Bailey</h1><p class="subtitle">${profile.subtitle}</p></div></div>${socials()}</header><div class="info">${intro}</div></section><section aria-labelledby="now"><h2 class="section-title" id="now">Now</h2><div class="now"><div class="now-row"><span class="now-label">Studying</span><p>Computer science at <a href="https://www.gatech.edu/">Georgia Tech</a>, with a focus on AI and machine learning systems.</p></div><div class="now-row"><span class="now-label">Building</span><p>Fast game simulations and reinforcement learning environments for <a href="${projectPath(projects[1])}">RuneC</a> and <a href="${projectPath(projects[0])}">Fight Caves RL</a>.</p></div><div class="now-row"><span class="now-label">Exploring</span><p>How intelligent behavior emerges from simple rules, rich environments, and a lot of experience.</p></div></div></section><section aria-labelledby="projects"><h2 class="section-title" id="projects">Projects</h2>${projectRows()}<a class="more-link" href="${profile.github}?tab=repositories">More on GitHub ↗</a></section><section aria-labelledby="notes"><h2 class="section-title" id="notes">Notes &amp; learning</h2><div class="notes"><div><h3><a href="/writing/">Writing</a></h3><p>New writing will appear here. Coming soon.</p></div><div><h3><a href="/learning/">Learning recommendations</a></h3><p>Books, courses, and useful resources. Coming soon.</p></div></div></section><section aria-labelledby="contact"><h2 class="section-title" id="contact">Get in touch</h2><p class="contact-copy">Feel free to reach out at <a href="mailto:${profile.email}">${profile.email}</a>, or find me on <a href="${profile.github}">GitHub</a>, <a href="${profile.linkedin}">LinkedIn</a>, and <a href="${profile.twitter}">X</a>.</p></section></main>`));
for (const project of projects) {
  const article = await readFile(path.join(root, 'content', `${project.slug}.html`), 'utf8');
  const pathname = projectPath(project);
  pages.set(pathname, document(`${project.title} | Jordan Bailey`, project.description, pathname, `<main class="page" id="main"><a class="back-link" href="/#projects">${icon('arrow')} Back to Home</a><h1 class="page-title">${project.title}</h1><p class="page-subtitle">${project.detail}</p><div class="page-links">${projectLinks(project, false)}</div><figure><img class="cover" src="/assets/${project.image}" alt="${escape(project.alt)}" width="1000" height="500"><figcaption class="cover-caption">${project.tools}</figcaption></figure><article class="prose">${article}</article><nav class="article-end" aria-label="Article navigation"><a href="/#projects">← All projects</a><a href="${profile.github}/${project.repo}">View source on GitHub ↗</a></nav></main>`));
}
function simple(pathname, title, description, content) {
  pages.set(pathname, document(`${title} | Jordan Bailey`, description, pathname, `<main class="page simple-page" id="main"><a class="back-link" href="/">${icon('arrow')} Back to Home</a><h1 class="page-title">${title}</h1><p class="page-subtitle">${description}</p><div class="prose">${content}</div></main>`));
}
simple('/about/', 'About', 'Software engineer · MSCS student at Georgia Tech', intro + '<h2>What I work with</h2><p>C, C++, Python, TypeScript, and Kotlin. My interests include PyTorch, JAX, PufferLib, CUDA, Raylib, React, and the systems behind fast, reliable simulations.</p><p><a href="/#projects">Explore my projects →</a></p>');
simple('/contact/', 'Get in touch', 'Feel free to reach out anytime.', `<p><a href="mailto:${profile.email}">${profile.email}</a></p><p><a href="${profile.github}">GitHub</a> · <a href="${profile.linkedin}">LinkedIn</a> · <a href="${profile.twitter}">X / Twitter</a></p>`);
simple('/writing/', 'Writing', 'Coming soon.', '<p>New writing will appear here.</p><p>In the meantime, you can read about the design decisions, experiments, and results behind my <a href="/#projects">projects</a>.</p>');
simple('/learning/', 'Learning recommendations', 'Coming soon.', '<p>New learning recommendations will appear here.</p>');
simple('/projects/', 'Projects', 'Game engines, reinforcement learning, and interactive worlds.', projectRows());

// Remove only this generator's output; never touch either version's source.
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(path.join(root, 'assets'), path.join(out, 'assets'), { recursive: true });
for (const [pathname, html] of pages) {
  const directory = path.join(out, pathname);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), html);
  // Preserve the original Next.js static export's .html URLs too.
  if (pathname !== '/') await writeFile(path.join(out, `${pathname.slice(0, -1)}.html`), html);
}
// The original site used both capitalizations of this project route.
for (const suffix of ['', '.html']) {
  const destination = path.join(out, 'projects/jordanbailey00', `FightCaves-RL${suffix}`);
  if (!suffix) await mkdir(destination, { recursive: true });
  await writeFile(suffix ? destination : path.join(destination, 'index.html'), pages.get('/projects/jordanbailey00/fight-caves-rl/'));
}
await writeFile(path.join(out, '404.html'), document('Page not found | Jordan Bailey', 'This page could not be found.', '/', '<main class="page simple-page" id="main"><a class="back-link" href="/">← Back to Home</a><h1 class="page-title">Page not found</h1><p>This address may have changed. You can find my work on the <a href="/">home page</a>.</p></main>'));
await writeFile(path.join(out, 'CNAME'), 'www.jordanbailey.dev\n');
await writeFile(path.join(out, '.nojekyll'), '');
await writeFile(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${domain}/sitemap.xml\n`);
await writeFile(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...pages.keys()].map(url => `<url><loc>${domain}${url}</loc></url>`).join('')}</urlset>\n`);
console.log(`Built ${pages.size} pages and legacy URL aliases in ${out}`);
