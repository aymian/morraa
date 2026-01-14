import Navbar from "@/components/noire/Navbar";
import MobileBottomNav from "@/components/noire/MobileBottomNav";
import HeroSection from "@/components/noire/HeroSection";
import MoodSection from "@/components/noire/MoodSection";
import SoundVisualization from "@/components/noire/SoundVisualization";
import AfrobeatSpotlight from "@/components/noire/AfrobeatSpotlight";
import CallToEmotion from "@/components/noire/CallToEmotion";
import Footer from "@/components/noire/Footer";

/**
 * NOIRE Landing Page
 * A world-class, emotionally-driven music streaming platform landing page
 * 
 * Design Philosophy:
 * - Emotion-first, not feature-first
 * - Music as a mood, not a playlist
 * - Night, calm, soul, rhythm, intimacy
 * - Luxury, cinematic, minimal, bold
 */
const Index = () => {
  return (
    <main className="relative min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <Navbar />
      <MobileBottomNav />

      {/* Hero - Full viewport, cinematic */}
      <HeroSection />

      {/* Mood-Based Interaction - Emotion cards with parallax */}
      <MoodSection />

      {/* Sound Visualization - Abstract audio-wave animations */}
      <SoundVisualization />

      {/* Afrobeat Spotlight - Rhythmic, off-grid layout */}
      <AfrobeatSpotlight />

      {/* Call To Emotion - Poetic CTA */}
      <CallToEmotion />

      {/* Footer - Minimal, elite */}
      <Footer />

      {/* Bottom padding for mobile nav */}
      <div className="h-24 md:h-0" />
    </main>
  );
};

export default Index;
