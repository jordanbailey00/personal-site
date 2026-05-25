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

function isThumbnailJpg(item: JwstApiItem) {
    return item.details?.suffix === "_thumb" || item.location?.toLowerCase().endsWith("_thumb.jpg") === true;
}

function isPreferredDisplayJpg(item: JwstApiItem) {
    const location = item.location?.toLowerCase() ?? "";
    return location.includes("long_cal") || location.endsWith("_i2d.jpg") || location.endsWith("_cal.jpg");
}

function takeRecentFirst<T>(items: T[], limit: number) {
    return items.slice(-limit).reverse();
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
        thumbnailUrl: item.location,
        sourceUrl: item.location,
    };
}

export async function getJwstGalleryPhotos(options: { limit?: number } = {}): Promise<JwstImage[]> {
    const limit = options.limit ?? 50;

    // The Postman docs define /all/type/:type for file-type queries.
    // Fetch all JPG records, then keep recent non-thumbnail display products.
    const allJpgItems = await jwstApiGet("/all/type/jpg");
    const displayJpgs = allJpgItems.filter((item) => item.location && !isThumbnailJpg(item));
    const preferredJpgs = displayJpgs.filter(isPreferredDisplayJpg);
    const fallbackJpgs = displayJpgs.filter((item) => !isPreferredDisplayJpg(item));
    const recentItems = [
        ...takeRecentFirst(preferredJpgs, limit),
        ...takeRecentFirst(fallbackJpgs, limit),
    ];

    const jpgImages = recentItems
        .map(normalizeJwstImage)
        .filter((item): item is JwstImage => item !== null);

    const deduped = Array.from(
        new Map(jpgImages.map((image) => [image.id, image])).values()
    );

    return deduped.slice(0, limit);
}
