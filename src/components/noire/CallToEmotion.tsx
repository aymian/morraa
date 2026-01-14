import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Play, Check } from "lucide-react";

/**
 * NOIRE Call To Emotion Section - Redesigned
 * Powerful final CTA with clear value propositions
 */

interface CallToEmotionProps {
  onAuthClick?: (action: "login" | "signup") => void;
}

const CallToEmotion = ({ onAuthClick }: CallToEmotionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  const handleClick = (action: "login" | "signup") => {
    if (onAuthClick) {
      onAuthClick(action);
    } else {
      window.location.href = `/login?action=${action}`;
    }
  };

  const benefits = [
    "Unlimited mood-based playlists",
    "Offline listening",
    "Hi-Fi audio quality",
    "No ads, ever",
  ];

  return (
    <section
      id="listen"
      ref={sectionRef}
      className="relative py-32 md:py-48 overflow-hidden"
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-noire-midnight to-background" />
      
      {/* Animated orbs */}
      <motion.div
        className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-noire-purple/20 blur-[150px]"
        style={{ y }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[120px]"
        animate={{ scale: [1.2, 1, 1.2] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <motion.div
        className="container mx-auto px-4 relative z-10"
        style={{ opacity }}
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Main headline */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-foreground leading-tight mb-4">
              When words fail,
            </h2>
            <motion.h2
              className="font-display text-4xl md:text-6xl lg:text-7xl text-gradient-gold leading-tight"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 1 }}
            >
              NOIRE plays.
            </motion.h2>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            className="mt-8 text-lg md:text-xl text-muted-foreground font-body max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Start your free trial today. No credit card required. 
            Cancel anytime.
          </motion.p>

          {/* Benefits */}
          <motion.div
            className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit}
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm font-body text-foreground/80">{benefit}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
          >
            {/* Primary CTA */}
            <motion.button
              onClick={() => handleClick("signup")}
              className="relative group px-10 py-4 bg-primary text-primary-foreground font-body font-medium text-base rounded-full overflow-hidden w-full sm:w-auto"
              whileHover={{ scale: 1.02, boxShadow: "0 0 50px -10px hsl(38 90% 60% / 0.5)" }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Shimmer */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
              />
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Play className="w-5 h-5 fill-current" />
                Start Free Trial
              </span>
            </motion.button>

            {/* Secondary */}
            <motion.button
              onClick={() => handleClick("login")}
              className="px-10 py-4 border border-border/50 text-foreground font-body text-base rounded-full hover:bg-muted/30 transition-colors w-full sm:w-auto"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Sign in
            </motion.button>
          </motion.div>

          {/* Trust text */}
          <motion.p
            className="mt-8 text-xs text-muted-foreground font-body"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1 }}
          >
            Join 100,000+ listeners who feel the difference
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
};

export default CallToEmotion;
