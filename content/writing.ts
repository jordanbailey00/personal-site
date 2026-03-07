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
        slug: "celestial-drifters",
        title: "Celestial Drifters: The Enigma of Oumuamua and Borisov",
        date: "2024-11-12",
        excerpt: "Analyzing the physics and unprecedented trajectories of the first two interstellar objects ever recorded in our solar system.",
        body: `
# Celestial Drifters

The arrival of 'Oumuamua in 2017 challenged our understanding of interstellar objects. Unlike any comet or asteroid witnessed before, its strange acceleration and tumbling rotation sparked intense debate within the astrophysical community.

## The Interstellar Visitors
While 'Oumuamua was a flat, potentially metallic shard, 2I/Borisov—detected in 2019—looked much more like a traditional comet. However, its hyperbolic trajectory confirmed it originated from beyond our sun's gravitational reach.

## Unique Characteristics
- **'Oumuamua**: Non-gravitational acceleration without visible outgassing.
- **Borisov**: High carbon monoxide levels, suggesting a formation in an extremely cold environment.

These objects are the keys to understanding the chemical composition of distant star systems without ever leaving our own.
        `,
        tags: ["Astrophysics", "Space", "Interstellar"]
    },
    {
        slug: "emergent-agency-rl",
        title: "Emergent Agency: SOTA Reinforcement Learning in Game Engines",
        date: "2025-01-05",
        excerpt: "Bridging the gap between algorithms and high-fidelity simulations using PPO, SAC, and MuJoCo integrations.",
        body: `
# Emergent Agency

Reinforcement Learning (RL) has moved beyond the grid-world. Today, we are training agents in high-fidelity 3D environments where physics, lighting, and complex mechanics dictate behavior.

## State-of-the-Art Algorithms
Algorithms like Proximal Policy Optimization (PPO) and Soft Actor-Critic (SAC) have become the workhorses of the industry, allowing for stable training in continuous action spaces.

## High-Fidelity Simulations
Integrating ML-Agents with Unity or MuJoCo for robotics simulations allows us to test agents in environments that mimic real-world physics. The resulting 'emergent behavior'—where an agent finds a solution its creators never imagined—remains the most fascinating aspect of the field.

The future of game AI isn't scripted; it's learned.
        `,
        tags: ["RL", "AI", "Game Dev"]
    },
    {
        slug: "gell-mann-amnesia-ai",
        title: "The Amnesia of Progress: Gell-Mann and the AI Information Paradox",
        date: "2025-02-18",
        excerpt: "Exploring the intersection of the Gell-Mann Amnesia Effect and the current state of AI-generated content on the internet.",
        body: `
# The Amnesia of Progress

The Gell-Mann Amnesia Effect, coined by Michael Crichton, describes how we trust experts on topics we don't understand, even after seeing them fail on topics we do. In the age of Large Language Models, this effect is being hyper-charged.

## The LLM Feedback Loop
As AI-generated content begins to dominate the internet, we risk entering a 'model collapse' where AI is trained on its own previous hallucinations. This creates a paradox where information becomes more available but less reliable.

## Navigating the Noise
To maintain information integrity, we must develop better verification systems and cognitive guards. We are entering an era where 'critical reading' is no longer just an academic skill, but a survival mechanism for the digital age.
        `,
        tags: ["AI", "Epistemology", "Internet"]
    }
];
