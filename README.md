# Personal Site - Cinematic Floating Environment

This repository contains the source code for the "floating in space" cinematic portfolio. Built with Next.js (App Router), Tailwind CSS, Framer Motion, and React Three Fiber.

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Run the development server**:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Environment Variables
To enable the live GitHub contribution graph on the Home tab, you need to provide your GitHub credentials. If these are missing, the site will gracefully render a visually identical mock fallback.

Create a `.env.local` file in the root:
```env
# Your GitHub username (e.g., jordanbailey00)
GITHUB_USERNAME=your_username

# A GitHub Personal Access Token (PAT) with `read:user` scope
GITHUB_TOKEN=your_personal_access_token_here
```

## Content Management / Customization

All the local content used to render the site is stored in the `/content` directory. The structure has been intentionally kept simple so you can easily replace the placeholder data with your own.

- **`content/profile.ts`**: Update your name, high-level blurb, and social handles (used in the Home and Contact tabs).
- **`content/about.ts`**: Contains the longer biography and skills list.
- **`content/projects.ts`**: Array of project objects (title, description, thumbnail URLs, and links).
- **`content/writing.ts`**: Your blog posts or external writing links.

### Updating the Hubble/NASA Gallery Data
The images rendered on the Home tab are currently mock objects pointing to high-quality space photography on Unsplash. 
- You can refresh or update the data inside `content/hubble.ts` by pasting in a valid JSON structure or updating the array of objects (`title`, `description`, `image` URL).
- If you switch this to a live NASA API fetch later, you can swap out `hubbleData` in `HubbleGallery.tsx` for a server-side fetch inside the Home page component.

### Live GitHub Data Integration
The `GitHubGraph.tsx` component automatically hooks into the GitHub GraphQL API to fetch user contribution metrics at build time. The real data is mapped to the internal `0-3` intensity scale to preserve the cinematic dark-mode look natively. Check the Environment Variables section for configuration options.

## Deployment
This project has `next.config.ts` prepared with `output: 'export'` and unoptimized images enabled, meaning it is ready for static deployment via **GitHub Pages** using GitHub Actions. Simply push to `main` and configure GitHub Actions to deploy Next.js static exports.
