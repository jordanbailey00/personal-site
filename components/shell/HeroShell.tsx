"use client";

import { ReactNode, useContext, useRef } from "react";
import Starfield from "@/components/starfield/Starfield";
import FloatingNav from "@/components/nav/FloatingNav";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

function FrozenRouter({ children }: { children: ReactNode }) {
    const context = useContext(LayoutRouterContext);
    const frozen = useRef(context).current;

    return (
        <LayoutRouterContext.Provider value={frozen}>
            {children}
        </LayoutRouterContext.Provider>
    );
}

export default function HeroShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <main className="relative min-h-screen w-full overflow-hidden text-neutral-200">
            <Starfield />

            {/* Foreground Content Stage */}
            <div className="relative z-10 flex min-h-screen flex-col items-center">
                <FloatingNav />

                {/* Page transitions wrapper */}
                <div className="w-full flex-grow flex items-center justify-center pt-20 sm:pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.6, ease: "easeInOut" }}
                            className="w-full max-w-4xl"
                        >
                            <FrozenRouter>{children}</FrozenRouter>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </main>
    );
}
