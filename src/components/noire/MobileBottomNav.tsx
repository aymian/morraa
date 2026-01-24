import { motion } from "framer-motion";
import { Home, Search, Plus, Play, User, Sparkles, LogIn, MessageSquare, Info, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * MORRA Mobile Bottom Navigation
 * Premium UI for both authenticated and unauthenticated users
 */

interface MobileBottomNavProps {
  onAuthClick?: (action: "login" | "signup") => void;
}

const MobileBottomNav = ({ onAuthClick }: MobileBottomNavProps) => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleAuthClick = (action: "login" | "signup") => {
    if (onAuthClick) {
      onAuthClick(action);
    } else {
      window.location.href = `/login?action=${action}`;
    }
  };

  const isActive = (path: string) => location.pathname === path;

  // Authenticated User Navigation (Instagram-like but better)
  const authNavItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Search", path: "/library" },
    { icon: Plus, label: "Create", path: "/create", isAction: true },
    { icon: Wallet, label: "Wallet", path: "/wallet" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  // Guest Navigation
  const guestNavItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Info, label: "About", path: "/about" },
    { icon: MessageSquare, label: "Contact", path: "/contact" },
  ];

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-0 left-0 right-0 z-[60] md:hidden pb-2 pt-2 px-4 pointer-events-none"
    >
      <div className="pointer-events-auto glass-noire rounded-[2.5rem] px-6 py-4 border border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex items-center justify-between backdrop-blur-2xl bg-[#0A0A0A]/90">
        
        {user ? (
          // Authenticated State
          authNavItems.map((item) => {
            const active = isActive(item.path);
            
            if (item.isAction) {
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="relative group -mt-6"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#FBBF24] to-[#d97706] flex items-center justify-center shadow-[0_8px_20px_rgba(251,191,36,0.4)] border-[3px] border-black transition-transform duration-300 group-active:scale-90">
                    <Plus className="w-7 h-7 text-black stroke-[3]" />
                  </div>
                </button>
              );
            }

            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center justify-center w-10 h-10 transition-all duration-300"
              >
                {active && (
                  <motion.div
                    layoutId="mobile-nav-dot"
                    className="absolute -bottom-2 w-1 h-1 bg-[#FBBF24] rounded-full shadow-[0_0_10px_#FBBF24]"
                  />
                )}
                <item.icon
                  className={`w-6 h-6 transition-all duration-300 ${
                    active 
                      ? "text-[#FBBF24] fill-[#FBBF24]/10 stroke-[2.5]" 
                      : "text-zinc-500 stroke-[1.5]"
                  }`}
                />
              </button>
            );
          })
        ) : (
          // Guest State
          <>
            <div className="flex items-center gap-6">
              {guestNavItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    className="relative flex flex-col items-center justify-center transition-all duration-300"
                  >
                    <item.icon
                      className={`w-6 h-6 transition-all duration-300 ${
                        active ? "text-[#FBBF24]" : "text-zinc-500"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="w-px h-8 bg-white/10 mx-2" />

            <div className="flex items-center gap-3">
               <motion.button
                onClick={() => handleAuthClick("signup")}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#FBBF24] text-black rounded-xl font-bold text-xs shadow-glow-gold"
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Join</span>
              </motion.button>
              
              <motion.button
                onClick={() => handleAuthClick("login")}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-white"
                whileTap={{ scale: 0.95 }}
              >
                <LogIn className="w-4 h-4" />
              </motion.button>
            </div>
          </>
        )}
      </div>
    </motion.nav>
  );
};

export default MobileBottomNav;
