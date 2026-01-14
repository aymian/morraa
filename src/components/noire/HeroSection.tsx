import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useState } from "react";

/**
 * NOIRE Hero Section
 * Full viewport, cinematic, emotionally-driven
 * Floating animated typography with letter-by-letter subtext
 */

const MoodPill = ({ 
  label, 
  color, 
  delay 
}: { 
  label: string; 
  color: string; 
  delay: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative px-6 py-3 rounded-full border border-border/50 overflow-hidden group"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Ripple effect on hover */}
      <motion.div
        className={`absolute inset-0 ${color} opacity-0`}
        animate={{ 
          opacity: isHovered ? 0.2 : 0,
          scale: isHovered ? 1 : 0.8,
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Morphing background */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          background: isHovered 
            ? `radial-gradient(circle at center, ${color === 'bg-mood-sad' ? 'hsl(220 60% 50% / 0.3)' : color === 'bg-mood-calm' ? 'hsl(180 40% 45% / 0.3)' : 'hsl(25 85% 55% / 0.3)'} 0%, transparent 70%)`
            : 'transparent',
        }}
        transition={{ duration: 0.4 }}
      />

      <span className="relative z-10 font-body text-sm text-foreground/90 tracking-wide">
        {label}
      </span>
    </motion.button>
  );
};

const HeroSection = () => {
  const subtext = "Feel music. Don't just play it.";
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 100, damping: 30 };
  const x = useSpring(useTransform(mouseX, [0, 1], [-10, 10]), springConfig);
  const y = useSpring(useTransform(mouseY, [0, 1], [-10, 10]), springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-noire-hero"
      onMouseMove={handleMouseMove}
    >
      {/* Ambient glow layers */}
      <div className="absolute inset-0 bg-noire-glow opacity-60" />
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-noire-purple/20 blur-[100px]"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-accent/20 blur-[80px]"
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating NOIRE title */}
      <motion.div
        className="relative z-10 text-center px-4"
        style={{ x, y }}
      >
        <motion.h1
          className="font-display text-8xl md:text-[12rem] lg:text-[16rem] tracking-tight leading-none"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {"NOIRE".split("").map((letter, index) => (
            <motion.span
              key={index}
              className="inline-block text-gradient-gold"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: 0.1 * index, 
                duration: 0.8, 
                ease: [0.22, 1, 0.36, 1] 
              }}
              whileHover={{ 
                y: -10, 
                transition: { duration: 0.2 } 
              }}
              style={{ 
                textShadow: "0 0 80px hsl(38 90% 60% / 0.3)" 
              }}
            >
              {letter}
            </motion.span>
          ))}
        </motion.h1>

        {/* Letter-by-letter subtext */}
        <motion.p
          className="mt-8 md:mt-12 text-lg md:text-xl text-muted-foreground font-body tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {subtext.split("").map((letter, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ 
                delay: 1 + index * 0.04,
                duration: 0.3,
              }}
            >
              {letter}
            </motion.span>
          ))}
        </motion.p>

        {/* Mood Pills */}
        <motion.div
          className="mt-12 md:mt-16 flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <MoodPill label="Sad" color="bg-mood-sad" delay={2.1} />
          <MoodPill label="Calm" color="bg-mood-calm" delay={2.2} />
          <MoodPill label="Afro-Amapiano" color="bg-mood-afro" delay={2.3} />
        </motion.div>

        {/* CTA Button with liquid hover */}
        <motion.div
          className="mt-12 md:mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.6 }}
        >
          <motion.button
            className="relative px-10 py-4 bg-primary text-primary-foreground font-body font-medium text-sm tracking-wider rounded-full overflow-hidden group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Liquid morph effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary via-noire-gold-soft to-primary"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{ opacity: 0.5 }}
            />
            <span className="relative z-10">Enter Your Mood</span>
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{ 
          opacity: { delay: 3, duration: 0.5 },
          y: { delay: 3, duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
