import Navbar from "@/components/noire/Navbar";
import MobileBottomNav from "@/components/noire/MobileBottomNav";
import HeroSection from "@/components/noire/HeroSection";
import FloatingSidebar from "@/components/noire/FloatingSidebar";
import DashboardFeed from "@/components/noire/DashboardFeed";
import StoryTray from "@/components/noire/StoryTray";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

/**
 * MORRAA Landing Page / Dashboard
 */
const Index = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleAuthClick = (action: "login" | "signup") => {
    window.location.href = `/login?action=${action}`;
  };

  return (
    <main className={`relative min-h-screen bg-background text-foreground overflow-x-hidden ${user ? "content-shift" : ""}`}>
      <Navbar onAuthClick={handleAuthClick} showStories={!!user} />
      {user && <FloatingSidebar />}

      {user ? (
        <div className="pt-40 pb-24 flex flex-col items-center w-full">
          {/* Mobile Story Tray */}
          <div className="w-full md:hidden mb-2 pl-2">
            <StoryTray />
          </div>
          
          <DashboardFeed />
        </div>
      ) : (
        <HeroSection onAuthClick={handleAuthClick} />
      )}

      <MobileBottomNav onAuthClick={handleAuthClick} />
    </main>
  );
};

export default Index;
