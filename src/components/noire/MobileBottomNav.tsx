import { motion } from "framer-motion";
import { Home, Heart, Disc3, User } from "lucide-react";
import { useState } from "react";

/**
 * NOIRE Mobile Bottom Navigation
 * Unique curved design with liquid morphing active indicator
 * Emotional, not utilitarian
 */
const MobileBottomNav = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const navItems = [
    { icon: Home, label: "Home" },
    { icon: Heart, label: "Moods" },
    { icon: Disc3, label: "Play" },
    { icon: User, label: "You" },
  ];

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe"
    >
      {/* Gradient fade at top */}
      <div className="absolute -top-10 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      <div className="glass-noire mx-4 mb-4 rounded-2xl px-2 py-3 border border-border/20">
        <div className="flex items-center justify-around relative">
          {/* Animated background indicator */}
          <motion.div
            className="absolute h-12 rounded-xl bg-muted/50"
            initial={false}
            animate={{
              x: `${activeIndex * 100}%`,
              width: `${100 / navItems.length}%`,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{ left: 0 }}
          />

          {navItems.map((item, index) => (
            <motion.button
              key={item.label}
              onClick={() => setActiveIndex(index)}
              className="relative z-10 flex flex-col items-center gap-1 py-2 px-6"
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                animate={{
                  scale: activeIndex === index ? 1.1 : 1,
                  color: activeIndex === index ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <item.icon className="w-5 h-5" />
              </motion.div>
              <motion.span
                className="text-xs font-body"
                animate={{
                  opacity: activeIndex === index ? 1 : 0.5,
                  color: activeIndex === index ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                }}
              >
                {item.label}
              </motion.span>

              {/* Active dot indicator */}
              <motion.div
                className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary"
                initial={{ scale: 0 }}
                animate={{ scale: activeIndex === index ? 1 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </motion.button>
          ))}
        </div>
      </div>
    </motion.nav>
  );
};

export default MobileBottomNav;
