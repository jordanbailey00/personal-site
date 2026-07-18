import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ProjectDetail from "@/components/projects/ProjectDetail";
import { getRepoData } from "@/lib/github";
import { projectRepos } from "@/lib/projects";

type ProjectPageProps = {
    params: Promise<{ owner: string; repo: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
    return projectRepos;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
    const { owner, repo } = await params;
    const project = await getRepoData(owner, repo);

    if (!project) notFound();

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 pb-20">
            <Link href="/projects" className="inline-flex w-fit items-center gap-2 text-xs text-white/40 transition-colors hover:text-white">
                <ArrowLeft className="size-4" />
                Back to Projects
            </Link>
            <ProjectDetail project={project} />
        </div>
    );
}
