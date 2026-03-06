# Build, Development, and Deployment Plan

## 1. Build Plan (Next.js + 3D)

**Tech Stack Initialization:**
- **Framework:** Next.js (App Router, React 18/19) initialized with `npx create-next-app@latest`.
- **Language:** TypeScript.
- **Styling:** Tailwind CSS (built-in with Next.js).
- **3D Engine:** `three` and `@react-three/fiber` for the WebGL starfield background.
- **Animations:** `motion` (Motion for React / Framer Motion) for subtle DOM floating/parallax effects.
- **Icons:** `lucide-react` for simple, clean iconography (e.g., social links).

**Project Structure setup:**
```
/app
  layout.tsx       (Persistent shell wrapper, UI overlays)
  page.tsx         (Home tab content)
  about/page.tsx   (About tab content)
  projects/...     (Projects tab content)
  writing/...      (Writing tab content)
  contact/...      (Contact tab content)
/components
  /shell
    HeroShell.tsx  (The persistent layout container handling the 3D canvas and normal DOM)
  /starfield
    Starfield.tsx  (R3F canvas, stars, camera rotation)
  /nav
    FloatingNav.tsx
  /panels
    ContentPanel.tsx
  /github
    GitHubGraph.tsx
  /gallery
    HubbleGallery.tsx
/content           (Local data files, e.g., profile.ts, about.ts, projects.ts)
/lib               (Utilities, github.ts, motion.ts)
```

**Core Architecture implementation:**
1. In `app/layout.tsx`, render two layers: 
   - A `fixed inset-0 -z-10` container for the `@react-three/fiber` Canvas (the starfield).
   - A relative DOM layer for the actual Next.js child routes and the `FloatingNav`.
2. This ensures that route changes do not unmount the 3D `Starfield` scene, maintaining the persistent fullscreen hero experience.
3. Configure Tailwind to handle a dark/black theme, using mostly translucent black/gray panels with backdrop blur.

## 2. Development Plan (Execution Steps)

1. **Bootstrap Project & Install Dependencies:**
   ```bash
   npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir false --import-alias "@/*"
   npm install three @react-three/fiber @types/three motion lucide-react
   ```
2. **Implement the 3D Starfield Background:**
   - Create `components/starfield/Starfield.tsx`.
   - Setup a perspective camera, a field of white particles (Points), and rotate them slowly on a fixed axis using `useFrame`.
3. **Build the Floating Nav & Layout Shell:**
   - Create a translucent pill-shaped navigation.
   - Setup `HeroShell.tsx` to handle page transitions (Motion's `AnimatePresence` or Next.js template.tsx for route transitions).
4. **Flesh out Content Pages with Dummy Data:**
   - **Data Layer:** Create `profile.ts`, `projects.ts`, etc., inside `content/` to hold mock data.
   - **Home Tab:** Implement Profile Blurb, Mock GitHub Contribution graph, and a curated Hubble JSON gallery layout.
   - **About / Projects / Writing / Contact:** Implement respective grid and list layouts using the dummy data. Apply floating/drifting animations using `motion`.
5. **Refine UI/UX:**
   - Add glassmorphism-lite panels (black with low opacity, thin subtle borders, soft white text).
   - Enhance the "floating in space" illusion by coupling mouse position to subtle parallax on specific grouped elements (using motion values).
   - Test accessibility (tab indexing, contrast, prefers-reduced-motion).

## 3. GitHub & Deployment Plan (GitHub Pages)

**GitHub Setup:**
1. Initialize local basic git tracking: `git init`, `git add .`, `git commit -m "Initial Next.js setup"`.
2. Create the remote repository named "personal_site" on GitHub using the GitHub CLI (`gh repo create personal_site --public --source=. --remote=origin`).
3. Push initial code.

**Deployment Strategy for GitHub Pages:**
Since standard Next.js uses server-side rendering, deploying to static GitHub Pages requires a static export configuration.
1. Update `next.config.ts`:
   ```ts
   const nextConfig = {
     output: 'export',
     images: {
       unoptimized: true, // Required for static export
     },
     // basePath: '/personal_site', // Note: If the repo name is "personal_site", GitHub Pages serves it at username.github.io/personal_site.
   };
   export default nextConfig;
   ```
2. Create a GitHub Actions workflow (`.github/workflows/deploy.yml`) to build and deploy the Next.js static export using the `@actions/pages` mechanism.
3. Push the workflow configuration to GitHub. This will automatically publish the site on push to the `main` branch.
