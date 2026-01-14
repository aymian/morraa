import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/**
 * NOIRE Sound Visualization Section
 * Abstract audio-wave animation synced to scroll
 * Purely visual but believable sound energy
 */

const SoundVisualization = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Create 40 bars for the visualization
  const bars = Array.from({ length: 40 }, (_, i) => i);

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.8, 1, 1, 0.8]);

  return (
    <section
      id="sound"
      ref={containerRef}
      className="relative py-32 md:py-48 overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-noire-deep to-background" />

      <motion.div
        className="container mx-auto px-4 relative z-10"
        style={{ opacity, scale }}
      >
        {/* Header */}
        <motion.div
          className="text-center mb-20 md:mb-32"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.span
            className="font-body text-xs tracking-[0.3em] text-muted-foreground uppercase"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Sound in Motion
          </motion.span>
          <motion.h2
            className="font-display text-4xl md:text-6xl lg:text-7xl mt-4 text-foreground"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            See the <span className="text-gradient-gold italic">rhythm</span>
          </motion.h2>
        </motion.div>

        {/* Sound Bars Visualization */}
        <div className="flex items-center justify-center gap-1 md:gap-2 h-48 md:h-64">
          {bars.map((bar) => {
            // Create organic wave pattern based on scroll and bar position
            const baseDelay = bar * 0.05;
            const heightMultiplier = Math.sin((bar / bars.length) * Math.PI) * 0.5 + 0.5;

            return (
              <motion.div
                key={bar}
                className="relative"
                initial={{ opacity: 0, scaleY: 0 }}
                whileInView={{ opacity: 1, scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ delay: baseDelay, duration: 0.5 }}
              >
                <motion.div
                  className="w-1 md:w-2 rounded-full bg-gradient-to-t from-noire-purple to-primary"
                  style={{ 
                    originY: 1,
                    height: `${80 + heightMultiplier * 120}px`,
                  }}
                  animate={{
                    scaleY: [1, 0.3 + Math.random() * 0.7, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 1 + Math.random() * 0.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: baseDelay * 0.5,
                  }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Floating Orbs */}
        <div className="relative h-20 md:h-32 mt-16">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 md:w-4 md:h-4 rounded-full bg-primary/60"
              style={{
                left: `${15 + i * 18}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.4, 1, 0.4],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 2 + i * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.4,
              }}
            />
          ))}
        </div>

        {/* Waveform Lines */}
        <motion.svg
          className="w-full h-24 md:h-32 mt-8"
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <motion.path
            d="M0,50 Q100,20 200,50 T400,50 T600,50 T800,50 T1000,50"
            fill="none"
            stroke="url(#gradient1)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          <motion.path
            d="M0,50 Q100,80 200,50 T400,50 T600,50 T800,50 T1000,50"
            fill="none"
            stroke="url(#gradient2)"
            strokeWidth="1.5"
            initial={{ pathLength: 0, opacity: 0.5 }}
            whileInView={{ pathLength: 1, opacity: 0.5 }}
            viewport={{ once: true }}
            transition={{ duration: 2.5, ease: "easeInOut", delay: 0.2 }}
          />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(280 50% 25%)" />
              <stop offset="50%" stopColor="hsl(38 90% 60%)" />
              <stop offset="100%" stopColor="hsl(280 50% 25%)" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(38 90% 60% / 0.3)" />
              <stop offset="100%" stopColor="hsl(280 60% 40% / 0.3)" />
            </linearGradient>
          </defs>
        </motion.svg>
      </motion.div>
    </section>
  );
};

export default SoundVisualization;
