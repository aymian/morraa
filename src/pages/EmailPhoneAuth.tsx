import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Mail,
    Lock,
    User,
    Eye,
    EyeOff,
    ArrowRight,
    Shield,
} from "lucide-react";
import NoireLogo from "@/components/noire/NoireLogo";
import { auth, db } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const EmailPhoneAuth = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const type = (searchParams.get("type") as "login" | "signup") || "login";
    const refCode = searchParams.get("ref") || "";
    
    const [authMode, setAuthMode] = useState<"login" | "signup">(type);
    const [showPassword, setShowPassword] = useState(false);
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [referralCode, setReferralCode] = useState(refCode);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        setAuthMode(type);
        if (refCode) setReferralCode(refCode);
    }, [type, refCode]);

    const handleModeSwitch = (mode: "login" | "signup") => {
        setAuthMode(mode);
        setSearchParams({ type: mode });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (authMode === "signup") {
                // Email Validation: Only @gmail.com
                if (!identifier.toLowerCase().endsWith("@gmail.com")) {
                    toast({ 
                        title: "Registration Restricted", 
                        description: "Only @gmail.com addresses are currently accepted to prevent spam.", 
                        variant: "destructive" 
                    });
                    setIsLoading(false);
                    return;
                }

                const userCredential = await createUserWithEmailAndPassword(auth, identifier, password);
                const user = userCredential.user;

                // Referral Logic
                let initialEarnings = 0;
                let validReferrerId = null;

                if (referralCode && referralCode !== user.uid) {
                    try {
                        const referrerRef = doc(db, "users", referralCode);
                        const referrerSnap = await getDoc(referrerRef);

                        if (referrerSnap.exists()) {
                            validReferrerId = referralCode;
                            initialEarnings = 10; // Bonus for new user

                            // Credit Referrer (+5 points)
                            await updateDoc(referrerRef, {
                                earnings: increment(5),
                                referralPoints: increment(5),
                                referralCount: increment(1)
                            });
                        }
                    } catch (err) {
                        console.error("Referral processing error:", err);
                        // Continue signup even if referral fails
                    }
                }

                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    email: identifier,
                    fullName: fullName || "",
                    createdAt: serverTimestamp(),
                    emailVerified: false,
                    onboardingComplete: false,
                    earnings: initialEarnings,
                    referralPoints: initialEarnings, // Track referral bonus separately
                    referredBy: validReferrerId
                });

                await supabase.auth.signInWithOtp({
                    email: identifier,
                    options: { emailRedirectTo: `${window.location.origin}/onboarding` },
                });

                toast({ title: "Success", description: "Account created! Welcome to Morra." });
                navigate("/onboarding");
            } else {
                const userCredential = await signInWithEmailAndPassword(auth, identifier, password);
                const user = userCredential.user;

                // Show preloader experience while checking status
                setIsLoading(true);
                const userDoc = await getDoc(doc(db, "users", user.uid));

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    if (userData.onboardingComplete) {
                        toast({ title: "Welcome back!", description: "Sign in successful" });
                        navigate("/");
                    } else {
                        toast({ title: "Resume Setup", description: "Let's finish your Morra profile." });
                        navigate("/onboarding");
                    }
                } else {
                    toast({ title: "Welcome back!", description: "Sign in successful" });
                    navigate("/");
                }
            }
        } catch (error: any) {
            toast({ title: "Auth Error", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px] -z-10" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md glass-noire p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-noire-elevated relative overflow-hidden"
            >
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4 cursor-pointer" onClick={() => navigate("/")}>
                        <NoireLogo size={32} />
                    </div>
                    <h3 className="text-2xl font-display font-bold mb-1">
                        {authMode === "login" ? "Welcome Back" : "Create Account"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {authMode === "login" ? "Continue with your credentials" : "Join the premium community"}
                    </p>
                </div>

                {/* Mode Switcher */}
                <div className="flex p-1 bg-muted/20 border border-white/5 rounded-xl mb-8">
                    {(["login", "signup"] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => handleModeSwitch(mode)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${authMode === mode ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {mode === "login" ? "Login" : "Join"}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <AnimatePresence mode="wait">
                    </AnimatePresence>

                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="email"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="Email address"
                            className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-muted/10 border border-white/5 focus:border-primary/50 outline-none transition-all text-sm"
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full pl-10 pr-10 py-3.5 rounded-xl bg-muted/10 border border-white/5 focus:border-primary/50 outline-none transition-all text-sm"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    <AnimatePresence>
                        {authMode === "signup" && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="relative mt-2">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={referralCode}
                                        onChange={(e) => setReferralCode(e.target.value)}
                                        placeholder="Referral Code (Optional)"
                                        className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-muted/10 border border-white/5 focus:border-primary/50 outline-none transition-all text-sm"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-glow-gold flex items-center justify-center gap-2 group transition-all text-sm"
                        disabled={isLoading}
                    >
                        {isLoading ? "Verifying..." : (
                            <>
                                {authMode === "login" ? "Enter Morra" : "Begin Experience"}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </motion.button>
                </form>

                <div className="mt-8 flex flex-col items-center gap-4">
                    <button
                        onClick={() => navigate("/login")}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors font-bold uppercase tracking-widest"
                    >
                        ← Back to Quick Options
                    </button>

                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Shield className="w-3 h-3 text-green-500" />
                        <span>Secured Session Encryption Active</span>
                    </div>
                </div>
            </motion.div>

            {/* Back to Home Icon */}
            <motion.button
                onClick={() => navigate("/")}
                className="absolute top-8 left-8 p-3 rounded-full glass-noire text-muted-foreground hover:text-foreground transition-all group"
                whileHover={{ x: -4 }}
            >
                <ArrowRight className="w-5 h-5 rotate-180" />
            </motion.button>
        </div>
    );
};

export default EmailPhoneAuth;
