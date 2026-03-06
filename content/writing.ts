export interface WritingPost {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    body: string;
    tags: string[];
}

export const writingData: WritingPost[] = [
    {
        slug: "simulating-the-cosmos",
        title: "Simulating the Cosmos: A Journey into Procedural Universe Generation",
        date: "2024-03-01",
        excerpt: "Exploring the intersection of astrophysics and noise functions to create believable, infinite starfields and planetary systems.",
        body: `
# Simulating the Cosmos

Building a procedural universe is a daunting task that requires a delicate balance between scientific accuracy and computational efficiency. In this article, I dive into the methods I used to generate the starfield background for this portfolio, utilizing three.js and custom GLSL shaders.

## The Power of Noise
Uniform distribution often leads to "flat" looking space. By employing volumetric shell logic and size attenuation, we can create a sense of true depth.

## Future Horizons
The next step is to integrate real NASA data—not just images, but orbital trajectories of known exoplanets—to bring a layer of reality to the simulation.
        `,
        tags: ["Space", "Simulations", "Graphics"]
    },
    {
        slug: "reinforcement-learning-in-games",
        title: "Reinforcement Learning: Teaching Agents to Play and Win",
        date: "2024-02-15",
        excerpt: "An overview of Q-learning and proximal policy optimization in the context of creating intelligent NPCs for game environments.",
        body: `
# Reinforcement Learning in Games

Modern games are moving beyond simple state machines for NPCs. Reinforcement Learning (RL) allows agents to learn optimal behaviors through trial and error, leading to more dynamic and challenging gameplay experiences.

## Training the Agent
I've been experimenting with Byte World AI, where agents must navigate a complex grid world to gather resources while avoiding hazards.

## Key Learnings
- Reward shaping is the hardest part.
- Stability is a luxury.
- The emergent behavior is often surprising and delightful.
        `,
        tags: ["RL", "AI", "Games"]
    },
    {
        slug: "the-art-of-minimalist-portfolios",
        title: "The Art of Minimalist Portfolios: Cinematic Shells",
        date: "2024-01-20",
        excerpt: "Why staying inside an immersive shell creates a more memorable user experience than standard multi-page sites.",
        body: `
# Cinematic Shells

A portfolio shouldn't just be a resume—it should be an experience. By using a persistent shell with a 3D background, we maintain a consistent atmosphere across different content types.

## Technical Implementation
Using Next.js App Router and Framer Motion's AnimatePresence allows for seamless transitions that don't break the "immersion" of the starfield.
        `,
        tags: ["Web Design", "Next.js", "UX"]
    }
];
