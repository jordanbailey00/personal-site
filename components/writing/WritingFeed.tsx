"use client";

import { useState } from "react";
import { WritingPost } from "../../content/writing";
import { motion } from "motion/react";
import { Calendar, Tag, BookOpen, ArrowRight } from "lucide-react";
import ContentPanel from "../panels/ContentPanel";
import DetailModal from "../panels/DetailModal";

interface WritingFeedProps {
    posts: WritingPost[];
}

export default function WritingFeed({ posts }: WritingFeedProps) {
    const [selectedPost, setSelectedPost] = useState<WritingPost | null>(null);

    return (
        <div className="relative">
            <div className="flex flex-col gap-4 mt-6">
                {posts.map((post: WritingPost) => (
                    <motion.div
                        key={post.slug}
                        layoutId={`post-${post.slug}`}
                        onClick={() => setSelectedPost(post)}
                        className="group cursor-pointer"
                    >
                        <ContentPanel className="p-5 sm:p-6 transition-all duration-300 group-hover:bg-white/[0.04] group-hover:border-white/10 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] border-white/5 bg-black/30">
                            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-3">
                                <h3 className="text-xl font-medium text-white/90 transition-colors group-hover:text-white">
                                    {post.title}
                                </h3>
                                <span className="text-xs font-mono text-white/40 tabular-nums uppercase tracking-widest">
                                    {post.date}
                                </span>
                            </div>
                            <p className="text-sm text-white/60 leading-relaxed transition-colors group-hover:text-white/70 line-clamp-2">
                                {post.excerpt}
                            </p>
                            <div className="mt-4 flex items-center gap-2 text-[10px] text-white/20 uppercase tracking-widest font-bold group-hover:text-white/40 transition-colors">
                                <BookOpen className="w-3 h-3" />
                                Read Full Article
                                <ArrowRight className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" />
                            </div>
                        </ContentPanel>
                    </motion.div>
                ))}
            </div>

            <DetailModal
                isOpen={!!selectedPost}
                onClose={() => setSelectedPost(null)}
                layoutId={selectedPost ? `post-${selectedPost.slug}` : undefined}
            >
                {selectedPost && (
                    <div className="w-full flex flex-col lg:flex-row h-full overflow-hidden">
                        {/* Title Section (Left on Desktop) */}
                        <div className="lg:w-[35%] p-8 sm:p-12 bg-neutral-900/50 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col justify-center">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 text-[10px] text-white/40 uppercase tracking-widest font-bold">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(selectedPost.date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </div>
                                <h2 className="text-3xl sm:text-4xl font-light text-white leading-tight">
                                    {selectedPost.title}
                                </h2>
                                <div className="h-px w-16 bg-white/20" />
                                <p className="text-sm text-white/50 leading-relaxed italic">
                                    {selectedPost.excerpt}
                                </p>
                                <div className="flex flex-wrap gap-2 pt-4">
                                    {selectedPost.tags.map((tag: string) => (
                                        <span key={tag} className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] text-white/40 font-medium">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Article Content (Right on Desktop) */}
                        <div className="lg:w-[65%] p-8 sm:p-12 lg:p-16 overflow-y-auto custom-scrollbar bg-neutral-950/30">
                            <div className="prose prose-invert prose-lg max-w-none 
                                prose-headings:font-light prose-headings:text-white/90
                                prose-p:text-white/70 prose-p:leading-relaxed prose-p:font-light
                                prose-strong:text-white/80
                                prose-li:text-white/60
                                prose-code:text-white/70 prose-code:bg-white/5 prose-code:px-1 prose-code:rounded
                                prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/5
                                prose-img:rounded-xl">
                                {/* Basic Markdown-to-HTML logic for placeholders if needed, but for now using simple string replacement for body */}
                                {selectedPost.body.split('\n').map((line: string, i: number) => {
                                    if (line.startsWith('# ')) return <h1 key={i}>{line.slice(2)}</h1>;
                                    if (line.startsWith('## ')) return <h2 key={i}>{line.slice(3)}</h2>;
                                    if (line.startsWith('- ')) return <li key={i}>{line.slice(2)}</li>;
                                    if (line.trim() === '') return <br key={i} />;
                                    return <p key={i}>{line}</p>;
                                })}
                            </div>

                            <div className="mt-16 pt-8 border-t border-white/5 flex items-center justify-between">
                                <div className="text-[10px] text-white/20 uppercase tracking-widest font-bold">
                                    End of Article
                                </div>
                                <button
                                    onClick={() => setSelectedPost(null)}
                                    className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-2"
                                >
                                    Back to Feed
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </DetailModal>
        </div>
    );
}
