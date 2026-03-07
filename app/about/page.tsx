import ContentPanel from "@/components/panels/ContentPanel";
import { aboutData } from "@/content/about";
import * as LucideIcons from "lucide-react";

export default function About() {
    const groupedSkills = aboutData.skills.reduce((acc, skill) => {
        if (!acc[skill.type]) acc[skill.type] = [];
        acc[skill.type].push(skill);
        return acc;
    }, {} as Record<string, typeof aboutData.skills>);

    return (
        <div className="flex flex-col gap-8 pb-20 w-full max-w-4xl mx-auto">
            <section>
                <h1 className="text-3xl font-light tracking-tight text-white/90 mb-6">About</h1>
                <h2 className="text-xl text-white/80 font-medium mb-8">
                    {aboutData.headline}
                </h2>

                <div className="flex flex-col gap-6">
                    {aboutData.description.map((paragraph, i) => (
                        <ContentPanel key={i} className="p-6">
                            <p className="text-base text-white/60 leading-relaxed">
                                {paragraph}
                            </p>
                        </ContentPanel>
                    ))}
                </div>
            </section>

            <section className="flex flex-col gap-8">
                <h3 className="text-sm font-medium uppercase tracking-widest text-white/40">
                    Technical Arsenal
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(groupedSkills).map(([type, skills]) => (
                        <ContentPanel key={type} className="p-6 flex flex-col gap-4 bg-white/[0.02]">
                            <h4 className="text-xs font-semibold uppercase tracking-tighter text-white/30 border-b border-white/5 pb-2">
                                {type}s
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {skills.map((skill) => {
                                    // Map kebab-case or names to Lucide icon components
                                    // A very simple mapper or using icon name directly if it matches common lucide exports
                                    const iconName = skill.icon.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('') as keyof typeof LucideIcons;
                                    const IconComponent = (LucideIcons[iconName] as any) || LucideIcons.HelpCircle;

                                    return (
                                        <div
                                            key={skill.name}
                                            className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]"
                                            style={{ '--skill-color': skill.color } as any}
                                        >
                                            <IconComponent size={14} className="text-white/40 group-hover:text-[var(--skill-color)] transition-colors" />
                                            <span className="text-sm text-white/70 group-hover:text-white transition-colors">
                                                {skill.name}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </ContentPanel>
                    ))}
                </div>
            </section>
        </div>
    );
}
