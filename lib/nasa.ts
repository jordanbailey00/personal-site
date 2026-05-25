import { NASAImageItem, NASAResponse } from "@/types/nasa";

export async function fetchNASAImages(limit: number = 25): Promise<NASAImageItem[]> {
    try {
        const query = "James Webb Space Telescope";
        const url = `https://images-api.nasa.gov/search?q=${query}&media_type=image`;

        const response = await fetch(url, {
            next: { revalidate: 86400 } // Cache for 24 hours
        });

        if (!response.ok) {
            throw new Error(`NASA API returned status: ${response.status}`);
        }

        const data: NASAResponse = await response.json();

        const items = data.collection.items
            .filter(item => item.links && item.links.length > 0 && item.data && item.data.length > 0)
            .map(item => {
                const info = item.data[0];
                const imageLink = item.links?.find(l => l.rel === "preview")?.href || item.links?.[0].href || "";
                
                // Heuristic to filter out press releases/people: look for "telescope", "nebula", "galaxy", "stars", "deep field"
                const description = (info.description || "").toLowerCase();
                const title = (info.title || "").toLowerCase();
                const keywords = (info.keywords || []).map(k => k.toLowerCase());
                
                const isScientific = 
                    title.includes("webb") || 
                    title.includes("jwst") ||
                    keywords.some(k => ["nebula", "galaxy", "star", "deep field", "infrared"].includes(k));
                
                const isPressRelease = 
                    title.includes("press") || 
                    title.includes("briefing") || 
                    title.includes("conference") ||
                    description.includes("standing in front of") ||
                    description.includes("speaks to");

                return {
                    id: info.nasa_id,
                    title: info.title || "JWST Observation",
                    description: info.description || "Captured by the James Webb Space Telescope, providing a window into the deep reaches of our universe.",
                    image: imageLink,
                    date: info.date_created,
                    center: info.center,
                    keywords: info.keywords,
                    isScientific,
                    isPressRelease
                };
            })
            .filter(item => item.image !== "" && item.isScientific && !item.isPressRelease)
            .slice(0, limit);

        return items;
    } catch (error) {
        console.error("Error fetching Hubble images:", error);
        return [];
    }
}
