# Jordan Bailey — clean version

A small, static portfolio based on the supplied Aeree Cho website oracle. It follows the reference's white canvas, narrow column, circular profile image, quiet section dividers, and image/text project rows. No runtime framework, third-party scripts, API keys, or build dependencies are required. A small first-party script adds an accessible light/dark toggle to every page, follows the device theme initially, and remembers an explicit choice across pages and visits.

## Develop

```sh
npm run dev
```

Open http://127.0.0.1:4173. Re-run `npm run build` after editing. `npm run check` verifies the generated pages and internal links.

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

The reference person's biography, projects, and other personal content are not included. Writing and learning remain marked coming soon, as on the original website.
