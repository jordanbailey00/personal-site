import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import HeroShell from "@/components/shell/HeroShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Personal Portfolio",
    description: "A cinematic floating portfolio website.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.className} bg-black text-white antialiased selection:bg-white/30`}>
                <HeroShell>{children}</HeroShell>
            </body>
        </html>
    );
}
