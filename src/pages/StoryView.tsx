import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
    X,
    Heart,
    Send,
    MoreHorizontal,
    Download,
    Eye,
    Trash2,
    ShieldCheck
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import {
    getDoc,
    doc,
    collection,
    query,
    onSnapshot,
    updateDoc,
    arrayUnion,
    arrayRemove,
    deleteDoc,
    limit
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

/**
 * STORY VIEW - "The Carousel"
 * Instagram-style immersive story viewer with side previews and smooth transitions.
 */

const StoryView = () => {
    const { username: paramUsername } = useParams();
    const [searchParams] = useSearchParams();
    const queryUsername = searchParams.get('username');
    const initialUsername = paramUsername || queryUsername;

    const navigate = useNavigate();
    const { toast } = useToast();

    // Global State
    const [user, setUser] = useState<any>(null);
    const [allStoryGroups, setAllStoryGroups] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Viewers Modal State
    const [showViewersModal, setShowViewersModal] = useState(false);
    const [viewersList, setViewersList] = useState<any[]>([]);
    const [viewersLoading, setViewersLoading] = useState(false);

    // Navigation State
    const [currentGroupIndex, setCurrentGroupIndex] = useState<number>(-1);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

    // Player State
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState("");
    const [showInteractionModal, setShowInteractionModal] = useState<"seen" | "likes" | "menu" | null>(null);
    const [realDuration, setRealDuration] = useState<number | null>(null);
    const [previewViewers, setPreviewViewers] = useState<any[]>([]);

    const videoRef = useRef<HTMLVideoElement>(null);
    const progressTimer = useRef<any>(null);
    const STORY_DURATION = 5000;

    // 1. Auth & Data Fetching
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        // Fetch ALL active stories (similar to StoryTray) to build the carousel
        const storiesQuery = query(collection(db, "stories"), limit(100));
        
        const unsubscribeStories = onSnapshot(storiesQuery, (snapshot) => {
            const rawStories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
            const now = Date.now();

            // Group by User
            const grouped = rawStories.reduce((acc: any[], story: any) => {
                const expiry = story.expiresAt?.toDate?.()?.getTime() || story.expiresAt?.seconds * 1000 || 0;
                if (expiry <= now) return acc;

                const existingUser = acc.find(u => u.userId === story.userId);
                if (!existingUser) {
                    acc.push({
                        userId: story.userId,
                        userName: story.userName,
                        username: story.username,
                        userAvatar: story.userAvatar,
                        stories: [story],
                        isVerified: story.isVerified
                    });
                } else {
                    existingUser.stories.push(story);
                }
                return acc;
            }, []);

            // Sort stories within groups chronologically
            grouped.forEach(group => {
                group.stories.sort((a: any, b: any) => {
                    const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
                    const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
                    return timeA - timeB;
                });
            });

            setAllStoryGroups(grouped);
            setIsLoading(false);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeStories();
        };
    }, []);

    // 2. Sync URL with State
    useEffect(() => {
        if (allStoryGroups.length > 0 && initialUsername) {
            const cleanHandle = initialUsername.replace('@', '').toLowerCase();
            const index = allStoryGroups.findIndex(g => g.username?.toLowerCase() === cleanHandle);
            
            if (index !== -1) {
                setCurrentGroupIndex(index);
                setCurrentStoryIndex(0);
                setProgress(0);
            } else if (!isLoading) {
                 // Handle not found
                 // console.warn("User story not found in active stream");
            }
        }
    }, [allStoryGroups, initialUsername, isLoading]);

    // Reset state on story change
    useEffect(() => {
        setRealDuration(null);
        setPreviewViewers([]);
    }, [currentStoryIndex, currentGroupIndex]);

    // 3. Preview Viewers Fetching
    useEffect(() => {
        if (currentGroupIndex === -1 || !user) return;
        
        const currentGroup = allStoryGroups[currentGroupIndex];
        const currentStory = currentGroup?.stories[currentStoryIndex];
        
        if (currentGroup?.userId === user.uid && currentStory?.seenIds?.length > 0) {
            const fetchPreviews = async () => {
                try {
                    const recentIds = currentStory.seenIds.slice(-3).reverse();
                    const previews = await Promise.all(recentIds.map(async (uid: string) => {
                         const snap = await getDoc(doc(db, "users", uid));
                         return snap.exists() ? { id: uid, ...snap.data() } : null;
                    }));
                    setPreviewViewers(previews.filter(p => p !== null));
                } catch (e) {
                    console.error("Error fetching previews", e);
                }
            };
            fetchPreviews();
        } else {
            setPreviewViewers([]);
        }
    }, [currentGroupIndex, currentStoryIndex, allStoryGroups, user]);

    // 4. Progress Timer Logic
    useEffect(() => {
        if (isLoading || currentGroupIndex === -1 || isPaused) return;

        const currentGroup = allStoryGroups[currentGroupIndex];
        if (!currentGroup) return;

        const currentStory = currentGroup.stories[currentStoryIndex];
        
        // Use real video duration if available, otherwise fallback to DB duration or default
        let duration = STORY_DURATION;
        if (currentStory.mediaType === 'video') {
            if (realDuration) {
                duration = realDuration * 1000;
            } else if (currentStory.duration) {
                duration = currentStory.duration * 1000;
            } else {
                duration = 15000;
            }
        }

        const startTime = Date.now() - (progress / 100) * duration;
        const interval = 50;

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
    }, [currentGroupIndex, currentStoryIndex, isLoading, isPaused, user, allStoryGroups, realDuration]);

    // Navigation Handlers
    const handleNext = () => {
        const currentGroup = allStoryGroups[currentGroupIndex];
        if (!currentGroup) return;

        if (currentStoryIndex < currentGroup.stories.length - 1) {
            // Next Story in same group
            setCurrentStoryIndex(prev => prev + 1);
            setProgress(0);
        } else {
            // Next User Group
            if (currentGroupIndex < allStoryGroups.length - 1) {
                const nextGroup = allStoryGroups[currentGroupIndex + 1];
                navigate(`/view?type=story&username=@${nextGroup.username}`);
            } else {
                // End of all stories
                navigate('/');
            }
        }
    };

    const handlePrev = () => {
        if (currentStoryIndex > 0) {
            // Prev Story in same group
            setCurrentStoryIndex(prev => prev - 1);
            setProgress(0);
        } else {
            // Prev User Group
            if (currentGroupIndex > 0) {
                const prevGroup = allStoryGroups[currentGroupIndex - 1];
                navigate(`/view?type=story&username=@${prevGroup.username}`);
            }
        }
    };

    const toggleLike = async () => {
        if (!user || currentGroupIndex === -1) return;
        const currentStory = allStoryGroups[currentGroupIndex].stories[currentStoryIndex];
        const isLiked = currentStory.likedIds?.includes(user.uid);

        await updateDoc(doc(db, "stories", currentStory.id), {
            likedIds: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
        });
    };

    const fetchViewers = async (seenIds: string[]) => {
        if (!seenIds || seenIds.length === 0) {
            setViewersList([]);
            return;
        }
        
        setViewersLoading(true);
        try {
            // Limit to recent 20 for performance
            const recentIds = seenIds.slice(-20).reverse();
            
            const viewers = await Promise.all(recentIds.map(async (uid) => {
                 const snap = await getDoc(doc(db, "users", uid));
                 return snap.exists() ? { id: uid, ...snap.data() } : null;
            }));
            
            setViewersList(viewers.filter(v => v !== null));
        } catch (e) {
            console.error(e);
        } finally {
            setViewersLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!user || currentGroupIndex === -1) return;
        const currentStory = allStoryGroups[currentGroupIndex].stories[currentStoryIndex];
        if (currentStory.userId !== user.uid) return;

        try {
            await deleteDoc(doc(db, "stories", currentStory.id));
            toast({ title: "Story Deleted", description: "Fragment removed." });
            setShowInteractionModal(null);
            if (allStoryGroups[currentGroupIndex].stories.length === 1) {
                 navigate('/'); // Or next user
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    // --- Render Helpers ---

    if (isLoading) return (
        <div className="fixed inset-0 bg-[#050505] flex items-center justify-center">
             <div className="w-8 h-8 border-4 border-[#FBBF24]/20 border-t-[#FBBF24] rounded-full animate-spin" />
        </div>
    );

    if (currentGroupIndex === -1 && !isLoading) return (
         <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center font-sans">
             <div className="relative w-full max-w-[450px] aspect-[9/16] bg-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <div className="w-12 h-1 bg-white/20 rounded-full rotate-45 absolute" />
                    <div className="w-12 h-1 bg-white/20 rounded-full -rotate-45 absolute" />
                </div>
                <h1 className="text-xl font-black text-white uppercase tracking-[0.2em] mb-2">Void Identity</h1>
                <p className="text-white/40 text-sm max-w-xs mb-8">This frequency has no active pulse fragments.</p>
                <button onClick={() => navigate('/')} className="bg-white text-black px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform">
                    Return to Dashboard
                </button>
             </div>
        </div>
    );

    const activeGroup = allStoryGroups[currentGroupIndex];
    const activeStory = activeGroup.stories[currentStoryIndex];
    const isOwner = user?.uid === activeGroup.userId;

    const prevGroup = currentGroupIndex > 0 ? allStoryGroups[currentGroupIndex - 1] : null;
    const nextGroup = currentGroupIndex < allStoryGroups.length - 1 ? allStoryGroups[currentGroupIndex + 1] : null;

    return (
        <div className="fixed inset-0 bg-[#1a1a1a] z-[2000] flex items-center justify-center overflow-hidden font-sans">
            {/* Close Button */}
            <button 
                onClick={() => navigate('/')} 
                className="absolute top-6 right-6 z-[2010] text-white/60 hover:text-white transition-colors"
            >
                <X size={32} />
            </button>

            <div className="relative w-full h-full max-w-7xl flex items-center justify-center gap-4 md:gap-12 px-4">
                
                {/* PREVIOUS STORY PREVIEW (Left) */}
                <div className="hidden md:flex flex-col items-center justify-center w-[200px] h-[350px] opacity-40 scale-90 blur-[1px] transition-all duration-500 cursor-pointer hover:opacity-60 hover:scale-95 hover:blur-0"
                     onClick={() => prevGroup && navigate(`/view?type=story&username=@${prevGroup.username}`)}>
                    {prevGroup && (
                        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/10">
                            <img src={prevGroup.stories[0].mediaUrl} className="w-full h-full object-cover opacity-50" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                <div className="w-12 h-12 rounded-full p-[2px] border border-[#FBBF24]">
                                    <img src={prevGroup.userAvatar} className="w-full h-full rounded-full object-cover" />
                                </div>
                                <span className="font-bold text-white text-xs">{prevGroup.userName}</span>
                                <span className="text-[10px] text-white/50">{prevGroup.stories.length}h</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ACTIVE STORY CARD (Center) */}
                <div className="relative w-full md:w-[420px] aspect-[9/16] md:aspect-[9/16] h-full md:h-auto max-h-[85vh] bg-black md:rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border-0 md:border border-white/10 ring-1 ring-white/5">
                     
                     {/* Progress Bars */}
                    <div className="absolute top-4 left-4 right-4 z-50 flex gap-1.5 px-1">
                        {activeGroup.stories.map((story: any, idx: number) => (
                            <div key={story.id} className="h-0.5 flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                                <div
                                    className="h-full bg-white shadow-[0_0_10px_white] transition-all duration-50 ease-linear"
                                    style={{
                                        width: idx === currentStoryIndex ? `${progress}%` : idx < currentStoryIndex ? '100%' : '0%'
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Header */}
                    <div className="absolute top-8 left-6 right-6 z-50 flex items-center justify-between">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/@${activeGroup.username}`)}>
                            <div className="w-9 h-9 rounded-full border border-white/10 p-[1.5px] bg-black/20 backdrop-blur-md">
                                <img src={activeGroup.userAvatar || "https://github.com/shadcn.png"} className="w-full h-full rounded-full object-cover" />
                            </div>
                            <div className="flex flex-col drop-shadow-md">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[13px] font-bold text-white tracking-wide">{activeGroup.userName}</span>
                                    {activeGroup.isVerified && <ShieldCheck size={12} className="text-[#FBBF24]" />}
                                    <span className="text-white/40 text-[10px] font-medium">• 2h</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="text-white/80 hover:text-white transition-colors drop-shadow-md">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Navigation Areas (Invisible) */}
                    <div className="absolute inset-x-0 inset-y-20 z-40 flex">
                        <div className="flex-1 cursor-pointer" onClick={handlePrev} />
                        <div className="flex-1 cursor-pointer" onClick={handleNext} />
                    </div>

                    {/* Media Display */}
                    <div className="absolute inset-0 bg-zinc-900">
                        {activeStory.mediaType === 'image' ? (
                            <img src={activeStory.mediaUrl} className="w-full h-full object-cover" />
                        ) : (
                            <video
                                ref={videoRef}
                                src={activeStory.mediaUrl}
                                className="w-full h-full object-cover"
                                autoPlay
                                playsInline
                                onPlay={() => setIsPaused(false)}
                                onPause={() => setIsPaused(true)}
                                onLoadedMetadata={(e) => setRealDuration(e.currentTarget.duration)}
                            />
                        )}

                         {/* Text Overlay */}
                         {activeStory.textOverlay && (
                            <div className="absolute inset-0 pointer-events-none z-[45] overflow-hidden">
                                <p
                                    style={{
                                        fontSize: `${activeStory.textOverlay.size || 24}px`,
                                        fontWeight: activeStory.textOverlay.weight || '700',
                                        fontFamily: activeStory.textOverlay.fontFamily === 'serif' ? 'serif' : activeStory.textOverlay.fontFamily === 'mono' ? 'monospace' : 'inherit',
                                        position: 'absolute',
                                        left: `${(activeStory.textOverlay.x !== undefined ? activeStory.textOverlay.x : 0.5) * 100}%`,
                                        top: `${(activeStory.textOverlay.y !== undefined ? activeStory.textOverlay.y : 0.5) * 100}%`,
                                        transform: 'translate(-50%, -50%)',
                                        width: 'max-content',
                                        maxWidth: '100%'
                                    }}
                                    className={`text-white text-center leading-tight drop-shadow-2xl
                                        ${activeStory.textOverlay.style === 'classic' ? 'bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20' : ''}
                                        ${activeStory.textOverlay.style === 'neon' ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' : ''}
                                        ${activeStory.textOverlay.style === 'strong' ? 'bg-[#FBBF24] text-black px-4 py-2 rounded-lg italic' : ''}
                                        ${activeStory.textOverlay.style === 'typewriter' ? 'bg-white text-black px-4 py-1 border-l-4 border-black font-mono' : ''}
                                    `}
                                >
                                    {(() => {
                                        const overlay = activeStory.textOverlay;
                                        if (!overlay) return null;
                                        if (typeof overlay === 'string') return overlay;
                                        if (typeof overlay.content === 'string') return overlay.content;
                                        if (typeof overlay.content === 'object' && overlay.content?.content) return overlay.content.content;
                                        return "";
                                    })()}
                                </p>
                            </div>
                        )}
                        
                        {/* Gradient Protection */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
                    </div>

                    {/* Bottom Interaction Bar */}
                    <div className="absolute bottom-0 left-0 right-0 z-50 p-4 pb-6 bg-gradient-to-t from-black via-black/60 to-transparent">
                        {isOwner ? (
                             <button 
                                onClick={() => {
                                    setIsPaused(true);
                                    setShowViewersModal(true);
                                    fetchViewers(activeStory.seenIds || []);
                                }}
                                className="w-full flex items-center justify-between px-4 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/15 transition-all"
                             >
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-3 overflow-hidden pl-1">
                                        {previewViewers.length > 0 ? (
                                            previewViewers.map((viewer) => (
                                                <div key={viewer.id} className="w-8 h-8 rounded-full border-2 border-black bg-zinc-800 overflow-hidden z-[1]">
                                                    <img src={viewer.profileImage || `https://i.pravatar.cc/150?u=${viewer.id}`} className="w-full h-full object-cover" />
                                                </div>
                                            ))
                                        ) : (
                                             <div className="w-8 h-8 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center">
                                                <Eye size={14} className="text-white/40"/>
                                             </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="text-sm font-bold text-white">{activeStory.seenIds?.length || 0} Viewers</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-red-500">
                                        <Trash2 size={18} />
                                    </div>
                                </div>
                             </button>
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-11 bg-transparent border border-white/20 rounded-full px-5 flex items-center hover:border-white/40 transition-colors cursor-text group">
                                    <input
                                        type="text"
                                        placeholder={`Reply to ${activeGroup.userName}...`}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full bg-transparent border-none outline-none text-sm text-white placeholder:text-white/60"
                                    />
                                </div>
                                <button
                                    onClick={toggleLike}
                                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${activeStory.likedIds?.includes(user?.uid) ? 'text-red-500 scale-110' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                                >
                                    <Heart size={24} fill={activeStory.likedIds?.includes(user?.uid) ? "currentColor" : "none"} />
                                </button>
                                <button className="w-11 h-11 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-all">
                                    <Send size={22} className="-rotate-45 mb-1 ml-1" />
                                </button>
                            </div>
                        )}
                    </div>

                </div>

                {/* NEXT STORY PREVIEW (Right) */}
                <div className="hidden md:flex flex-col items-center justify-center w-[200px] h-[350px] opacity-40 scale-90 blur-[1px] transition-all duration-500 cursor-pointer hover:opacity-60 hover:scale-95 hover:blur-0"
                     onClick={() => nextGroup && navigate(`/view?type=story&username=@${nextGroup.username}`)}>
                    {nextGroup && (
                        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/10">
                            <img src={nextGroup.stories[0].mediaUrl} className="w-full h-full object-cover opacity-50" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                <div className="w-12 h-12 rounded-full p-[2px] border border-[#FBBF24]">
                                    <img src={nextGroup.userAvatar} className="w-full h-full rounded-full object-cover" />
                                </div>
                                <span className="font-bold text-white text-xs">{nextGroup.userName}</span>
                                <span className="text-[10px] text-white/50">{nextGroup.stories.length}h</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Viewers Modal Overlay */}
                <AnimatePresence>
                    {showViewersModal && (
                        <div className="absolute inset-0 z-[2050] flex items-end md:items-center justify-center md:bg-black/50 md:backdrop-blur-sm">
                            {/* Dismiss Area */}
                            <div className="absolute inset-0" onClick={() => { setShowViewersModal(false); setIsPaused(false); }} />
                            
                            <motion.div 
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="relative w-full md:w-[420px] h-[70vh] md:h-[600px] bg-[#1a1a1a] md:rounded-3xl rounded-t-3xl border-t md:border border-white/10 shadow-2xl flex flex-col overflow-hidden"
                            >
                                {/* Handle for mobile */}
                                <div className="w-full flex justify-center pt-3 pb-2 md:hidden">
                                    <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                                </div>

                                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-white">Story Views</h3>
                                    <span className="text-xs font-bold text-white/40 bg-white/5 px-2 py-1 rounded-md">{viewersList.length}</span>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {viewersLoading ? (
                                        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
                                    ) : viewersList.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-40 text-white/30">
                                            <Eye size={32} className="mb-2 opacity-50" />
                                            <p className="text-sm">No views yet</p>
                                        </div>
                                    ) : (
                                        viewersList.map((viewer) => (
                                            <div key={viewer.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer" onClick={() => navigate(`/@${viewer.username}`)}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-white/10">
                                                        <img src={viewer.profileImage || `https://i.pravatar.cc/150?u=${viewer.id}`} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-white">{viewer.username}</span>
                                                        <span className="text-xs text-white/40">{viewer.fullName}</span>
                                                    </div>
                                                </div>
                                                {/* Could add action buttons here */}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};

export default StoryView;