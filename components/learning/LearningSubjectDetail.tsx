import Image from "next/image";
import { Book, Box, ExternalLink, GraduationCap, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { LearningSubject, Recommendation } from "@/content/learning";

type RecSectionProps = {
    title: string;
    icon: LucideIcon;
    recs: Recommendation[];
};

function getImageUrl(rec: Recommendation): string | null {
    if (rec.isbn) return "https://covers.openlibrary.org/b/isbn/" + rec.isbn + "-L.jpg";
    if (rec.videoId) return "https://img.youtube.com/vi/" + rec.videoId + "/maxresdefault.jpg";
    return null;
}

function RecSection({ title, icon: Icon, recs }: RecSectionProps) {
    if (recs.length === 0) return null;

    return (
        <section className="space-y-6">
            <h2 className="flex items-center gap-2 border-b border-white/5 pb-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                <Icon className="w-3.5 h-3.5" />
                {title}
            </h2>
            <div className="grid gap-6">
                {recs.map((rec) => {
                    const imageUrl = getImageUrl(rec);
                    const isVideo = Boolean(rec.videoId);

                    return (
                        <article key={rec.title} className="group flex flex-col gap-6 overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.05] sm:flex-row">
                            {imageUrl && (
                                <div className={[
                                    "relative shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/40 shadow-lg",
                                    isVideo ? "aspect-video w-full sm:w-48" : "aspect-[2/3] w-32 sm:w-28",
                                ].join(" ")}>
                                    <Image
                                        src={imageUrl}
                                        alt={rec.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        sizes="(max-width: 640px) 100vw, 200px"
                                    />
                                    {isVideo && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-transparent">
                                            <div className="flex size-10 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md transition-transform group-hover:scale-110">
                                                <Video className="w-5 h-5 text-white/80" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex min-w-0 flex-grow flex-col justify-center">
                                <div className="mb-2 flex items-start justify-between gap-4">
                                    <h3 className="text-lg font-medium text-white/90 transition-colors group-hover:text-white">{rec.title}</h3>
                                    {rec.url && (
                                        <a
                                            href={rec.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="shrink-0 rounded-lg border border-white/5 bg-white/5 p-1.5 text-white/20 transition-all hover:bg-white/10 hover:text-white"
                                            aria-label={`Open ${rec.title}`}
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                                <p className="border-l-2 border-white/10 py-1 pl-4 text-sm font-light italic leading-relaxed text-white/50">
                                    &ldquo;{rec.review}&rdquo;
                                </p>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

interface LearningSubjectDetailProps {
    subject: LearningSubject;
}

export default function LearningSubjectDetail({ subject }: LearningSubjectDetailProps) {
    return (
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)]">
            <header className="h-fit space-y-6 border-b border-white/5 pb-8 lg:sticky lg:top-8 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-12">
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-white/40">
                    <GraduationCap className="w-4 h-4" />
                    Subject
                </div>
                <h1 className="text-3xl font-light leading-tight text-white sm:text-4xl">{subject.title}</h1>
                <div className="h-px w-16 bg-white/20" />
                <p className="text-base font-light leading-relaxed text-white/50">{subject.description}</p>
            </header>

            <div className="space-y-16">
                <RecSection title="Books" icon={Book} recs={subject.recs.books} />
                <RecSection title="Videos" icon={Video} recs={subject.recs.videos} />
                <RecSection title="Miscellaneous" icon={Box} recs={subject.recs.misc} />
            </div>
        </div>
    );
}
