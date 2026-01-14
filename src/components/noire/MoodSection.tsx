import { motion, useMotionValue, useTransform } from "framer-motion";
import { useState, useRef } from "react";

/**
 * NOIRE Mood Section
 * Emotion-based interaction cards with parallax and glow
 * Clicking a mood transforms the entire section's palette
 */

interface MoodCardProps {
  title: string;
  description: string;
  gradient: string;
  glowColor: string;
  isActive: boolean;
  onClick: () => void;
}

const MoodCard = ({ title, description, gradient, glowColor, isActive, onClick }: MoodCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useTransform(mouseY, [0, 1], [10, -10]);
  const rotateY = useTransform(mouseX, [0, 1], [-10, 10]);
  const glowX = useTransform(mouseX, [0, 1], ["0%", "100%"]);
  const glowY = useTransform(mouseY, [0, 1], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <motion.div
      ref={cardRef}
      className="relative cursor-pointer perspective-1000"
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      whileHover={{ z: 50 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <motion.div
        className={`relative p-8 md:p-10 rounded-2xl border border-border/30 overflow-hidden ${isActive ? 'shadow-glow-purple' : ''}`}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        {/* Background gradient */}
        <motion.div
          className={`absolute inset-0 ${gradient} opacity-50`}
          animate={{ opacity: isActive ? 0.8 : 0.3 }}
          transition={{ duration: 0.5 }}
        />

        {/* Cursor-following glow */}
        <motion.div
          className={`absolute w-40 h-40 rounded-full ${glowColor} blur-[60px] opacity-50`}
          style={{ 
            left: glowX, 
            top: glowY,
            x: "-50%",
            y: "-50%",
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          <motion.h3
            className="font-display text-3xl md:text-4xl text-foreground mb-4"
            animate={{ scale: isActive ? 1.05 : 1 }}
            transition={{ duration: 0.3 }}
          >
            {title}
          </motion.h3>
          <p className="font-body text-muted-foreground text-sm md:text-base leading-relaxed max-w-xs">
            {description}
          </p>

          {/* Active indicator */}
          <motion.div
            className="mt-6 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: isActive ? 1 : 0.5 }}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ scale: isActive ? [1, 1.3, 1] : 1 }}
              transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
            />
            <span className="font-body text-xs text-muted-foreground tracking-wider uppercase">
              {isActive ? "Listening" : "Tap to feel"}
            </span>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const MoodSection = () => {
  const [activeMood, setActiveMood] = useState<string | null>(null);

  const moods = [
    {
      id: "melancholy",
      title: "Melancholy",
      description: "For moments when sadness becomes beautiful. Let the weight lift through sound.",
      gradient: "bg-gradient-to-br from-mood-sad/30 to-transparent",
      glowColor: "bg-mood-sad",
    },
    {
      id: "serenity",
      title: "Serenity",
      description: "Calm waters run deep. Find your peace in the spaces between notes.",
      gradient: "bg-gradient-to-br from-mood-calm/30 to-transparent",
      glowColor: "bg-mood-calm",
    },
    {
      id: "euphoria",
      title: "Euphoria",
      description: "The rhythm takes over. Let Afro-beats move through your soul.",
      gradient: "bg-gradient-to-br from-mood-afro/30 to-transparent",
      glowColor: "bg-mood-afro",
    },
    {
      id: "introspect",
      title: "Introspect",
      description: "Journey inward. Music that mirrors the complexity of your thoughts.",
      gradient: "bg-gradient-to-br from-noire-purple/30 to-transparent",
      glowColor: "bg-noire-purple-glow",
    },
  ];

  return (
    <section id="moods" className="relative py-24 md:py-32 overflow-hidden">
      {/* Dynamic background based on active mood */}
      <motion.div
        className="absolute inset-0 transition-colors duration-1000"
        animate={{
          background: activeMood === "melancholy" 
            ? "radial-gradient(ellipse at center, hsl(220 60% 50% / 0.1) 0%, transparent 70%)"
            : activeMood === "serenity"
            ? "radial-gradient(ellipse at center, hsl(180 40% 45% / 0.1) 0%, transparent 70%)"
            : activeMood === "euphoria"
            ? "radial-gradient(ellipse at center, hsl(25 85% 55% / 0.1) 0%, transparent 70%)"
            : activeMood === "introspect"
            ? "radial-gradient(ellipse at center, hsl(280 60% 35% / 0.1) 0%, transparent 70%)"
            : "transparent",
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16 md:mb-24"
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
            Choose Your Emotion
          </motion.span>
          <motion.h2
            className="font-display text-4xl md:text-6xl lg:text-7xl mt-4 text-foreground"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            How do you <span className="text-gradient-gold italic">feel</span>?
          </motion.h2>
        </motion.div>

        {/* Mood Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
          {moods.map((mood, index) => (
            <motion.div
              key={mood.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * index, duration: 0.6 }}
            >
              <MoodCard
                title={mood.title}
                description={mood.description}
                gradient={mood.gradient}
                glowColor={mood.glowColor}
                isActive={activeMood === mood.id}
                onClick={() => setActiveMood(activeMood === mood.id ? null : mood.id)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MoodSection;
