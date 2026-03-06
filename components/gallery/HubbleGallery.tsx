"use client";

import { useState } from "react";
import Image from "next/image";
import { NASAImageItem } from "@/types/nasa";
import { motion, AnimatePresence } from "motion/react";
import { X, Info, Calendar, MapPin, Tag } from "lucide-react";
import ContentPanel from "@/components/panels/ContentPanel";

interface HubbleGalleryProps {
    initialItems: NASAImageItem[];
}

export default function HubbleGallery({ initialItems }: HubbleGalleryProps) {
    const [selectedItem, setSelectedItem] = useState<NASAImageItem | null>(null);

    return (
        <div className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
                {initialItems.map((item) => (
                    <motion.div
                        key={item.id}
                        layoutId={`card-${item.id}`}
                        onClick={() => setSelectedItem(item)}
                        className="group relative flex flex-col gap-3 rounded-xl border border-white/5 bg-black/20 p-2 transition-all hover:bg-black/40 hover:border-white/10 cursor-pointer overflow-hidden"
                    >
                        {/* Hover Overlay - Quick Info */}
                        <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                            <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                <h4 className="text-sm font-medium text-white line-clamp-1">{item.title}</h4>
                                <p className="text-xs text-white/70 line-clamp-2 mt-1">{item.description}</p>
                                <div className="mt-2 flex items-center gap-1 text-[10px] text-white/40 uppercase tracking-widest font-bold">
                                    <Info className="w-3 h-3" />
                                    Click for details
                                </div>
                            </div>
                        </div>

                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-white/5">
                            <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                        </div>
                        <div className="px-2 pb-2">
                            <h3 className="text-sm font-medium text-white/90 line-clamp-1">{item.title}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Expanded Detail View */}
            <AnimatePresence>
                {selectedItem && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 lg:p-12">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedItem(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />

                        {/* Modal Container */}
                        <motion.div
                            layoutId={`card-${selectedItem.id}`}
                            className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl flex flex-col lg:flex-row"
                        >
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/80 transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* Image Part */}
                            <div className="relative flex-grow h-64 sm:h-96 lg:h-auto lg:w-[65%] bg-black flex items-center justify-center">
                                <Image
                                    src={selectedItem.image}
                                    alt={selectedItem.title}
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>

                            {/* Details Sidebar */}
                            <div className="w-full lg:w-[35%] p-6 sm:p-8 overflow-y-auto bg-neutral-900/50 border-t lg:border-t-0 lg:border-l border-white/5 custom-scrollbar">
                                <div className="flex flex-col gap-6">
                                    <div>
                                        <h2 className="text-2xl font-light text-white leading-tight">
                                            {selectedItem.title}
                                        </h2>
                                        <div className="h-px w-12 bg-white/20 my-4" />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="text-sm text-white/60 leading-relaxed font-light">
                                            {selectedItem.description}
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 pt-4">
                                            {selectedItem.date && (
                                                <div className="flex items-center gap-3">
                                                    <Calendar className="w-4 h-4 text-white/20" />
                                                    <span className="text-xs text-white/40 uppercase tracking-wider">{new Date(selectedItem.date).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                            {selectedItem.center && (
                                                <div className="flex items-center gap-3">
                                                    <MapPin className="w-4 h-4 text-white/20" />
                                                    <span className="text-xs text-white/40 uppercase tracking-wider">{selectedItem.center}</span>
                                                </div>
                                            )}
                                            {selectedItem.id && (
                                                <div className="flex items-center gap-3">
                                                    <Tag className="w-4 h-4 text-white/20" />
                                                    <span className="text-xs text-white/40 uppercase tracking-wider">NASA ID: {selectedItem.id}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {selectedItem.keywords && selectedItem.keywords.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-4">
                                            {selectedItem.keywords.slice(0, 10).map((kw, i) => (
                                                <span key={i} className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] text-white/40 font-medium">
                                                    {kw}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
