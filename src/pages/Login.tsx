import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  ArrowRight,
  Shield,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react";
import NoireLogo from "@/components/noire/NoireLogo";
import { auth, db } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

/**
 * MORRA Login Page - Social First & Premium
 */

type AuthMode = "login" | "signup";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.49 17.306c-.215.353-.672.464-1.025.25-2.863-1.748-6.467-2.144-10.713-1.174-.403.092-.806-.164-.898-.568-.092-.403.164-.806.568-.898 4.646-1.064 8.636-.6 11.817 1.341.353.215.464.672.25 1.025zm1.467-3.259c-.271.442-.843.582-1.285.311-3.277-2.015-8.269-2.6-12.143-1.423-.497.151-1.025-.133-1.176-.63-.151-.497.133-1.025.63-1.176 4.436-1.35 9.948-.68 13.66 1.6 0 .445-.274.845-.586 1.318-.001zm.135-3.414C15.203 8.12 8.503 7.897 4.593 9.082c-.611.185-1.25-.164-1.434-.775-.184-.611.164-1.25.775-1.434 4.496-1.365 11.903-1.107 16.381 1.551.55.326.732 1.035.405 1.585-.327.55-1.036.732-1.586.405z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M12.152 6.896c-.341 0-1.121-.194-2.126-.194-1.175 0-2.433.882-3.13 1.956-1.152 1.76-1.152 4.156-.379 6.225.378 1.012 1.06 2.016 1.956 2.593.44.285 1.01.441 1.63.441.743 0 1.252-.441 2.025-.441.773 0 1.25.441 2.024.441s1.512-.441 1.956-1.011c.783-.997 1.152-2.112 1.252-2.316-.015-.03-.984-.378-1.555-1.109-.571-.734-.875-1.637-.875-2.64 0-1.076.326-1.958.986-2.613.661-.655 1.488-1.016 1.488-1.016-.076-.106-.411-.531-1.077-.966-.667-.435-1.745-.733-3.175-.365zm2.348-2.67c.72-.88 1.134-1.986 1.134-3.125 0-.154-.014-.308-.041-.462-1.027.041-2.022.44-2.73 1.189-.72.88-1.134 1.986-1.134 3.125 0 .154.014.308.041.462.153 0 .307.014.46.014.87 0 1.763-.34 2.27-1.203z" />
  </svg>
);

