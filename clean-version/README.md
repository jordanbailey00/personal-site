# Jordan Bailey — clean version

A small, static portfolio based on the supplied Aeree Cho website oracle. It follows the reference's white canvas, narrow column, circular profile image, quiet section dividers, and image/text project rows. No runtime framework, third-party services, API keys, or build dependencies are required. A shared theme picker offers Auto, Light, Rust, Coal, Navy, Ayu, and Supernova on every page. Auto follows the device appearance; an explicit selection persists across pages, tabs, and visits. Old dark-mode preferences map to Coal.

## Develop

```sh
npm run dev
```

Open http://127.0.0.1:4173. Re-run `npm run build` after editing. `npm run check` verifies the generated pages, internal links, theme persistence/device changes/storage fallbacks, style/theme independence, keyboard menu dismissal, multi-article listing behavior, and the Supernova animation lifecycle.

Profile and project metadata live in `content/site.mjs`. The three project summaries in `content/*.html` give a short, plain-language introduction and a few outcomes. Keep these around 100 words, with occasional light humor; long explanations belong in Writing, and implementation details belong on GitHub. The original long case studies remain in the retired site and Git history. `scripts/import-case-studies.cjs` is a legacy importer and would overwrite the concise summaries. Layout and page generation live in `scripts/build.mjs`; styling lives in `assets/style.css`.

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

The reference person's biography, projects, and other personal content are not included.

## Books and software

The homepage and `/learning/` share the book shelf and software recommendations. Edit the `books` and `software` arrays in `content/site.mjs` to add or change entries. Books have a cover filename, its pixel dimensions, an author, and an official link; software entries have a name, link, and short description. `scripts/recommendations.mjs` renders both lists, and `assets/style.css` supplies responsive layouts that use the existing theme and style choices.

Cover images are local WebP assets in `public/books/`, converted from the authors' or publishers' cover images. See `public/books/SOURCES.md` for their sources. They load lazily and display without cropping.

## Writing

The first essay, `content/writing/reinforcement-learning-for-runescape.html`, uses the September 13–14 Fight Caves baseline and separately identifies the September 17 follow-up. Its original screenshots and public results extract live in `public/writing/reinforcement-learning-for-runescape/`. Four visualization briefs and two screenshot capture requests describe the artwork Jordan will supply. Do not generate replacement diagrams; retain these descriptions until supplied artwork is ready.

`/writing/` is the writing hub, listing every published entry from `content/writing/posts.mjs`. The homepage uses the same listing renderer for its three most recent entries: the Writing heading and All writing link open the hub, while article titles open their individual pages. `/writing/template/` remains a labeled authoring preview, excluded from the sitemap and marked `noindex`.

