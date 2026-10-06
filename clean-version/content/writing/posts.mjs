// Published essays appear in this order. Drafts are never emitted by the build.
// Copy templates/article.html into this directory, then add its metadata here.
// { slug: 'my-essay', title: 'My essay', subtitle: 'A short introduction.',
//   date: '2026-10-03', status: 'draft', file: 'my-essay.html' }
// Add thumbnail: { src: '/writing/my-essay/thumbnail.jpg', alt: 'Description', width: 640, height: 640 }.
export const posts = [
  {
    slug: 'reinforcement-learning-for-runescape',
    title: 'Reinforcement Learning for Runescape',
    subtitle: 'Building a Fight Caves simulator, teaching an agent to finish it, and finding out what the reward forgot to say.',
    date: '2026-10-03',
    status: 'published',
    file: 'reinforcement-learning-for-runescape.html',
    thumbnail: {
      src: '/writing/reinforcement-learning-for-runescape/thumbnail.jpg',
      alt: 'RuneScape combat screenshot with the overhead message “I tick eat those” and a 99 damage hit.',
      width: 449,
      height: 445,
    },
  },
];
