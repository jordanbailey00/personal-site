import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import LearningSubjectDetail from "@/components/learning/LearningSubjectDetail";
import { learningData } from "@/content/learning";
import { getSubjectById } from "@/lib/learning";

type LearningSubjectPageProps = {
    params: Promise<{ subject: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
    return learningData.map(({ id }) => ({ subject: id }));
}

export default async function LearningSubjectPage({ params }: LearningSubjectPageProps) {
    const { subject: id } = await params;
    const subject = await getSubjectById(id);

    if (!subject) notFound();

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-20">
            <Link href="/learning" className="inline-flex w-fit items-center gap-2 text-xs text-white/40 transition-colors hover:text-white">
                <ArrowLeft className="size-4" />
                Back to Learning Recs
            </Link>
            <LearningSubjectDetail subject={subject} />
        </div>
    );
}
