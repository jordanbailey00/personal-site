export const profile = {
  name: 'Jordan Bailey',
  subtitle: 'MSCS student at Georgia Tech',
  email: 'jordanbaileypmp@gmail.com',
  github: 'https://github.com/jordanbailey00',
  linkedin: 'https://www.linkedin.com/in/jordanbaileypm',
  twitter: 'https://x.com/jordansb_',
};

export const projects = [
  {
    slug: 'fight-caves', repo: 'fight-caves-rl', title: 'Fight Caves RL',
    category: 'Reinforcement learning', badge: '94.9% peak Jad kill rate',
    image: 'fight-caves.png', alt: 'The Fight Caves simulator and its Old School RuneScape game interface',
    description: 'Training an agent to clear all 63 waves of the Old School RuneScape Fight Caves. A deterministic C simulator, PPO training with PufferLib, and a playable 3D viewer.',
    detail: 'Learning to complete the Fight Caves from scratch.',
    tools: 'C · Python · PPO · PufferLib · Raylib',
    note: 'The 94.9% result is the published v35.1 peak evaluation in the simulator.',
  },
  {
    slug: 'runec', repo: 'RuneC', title: 'RuneC',
    category: 'Game engines', badge: '',
    image: 'runec.png', alt: 'Varrock rendered in the RuneC desktop game viewer',
    description: 'An Old School RuneScape-style world implemented in C. A modular, deterministic simulation powers both a playable Raylib client and fast headless environments.',
    detail: 'One game engine for interactive play and headless simulation.',
    tools: 'C · Raylib · Python · CMake',
  },
  {
    slug: 'byte-world', repo: 'byte_world_ai', title: 'Byte World',
    category: 'Games', badge: '',
    image: 'byte-world.png', alt: 'Byte World terminal-style fantasy role-playing game',
    description: 'A terminal-style fantasy RPG with strategic combat, character progression, and story-driven boss encounters. The same Python engine runs in the terminal and the browser.',
    detail: 'A fantasy RPG, from the terminal to the browser.',
    tools: 'Python · Pyodide · JavaScript',
    demo: 'https://jordanbailey00.github.io/byte_world_ai/',
  },
];
