import { motion, AnimatePresence } from "framer-motion";
import { Search, X, User, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, limit, startAt, endAt, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setSearchTerm("");
            setResults([]);
        }
    }, [isOpen]);

    // Handle Search Logic
    useEffect(() => {
        const fetchUsers = async () => {
            if (searchTerm.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                // Clean search term: remove leading @ and whitespace
                const cleanSearch = searchTerm.trim().startsWith("@")
                    ? searchTerm.trim().slice(1).toLowerCase()
                    : searchTerm.trim().toLowerCase();

                // simple prefix search for usernames
                const usersRef = collection(db, "users");

                const fetchUsernames = async () => {
                    const results: any[] = [];
                    try {
                        // 1. Lowercase search (Standard)
                        const q1 = query(
                            usersRef,
                            orderBy("username"),
                            startAt(cleanSearch),
                            endAt(cleanSearch + "\uf8ff"),
                            limit(5)
                        );
                        const snap1 = await getDocs(q1);
                        results.push(...snap1.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                        // 2. Original casing search (in case DB is mixed case)
                        if (cleanSearch !== searchTerm.trim().split('@').pop()) {
                            const originalClean = searchTerm.trim().split('@').pop() || "";
                            const q2 = query(
                                usersRef,
                                orderBy("username"),
                                startAt(originalClean),
                                endAt(originalClean + "\uf8ff"),
                                limit(5)
                            );
                            const snap2 = await getDocs(q2);
                            snap2.docs.forEach(doc => {
                                if (!results.find(r => r.id === doc.id)) {
                                    results.push({ id: doc.id, ...doc.data() });
                                }
                            });
                        }
                    } catch (e) {
                        console.error("Username search error (likely missing index):", e);
                        // Fallback: exact match
                        try {
                            const q = query(usersRef, where("username", "==", cleanSearch), limit(2));
                            const snap = await getDocs(q);
                            snap.docs.forEach(doc => {
                                if (!results.find(r => r.id === doc.id)) {
                                    results.push({ id: doc.id, ...doc.data() });
                                }
                            });
                        } catch (e2) { }
                    }
                    return results;
                };

                const fetchNames = async () => {
                    try {
                        // secondary search for full name
                        const q = query(
                            usersRef,
                            orderBy("fullName"),
                            startAt(searchTerm.trim()),
                            endAt(searchTerm.trim() + "\uf8ff"),
                            limit(5)
                        );
                        const snap = await getDocs(q);
                        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    } catch (e) {
                        console.error("FullName search error (likely missing index):", e);
                        return [];
                    }
                };

                const fetchEmails = async () => {
                    const results: any[] = [];
                    const cleanEmail = searchTerm.trim().toLowerCase();
                    try {
                        const q1 = query(
                            usersRef,
                            orderBy("email"),
                            startAt(cleanEmail),
                            endAt(cleanEmail + "\uf8ff"),
                            limit(5)
                        );
                        const snap1 = await getDocs(q1);
                        results.push(...snap1.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                    } catch (e) {
                        console.error("Email prefix search error:", e);
                    }

                    // Fallback: Exact email match (always works without complex index)
                    try {
                        const q2 = query(usersRef, where("email", "==", cleanEmail), limit(1));
                        const snap2 = await getDocs(q2);
                        snap2.docs.forEach(doc => {
                            if (!results.find(r => r.id === doc.id)) {
                                results.push({ id: doc.id, ...doc.data() });
                            }
                        });
                    } catch (e2) { }

                    return results;
                };

                const [usernameResults, nameResults, emailResults] = await Promise.all([
                    fetchUsernames(),
                    fetchNames(),
                    fetchEmails()
                ]);

                // Merge and deduplicate by ID
                const combined = [...usernameResults];
                [...nameResults, ...emailResults].forEach(user => {
                    if (!combined.find(u => u.id === user.id)) {
                        combined.push(user);
                    }
                });

                setResults(combined.slice(0, 10));
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(fetchUsers, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchTerm]);

    // Handle Global Hotkey
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 's' && !isOpen && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                e.preventDefault();
                // We need a way to trigger isOpen from here, but this component is already conditional on isOpen.
                // This logic should probably live in a parent or a hook.
            }
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleSelectUser = (username: string) => {
        onClose();
        navigate(`/@${username}`);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 sm:px-6"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        onClick={onClose}
                    />

                    {/* Search Container */}
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-[#0F0F0F] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
                    >
                        {/* Search Input Area */}
                        <div className="relative p-6 border-b border-white/5 bg-white/[0.02]">
                            <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-primary w-6 h-6" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search usernames or identities..."
                                className="w-full bg-transparent border-none outline-none pl-14 pr-10 py-2 text-xl font-display placeholder:text-white/20 text-white"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        {/* Results Area */}
                        <div className="max-h-[60vh] overflow-y-auto no-scrollbar p-4">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-4">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Scanning the Aura...</p>
                                </div>
                            ) : results.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="px-4 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-4">Identity Results</p>
                                    {results.map((user) => (
                                        <motion.button
                                            key={user.id}
                                            whileHover={{ x: 8, backgroundColor: "rgba(255,255,255,0.05)" }}
                                            onClick={() => handleSelectUser(user.username || user.id)}
                                            className="w-full flex items-center justify-between p-4 rounded-3xl transition-all group"
                                        >
                                            <div className="flex items-center gap-4 text-left">
                                                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 p-0.5 bg-gradient-to-br from-white/10 to-transparent">
                                                    {user.profileImage || user.avatarUrl || user.photoURL ? (
                                                        <img
                                                            src={user.profileImage || user.avatarUrl || user.photoURL}
                                                            alt={user.username}
                                                            className="w-full h-full object-cover rounded-[0.9rem]"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-white/5 flex items-center justify-center text-xl font-bold">
                                                            {user.username?.[0]?.toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg font-bold text-white leading-none">
                                                            {user.fullName || user.email?.split('@')[0] || "Aura Member"}
                                                        </span>
                                                        {user.isVerified && (
                                                            <div className="relative flex items-center justify-center w-[16px] h-[16px] bg-gradient-to-br from-[#4C9EEB] to-[#0866FF] rounded-full shadow-sm">
                                                                <svg viewBox="0 0 40 40" className="w-[16px] h-[16px]" fill="none">
                                                                    <path d="M19.7 8.93994L17.85 10.79L13.45 15.19L11.6 17.04C10.42 18.22 10.42 20.12 11.6 21.3L17.85 27.55C19.03 28.73 20.93 28.73 22.11 27.55L28.36 21.3C29.54 20.12 29.54 18.22 28.36 17.04L22.11 10.79L19.7 8.93994C19.32 8.55994 18.69 8.55994 18.31 8.93994C17.93 9.31994 17.93 9.94994 18.31 10.33L19.98 12L12 19.98L10.33 18.31C9.95 17.93 9.32 17.93 8.94 18.31C8.56 18.69 8.56 19.32 8.94 19.7L10.79 21.55L15.19 25.95L17.04 27.8C18.22 28.98 20.12 28.98 21.3 27.8L27.55 21.55C28.73 20.37 28.73 18.47 27.55 17.29L21.3 11.04L19.7 8.93994Z" fill="white" />
                                                                    <path d="M19.98 12L28.36 20.38C28.74 20.76 28.74 21.39 28.36 21.77L22.11 28.02C21.73 28.4 21.1 28.4 20.72 28.02L11.6 18.9C11.22 18.52 11.22 17.89 11.6 17.51L17.85 11.26C18.23 10.88 18.86 10.88 19.24 11.26L19.98 12Z" fill="white" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground font-bold tracking-widest uppercase mt-1">
                                                        {user.username ? `@${user.username}` : user.email || "Identity Verified"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-3 rounded-2xl bg-white/5 opacity-0 group-hover:opacity-100 transition-all">
                                                <ArrowRight size={18} className="text-primary" />
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            ) : searchTerm.length >= 2 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                        <X size={32} className="text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-display font-bold">Identity Not Found</h3>
                                    <p className="text-sm text-muted-foreground font-body mt-2">No users matching "@{searchTerm}" currently exist in the aura.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                        <Search size={32} className="text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground font-body max-w-xs uppercase tracking-widest font-black opacity-40">
                                        Start typing to search the Noire ecosystem
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer / Shortcuts */}
                        <div className="p-6 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <kbd className="px-2 py-1 bg-white/10 rounded-md text-[10px] font-bold">ESC</kbd>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Close</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <kbd className="px-2 py-1 bg-white/10 rounded-md text-[10px] font-bold">↵</kbd>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Live Aura Sync</span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SearchModal;
