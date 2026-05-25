import { JwstImage, JwstApiItem, JwstApiResponse } from "@/types/jwst";

const JWST_API_BASE_URL = "https://api.jwstapi.com";

function getJwstApiKey() {
    const apiKey = process.env.JWST_API_KEY;
    if (!apiKey) {
        // Fallback for local development warning if needed, but the route should handle this
        return "";
    }
    return apiKey;
}

async function jwstApiGet(path: string): Promise<JwstApiItem[]> {
    const apiKey = getJwstApiKey();
    if (!apiKey) {
        console.warn("JWST_API_KEY is missing.");
        return [];
    }

    const res = await fetch(`${JWST_API_BASE_URL}${path}`, {
        headers: {
            "X-API-KEY": apiKey,
        },
        next: { revalidate: 86400 } // Cache for 24 hours
    });

    if (!res.ok) {
        console.error(`JWST API request failed: ${res.status}`);
        return [];
    }

    const data: JwstApiResponse = await res.json();

    if (data.error) {
        console.error(`JWST API error: ${data.error}`);
        return [];
    }

    return data.body ?? [];
}

function normalizeJwstImage(item: JwstApiItem): JwstImage | null {
    if (!item || !item.id || !item.location) {
        return null;
    }

    const instruments = Array.isArray(item.details?.instruments)
        ? item.details.instruments
            .map((entry) => entry.instrument)
            .filter(Boolean)
        : [];

    return {
        id: item.id,
        observationId: item.observation_id ?? null,
        program: item.program ?? null,
        mission: item.details?.mission ?? "JWST",
        instruments,
        suffix: item.details?.suffix ?? null,
        productDescription: item.details?.description ?? null,
        fileType: item.file_type,
        imageUrl: item.location,
        thumbnailUrl: item.thumbnail || item.location,
        sourceUrl: item.location,
    };
}

export async function getJwstGalleryPhotos(options: { limit?: number } = {}): Promise<JwstImage[]> {
    const limit = options.limit ?? 50;
    const perPage = Math.min(limit, 50);

    const allItems = await jwstApiGet("/all?page=1&perPage=" + perPage);

    const jpgImages = allItems
        .filter((item) => item.file_type === "jpg")
        .filter((item) => item.location)
        .map(normalizeJwstImage)
        .filter((item): item is JwstImage => item !== null);

    // Deduplicate by ID
    const deduped = Array.from(
        new Map(jpgImages.map((image) => [image.id, image])).values()
    );

    return deduped.slice(0, limit);
}
