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

The arrival of 'Oumuamua in 2017 challenged our understanding of interstellar objects. Unlike any comet or asteroid witnessed before, its strange acceleration and tumbling rotation sparked intense debate within the astrophysical community. It was the first time we had confirmed a visitor from another star system, and it didn't look like anything we expected.

## The Interstellar Visitors
While 'Oumuamua was a dark, reddish, elongated object with no visible coma, 2I/Borisov—detected in 2019—looked much more like a traditional comet. However, its hyperbolic trajectory confirmed it originated from beyond our sun's gravitational reach. These two objects represent polar opposites of interstellar debris: one a mysterious, potentially rocky shard, and the other a volatile, icy wanderer.

### The Physics of 'Oumuamua
The most controversial aspect of 'Oumuamua was its non-gravitational acceleration. As it moved away from the sun, it picked up speed in a way that couldn't be explained by gravity alone. Typically, comets do this by outgassing—ejecting gas and dust as they heat up. Yet, intensive observations by the Hubble Space Telescope and other observatories found no traces of dust or gas. This led to theories ranging from hydrogen ice structures to more speculative "solar sail" hypotheses.

### 2I/Borisov: The Chemical Time Capsule
Borisov provided a more standard data set, but with a twist. Spectroscopic analysis revealed high carbon monoxide levels, far exceeding what is typical for solar system comets. This suggests it formed in an extremely cold environment, possibly the outer reaches of a distant planetary system, before being ejected into the void.

These objects are the keys to understanding the chemical composition of distant star systems without ever leaving our own. They are silent messengers carrying the building blocks of other worlds.
        `,
        tags: ["Astrophysics", "Space", "Interstellar"]
    },
    {
        slug: "emergent-agency-rl",
        title: "Emergent Agency: SOTA Reinforcement Learning in Game Engines",
        date: "2025-01-05",
        excerpt: "Bridging the gap between algorithms and high-fidelity simulations using PPO, SAC, and PufferLib integrations.",
        body: `
# Emergent Agency

Reinforcement Learning (RL) has moved beyond simple grid-worlds and Atari games. Today, we are training agents in high-fidelity 3D environments where physics, lighting, and complex mechanics dictate behavior. The goal is no longer just to "solve" a task but to foster emergent intelligence that can adapt to unpredictable scenarios.

## State-of-the-Art Algorithms
Algorithms like **Proximal Policy Optimization (PPO)** and **Soft Actor-Critic (SAC)** have become the workhorses of the industry. PPO is prized for its stability and ease of tuning, while SAC excels in continuous action spaces where entropy maximization helps the agent explore more effectively. 

### PufferLib: Scaling the Complexity
Training in modern game engines like Unity or Unreal requires immense computational power. Tools like **PufferLib** are revolutionizing how we handle these workloads. By providing a lightweight, high-performance wrapper around complex simulators, PufferLib allows researchers to scale their training across thousands of parallel environments with minimal overhead. It solves the "glue code" problem, letting us focus on the reward shaping and agent architecture rather than the plumbing.

## High-Fidelity Simulations
Integrating ML-Agents with Unity or MuJoCo for robotics simulations allows us to test agents in environments that mimic real-world physics. We are seeing agents learn to walk, fly, and even play complex team-based games without ever being told the rules. The resulting 'emergent behavior'—where an agent finds a solution its creators never imagined—remains the most fascinating aspect of the field. For instance, an agent might learn to exploit a physics engine bug to move faster, a behavior that is both a headache for devs and a testament to the power of RL exploration.

The future of game AI isn't scripted; it's learned. We are moving toward worlds that aren't just backgrounds, but active participants in an intelligence-building loop.
        `,
        tags: ["RL", "AI", "Game Dev", "PufferLib"]
    },
    {
        slug: "gell-mann-amnesia-ai",
        title: "The Amnesia of Progress: Gell-Mann and the AI Information Paradox",
        date: "2025-02-18",
        excerpt: "Exploring the intersection of the Gell-Mann Amnesia Effect and the current state of AI-generated content on the internet.",
        body: `
# The Amnesia of Progress

The Gell-Mann Amnesia Effect, coined by Michael Crichton, describes how we trust experts on topics we don't understand, even after seeing them fail on topics we do. You read an article about your own profession and realize the journalist has no idea what they're talking about. Then you turn the page to an article about Palestine or the economy and read it with full confidence, forgetting the errors you just witnessed. 

## The LLM Feedback Loop
In the age of Large Language Models (LLMs), this effect is being hyper-charged. We are currently witnessing an unprecedented democratization of high-quality-sounding information. However, this ease of generation creates a dangerous paradox. As AI-generated content begins to dominate the internet, we risk entering a **'model collapse'** where AI is trained on its own previous hallucinations, leading to a decay in factual precision and a homogenization of thought.

### The Information Paradox
The paradox of the current internet is that information has never been more available, yet the "truth" has never been harder to pin down. When an AI generates a confident-sounding explanation for a complex technical problem, we often fall into the Gell-Mann trap. We see its brilliance in summarizing a poem and assume its architecture advice is equally sound, often ignoring the subtle hallucinations that aggregate over time.

## Navigating the Noise
To maintain information integrity, we must develop better verification systems and cognitive guards. We are entering an era where 'critical reading' is no longer just an academic skill, but a survival mechanism for the digital age. We must learn to treat AI as a powerful but fallible collaborator, not an absolute arbiter of truth. The "amnesia" we must fight is the one that tells us that because a machine is fast and articulate, it is inherently correct.
        `,
        tags: ["AI", "Epistemology", "Internet", "Philosophy"]
    }
];
