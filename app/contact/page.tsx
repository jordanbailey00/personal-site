import { profileData } from "@/content/profile";
import { Mail, Github, Twitter, Linkedin } from "lucide-react";
import ContentPanel from "@/components/panels/ContentPanel";

export default function Contact() {
    const socials = [
        { name: "Email", icon: Mail, href: `mailto:${profileData.socials.email}` },
        { name: "GitHub", icon: Github, href: profileData.socials.github },
        { name: "Twitter / X", icon: Twitter, href: profileData.socials.twitter },
        { name: "LinkedIn", icon: Linkedin, href: profileData.socials.linkedin },
    ];

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-2xl mx-auto items-center text-center mt-12 sm:mt-20">
            <h1 className="text-4xl font-light tracking-tight text-white/90 mb-2">Contact</h1>

            <p className="text-lg text-white/60 leading-relaxed mb-8">
                Feel free to reach out anytime at any of the below links!
            </p>

            <ContentPanel className="w-full flex flex-col gap-4 p-8 items-center bg-white/[0.02]">
                <div className="flex gap-6 sm:gap-8 justify-center w-full">
                    {socials.map((social) => {
                        const Icon = social.icon;
                        return (
                            <a
                                key={social.name}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-300 hover:bg-white/5"
                                aria-label={social.name}
                            >
                                <Icon strokeWidth={1.5} className="w-8 h-8 text-white/50 transition-colors duration-300 group-hover:text-white" />
                                <span className="text-xs font-medium text-white/40 transition-colors duration-300 group-hover:text-white/80">
                                    {social.name}
                                </span>
                            </a>
                        );
                    })}
                </div>
            </ContentPanel>
        </div>
    );
}
