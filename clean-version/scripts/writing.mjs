import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { posts } from '../content/writing/posts.mjs';

const stripTags = value => value.replace(/<[^>]*>/g, '');
const formatDate = value => new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
const menuIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
const printIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M7 8V3h10v5M7 17H3V8h18v9h-4M7 14h10v7H7Z"/></svg>';

export async function writingPages({ root, escape, themeToggle }) {
  const published = posts.filter(post => post.status === 'published');
  const slugs = new Set(['template']);
  for (const post of published) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) || slugs.has(post.slug)) throw new Error(`Invalid or duplicate writing slug: ${post.slug}`);
    slugs.add(post.slug);
    if (!post.title || !post.subtitle || !/^\d{4}-\d{2}-\d{2}$/.test(post.date) || Number.isNaN(Date.parse(`${post.date}T12:00:00Z`))) throw new Error(`Incomplete writing metadata: ${post.slug}`);
    if (!/^[a-z0-9-]+\.html$/.test(post.file)) throw new Error(`Invalid article filename: ${post.file}`);
  }
  const linkTo = post => `/writing/${post.slug}/`;
  const contents = headings => headings.map(heading => `<li class="${heading.level === '3' ? 'subsection-link' : ''}"><a href="#${escape(heading.id)}" data-section-link>${heading.title}</a></li>`).join('');

  function shell({ title, body, current = '', headings = [], preview = false, previous, next }) {
    return `<div class="reading-progress" aria-hidden="true"><span data-reading-progress></span></div>
<aside class="book-sidebar" id="writing-sidebar" aria-label="Writing navigation">
  <a class="book-author" href="/">Jordan Bailey</a><a class="book-name" href="/writing/">Writing</a>
  <nav aria-label="Writing contents"><p class="sidebar-label">Contents</p><ol class="book-chapters"><li><a href="/writing/" ${!current ? 'aria-current="page"' : ''}>All writing</a></li>${published.map((post, index) => `<li><a href="${linkTo(post)}" ${current === post.slug ? 'aria-current="page"' : ''}><span class="chapter-number">${String(index + 1).padStart(2, '0')}.</span> ${escape(post.title)}</a>${current === post.slug ? `<ol class="section-links">${contents(headings)}</ol>` : ''}</li>`).join('')}</ol>${!published.length ? '<p class="sidebar-empty">No essays published yet.</p>' : ''}
  <div class="sidebar-preview"><a href="/writing/template/" ${preview ? 'aria-current="page"' : ''}>Article template <span>Preview</span></a>${preview ? `<ol class="section-links">${contents(headings)}</ol>` : ''}</div></nav>
  <div class="sidebar-bottom"><a href="/">← Home</a><a href="/cv/">CV</a><span data-reading-label></span></div>
</aside>
<button class="sidebar-shade" type="button" aria-label="Close contents" tabindex="-1" hidden></button>
<div class="book-page">
  <header class="reader-toolbar"><div class="reader-actions"><button class="reader-button" type="button" data-contents-toggle aria-label="Toggle contents" aria-expanded="true" aria-controls="writing-sidebar" hidden>${menuIcon}</button>${themeToggle()}</div><a class="toolbar-title" href="/writing/">${escape(title)}</a><button class="reader-button print-button" type="button" data-print aria-label="Print this page" title="Print this page" hidden>${printIcon}</button></header>
  <main class="book-main ${current ? 'book-article' : 'book-index'}" id="main" tabindex="-1">${body}
  ${current ? `<nav class="chapter-navigation" aria-label="Essay navigation">${previous ? `<a href="${linkTo(previous)}"><small>Previous essay</small>← ${escape(previous.title)}</a>` : '<a href="/writing/"><small>Contents</small>← All writing</a>'}${next ? `<a href="${linkTo(next)}"><small>Next essay</small>${escape(next.title)} →</a>` : '<a href="#main"><small>Return</small>Back to top ↑</a>'}</nav>` : ''}
  <footer class="book-footer"><span>Jordan Bailey</span><span>Reading design inspired by <a href="https://sitp.ai/">SITP</a></span></footer></main>
</div><span class="reader-status" role="status" aria-live="polite" data-reader-status></span>`;
  }

  const articleList = published.length ? `<ol class="essay-list">${published.map((post, index) => `<li><span class="essay-number">${String(index + 1).padStart(2, '0')}</span><div><h3><a href="${linkTo(post)}">${escape(post.title)}</a></h3><p>${escape(post.subtitle)}</p><time datetime="${post.date}">${formatDate(post.date)}</time></div></li>`).join('')}</ol>` : '<div class="empty-library"><p class="empty-title">The first essay is still to come.</p><p>New writing will appear here as it is ready.</p></div>';
  const indexBody = `<header class="book-title-page"><p class="book-kicker">The collected notes of Jordan Bailey</p><h1>Writing</h1><p class="book-subtitle">On learning, building,<br>and understanding things.</p><div class="book-ornament" aria-hidden="true">✧</div><p class="book-byline">Jordan Bailey</p></header><section class="writing-contents" aria-labelledby="writing-contents"><div class="contents-heading"><h2 id="writing-contents">Contents</h2><span>${published.length} ${published.length === 1 ? 'essay' : 'essays'}</span></div>${articleList}</section><p class="template-link"><a href="/writing/template/">Preview the article template <span aria-hidden="true">→</span></a><span>A look at the reading layout.</span></p>`;
  const pages = [{ pathname: '/writing/', title: 'Writing | Jordan Bailey', description: 'Essays and notes by Jordan Bailey on learning, building, and understanding things.', body: shell({ title: 'Writing', body: indexBody }) }];

  const template = { slug: 'template', title: 'A place for the next idea', subtitle: 'An article template for the things still to be written.', preview: true, html: await readFile(path.join(root, 'templates/article.html'), 'utf8') };
  for (const post of [...published, template]) {
    let html = post.html || await readFile(path.join(root, 'content/writing', post.file), 'utf8');
    const headings = [];
    const headingIds = new Set();
    html = html.replace(/<h([23]) id="([a-z0-9-]+)">([\s\S]*?)<\/h\1>/g, (_, level, id, title) => {
      if (headingIds.has(id)) throw new Error(`Duplicate heading ID ${id} in ${post.slug}`);
      headingIds.add(id);
      headings.push({ level, id, title: stripTags(title) });
      return `<h${level} id="${id}"><a class="heading-link" href="#${id}">${title}</a></h${level}>`;
    });
    const position = published.indexOf(post);
    const minutes = Math.max(1, Math.ceil(stripTags(html).split(/\s+/).length / 220));
    const body = `${post.preview ? '<div class="template-notice"><strong>Template preview</strong><span>Sample layout only · No essay published</span></div>' : ''}<header class="essay-header"><p class="book-kicker">${post.preview ? 'An unwritten chapter' : `Essay ${String(position + 1).padStart(2, '0')}`}</p><h1>${escape(post.title)}</h1><p class="essay-subtitle">${escape(post.subtitle)}</p><p class="essay-meta">Jordan Bailey <span aria-hidden="true">·</span> ${post.preview ? 'Undated draft' : `<time datetime="${post.date}">${formatDate(post.date)}</time> <span aria-hidden="true">·</span> ${minutes} min read`}</p></header><nav class="inline-contents" aria-label="On this page"><details open><summary>In this chapter</summary><ol>${contents(headings.filter(heading => heading.level === '2'))}</ol></details></nav><article class="reading-prose">${html}</article>`;
    pages.push({ pathname: linkTo(post), title: `${post.title} | Jordan Bailey`, description: post.subtitle, noindex: !!post.preview, article: !post.preview, body: shell({ title: post.preview ? 'Article template' : post.title, body, current: post.slug, headings, preview: post.preview, previous: published[position - 1], next: post.preview ? null : published[position + 1] }) });
  }
  return pages;
}
