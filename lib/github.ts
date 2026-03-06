export async function getGitHubContributions() {
  const username = process.env.GITHUB_USERNAME;
  const token = process.env.GITHUB_TOKEN;

  if (!username || !token) {
    console.warn("GitHub env variables (GITHUB_USERNAME, GITHUB_TOKEN) missing. Falling back to mock data.");
    return null;
  }

  const query = `
    query($userName:String!) {
      user(login: $userName){
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "jordanbailey-portfolio"
      },
      body: JSON.stringify({ query, variables: { userName: username } }),
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    const json = await res.json();
    const weeks = json.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
    if (!weeks) return null;

    return weeks.map((week: any) => {
      return week.contributionDays.map((day: any) => {
        const count = day.contributionCount;
        if (count === 0) return 0;
        if (count <= 3) return 1;
        if (count <= 8) return 2;
        return 3;
      });
    });
  } catch (error) {
    console.error("Error fetching GitHub contributions:", error);
    return null;
  }
}

export interface ProjectData {
  name: string;
  repoFullName: string;
  repoUrl: string;
  description: string;
  readmeHtml: string;
  headerImage: string | null;
  topics: string[];
  homepage: string | null;
  lastUpdated: string;
}

export async function getRepoData(owner: string, repo: string): Promise<ProjectData | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.warn(`[getRepoData] GITHUB_TOKEN is missing. Skipping ${owner}/${repo}.`);
    return null;
  }

  try {
    console.log(`[getRepoData] Fetching ${owner}/${repo}...`);
    // Fetch Repo Metadata
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `token ${token}`,
        "User-Agent": "jordanbailey-portfolio"
      },
      next: { revalidate: 3600 }
    });

    if (!repoRes.ok) {
      console.error(`[getRepoData] Failed to fetch metadata for ${owner}/${repo}: ${repoRes.status} ${repoRes.statusText}`);
      return null;
    }
    const repoData = await repoRes.json();

    // Fetch README (HTML version for rendering)
    const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3.html",
        "User-Agent": "jordanbailey-portfolio"
      },
      next: { revalidate: 3600 }
    });

    let readmeHtml = "";
    if (!readmeRes.ok) {
      console.warn(`[getRepoData] Failed to fetch README HTML for ${owner}/${repo}: ${readmeRes.status}`);
    } else {
      readmeHtml = await readmeRes.text();
    }

    // Fetch README (Raw version to extract image)
    const readmeRawRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3.raw",
        "User-Agent": "jordanbailey-portfolio"
      },
      next: { revalidate: 3600 }
    });

    // 4. Robust Header Image Extraction & Cleaning
    let headerImage: string | null = null;
    let cleanedHtml = readmeHtml;

    if (readmeRawRes.ok) {
      const rawReadme = await readmeRawRes.text();
      // Patterns to detect images in both Markdown and HTML
      const mdImgRegex = /!\[.*?\]\((.*?)\)/g;
      const htmlImgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
      const excludedPatterns = [
        "img.shields.io", "badge", "github.com/actions/workflow-status",
        "travis-ci.org", "circleci.com", "codecov.io", "sonarcloud.io"
      ];

      const allMatches: { url: string; index: number }[] = [];
      let match;

      // Collect all Markdown images
      while ((match = mdImgRegex.exec(rawReadme)) !== null) {
        allMatches.push({ url: match[1], index: match.index });
      }

      // Collect all HTML images
      while ((match = htmlImgRegex.exec(rawReadme)) !== null) {
        allMatches.push({ url: match[1], index: match.index });
      }

      // Sort by appearance in README
      allMatches.sort((a, b) => a.index - b.index);

      for (const item of allMatches) {
        const isExcluded = excludedPatterns.some(pattern => item.url.includes(pattern));
        if (!isExcluded) {
          headerImage = item.url;
          // Resolve relative paths
          if (!headerImage.startsWith("http")) {
            // Default to master/main - in a real app we might fetch the default branch name
            headerImage = `https://raw.githubusercontent.com/${owner}/${repo}/master/${headerImage.replace(/^\.\//, "")}`;
          }
          break; // Found the first meaningful hero image
        }
      }

      // 5. Badge Stripping from HTML
      // We'll use a regex to remove elements that look like badges or contain badge keywords
      cleanedHtml = cleanedHtml
        .replace(/<a\b[^>]*>\s*<img\b[^>]*src=["'][^"']*(?:shields\.io|badge|workflow-status)[^"']*["'][^>]*>\s*<\/a>/gi, "")
        .replace(/<img\b[^>]*src=["'][^"']*(?:shields\.io|badge|workflow-status)[^"']*["'][^>]*>/gi, "");
    }

    return {
      name: repoData.name,
      repoFullName: repoData.full_name,
      repoUrl: repoData.html_url,
      description: repoData.description || "",
      readmeHtml: cleanedHtml,
      headerImage,
      topics: repoData.topics || [],
      homepage: repoData.homepage,
      lastUpdated: repoData.updated_at
    };
  } catch (error) {
    console.error(`Error fetching data for ${owner}/${repo}:`, error);
    return null;
  }
}
