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
    source: "nasa";
}
