"use client";

import { useState, useRef, useEffect } from "react";
import { X, Upload, Database, Trash2, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AxiosError } from "axios";
import { getOrCreateSessionId } from "@/lib/sessionUtils";
import { getSessionStatus, wipeSession, ingestFile } from "@/lib/api";
import { ingestZipAction } from "@/app/actions";

interface DataManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DataManagementModal({ isOpen, onClose }: DataManagementModalProps) {
    const [activeTab, setActiveTab] = useState<"file">("file");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [isEmpty, setIsEmpty] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetStatus = () => setStatus(null);

    useEffect(() => {
        if (isOpen) {
            checkSessionStatus();
        }
    }, [isOpen]);

    const checkSessionStatus = async () => {
        try {
            const sessionId = getOrCreateSessionId();
            const data = await getSessionStatus(sessionId);
            setIsEmpty(data.isEmpty);
        } catch (err) {
            console.error("Failed to check session status:", err);
        }
    };



    const handleSampleData = async () => {
        // Placeholder
        setStatus({ type: "error", message: "Sample data not yet implemented" });
    };

    const handleWipe = async () => {
        if (!confirm("Are you sure you want to wipe all your session data? This cannot be undone.")) return;
        setLoading(true);
        resetStatus();
        try {
            const sessionId = getOrCreateSessionId();
            const data = await wipeSession(sessionId);
            setStatus({ type: "success", message: data.message });
            await checkSessionStatus();
        } catch (err: unknown) {
            const errorMessage = err instanceof AxiosError ? err.response?.data?.detail : "Database wipe failed";
            setStatus({ type: "error", message: errorMessage });
        } finally {
            setLoading(false);
        }
    };



    const handleFileIngest = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        resetStatus();
        const formData = new FormData();
        formData.append("file", file);
        formData.append("sessionId", getOrCreateSessionId());

        try {
            const sessionId = getOrCreateSessionId();

            if (file.name.toLowerCase().endsWith(".zip")) {
                const res = await ingestZipAction(formData);
                setStatus({ type: "success", message: res.message });
            } else {
                const data = await ingestFile(file, sessionId);
                setStatus({ type: "success", message: data.message });
            }

            if (fileInputRef.current) fileInputRef.current.value = "";
            await checkSessionStatus();
        } catch (err: unknown) {
            const errorMessage = err instanceof AxiosError
                ? err.response?.data?.detail
                : (err instanceof Error ? err.message : "File ingestion failed");
            setStatus({ type: "error", message: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="w-full max-w-2xl glass-card overflow-hidden shadow-2xl border border-white/10"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                <Database className="text-indigo-400" size={20} />
                            </div>
                            <div>
                                <h2 className="font-semibold text-xl">Data Management</h2>
                                <p className="text-xs text-gray-500">Session-Isolated Storage</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Session Status Banner */}
                    {isEmpty && (
                        <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <AlertCircle className="text-amber-400" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-amber-300">Session Directory Empty</p>
                                    <p className="text-xs text-amber-400/70">No candidate data found in your session.</p>
                                </div>
                            </div>
                            <button
                                onClick={handleSampleData}
                                disabled={loading}
                                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-semibold text-sm transition-all disabled:opacity-50 flex items-center space-x-2"
                            >
                                <Sparkles size={16} />
                                <span>Load Sample Data</span>
                            </button>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex border-b border-white/5 bg-white/2">
                        {[
                            { id: "file", label: "File Upload", icon: Upload },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as "file")}
                                className={`flex-1 py-4 flex items-center justify-center space-x-2 text-sm font-medium transition-all ${activeTab === tab.id ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5" : "text-gray-500 hover:text-gray-300"
                                    }`}
                            >
                                <tab.icon size={16} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="p-8 min-h-[300px] flex flex-col">
                        <AnimatePresence mode="wait">




                            {activeTab === "file" && (
                                <motion.div
                                    key="file"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="space-y-6"
                                >
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Upload className="text-indigo-400" size={32} />
                                        </div>
                                        <p className="text-lg font-medium mb-1">Click to Upload CV or Archive</p>
                                        <p className="text-sm text-gray-500">Supports .PDF, .TXT and .ZIP files</p>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept=".pdf,.txt,.zip"
                                            onChange={handleFileIngest}
                                        />
                                    </div>
                                    {loading && activeTab === "file" && (
                                        <div className="flex items-center justify-center space-x-3 text-indigo-400">
                                            <Loader2 className="animate-spin" size={20} />
                                            <span className="font-medium">Uploading and processing file...</span>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Status Message */}
                        <AnimatePresence>
                            {status && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className={`mt-6 p-4 rounded-xl flex items-center space-x-3 ${status.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                                        }`}
                                >
                                    {status.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                    <span className="text-sm font-medium">{status.message}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-white/5 bg-white/2 flex items-center justify-between">
                        <button
                            onClick={handleWipe}
                            disabled={loading}
                            className="px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 flex items-center space-x-2 transition-colors disabled:opacity-50"
                        >
                            <Trash2 size={16} />
                            <span className="text-sm font-medium">Wipe Session Data</span>
                        </button>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Session-Isolated v2.0</p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
