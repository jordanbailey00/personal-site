"use client";

import { useState } from "react";
import Image from "next/image";
import { ProjectData } from "@/lib/github";
import { motion } from "motion/react";
import { Info, Github, ExternalLink, Calendar, Tag } from "lucide-react";
import DetailModal from "../panels/DetailModal";

interface ProjectGalleryProps {
    projects: ProjectData[];
}

export default function ProjectGallery({ projects }: ProjectGalleryProps) {
    const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

    return (
        <div className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {projects.map((project: ProjectData) => (
                    <motion.div
                        key={project.repoFullName}
                        layoutId={`project-${project.repoFullName}`}
                        onClick={() => setSelectedProject(project)}
                        className="group relative flex flex-col gap-4 rounded-2xl border border-white/5 bg-black/30 backdrop-blur-sm p-4 transition-all hover:bg-white/[0.03] hover:border-white/20 cursor-pointer overflow-hidden"
                    >
                        {/* Hover Overlay - Quick Blurb */}
                        <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                <h4 className="text-sm font-medium text-white mb-2">{project.name}</h4>
                                <p className="text-xs text-white/70 line-clamp-3 leading-relaxed">
                                    {project.description}
                                </p>
                                <div className="mt-4 flex items-center gap-1 text-[10px] text-white/40 uppercase tracking-widest font-bold">
                                    <Info className="w-3 h-3" />
                                    View README & Details
                                </div>
                            </div>
                        </div>

                        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-white/5">
                            {project.headerImage ? (
                                <Image
                                    src={project.headerImage}
                                    alt={project.name}
                                    fill
                                    className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 overflow-hidden">
                                    <Github className="w-12 h-12 text-white/5 opacity-20" />
                                </div>
                            )}
                        </div>

                        <div className="px-1">
                            <h3 className="text-lg font-medium text-white/90 group-hover:text-white transition-colors">
                                {project.name}
                            </h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <DetailModal
                isOpen={!!selectedProject}
                onClose={() => setSelectedProject(null)}
                layoutId={selectedProject ? `project-${selectedProject.repoFullName}` : undefined}
            >
                {selectedProject && (
                    <div className="flex flex-col w-full h-full bg-neutral-900/10">
                        {/* 1. Header Area: Title / Metadata / Actions */}
                        <div className="flex flex-col gap-6 p-8 border-b border-white/5 bg-black/40">
                            <div className="flex flex-col gap-2">
                                <h2 className="text-4xl font-light text-white tracking-tight">{selectedProject.name}</h2>
                                <div className="flex items-center gap-4 text-[10px] text-white/30 uppercase tracking-widest font-bold">
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10">
                                        <Calendar className="w-3 h-3" />
                                        Updated: {new Date(selectedProject.lastUpdated).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10">
                                        <Github className="w-3 h-3" />
                                        {selectedProject.repoFullName}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <a
                                    href={selectedProject.repoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80 hover:bg-white/10 hover:text-white transition-all font-medium"
                                >
                                    <Github className="w-4 h-4" />
                                    Source Code
                                </a>
                                {selectedProject.homepage && (
                                    <a
                                        href={selectedProject.homepage}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80 hover:bg-white/10 hover:text-white transition-all font-medium"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Live Demo
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* 2. Scrollable Content Area */}
                        <div className="flex-grow overflow-y-auto custom-scrollbar min-h-0">
                            <div className="max-w-4xl mx-auto p-8 sm:p-12 space-y-12">

                                {/* Hero Image Section */}
                                {selectedProject.headerImage && (
                                    <div className="relative w-full aspect-[21/9] overflow-hidden rounded-2xl border border-white/10 bg-black/50 shadow-2xl">
                                        <Image
                                            src={selectedProject.headerImage}
                                            alt={`${selectedProject.name} Banner`}
                                            fill
                                            className="object-cover"
                                            priority
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                    </div>
                                )}

                                {/* Main Description (About Blurb) */}
                                <div className="text-lg text-white/70 font-light leading-relaxed border-l-2 border-white/10 pl-6 italic">
                                    {selectedProject.description}
                                </div>

                                {/* Full README Content */}
                                <div className="pt-4">
                                    {selectedProject.readmeHtml ? (
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
                                            dangerouslySetInnerHTML={{ __html: selectedProject.readmeHtml }}
                                        />
                                    ) : (
                                        <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                                            <p className="text-white/30 italic">Detailed documentation is currently unavailable for this repository.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Tech Tags */}
                                {selectedProject.topics.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-12 border-t border-white/5">
                                        {selectedProject.topics.map((topic: string) => (
                                            <div key={topic} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] text-white/40 hover:text-white/60 hover:bg-white/[0.08] transition-all">
                                                <Tag className="w-3 h-3" />
                                                {topic}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </DetailModal>
        </div>
    );
}
