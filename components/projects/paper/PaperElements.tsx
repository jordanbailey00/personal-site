import type { ReactNode } from "react";
import { AlertTriangle, Check, ImageIcon, Info } from "lucide-react";

export function PaperLead({ children }: { children: ReactNode }) {
    return <div className="space-y-5 text-base leading-8 text-white/65 sm:text-lg">{children}</div>;
}

export function PaperSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="space-y-5">
            <h2 className="border-b border-white/5 pb-3 text-2xl font-light tracking-tight text-white">
                {title}
            </h2>
            {children}
        </section>
    );
}

export function PaperSubsection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium tracking-tight text-white/85">{title}</h3>
            {children}
        </div>
    );
}

export function PaperMetrics({
    metrics,
}: {
    metrics: ReadonlyArray<readonly [string, string]>;
}) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {metrics.map(([value, label]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xl font-light text-white sm:text-2xl">{value}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-white/35">{label}</div>
                </div>
            ))}
        </div>
    );
}

export function ScreenshotPlaceholder({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 text-center">
            <ImageIcon className="size-6 text-white/20" />
            <p className="max-w-2xl text-sm leading-relaxed text-white/35">[Insert screenshot: {children}]</p>
        </div>
    );
}

export function PaperCallout({
    tone = "info",
    children,
}: {
    tone?: "info" | "warning";
    children: ReactNode;
}) {
    const warning = tone === "warning";
    const Icon = warning ? AlertTriangle : Info;
    return (
        <div className={`flex gap-3 rounded-xl border p-5 ${warning ? "border-amber-200/10 bg-amber-200/[0.03]" : "border-sky-200/10 bg-sky-200/[0.03]"}`}>
            <Icon className={`mt-1 size-4 shrink-0 ${warning ? "text-amber-200/50" : "text-sky-200/50"}`} />
            <div className="text-sm leading-7 text-white/50">{children}</div>
        </div>
    );
}

export function StatusList({ children }: { children: ReactNode }) {
    return <ul className="space-y-2">{children}</ul>;
}

export function StatusItem({ children }: { children: ReactNode }) {
    return (
        <li className="flex gap-3 text-sm leading-7 text-white/60">
            <Check className="mt-1.5 size-4 shrink-0 text-emerald-300/70" />
            <span>{children}</span>
        </li>
    );
}

export function PaperTable({ children }: { children: ReactNode }) {
    return <div className="overflow-x-auto rounded-xl border border-white/10">{children}</div>;
}

export const bodyCopy = "text-base leading-8 text-white/60";
