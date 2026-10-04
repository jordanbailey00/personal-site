# Jordan Bailey — clean version

A small, static portfolio based on the supplied Aeree Cho website oracle. It follows the reference's white canvas, narrow column, circular profile image, quiet section dividers, and image/text project rows. No runtime framework, third-party scripts, API keys, or build dependencies are required. A shared theme picker offers Auto, Light, Rust, Coal, Navy, and Ayu on every page. Auto follows the device appearance; an explicit selection persists across pages, tabs, and visits. Old dark-mode preferences map to Coal.

## Develop

```sh
npm run dev
```

Open http://127.0.0.1:4173. Re-run `npm run build` after editing. `npm run check` verifies the generated pages, internal links, theme persistence/device changes/storage fallbacks, and multi-article listing behavior.

Profile and project metadata live in `content/site.mjs`. The three project articles in `content/*.html` were imported from the original site with `scripts/import-case-studies.cjs`; their prose and code examples are preserved, with empty screenshot placeholders omitted. Layout and page generation live in `scripts/build.mjs`; styling lives in `assets/style.css`.

## CV

The homepage CV link opens `/cv/`; `/cv.pdf` is its downloadable counterpart. Both use `content/cv.json`, based on the provided résumé. The web CV follows the supplied reference's exact eleven-section order, left date column, two-column contacts, highlighted introduction, and typography, with support for dark mode. Empty sections remain blank for future additions; unspecified dates, advisors, locations, and course details are not invented.

Edit `content/cv.json` to update the CV. Regenerate its PDF with `python3 scripts/build-cv-pdf.py` using Python with ReportLab and Liberation Sans fonts (`CV_FONT_DIR` can override the font directory), visually review the pages, and then run the normal build. `public/cv.pdf` is checked in, so the deployment still requires no Python dependencies. The résumé's ICAT award, NASA Lab research, and teaching-assistant information are placed in their respective sections; Technology Skills retains the résumé's tool categories.

## Preservation and hosting

The original Next.js website is unchanged in the sibling `space-version` checkout, and remains at the repository root on GitHub. The `archive/space-version-2026-09-29` tag preserves its pre-redesign commit `72f2bebe344a394354ef47cce69a9720fb5d7323`, including its original deployment workflow. The redesign is published from the repository's `clean-version/` directory using the existing GitHub Pages deployment and domain `www.jordanbailey.dev`; the apex domain redirects there.

To restore the original website, restore the deployment workflow from the archive tag to the default branch and run it. The original source, dependencies, and GitHub secrets remain available. No domain changes are required.

## Assets

- Favicon: the original website's `public/favicon.png`, preserved unchanged at `/favicon.png` in both light and dark mode.
- Design and heading fonts: the user's downloaded reference in `oracle/aereeeee.github.io/`.
- Profile photo: Jordan's public GitHub avatar.
- RuneC and Fight Caves screenshots: the respective public project READMEs.
- Byte World image: the original website's `public/byte_world_thumbnail.png`.

The reference person's biography, projects, and other personal content are not included. Learning remains marked coming soon.

## Writing

The first essay, `content/writing/reinforcement-learning-for-runescape.html`, uses the September 13–14 Fight Caves baseline and separately identifies the September 17 follow-up. Its original screenshots and public results extract live in `public/writing/reinforcement-learning-for-runescape/`. Four visualization briefs and two screenshot capture requests describe the artwork Jordan will supply. Do not generate replacement diagrams; retain these descriptions until supplied artwork is ready.

`/writing/` is the writing hub, listing every published entry from `content/writing/posts.mjs`. The homepage uses the same listing renderer for its three most recent entries: the Writing heading and All writing link open the hub, while article titles open their individual pages. `/writing/template/` remains a labeled authoring preview, excluded from the sitemap and marked `noindex`.

The reading layout retains the contents sidebar, section navigation, and code examples inspired by [Structure and Interpretation of Tensor Programs](https://sitp.ai/). Its text column is centered in the space beside the sidebar, with equal left/right padding. Font families, body and heading sizes, colors, and themes come from the main site stylesheet. Supporting notes stay in the reading column rather than reserving an asymmetric right gutter.

To add or migrate an essay:

1. Copy `templates/article.html` to `content/writing/<slug>.html`. Replace the sample content with the essay body; the layout supplies its title, author, date, and navigation.
2. Add an entry to `content/writing/posts.mjs` with `slug`, `title`, `subtitle`, an ISO `date`, `file`, and `status: 'draft'`. Drafts are omitted from the output entirely. Manifest order is the index and previous/next order.
3. Use `<h2 id="section-name">…</h2>` and `<h3 id="subsection-name">…</h3>` for automatic section navigation. IDs must be unique, lowercase, and hyphenated. Put images in `public/writing/<slug>/` and refer to them with absolute `/writing/<slug>/…` URLs.
4. Change the status to `published` when the essay is ready, then build and check. The homepage, hub, chapter links, reading time, and sitemap update automatically.

The template demonstrates `.with-margin` + `.margin-note` (inline supporting notes), `.concept-box`, `.example-box`, `.notebook` with copyable code and static output, `.reading-details`, `.article-figure`, `.wide-figure`, `.table-scroll`, and `.reference-list`. Code/output is presentational; it does not execute readers' code. Figures use the reading column’s width and may contain supplied images, video, or accessible iframe embeds. Equations can use semantic MathML or authored HTML; no remote rendering service is required. All writing content remains readable without JavaScript; navigation controls, reading progress, print, and copying progressively enhance it.

The reading implementation is in `scripts/writing.mjs`, `assets/writing.css`, and `assets/writing.js`. The shared picker is in `scripts/appearance.mjs` and `assets/theme.js`; all palettes and typography live in `assets/style.css`. The original site and favicon are preserved. Legacy reference font files and notices remain in `assets/fonts/writing/`, but no page loads them.
