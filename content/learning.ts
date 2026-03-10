export interface Recommendation {
    title: string;
    review: string;
    url?: string;
    isbn?: string;
    videoId?: string;
}

export interface SubjectRecs {
    books: Recommendation[];
    videos: Recommendation[];
    misc: Recommendation[];
}

export interface LearningSubject {
    id: string;
    title: string;
    description: string;
    recs: SubjectRecs;
}

export const learningData: LearningSubject[] = [
    {
        id: "high-level-software",
        title: "High-Level Software",
        description: "Architecture, system design, and high-level programming paradigms.",
        recs: {
            books: [
                { title: "Designing Data-Intensive Applications", review: "The bible of modern backend engineering. Essential for understanding how large-scale systems actually work.", url: "https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/", isbn: "9781491903063" },
                { title: "Clean Architecture", review: "A classic guide to software structure and design patterns by Uncle Bob.", url: "https://www.pearson.com/en-us/subject-catalog/p/clean-architecture-a-craftsmans-guide-to-software-structure-and-design/P200000000100", isbn: "9780134494166" }
            ],
            videos: [
                { title: "System Design Interview - An Insider's Guide", review: "Excellent breakdown of how to think about scaling systems from scratch.", url: "https://www.youtube.com/watch?v=i53Gi_KV4-w", videoId: "i53Gi_KV4-w" }
            ],
            misc: [
                { title: "Martin Fowler's Blog", review: "Invaluable resource for learning about refactoring, microservices, and software patterns.", url: "https://martinfowler.com" }
            ]
        }
    },
    {
        id: "low-level-software",
        title: "Low-Level Software",
        description: "Operating systems, compilers, and systems programming.",
        recs: {
            books: [
                { title: "Operating Systems: Three Easy Pieces", review: "A fantastic, free introduction to OS concepts like virtualization, concurrency, and persistence.", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/", isbn: "9781312827776" }
            ],
            videos: [
                { title: "Compiler Design series by Alex Hyett", review: "Great practical introduction to how compilers work under the hood.", url: "https://www.youtube.com/watch?v=jw_vDCDfG-g", videoId: "jw_vDCDfG-g" }
            ],
            misc: [
                { title: "Godbolt Compiler Explorer", review: "The best tool for understanding how your C++/Rust/C code translates to assembly.", url: "https://godbolt.org" }
            ]
        }
    },
    {
        id: "ai-ml",
        title: "AI/ML",
        description: "Deep learning, reinforcement learning, and neural networks.",
        recs: {
            books: [
                { title: "Dive into Deep Learning", review: "Interactive book with code examples in PyTorch, JAX, and MXNet.", url: "https://d2l.ai", isbn: "9781009389433" }
            ],
            videos: [
                { title: "Andrej Karpathy's Neural Networks: Zero to Hero", review: "The most clear and concise explanation of backpropagation and LLMs available.", url: "https://www.youtube.com/watch?v=VMj-3S1tku0", videoId: "VMj-3S1tku0" }
            ],
            misc: [
                { title: "Hugging Face Course", review: "Great hands-on guide to using Transformers and modern NLP models.", url: "https://huggingface.co/learn" }
            ]
        }
    },
    {
        id: "mathematics",
        title: "Mathematics",
        description: "Linear algebra, calculus, and discrete math for computer science.",
        recs: {
            books: [
                { title: "Linear Algebra and Its Applications", review: "Gilbert Strang's classic text. Very intuitive and focuses on the 'why' as well as the 'how'.", url: "https://math.mit.edu/~gs/", isbn: "9780321982384" }
            ],
            videos: [
                { title: "3Blue1Brown - Essence of Linear Algebra", review: "Visual intuition that makes complex concepts feel obvious. A masterpiece.", url: "https://www.youtube.com/watch?v=fNk_zzaMoSs", videoId: "fNk_zzaMoSs" }
            ],
            misc: [
                { title: "Khan Academy", review: "Solid foundation for almost any mathematical topic you need to brush up on.", url: "https://khanacademy.org" }
            ]
        }
    },
    {
        id: "general-engineering",
        title: "General Engineering",
        description: "Tooling, workflow, and the philosophy of building things.",
        recs: {
            books: [
                { title: "The Pragmatic Programmer", review: "Timeless advice on how to be a more effective, professional engineer.", url: "https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/", isbn: "9780135957059" }
            ],
            videos: [
                { title: "MIT Missing Semester of Your CS Education", review: "Covers the tools (shell, git, editors) that every engineer should master but few are taught officially.", url: "https://www.youtube.com/watch?v=amEaGQ7pE9A", videoId: "amEaGQ7pE9A" }
            ],
            misc: [
                { title: "Hacker News", review: "The pulse of the tech industry. Great for discovering new tools and perspectives.", url: "https://news.ycombinator.com" }
            ]
        }
    }
];
