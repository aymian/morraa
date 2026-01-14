import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/**
 * NOIRE Call To Emotion Section
 * Poetic, emotional call-to-action
 * Background reacts slowly to scroll
 */

const CallToEmotion = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 0.9]);

  return (
    <section
      id="listen"
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Parallax background */}
      <motion.div
        className="absolute inset-0"
        style={{ y: backgroundY }}
      >
        {/* Gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-noire-midnight to-background" />
        
        {/* Animated glow orbs */}
        <motion.div
          className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-noire-purple/20 blur-[150px]"
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-primary/10 blur-[120px]"
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Content */}
      <motion.div
        className="relative z-10 text-center px-4 max-w-4xl mx-auto"
        style={{ opacity, scale }}
      >
        {/* Poetic headline */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-foreground leading-tight">
            When words fail,
          </h2>
          <motion.h2
            className="font-display text-4xl md:text-6xl lg:text-7xl text-gradient-gold leading-tight mt-2"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            NOIRE plays.
          </motion.h2>
        </motion.div>

        {/* Subtext */}
        <motion.p
          className="mt-8 md:mt-12 text-lg md:text-xl text-muted-foreground font-body max-w-xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          Music isn't just sound. It's the language of your soul, 
          spoken in frequencies the heart understands.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          className="mt-12 md:mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <motion.button
            className="relative px-12 py-5 font-body font-medium text-sm tracking-wider rounded-full overflow-hidden group border border-primary/30"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Background animation */}
            <motion.div
              className="absolute inset-0 bg-primary"
              initial={{ x: "-100%" }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
            
            {/* Text */}
            <span className="relative z-10 text-primary group-hover:text-primary-foreground transition-colors duration-300">
              Start Listening
            </span>

            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                boxShadow: "0 0 40px -5px hsl(38 90% 60% / 0.4)",
              }}
            />
          </motion.button>
        </motion.div>

        {/* Floating music notes decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl text-primary/20"
              style={{
                left: `${10 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [0, -50, 0],
                opacity: [0.1, 0.3, 0.1],
                rotate: [0, 10, 0],
              }}
              transition={{
                duration: 5 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.8,
              }}
            >
              ♪
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default CallToEmotion;
