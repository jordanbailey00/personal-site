import ContentPanel from "@/components/panels/ContentPanel";
import { writingData } from "@/content/writing";

export default function Writing() {
    return (
        <div className="flex flex-col gap-8 pb-20">
            <h1 className="text-3xl font-light tracking-tight text-white/90 mb-2">Writing</h1>

            <div className="flex flex-col gap-4">
                {writingData.map((post) => (
                    <a
                        key={post.id}
                        href={`#/${post.id}`} // Mock link for now
                        className="group block"
                    >
                        <ContentPanel className="p-5 sm:p-6 transition-colors duration-300 group-hover:bg-white/[0.03] group-hover:border-white/10 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-3">
                                <h3 className="text-lg font-medium text-white/90 transition-colors group-hover:text-white">
                                    {post.title}
                                </h3>
                                <span className="text-xs font-mono text-white/40 tabular-nums">
                                    {post.date}
                                </span>
                            </div>
                            <p className="text-sm text-white/60 leading-relaxed transition-colors group-hover:text-white/70">
                                {post.excerpt}
                            </p>
                        </ContentPanel>
                    </a>
                ))}
            </div>
        </div>
    );
}
