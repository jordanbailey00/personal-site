"use client";

import { useState } from "react";
import { LearningSubject, Recommendation } from "@/content/learning";
import { motion } from "motion/react";
import { Book, Video, Box, ExternalLink, GraduationCap, ArrowRight } from "lucide-react";
import ContentPanel from "../panels/ContentPanel";
import DetailModal from "../panels/DetailModal";

interface LearningRecsProps {
    subjects: LearningSubject[];
}

export default function LearningRecs({ subjects }: LearningRecsProps) {
    const [selectedSubject, setSelectedSubject] = useState<LearningSubject | null>(null);

    const RecSection = ({ title, icon: Icon, recs }: { title: string, icon: any, recs: Recommendation[] }) => {
        if (recs.length === 0) return null;

        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-white/40 uppercase tracking-widest text-[10px] font-bold">
                    <Icon className="w-3.5 h-3.5" />
                    {title}
                </div>
                <div className="grid gap-4">
                    {recs.map((rec, i) => (
                        <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors group">
                            <div className="flex justify-between items-start gap-4 mb-2">
                                <h4 className="text-white/90 font-medium group-hover:text-white transition-colors">{rec.title}</h4>
                                {rec.url && (
                                    <a
                                        href={rec.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-white/20 hover:text-white transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                            <p className="text-sm text-white/50 leading-relaxed font-light italic">"{rec.review}"</p>
                        </div>
                    ))}
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
                            <div className="space-y-12">
                                <RecSection title="Books" icon={Book} recs={selectedSubject.recs.books} />
                                <RecSection title="Videos" icon={Video} recs={selectedSubject.recs.videos} />
                                <RecSection title="Miscellaneous" icon={Box} recs={selectedSubject.recs.misc} />
                            </div>

                            <div className="mt-16 pt-8 border-t border-white/5 flex items-center justify-between">
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
