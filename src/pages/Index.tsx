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
  const handleAuthClick = (action: "login" | "signup") => {
    window.location.href = `/login?action=${action}`;
  };

  return (
    <main className="relative min-h-screen bg-background overflow-x-hidden">
      <Navbar onAuthClick={handleAuthClick} />
      <HeroSection onAuthClick={handleAuthClick} />
      <MoodSection onAuthClick={handleAuthClick} />
      <SoundVisualization onAuthClick={handleAuthClick} />
      <AfrobeatSpotlight onAuthClick={handleAuthClick} />
      <CallToEmotion onAuthClick={handleAuthClick} />
      <Footer />
      <MobileBottomNav onAuthClick={handleAuthClick} />
      <div className="h-24 md:h-0" />
    </main>
  );
};

export default Index;
