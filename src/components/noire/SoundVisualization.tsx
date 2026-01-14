import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Volume2 } from "lucide-react";

/**
 * NOIRE Sound Visualization Section - Redesigned
 * Clean, elegant audio visualization with clear purpose
 */

interface SoundVisualizationProps {
  onAuthClick?: (action: "login" | "signup") => void;
}

const SoundVisualization = ({ onAuthClick }: SoundVisualizationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.5, 1, 1, 0.5]);
  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

  const handleClick = () => {
    if (onAuthClick) {
      onAuthClick("signup");
    } else {
      window.location.href = "/login?action=signup";
    }
  };

  // Generate visualization bars
  const barCount = 50;
  const bars = Array.from({ length: barCount }, (_, i) => ({
    height: 20 + Math.sin((i / barCount) * Math.PI) * 80 + Math.random() * 30,
    delay: i * 0.02,
  }));

  return (
    <section
      id="sound"
      ref={containerRef}
      className="relative py-24 md:py-40 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-background" />

      <motion.div
        className="container mx-auto px-4 relative z-10"
        style={{ opacity }}
      >
        {/* Two column layout */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">
          {/* Left: Content */}
          <motion.div
            style={{ y }}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/30 mb-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <Volume2 className="w-4 h-4 text-primary" />
              <span className="text-xs font-body text-muted-foreground uppercase tracking-wider">
                Experience
              </span>
            </motion.div>

            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-6 leading-tight">
              Sound that
              <br />
              <span className="text-gradient-gold italic">moves</span> you
            </h2>

            <p className="text-muted-foreground font-body text-lg leading-relaxed mb-8 max-w-md">
              Our adaptive audio engine creates a listening experience that responds to your 
              energy. Every beat, every pause, perfectly timed.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              {[
                { value: "50M+", label: "Tracks" },
                { value: "4K", label: "Quality" },
                { value: "0ms", label: "Latency" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <p className="font-display text-2xl md:text-3xl text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-body uppercase tracking-wider">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            <motion.button
              onClick={handleClick}
              className="group inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-body font-medium text-sm rounded-full"
              whileHover={{ scale: 1.02, boxShadow: "0 0 30px -5px hsl(38 90% 60% / 0.4)" }}
              whileTap={{ scale: 0.98 }}
            >
              Experience it yourself
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </motion.button>
          </motion.div>

          {/* Right: Visualization */}
          <motion.div
            className="relative h-64 md:h-80 flex items-end justify-center"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Glow backdrop */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-64 h-64 rounded-full bg-primary/10 blur-[80px]"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
            </div>

            {/* Sound bars */}
            <div className="relative flex items-end justify-center gap-[2px] h-full w-full px-4">
              {bars.map((bar, i) => (
                <motion.div
                  key={i}
                  className="flex-1 max-w-2 rounded-full bg-gradient-to-t from-noire-purple to-primary"
                  initial={{ height: 4, opacity: 0 }}
                  whileInView={{ height: bar.height, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: bar.delay, duration: 0.5 }}
                  animate={{
                    height: [bar.height, bar.height * 0.4, bar.height],
                  }}
                  style={{
                    animationDuration: `${1 + Math.random() * 0.5}s`,
                    animationDelay: `${bar.delay}s`,
                    animationIterationCount: "infinite",
                    animationTimingFunction: "ease-in-out",
                  }}
                />
              ))}
            </div>

            {/* Reflection */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background via-background to-transparent" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default SoundVisualization;
