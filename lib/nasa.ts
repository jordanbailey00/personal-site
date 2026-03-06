import { NASAImageItem, NASAResponse } from "@/types/nasa";

export async function fetchHubbleImages(limit: number = 25): Promise<NASAImageItem[]> {
    try {
        const query = "Hubble";
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
            .slice(0, limit)
            .map(item => {
                const info = item.data[0];
                const imageLink = item.links?.find(l => l.rel === "preview")?.href || item.links?.[0].href || "";

                return {
                    id: info.nasa_id,
                    title: info.title || "Unknown Cosmic Phenomenon",
                    description: info.description || "Captured by the Hubble Space Telescope, providing a window into the deep reaches of our universe.",
                    image: imageLink,
                    date: info.date_created,
                    center: info.center,
                    keywords: info.keywords
                };
            })
            .filter(item => item.image !== "");

        return items;
    } catch (error) {
        console.error("Error fetching Hubble images:", error);
        return [];
    }
}
