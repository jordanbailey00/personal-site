export interface JwstImage {
    id: string;
    observationId: string | null;
    program: number | null;
    mission: string;
    instruments: string[];
    suffix: string | null;
    productDescription: string | null;
    fileType: string;
    imageUrl: string;
    thumbnailUrl: string;
    sourceUrl: string;
}

export interface JwstApiResponse {
    statusCode: number;
    body: JwstApiItem[];
    error: string;
}

export interface JwstApiItem {
    id: string;
    observation_id: string;
    program: number;
    details: {
        mission: string;
        instruments: { instrument: string }[];
        suffix: string;
        description: string;
    };
    file_type: string;
    thumbnail: string;
    location: string;
}
