import ContentPanel from "@/components/panels/ContentPanel";
import { aboutData } from "@/content/about";

export default function About() {
    return (
        <div className="flex flex-col gap-8 pb-20">
            <section>
                <h1 className="text-3xl font-light tracking-tight text-white/90 mb-6">About</h1>
                <h2 className="text-xl text-white/80 font-medium mb-8">
                    {aboutData.headline}
                </h2>

                <div className="flex flex-col gap-6">
                    {aboutData.description.map((paragraph, i) => (
                        <ContentPanel key={i}>
                            <p className="text-base text-white/60 leading-relaxed">
                                {paragraph}
                            </p>
                        </ContentPanel>
                    ))}
                </div>
            </section>

            <section>
                <h3 className="mb-4 text-sm font-medium uppercase tracking-widest text-white/40">
                    Core Technologies
                </h3>
                <ContentPanel className="p-6">
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        {aboutData.skills.map((skill) => (
                            <span
                                key={skill}
                                className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm text-white/70 tracking-wide"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </ContentPanel>
            </section>
        </div>
    );
}
