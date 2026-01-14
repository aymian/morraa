import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X } from "lucide-react";
import { useState } from "react";
import NoireLogo from "./NoireLogo";

/**
 * NOIRE Navbar - Minimal, floating, cinematic
 * Desktop: Centered floating navigation with glassmorphism and auth buttons
 * Mobile: Clean top navbar with slide-in menu
 */

interface NavbarProps {
  onAuthClick?: (action: "login" | "signup") => void;
}

const Navbar = ({ onAuthClick }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: "Moods", href: "#moods" },
    { label: "Experience", href: "#sound" },
    { label: "Artists", href: "#afrobeat" },
  ];

  const handleAuthClick = (action: "login" | "signup") => {
    if (onAuthClick) {
      onAuthClick(action);
    } else {
      // Default behavior - redirect to login with action parameter
      window.location.href = `/login?action=${action}`;
    }
  };

  return (
    <>
      {/* Desktop Navbar - Floating centered */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 hidden md:flex"
      >
        <div className="glass-noire rounded-full px-3 py-2 flex items-center gap-2 border border-border/30">
          {/* Logo */}
          <a href="#" className="px-2">
            <NoireLogo size={28} showText={true} />
          </a>

          {/* Divider */}
          <div className="w-px h-6 bg-border/50" />

          {/* Nav Links */}
          {navItems.map((item, index) => (
            <motion.a
              key={item.label}
              href={item.href}
              className="px-4 py-2 text-sm font-body text-muted-foreground hover:text-foreground transition-colors duration-300 rounded-full hover:bg-muted/30"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
              whileHover={{ y: -2 }}
            >
              {item.label}
            </motion.a>
          ))}

          {/* Divider */}
          <div className="w-px h-6 bg-border/50" />

          {/* Search */}
          <motion.button
            className="p-2.5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/30"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Search className="w-4 h-4" />
          </motion.button>

          {/* Auth Buttons */}
          <motion.button
            onClick={() => handleAuthClick("login")}
            className="px-4 py-2 text-sm font-body text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/30"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.95 }}
          >
            Sign in
          </motion.button>

          <motion.button
            onClick={() => handleAuthClick("signup")}
            className="px-5 py-2 text-sm font-body font-medium bg-primary text-primary-foreground rounded-full"
            whileHover={{ scale: 1.02, boxShadow: "0 0 25px -5px hsl(38 90% 60% / 0.5)" }}
            whileTap={{ scale: 0.98 }}
          >
            Get Started
          </motion.button>
        </div>
      </motion.nav>

      {/* Mobile Top Navbar */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 md:hidden"
      >
        <div className="glass-noire px-4 py-3 flex items-center justify-between border-b border-border/20">
          <a href="#">
            <NoireLogo size={26} showText={true} />
          </a>

          <motion.button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-foreground rounded-full hover:bg-muted/30"
            whileTap={{ scale: 0.9 }}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-background/98 backdrop-blur-xl z-40"
              onClick={() => setIsMenuOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center justify-center h-full gap-6 pt-16"
                onClick={(e) => e.stopPropagation()}
              >
                {navItems.map((item, index) => (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    className="font-display text-3xl text-foreground hover:text-primary transition-colors"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.4 }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </motion.a>
                ))}

                {/* Mobile Auth Buttons */}
                <div className="flex flex-col gap-3 mt-8 w-64">
                  <motion.button
                    onClick={() => handleAuthClick("login")}
                    className="w-full px-6 py-3 text-base font-body text-foreground border border-border/50 rounded-full hover:bg-muted/30 transition-colors"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Sign in
                  </motion.button>
                  <motion.button
                    onClick={() => handleAuthClick("signup")}
                    className="w-full px-6 py-3 text-base font-body font-medium bg-primary text-primary-foreground rounded-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Get Started
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
};

export default Navbar;