The reading layout retains the contents sidebar, section navigation, and code examples inspired by [Structure and Interpretation of Tensor Programs](https://sitp.ai/). Its text column is centered in the space beside the sidebar, with equal left/right padding. Font families, body and heading sizes, colors, and themes come from the main site stylesheet. Both styles put supporting footnotes in the right margin on screens at least 1200px wide. Equal gutters keep the main text centered; notes return to document flow on smaller screens and in print.

To add or migrate an essay:

1. Copy `templates/article.html` to `content/writing/<slug>.html`. Replace the sample content with the essay body; the layout supplies its title, author, date, and navigation.
2. Add an entry to `content/writing/posts.mjs` with `slug`, `title`, `subtitle`, an ISO `date`, `file`, and `status: 'draft'`. Drafts are omitted from the output entirely. Manifest order is the index and previous/next order.
3. Use `<h2 id="section-name">…</h2>` and `<h3 id="subsection-name">…</h3>` for automatic section navigation. IDs must be unique, lowercase, and hyphenated. Put images in `public/writing/<slug>/` and refer to them with absolute `/writing/<slug>/…` URLs.
4. Change the status to `published` when the essay is ready, then build and check. The homepage, hub, chapter links, reading time, and sitemap update automatically.

Add a `thumbnail` object to each essay's metadata with `src`, descriptive `alt` text, and the source image's pixel `width` and `height`. For example: `thumbnail: { src: '/writing/my-essay/thumbnail.jpg', alt: 'A description of the image', width: 640, height: 640 }`. Store the image in `public/writing/<slug>/`. The writing hub and homepage show the same thumbnail beside the title, summary, and date; the entire entry links to the article. Images fit inside a square without cropping and shrink on mobile. Entries without thumbnail metadata remain text-only.

The template demonstrates `.with-margin` + `.margin-note` (responsive side footnotes with reference and return links), `.concept-box`, `.example-box`, `.notebook` with copyable code and static output, `.reading-details`, `.article-figure`, `.wide-figure`, `.table-scroll`, and `.reference-list`. Code/output is presentational; it does not execute readers' code. Figures use the reading column’s width and may contain supplied images, video, or accessible iframe embeds. Equations can use semantic MathML or authored HTML; no remote rendering service is required. All writing content remains readable without JavaScript; navigation controls, reading progress, print, and copying progressively enhance it.

Use `<p class="drop-cap">…</p>` for a section's opening paragraph. Both styles share Fantasy's decorative Goudy initial, with the same size, weight, and spacing. Its rule and font import live in `assets/writing.css` so switching styles does not replace the drop cap. The text remains one paragraph for selection and screen readers.

The reading implementation is in `scripts/writing.mjs`, `assets/writing.css`, and `assets/writing.js`. The shared appearance controls are in `scripts/appearance.mjs` and `assets/theme.js`. All palettes and Classic typography live in `assets/style.css`; `assets/fantasy.css` is the separate Fantasy style package. The original site and favicon are preserved.


## Style packages

The **Aa** control selects Classic or Fantasy independently of the paintbrush theme control. Classic is the default and retains the original design. Fantasy follows [the supplied asitpofborscht fork](https://github.com/jordanbailey00/asitpofborscht) at commit `29c1c6341bbe0ef9f68285ca0e8d2b7c632f8fb4`: New Computer Modern serif text, its 16/24/32px type scale, real small-cap headings, Goudy Initialen drop caps, Vectorian dividers, compact tables, and notebook cells with hanging prompts. The page structure and navigation are shared. The font and decoration notices and licenses are included with the assets.

`data-style` scopes the Fantasy overrides. The package consumes the shared palette variables instead of assigning a theme, so either style works with all seven theme choices. `jordan-bailey-style` and `jordan-bailey-theme` are separate local storage preferences, applied before CSS loads and synchronized across tabs. Storage failures still permit selections for the current page.

The homepage About Me and Now paragraphs use 18px Fantasy text. The homepage description uses uniform regular-weight text in both styles. CV highlights share the same rounded shape and padding in Classic and Fantasy. Dark CV themes pair muted green, blue, and rose backgrounds with light accent text. Generated stylesheet URLs include content hashes to prevent stale CSS after deployments.

To add a footnote, use the `.with-margin` wrapper from `templates/article.html`, containing a text `<div>` and an `<aside class="margin-note">`. Put it around the paragraph that contains the reference, give each reference/note pair unique IDs and reciprocal links, and keep notes concise. The shared grid reserves enough vertical space for long notes to avoid collisions. No scripting or duplicate mobile note content is required.


## Article openings and callouts

An optional `<header class="article-opening">` at the start of an essay supplies its opening image and learning overview. The writing builder places it after the title and before the contents. See `templates/article.html` for a figure, a short motivating question, learning objectives, and prerequisites. Use an existing screenshot or supplied artwork; do not generate diagrams.

Use `<aside class="callout" data-callout="note"><p>Supporting context.</p></aside>` for a callout. `scripts/callouts.mjs` supplies its accessible label and icon at build time. Supported types are `note`, `important`, `warning`, `tip`, `caution`, and `question`. The text stays readable without JavaScript. Use Note for context, Important for an essential condition, Warning for an easy-to-make mistake, Tip for a useful practice, Caution for a consequential risk, and Question for a short reasoning exercise. Do not add one merely to vary the page's appearance.

`assets/callouts.css` matches SITP's exact per-theme blue, purple, amber, green, and red accents, plus its burnt-orange Question accent. Both Classic and Fantasy share its icon/label/4px-rule treatment and retain their own typography. Octicons are included under their MIT license in `assets/icons/OCTICONS-LICENSE.txt`. The Fight Caves article uses seven callouts and five side footnotes; the existing capture and diagram briefs are preserved.


## Supernova

Supernova brings back the original star field from `space-version/components/starfield/Starfield.tsx`, with its 5,000 white circular particles in a spherical shell (radii 20–80), camera at z=5 and 60° field of view, volume offset z=−60, fog at 25–120, 0.15 point size, 0.7 opacity, and rotation rates x=0.005, y=0.015, z=0.002 radians/second. The shared theme picker selects it on every page, independently of Classic/Fantasy. Layout, typography, and the favicon remain unchanged.

`assets/supernova.js` loads `assets/starfield.js` only when Supernova is visible and selected. The renderer uses the same Three.js 0.183.2 build already installed for the retired site, vendored locally in `assets/vendor/three/` with its MIT license. Other themes never download the 3D renderer. The effect pauses in hidden tabs, disposes its graphics resources when deselected, and shows a still star field for reduced-motion preferences. WebGL or loading failures leave the readable black theme intact. Printing hides the canvas and uses the existing light print palette.
