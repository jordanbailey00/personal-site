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
    source: "nasa" | "flickr";
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

export interface FlickrPhoto {
    id: string;
    title: string;
    description: { _content: string };
    datetaken: string;
    dateupload: string;
    tags: string;
    url_m: string;
    url_l?: string;
    url_o?: string;
    ownername: string;
}

export interface FlickrResponse {
    photos: {
        photo: FlickrPhoto[];
    };
    stat: string;
}
