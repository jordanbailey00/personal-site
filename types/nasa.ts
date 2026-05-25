export interface NASAMetadata {
    nasaId: string;
    title: string;
    description: string;
    dateCreated: string;
    center?: string;
    photographer?: string;
    keywords: string[];
    preview: string;
    fullImageUrl?: string;
}

export interface NASAAssetResponse {
    collection: {
        items: {
            href: string;
        }[];
    };
}

export interface NASASearchResponse {
    collection: {
        items: {
            data: {
                nasa_id: string;
                title: string;
                description: string;
                date_created: string;
                center?: string;
                photographer?: string;
                keywords?: string[];
            }[];
            links?: {
                href: string;
                rel: string;
            }[];
        }[];
    };
}
