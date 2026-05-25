import { NASAMetadata } from "@/types/nasa";

type ApodItem = {
    copyright?: string;
    date: string;
    explanation: string;
    hdurl?: string;
    media_type: string;
    title: string;
    url: string;
};

type AstronomyImageOptions = {
    daysBack?: number;
    maxResults?: number;
};

function formatDate(date: Date) {
    return date.toISOString().slice(0, 10);
}

function getDateDaysAgo(daysBack: number) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - daysBack);
    return formatDate(date);
}

function isLikelyAstronomyPhoto(item: ApodItem) {
    if (item.media_type !== "image") return false;

    if (!item.hdurl) return false;

    const imageUrl = item.hdurl;
    const normalizedUrl = imageUrl.split("?")[0].toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp"].some((extension) => normalizedUrl.endsWith(extension))) return false;
    if (["300px", "thumb", "_sm", "-sm"].some((marker) => normalizedUrl.includes(marker))) return false;

    const text = [item.title, item.explanation].join(" ").toLowerCase();
    const blocked = [
        "artist", "illustration", "drawing", "animation", "diagram", "map", "simulation", "chart", "poster", "catalog at uniform scale",
        "people", "person", "portrait", "selfie", "crew", "astronaut", "launch", "rocket",
        "conference", "telescope mirror", "black and white", "black-and-white", "monochrome", "grayscale", "grey-scale", "b&w",
    ];
    const astronomyTerms = [
        "galaxy", "nebula", "star", "cluster", "comet", "planet", "moon", "mars",
        "jupiter", "saturn", "uranus", "neptune", "mercury", "venus", "sun", "solar",
        "eclipse", "aurora", "meteor", "asteroid", "supernova", "milky way",
        "constellation", "cosmic", "deep field", "space", "universe",
    ];

    return !blocked.some((word) => text.includes(word))
        && astronomyTerms.some((word) => text.includes(word));
}

export async function getAstronomyImages(options: AstronomyImageOptions = {}): Promise<NASAMetadata[]> {
    const daysBack = options.daysBack ?? 500;
    const maxResults = options.maxResults ?? 12;
    const params = new URLSearchParams({
        api_key: process.env.NASA_API_KEY ?? "DEMO_KEY",
        start_date: getDateDaysAgo(daysBack),
        end_date: formatDate(new Date()),
        thumbs: "false",
    });

    try {
        const res = await fetch("https://api.nasa.gov/planetary/apod?" + params, {
            next: { revalidate: 86400 }
        });

        if (!res.ok) {
            console.error("NASA APOD lookup failed: " + res.status);
            return [];
        }

        const data: ApodItem[] | ApodItem = await res.json();
        const items = Array.isArray(data) ? data : [data];

        return items
            .filter(isLikelyAstronomyPhoto)
            .reverse()
            .slice(0, maxResults)
            .map((item) => {
                const imageUrl = item.hdurl ?? item.url;

                return {
                    nasaId: "apod-" + item.date,
                    title: item.title,
                    description: item.explanation,
                    dateCreated: item.date,
                    center: "NASA APOD",
                    photographer: item.copyright,
                    keywords: ["APOD", "Astronomy"],
                    preview: imageUrl,
                    fullImageUrl: imageUrl,
                    source: "nasa" as const,
                };
            });
    } catch (error) {
        console.error("Error fetching NASA APOD images:", error);
        return [];
    }
}
