import ContentPanel from "@/components/panels/ContentPanel";
import GitHubGraph from "@/components/github/GitHubGraph";
import NASAGallery from "@/components/gallery/NASAGallery";
import { profileData } from "@/content/profile";
import { getTopicImages } from "@/lib/nasa";

export default async function Home() {
    // Fetch color public-release Webb imagery from NASA Image and Video Library.
    const jwstItems = await getTopicImages("jwst", 8, {
        hydrateAssets: true,
        maxResults: 12,
    });
    
    // Fetch Artemis II images from NASA Image API
    const artemisItems = await getTopicImages("artemis-ii", 12);

    return (
        <div className="flex flex-col gap-12 sm:gap-16 pb-20">

            {/* Intro Section */}
            <section className="flex flex-col gap-4">
                <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white/90">
                    {profileData.name}
                </h1>
                <p className="max-w-2xl text-base sm:text-lg text-white/60 leading-relaxed">
                    {profileData.blurb}
                </p>
            </section>

            {/* GitHub Graph Section */}
            <section>
                <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-white/40">
                    Activity / Commits
                </h2>
                <ContentPanel>
                    <GitHubGraph />
                </ContentPanel>
            </section>

            {/* JWST Gallery Section */}
            <NASAGallery
                title="James Webb Space Telescope"
                items={jwstItems}
            />

            {/* Artemis II Gallery Section */}
            <NASAGallery 
                title="Artemis II Mission" 
                items={artemisItems} 
            />

        </div>
    );
}
