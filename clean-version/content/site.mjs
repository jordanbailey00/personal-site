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
    detail: 'A RuneScape-inspired world to explore and build on.',
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

export const books = [
  {
    title: 'Operating Systems: Three Easy Pieces',
    author: 'Remzi H. Arpaci-Dusseau & Andrea C. Arpaci-Dusseau',
    cover: 'operating-systems-three-easy-pieces.webp', width: 414, height: 648,
  },
  {
    title: 'The Evolution of Civilizations',
    author: 'Carroll Quigley',
    cover: 'evolution-of-civilizations.webp', width: 535, height: 800,
  },
  {
    title: 'The Mythical Man-Month',
    author: 'Frederick P. Brooks Jr.',
    cover: 'mythical-man-month.webp', width: 160, height: 238,
  },
  {
    title: 'Build a Large Language Model (From Scratch)',
    author: 'Sebastian Raschka',
    cover: 'build-a-large-language-model.webp', width: 360, height: 451,
  },
  {
    title: 'Reinforcement Learning from Human Feedback',
    author: 'Nathan Lambert',
    cover: 'reinforcement-learning-from-human-feedback.webp', width: 500, height: 800,
  },
  {
    title: 'Information Theory, Inference, and Learning Algorithms',
    author: 'David J. C. MacKay',
    cover: 'information-theory-inference-learning.webp', width: 134, height: 176,
  },
];

export const software = [
  {
    title: 'PufferLib', href: 'https://puffer.ai/',
    description: 'Fast reinforcement learning tools and environments.',
  },
  {
    title: 'FFmpeg', href: 'https://ffmpeg.org/',
    description: 'A toolkit for recording, converting, and streaming audio and video.',
  },
  {
    title: 'Obsidian', href: 'https://obsidian.md/',
    description: 'Local Markdown notes, connected through links.',
  },
  {
    title: 'nanochat', href: 'https://github.com/karpathy/nanochat',
    description: 'An end-to-end codebase for training and chatting with language models.',
  },
  {
    title: 'Void RSPS', href: 'https://github.com/GregHib/void',
    description: 'A lightweight, open-source 2011 RuneScape multiplayer server.',
  },
  {
    title: 'CUDA', href: 'https://developer.nvidia.com/cuda',
    description: 'GPU programming and parallel computing on NVIDIA hardware.',
  },
];
