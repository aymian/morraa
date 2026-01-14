import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Play, Music } from "lucide-react";

/**
 * NOIRE Afrobeat & Amapiano Spotlight - Redesigned
 * Clean artist showcase with visual rhythm
 */

interface AfrobeatSpotlightProps {
  onAuthClick?: (action: "login" | "signup") => void;
}

const AfrobeatSpotlight = ({ onAuthClick }: AfrobeatSpotlightProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const x = useTransform(scrollYProgress, [0, 1], [-50, 50]);

  const handleClick = () => {
    if (onAuthClick) {
      onAuthClick("signup");
    } else {
      window.location.href = "/login?action=signup";
    }
  };

  const artists = [
    { name: "Burna Boy", genre: "Afrofusion", image: "🎤" },
    { name: "Wizkid", genre: "Afrobeats", image: "🎵" },
    { name: "Tems", genre: "Alternative", image: "🎧" },
    { name: "Kabza De Small", genre: "Amapiano", image: "🎹" },
    { name: "Rema", genre: "Afro-Rave", image: "🔥" },
    { name: "Ayra Starr", genre: "Afropop", image: "⭐" },
  ];

  return (
    <section
      id="afrobeat"
      ref={sectionRef}
      className="relative py-24 md:py-32 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-noire-deep to-background" />
      
      {/* Warm accent glow */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 left-0 w-[600px] h-[600px] rounded-full bg-mood-afro/8 blur-[150px]"
        style={{ x }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="max-w-4xl mb-16 md:mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-mood-afro/10 border border-mood-afro/20 mb-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Music className="w-4 h-4 text-mood-afro" />
            <span className="text-xs font-body text-mood-afro uppercase tracking-wider">
              Featured Genre
            </span>
          </motion.div>

          <h2 className="font-display text-4xl md:text-5xl lg:text-7xl text-foreground mb-4 leading-tight">
            Afrobeat &
            <br />
            <span className="text-gradient-gold italic">Amapiano</span>
          </h2>

          <p className="text-muted-foreground font-body text-lg max-w-xl">
            Experience the pulse of Africa. Curated playlists from the continent's 
            most influential artists.
          </p>
        </motion.div>

        {/* Artist Cards - Horizontal scroll on mobile, grid on desktop */}
        <div className="relative">
          {/* Desktop grid */}
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            {artists.map((artist, index) => (
              <motion.button
                key={artist.name}
                onClick={handleClick}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -10, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative aspect-[3/4] rounded-2xl bg-card/50 border border-border/30 overflow-hidden text-left"
              >
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-t from-noire-black via-noire-black/50 to-transparent" />
                
                {/* Animated pattern */}
                <motion.div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: `radial-gradient(circle at 50% 80%, hsl(var(--mood-afro) / 0.3) 0%, transparent 60%)`,
                  }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />

                {/* Emoji placeholder for artist image */}
                <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30 group-hover:opacity-50 transition-opacity">
                  {artist.image}
                </div>

                {/* Play button on hover */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ scale: 0.8 }}
                  whileHover={{ scale: 1 }}
                >
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                    <Play className="w-5 h-5 text-primary-foreground fill-current ml-0.5" />
                  </div>
                </motion.div>

                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-xs text-mood-afro font-body uppercase tracking-wider mb-1">
                    {artist.genre}
                  </p>
                  <h3 className="font-display text-base text-foreground">
                    {artist.name}
                  </h3>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Mobile horizontal scroll */}
          <div className="md:hidden overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            <div className="flex gap-3" style={{ width: "max-content" }}>
              {artists.map((artist, index) => (
                <motion.button
                  key={artist.name}
                  onClick={handleClick}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative w-36 aspect-[3/4] rounded-xl bg-card/50 border border-border/30 overflow-hidden flex-shrink-0"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-noire-black via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">
                    {artist.image}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-[10px] text-mood-afro font-body uppercase tracking-wider">
                      {artist.genre}
                    </p>
                    <h3 className="font-display text-sm text-foreground">
                      {artist.name}
                    </h3>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
        >
          <motion.button
            onClick={handleClick}
            className="inline-flex items-center gap-2 px-6 py-3 border border-border/50 text-foreground font-body text-sm rounded-full hover:bg-muted/30 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            View all artists
            <span>→</span>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default AfrobeatSpotlight;