const Login = () => {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const navigate = useNavigate();
  const { toast } = useToast();

  const cards = [
    { id: 1, image: "/assets/hero/lifestyle.png", user: "Alex Rivers", handle: "@arivers", rotation: -6, y: 10, scale: 0.8 },
    { id: 2, image: "/assets/hero/creative.png", user: "Sarah Chen", handle: "@sarah.studio", rotation: 0, y: 0, scale: 0.9, zIndex: 10 },
    { id: 3, image: "/assets/hero/community.png", user: "The Nexus", handle: "@nexus", rotation: 6, y: 20, scale: 0.8 },
  ];

  const handleSocialAuth = async (provider: string) => {
    try {
      if (provider !== "Google") {
        toast({ title: "Coming Soon", description: `${provider} login will be active shortly.` });
        return;
      }
      const authProvider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, authProvider);
      const user = result.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        fullName: user.displayName || "",
        createdAt: serverTimestamp(),
      }, { merge: true });

      navigate("/");
    } catch (error: any) {
      toast({ title: "Social Auth Error", description: error.message, variant: "destructive" });
    }
  };

  const socialButtons = [
    {
      name: "Google",
      icon: GoogleIcon,
      bg: "bg-white text-black",
      hover: "hover:bg-gray-100",
      action: () => handleSocialAuth("Google")
    },
    {
      name: "X",
      icon: XIcon,
      bg: "bg-black text-white border border-white/20",
      hover: "hover:bg-white/5",
      action: () => handleSocialAuth("X")
    },
    {
      name: "Apple",
      icon: AppleIcon,
      bg: "bg-[#050505] text-white",
      hover: "hover:bg-black/80",
      action: () => handleSocialAuth("Apple")
    },
    {
      name: "Spotify",
      icon: SpotifyIcon,
      bg: "bg-[#1DB954] text-black",
      hover: "hover:bg-[#1ed760] hover:shadow-[0_0_20px_rgba(29,185,84,0.4)]",
      action: () => handleSocialAuth("Spotify"),
      className: "shadow-[0_0_15px_rgba(29,185,84,0.15)] animate-pulse-slow"
    },
    {
      name: "Email or Phone",
      icon: Mail,
      bg: "glass-noire text-foreground border border-white/10",
      hover: "hover:bg-white/5",
      action: () => navigate(`/email-phone?type=${authMode}`)
    },
  ];

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px] -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl glass-noire rounded-[2.5rem] border border-white/10 shadow-noire-elevated overflow-hidden grid lg:grid-cols-2"
        style={{ minHeight: "600px" }}
      >
        {/* LEFT COLUMN - PREVIEW UI */}
        <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-muted/5 relative overflow-hidden border-r border-white/5">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

          <div className="relative flex justify-center items-center w-full h-64 mb-12 scale-75 xl:scale-90">
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, x: 0, y: 50 }}
                animate={{
                  opacity: 1,
                  x: index === 0 ? -120 : index === 2 ? 120 : 0,
                  y: card.y,
                  rotate: card.rotation,
                  scale: card.scale
                }}
                whileHover={{
                  x: index === 0 ? -120 : index === 2 ? 120 : 0,
                  y: card.y - 15,
                  rotate: 0,
                  scale: (card.scale || 1) + 0.1,
                  zIndex: 20,
                  transition: { duration: 0.4, ease: "easeOut" }
                }}
                className="absolute w-56 glass-noire rounded-2xl overflow-hidden border border-white/10 shadow-xl cursor-pointer"
                style={{ zIndex: card.zIndex || 5, transformStyle: "preserve-3d" }}
              >
                <div className="p-2.5 flex items-center gap-2 border-b border-white/5">
                  <div className="w-6 h-6 rounded-full bg-primary/20 overflow-hidden text-[0] flex-shrink-0">
                    <img src={`https://i.pravatar.cc/100?u=${card.user}`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[10px] font-bold truncate flex-1">{card.user}</p>
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse flex-shrink-0" />
                </div>
                <div className="aspect-square relative overflow-hidden">
                  <img src={card.image} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                <div className="p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Heart className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500 transition-colors" />
                    <MessageCircle className="w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors" />
                    <Share2 className="w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="relative z-10 text-center max-w-sm">
            <h2 className="text-2xl font-display font-bold mb-4">The Premium Workspace</h2>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">
              Join Morra to access an elite space where visionaries share,
              collaborate, and build the future together.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN - AUTH FORM */}
        <div className="p-8 md:p-12 flex flex-col justify-center overflow-y-auto max-h-[90vh]">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <NoireLogo size={32} />
            </div>
            <h3 className="text-3xl font-display font-bold mb-2">
              {authMode === "login" ? "Welcome Back" : "Register"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {authMode === "login" ? "Enter the premium ecosystem" : "Start your professional journey"}
            </p>
          </div>

          {/* Mode Switcher - Now at Top Level */}
          <div className="flex p-1 bg-muted/20 border border-white/5 rounded-xl mb-6">
            {(["login", "signup"] as AuthMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setAuthMode(mode)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${authMode === mode ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {mode === "login" ? "Login" : "Join"}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {socialButtons.map((btn) => (
              <motion.button
                key={btn.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={btn.action}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold text-sm transition-all shadow-lg ${btn.bg} ${btn.hover} ${btn.className || ""}`}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <btn.icon />
                </div>
                <span className="flex-1">{authMode === "login" ? "Continue with" : "Sign up with"} {btn.name}</span>
                <ArrowRight className="w-4 h-4 opacity-50" />
              </motion.button>
            ))}
          </div>

          <div className="mt-10 flex justify-center items-center gap-2 text-[10px] text-muted-foreground font-body">
            <Shield className="w-3.5 h-3.5 text-green-500" />
            <span>End-to-end secured authentication enabled</span>
          </div>
        </div>
      </motion.div>

      {/* Back to Home Button */}
      <motion.button
        onClick={() => navigate("/")}
        className="absolute top-8 left-8 flex items-center gap-2 text-muted-foreground hover:text-foreground group"
        whileHover={{ x: -4 }}
      >
        <ArrowRight className="w-4 h-4 rotate-180" />
        <span className="text-xs font-bold uppercase tracking-widest leading-none">Back</span>
      </motion.button>
    </div>
  );
};

export default Login;
