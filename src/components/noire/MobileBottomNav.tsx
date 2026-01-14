import { motion } from "framer-motion";
import { Disc3, User, LogIn } from "lucide-react";

/**
 * NOIRE Mobile Bottom Navigation
 * Simplified for landing page with auth focus
 * All actions redirect to login
 */

interface MobileBottomNavProps {
  onAuthClick?: (action: "login" | "signup") => void;
}

const MobileBottomNav = ({ onAuthClick }: MobileBottomNavProps) => {
  const handleAuthClick = (action: "login" | "signup") => {
    if (onAuthClick) {
      onAuthClick(action);
    } else {
      window.location.href = `/login?action=${action}`;
    }
  };

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe"
    >
      {/* Gradient fade at top */}
      <div className="absolute -top-10 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      <div className="glass-noire mx-4 mb-4 rounded-2xl px-4 py-3 border border-border/20">
        <div className="flex items-center justify-between gap-2">
          {/* Try Free - Leads to signup */}
          <motion.button
            onClick={() => handleAuthClick("signup")}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-body font-medium text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Disc3 className="w-4 h-4" />
            <span>Try Free</span>
          </motion.button>

          {/* Sign In */}
          <motion.button
            onClick={() => handleAuthClick("login")}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border/50 text-foreground font-body text-sm"
            whileHover={{ scale: 1.02, backgroundColor: "hsl(var(--muted) / 0.3)" }}
            whileTap={{ scale: 0.98 }}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </motion.button>

          {/* Account - Leads to login */}
          <motion.button
            onClick={() => handleAuthClick("login")}
            className="flex items-center justify-center p-3 rounded-xl border border-border/50 text-muted-foreground"
            whileHover={{ scale: 1.05, color: "hsl(var(--foreground))" }}
            whileTap={{ scale: 0.95 }}
          >
            <User className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
};

export default MobileBottomNav;
