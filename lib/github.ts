export async function getGitHubContributions() {
    const username = process.env.GITHUB_USERNAME;
    const token = process.env.GITHUB_TOKEN;

    // Fallback trigger if env variables are not provided
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
            },
            body: JSON.stringify({ query, variables: { userName: username } }),
            next: { revalidate: 3600 }, // Generous 1 hour cache to prevent rate-limiting
        });

        if (!res.ok) {
            console.warn(`GitHub API request failed with status: ${res.status}`);
            return null;
        }

        const json = await res.json();

        if (json.errors) {
            console.warn("GitHub GraphQL errors:", json.errors);
            return null;
        }

        const weeks = json.data?.user?.contributionsCollection?.contributionCalendar?.weeks;

        if (!weeks) {
            console.warn("GitHub contribution data is malformed.");
            return null;
        }

        // Normalize real counts into our cinematic 0-3 intensity scale
        const normalizedData: number[][] = weeks.map((week: any) => {
            return week.contributionDays.map((day: any) => {
                const count = day.contributionCount;
                if (count === 0) return 0;
                if (count <= 3) return 1;
                if (count <= 8) return 2;
                return 3;
            });
        });

        return normalizedData;
    } catch (error) {
        console.error("Error fetching GitHub contributions:", error);
        return null;
    }
}
