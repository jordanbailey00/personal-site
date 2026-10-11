# Jordan Bailey — clean version

A small, static portfolio based on the supplied Aeree Cho website oracle. It follows the reference's white canvas, narrow column, circular profile image, quiet section dividers, and image/text project rows. No runtime framework, third-party services, API keys, or build dependencies are required. A shared theme picker offers Auto, Light, Rust, Coal, Navy, Ayu, Supernova, and Novasuper on every page. Auto follows the device appearance; an explicit selection persists across pages, tabs, and visits. Old dark-mode preferences map to Coal. Rust is a warm ivory reading palette (`#f2e7d5`) with soft brown text and muted copper accents; Light retains its white background.

## Develop

```sh
npm run dev
```

Open http://127.0.0.1:4173. Re-run `npm run build` after editing. `npm run check` verifies the generated pages, internal links, theme persistence/device changes/storage fallbacks, retired style preference migration, keyboard menu dismissal, multi-article listing behavior, current-section tracking, and both star themes’ animation lifecycle.

Profile and project metadata live in `content/site.mjs`. The three project summaries in `content/*.html` give a short, plain-language introduction and a few outcomes. Keep these around 100 words, with occasional light humor; long explanations belong in Writing, and implementation details belong on GitHub. The original long case studies remain in the retired site and Git history. `scripts/import-case-studies.cjs` is a legacy importer and would overwrite the concise summaries. Layout and page generation live in `scripts/build.mjs`; styling lives in `assets/style.css`.

## CV

The homepage CV link opens `/cv/`; `/cv.pdf` is its downloadable counterpart. Both use `content/cv.json`, based on the provided résumé. The web CV follows the supplied reference's exact eleven-section order, left date column, two-column contacts, highlighted introduction, and typography, with support for dark mode. Empty sections remain blank for future additions; unspecified dates, advisors, locations, and course details are not invented.

Edit `content/cv.json` to update the CV. Regenerate its PDF with `python3 scripts/build-cv-pdf.py` using Python with ReportLab and Liberation Sans fonts (`CV_FONT_DIR` can override the font directory), visually review the pages, and then run the normal build. `public/cv.pdf` is checked in, so the deployment still requires no Python dependencies. The résumé's ICAT award, NASA Lab research, and teaching-assistant information are placed in their respective sections; Technology Skills retains the résumé's tool categories.

## Preservation and hosting

The original Next.js website is unchanged in the sibling `space-version` checkout, and remains at the repository root on GitHub. The `archive/space-version-2026-09-29` tag preserves its pre-redesign commit `72f2bebe344a394354ef47cce69a9720fb5d7323`, including its original deployment workflow. The redesign is published from the repository's `clean-version/` directory using the existing GitHub Pages deployment and domain `www.jordanbailey.dev`; the apex domain redirects there.

To restore the original website, restore the deployment workflow from the archive tag to the default branch and run it. The original source, dependencies, and GitHub secrets remain available. No domain changes are required.

## Assets

