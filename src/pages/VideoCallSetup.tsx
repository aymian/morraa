import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Video, ShieldCheck, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/noire/Navbar";
import { useCall } from "@/components/calling/CallProvider";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { onAuthStateChanged } from "firebase/auth";

const VideoCallSetup = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { initiateCall } = useCall();
    const userId = searchParams.get("userId");
    const type = searchParams.get("type") || "video";

    const [isInitializing, setIsInitializing] = useState(false);
    const [targetUser, setTargetUser] = useState<any>(null);
    const [isPermissionsGranted, setIsPermissionsGranted] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            setIsAuthenticated(!!user);
            if (!user) {
                toast({
                    title: "Authentication Required",
                    description: "Please log in to make calls.",
                    variant: "destructive"
                });
            }
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (userId) {
            getDoc(doc(db, "users", userId)).then(snap => {
                if (snap.exists()) setTargetUser(snap.data());
            });
        }
    }, [userId]);

    const requestPermissions = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: type === 'video',
                audio: true
            });
            // Stop the test stream to release the camera/mic
            stream.getTracks().forEach(track => track.stop());
            setIsPermissionsGranted(true);
        } catch (err) {
            console.error("Permission denied:", err);
            toast({
                title: "Hardware Access Required",
                description: "Please enable camera and microphone access to continue.",
                variant: "destructive"
            });
        }
    };

    const handleStartCall = async () => {
        if (!isAuthenticated) {
            toast({
                title: "Authentication Required",
                description: "Please log in to make calls.",
                variant: "destructive"
            });
            return;
        }

        if (userId) {
            setIsInitializing(true);
            try {
                await initiateCall(userId, type as any);
            } catch (error: any) {
                console.error("Call initiation error:", error);
                
                let errorMessage = error.message || "The encrypted channel could not be verified. Please try again.";
                
                if (error.message?.includes("Not authenticated")) {
                    errorMessage = "You must be logged in to make calls.";
                } else if (error.code === "permission-denied") {
                    errorMessage = "Permission denied. Please check Firestore rules.";
                }

                toast({
                    title: "Frequency Sync Failed",
                    description: errorMessage,
                    variant: "destructive"
                });
                setIsInitializing(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-noire-hero text-white flex flex-col items-center justify-center p-6 pt-24">
            <Navbar logoOnly />

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full glass-noire rounded-[3rem] border border-white/5 p-12 text-center"
            >
                <div className="relative mx-auto w-32 h-32 mb-8">
                    <div className="w-full h-full rounded-[2.5rem] overflow-hidden border border-white/10 p-1 bg-gradient-to-br from-white/10 to-transparent">
                        <img
                            src={targetUser?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
                            className="w-full h-full object-cover rounded-[2rem]"
                        />
                    </div>
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 bg-primary rounded-[2.5rem] blur-2xl -z-10"
                    />
                </div>

                <h1 className="text-3xl font-display font-bold mb-2">Initialize Session</h1>
                <p className="text-muted-foreground text-sm uppercase tracking-[0.2em] font-bold mb-12">
                    {targetUser?.fullName || "Aura Identity"}
                </p>

                <div className="grid grid-cols-1 gap-4 mb-12">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 text-left">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">Encryption Active</p>
                            <p className="text-[10px] text-muted-foreground">E2E Secure Frequency</p>
                        </div>
                    </div>
                </div>

                {!isPermissionsGranted ? (
                    <Button
                        onClick={requestPermissions}
                        className="w-full h-16 rounded-2xl bg-white/10 hover:bg-white text-white hover:text-black font-bold uppercase tracking-widest transition-all"
                    >
                        Check Hardware
                    </Button>
                ) : (
                    <Button
                        disabled={isInitializing}
                        onClick={handleStartCall}
                        className="w-full h-16 rounded-2xl bg-primary text-black font-bold uppercase tracking-widest shadow-glow-gold hover:scale-105 transition-all flex items-center justify-center gap-3"
                    >
                        {isInitializing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            type === 'video' ? <Video size={20} /> : <Phone size={20} />
                        )}
                        {isInitializing ? "Connecting..." : "Establish Pulse"}
                    </Button>
                )}

                <button
                    onClick={() => navigate(-1)}
                    className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-colors"
                >
                    Abort Connection
                </button>
            </motion.div>
        </div>
    );
};

export default VideoCallSetup;
