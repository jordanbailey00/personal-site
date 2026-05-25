import { NASAMetadata, NASASearchResponse, NASAAssetResponse } from "@/types/nasa";
import { searchFlickrImages } from "./flickr";

const NASA_TOPICS = {
    jwst: {
        label: "James Webb Space Telescope",
        source: "flickr",
        queries: [
            "NIRCam OR MIRI OR NIRSpec OR Webb",
            "Webb Pillars of Creation",
            "Webb Carina Nebula",
            "Webb deep field",
        ],
    },
    "artemis-ii": {
        label: "Artemis II",
        source: "nasa",
        queries: [
            "Artemis II",
            "Artemis II lunar flyby",
            "Artemis II Journey to the Moon",
            "Artemis II Orion",
            "art002",
        ],
    },
} as const;

export async function searchNasaImages(query: string, limit: number = 20): Promise<NASAMetadata[]> {
    const params = new URLSearchParams({
        q: query,
        media_type: "image",
        page_size: String(limit),
    });

    try {
        const res = await fetch(`https://images-api.nasa.gov/search?${params}`, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!res.ok) {
            console.error(`NASA search failed for query "${query}": ${res.status}`);
            return [];
        }

        const data: NASASearchResponse = await res.json();

        return data.collection.items.map((item) => {
            const meta = item.data?.[0] ?? {};
            const preview = item.links?.find(l => l.rel === "preview")?.href ?? item.links?.[0]?.href ?? "";

            return {
                nasaId: meta.nasa_id,
                title: meta.title || "NASA Observation",
                description: meta.description || "",
                dateCreated: meta.date_created,
                center: meta.center,
                photographer: meta.photographer,
                keywords: meta.keywords ?? [],
                preview,
                source: "nasa",
            };
        }).filter(item => item.preview !== "");
    } catch (error) {
        console.error(`Error searching NASA images for "${query}":`, error);
        return [];
    }
}

export async function getBestNasaImageUrl(nasaId: string): Promise<string | null> {
    try {
        const res = await fetch(`https://images-api.nasa.gov/asset/${nasaId}`, {
            next: { revalidate: 86400 } // Cache asset URLs for 24 hours
        });

        if (!res.ok) {
            console.error(`NASA asset lookup failed for ${nasaId}: ${res.status}`);
            return null;
        }

        const data: NASAAssetResponse = await res.json();
        const urls = data.collection.items.map((item) => item.href);

        return (
            urls.find((url) => url.includes("~large.jpg")) ||
            urls.find((url) => url.includes("~medium.jpg")) ||
            urls.find((url) => url.endsWith(".jpg")) ||
            urls.find((url) => url.endsWith(".png")) ||
            urls[0] || 
            null
        );
    } catch (error) {
        console.error(`Error getting NASA asset URL for ${nasaId}:`, error);
        return null;
    }
}

export async function getTopicImages(topic: keyof typeof NASA_TOPICS, limitPerQuery: number = 10): Promise<NASAMetadata[]> {
    const config = NASA_TOPICS[topic];
    if (!config) return [];

    const allResults = await Promise.all(
        config.queries.map(async (q) => {
            if (config.source === "flickr") {
                return await searchFlickrImages(q, limitPerQuery);
            } else {
                return await searchNasaImages(q, limitPerQuery);
            }
        })
    );

    // Flatten and deduplicate by nasaId
    const flattened = allResults.flat();
    const seen = new Set<string>();
    const deduplicated = flattened.filter(item => {
        if (seen.has(item.nasaId)) return false;
        seen.add(item.nasaId);
        return true;
    });

    // Sort by dateCreated descending
    return deduplicated.sort((a, b) => 
        new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
    );
}
