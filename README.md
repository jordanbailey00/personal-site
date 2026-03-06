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
Currently, no environment variables are strictly required to run the site with mock data. 
However, you can add variables for future integrations (e.g., GitHub Personal Access Token) in a `.env.local` file:
```env
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

### Wiring Real GitHub Data
The `GitHubGraph.tsx` in `components/github` currently renders an aesthetic representation using a pseudo-random generator designed for the cinematic dark mode look.
1. Fetch real user contribution data locally via the [GitHub GraphQL API](https://docs.github.com/en/graphql/reference/objects#contributionscollection).
2. Pass the fetched density integer array (`0-4`) into the `mockData` mapping loop inside `GitHubGraph.tsx`. 
3. The existing Tailwind classes for intensity (`getIntensityClass`) will automatically apply the matching soft-glow styles to the exact data.

## Deployment
This project has `next.config.ts` prepared with `output: 'export'` and unoptimized images enabled, meaning it is ready for static deployment via **GitHub Pages** using GitHub Actions. Simply push to `main` and configure GitHub Actions to deploy Next.js static exports.
