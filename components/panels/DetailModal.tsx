"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

interface DetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    layoutId?: string;
    children: ReactNode;
}

export default function DetailModal({ isOpen, onClose, layoutId, children }: DetailModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 lg:p-12">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <motion.div
                        layoutId={layoutId}
                        className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl flex flex-col lg:flex-row"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-[110] p-2 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/80 transition-all border border-white/10"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
