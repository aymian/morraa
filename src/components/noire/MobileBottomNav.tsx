import { motion } from "framer-motion";
import { Home, Info, MessageSquare, UserPlus, LogIn, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * MORRA Mobile Bottom Navigation
 * Premium UI for unauthenticated users
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

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Info, label: "About", path: "/about" },
    { icon: MessageSquare, label: "Contact", path: "/contact" },
  ];

  if (user) return null; // We are building this specifically for unauthenticated as requested

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-6 inset-x-0 mx-auto z-50 md:hidden w-[90%] max-w-sm"
    >
      <div className="glass-noire rounded-[2rem] px-4 py-3 border border-white/10 shadow-2xl flex items-center justify-between gap-2">
        {/* Navigation Links */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 group"
              >
                {active && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute inset-0 bg-primary/20 rounded-2xl -z-10 border border-primary/30"
                  />
                )}
                <item.icon
                  className={`w-5 h-5 transition-all duration-300 ${active ? "text-primary scale-110" : "text-muted-foreground group-active:scale-90"
                    }`}
                />
              </button>
            );
          })}
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-white/10 mx-1" />

        {/* Primary Action */}
        <div className="flex items-center gap-2 flex-1">
          <motion.button
            onClick={() => handleAuthClick("signup")}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-2xl font-body font-bold text-xs shadow-glow-gold overflow-hidden relative group"
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Join Morra</span>
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </motion.button>

          <motion.button
            onClick={() => handleAuthClick("login")}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-muted/30 border border-white/5 text-foreground transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <LogIn className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
};

export default MobileBottomNav;
