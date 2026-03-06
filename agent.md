Build me a polished personal portfolio website with a cinematic “floating in space” aesthetic, inspired by the ambient feeling of candycode.com, but not a clone. The entire website should exist inside one persistent fullscreen 3D hero environment. This is very important: all tabs/pages/content should live inside the hero, not just the homepage.

Core concept
- The whole site is a single immersive fullscreen experience
- Background is a black 3D starfield made of sparse white dots
- The starfield rotates/drifts very slowly in one constant direction
- All content appears to float inside that same space
- The top navigation always remains visible near the middle-top of the screen
- Switching between tabs should transition the content inside the same hero environment, not take the user out of it

Tech stack requirements
- Use Next.js with App Router and TypeScript
- Use Tailwind CSS for styling
- Use three.js through @react-three/fiber for the background starfield
- Use Motion for React for subtle floating/parallax animation on foreground UI
- Use only free/open tools and libraries
- Keep foreground content as regular DOM/HTML layered above the WebGL scene
- Prioritize maintainability, performance, accessibility, and a premium visual result

High-level product goal
Create an immersive personal site with these tabs inside the persistent hero shell:
- Home
- About
- Projects
- Writing
- Contact

The experience should feel like a floating UI system suspended in a quiet 3D night sky.

Critical architecture requirement
Do not build this as “home page hero + normal separate pages.”
Instead build:
- a persistent fullscreen hero shell
- a fixed background starfield canvas
- a persistent centered navigation
- a foreground content stage/panel area
- smooth transitions between content views inside the same shell

This can be implemented either as:
- one-page tabbed/section-based app with animated panel switching, or
- route-based pages with a shared persistent fullscreen layout shell
Either way, the visual result must feel like the entire site lives inside one hero environment at all times.

Navigation requirements
- Put navigation near the middle-top of the viewport, centered horizontally
- Tabs:
  - Home
  - About
  - Projects
  - Writing
  - Contact
- Navigation should feel like a floating pill/capsule
- Active state should be subtle but clear
- It should always remain visible
- Switching tabs should be smooth, elegant, and atmospheric
- Do not make the nav feel like a normal website header bar

Shared visual language for all tabs
Every tab/view should look like it belongs inside the same floating starfield environment:
- All text panels/cards should be black and only slightly opaque
- All text should be white or soft gray-white
- Panels should not strongly contrast with the background
- Panels should feel embedded in the scene, not pasted on top
- Legibility must remain excellent
- Use subtle blur/transparency, thin faint borders, and restrained shadow/glow only where needed
- The design should be premium, calm, cinematic, and minimal
- Avoid flashy sci-fi visuals
- Avoid obvious glassmorphism
- Avoid generic SaaS-card look

Starfield background requirements
Implement a fullscreen ambient 3D starfield using React Three Fiber:
- Sparse white particles only
- Black or near-black background
- Distribute stars in true 3D space with x/y/z depth
- Use a perspective camera
- The world/starfield should rotate or drift very slowly in one fixed direction
- Motion should be almost imperceptible at a glance, but visible over time
- Optionally include very light camera drift/parallax
- No warp-speed movement
- No bright colors
- No heavy twinkling
- No distracting shader gimmicks unless absolutely necessary
- The background must support the content rather than dominate it

Foreground motion requirements
All foreground UI should feel like it floats within the same 3D space:
- Apply subtle vertical drift to panels/cards/text groups
- Add light mouse-based parallax on desktop
- Different groups can float on slightly different timings for a natural feel
- Motion must remain restrained and never hurt readability
- Respect prefers-reduced-motion and reduce or disable nonessential motion

Site content/views

1. Home tab
This is one of the views inside the hero shell, not the only hero.

The Home view should contain:
- My full name (placeholder for now)
- A short blurb about me (can be example text/content for now so we can see what it looks like. later we will replace with real content)
- A GitHub contribution/commit-history graphic
- Below that, a curated gallery of 20–30 Hubble Space Telescope images
- Each Hubble item should include:
  - image
  - title
  - short description of what the image shows

The layout should feel elegant and spacious, like a curated cosmic portfolio panel floating in the scene.

GitHub section requirements
- Show a contribution-style calendar/heatmap or commit-history visualization
- Preferred: use GitHub API data if credentials are available
- If real data wiring is not available, create a polished mock/fallback component with sample data
- Build the component so it can easily be wired to real GitHub data later
- Style it to match the site aesthetic:
  - black background
  - grayscale/white intensity scale
  - subtle borders/glow
- Do not use the default neon GitHub-green look unless it has been intentionally themed to fit the site

