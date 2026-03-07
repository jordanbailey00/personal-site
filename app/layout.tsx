import type { Metadata } from "next";
import { Russo_One } from "next/font/google";
import "./globals.css";
import HeroShell from "@/components/shell/HeroShell";

const russoOne = Russo_One({
    weight: "400",
    subsets: ["latin"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "Jordan Bailey",
    description: "A cinematic floating portfolio website.",
    icons: {
        icon: "/favicon.png",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className={`${russoOne.className} bg-black text-white antialiased selection:bg-white/30`}>
                <HeroShell>{children}</HeroShell>
            </body>
        </html>
    );
}
