import Navbar from "@/components/noire/Navbar";
import MobileBottomNav from "@/components/noire/MobileBottomNav";
import HeroSection from "@/components/noire/HeroSection";
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
    <main className="relative min-h-screen bg-background overflow-x-hidden content-shift">
      <Navbar onAuthClick={handleAuthClick} />
      <HeroSection onAuthClick={handleAuthClick} />
      <MobileBottomNav onAuthClick={handleAuthClick} />
    </main>
  );
};

export default Index;
