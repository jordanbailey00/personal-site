import ProjectGallery from "@/components/projects/ProjectGallery";
import { getProjects } from "@/lib/projects";

export default async function Projects() {
    const projects = await getProjects();

    return (
        <div className="flex flex-col gap-8 pb-20">
            <h1 className="text-3xl font-light tracking-tight text-white/90 mb-2">Projects</h1>
            <ProjectGallery projects={projects} />
        </div>
    );
}
