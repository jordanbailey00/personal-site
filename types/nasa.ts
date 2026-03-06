export interface NASAImageItem {
    id: string;
    title: string;
    description: string;
    image: string;
    date: string;
    center?: string;
    keywords?: string[];
}

export interface NASAResponse {
    collection: {
        items: Array<{
            data: Array<{
                nasa_id: string;
                title: string;
                description?: string;
                date_created: string;
                center?: string;
                keywords?: string[];
            }>;
            links?: Array<{
                href: string;
                rel: string;
                render?: string;
            }>;
            href: string; // Asset manifest link
        }>;
    };
}
