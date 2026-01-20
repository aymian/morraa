import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
    X,
    Heart,
    MessageCircle,
    Send,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    Download,
    Eye,
    Trash2,
    Music2,
    MapPin,
    ShieldCheck
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    onSnapshot,
    updateDoc,
    arrayUnion,
    arrayRemove,
    deleteDoc,
    orderBy,
    getDocs
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

const StoryView = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [user, setUser] = useState<any>(null);
    const [stories, setStories] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState("");
    const [showInteractionModal, setShowInteractionModal] = useState<"seen" | "likes" | "menu" | null>(null);
    const [targetUser, setTargetUser] = useState<any>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const progressTimer = useRef<any>(null);
    const STORY_DURATION = 5000; // 5 seconds for images

    useEffect(() => {
        let unsubStories: (() => void) | null = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) navigate('/login');
        });

        const fetchIdentityAndStories = async () => {
            if (!username) {
                setIsLoading(false);
                return;
            }
            try {
                const rawHandle = username?.startsWith('@') ? username.slice(1) : username;
                const cleanUsername = rawHandle?.toLowerCase();
                console.log("Resolving Pulse Identity for:", cleanUsername);

                const usersRef = collection(db, "users");
                const userQuery = query(usersRef, where("username", "==", cleanUsername));
                const userSnap = await getDocs(userQuery);

                if (userSnap.empty) {
                    console.warn("Void Identity: User not found");
                    setIsLoading(false);
                    return;
                }

                const userDoc = userSnap.docs[0];
                const targetUid = userDoc.id;
                const targetData = userDoc.data();
                setTargetUser({ uid: targetUid, ...targetData });

                // 2. Stream stories for this user ID
                // To avoid composite index requirements, we query by UID only 
                // and handle the expiration filtering and sorting in-memory.
                console.log("Fetching fragments for UID:", targetUid);
                const storiesQ = query(
                    collection(db, "stories"),
                    where("userId", "==", targetUid)
                );

                unsubStories = onSnapshot(storiesQ,
                    (snapshot) => {
                        const now = Date.now();
                        const fetchedStories = snapshot.docs
                            .map(doc => ({ id: doc.id, ...doc.data() }))
                            // Filter for non-expired pulses in-memory
                            .filter((story: any) => {
                                const expiry = story.expiresAt?.toDate?.()?.getTime() || story.expiresAt?.seconds * 1000 || 0;
                                return expiry > now;
                            })
                            // Sort chronologically in-memory
                            .sort((a: any, b: any) => {
                                const timeA = a.createdAt?.toDate?.()?.getTime() || a.createdAt?.seconds * 1000 || 0;
                                const timeB = b.createdAt?.toDate?.()?.getTime() || b.createdAt?.seconds * 1000 || 0;
                                return timeA - timeB;
                            });

                        console.log(`Pulse Fragments found: ${fetchedStories.length}`);
                        setStories(fetchedStories);
                        setIsLoading(false);
                    },
                    (err) => {
                        console.error("Pulse Sync Error:", err);
                        toast({
                            title: "Pulse Sync Failed",
                            description: "The stream was interrupted by a frequency error.",
                            variant: "destructive"
                        });
                        setIsLoading(false);
                    }
                );
            } catch (error) {
                console.error("Fatal Resolution Error:", error);
                setIsLoading(false);
            }
        };

        fetchIdentityAndStories();

        return () => {
            unsubscribeAuth();
            if (unsubStories) unsubStories();
        };
    }, [username, navigate]);

    // Handle Progress & Auto-Advance
    useEffect(() => {
        if (isLoading || stories.length === 0 || isPaused) return;

        const currentStory = stories[currentIndex];
        const duration = currentStory.mediaType === 'video' ? 15000 : STORY_DURATION;

        const startTime = Date.now();
        const interval = 50; // Update every 50ms

        progressTimer.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min((elapsed / duration) * 100, 100);
            setProgress(newProgress);

            if (newProgress >= 100) {
                handleNext();
            }
        }, interval);

        // Mark as seen
        if (user && !currentStory.seenIds?.includes(user.uid)) {
            updateDoc(doc(db, "stories", currentStory.id), {
                seenIds: arrayUnion(user.uid)
            });
        }

        return () => clearInterval(progressTimer.current);
    }, [currentIndex, stories, isLoading, isPaused, user]);

    const handleNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setProgress(0);
        } else {
            navigate('/');
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setProgress(0);
        }
    };

    const toggleLike = async () => {
        if (!user || stories.length === 0) return;
        const currentStory = stories[currentIndex];
        const isLiked = currentStory.likedIds?.includes(user.uid);

        await updateDoc(doc(db, "stories", currentStory.id), {
            likedIds: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
        });
    };

    const handleDelete = async () => {
        if (!user || stories.length === 0) return;
        const currentStory = stories[currentIndex];
        if (currentStory.userId !== user.uid) return;

        try {
            await deleteDoc(doc(db, "stories", currentStory.id));
            toast({ title: "Story Purged", description: "Identity fragment deleted." });
            if (stories.length === 1) navigate('/');
            setShowInteractionModal(null);
        } catch (error: any) {
            toast({ title: "Purge Failed", description: error.message, variant: "destructive" });
        }
    };

    const handleDownload = () => {
        const currentStory = stories[currentIndex];
        if (!currentStory?.mediaUrl) return;
        const link = document.createElement('a');
        link.href = currentStory.mediaUrl;
        link.download = `morraa-story-${currentStory.id}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#FBBF24]/20 border-t-[#FBBF24] rounded-full animate-spin" />
        </div>
    );

    if (stories.length === 0) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-8">
            <h1 className="text-2xl font-black text-white/20 uppercase tracking-[0.5em] mb-4">Void Detected</h1>
            <p className="text-white/40 text-sm max-w-xs">This identity has no active pulse fragments in the current timeline.</p>
            <button onClick={() => navigate('/')} className="mt-8 text-[#FBBF24] font-bold uppercase tracking-widest text-xs">Return to Dashboard</button>
        </div>
    );

    const currentStory = stories[currentIndex];
    const isOwner = user?.uid === targetUser?.uid;

    return (
        <div className="fixed inset-0 bg-[#050505] z-[2000] flex items-center justify-center overflow-hidden font-sans">
            <div className="relative w-full max-w-[450px] aspect-[9/16] bg-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5">

                {/* Progress Bars */}
                <div className="absolute top-4 left-4 right-4 z-50 flex gap-1.5 px-2">
                    {stories.map((story, idx) => (
                        <div key={story.id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-50 ease-linear"
                                style={{
                                    width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="absolute top-8 left-6 right-6 z-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border border-white/10 p-[1px] bg-white/10">
                            <div className="w-full h-full rounded-full bg-black overflow-hidden relative">
                                {targetUser?.profileImage ? (
                                    <img src={targetUser.profileImage} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-sm font-bold bg-zinc-800 text-white/40">{targetUser?.fullName?.[0] || '?'}</div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[13px] font-black text-white tracking-tight leading-none">{targetUser?.fullName}</span>
                                {targetUser?.isVerified && <ShieldCheck size={12} className="text-[#FBBF24]" />}
                            </div>
                            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">@{targetUser?.username}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/')} className="text-white/60 hover:text-white transition-colors bg-black/20 backdrop-blur-md p-2 rounded-full">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Navigation Areas */}
                <div className="absolute inset-x-0 inset-y-20 z-40 flex">
                    <div className="flex-1 cursor-pointer" onClick={handlePrev} />
                    <div className="flex-1 cursor-pointer" onClick={handleNext} />
                </div>

                {/* Media Content */}
                <div className="absolute inset-0">
                    {currentStory.mediaType === 'image' ? (
                        <img src={currentStory.mediaUrl} className="w-full h-full object-cover" />
                    ) : (
                        <video
                            ref={videoRef}
                            src={currentStory.mediaUrl}
                            className="w-full h-full object-cover"
                            autoPlay
                            playsInline
                            onPlay={() => setIsPaused(false)}
                            onPause={() => setIsPaused(true)}
                        />
                    )}

                    {/* Text Overlay */}
                    {currentStory.textOverlay && (
                        <div className="absolute inset-0 flex items-center justify-center p-12 pointer-events-none">
                            <p
                                style={{
                                    fontSize: `${currentStory.textOverlay.size || 24}px`,
                                    fontWeight: currentStory.textOverlay.weight || '700',
                                    fontFamily: currentStory.textOverlay.fontFamily === 'serif' ? 'serif' : currentStory.textOverlay.fontFamily === 'mono' ? 'monospace' : 'inherit'
                                }}
                                className={`text-white text-center leading-tight drop-shadow-2xl
                                    ${currentStory.textOverlay.style === 'classic' ? 'bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20' : ''}
                                    ${currentStory.textOverlay.style === 'neon' ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' : ''}
                                    ${currentStory.textOverlay.style === 'strong' ? 'bg-[#FBBF24] text-black px-4 py-2 rounded-lg italic' : ''}
                                    ${currentStory.textOverlay.style === 'typewriter' ? 'bg-white text-black px-4 py-1 border-l-4 border-black font-mono' : ''}
                                `}
                            >
                                {typeof currentStory.textOverlay === 'object'
                                    ? currentStory.textOverlay.content
                                    : currentStory.textOverlay}
                            </p>
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
                </div>

                {/* Bottom Interaction Bar */}
                <div className="absolute bottom-6 left-6 right-6 z-50">
                    {isOwner ? (
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => setShowInteractionModal("seen")}
                                    className="flex flex-col items-center gap-1 group"
                                >
                                    <div className="p-2 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors">
                                        <Eye size={20} className="text-white/60" />
                                    </div>
                                    <span className="text-[10px] font-bold text-white/40">{currentStory.seenIds?.length || 0}</span>
                                </button>
                                <button
                                    onClick={() => setShowInteractionModal("likes")}
                                    className="flex flex-col items-center gap-1 group"
                                >
                                    <div className="p-2 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors">
                                        <Heart size={20} className="text-white/60" />
                                    </div>
                                    <span className="text-[10px] font-bold text-white/40">{currentStory.likedIds?.length || 0}</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowInteractionModal("menu")}
                                    className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5"
                                >
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full px-5 py-3 flex items-center">
                                <input
                                    type="text"
                                    placeholder="Send message..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none text-xs text-white placeholder:text-white/20"
                                />
                                <button className="text-[#FBBF24] ml-2"><Send size={16} /></button>
                            </div>
                            <button
                                onClick={toggleLike}
                                className={`p-3 rounded-full transition-all border ${currentStory.likedIds?.includes(user?.uid) ? 'bg-[#FBBF24] border-[#FBBF24] text-black' : 'bg-black/40 border-white/10 text-white/60'}`}
                            >
                                <Heart size={20} fill={currentStory.likedIds?.includes(user?.uid) ? "currentColor" : "none"} />
                            </button>
                            <button onClick={handleDownload} className="p-3 bg-black/40 border border-white/10 rounded-full text-white/60 hover:text-white transition-all">
                                <Download size={20} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Interaction Modals */}
                <AnimatePresence>
                    {showInteractionModal && (
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-2xl p-8 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#FBBF24]">
                                    {showInteractionModal === 'seen' ? 'Pulse Analytics' : showInteractionModal === 'likes' ? 'Identity Affection' : 'Command Center'}
                                </h3>
                                <button onClick={() => setShowInteractionModal(null)}><X size={20} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                                {showInteractionModal === 'menu' ? (
                                    <div className="space-y-4">
                                        <button
                                            onClick={handleDelete}
                                            className="w-full flex items-center gap-4 p-5 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all"
                                        >
                                            <Trash2 size={20} />
                                            <span className="font-bold text-sm">Purge Story Fragment</span>
                                        </button>
                                        <button
                                            onClick={handleDownload}
                                            className="w-full flex items-center gap-4 p-5 rounded-3xl bg-white/5 border border-white/5 items-center justify-center font-bold text-sm"
                                        >
                                            <Download size={20} />
                                            <span>Archive Local Copy</span>
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-white/20 text-center py-12 text-sm font-medium">Analytics engine processing identities...</p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Ambient Background Blur */}
            <div className="absolute inset-0 -z-10 bg-black">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FBBF24]/5 blur-[200px] rounded-full" />
            </div>
        </div>
    );
};

export default StoryView;
