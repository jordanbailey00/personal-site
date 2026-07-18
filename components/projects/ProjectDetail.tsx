import Image from "next/image";
import { Calendar, ExternalLink, Github, Tag } from "lucide-react";
import { ProjectData } from "@/lib/github";
import ByteWorldCaseStudy from "./ByteWorldCaseStudy";
import FightCavesRLCaseStudy from "./FightCavesRLCaseStudy";
import RuneCCaseStudy from "./RuneCCaseStudy";

interface ProjectDetailProps {
    project: ProjectData;
}

export default function ProjectDetail({ project }: ProjectDetailProps) {
    const repoName = project.repoFullName.toLowerCase();
    const isRuneC = repoName === "jordanbailey00/runec";
    const isFightCaves = repoName === "jordanbailey00/fight-caves-rl" || repoName === "jordanbailey00/fightcaves-rl";
    const isByteWorld = repoName === "jordanbailey00/byte_world_ai";

    return (
        <div className="space-y-12">
            <header className="flex flex-col gap-6 border-b border-white/5 pb-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight">{project.name}</h1>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-white/30 uppercase tracking-widest font-bold">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10">
                            <Calendar className="w-3 h-3" />
                            Updated: {new Date(project.lastUpdated).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10">
                            <Github className="w-3 h-3" />
                            {project.repoFullName}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80 hover:bg-white/10 hover:text-white transition-all font-medium"
                    >
                        <Github className="w-4 h-4" />
                        Source Code
                    </a>
                    {project.homepage && (
                        <a
                            href={project.homepage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80 hover:bg-white/10 hover:text-white transition-all font-medium"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Live Demo
                        </a>
                    )}
                </div>
            </header>

            {project.headerImage && (
                <div className="relative w-full aspect-[21/9] overflow-hidden rounded-2xl border border-white/10 bg-black/50 shadow-2xl">
                    <Image
                        src={project.headerImage}
                        alt={`${project.name} Banner`}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
            )}

            {isRuneC ? (
                <RuneCCaseStudy />
            ) : isFightCaves ? (
                <FightCavesRLCaseStudy />
            ) : isByteWorld ? (
                <ByteWorldCaseStudy />
            ) : project.readmeHtml ? (
                <div
                    className="prose prose-invert prose-base sm:prose-lg max-w-none
                    prose-headings:text-white prose-headings:font-light prose-headings:tracking-tight
                    prose-h2:border-b prose-h2:border-white/5 prose-h2:pb-2 prose-h2:mt-12
                    prose-p:text-white/60 prose-p:leading-relaxed
                    prose-a:text-white/80 prose-a:underline hover:prose-a:text-white transition-colors
                    prose-strong:text-white/90 prose-strong:font-medium
                    prose-ul:text-white/60 prose-ol:text-white/60
                    prose-code:text-white/80 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                    prose-pre:bg-black/60 prose-pre:border prose-pre:border-white/5 prose-pre:p-6 prose-pre:rounded-xl
                    prose-img:rounded-xl prose-img:border prose-img:border-white/10 prose-img:shadow-lg
                    prose-blockquote:border-white/20 prose-blockquote:text-white/40 prose-blockquote:italic"
                    dangerouslySetInnerHTML={{ __html: project.readmeHtml }}
                />
            ) : (
                <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                    <p className="text-white/30 italic">Detailed documentation is currently unavailable for this repository.</p>
                </div>
            )}

            {project.topics.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-12 border-t border-white/5">
                    {project.topics.map((topic) => (
                        <div key={topic} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] text-white/40 hover:text-white/60 hover:bg-white/[0.08] transition-all">
                            <Tag className="w-3 h-3" />
                            {topic}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