- Favicon: the original website's `public/favicon.png`, preserved unchanged at `/favicon.png` in both light and dark mode.
- Design and name font: the user's downloaded reference in `oracle/aereeeee.github.io/`.
- Ubuntu Sans: Canonical’s unmodified variable WOFF2 fonts (regular and italic), version 1.006, from [Ubuntu-Sans-fonts](https://github.com/canonical/Ubuntu-Sans-fonts/tree/main/fonts/webfont). Copyright 2011, 2022, 2023 Canonical Ltd.; the Ubuntu Font Licence is included in `assets/fonts/ubuntu-sans-LICENCE.txt`. These fonts are served locally, without an external font-service dependency.
- Profile photo: Jordan's public GitHub avatar.
- RuneC and Fight Caves screenshots: the respective public project READMEs.
- Byte World image: the original website's `public/byte_world_thumbnail.png`.

The reference person's biography, projects, and other personal content are not included.

## Books and software

The homepage and `/learning/` share the book shelf and software recommendations. Edit the `books` and `software` arrays in `content/site.mjs` to add or change entries. Books have a cover filename, its pixel dimensions, and an author; they display without hyperlinks. Software entries have a name, link, and short description. `scripts/recommendations.mjs` renders both lists, and `assets/style.css` supplies responsive layouts that use the shared color themes. Main sections have full-width dividers and generous space above their headings.

Cover images are local WebP assets in `public/books/`, converted from the authors' or publishers' cover images. See `public/books/SOURCES.md` for their sources. They load lazily and display without cropping.

## Writing

The first essay, `content/writing/reinforcement-learning-for-runescape.html`, uses the September 13–14 Fight Caves baseline and separately identifies the September 17 follow-up. Its original screenshots and public results extract live in `public/writing/reinforcement-learning-for-runescape/`. Four visualization briefs and two screenshot capture requests describe the artwork Jordan will supply. Do not generate replacement diagrams; retain these descriptions until supplied artwork is ready.

`/writing/` is the writing hub, listing every published entry from `content/writing/posts.mjs`. The homepage uses the same listing renderer for its three most recent entries: the Writing heading and All writing link open the hub, while article titles open their individual pages. `/writing/template/` remains a labeled authoring preview, excluded from the sitemap and marked `noindex`.

Writing pages open with the contents sidebar hidden on desktop and mobile, including before JavaScript loads. The contents button at the top left opens it; each new page starts closed. Only the contents and theme buttons appear above the article, without a banner or repeated title. Inline contents remain available without JavaScript. The reading layout retains section navigation and code examples inspired by [Structure and Interpretation of Tensor Programs](https://sitp.ai/). Its text column is centered in the space beside the sidebar, with equal left/right padding. Font families, body and heading sizes, page colors, and themes come from the main site stylesheet. Rust uses a medium warm-brown writing sidebar with pale text; Light uses a pale-gray sidebar with dark text. Every theme gives the current section or subsection its own accent color, tinted background, heavier text, and a left marker. Reading position deduplicates headings shared by the sidebar and inline contents, so subsections remain selected until the next heading. Articles put supporting footnotes in the right margin on screens at least 1200px wide. Equal gutters keep the main text centered; notes return to document flow on smaller screens and in print.

To add or migrate an essay:

1. Copy `templates/article.html` to `content/writing/<slug>.html`. Replace the sample content with the essay body; the layout supplies its title, author, date, and navigation.
2. Add an entry to `content/writing/posts.mjs` with `slug`, `title`, `subtitle`, an ISO `date`, `file`, and `status: 'draft'`. Drafts are omitted from the output entirely. Manifest order is the index and previous/next order.
3. Use `<h2 id="section-name">…</h2>` and `<h3 id="subsection-name">…</h3>` for automatic section navigation. IDs must be unique, lowercase, and hyphenated. Put images in `public/writing/<slug>/` and refer to them with absolute `/writing/<slug>/…` URLs.
4. Change the status to `published` when the essay is ready, then build and check. The homepage, hub, chapter links, reading time, and sitemap update automatically.

Add a `thumbnail` object to each essay's metadata with `src`, descriptive `alt` text, and the source image's pixel `width` and `height`. For example: `thumbnail: { src: '/writing/my-essay/thumbnail.jpg', alt: 'A description of the image', width: 640, height: 640 }`. Store the image in `public/writing/<slug>/`. The writing hub and homepage show the same thumbnail beside the title, summary, and date; the entire entry links to the article. Images fit inside a square without cropping and shrink on mobile. Entries without thumbnail metadata remain text-only.

The template demonstrates `.with-margin` + `.margin-note` (responsive side footnotes with reference and return links), `.concept-box`, `.example-box`, `.notebook` with copyable code and static output, `.reading-details`, `.article-figure`, `.wide-figure`, `.table-scroll`, and `.reference-list`. Code/output is presentational; it does not execute readers' code. Figures use the reading column’s width and may contain supplied images, video, or accessible iframe embeds. Equations can use semantic MathML or authored HTML; no remote rendering service is required. All writing content remains readable without JavaScript; navigation controls, reading progress, and copying progressively enhance it.

Use `<p class="drop-cap">…</p>` for a section's opening paragraph. The decorative Goudy initial retains its size, weight, and spacing alongside Ubuntu Sans body text. Its rule and font import live in `assets/writing.css`. The text remains one paragraph for selection and screen readers.

The reading implementation is in `scripts/writing.mjs`, `assets/writing.css`, and `assets/writing.js`. The shared appearance controls are in `scripts/appearance.mjs` and `assets/theme.js`. All palettes and shared typography live in `assets/style.css`. The original site and favicon are preserved.


## Typography

The site explicitly loads bundled **Ubuntu Sans 1.006** for body text, subtitles, section headings, entry titles, and the CV. Akzidenz Grotesk BQ Bold is used only for Jordan's name on the homepage and CV. The user-supplied font-inspector screenshots are the typography reference; relying on `system-ui` or OS fallback stacks does not reproduce their Ubuntu Sans appearance on other systems.

The homepage uses a 16.2px root: the name is 2.5rem / 1 line height / weight 600 / −0.08rem tracking; the subtitle is 1.17rem / 1.2 / 400; body copy is 1rem / 1.6 / 400; section headings are 1.4rem / 1.6 / 500; entry titles are 1rem / 1.6 / 600; date labels are 0.8rem / 1.3 / 400. Project descriptions use 0.95rem / 1.3 / 400. Homepage section underlines and 3rem gaps keep sections distinct. At the reference's 700px breakpoint, the homepage name becomes 2.2rem and its subtitle 0.85rem.

The CV retains its separate scale: 2.25rem / 1.25 / 600 for the Akzidenz name, 2rem / 1.5 / 400 for section headings, and 1rem / 1.5 body copy. All CV text except the name, including the subtitle, uses Ubuntu Sans. Color themes and existing content layouts remain available.
The paintbrush control selects among eight color themes; there is one shared typography throughout the site. The retired **Aa** style picker and Fantasy stylesheet have been removed. Existing `jordan-bailey-style` preferences are cleared on load. The `jordan-bailey-theme` preference is applied before CSS loads and synchronized across tabs. Storage failures still permit selections for the current page.

The homepage description uses uniform regular-weight text. CV highlights share rounded shapes and padding across themes. Dark CV themes pair muted green, blue, and rose backgrounds with light accent text. Generated stylesheet and behavior-script URLs include content hashes to prevent stale assets after deployments. CV navigation also includes a version derived from the shared palette, CV stylesheet, and theme script, so an older cached CV document does not retain a previous palette when opened from the updated site.

To add a footnote, use the `.with-margin` wrapper from `templates/article.html`, containing a text `<div>` and an `<aside class="margin-note">`. Put it around the paragraph that contains the reference, give each reference/note pair unique IDs and reciprocal links, and keep notes concise. The shared grid reserves enough vertical space for long notes to avoid collisions. No scripting or duplicate mobile note content is required.


## Article openings and callouts

An optional `<header class="article-opening">` at the start of an essay supplies its opening image and learning overview. The writing builder places it after the title and before the contents. See `templates/article.html` for a figure, a short motivating question, learning objectives, and prerequisites. Use an existing screenshot or supplied artwork; do not generate diagrams.

Use `<aside class="callout" data-callout="note"><p>Supporting context.</p></aside>` for a callout. `scripts/callouts.mjs` supplies its accessible label and icon at build time. Supported types are `note`, `important`, `warning`, `tip`, `caution`, and `question`. The text stays readable without JavaScript. Use Note for context, Important for an essential condition, Warning for an easy-to-make mistake, Tip for a useful practice, Caution for a consequential risk, and Question for a short reasoning exercise. Do not add one merely to vary the page's appearance.

`assets/callouts.css` matches SITP's exact per-theme blue, purple, amber, green, and red accents, plus its burnt-orange Question accent. All themes share its icon/label/4px-rule treatment and Ubuntu Sans typography; Novasuper inverts Supernova’s accent colors. Octicons are included under their MIT license in `assets/icons/OCTICONS-LICENSE.txt`. The Fight Caves article uses seven callouts and five side footnotes; the existing capture and diagram briefs are preserved.


## Supernova and Novasuper

Supernova brings back the original star field from `space-version/components/starfield/Starfield.tsx`, with its 5,000 white circular particles in a spherical shell (radii 20–80), camera at z=5 and 60° field of view, volume offset z=−60, fog at 25–120, 0.15 point size, 0.7 opacity, and rotation rates x=0.005, y=0.015, z=0.002 radians/second. The shared theme picker selects either star theme on every page. Layout, typography, and the favicon remain unchanged.

Novasuper is Supernova’s exact color inverse: a white background, dark stars, and dark text. Its palette variables invert Supernova’s colors, and a CSS filter inverts only the star-field canvas. Photos, book covers, and other media retain their original colors. Switching between the two star themes reuses the same renderer and star positions.

`assets/supernova.js` loads `assets/starfield.js` only when either star theme is visible and selected. The renderer uses the same Three.js 0.183.2 build already installed for the retired site, vendored locally in `assets/vendor/three/` with its MIT license. Non-star themes never download the 3D renderer. The effect pauses in hidden tabs, disposes its graphics resources when leaving both star themes, and shows a still star field for reduced-motion preferences. WebGL or loading failures leave the selected black or white palette readable. Printing hides the canvas and uses the existing light print palette.
