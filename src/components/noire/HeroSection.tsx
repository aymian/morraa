import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Play, Headphones, Sparkles } from "lucide-react";

/**
 * NOIRE Hero Section - Completely Redesigned
 * Cinematic, emotional, with clear value proposition
 * Focus on driving users to sign up
 */

interface HeroSectionProps {
  onAuthClick?: (action: "login" | "signup") => void;
}

const HeroSection = ({ onAuthClick }: HeroSectionProps) => {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { stiffness: 50, damping: 20 };
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-5, 5]), springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleAuthClick = (action: "login" | "signup") => {
    if (onAuthClick) {
      onAuthClick(action);
    } else {
      window.location.href = `/login?action=${action}`;
    }
  };

  const features = [
    { icon: Headphones, text: "Mood-based discovery" },
    { icon: Sparkles, text: "AI-curated playlists" },
    { icon: Play, text: "Unlimited streaming" },
  ];

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 md:pt-0"
      onMouseMove={handleMouseMove}
    >
      {/* Layered background */}
      <div className="absolute inset-0 bg-noire-hero" />
      
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-1/4 left-1/6 w-[500px] h-[500px] rounded-full bg-noire-purple/30 blur-[150px]"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/6 w-[400px] h-[400px] rounded-full bg-primary/15 blur-[120px]"
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -40, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), 
                           linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Floating card with 3D effect */}
          <motion.div
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="text-center"
          >
            {/* Tagline badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/30 mb-8"
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm font-body text-muted-foreground">
                Music that feels you
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-5xl md:text-7xl lg:text-8xl leading-[1.1] mb-6"
            >
              <span className="text-foreground">Your emotions.</span>
              <br />
              <span className="text-gradient-gold">Our soundtrack.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-lg md:text-xl text-muted-foreground font-body max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              NOIRE understands how you feel. Tell us your mood, and we'll craft the perfect 
              listening experience. From melancholic nights to euphoric Afrobeats.
            </motion.p>

            {/* Feature badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex flex-wrap justify-center gap-4 mb-12"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + index * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 border border-border/20"
                >
                  <feature.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-body text-foreground/80">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {/* Primary CTA */}
              <motion.button
                onClick={() => handleAuthClick("signup")}
                className="relative group px-8 py-4 bg-primary text-primary-foreground font-body font-medium text-base rounded-full overflow-hidden w-full sm:w-auto"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Play className="w-5 h-5 fill-current" />
                  Start Free Trial
                </span>
              </motion.button>

              {/* Secondary CTA */}
              <motion.button
                onClick={() => handleAuthClick("login")}
                className="group px-8 py-4 border border-border/50 text-foreground font-body font-medium text-base rounded-full hover:bg-muted/30 transition-all duration-300 w-full sm:w-auto"
                whileHover={{ scale: 1.02, borderColor: "hsl(var(--primary) / 0.5)" }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center justify-center gap-2">
                  I have an account
                </span>
              </motion.button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6 }}
              className="mt-12 flex items-center justify-center gap-6"
            >
              {/* User avatars */}
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-background bg-gradient-to-br from-noire-purple to-primary"
                    initial={{ scale: 0, x: -10 }}
                    animate={{ scale: 1, x: 0 }}
                    transition={{ delay: 1.6 + i * 0.1 }}
                  />
                ))}
              </div>
              <div className="text-left">
                <p className="text-sm font-body text-foreground">100K+ listeners</p>
                <p className="text-xs text-muted-foreground">feeling the vibe</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <motion.div
          className="w-6 h-10 rounded-full border border-muted-foreground/30 flex justify-center pt-2"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            className="w-1 h-2 rounded-full bg-primary/60"
            animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
