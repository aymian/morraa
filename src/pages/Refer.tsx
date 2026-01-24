import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, CheckCircle, Users, Zap } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Navbar from "@/components/noire/Navbar";
import MobileBottomNav from "@/components/noire/MobileBottomNav";
import FloatingSidebar from "@/components/noire/FloatingSidebar";
import { useToast } from "@/hooks/use-toast";

const Refer = () => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                }
                setLoading(false);
            } else {
                navigate("/login");
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleCopyLink = () => {
        const inviteLink = `https://morraa.vercel.app/invite/${userData?.username || user?.uid}`;
        navigator.clipboard.writeText(inviteLink);
        toast({
            title: "Link Copied",
            description: "Share this with your friends to earn rewards.",
            className: "bg-[#0A0A0A] border border-[#FBBF24]/30 text-white"
        });
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-background text-foreground pb-24 content-shift">
            {user && <FloatingSidebar />}
            <Navbar />

            <main className="container mx-auto px-6 pt-32 max-w-4xl">
                <header className="mb-12 text-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-noire border border-primary/30 text-primary text-xs font-bold tracking-widest uppercase mb-6"
                    >
                        <Zap className="w-3.5 h-3.5" />
                        Grow Your Circle
                    </motion.div>
                    <h1 className="text-4xl md:text-6xl font-display font-bold mb-4">Refer & Earn</h1>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                        Invite creators to Morra and earn exclusive badges and visibility boosts.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-noire p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full" />
                        <Users className="w-10 h-10 text-primary mb-6" />
                        <h3 className="text-2xl font-bold mb-2">Community Growth</h3>
                        <p className="text-muted-foreground">Build your own tribe. When friends join using your link, you both get a visibility spike.</p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-noire p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-[50px] rounded-full" />
                        <CheckCircle className="w-10 h-10 text-accent mb-6" />
                        <h3 className="text-2xl font-bold mb-2">Verified Status</h3>
                        <p className="text-muted-foreground">Refer 5 active creators to fast-track your verification badge application.</p>
                    </motion.div>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-noire p-8 rounded-[2rem] border border-primary/20 text-center max-w-2xl mx-auto"
                >
                    <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Your Unique Invite Link</p>
                    
                    <div className="flex items-center gap-4 bg-black/40 p-2 pl-6 rounded-2xl border border-white/10 mb-6">
                        <span className="flex-1 text-left font-mono text-primary truncate">
                            morraa.vercel.app/invite/{userData?.username || user?.uid}
                        </span>
                        <button 
                            onClick={handleCopyLink}
                            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform flex items-center gap-2"
                        >
                            <Copy className="w-4 h-4" />
                            Copy
                        </button>
                    </div>

                    <p className="text-xs text-muted-foreground italic">
                        Limit: 50 invites per week. Quality over quantity.
                    </p>
                </motion.div>
            </main>

            <MobileBottomNav />
        </div>
    );
};

export default Refer;