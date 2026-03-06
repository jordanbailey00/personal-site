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
                    <>
                        {/* Left Side: Header Image & Visuals */}
                        <div className="relative flex-grow h-64 sm:h-80 lg:h-auto lg:w-[60%] bg-black flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5">
                            {selectedProject.headerImage ? (
                                <Image
                                    src={selectedProject.headerImage}
                                    alt={selectedProject.name}
                                    fill
                                    className="object-cover lg:object-contain opacity-80"
                                    priority
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-black flex items-center justify-center">
                                    <Github className="w-24 h-24 text-white/5" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                            <div className="absolute bottom-8 left-8 right-8 z-10">
                                <h2 className="text-3xl font-light text-white mb-2">{selectedProject.name}</h2>
                                <p className="text-sm text-white/50 max-w-lg leading-relaxed">
                                    {selectedProject.description}
                                </p>
                            </div>
                        </div>

                        {/* Right Side: README & Content */}
                        <div className="w-full lg:w-[40%] flex flex-col h-full overflow-hidden bg-neutral-900/30">
                            {/* Actions Bar */}
                            <div className="flex items-center gap-4 p-6 border-b border-white/5">
                                <a
                                    href={selectedProject.repoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-all"
                                >
                                    <Github className="w-4 h-4" />
                                    Repository
                                </a>
                                {selectedProject.homepage && (
                                    <a
                                        href={selectedProject.homepage}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-all"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        App
                                    </a>
                                )}
                            </div>

                            {/* Scrollable README Area */}
                            <div className="flex-grow overflow-y-auto p-6 sm:p-8 custom-scrollbar">
                                <div className="space-y-8">
                                    {/* Stats / Meta */}
                                    <div className="flex flex-wrap gap-4 pt-2">
                                        <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest font-bold">
                                            <Calendar className="w-3 h-3" />
                                            Updated: {new Date(selectedProject.lastUpdated).toLocaleDateString()}
                                        </div>
                                    </div>

                                    {/* README Render */}
                                    {selectedProject.readmeHtml ? (
                                        <div
                                            className="prose prose-invert prose-sm max-w-none 
                                            prose-headings:font-light prose-headings:text-white/90
                                            prose-p:text-white/60 prose-p:leading-relaxed
                                            prose-a:text-white/40 prose-a:underline hover:prose-a:text-white/80
                                            prose-strong:text-white/80
                                            prose-code:text-white/70 prose-code:bg-white/5 prose-code:px-1 prose-code:rounded
                                            prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/5
                                            prose-img:rounded-xl prose-img:border prose-img:border-white/10 mt-8"
                                            dangerouslySetInnerHTML={{ __html: selectedProject.readmeHtml }}
                                        />
                                    ) : (
                                        <div className="text-sm text-white/30 italic">
                                            No README content available for this repository.
                                        </div>
                                    )}

                                    {selectedProject.topics.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-8">
                                            {selectedProject.topics.map((topic: string) => (
                                                <div key={topic} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] text-white/40">
                                                    <Tag className="w-3 h-3" />
                                                    {topic}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </DetailModal>
        </div>
    );
}
