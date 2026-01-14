import { motion } from "framer-motion";

/**
 * NOIRE Footer - Minimal, elite
 * Almost empty - just logo and essential info
 * Soft animated divider for elegance
 */

const Footer = () => {
  return (
    <footer className="relative py-16 md:py-24 overflow-hidden">
      {/* Subtle top gradient fade */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent pointer-events-none" />

      <div className="container mx-auto px-4">
        {/* Animated divider line */}
        <motion.div
          className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent mb-16"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        />

        <div className="flex flex-col items-center text-center">
          {/* Logo */}
          <motion.a
            href="#"
            className="font-display text-3xl md:text-4xl tracking-wider text-foreground mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.02 }}
          >
            NOIRE
          </motion.a>

          {/* Tagline */}
          <motion.p
            className="font-body text-sm text-muted-foreground tracking-widest mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Music for your soul
          </motion.p>

          {/* Minimal links */}
          <motion.div
            className="flex gap-8 mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {["Privacy", "Terms", "Contact"].map((link, index) => (
              <motion.a
                key={link}
                href="#"
                className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wider uppercase"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                {link}
              </motion.a>
            ))}
          </motion.div>

          {/* Animated bottom divider - pulsing glow */}
          <motion.div
            className="w-24 h-0.5 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <motion.div
              className="w-full h-full bg-gradient-to-r from-noire-purple via-primary to-noire-purple"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>

          {/* Copyright */}
          <motion.p
            className="mt-12 font-body text-xs text-muted-foreground/50"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            © 2024 NOIRE. All rights reserved.
          </motion.p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
