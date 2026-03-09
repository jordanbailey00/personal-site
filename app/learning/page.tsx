import LearningRecs from "@/components/learning/LearningRecs";
import { getLearningRecs } from "@/lib/learning";

export const metadata = {
    title: "Learning Recommendations | Jordan Bailey",
    description: "My recommendations for learning more about different subjects including software, math, and engineering.",
};

export default async function LearningPage() {
    const subjects = await getLearningRecs();

    return (
        <div className="flex flex-col gap-8 pb-20">
            <div className="space-y-2">
                <h1 className="text-3xl font-light tracking-tight text-white/90">Learning Recs</h1>
                <p className="text-neutral-400 font-light max-w-2xl leading-relaxed">
                    A curated collection of resources that have shaped my understanding of software, science, and the world.
                    From deep systems dives to mathematical intuition.
                </p>
            </div>
            <LearningRecs subjects={subjects} />
        </div>
    );
}
