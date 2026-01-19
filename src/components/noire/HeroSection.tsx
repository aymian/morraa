import { motion } from "framer-motion";
import { ArrowRight, Heart, MessageCircle, Share2, Sparkles } from "lucide-react";

interface HeroSectionProps {
  onAuthClick: (action: "login" | "signup") => void;
}

const HeroSection = ({ onAuthClick }: HeroSectionProps) => {
  const cards = [
    {
      id: 1,
      image: "/assets/hero/lifestyle.png",
      user: "Alex Rivers",
      handle: "@arivers",
      caption: "Living in the future. 🚀 #MorraMoment",
      likes: "12.4k",
      comments: "842",
      rotation: -6,
      y: 20,
    },
    {
      id: 2,
      image: "/assets/hero/creative.png",
      user: "Sarah Chen",
      handle: "@sarah.studio",
      caption: "My new workspace setup finally complete. Thoughts? ✨",
      likes: "45.2k",
      comments: "2.1k",
      rotation: 0,
      y: 0,
      scale: 1.05,
      zIndex: 10,
    },
    {
      id: 3,
      image: "/assets/hero/community.png",
      user: "The Nexus Group",
      handle: "@nexus.community",
      caption: "Magic happens when great minds connect. #Networking",
      likes: "8.9k",
      comments: "432",
      rotation: 6,
      y: 40,
    },
  ];

  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden min-h-screen flex flex-col items-center justify-center">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container mx-auto text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-noire border border-primary/30 text-primary text-xs font-bold tracking-widest uppercase mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            The Future of Social Connection
          </span>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60">
            Connect Beyond <br />
            <span className="text-gradient-gold italic">Dimensions</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-12 font-body font-light leading-relaxed">
            Morra isn't just an app. It's an immersive social ecosystem where your
            digital presence feels as real as your physical one. Share, connect, and thrive.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAuthClick("signup")}
              className="group relative px-8 py-4 bg-primary text-primary-foreground font-bold rounded-full overflow-hidden shadow-glow-gold transition-all duration-300"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 glass-noire border border-border/50 text-foreground font-bold rounded-full hover:bg-muted/30 transition-all duration-300"
            >
              Learn More
            </motion.button>
          </div>
        </motion.div>

        {/* Three Cards UI like Instagram */}
        <div className="relative flex justify-center items-center mt-8 mb-16 w-full max-w-5xl mx-auto">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 100, rotate: card.rotation }}
              animate={{ opacity: 1, y: card.y, rotate: card.rotation, scale: card.scale || 1 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className={`relative w-60 md:w-64 glass-noire rounded-[2rem] overflow-hidden border border-border/30 shadow-noire-elevated group cursor-pointer ${index !== 1 ? 'hidden md:block' : ''}`}
              style={{ zIndex: card.zIndex || 5, transformStyle: "preserve-3d" }}
              whileHover={{
                y: card.y - 10,
                rotate: 0,
                scale: (card.scale || 1) + 0.03,
                transition: { duration: 0.4 }
              }}
            >
              {/* Card Header */}
              <div className="p-3 flex items-center justify-between border-b border-border/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent overflow-hidden border border-white/10">
                    <img src={`https://i.pravatar.cc/150?u=${card.user}`} alt={card.user} />
                  </div>
                  <div className="text-left leading-tight">
                    <p className="text-[12px] font-bold tracking-tight text-white">{card.user}</p>
                    <p className="text-[9px] text-muted-foreground font-mono">@{card.handle.split('@')[1]}</p>
                  </div>
                </div>
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              </div>

              {/* Card Content (Image) */}
              <div className="aspect-square overflow-hidden relative">
                <img
                  src={card.image}
                  alt={card.caption}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Card Interaction */}
              <div className="p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Heart className="w-4 h-4 text-muted-foreground hover:text-red-500 transition-colors" />
                    <MessageCircle className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                    <Share2 className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold mb-0.5 tracking-tight">{card.likes} likes</p>
                  <p className="text-[11px] leading-tight line-clamp-2">
                    <span className="font-bold mr-1">@{card.handle.split('@')[1]}</span>
                    <span className="text-muted-foreground">{card.caption}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Impact Subtext & Secondary CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-12 flex flex-col items-center"
          >
            <p className="text-xl md:text-2xl text-muted-foreground font-display italic mb-10 max-w-xl">
              "A social network where your voice and growth matter."
            </p>

            <div className="flex flex-col items-center gap-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAuthClick("signup")}
                className="px-10 py-4 bg-primary text-primary-foreground font-bold rounded-full shadow-glow-gold transition-all"
              >
                Get Started
              </motion.button>

              <button
                onClick={() => onAuthClick("login")}
                className="text-sm font-bold text-muted-foreground hover:text-foreground transition-all flex items-center gap-2 group"
              >
                Already have an account? <span className="text-primary group-hover:underline">Log in</span>
              </button>
            </div>

            {/* Subtle Reasonings - Visualizing 'Why this works' */}
            <div className="mt-16 grid grid-cols-2 gap-8 md:gap-16 opacity-40">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2">Clear Value</span>
                <p className="text-xs italic">Create + Earn</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2">No Overload</span>
                <p className="text-xs italic">Immersive & Focused</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
