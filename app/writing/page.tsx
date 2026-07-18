import ContentPanel from "@/components/panels/ContentPanel";
import { PenLine } from "lucide-react";

export default function Writing() {
    return (
        <div className="flex flex-col gap-8 pb-20">
            <h1 className="text-3xl font-light tracking-tight text-white/90 mb-2">Writing</h1>
            <ContentPanel className="flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                    <PenLine className="size-5 text-white/50" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-medium text-white/90">Coming soon</h2>
                    <p className="text-sm text-white/50">New writing will appear here.</p>
                </div>
            </ContentPanel>
        </div>
    );
}
