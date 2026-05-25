import { NASAMetadata, FlickrResponse } from "@/types/nasa";

const FLICKR_API_KEY = process.env.FLICKR_API_KEY;
const NASA_WEBB_USER_ID = "50785054@N03";

export async function searchFlickrImages(query: string, limit: number = 20): Promise<NASAMetadata[]> {
    if (!FLICKR_API_KEY) {
        console.warn("FLICKR_API_KEY is missing. Skipping Flickr search.");
        return [];
    }

    const params = new URLSearchParams({
        method: "flickr.photos.search",
        api_key: FLICKR_API_KEY,
        user_id: NASA_WEBB_USER_ID,
        text: query,
        sort: "date-posted-desc",
        extras: "description,date_upload,date_taken,tags,url_m,url_l,url_o,owner_name",
        format: "json",
        nojsoncallback: "1",
        per_page: String(limit),
    });

    try {
        const res = await fetch(`https://www.flickr.com/services/rest/?${params}`, {
            next: { revalidate: 3600 }
        });

        if (!res.ok) {
            console.error(`Flickr search failed: ${res.status}`);
            return [];
        }

        const data: FlickrResponse = await res.json();
        if (data.stat !== "ok") {
            console.error("Flickr API error:", data);
            return [];
        }

        return data.photos.photo.map((photo) => ({
            nasaId: photo.id,
            title: photo.title || "JWST Observation",
            description: photo.description?._content || "",
            dateCreated: photo.datetaken || new Date(Number(photo.dateupload) * 1000).toISOString(),
            photographer: photo.ownername,
            keywords: photo.tags ? photo.tags.split(" ") : [],
            preview: photo.url_m,
            fullImageUrl: photo.url_o || photo.url_l || photo.url_m,
            source: "flickr",
        }));
    } catch (error) {
        console.error("Error searching Flickr images:", error);
        return [];
    }
}
