import { writingData, WritingPost } from "../content/writing";

export async function getWritings(): Promise<WritingPost[]> {
    // In a real app, this might fetch from a CMS or local markdown files
    return writingData;
}

export async function getWritingBySlug(slug: string): Promise<WritingPost | undefined> {
    return writingData.find(post => post.slug === slug);
}
