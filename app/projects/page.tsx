import Image from "next/image";
import { projectsData } from "@/content/projects";

export default function Projects() {
    return (
        <div className="flex flex-col gap-8 pb-20">
            <h1 className="text-3xl font-light tracking-tight text-white/90 mb-2">Projects</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {projectsData.map((project) => (
                    <a
                        key={project.id}
                        href={project.url}
                        className="group relative flex flex-col gap-4 p-4 rounded-2xl border border-white/5 bg-black/30 backdrop-blur-sm transition-all hover:bg-white/[0.03] hover:border-white/20"
                    >
                        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-white/5">
                            <Image
                                src={project.thumbnail}
                                alt={project.title}
                                fill
                                className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                                sizes="(max-width: 640px) 100vw, 50vw"
                            />
                        </div>

                        <div className="px-1">
                            <h3 className="text-lg font-medium text-white/90 transition-colors group-hover:text-white">
                                {project.title}
                            </h3>

                            <div className="grid grid-rows-[0fr] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:grid-rows-[1fr]">
                                <p className="overflow-hidden text-sm text-white/50 pt-2 leading-relaxed opacity-0 transition-opacity duration-300 delay-100 group-hover:opacity-100">
                                    {project.description}
                                </p>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
