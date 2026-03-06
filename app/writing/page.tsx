import WritingFeed from "@/components/writing/WritingFeed";
import { getWritings } from "@/lib/writings";

export default async function Writing() {
    const posts = await getWritings();

    return (
        <div className="flex flex-col gap-8 pb-20">
            <h1 className="text-3xl font-light tracking-tight text-white/90 mb-2">Writing</h1>
            <WritingFeed posts={posts} />
        </div>
    );
}
