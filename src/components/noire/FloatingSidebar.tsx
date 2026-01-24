import { motion, AnimatePresence } from "framer-motion";
import {
    Home,
    Compass,
    Plus,
    MessageCircle,
    User as UserIcon,
    MoreHorizontal,
    Bell,
    Bookmark,
    Wallet,
    ShieldCheck,
    Settings,
    PanelLeft,
    HandCoins,
    LogOut,
    Sparkles,
    ArrowRight,
    ChevronLeft,
    CheckCircle
} from "lucide-react";


import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot, collection, query, where } from "firebase/firestore";

/**
 * MORRA Core Navigation Strategy - Creator Tier
 */

type FloatingSidebarProps = {
    forceCollapsed?: boolean;
};

const FloatingSidebar = ({ forceCollapsed = false }: FloatingSidebarProps) => {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('morraa-sidebar-collapsed') === 'true';
    });
    const [showMore, setShowMore] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();

    // Sync state with local storage and events
    useEffect(() => {
        const handleToggle = () => {
            if (forceCollapsed) {
                localStorage.setItem('morraa-sidebar-collapsed', 'true');
                setIsCollapsed(true);
                document.body.classList.add('sidebar-collapsed');
                return;
            }
            const storedState = localStorage.getItem('morraa-sidebar-collapsed') === 'true';
            setIsCollapsed(storedState);
            if (storedState) {
                document.body.classList.add('sidebar-collapsed');
            } else {
                document.body.classList.remove('sidebar-collapsed');
            }
        };

        handleToggle();
        window.addEventListener('morraa:toggleSidebar', handleToggle);
        return () => window.removeEventListener('morraa:toggleSidebar', handleToggle);
    }, [forceCollapsed]);

    const toggleSidebar = () => {
        if (forceCollapsed) return;
        const newState = !isCollapsed;
        localStorage.setItem('morraa-sidebar-collapsed', String(newState));
        window.dispatchEvent(new Event('morraa:toggleSidebar'));
    };


    // Dynamically update the global sidebar width for the content-shift utility
    useEffect(() => {
        const root = document.documentElement;
        if (isCollapsed) {
            root.style.setProperty('--sidebar-width', '120px');
        } else {
            root.style.setProperty('--sidebar-width', '320px');
        }
    }, [isCollapsed]);

    // Auto-collapse on /messages route
    useEffect(() => {
        if (location.pathname.startsWith('/messages')) {
            setIsCollapsed(true);
        }
    }, [location.pathname]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Real-time user data sync
                const unsubDoc = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
                    if (docSnap.exists()) setUserData(docSnap.data());
                });
                return () => unsubDoc();
            } else {
                setUserData(null);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // Listen for unread messages
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "conversations"),
            where("participants", "array-contains", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let total = 0;
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.unreadCounts && data.unreadCounts[user.uid]) {
                    total += data.unreadCounts[user.uid];
                }
            });
            setUnreadCount(total);
        });

        return () => unsubscribe();
    }, [user]);

    const primaryItems = [
        { icon: Home, label: "Home", path: "/" },
        { icon: Compass, label: "Explore", path: "/moods" },
        { icon: MessageCircle, label: "Messages", path: "/messages", hasNotification: unreadCount > 0 },
        { icon: UserIcon, label: "Profile", path: "/profile", isVerified: userData?.isVerified },
    ];

    const secondaryItems = [
        { icon: Bell, label: "Activity", path: "/notifications" },
        { icon: Bookmark, label: "Collection", path: "/saved" },
        { icon: Wallet, label: "Vault", path: "/wallet", hasDot: true },
        { icon: ShieldCheck, label: "Verification", path: "/verification" },
        { icon: Sparkles, label: "Feed Preview", path: "/feed-preview" },
        { icon: Settings, label: "Settings", path: "/settings" },
    ];

    const isActive = (path: string) => location.pathname === path;

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <motion.aside
            initial={{ x: -100, opacity: 0 }}
            animate={{
                x: 0,
                opacity: 1,
                width: isCollapsed ? "84px" : "280px"
            }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-6 top-20 bottom-4 z-[40] hidden lg:flex flex-col gap-3"
        >
            {/* Main Navigation Container */}
            <div className="flex-1 bg-[#0D0D0D]/80 backdrop-blur-2xl rounded-[3rem] border border-white/5 p-3 flex flex-col gap-1 shadow-2xl relative">
                {/* Background Aura */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#FBBF24]/5 to-transparent pointer-events-none" />

                {/* Header / Toggle Section */}
                <div className={`p-2 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-4'}`}>
                    {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Command</span>}
                    <motion.button
                        whileHover={{ scale: 1.1, color: "#FBBF24" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleSidebar}
                        disabled={forceCollapsed}
                        className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <PanelLeft size={isCollapsed ? 20 : 16} className={`transition-transform duration-500 ${isCollapsed ? 'rotate-180' : 'rotate-0'}`} />
                    </motion.button>
                </div>

                {/* Primary Menu Items */}
                <div className="flex flex-col gap-1">
                    {primaryItems.map((item, idx) => {
                        const active = isActive(item.path);
                        // Inject specialized Create button after the first two items
                        const showCreate = idx === 2;

                        return (
                            <div key={item.label} className="flex flex-col gap-1">
                                {showCreate && (
                                    <motion.button
                                        whileHover={{ scale: 1.02, x: 4 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => navigate('/create')}
                                        className="flex items-center gap-4 px-4 py-4 rounded-[1.8rem] bg-[#FBBF24] text-black my-2 border border-white/10 shadow-[0_10px_30px_rgba(251,191,36,0.3)] group transition-all"
                                    >
                                        <div className="relative">
                                            <Plus size={22} strokeWidth={2.5} className="flex-shrink-0" />
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="absolute inset-0 bg-white rounded-full blur-md -z-10"
                                            />
                                        </div>
                                        {!isCollapsed && <span className="text-sm font-black uppercase tracking-[0.1em]">Create</span>}
                                    </motion.button>
                                )}



                                <motion.button
                                    whileHover={{ x: isCollapsed ? 0 : 6 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate(item.path)}
                                    className={`flex items-center gap-4 px-4 py-3.5 rounded-[1.8rem] transition-all relative group w-full ${active
                                        ? "bg-white/10 text-white shadow-xl"
                                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    <div className="relative">
                                        <item.icon size={22} className={`flex-shrink-0 transition-colors ${active ? "text-[#FBBF24]" : ""}`} />
                                        {/* Unread Count Badge */}
                                        {item.label === "Messages" && unreadCount > 0 && !location.pathname.startsWith("/messages") ? (
                                            <div className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-[#0D0D0D] flex items-center justify-center px-1">
                                                <span className="text-[9px] font-bold text-white leading-none">
                                                    {unreadCount > 99 ? "99+" : unreadCount}
                                                </span>
                                            </div>
                                        ) : item.hasNotification ? (
                                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse" />
                                        ) : null}
                                    </div>
                                    {!isCollapsed && (
                                        <div className="flex flex-1 items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-bold tracking-tight ${active ? "text-white" : ""}`}>{item.label}</span>
                                                {item.isVerified && (
                                                    <div className="relative flex items-center justify-center w-[14px] h-[14px] bg-gradient-to-br from-[#4C9EEB] to-[#0866FF] rounded-full shadow-sm">
                                                        <svg viewBox="0 0 40 40" className="w-[14px] h-[14px]" fill="none">
                                                            <path d="M19.7 8.93994L17.85 10.79L13.45 15.19L11.6 17.04C10.42 18.22 10.42 20.12 11.6 21.3L17.85 27.55C19.03 28.73 20.93 28.73 22.11 27.55L28.36 21.3C29.54 20.12 29.54 18.22 28.36 17.04L22.11 10.79L19.7 8.93994C19.32 8.55994 18.69 8.55994 18.31 8.93994C17.93 9.31994 17.93 9.94994 18.31 10.33L19.98 12L12 19.98L10.33 18.31C9.95 17.93 9.32 17.93 8.94 18.31C8.56 18.69 8.56 19.32 8.94 19.7L10.79 21.55L15.19 25.95L17.04 27.8C18.22 28.98 20.12 28.98 21.3 27.8L27.55 21.55C28.73 20.37 28.73 18.47 27.55 17.29L21.3 11.04L19.7 8.93994Z" fill="white" />
                                                            <path d="M19.98 12L28.36 20.38C28.74 20.76 28.74 21.39 28.36 21.77L22.11 28.02C21.73 28.4 21.1 28.4 20.72 28.02L11.6 18.9C11.22 18.52 11.22 17.89 11.6 17.51L17.85 11.26C18.23 10.88 18.86 10.88 19.24 11.26L19.98 12Z" fill="white" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>

                                            {item.label === "Home" && (
                                                <motion.div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleSidebar();
                                                    }}
                                                    whileHover={{ scale: 1.2, color: "#FBBF24" }}
                                                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-white/20"
                                                >
                                                    <PanelLeft size={16} />
                                                </motion.div>
                                            )}
                                        </div>
                                    )}
                                    {active && (
                                        <motion.div
                                            layoutId="active-indicator"
                                            className="absolute left-0 w-1 h-6 bg-[#FBBF24] rounded-r-full shadow-[0_0_10px_rgba(251,191,36,0.8)]"
                                        />
                                    )}
                                </motion.button>
                            </div>
                        );
                    })}
                </div>

                <div className="h-px bg-white/5 my-2 mx-4" />

                {/* More / Secondary Menu Toggle */}
                <div className="relative">
                    <motion.button
                        onClick={() => setShowMore(!showMore)}
                        whileHover={{ x: isCollapsed ? 0 : 6 }}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-[1.8rem] transition-all ${showMore ? "bg-white/10 text-white shadow-xl" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
                    >
                        <MoreHorizontal size={22} className="flex-shrink-0" />
                        {!isCollapsed && (
                            <div className="flex flex-1 items-center justify-between">
                                <span className="text-sm font-bold tracking-tight">Ecosystem</span>
                                <ChevronLeft size={14} className={`transition-transform duration-300 ${showMore ? "rotate-90" : "-rotate-90"}`} />
                            </div>
                        )}
                    </motion.button>

                    <AnimatePresence>
                        {showMore && !isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full left-0 w-full bg-[#1A1A1A] border border-white/10 rounded-[2rem] p-3 mb-4 shadow-2xl z-50 overflow-hidden backdrop-blur-2xl"
                            >
                                {secondaryItems.map((item) => (
                                    <button
                                        key={item.label}
                                        onClick={() => { navigate(item.path); setShowMore(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/5 text-muted-foreground hover:text-white transition-all group mt-1 first:mt-0"
                                    >
                                        <div className="relative p-2 bg-white/5 rounded-xl group-hover:bg-[#FBBF24]/10 transition-colors">
                                            <item.icon size={16} className="group-hover:text-[#FBBF24]" />
                                            {item.hasDot && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#FBBF24] rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />}
                                        </div>
                                        <span className="text-xs font-bold">{item.label}</span>
                                    </button>
                                ))}
                                <div className="h-px bg-white/5 my-2" />
                                <button
                                    onClick={handleSignOut}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-500/10 text-red-400 transition-all font-bold text-xs"
                                >
                                    <div className="p-2 bg-red-500/5 rounded-xl">
                                        <LogOut size={16} />
                                    </div>
                                    Terminate Session
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Quick Status Bar */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={`bg-white/5 rounded-[1.8rem] group cursor-pointer hover:bg-white/[0.08] transition-all ${isCollapsed ? 'p-3.5 mx-auto w-fit' : 'p-3 flex items-center justify-between'
                        }`}
                    onClick={() => navigate('/wallet')}
                >
                    {isCollapsed ? (
                        <HandCoins size={22} className="text-[#FBBF24]" />
                    ) : (
                        <>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Influence Credit</span>
                                <div className="flex items-center gap-1.5">
                                    <HandCoins size={14} className="text-[#FBBF24]" />
                                    <span className="text-xs font-bold font-mono text-white">{userData?.earnings || "0"} points</span>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-tr from-[#FBBF24] to-transparent opacity-10" />
                                <ArrowRight size={14} className="text-[#FBBF24] opacity-40 group-hover:opacity-100 transition-opacity translate-x-[-2px] group-hover:translate-x-0 transition-transform" />
                            </div>
                        </>
                    )}
                </motion.div>
            </div>

            {/* Bottom Section: IDENTITY */}
            <div className="bg-[#0D0D0D]/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 p-2 shadow-2xl relative overflow-hidden">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => navigate('/profile')}
                    className={`flex items-center gap-3 p-2 rounded-[2rem] hover:bg-white/5 transition-all cursor-pointer group ${isCollapsed ? "justify-center" : ""}`}
                >
                    <div className="relative">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-[1.2rem] overflow-hidden border border-white/10 p-0.5 bg-gradient-to-br from-white/10 to-transparent">
                            {userData?.profileImage ? (
                                <img src={userData.profileImage} alt="Identity" className="w-full h-full object-cover rounded-[1rem]" />
                            ) : (
                                <div className="w-full h-full bg-white/5 flex items-center justify-center text-lg font-bold">
                                    {userData?.username?.[0] || user?.email?.[0] || 'M'}
                                </div>
                            )}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-4 border-black group-hover:scale-110 transition-transform" />
                    </div>

                    {!isCollapsed && (
                        <div className="flex flex-1 items-center justify-between min-w-0 pr-2">
                            <div className="flex flex-col min-w-0">
                                <h4 className="text-[13px] font-black text-white truncate leading-none">{userData?.fullName || "Aura Member"}</h4>
                                <p className="text-[9px] text-muted-foreground font-bold tracking-widest uppercase opacity-40 mt-1">@{userData?.username || "identity"}</p>
                            </div>
                            <div className="p-1.5 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                <Settings size={14} className="text-muted-foreground" />
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.aside>
    );
};

export default FloatingSidebar;
