import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    Sparkles,
    Shield,
    User,
    Calendar,
    Phone,
    CheckCircle2,
    Camera,
    ArrowRight,
    Share2,
    Bell,
    Heart,
    TrendingUp,
    DollarSign,
    Briefcase,
    AlertCircle,
    Loader2
} from "lucide-react";
import NoireLogo from "@/components/noire/NoireLogo";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, getDoc, collection, getDocs, limit, serverTimestamp, query, where, setDoc, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

type OnboardingStep =
    | 'splash'
    | 'value-prop'
    | 'framing'
    | 'birthday'
    | 'phone'
    | 'otp'
    | 'username'
    | 'gender'
    | 'bio'
    | 'photo'
    | 'monetization'
    | 'safety'
    | 'follows'
    | 'invite'
    | 'notifications'
    | 'welcome';

const Onboarding = () => {
    const [step, setStep] = useState<OnboardingStep>('splash');
    const [progress, setProgress] = useState(0);
    const [userData, setUserData] = useState({
        birthday: '',
        phone: '',
        otp: '',
        username: '',
        gender: '',
        bio: '',
        photo: null as string | null,
    });
    const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
    const [suggestedLoading, setSuggestedLoading] = useState(false);
    const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());

    const navigate = useNavigate();
    const { toast } = useToast();

    // Progress logic
    const stepsList: OnboardingStep[] = [
        'splash', 'value-prop', 'framing', 'birthday', 'phone', 'otp',
        'username', 'gender', 'bio', 'photo', 'monetization',
        'safety', 'follows', 'invite', 'notifications', 'welcome'
    ];

    useEffect(() => {
        const currentIndex = stepsList.indexOf(step);
        setProgress(((currentIndex + 1) / stepsList.length) * 100);
    }, [step]);

    // Handle splash auto-transition
    useEffect(() => {
        if (step === 'splash') {
            const timer = setTimeout(() => setStep('value-prop'), 2500);
            return () => clearTimeout(timer);
        }
    }, [step]);

    const updateProfileInFirebase = async (data: any) => {
        const user = auth.currentUser;
        if (user) {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, data);
        }
    };

    const saveAllProfileData = async (complete: boolean = false) => {
        const user = auth.currentUser;
        if (!user) return;
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
            birthday: userData.birthday,
            phone: userData.phone,
            username: userData.username,
            gender: userData.gender,
            bio: userData.bio,
            photo: userData.photo,
            onboardingComplete: complete ? true : undefined,
            onboardingCompletedAt: complete ? serverTimestamp() : undefined,
        });
    };

    // Load real users for follows step
    useEffect(() => {
        const loadUsers = async () => {
            if (step !== 'follows') return;
            setSuggestedLoading(true);
            try {
                const userCol = collection(db, "users");
                const q = query(userCol, limit(6)); // Fetch a few more to filter out self
                const snap = await getDocs(q);
                
                const listPromises = snap.docs.map(async (d) => {
                    const userData = d.data();
                    // Fetch real follower count
                    const followersSnap = await getDocs(collection(db, "users", d.id, "followers"));
                    return { 
                        id: d.id, 
                        ...userData,
                        followerCount: followersSnap.size
                    };
                });
                
                const list = await Promise.all(listPromises);
                setSuggestedUsers(list.filter(u => u.id !== auth.currentUser?.uid));
            } catch (e) {
                console.error("Error loading users:", e);
                setSuggestedUsers([]);
            } finally {
                setSuggestedLoading(false);
            }
        };
        loadUsers();
    }, [step]);

    const handleFollow = async (targetUser: any) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        // Optimistic update
        const newFollowed = new Set(followedUsers);
        newFollowed.add(targetUser.id);
        setFollowedUsers(newFollowed);

        try {
            const followRef = doc(db, "users", currentUser.uid, "following", targetUser.id);
            const followerRef = doc(db, "users", targetUser.id, "followers", currentUser.uid);

            await setDoc(followRef, { timestamp: serverTimestamp() });
            
            // Defensive write for follower
            try {
                await setDoc(followerRef, { timestamp: serverTimestamp() });
            } catch (err) {
                console.warn("Follower mirrored write rejected:", err);
            }

            // Create notification
            await addDoc(collection(db, "notifications"), {
                type: "follow",
                fromUserId: currentUser.uid,
                fromUsername: userData.username || currentUser.displayName || "New User",
                fromUserImage: userData.photo || currentUser.photoURL,
                toUserId: targetUser.id,
                createdAt: serverTimestamp(),
                message: `${userData.username || "Someone"} started following you.`
            });

            toast({ title: "Following", description: `You are now following ${targetUser.username || "this user"}` });

        } catch (error) {
            console.error("Follow error:", error);
            // Revert optimistic update on error
            newFollowed.delete(targetUser.id);
            setFollowedUsers(new Set(newFollowed));
            toast({ variant: "destructive", title: "Error", description: "Failed to follow user." });
        }
    };

    const handleFollowAll = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            nextStep();
            return;
        }

        const usersToFollow = suggestedUsers.filter(u => !followedUsers.has(u.id));
        if (usersToFollow.length === 0) {
            nextStep();
            return;
        }

        // Optimistic update all
        const newFollowed = new Set(followedUsers);
        usersToFollow.forEach(u => newFollowed.add(u.id));
        setFollowedUsers(newFollowed);

        // Process in parallel
        await Promise.all(usersToFollow.map(u => handleFollow(u)));
        
        nextStep();
    };

    // Check username availability
    useEffect(() => {
        const checkAvailability = async () => {
            if (step !== 'username') return;

            if (!userData.username || userData.username.length < 3) {
                setIsUsernameAvailable(false);
                setUsernameError(null);
                return;
            }

            setIsCheckingUsername(true);
            setUsernameError(null);
            setIsUsernameAvailable(false);

            try {
                // Ensure only alphanumeric + underscore
                if (!/^[a-z0-9_]+$/.test(userData.username)) {
                    setUsernameError("Only letters, numbers, and underscores allowed");
                    setIsUsernameAvailable(false);
                    setIsCheckingUsername(false);
                    return;
                }

                const q = query(collection(db, "users"), where("username", "==", userData.username));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    const isSelf = snapshot.docs[0].id === auth.currentUser?.uid;
                    if (isSelf) {
                        setIsUsernameAvailable(true);
                    } else {
                        setUsernameError("Username is already taken");
                        setIsUsernameAvailable(false);
                    }
                } else {
                    setIsUsernameAvailable(true);
                }
            } catch (err) {
                console.error("Error checking username:", err);
                setUsernameError("Error checking availability");
            } finally {
                setIsCheckingUsername(false);
            }
        };

        const timeoutId = setTimeout(checkAvailability, 500);
        return () => clearTimeout(timeoutId);
    }, [userData.username, step]);

    const nextStep = () => {
        const currentIndex = stepsList.indexOf(step);
        if (currentIndex < stepsList.length - 1) {
            setStep(stepsList[currentIndex + 1]);
        }
    };

    const prevStep = () => {
        const currentIndex = stepsList.indexOf(step);
        if (currentIndex > 0) {
            setStep(stepsList[currentIndex - 1]);
        }
    };

    const containerVariants = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
    };

    // ---------------- UI COMPONENTS FOR EACH STEP -----------------

    const SplashScreen = () => (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="mb-8"
            >
                <NoireLogo size={120} />
            </motion.div>
            <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-4xl font-display font-bold tracking-tighter"
            >
                MORRA
            </motion.h2>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-muted-foreground uppercase tracking-[0.3em] text-xs mt-2"
            >
                The Premium Social Ecosystem
            </motion.p>
        </div>
    );

    const ValueProp = () => (
        <div className="flex flex-col items-center justify-center text-center space-y-8 max-w-lg mx-auto py-12">
            <div className="space-y-4">
                <h2 className="text-5xl font-display font-bold">Create. Connect. Earn.</h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                    The first social ecosystem built for visionaries, professional creators, and the leaders of tomorrow.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 w-full pt-8">
                {[
                    { icon: Sparkles, title: "Pure Quality", desc: "No noise, just high-value connection." },
                    { icon: Shield, title: "Total Safety", desc: "AI-powered spam protection at every turn." },
                    { icon: DollarSign, title: "Monetization", desc: "Earn from as few as 350 followers." }
                ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 text-left p-4 glass-noire border border-white/5 rounded-2xl">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <item.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
                className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-glow-gold flex items-center justify-center gap-2 group mt-8"
            >
                Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
        </div>
    );

    const Framing = () => (
        <div className="flex flex-col items-center justify-center text-center space-y-12 max-w-md mx-auto py-12">
            <div className="space-y-4">
                <h3 className="text-3xl font-display font-bold">Let's set up your Morra identity</h3>
                <p className="text-muted-foreground">We need a few details to build your world.</p>
            </div>

            <div className="space-y-6 w-full text-left">
                {[
                    { text: "Your profile helps people trust and follow you" },
                    { text: "Your phone keeps your account ultra-secure" },
                    { text: "Your birthday ensures a fair experience for all" }
                ].map((item, i) => (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.3 }}
                        key={i}
                        className="flex items-center gap-4"
                    >
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <p className="text-foreground/80 font-medium">{item.text}</p>
                    </motion.div>
                ))}
            </div>

            <button onClick={nextStep} className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl transition-all h-[56px]">
                Continue
            </button>
        </div>
    );

    const BirthdayStep = () => (
        <div className="flex flex-col items-center justify-center space-y-8 max-w-md mx-auto py-12">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-3xl font-display font-bold">When is your birthday?</h3>
                <p className="text-sm text-muted-foreground">We use this to keep Morra safe and age-appropriate.</p>
            </div>

            <div className="w-full space-y-6">
                <input
                    type="date"
                    value={userData.birthday}
                    onChange={(e) => setUserData({ ...userData, birthday: e.target.value })}
                    className="w-full p-5 bg-muted/20 border border-white/5 rounded-2xl outline-none focus:border-primary/50 transition-all text-center text-xl font-bold font-display"
                />

                <div className="flex items-center justify-center gap-2 p-3 glass-noire border border-white/5 rounded-xl">
                    <Shield className="w-4 h-4 text-primary" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">🔒 Private. Never shown publicly.</p>
                </div>
            </div>

            <button
                disabled={!userData.birthday}
                onClick={nextStep}
                className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl disabled:opacity-50 transition-all"
            >
                Confirm Age
            </button>
        </div>
    );

    const PhoneStep = () => (
        <div className="flex flex-col items-center justify-center space-y-8 max-w-md mx-auto py-12">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
                <Phone className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-3xl font-display font-bold">Trust starts here</h3>
                <p className="text-sm text-muted-foreground">Enter your phone to protect Morra from spam & bots.</p>
            </div>

            <div className="w-full space-y-4">
                <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">+</span>
                    <input
                        type="tel"
                        placeholder="Mobile Number"
                        value={userData.phone}
                        onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                        className="w-full pl-8 pr-5 py-4 bg-muted/10 border border-white/5 rounded-2xl focus:border-primary/50 outline-none transition-all text-lg font-bold"
                    />
                </div>
                <p className="text-[10px] text-center text-muted-foreground/60 px-4">
                    Note: Your number is used for verification and protection. We never share or sell your personal data.
                </p>
            </div>

            <button
                disabled={!userData.phone}
                onClick={nextStep}
                className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl disabled:opacity-50"
            >
                Verify Phone
            </button>
        </div>
    );

    const OtpStep = () => (
        <div className="flex flex-col items-center justify-center space-y-8 max-w-md mx-auto py-12">
            <div className="text-center space-y-2">
                <h3 className="text-3xl font-display font-bold">Check your messages</h3>
                <p className="text-sm text-muted-foreground">We sent a verification code to +{userData.phone}</p>
            </div>

            <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <input
                        key={i}
                        maxLength={1}
                        className="w-12 h-14 bg-muted/20 border border-white/10 rounded-xl text-center text-2xl font-bold outline-none focus:border-primary transition-all"
                    />
                ))}
            </div>

            <div className="flex flex-col gap-4 w-full">
                <button
                    onClick={async () => {
                        // Mock success
                        toast({ title: "Verified ✔", description: "Identity confirmed." });
                        await updateProfileInFirebase({ phoneVerified: true });
                        nextStep();
                    }}
                    className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl"
                >
                    Verify
                </button>
                <button onClick={nextStep} className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">
                    Skip verification
                </button>
            </div>
        </div>
    );

    const UsernameStep = () => (
        <div className="flex flex-col items-center justify-center space-y-8 max-w-md mx-auto py-12">
            <div className="text-center space-y-2">
                <h3 className="text-3xl font-display font-bold">Claim your identity</h3>
                <p className="text-sm text-muted-foreground">This is how the Morra community finds you.</p>
            </div>

            <div className="w-full space-y-4">
                <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-bold">@</span>
                    <input
                        type="text"
                        placeholder="username"
                        value={userData.username}
                        onChange={(e) => {
                            setUserData({ ...userData, username: e.target.value.toLowerCase() });
                        }}
                        className={`w-full pl-10 pr-12 py-4 bg-muted/10 border rounded-2xl outline-none transition-all text-lg font-bold ${
                            usernameError ? 'border-red-500/50 focus:border-red-500' : 'border-white/5 focus:border-primary/50'
                        }`}
                    />
                    {isCheckingUsername ? (
                        <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 animate-spin" />
                    ) : isUsernameAvailable ? (
                        <CheckCircle2 className="absolute right-5 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />
                    ) : null}
                </div>

                {usernameError && (
                    <p className="text-xs text-red-500 font-bold px-4">{usernameError}</p>
                )}

                <div className="flex flex-wrap gap-2">
                    {['.eth', '_creator', '.official', '.morra'].map(suf => (
                        <button
                            key={suf}
                            onClick={() => setUserData({ ...userData, username: userData.username + suf })}
                            className="text-[10px] font-bold px-3 py-1 rounded-full border border-white/10 text-muted-foreground hover:border-primary/50 transition-colors"
                        >
                            +{suf}
                        </button>
                    ))}
                </div>

                <div className="space-y-1.5 p-4 bg-white/5 rounded-2xl border border-white/5 text-[10px] text-muted-foreground">
                    <p className="font-bold text-foreground">Identity Rules:</p>
                    <p>• Only letters, numbers, and underscores</p>
                    <p>• Unique across the ecosystem</p>
                    <p>• Represent your personal or brand vision</p>
                </div>
            </div>

            <button
                disabled={!userData.username || !isUsernameAvailable || isCheckingUsername}
                onClick={async () => {
                    await updateProfileInFirebase({ username: userData.username });
                    nextStep();
                }}
                className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isCheckingUsername ? 'Checking...' : 'Continue'}
            </button>
        </div>
    );

    const GenderStep = () => (
        <div className="flex flex-col items-center justify-center space-y-10 max-w-md mx-auto py-12">
            <div className="text-center space-y-2">
                <h3 className="text-3xl font-display font-bold">Personalize your feed</h3>
                <p className="text-sm text-muted-foreground">This helps us tailor your experience.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 w-full">
                {['Male', 'Female', 'Prefer not to say'].map((g) => (
                    <button
                        key={g}
                        onClick={() => setUserData({ ...userData, gender: g })}
                        className={`p-5 rounded-2xl border font-bold transition-all text-left flex items-center justify-between ${userData.gender === g
                            ? 'bg-primary text-primary-foreground border-primary shadow-glow-gold'
                            : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                            }`}
                    >
                        {g}
                        {userData.gender === g && <CheckCircle2 className="w-5 h-5" />}
                    </button>
                ))}
            </div>

            <div className="flex flex-col gap-4 w-full">
                <button
                    disabled={!userData.gender}
                    onClick={nextStep}
                    className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl disabled:opacity-50"
                >
                    Continue
                </button>
            </div>
        </div>
    );

    const BioStep = () => (
        <div className="flex flex-col items-center justify-center space-y-8 max-w-md mx-auto py-12">
            <div className="text-center space-y-2">
                <h3 className="text-3xl font-display font-bold">Express yourself</h3>
                <p className="text-sm text-muted-foreground">A good bio increases follows by up to 40%.</p>
            </div>

            <div className="w-full space-y-4">
                <div className="relative">
                    <textarea
                        placeholder="Who are you? (e.g., Visionary | Creator | Hustling daily)"
                        value={userData.bio}
                        onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
                        maxLength={150}
                        className="w-full h-32 p-5 bg-muted/10 border border-white/5 rounded-2xl focus:border-primary/50 outline-none transition-all text-base resize-none"
                    />
                    <div className="absolute bottom-4 right-4 text-[10px] text-muted-foreground">
                        {userData.bio.length}/150
                    </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                    <Heart className="w-4 h-4 text-primary" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Identity Moment: Sharing life, one post at a time.</p>
                </div>
            </div>

            <button
                onClick={nextStep}
                className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl"
            >
                Finish Bio
            </button>
        </div>
    );

    const PhotoStep = () => (
        <div className="flex flex-col items-center justify-center space-y-10 max-w-md mx-auto py-12">
            <div className="text-center space-y-2">
                <h3 className="text-3xl font-display font-bold">Visual trust</h3>
                <p className="text-sm text-muted-foreground">Profiles with photos get more trust and followers.</p>
            </div>

            <div className="relative group">
                <div className="w-40 h-40 rounded-full bg-muted/20 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden">
                    {userData.photo ? (
                        <img src={userData.photo} className="w-full h-full object-cover" />
                    ) : (
                        <Camera className="w-12 h-12 text-muted-foreground" />
                    )}
                </div>
                <button
                    className="absolute bottom-2 right-2 p-3 bg-primary text-primary-foreground rounded-full shadow-lg"
                    onClick={() => setUserData({ ...userData, photo: `https://api.dicebear.com/7.x/identicon/svg?seed=${userData.username || 'morra'}` })}
                >
                    <Sparkles className="w-5 h-5" />
                </button>
            </div>

            <div className="flex flex-col gap-4 w-full">
                {userData.photo && (
                    <p className="text-center text-green-500 font-bold text-sm">✔ Looking good!</p>
                )}
                <label className="w-full py-3 glass-noire border border-dashed border-white/10 rounded-2xl text-center cursor-pointer hover:border-primary/50">
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => setUserData({ ...userData, photo: reader.result as string });
                            reader.readAsDataURL(file);
                        }}
                    />
                    <span className="text-sm text-muted-foreground">Upload from device</span>
                </label>
                <button
                    disabled={!userData.photo}
                    onClick={nextStep}
                    className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl disabled:opacity-50"
                >
                    Set Photo
                </button>
            </div>
        </div>
    );

    const MonetizationStep = () => (
        <div className="flex flex-col items-center justify-center space-y-8 max-w-md mx-auto py-12">
            <div className="text-center space-y-4">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-accent mx-auto flex items-center justify-center"
                >
                    <DollarSign className="w-10 h-10 text-primary-foreground" />
                </motion.div>
                <h3 className="text-4xl font-display font-bold">Earn on Morra</h3>
                <p className="text-muted-foreground">Your growth is rewarded from Day 1.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 w-full">
                {[
                    { icon: DollarSign, title: "Earn from 350 Followers", desc: "Start making money once your community grows." },
                    { icon: CheckCircle2, title: "Get Verified", desc: "Verified creators earn more trust and massive reach." },
                    { icon: Shield, title: "Zero Spam Policy", desc: "Bots and fake accounts are removed automatically." }
                ].map((item, idx) => (
                    <div key={idx} className="p-5 glass-noire border border-white/5 rounded-2xl space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                            <item.icon className="w-4 h-4 text-primary" />
                            <p className="font-bold text-sm tracking-tight">{item.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                ))}
            </div>

            <button onClick={nextStep} className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-glow-gold">
                I'm in
            </button>
        </div>
    );

    const SafetyStep = () => (
        <div className="flex flex-col items-center justify-center space-y-12 max-w-md mx-auto py-12">
            <div className="text-center space-y-4">
                <h3 className="text-3xl font-display font-bold">Safe & Fair Platform</h3>
                <p className="text-muted-foreground">Morra is built for real people, no bots, no bias.</p>
            </div>

            <div className="space-y-6 w-full text-left">
                {[
                    "Real-time AI spam detection",
                    "Fake accounts removed within ~30 minutes",
                    "Fair & transparent monetization rules",
                    "Manual review of all community reports"
                ].map((text, i) => (
                    <div key={i} className="flex items-start gap-4">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                        <p className="text-foreground/90 font-medium leading-tight">{text}</p>
                    </div>
                ))}
            </div>

            <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Morra is built for real people.</p>
            </div>

            <button onClick={nextStep} className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl">
                Continue
            </button>
        </div>
    );

    const FollowsStep = () => (
        <div className="flex flex-col items-center justify-center space-y-8 max-w-md mx-auto py-12">
            <div className="text-center space-y-2">
                <h3 className="text-3xl font-display font-bold">Find your circle</h3>
                <p className="text-sm text-muted-foreground">Following people gets you started instantly.</p>
            </div>

            <div className="w-full space-y-3">
                {suggestedLoading && <p className="text-center text-muted-foreground text-sm">Loading real users…</p>}
                {!suggestedLoading && suggestedUsers.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm">No users yet. You can skip.</p>
                )}
                {suggestedUsers.map((user) => {
                    const isFollowing = followedUsers.has(user.id);
                    return (
                        <div key={user.id} className="flex items-center justify-between p-4 glass-noire border border-white/5 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/5 overflow-hidden">
                                    <img src={user.photo || `https://i.pravatar.cc/100?u=${user.username || user.id}`} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold">{user.username || user.fullName || "Morra User"}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {user.followerCount !== undefined ? `${user.followerCount} followers` : (user.bio ? user.bio.slice(0, 40) : "New to Morra")}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleFollow(user)}
                                disabled={isFollowing}
                                className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    isFollowing 
                                    ? "bg-white/10 text-muted-foreground cursor-default" 
                                    : "bg-primary text-primary-foreground hover:opacity-90"
                                }`}
                            >
                                {isFollowing ? "Following" : "Follow"}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-col gap-4 w-full">
                <button onClick={handleFollowAll} className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl">
                    Follow All & Continue
                </button>
                <button onClick={nextStep} className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">
                    Skip
                </button>
            </div>
        </div>
    );

    const InviteStep = () => {
        const inviteUrl = `morra.io/invite/${userData.username || auth.currentUser?.uid || 'you'}`;

        return (
        <div className="flex flex-col items-center justify-center space-y-8 max-w-md mx-auto py-12">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
                <Share2 className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center space-y-4">
                <h3 className="text-3xl font-display font-bold">Grow faster together</h3>
                <p className="text-muted-foreground leading-relaxed">
                    Creators who invite friends grow 2x faster. Earn boosts and priority visibility.
                </p>
            </div>

            <div className="w-full glass-noire p-5 border border-white/10 rounded-2xl space-y-4 text-center">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Your Unique Invite Link</p>
                <div className="bg-black/40 p-3 rounded-xl border border-white/5 break-all text-xs font-mono text-primary">
                    {inviteUrl}
                </div>
                <button 
                    onClick={() => {
                        navigator.clipboard.writeText(`https://${inviteUrl}`);
                        toast({ title: "Copied", description: "Link copied to clipboard." });
                    }}
                    className="text-xs font-bold text-foreground underline underline-offset-4"
                >
                    Copy Link
                </button>
            </div>

            <div className="flex flex-col gap-4 w-full">
                <button onClick={nextStep} className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl">
                    Invite Friends
                </button>
                <button onClick={nextStep} className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">
                    Maybe Later
                </button>
            </div>
        </div>
        );
    };

    const NotificationStep = () => (
        <div className="flex flex-col items-center justify-center space-y-8 max-w-md mx-auto py-12">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4 animate-bounce-slow">
                <Bell className="w-12 h-12 text-primary shadow-glow-gold" />
            </div>
            <div className="text-center space-y-4">
                <h3 className="text-3xl font-display font-bold">Stay Connected</h3>
                <p className="text-muted-foreground leading-relaxed">
                    Receive real-time updates when people follow, engage, or reward your content.
                </p>
            </div>

            <div className="flex flex-col gap-4 w-full pt-8">
                <button onClick={nextStep} className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl">
                    Allow Notifications
                </button>
                <button onClick={nextStep} className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">
                    Not Now
                </button>
            </div>
        </div>
    );

    const WelcomeStep = () => (
        <div className="flex flex-col items-center justify-center space-y-12 max-w-md mx-auto py-12 text-center relative">
            {/* Confetti Particles */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0.5],
                            x: (Math.random() - 0.5) * 400,
                            y: (Math.random() - 0.5) * 400,
                            rotate: Math.random() * 360
                        }}
                        transition={{ duration: 2, delay: 0.2, repeat: Infinity, repeatDelay: 1 }}
                        className={`absolute w-2 h-2 rounded-sm ${['bg-primary', 'bg-accent', 'bg-white'][i % 3]}`}
                        style={{ left: '50%', top: '40%' }}
                    />
                ))}
            </div>

            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10, stiffness: 100 }}
            >
                <div className="w-32 h-32 rounded-full border-4 border-primary flex items-center justify-center bg-primary/5">
                    <CheckCircle2 className="w-20 h-20 text-primary" />
                </div>
            </motion.div>

            <div className="space-y-4">
                <h3 className="text-5xl font-display font-bold">Welcome, @{userData.username || 'Visionary'}</h3>
                <p className="text-muted-foreground text-xl">Your journey starts now.</p>
            </div>

            <div className="flex flex-col gap-4 w-full">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                        await saveAllProfileData(true);
                        navigate('/');
                    }}
                    className="w-full py-5 bg-primary text-primary-foreground font-bold rounded-2xl shadow-glow-gold"
                >
                    Explore Morra
                </motion.button>
                <button
                    onClick={() => navigate('/')}
                    className="text-xs font-bold text-muted-foreground uppercase tracking-widest"
                >
                    Create your first post
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#080808] text-white flex flex-col p-6 overflow-x-hidden pt-12">
            {/* Progress Header */}
            {step !== 'splash' && step !== 'welcome' && (
                <div className="fixed top-0 left-0 w-full p-4 z-50 bg-[#080808]/80 backdrop-blur-md">
                    <div className="max-w-md mx-auto flex items-center gap-4">
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-primary"
                            />
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                            Step {stepsList.indexOf(step) + 1} of {stepsList.length}
                        </p>
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col items-center justify-center relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        variants={containerVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full"
                    >
                        {step === 'splash' && SplashScreen()}
                        {step === 'value-prop' && ValueProp()}
                        {step === 'framing' && Framing()}
                        {step === 'birthday' && BirthdayStep()}
                        {step === 'phone' && PhoneStep()}
                        {step === 'otp' && OtpStep()}
                        {step === 'username' && UsernameStep()}
                        {step === 'gender' && GenderStep()}
                        {step === 'bio' && BioStep()}
                        {step === 'photo' && PhotoStep()}
                        {step === 'monetization' && MonetizationStep()}
                        {step === 'safety' && SafetyStep()}
                        {step === 'follows' && FollowsStep()}
                        {step === 'invite' && InviteStep()}
                        {step === 'notifications' && NotificationStep()}
                        {step === 'welcome' && WelcomeStep()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Trust Footer */}
            {step !== 'splash' && step !== 'welcome' && (
                <div className="py-8 flex justify-center opacity-30 text-[10px] font-bold uppercase tracking-[0.4em]">
                    Morra // Verified Identity Flow
                </div>
            )}
        </div>
    );
};

export default Onboarding;
