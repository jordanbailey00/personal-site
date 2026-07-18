import Image from "next/image";
import Link from "next/link";
import { ProjectData } from "@/lib/github";
import { Info, Github } from "lucide-react";

interface ProjectGalleryProps {
    projects: ProjectData[];
}

export default function ProjectGallery({ projects }: ProjectGalleryProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {projects.map((project: ProjectData) => (
                <Link
                    key={project.repoFullName}
                    href={`/projects/${project.repoFullName}`}
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
                                View Project
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
                </Link>
            ))}
        </div>
    );
}
