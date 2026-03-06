import { getRepoData, ProjectData } from "./github";

export async function getProjects(): Promise<ProjectData[]> {
    const projectRepos = [
        { owner: "jordanbailey00", repo: "byte_world_ai" },
        { owner: "jordanbailey00", repo: "fight-caves-rsps" },
        { owner: "jordanbailey00", repo: "asteroid-prospector-rl" },
    ];

    const projects = await Promise.all(
        projectRepos.map(async (repo) => {
            return await getRepoData(repo.owner, repo.repo);
        })
    );

    // Filter out any failed fetches
    return projects.filter((p): p is ProjectData => p !== null);
}
