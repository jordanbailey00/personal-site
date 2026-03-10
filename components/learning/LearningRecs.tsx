"use client";

import { useState } from "react";
import { LearningSubject, Recommendation } from "@/content/learning";
import { motion } from "motion/react";
import { Book, Video, Box, ExternalLink, GraduationCap, ArrowRight } from "lucide-react";
import ContentPanel from "../panels/ContentPanel";
import DetailModal from "../panels/DetailModal";
import Image from "next/image";

interface LearningRecsProps {
    subjects: LearningSubject[];
}

export default function LearningRecs({ subjects }: LearningRecsProps) {
    const [selectedSubject, setSelectedSubject] = useState<LearningSubject | null>(null);

    const getImageUrl = (rec: Recommendation): string | null => {
        if (rec.isbn) {
            return `https://covers.openlibrary.org/b/isbn/${rec.isbn}-L.jpg`;
        }
        if (rec.videoId) {
            return `https://img.youtube.com/vi/${rec.videoId}/maxresdefault.jpg`;
        }
        return null;
    };

    const RecSection = ({ title, icon: Icon, recs }: { title: string, icon: any, recs: Recommendation[] }) => {
        if (recs.length === 0) return null;

        return (
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-white/40 uppercase tracking-widest text-[10px] font-bold border-b border-white/5 pb-2">
                    <Icon className="w-3.5 h-3.5" />
                    {title}
                </div>
                <div className="grid gap-6">
                    {recs.map((rec, i) => {
                        const imageUrl = getImageUrl(rec);
                        const isVideo = !!rec.videoId;

                        return (
                            <div key={i} className="flex flex-col sm:flex-row gap-6 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group overflow-hidden">
                                {imageUrl && (
                                    <div className={`relative shrink-0 overflow-hidden rounded-lg border border-white/10 shadow-lg bg-black/40 ${isVideo ? 'aspect-video w-full sm:w-48' : 'aspect-[2/3] w-32 sm:w-28'}`}>
                                        <Image
                                            src={imageUrl}
                                            alt={rec.title}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            sizes="(max-width: 640px) 100vw, 200px"
                                        />
                                        {isVideo && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
                                                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                                                    <Video className="w-5 h-5 text-white/80" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="flex-grow flex flex-col justify-center min-w-0">
                                    <div className="flex justify-between items-start gap-4 mb-2">
                                        <h4 className="text-lg font-medium text-white/90 group-hover:text-white transition-colors truncate">{rec.title}</h4>
                                        {rec.url && (
                                            <a
                                                href={rec.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="shrink-0 p-1.5 rounded-lg bg-white/5 text-white/20 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                    <p className="text-sm text-white/50 leading-relaxed font-light italic border-l-2 border-white/10 pl-4 py-1">
                                        "{rec.review}"
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {subjects.map((subject) => (
                    <motion.div
                        key={subject.id}
                        layoutId={`subject-${subject.id}`}
                        onClick={() => setSelectedSubject(subject)}
                        className="group cursor-pointer"
                    >
                        <ContentPanel className="h-full flex flex-col justify-between p-6 transition-all duration-300 group-hover:bg-white/[0.04] group-hover:border-white/10 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] border-white/5 bg-black/30">
                            <div>
                                <div className="flex items-center gap-2 mb-4 text-white/30">
                                    <GraduationCap className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-medium text-white/90 transition-colors group-hover:text-white mb-3">
                                    {subject.title}
                                </h3>
                                <p className="text-sm text-white/60 leading-relaxed transition-colors group-hover:text-white/70 line-clamp-3">
                                    {subject.description}
                                </p>
                            </div>
                            <div className="mt-6 flex items-center gap-2 text-[10px] text-white/20 uppercase tracking-widest font-bold group-hover:text-white/40 transition-colors">
                                <Box className="w-3 h-3" />
                                View Recommendations
                                <ArrowRight className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" />
                            </div>
                        </ContentPanel>
                    </motion.div>
                ))}
            </div>

            <DetailModal
                isOpen={!!selectedSubject}
                onClose={() => setSelectedSubject(null)}
                layoutId={selectedSubject ? `subject-${selectedSubject.id}` : undefined}
            >
                {selectedSubject && (
                    <div className="w-full flex flex-col lg:flex-row h-full overflow-hidden">
                        {/* Subject Title Section (Left on Desktop) */}
                        <div className="lg:w-[35%] p-8 sm:p-12 bg-neutral-900/50 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col justify-center">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 text-[10px] text-white/40 uppercase tracking-widest font-bold">
                                    <GraduationCap className="w-4 h-4" />
                                    Subject
                                </div>
                                <h2 className="text-3xl sm:text-4xl font-light text-white leading-tight">
                                    {selectedSubject.title}
                                </h2>
                                <div className="h-px w-16 bg-white/20" />
                                <p className="text-base text-white/50 leading-relaxed font-light">
                                    {selectedSubject.description}
                                </p>
                            </div>
                        </div>

                        {/* Recommendations Content (Right on Desktop) */}
                        <div className="lg:w-[65%] p-8 sm:p-12 lg:p-16 overflow-y-auto custom-scrollbar bg-neutral-950/30">
                            <div className="space-y-16">
                                <RecSection title="Books" icon={Book} recs={selectedSubject.recs.books} />
                                <RecSection title="Videos" icon={Video} recs={selectedSubject.recs.videos} />
                                <RecSection title="Miscellaneous" icon={Box} recs={selectedSubject.recs.misc} />
                            </div>

                            <div className="mt-20 pt-8 border-t border-white/5 flex items-center justify-between">
                                <div className="text-[10px] text-white/20 uppercase tracking-widest font-bold">
                                    End of Recommendations
                                </div>
                                <button
                                    onClick={() => setSelectedSubject(null)}
                                    className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-2"
                                >
                                    Back to Topics
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </DetailModal>
        </div>
    );
}
