import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
    ChevronLeft,
    MapPin,
    Users,
    Share2,
    Send,
    Lock,
    Globe,
    Search,
    Check,
    Loader2
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/noire/Navbar";

/**
 * STORY SHARE EXPERIENCE - "The Final Sync"
 * Dedicated screen for location tagging, audience selection, and direct sharing.
 */

const StoryShare = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [user, setUser] = useState<any>(null);
    const [isSharing, setIsSharing] = useState(false);

    // Data from previous screen
    const { mediaUrl, fileType, textOverlay, selectedMusic, selectedFile, duration } = location.state || {};

    // State for share options
    const [storyLocation, setStoryLocation] = useState("");
    const [audience, setAudience] = useState("Public");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) navigate('/login');
        });
        if (!mediaUrl && !selectedFile) navigate('/create');
        return () => unsubscribe();
    }, [navigate, mediaUrl, selectedFile]);

    const handleFinalShare = async () => {
        if (!user) return;
        setIsSharing(true);

        try {
            let finalMediaUrl = mediaUrl;

            // If we only have the blob from previous screen, upload it now
            if (selectedFile && !mediaUrl.startsWith('http')) {
                finalMediaUrl = await uploadToCloudinary(selectedFile, "morraa_stories");
            }

            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.exists() ? userSnap.data() : null;

            await addDoc(collection(db, "stories"), {
                userId: user.uid,
                userName: userData?.fullName || user.email?.split('@')[0],
                username: userData?.username || user.email?.split('@')[0],
                userAvatar: userData?.profileImage || null,
                mediaUrl: finalMediaUrl,
                mediaType: fileType,
                textOverlay: textOverlay?.content ? textOverlay : null,
                music: selectedMusic || null,
                location: storyLocation || null,
                audience: audience,
                createdAt: serverTimestamp(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                seenIds: [],
                likedIds: [],
                isVerified: userData?.isVerified || false,
                duration: duration || null
            });

            toast({ title: "Influence Deployed", description: "Your story is now live globally." });
            navigate('/');
        } catch (error: any) {
            toast({ title: "Deployment Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden">
            <Navbar logoOnly />

            <main className="flex-1 flex flex-col items-center pt-24 px-6 md:pt-32">
                <div className="max-w-4xl w-full flex flex-col md:flex-row gap-12">

                    {/* Left Side: Preview Mockup */}
                    <div className="flex-1 flex justify-center md:justify-end">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="w-full max-w-[280px] aspect-[9/16] bg-zinc-900 rounded-[2.5rem] border border-white/10 overflow-hidden relative shadow-2xl"
                        >
                            <div className="absolute inset-0">
                                {fileType === 'image' ? (
                                    <img src={mediaUrl} className="w-full h-full object-cover opacity-60" />
                                ) : (
                                    <video src={mediaUrl} className="w-full h-full object-cover opacity-60" autoPlay loop playsInline />
                                )}
                            </div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FBBF24] mb-2">Manifestation</span>
                                <p className="text-white/40 text-[8px] uppercase tracking-widest leading-loose">
                                    Finalizing sync with the global pulse.
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Side: Options */}
                    <div className="flex-[1.5] space-y-8">
                        <header className="flex items-center justify-between">
                            <h1 className="text-3xl font-display font-bold tracking-tight">Post <span className="text-[#FBBF24]">Identity</span></h1>
                            <button onClick={() => navigate(-1)} className="text-white/40 hover:text-white transition-colors">
                                <ChevronLeft size={24} />
                            </button>
                        </header>

                        <div className="space-y-6">
                            {/* Location Tag */}
                            <div className="bg-white/5 border border-white/5 rounded-[2rem] p-6 focus-within:border-[#FBBF24]/30 transition-all">
                                <div className="flex items-center gap-3 mb-4">
                                    <MapPin className="text-[#FBBF24]" size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Set Coordinates</span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Add location..."
                                    value={storyLocation}
                                    onChange={(e) => setStoryLocation(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none text-xl font-bold placeholder:text-white/10"
                                />
                            </div>

                            {/* Audience Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setAudience("Public")}
                                    className={`p-6 rounded-[2rem] border transition-all flex flex-col items-start gap-4 ${audience === 'Public' ? 'bg-[#FBBF24]/10 border-[#FBBF24]/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                >
                                    <div className={`p-3 rounded-full ${audience === 'Public' ? 'bg-[#FBBF24] text-black' : 'bg-white/5 text-white/40'}`}>
                                        <Globe size={18} />
                                    </div>
                                    <div className="flex flex-col items-start text-left">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Pulse Global</span>
                                        <span className="text-[8px] text-white/30 uppercase mt-1">Everyone can see</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setAudience("Private")}
                                    className={`p-6 rounded-[2rem] border transition-all flex flex-col items-start gap-4 ${audience === 'Private' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                >
                                    <div className={`p-3 rounded-full ${audience === 'Private' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/40'}`}>
                                        <Users size={18} />
                                    </div>
                                    <div className="flex flex-col items-start text-left">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Inner Circle</span>
                                        <span className="text-[8px] text-white/30 uppercase mt-1">Close friends only</span>
                                    </div>
                                </button>
                            </div>

                            {/* Search People to Share */}
                            <div className="bg-white/5 border border-white/5 rounded-[2rem] p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <Send className="text-white/40" size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Direct Pulse</span>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Send to specific identity..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-transparent border-none outline-none text-sm font-bold placeholder:text-white/10 pl-8"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Final Action Button */}
                        <motion.button
                            disabled={isSharing}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleFinalShare}
                            className="w-full bg-[#FBBF24] text-black py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-sm shadow-[0_20px_50px_rgba(251,191,36,0.2)] flex items-center justify-center gap-3 relative overflow-hidden group"
                        >
                            {isSharing ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>Syncing Identity...</span>
                                </>
                            ) : (
                                <>
                                    <Share2 size={20} />
                                    <span>Deploy Story</span>
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                </>
                            )}
                        </motion.button>

                    </div>
                </div>
            </main>

            {/* Ambient Lighting */}
            <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-[#FBBF24]/5 blur-[150px] rounded-full pointer-events-none" />
        </div>
    );
};

export default StoryShare;
