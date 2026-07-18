import { getRepoData, ProjectData } from "./github";

export const projectRepos = [
    { owner: "jordanbailey00", repo: "RuneC" },
    { owner: "jordanbailey00", repo: "fight-caves-rl" },
    { owner: "jordanbailey00", repo: "byte_world_ai" },
] as const;

export async function getProjects(): Promise<ProjectData[]> {
    const projects = await Promise.all(
        projectRepos.map(async (repo) => {
            return await getRepoData(repo.owner, repo.repo);
        })
    );

    // Filter out any failed fetches
    const filtered = projects.filter((p): p is ProjectData => p !== null);
    console.log(`[getProjects] Successfully fetched ${filtered.length} projects.`);
    return filtered;
}
