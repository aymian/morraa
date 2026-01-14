import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/**
 * NOIRE Afrobeat & Amapiano Spotlight
 * Rhythmic layout with staggered motion
 * Off-grid organic feel with dancing typography
 */

const AfrobeatSpotlight = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const y3 = useTransform(scrollYProgress, [0, 1], [150, -150]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-5, 5]);

  const artists = [
    { name: "Burna Boy", genre: "Afrofusion", offset: "translate-y-8" },
    { name: "Wizkid", genre: "Afrobeats", offset: "-translate-y-4" },
    { name: "Tems", genre: "Alternative", offset: "translate-y-12" },
    { name: "Kabza De Small", genre: "Amapiano", offset: "-translate-y-8" },
    { name: "Rema", genre: "Afro-Rave", offset: "translate-y-4" },
  ];

  return (
    <section
      id="afrobeat"
      ref={sectionRef}
      className="relative py-32 md:py-48 overflow-hidden"
    >
      {/* Warm gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-[hsl(25_30%_6%)] to-background" />
      
      {/* Animated accent shapes */}
      <motion.div
        className="absolute top-1/4 -left-20 w-64 h-64 rounded-full bg-mood-afro/10 blur-[100px]"
        style={{ y: y1 }}
      />
      <motion.div
        className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-mood-afro/15 blur-[120px]"
        style={{ y: y2 }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header with dancing typography */}
        <motion.div
          className="mb-20 md:mb-32"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <motion.span
            className="font-body text-xs tracking-[0.3em] text-mood-afro uppercase block mb-4"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            The Pulse of Africa
          </motion.span>

          {/* Large title with micro-animations */}
          <div className="overflow-hidden">
            <motion.h2
              className="font-display text-5xl md:text-7xl lg:text-8xl text-foreground leading-none"
              initial={{ y: 100 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {"Afrobeat".split("").map((char, i) => (
                <motion.span
                  key={i}
                  className="inline-block"
                  animate={{ 
                    y: [0, -3, 0],
                    rotate: [0, 1, 0],
                  }}
                  transition={{ 
                    duration: 2,
                    delay: i * 0.1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.h2>
          </div>

          <div className="overflow-hidden mt-2">
            <motion.h2
              className="font-display text-5xl md:text-7xl lg:text-8xl text-gradient-gold leading-none italic"
              initial={{ y: 100 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              style={{ rotate }}
            >
              & Amapiano
            </motion.h2>
          </div>
        </motion.div>

        {/* Organic off-grid artist layout */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {artists.map((artist, index) => (
            <motion.div
              key={artist.name}
              className={`${artist.offset} ${index % 2 === 0 ? 'md:mt-8' : 'md:-mt-8'}`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <motion.div
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-noire-card cursor-pointer"
                whileHover={{ scale: 1.03, y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-noire-black via-transparent to-transparent z-10" />
                
                {/* Abstract pattern background */}
                <motion.div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: `radial-gradient(circle at ${30 + index * 15}% ${50 + index * 10}%, hsl(var(--mood-afro) / 0.3) 0%, transparent 50%)`,
                  }}
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 4 + index,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {/* Rhythm lines */}
                <div className="absolute inset-0 flex items-end justify-center gap-1 p-4 opacity-30 group-hover:opacity-60 transition-opacity">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-mood-afro rounded-full"
                      animate={{
                        height: [`${20 + i * 10}%`, `${40 + i * 8}%`, `${20 + i * 10}%`],
                      }}
                      transition={{
                        duration: 0.8 + i * 0.1,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>

                {/* Artist info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-20">
                  <motion.p
                    className="font-body text-xs text-mood-afro tracking-wider uppercase mb-1"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    {artist.genre}
                  </motion.p>
                  <motion.h3
                    className="font-display text-lg md:text-xl text-foreground"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    {artist.name}
                  </motion.h3>
                </div>

                {/* Hover glow */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: "radial-gradient(circle at center, hsl(var(--mood-afro) / 0.2) 0%, transparent 70%)",
                  }}
                />
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Rhythmic quote */}
        <motion.div
          className="mt-20 md:mt-32 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <motion.p
            className="font-display text-2xl md:text-3xl text-muted-foreground italic"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            "The rhythm is the heartbeat of the continent"
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default AfrobeatSpotlight;
