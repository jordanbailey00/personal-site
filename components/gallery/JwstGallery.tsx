"use client";

import { useState } from "react";
import Image from "next/image";
import { JwstImage } from "@/types/jwst";
import { motion, AnimatePresence } from "motion/react";
import { X, Info, Database, Cpu, Activity, ExternalLink } from "lucide-react";

interface JwstGalleryProps {
    initialItems: JwstImage[];
}

export default function JwstGallery({ initialItems }: JwstGalleryProps) {
    const [selectedItem, setSelectedItem] = useState<JwstImage | null>(null);

    return (
        <section className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-sm font-medium uppercase tracking-widest text-white/40">
                    James Webb Space Telescope
                </h2>
                <p className="text-[10px] text-white/20 uppercase tracking-widest">
                    Scientific Data Products (_i2d)
                </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {initialItems.map((item) => (
                    <motion.div
                        key={item.id}
                        layoutId={`jwst-${item.id}`}
                        onClick={() => setSelectedItem(item)}
                        className="group relative flex flex-col gap-3 rounded-xl border border-white/5 bg-black/20 p-2 transition-all hover:bg-black/40 hover:border-white/10 cursor-pointer overflow-hidden"
                    >
                        <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                            <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Product ID</h4>
                                <h4 className="text-xs font-medium text-white truncate">{item.id}</h4>
                                <div className="mt-3 flex items-center gap-1 text-[10px] text-white/40 uppercase tracking-widest font-bold">
                                    <Info className="w-3 h-3" />
                                    View Scientific Metadata
                                </div>
                            </div>
                        </div>

                        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white/5">
                            <Image
                                src={item.thumbnailUrl}
                                alt={item.id}
                                fill
                                className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                        </div>
                        <div className="px-2 pb-1 flex justify-between items-center">
                            <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">
                                {item.instruments.join(" / ")}
                            </span>
                            <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">
                                PRG: {item.program}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="text-[9px] text-white/10 uppercase tracking-[0.2em] leading-relaxed max-w-2xl">
                JWST data/products sourced from the JWST API, using observations from the NASA/ESA/CSA James Webb Space Telescope and MAST/STScI. 
                This project uses a third-party JWST API and is not affiliated with NASA, ESA, CSA, STScI, or MAST.
            </div>

            <AnimatePresence>
                {selectedItem && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 lg:p-12">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedItem(null)}
                            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
                        />

                        <motion.div
                            layoutId={`jwst-${selectedItem.id}`}
                            className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl flex flex-col lg:flex-row"
                        >
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/80 transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="relative flex-grow h-64 sm:h-96 lg:h-auto lg:w-[60%] bg-black flex items-center justify-center">
                                <Image
                                    src={selectedItem.imageUrl}
                                    alt={selectedItem.id}
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>

                            <div className="w-full lg:w-[40%] p-6 sm:p-10 overflow-y-auto bg-neutral-900/30 border-t lg:border-t-0 lg:border-l border-white/5 custom-scrollbar">
                                <div className="flex flex-col gap-8">
                                    <div>
                                        <div className="text-[10px] text-white/30 uppercase tracking-[0.3em] mb-2 font-bold">Product identifier</div>
                                        <h2 className="text-lg font-mono text-white leading-tight break-all">
                                            {selectedItem.id}
                                        </h2>
                                        <div className="h-px w-12 bg-white/10 my-6" />
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest font-bold">
                                                <Database className="w-3 h-3" />
                                                Observation ID
                                            </div>
                                            <div className="text-sm font-mono text-white/80">{selectedItem.observationId || "N/A"}</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest font-bold">
                                                    <Activity className="w-3 h-3" />
                                                    Program
                                                </div>
                                                <div className="text-sm font-mono text-white/80">{selectedItem.program || "N/A"}</div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest font-bold">
                                                    <Cpu className="w-3 h-3" />
                                                    Instruments
                                                </div>
                                                <div className="text-sm font-mono text-white/80">{selectedItem.instruments.join(", ")}</div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Data Product Type</div>
                                            <div className="text-sm text-white/70 font-light leading-relaxed">
                                                <span className="font-mono text-white mr-2">{selectedItem.suffix}</span>
                                                {selectedItem.productDescription}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5 flex flex-col gap-4">
                                        <a
                                            href={selectedItem.sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-white/5 border border-white/10 text-[10px] text-white/60 uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all font-bold"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            Source Observation File
                                        </a>
                                    </div>

                                    <div className="text-[9px] text-white/10 uppercase tracking-widest italic">
                                        Data sourced from MAST/STScI via the JWST API.
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
}
