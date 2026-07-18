import Link from "next/link";
import { LearningSubject } from "@/content/learning";
import { Box, GraduationCap, ArrowRight } from "lucide-react";
import ContentPanel from "../panels/ContentPanel";

interface LearningRecsProps {
    subjects: LearningSubject[];
}

export default function LearningRecs({ subjects }: LearningRecsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {subjects.map((subject) => (
                <Link key={subject.id} href={`/learning/${subject.id}`} className="group">
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
                </Link>
            ))}
        </div>
    );
}
