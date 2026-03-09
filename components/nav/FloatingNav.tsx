"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Projects", href: "/projects" },
    { name: "Writing", href: "/writing" },
    { name: "Learning Recs", href: "/learning" },
    { name: "Contact", href: "/contact" },
];

export default function FloatingNav() {
    const pathname = usePathname();

    return (
        <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
        >
            <div className="flex items-center gap-1 sm:gap-2 px-3 py-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative px-2.5 sm:px-4 py-1.5 rounded-full text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                        >
                            <span className={cn(
                                "relative z-10",
                                isActive ? "text-white" : "text-neutral-400 hover:text-neutral-200"
                            )}>
                                {item.name}
                            </span>

                            {isActive && (
                                <motion.div
                                    layoutId="nav-indicator"
                                    className="absolute inset-0 rounded-full bg-white/10"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </motion.nav>
    );
}
