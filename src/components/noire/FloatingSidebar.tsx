import { motion, AnimatePresence } from "framer-motion";
import {
    Home,
    Compass,
    Music2,
    Library,
    Heart,
    Settings,
    Plus,
    PanelLeft,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * NOIRE Premium Sidebar - Matches the provided visual layout exactly
 */

interface SidebarProps {
    onToggle?: (collapsed: boolean) => void;
}

const FloatingSidebar = ({ onToggle }: SidebarProps) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { icon: Home, label: "Home", path: "/" },
        { icon: Compass, label: "Discovery", path: "/discovery" },
        { icon: Music2, label: "Moods", path: "/moods" },
        { icon: Library, label: "Library", path: "/library" },
        { icon: Heart, label: "Favourites", path: "/favourites" },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <motion.aside
            initial={{ x: -100, opacity: 0 }}
            animate={{
                x: 0,
                opacity: 1,
                width: isCollapsed ? "80px" : "260px"
            }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-6 top-24 z-[40] hidden lg:flex flex-col gap-4"
        >
            {/* Main Navigation Container */}
            <div className="bg-[#0D0D0D]/90 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-3 flex flex-col gap-1 shadow-2xl relative overflow-hidden">

                {/* Header: NAVIGATION */}
                <div className="flex items-center gap-3 px-4 py-4 mb-2">
                    <div className="p-2 bg-white/5 rounded-xl text-muted-foreground">
                        <PanelLeft size={18} />
                    </div>
                    {!isCollapsed && (
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Navigation</span>
                    )}
                </div>

                {/* Menu Items */}
                <div className="flex flex-col gap-1">
                    {menuItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <motion.button
                                key={item.label}
                                whileHover={{ x: isCollapsed ? 0 : 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate(item.path)}
                                className={`flex items-center gap-4 px-4 py-3.5 rounded-[1.5rem] transition-all relative group ${active
                                    ? "bg-[#FBBF24] text-black shadow-[0_0_20px_rgba(251,191,36,0.4)]"
                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <item.icon size={20} className="flex-shrink-0" />

                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="text-sm font-bold tracking-tight"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>

                                {active && (
                                    <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full shadow-[0_0_10px_white]" />
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Separator */}
                <div className="h-px bg-white/5 my-4 mx-4" />

                {/* Settings */}
                <motion.button
                    whileHover={{ x: isCollapsed ? 0 : 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/settings")}
                    className="flex items-center gap-4 px-4 py-3.5 rounded-[1.5rem] text-muted-foreground hover:text-white hover:bg-white/5 transition-all mb-2"
                >
                    <Settings size={20} className="flex-shrink-0" />
                    {!isCollapsed && (
                        <span className="text-sm font-bold tracking-tight">Settings</span>
                    )}
                </motion.button>
            </div>

            {/* Create Action Container */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-[#0D0D0D]/90 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-3 shadow-2xl"
            >
                <button
                    className={`w-full py-4 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all bg-[#1A1A1A] hover:bg-[#252525] text-[#FBBF24] border border-white/5 group shadow-inner`}
                >
                    <div className="p-1.5 bg-[#FBBF24]/10 rounded-lg group-hover:scale-110 transition-transform">
                        <Plus size={18} />
                    </div>
                    {!isCollapsed && (
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Create</span>
                    )}
                </button>
            </motion.div>
        </motion.aside>
    );
};

export default FloatingSidebar;
