import Image from "next/image";
import { hubbleData } from "@/content/hubble";

export default function HubbleGallery() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6">
            {hubbleData.map((item) => (
                <div
                    key={item.id}
                    className="group relative flex flex-col gap-3 rounded-xl border border-white/5 bg-black/20 p-2 transition-all hover:bg-black/40 hover:border-white/10"
                >
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-white/5">
                        <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, 50vw"
                        />
                    </div>
                    <div className="px-2 pb-2">
                        <h3 className="text-sm font-medium text-white/90">{item.title}</h3>
                        <p className="mt-1 text-xs text-white/50 leading-relaxed">
                            {item.description}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
