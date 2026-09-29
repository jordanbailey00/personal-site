# Jordan Bailey — clean version

A small, static portfolio based on the supplied Aeree Cho website oracle. It follows the reference's white canvas, narrow column, circular profile image, quiet section dividers, and image/text project rows. No runtime framework, third-party scripts, API keys, or build dependencies are required. A small first-party script adds an accessible light/dark toggle to every page, follows the device theme initially, and remembers an explicit choice across pages and visits.

## Develop

```sh
npm run dev
```

Open http://127.0.0.1:4173. Re-run `npm run build` after editing. `npm run check` verifies the generated pages and internal links.

Profile and project metadata live in `content/site.mjs`. The three project articles in `content/*.html` were imported from the original site with `scripts/import-case-studies.cjs`; their prose and code examples are preserved, with empty screenshot placeholders omitted. Layout and page generation live in `scripts/build.mjs`; styling lives in `assets/style.css`.

## Preservation and hosting

The original Next.js website is unchanged in the sibling `space-version` checkout, and remains at the repository root on GitHub. The `archive/space-version-2026-09-29` tag preserves its pre-redesign commit `72f2bebe344a394354ef47cce69a9720fb5d7323`, including its original deployment workflow. The redesign is published from the repository's `clean-version/` directory using the existing GitHub Pages deployment and domain `www.jordanbailey.dev`; the apex domain redirects there.

To restore the original website, restore the deployment workflow from the archive tag to the default branch and run it. The original source, dependencies, and GitHub secrets remain available. No domain changes are required.

## Assets

- Design and heading fonts: the user's downloaded reference in `oracle/aereeeee.github.io/`.
- Profile photo: Jordan's public GitHub avatar.
- RuneC and Fight Caves screenshots: the respective public project READMEs.
- Byte World image: the original website's `public/byte_world_thumbnail.png`.

The reference person's biography, projects, and other personal content are not included. Writing and learning remain marked coming soon, as on the original website.
