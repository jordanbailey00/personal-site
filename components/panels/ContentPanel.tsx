import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ContentPanelProps {
    children: ReactNode;
    className?: string;
    delay?: number; // Optional delay for staggered entrance
}

export default function ContentPanel({ children, className }: ContentPanelProps) {
    return (
        <div
            className={cn(
                "rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md",
                "shadow-[0_0_15px_rgba(255,255,255,0.03)] p-6 sm:p-8",
                className
            )}
        >
            {children}
        </div>
    );
}
