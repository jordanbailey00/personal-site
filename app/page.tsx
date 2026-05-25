import ContentPanel from "@/components/panels/ContentPanel";
import GitHubGraph from "@/components/github/GitHubGraph";
import NASAGallery from "@/components/gallery/NASAGallery";
import JwstGallery from "@/components/gallery/JwstGallery";
import { profileData } from "@/content/profile";
import { getTopicImages } from "@/lib/nasa";
import { getJwstGalleryPhotos } from "@/lib/jwst";

export default async function Home() {
    // Fetch the latest displayable JWST images from the unfiltered JWST API feed
    const jwstItems = await getJwstGalleryPhotos({ limit: 50 });
    
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
            <JwstGallery 
                initialItems={jwstItems} 
            />

            {/* Artemis II Gallery Section */}
            <NASAGallery 
                title="Artemis II Mission" 
                items={artemisItems} 
            />

        </div>
    );
}
