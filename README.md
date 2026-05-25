# personal-site

A cinematic, immersive portfolio website designed to exist entirely within a persistent 3D hero environment.

## Architecture

The site is built with Next.js using the App Router. It employs a shared persistent layout (HeroShell) that contains the 3D canvas and navigation. This ensures that the WebGL environment remains active and uninterrupted during route transitions, creating a single-page experience across multiple sub-pages.

## Background Star Effect

The immersive background is a fullscreen 3D starfield implemented with Three.js via React Three Fiber (R3F).
- Stars are distributed as particles in 3D space.
- A fixed-axis rotation is applied to the scene to provide a slow, ambient drift.
- Motion is kept subtle to ensure content legibility while maintaining a sense of depth and scale.

## API Integrations

The site dynamically aggregates content from two primary sources:
- GitHub GraphQL API: Fetches real-time contribution data and repository metadata to build the activity graph and project showcase.
- NASA Image and Video Library API: Curates a gallery of observations from the Hubble Space Telescope.

## Technical Stack

- Framework: Next.js (TypeScript)
- Rendering: React Three Fiber / Three.js
- Styling: Tailwind CSS
- Animation: Motion (Framer Motion)
- Icons: Lucide React
