import { motion } from "framer-motion";
import { useState } from "react";
import { Heart, Moon, Zap, Brain, ArrowRight } from "lucide-react";

/**
 * NOIRE Mood Section - Redesigned
 * Clean, interactive mood selection with clear visual hierarchy
 * Clicking leads to signup
 */

interface MoodSectionProps {
  onAuthClick?: (action: "login" | "signup") => void;
}

interface Mood {
  id: string;
  title: string;
  description: string;
  icon: typeof Heart;
  color: string;
  gradient: string;
}

const MoodSection = ({ onAuthClick }: MoodSectionProps) => {
  const [hoveredMood, setHoveredMood] = useState<string | null>(null);

  const handleMoodClick = () => {
    if (onAuthClick) {
      onAuthClick("signup");
    } else {
      window.location.href = "/login?action=signup";
    }
  };

  const moods: Mood[] = [
    {
      id: "melancholy",
      title: "Melancholy",
      description: "For moments when sadness becomes art",
      icon: Moon,
      color: "text-mood-sad",
      gradient: "from-mood-sad/20 to-transparent",
    },
    {
      id: "serenity",
      title: "Serenity",
      description: "Find peace in the spaces between notes",
      icon: Heart,
      color: "text-mood-calm",
      gradient: "from-mood-calm/20 to-transparent",
    },
    {
      id: "euphoria",
      title: "Euphoria",
      description: "Let Afrobeats move through your soul",
      icon: Zap,
      color: "text-mood-afro",
      gradient: "from-mood-afro/20 to-transparent",
    },
    {
      id: "introspect",
      title: "Introspect",
      description: "Music that mirrors your complexity",
      icon: Brain,
      color: "text-noire-purple-glow",
      gradient: "from-noire-purple/20 to-transparent",
    },
  ];

  return (
    <section id="moods" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-noire-deep to-background" />

      {/* Dynamic glow based on hovered mood */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: hoveredMood === "melancholy"
            ? "radial-gradient(ellipse at center, hsl(220 60% 50% / 0.08) 0%, transparent 60%)"
            : hoveredMood === "serenity"
            ? "radial-gradient(ellipse at center, hsl(180 40% 45% / 0.08) 0%, transparent 60%)"
            : hoveredMood === "euphoria"
            ? "radial-gradient(ellipse at center, hsl(25 85% 55% / 0.08) 0%, transparent 60%)"
            : hoveredMood === "introspect"
            ? "radial-gradient(ellipse at center, hsl(280 60% 35% / 0.08) 0%, transparent 60%)"
            : "transparent",
        }}
        transition={{ duration: 0.5 }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16 md:mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.span
            className="inline-block font-body text-xs tracking-[0.3em] text-primary uppercase mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Mood Discovery
          </motion.span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-4">
            How are you <span className="text-gradient-gold italic">feeling</span>?
          </h2>
          <p className="text-muted-foreground font-body text-lg max-w-xl mx-auto">
            Select your mood and let NOIRE curate the perfect soundtrack
          </p>
        </motion.div>

        {/* Mood Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
          {moods.map((mood, index) => (
            <motion.button
              key={mood.id}
              onClick={handleMoodClick}
              onHoverStart={() => setHoveredMood(mood.id)}
              onHoverEnd={() => setHoveredMood(null)}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative p-6 md:p-8 rounded-2xl bg-card/50 border border-border/30 text-left overflow-hidden transition-all duration-300 hover:border-border/60"
            >
              {/* Gradient overlay on hover */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${mood.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />

              {/* Content */}
              <div className="relative z-10">
                {/* Icon */}
                <motion.div
                  className={`w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4 ${mood.color}`}
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <mood.icon className="w-6 h-6" />
                </motion.div>

                {/* Title */}
                <h3 className="font-display text-xl md:text-2xl text-foreground mb-2">
                  {mood.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground font-body leading-relaxed mb-4">
                  {mood.description}
                </p>

                {/* Arrow indicator */}
                <motion.div
                  className="flex items-center gap-2 text-primary text-sm font-body opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ x: -10 }}
                  whileHover={{ x: 0 }}
                >
                  <span>Explore</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-muted-foreground font-body text-sm">
            Can't decide? Let us <button onClick={handleMoodClick} className="text-primary hover:underline">surprise you</button>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default MoodSection;
