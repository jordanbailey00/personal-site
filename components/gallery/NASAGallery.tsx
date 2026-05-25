"use client";

import { useState } from "react";
import Image from "next/image";
import { NASAMetadata } from "@/types/nasa";
import { motion, AnimatePresence } from "motion/react";
import { X, Info, Calendar, MapPin, Tag, User, ExternalLink } from "lucide-react";

interface NASAIGalleryProps {
    title: string;
    items: NASAMetadata[];
}

type NASAAssetLookupResponse = {
    collection?: {
        items?: { href?: string }[];
    };
};

async function getBestNasaImageUrl(nasaId: string): Promise<string | null> {
    const res = await fetch("https://images-api.nasa.gov/asset/" + encodeURIComponent(nasaId));
    if (!res.ok) return null;

    const data: NASAAssetLookupResponse = await res.json();
    const urls = data.collection?.items
        ?.map((item) => item.href)
        .filter((href): href is string => Boolean(href)) ?? [];

    return (
        urls.find((url) => url.includes("~large.jpg")) ||
        urls.find((url) => url.includes("~medium.jpg")) ||
        urls.find((url) => url.endsWith(".jpg")) ||
        urls.find((url) => url.endsWith(".png")) ||
        urls[0] ||
        null
    );
}

export default function NASAGallery({ title, items }: NASAIGalleryProps) {
    const [selectedItem, setSelectedItem] = useState<NASAMetadata | null>(null);
    const [highResUrl, setHighResUrl] = useState<string | null>(null);
    const [loadingAsset, setLoadingAsset] = useState(false);

    const handleOpen = async (item: NASAMetadata) => {
        setSelectedItem(item);
        
        if (item.fullImageUrl) {
            setHighResUrl(item.fullImageUrl);
            setLoadingAsset(false);
            return;
        }

        setHighResUrl(null);
        setLoadingAsset(true);
        try {
            const url = await getBestNasaImageUrl(item.nasaId);
            setHighResUrl(url ?? item.preview);
        } catch (error) {
            console.error("Failed to fetch high-res image:", error);
        } finally {
            setLoadingAsset(false);
        }
    };

    return (
        <section className="flex flex-col gap-6">
            <h2 className="text-sm font-medium uppercase tracking-widest text-white/40">
                {title}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {items.map((item) => (
                    <motion.div
                        key={item.nasaId}
                        layoutId={`card-${item.nasaId}`}
                        onClick={() => handleOpen(item)}
                        className="group relative flex flex-col gap-3 rounded-xl border border-white/5 bg-black/20 p-2 transition-all hover:bg-black/40 hover:border-white/10 cursor-pointer overflow-hidden"
                    >
                        <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                            <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                <h4 className="text-sm font-medium text-white line-clamp-1">{item.title}</h4>
                                <div className="mt-2 flex items-center gap-1 text-[10px] text-white/40 uppercase tracking-widest font-bold">
                                    <Info className="w-3 h-3" />
                                    Details
                                </div>
                            </div>
                        </div>

                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-white/5">
                            <Image
                                src={item.preview}
                                alt={item.title}
                                fill
                                className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                        </div>
                        <div className="px-2 pb-2">
                            <h3 className="text-xs font-medium text-white/70 line-clamp-1">{item.title}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {selectedItem && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 lg:p-12">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedItem(null)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        />

                        <motion.div
                            layoutId={`card-${selectedItem.nasaId}`}
                            className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl flex flex-col lg:flex-row"
                        >
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/80 transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="relative flex-grow h-64 sm:h-96 lg:h-auto lg:w-[65%] bg-black flex items-center justify-center">
                                <Image
                                    src={highResUrl || selectedItem.preview}
                                    alt={selectedItem.title}
                                    fill
                                    className={`object-contain transition-opacity duration-500 ${loadingAsset ? 'opacity-50' : 'opacity-100'}`}
                                    priority
                                />
                                {loadingAsset && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>

                            <div className="w-full lg:w-[35%] p-6 sm:p-8 overflow-y-auto bg-neutral-900/50 border-t lg:border-t-0 lg:border-l border-white/5 custom-scrollbar">
                                <div className="flex flex-col gap-6">
                                    <div>
                                        <h2 className="text-xl font-light text-white leading-tight">
                                            {selectedItem.title}
                                        </h2>
                                        <div className="h-px w-12 bg-white/20 my-4" />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="text-sm text-white/60 leading-relaxed font-light max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                            {selectedItem.description}
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 pt-2">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="w-4 h-4 text-white/20" />
                                                <span className="text-[10px] text-white/40 uppercase tracking-widest">
                                                    {new Date(selectedItem.dateCreated).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </span>
                                            </div>
                                            
                                            {selectedItem.center && (
                                                <div className="flex items-center gap-3">
                                                    <MapPin className="w-4 h-4 text-white/20" />
                                                    <span className="text-[10px] text-white/40 uppercase tracking-widest">{selectedItem.center}</span>
                                                </div>
                                            )}

                                            {selectedItem.photographer && (
                                                <div className="flex items-center gap-3">
                                                    <User className="w-4 h-4 text-white/20" />
                                                    <span className="text-[10px] text-white/40 uppercase tracking-widest">{selectedItem.photographer}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-3">
                                                <Tag className="w-4 h-4 text-white/20" />
                                                <span className="text-[10px] text-white/40 uppercase tracking-widest">NASA ID: {selectedItem.nasaId}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5">
                                        <div className="text-[10px] text-white/20 uppercase tracking-widest mb-3">Image Credit</div>
                                        <div className="text-xs text-white/60 font-light">
                                            NASA {selectedItem.center ? `/ ${selectedItem.center}` : ""} {selectedItem.photographer ? `/ ${selectedItem.photographer}` : ""}
                                        </div>
                                    </div>

                                    {highResUrl && (
                                        <a
                                            href={highResUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/60 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all font-bold"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            View Full Resolution
                                        </a>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
}
