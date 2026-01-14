import { motion } from "framer-motion";
import { Headphones, Search, User, Menu } from "lucide-react";
import { useState } from "react";

/**
 * NOIRE Navbar - Minimal, floating, cinematic
 * Desktop: Centered floating navigation with glassmorphism
 * Mobile: Hidden menu with elegant slide-in
 */
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: "Moods", href: "#moods" },
    { label: "Sound", href: "#sound" },
    { label: "Afrobeat", href: "#afrobeat" },
    { label: "Listen", href: "#listen" },
  ];

  return (
    <>
      {/* Desktop Navbar - Floating centered */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 hidden md:flex"
      >
        <div className="glass-noire rounded-full px-2 py-2 flex items-center gap-1 border border-border/30">
          {/* Logo */}
          <motion.a
            href="#"
            className="px-4 py-2 font-display text-lg tracking-wider text-foreground"
            whileHover={{ scale: 1.02 }}
          >
            NOIRE
          </motion.a>

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

          {/* Action Icons */}
          <motion.button
            className="p-3 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/30"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Search className="w-4 h-4" />
          </motion.button>

          <motion.button
            className="p-3 text-primary-foreground bg-primary rounded-full"
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px -5px hsl(38 90% 60% / 0.5)" }}
            whileTap={{ scale: 0.95 }}
          >
            <Headphones className="w-4 h-4" />
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
        <div className="glass-noire px-4 py-4 flex items-center justify-between border-b border-border/20">
          <motion.a
            href="#"
            className="font-display text-xl tracking-wider text-foreground"
            whileTap={{ scale: 0.95 }}
          >
            NOIRE
          </motion.a>

          <motion.button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-foreground"
            whileTap={{ scale: 0.9 }}
          >
            <Menu className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Mobile Menu Overlay */}
        <motion.div
          initial={false}
          animate={{
            opacity: isMenuOpen ? 1 : 0,
            pointerEvents: isMenuOpen ? "auto" : "none",
          }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-background/95 backdrop-blur-xl z-40"
          onClick={() => setIsMenuOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isMenuOpen ? 1 : 0, y: isMenuOpen ? 0 : 50 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center justify-center h-full gap-8"
            onClick={(e) => e.stopPropagation()}
          >
            {navItems.map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                className="font-display text-4xl text-foreground hover:text-primary transition-colors"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: isMenuOpen ? 1 : 0, y: isMenuOpen ? 0 : 30 }}
                transition={{ delay: 0.1 * index, duration: 0.4 }}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </motion.a>
            ))}
          </motion.div>
        </motion.div>
      </motion.nav>
    </>
  );
};

export default Navbar;
