import { cn } from "@/lib/utils";
import { getGitHubContributions } from "@/lib/github";

// Generate fake contribution data for the graph aesthetic ONLY as fallback
function generateMockContributions() {
    const weeks = 52;
    const daysPerWeek = 7;
    const data = [];

    for (let w = 0; w < weeks; w++) {
        const week = [];
        for (let d = 0; d < daysPerWeek; d++) {
            // Skew towards lower intensity to keep it subtle and dark
            const isActivity = Math.random() > 0.6;
            let intensity = 0;

            if (isActivity) {
                const rand = Math.random();
                if (rand > 0.9) intensity = 3;
                else if (rand > 0.7) intensity = 2;
                else intensity = 1;
            }

            week.push(intensity);
        }
        data.push(week);
    }
    return data;
}

export default async function GitHubGraph() {
    // Await the real data, fall back to mock data neatly if missing/failed.
    const realData = await getGitHubContributions();
    const mapData = realData || generateMockContributions();

    // Intensity to opacity mapping to fit the dark theme
    const getIntensityClass = (level: number) => {
        switch (level) {
            case 3: return "bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.5)]";
            case 2: return "bg-white/60 shadow-[0_0_4px_rgba(255,255,255,0.2)]";
            case 1: return "bg-white/30";
            default: return "bg-white/5";
        }
    };

    return (
        <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex gap-[3px] min-w-max">
                {mapData.map((week, wIndex) => (
                    <div key={wIndex} className="flex flex-col gap-[3px]">
                        {week.map((level, dIndex) => (
                            <div
                                key={dIndex}
                                className={cn(
                                    "w-[10px] h-[10px] sm:w-[12px] sm:h-[12px] rounded-[2px] transition-colors duration-300 hover:bg-white",
                                    getIntensityClass(level)
                                )}
                                title={`Activity level: ${level}`}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
