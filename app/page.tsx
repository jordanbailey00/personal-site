import ContentPanel from "@/components/panels/ContentPanel";
import GitHubGraph from "@/components/github/GitHubGraph";
import HubbleGallery from "@/components/gallery/HubbleGallery";
import { profileData } from "@/content/profile";
import { fetchHubbleImages } from "@/lib/nasa";

export default async function Home() {
    const hubbleItems = await fetchHubbleImages(25);

    return (
        <div className="flex flex-col gap-8 sm:gap-12 pb-20">

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

            {/* Hubble Gallery Section */}
            <section>
                <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-white/40">
                    Cosmic Observations
                </h2>
                <HubbleGallery initialItems={hubbleItems} />
            </section>

        </div>
    );
}