Hubble gallery requirements
- Display 20–30 Hubble images with descriptions
- Preferred: fetch/curate via NASA/Hubble-compatible source, but normalize to a local structured dataset for reliability
- If external API data is noisy, use a curated local JSON/data file and document how to refresh it
- The gallery should feel premium and atmospheric
- Use responsive images and lazy loading
- The cards should feel like floating exhibit panels within the starfield

2. About tab
This should be another view inside the same hero shell.

It should contain a more detailed blurb about:
- who I am
- what I’ve done
- what I’m currently doing
- my interests

Requirements:
- Present in 1–3 elegant floating content blocks
- Keep concise but more detailed than Home
- Use editable local content/data files so I can replace the text later
- Maintain the exact same immersive visual language as the rest of the site
- use example filler content for testing purposes to demonstrate what it will look like with all content filled out. we will replace with real content

3. Projects tab
This should also appear inside the same hero shell.

Requirements:
- Show all projects in a responsive grid
- Each project card should include:
  - thumbnail
  - project title
- On hover:
  - reveal a brief project description
- Hover behavior should be smooth and premium
- Cards should not jump aggressively
- Cards should feel like floating project artifacts inside the scene
- Use editable local data for project content
- use example filler content for testing purposes to demonstrate what it will look like with all content filled out. we will replace with real content

4. Writing tab
This should be another in-hero view.

Requirements:
- Show all writing entries ordered by date descending
- Each writing item should include:
  - title
  - date
  - short excerpt or subtitle
- Present as elegant floating list items/cards
- Use local structured content/data
- Keep easy to migrate to MD/MDX later if desired
- use example filler content for testing purposes to demonstrate what it will look like with all content filled out. we will replace with real content

5. Contact tab
This should also exist inside the same hero shell.

Requirements:
- Show all contact info clearly
- Include placeholders for:
  - email
  - GitHub
  - LinkedIn
  - X/Twitter or other social links if applicable
- Keep simple, elegant, highly legible
- Style as floating panels consistent with the rest of the site
- use example filler content for testing purposes to demonstrate what it will look like with all content filled out. we will replace with real content

Layout behavior
- The starfield should always fill the viewport
- The hero shell should always remain the visual container for the entire experience
- Content views can scroll internally if needed, but the visual experience should still feel like it all lives inside the same starfield stage
- Avoid breaking the illusion by sending the user to plain white or normal page layouts
- On mobile, preserve the immersive shell while simplifying layout and reducing motion as needed

Content/data requirements
Create editable local content/data files for:
- home/profile blurb
- about content
- projects
- writing entries
- contact info
- Hubble gallery data

Suggested structure
- app/
- components/
  - shell/
  - starfield/
  - nav/
  - panels/
  - github/
  - gallery/
- content/
  - profile.ts or profile.json
  - about.ts or about.json
  - projects.ts or projects.json
  - writing.ts or writing.json
  - contact.ts or contact.json
  - hubble.ts or hubble.json
- lib/
  - github.ts
  - nasa.ts
  - motion.ts
- public/
  - thumbnails
  - fallback assets

Performance requirements
- Keep WebGL background efficient
- Use a reasonable particle count
- Reduce density/motion complexity on mobile if necessary
- Prevent unnecessary rerenders
- Use lazy loading and image optimization
- Maintain smooth performance on normal hardware

Accessibility requirements
- Keep text clearly readable
- Keyboard navigation should work
- Tabs/links/buttons need clear focus states
- Animations should not be required for comprehension
- Respect reduced motion
- Use semantic HTML where appropriate

README/setup requirements
Include a concise README with:
- how to run locally
- environment variables needed
- how to replace placeholder content with my real content
- how to wire real GitHub data
- how to refresh/update the Hubble gallery dataset

Acceptance criteria
- The site feels like one persistent fullscreen hero experience
- All tabs live inside the hero shell
- The starfield is clearly 3D and slowly rotating/drifting in one direction
- The nav remains centered near the middle-top and is always present
- Home/About/Projects/Writing/Contact all render inside the same immersive environment
- Home contains:
  - my name
  - short blurb
  - GitHub graphic
  - 20–30 Hubble images with descriptions
- Projects have hover descriptions
- Writing is ordered by date
- Contact is clearly displayed
- All content is editable via local content/data files
- The overall look is premium, restrained, atmospheric, and clearly legible

Important do-not notes
- Do not build a normal marketing site where only the homepage has a hero
- Do not make it look like a generic SaaS template
- Do not use strong contrast cards that look pasted on top
- Do not add flashy sci-fi effects
- Do not over-busy the background
- Do not make animations too strong
- Do not overcomplicate with unnecessary 3D objects

Make strong design decisions that fit this brief and deliver a complete first version with tasteful placeholder content where my real content is not yet provided.