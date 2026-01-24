import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { User, Settings, LogOut, ChevronDown, Sparkles, Share2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

interface UserDropdownProps {
    user: any;
    userData?: any;
}

const UserDropdown = ({ user, userData }: UserDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const displayName = userData?.fullName || user?.displayName || user?.email?.split("@")[0] || "User";
    const avatarUrl = userData?.avatarUrl || user?.photoURL;

    const toggleDropdown = () => setIsOpen(!isOpen);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Profile Trigger */}
            <motion.button
                onClick={toggleDropdown}
                className="flex items-center gap-2.5 p-1.5 pr-4 glass-noire border border-border/30 rounded-full hover:border-primary/50 transition-all duration-300"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
            >
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-primary/20 bg-muted/50">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-purple-500/10">
                            <User className="w-4 h-4 text-primary" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                </div>

                <div className="hidden lg:flex flex-col items-start leading-none gap-0.5">
                    <span className="text-xs font-display font-bold text-foreground truncate max-w-[100px]">
                        {displayName}
                    </span>
                    <span className="text-[10px] text-primary/70 uppercase tracking-widest font-bold">
                        PRO
                    </span>
                </div>

                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="absolute top-full right-0 mt-3 w-64 glass-noire rounded-2xl border border-border/30 shadow-2xl overflow-hidden z-[60]"
                    >
                        {/* Header / Profile Info */}
                        <div className="p-5 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 border-b border-border/20">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-primary/30 rotate-3">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover -rotate-3" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-muted -rotate-3">
                                            <User className="w-6 h-6 text-primary" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-sm font-display font-bold text-foreground">{displayName}</h4>
                                    <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                                <Sparkles className="w-3.5 h-3.5 text-primary" />
                                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Premium Member</span>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                            {[
                                { label: "Refer", icon: Share2, action: () => navigate("/refer") },
                                { label: "Settings", icon: Settings, action: () => navigate("/settings") },
                            ].map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => {
                                        item.action();
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/5 group transition-colors duration-200"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-200">
                                        <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                    </div>
                                    <span className="text-sm font-body text-muted-foreground group-hover:text-foreground">
                                        {item.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Footer / Logout */}
                        <div className="p-2 bg-muted/20 border-t border-border/20">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 group transition-colors duration-200"
                            >
                                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-red-500/10 group-hover:scale-110 transition-all duration-200">
                                    <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-red-500" />
                                </div>
                                <span className="text-sm font-body text-muted-foreground group-hover:text-foreground">
                                    Logout
                                </span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserDropdown;
